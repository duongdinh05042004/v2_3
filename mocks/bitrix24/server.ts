import { createServer, IncomingMessage, ServerResponse } from 'http';

type Lead = Record<string, unknown> & { ID: number };
type Deal = Record<string, unknown> & { ID: number };

const leads = new Map<number, Lead>();
const deals = new Map<number, Deal>();
const comments: Array<Record<string, unknown>> = [];
const callLog: Array<{ method: string; body: unknown; at: string }> = [];
let leadSeq = 1000;
let dealSeq = 2000;
let commentSeq = 3000;

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const port = parseInt(process.env.BITRIX24_MOCK_PORT ?? '4002', 10);

createServer(async (req, res) => {
  const url = req.url ?? '/';
  if (req.method === 'GET' && url === '/health') {
    json(res, 200, { status: 'ok', leads: leads.size, deals: deals.size });
    return;
  }
  if (req.method === 'GET' && url === '/_debug/calls') {
    json(res, 200, callLog);
    return;
  }
  if (req.method === 'GET' && url === '/_debug/state') {
    json(res, 200, { leads: [...leads.values()], deals: [...deals.values()], comments });
    return;
  }

  const method = url.replace(/^\/rest\/?/, '').replace(/\/$/, '');
  const body = await readBody(req);
  callLog.push({ method, body, at: new Date().toISOString() });

  if (method === 'crm.lead.add') {
    const id = ++leadSeq;
    const fields = (body.fields as Record<string, unknown>) ?? {};
    leads.set(id, { ID: id, ...fields });
    json(res, 200, { result: id });
    return;
  }
  if (method === 'crm.lead.update') {
    const id = Number(body.id);
    const current = leads.get(id);
    if (!current) {
      json(res, 200, { error: 'NOT_FOUND', error_description: 'Lead not found' });
      return;
    }
    leads.set(id, { ...current, ...(body.fields as Record<string, unknown>) });
    json(res, 200, { result: true });
    return;
  }
  if (method === 'crm.lead.get') {
    const id = Number(body.id);
    const current = leads.get(id);
    json(res, 200, current ? { result: current } : { error: 'NOT_FOUND' });
    return;
  }
  if (method === 'crm.deal.add') {
    const id = ++dealSeq;
    const fields = (body.fields as Record<string, unknown>) ?? {};
    deals.set(id, { ID: id, ...fields });
    json(res, 200, { result: id });
    return;
  }
  if (method === 'crm.deal.update') {
    const id = Number(body.id);
    const current = deals.get(id);
    if (!current) {
      json(res, 200, { error: 'NOT_FOUND', error_description: 'Deal not found' });
      return;
    }
    deals.set(id, { ...current, ...(body.fields as Record<string, unknown>) });
    json(res, 200, { result: true });
    return;
  }
  if (method === 'crm.timeline.comment.add') {
    const id = ++commentSeq;
    comments.push({ ID: id, ...(body.fields as Record<string, unknown>) });
    json(res, 200, { result: id });
    return;
  }

  json(res, 404, { error: 'UNKNOWN_METHOD', error_description: method });
}).listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Bitrix24 mock listening on :${port}`);
});
