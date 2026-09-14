import { createServer, IncomingMessage, ServerResponse } from 'http';

const events: unknown[] = [];
const port = parseInt(process.env.TIKTOK_MOCK_PORT ?? '4001', 10);

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

createServer(async (req, res) => {
  const url = req.url ?? '/';
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  if (url.startsWith('/open_api/v1.3/event/track')) {
    const body = await readBody(req);
    events.push({ at: new Date().toISOString(), body });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 0, message: 'OK', request_id: `mock-${Date.now()}` }));
    return;
  }
  if (url === '/_debug/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(events));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
}).listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`TikTok Events mock listening on :${port}`);
});
