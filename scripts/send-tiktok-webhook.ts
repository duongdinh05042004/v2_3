import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

const appSecret = process.env.TIKTOK_APP_SECRET ?? 'tiktok_app_secret_change_me';
const target = process.env.WEBHOOK_URL ?? 'http://localhost:3000/webhooks/tiktok/leads';
const payloadPath =
  process.argv[2] ?? join(__dirname, '..', 'mocks', 'sample-payloads', 'lead.generate.json');

const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as Record<string, unknown>;
payload.event_id = process.env.EVENT_ID ?? `evt_${Date.now()}`;
payload.timestamp = Math.floor(Date.now() / 1000);

const rawBody = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1000);
const signature = `t=${timestamp},s=${createHmac('sha256', appSecret).update(`${timestamp}.${rawBody}`).digest('hex')}`;

async function main(): Promise<void> {
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TikTok-Signature': signature,
    },
    body: rawBody,
  });
  const text = await response.text();
  // eslint-disable-next-line no-console
  console.log(response.status, text);
}

void main();
