# Deployment guide

## Prerequisites (any machine)

- **Docker** (Desktop or Engine) — required for the recommended path
- **Node.js 22+** — only if you run the API on the host (path B)
- Git

Do **not** rely on machine-specific installs (local `pg_ctl` under `C:\Program Files\...`, etc.). Infra is started via Docker Compose.

## After clone / pull

```bash
git clone <repo-url>
cd v2_3
npm run setup          # creates .env from .env.example if missing
```

## Path A — Full Docker stack (recommended)

```bash
cp .env.example .env   # if you skipped npm run setup
docker compose up --build
docker compose exec api npm run seed
docker compose exec api npm run mock:tiktok
```

Services:

| Service | URL |
| --- | --- |
| API + Swagger | http://localhost:3000/docs?api_key=change-me-to-a-strong-random-key |
| Health | http://localhost:3000/health |
| Bitrix24 mock | http://localhost:4002/health |
| TikTok Events mock | http://localhost:4001/health |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Inside the API container, `DB_HOST=postgres` and `REDIS_HOST=redis` are injected by Compose. `npm run start:docker` is used (not `start:dev`) so host-only infra bootstrap is skipped.

## Path B — Host API + Docker Postgres/Redis

```bash
npm install
npm run infra:up       # docker compose up -d postgres redis
npm run migration:run
npm run seed
npm run start:dev      # calls ensure-infra first
npm run mock:bitrix
npm run mock:tiktok
```

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run setup` | Create `.env` from `.env.example` |
| `npm run infra:up` | Start Postgres + Redis via Docker |
| `npm run infra:down` | Stop Compose services |
| `npm run infra:ensure` | Auto-start missing local Redis/Postgres (Docker first) |
| `npm run start:dev` | ensure-infra + Nest watch |
| `npm run start:docker` | Nest watch only (used inside Compose) |

## Production Compose

```bash
cp .env.example .env
# set strong API_KEY, secrets, NODE_ENV=production, SWAGGER_ENABLED=false
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api node dist/src/database/seeds/run-seed.js
```

## Environment checklist

- Rotate `API_KEY`, `TIKTOK_APP_SECRET`, `BITRIX24_WEBHOOK_SECRET`.
- All `/api/v1/*` routes require header `x-api-key`. Webhooks stay public but **require** `TikTok-Signature` / `x-bitrix-secret`. `/health` is public for probes.
- `/docs` is **off** in production unless `SWAGGER_ENABLED=true`; when on, it requires the API key (`x-api-key` or `?api_key=`).
- Set `CORS_ORIGINS` (comma-separated). Empty in production disables browser cross-origin calls.
- Set `DB_SYNC=false` and rely on migrations (`migrationsRun` is enabled).
- Point `BITRIX24_WEBHOOK_URL` at a real inbound webhook (`https://xxx.bitrix24.com/rest/1/xxxxx`).
- Point `TIKTOK_API_BASE_URL` at `https://business-api.tiktok.com`.
- Configure `NOTIFY_WEBHOOK_URL` (Slack / Teams incoming webhook) for alerts.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `ECONNREFUSED` Redis/Postgres | Run `npm run infra:up` or `docker compose up -d postgres redis`. Confirm `.env` ports match Compose (`5432` / `6379`). |
| Docker command not found | Install Docker Desktop / Docker Engine, then reopen the terminal. |
| `401 Invalid TikTok signature` | App secret mismatch, or body was re-serialized. The API uses `rawBody`. |
| Webhook accepted but no lead | Inspect BullMQ: Redis connectivity, `dead_letter_jobs`. |
| Bitrix24 sync failed | `GET /api/v1/leads/:id` → `bitrix24SyncError`. Mock logs: `GET http://localhost:4002/_debug/calls`. |
| Health redis down | Redis not reachable from the API container (`REDIS_HOST=redis` in Compose). |
| Duplicate leads | Dedup uses normalized email **or** phone. Confirm both incoming values are valid. |
| Old `.env` with ports 5433/6380 | Align with `.env.example` (`5432`/`6379`) or map Compose ports accordingly. |

## Reverse proxy

Terminate TLS at Nginx / Caddy and forward:

- `POST /webhooks/tiktok/leads` — do **not** mutate the body.
- `POST /webhooks/bitrix24/deals`
- `/api/v1/*` (require `x-api-key`)
- `/docs` only if `SWAGGER_ENABLED=true`, still behind API key
