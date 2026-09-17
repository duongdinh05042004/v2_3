/**
 * Portable local infra bootstrap for any OS after clone/pull.
 *
 * - Skips when DB/Redis hosts are not localhost (e.g. Docker Compose API service).
 * - Prefers `docker compose up -d postgres redis` using ports from .env / .env.example.
 * - Falls back to redis-memory-server if Docker Redis is unavailable.
 * - Never depends on machine-specific installs (no hardcoded pg_ctl / Redis paths).
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const root = path.join(__dirname, '..');

try {
  require('dotenv').config({ path: path.join(root, '.env') });
} catch {
  // dotenv may be missing before npm install; ignore
}

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

function isLocalHost(host) {
  return !host || host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function canConnect(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(port, host, label, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    if (await canConnect(port, host)) {
      // eslint-disable-next-line no-console
      console.log(`[infra] ${label} ready on ${host}:${port}`);
      return true;
    }
    await sleep(500);
  }
  return false;
}

function hasDocker() {
  const result = spawnSync('docker', ['compose', 'version'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return result.status === 0;
}

function dockerComposeUp(services) {
  // eslint-disable-next-line no-console
  console.log(`[infra] starting via Docker: ${services.join(', ')}`);
  const result = spawnSync('docker', ['compose', 'up', '-d', ...services], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  return result.status === 0;
}

function startMemoryRedis(port) {
  // eslint-disable-next-line no-console
  console.log(`[infra] starting redis-memory-server on ${port}`);
  const child = spawn(process.execPath, [path.join(__dirname, 'start-memory-redis.js')], {
    detached: true,
    stdio: 'ignore',
    cwd: root,
    env: { ...process.env, REDIS_PORT: String(port) },
  });
  child.unref();
}

async function ensureRedis() {
  if (!isLocalHost(redisHost)) {
    // eslint-disable-next-line no-console
    console.log(`[infra] REDIS_HOST=${redisHost} — skip local Redis bootstrap`);
    return;
  }
  if (await canConnect(redisPort, redisHost)) {
    // eslint-disable-next-line no-console
    console.log(`[infra] Redis already up on ${redisHost}:${redisPort}`);
    return;
  }

  if (hasDocker() && dockerComposeUp(['redis'])) {
    if (await waitFor(redisPort, '127.0.0.1', 'Redis (Docker)')) {
      return;
    }
  }

  startMemoryRedis(redisPort);
  if (await waitFor(redisPort, '127.0.0.1', 'Redis (memory)')) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error(
    `[infra] Redis is not reachable on ${redisHost}:${redisPort}.\n` +
      '  Fix: install Docker Desktop, then run: npm run infra:up\n' +
      '  Or start Redis 7 manually and set REDIS_HOST / REDIS_PORT in .env',
  );
  process.exit(1);
}

async function ensurePostgres() {
  if (!isLocalHost(dbHost)) {
    // eslint-disable-next-line no-console
    console.log(`[infra] DB_HOST=${dbHost} — skip local Postgres bootstrap`);
    return;
  }
  if (await canConnect(dbPort, dbHost)) {
    // eslint-disable-next-line no-console
    console.log(`[infra] Postgres already up on ${dbHost}:${dbPort}`);
    return;
  }

  if (hasDocker() && dockerComposeUp(['postgres'])) {
    if (await waitFor(dbPort, '127.0.0.1', 'Postgres (Docker)')) {
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error(
    `[infra] Postgres is not reachable on ${dbHost}:${dbPort}.\n` +
      '  Recommended (works on any machine with Docker):\n' +
      '    npm run infra:up\n' +
      '  Or full stack:\n' +
      '    cp .env.example .env && docker compose up --build\n' +
      '  Or install PostgreSQL 16+ locally and match DB_* in .env',
  );
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(path.join(root, '.env'))) {
    // eslint-disable-next-line no-console
    console.warn('[infra] .env missing — copy .env.example to .env first (npm run setup)');
  }
  await ensureRedis();
  await ensurePostgres();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
