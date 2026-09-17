const { RedisMemoryServer } = require('redis-memory-server');

async function main() {
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const server = new RedisMemoryServer({
    instance: { port, ip: '127.0.0.1' },
    autoStart: false,
  });
  await server.start();
  const actualPort = await server.getPort();
  process.stdout.write(`memory-redis ready on ${actualPort}\n`);
  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
