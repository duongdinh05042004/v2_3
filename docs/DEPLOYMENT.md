# Deployment guide

## Local (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

Services:

| Service | URL |
| --- | --- |
| API + Swagger | http://localhost:3000/docs |
| Health | http://localhost:3000/health |
| Bitrix24 mock | http://localhost:4002/health |
| TikTok Events mock | http://localhost:4001/health |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Seed after first boot:

```bash
docker compose exec api npm run seed
```

Send a signed sample webhook:

```bash
docker compose exec api npm run mock:tiktok
```

## Production Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Then:

```bash
docker compose -f docker-compose.prod.yml exec api node dist/src/database/seeds/run-seed.js
```

## Environment checklist

- Rotate `API_KEY`, `TIKTOK_APP_SECRET`, `BITRIX24_WEBHOOK_SECRET`.
- Set `DB_SYNC=false` and rely on migrations (`migrationsRun` is enabled).
- Point `BITRIX24_WEBHOOK_URL` at a real inbound webhook (`https://xxx.bitrix24.com/rest/1/xxxxx`).
- Point `TIKTOK_API_BASE_URL` at `https://business-api.tiktok.com`.
- Configure `NOTIFY_WEBHOOK_URL` (Slack / Teams incoming webhook) for alerts.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `401 Invalid TikTok signature` | App secret mismatch, or body was re-serialized. The API uses `rawBody`. |
| Webhook accepted but no lead | Inspect BullMQ: Redis connectivity, `dead_letter_jobs`. |
| Bitrix24 sync failed | `GET /api/v1/leads/:id` → `bitrix24SyncError`. Mock logs: `GET http://localhost:4002/_debug/calls`. |
| Health redis down | Redis not reachable from the API container (`REDIS_HOST=redis` in Compose). |
| Duplicate leads | Dedup uses normalized email **or** phone. Confirm both incoming values are valid. |

## Reverse proxy

Terminate TLS at Nginx / Caddy and forward:

- `POST /webhooks/tiktok/leads` — do **not** mutate the body.
- `POST /webhooks/bitrix24/deals`
- `/api/v1/*` and `/docs` (restrict `/docs` by IP in production).
