const { spawn, spawnSync } = require('child_process');
const net = require('net');
const path = require('path');

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function main() {
  if (!(await canConnect(6380))) {
    const child = spawn(process.execPath, [path.join(__dirname, 'start-memory-redis.js')], {
      detached: true,
      stdio: 'ignore',
      cwd: path.join(__dirname, '..'),
    });
    child.unref();
    for (let i = 0; i < 20; i += 1) {
      if (await canConnect(6380)) {
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (!(await canConnect(5433))) {
    const pgCtl = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe';
    const data = path.join(__dirname, '..', '.data', 'pg');
    spawnSync(pgCtl, ['-D', data, '-l', path.join(__dirname, '..', '.data', 'pg.log'), 'start'], {
      stdio: 'ignore',
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
