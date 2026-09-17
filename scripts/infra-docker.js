#!/usr/bin/env node
/**
 * Cross-platform wrapper: docker compose up/down for postgres + redis.
 * Usage: node scripts/infra-docker.js up|down
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const action = process.argv[2] || 'up';

const args =
  action === 'down'
    ? ['compose', 'down']
    : ['compose', 'up', '-d', 'postgres', 'redis'];

const result = spawnSync('docker', args, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  // eslint-disable-next-line no-console
  console.error(
    'Docker Compose failed. Install Docker Desktop (Windows/macOS) or Docker Engine (Linux),\n' +
      'then retry: npm run infra:up',
  );
  process.exit(result.status || 1);
}
