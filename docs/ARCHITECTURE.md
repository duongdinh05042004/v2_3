# Architecture

## System context

```mermaid
flowchart LR
  TikTok[TikTok Lead Generation] -->|signed webhook| API[NestJS API]
  Bitrix[Bitrix24 CRM] -->|deal webhook| API
  API -->|crm.lead / crm.deal| Bitrix
  API -->|Events API conversions| TikTokEvents[TikTok Events API]
  API --> PG[(PostgreSQL)]
  API --> Redis[(Redis / BullMQ)]
  Sales[Sales team] --> Bitrix
  Analyst[Analyst / Dashboard] -->|REST + Swagger| API
```

## Ingestion sequence

```mermaid
sequenceDiagram
  participant TT as TikTok
  participant WH as Webhook Controller
  participant Q as BullMQ
  participant L as Lead Service
  participant B as Bitrix24
  participant R as Rule Engine

  TT->>WH: POST /webhooks/tiktok/leads + TikTok-Signature
  WH->>WH: HMAC verify + replay window
  WH->>WH: Persist raw webhook_events
  WH->>Q: lead-ingestion job
  Q->>L: normalize / validate / dedup / score
  L->>Q: bitrix-sync job
  Q->>B: crm.lead.add or crm.lead.update
  L->>R: evaluate deal_rules
  alt rule matched
    R->>Q: bitrix-sync deal
    Q->>B: crm.deal.add
  end
```

## Module map

| Module | Responsibility |
| --- | --- |
| `webhooks` | Public TikTok / Bitrix24 ingress, signature checks, raw audit |
| `leads` | Normalize, sanitize, deduplicate, quality score, merge |
| `deals` | Rule engine conversion, pipeline, assignment, won/lost |
| `sync` | Bitrix24 mapping + retryable CRM writes |
| `configuration` | Runtime field mapping and deal rules |
| `analytics` | Conversion, CPL, ROI, dashboard cache |
| `reports` | CSV/XLSX/JSON export, scheduled alerts |
| `queue` | Workers, retries, dead-letter table, cron |
| `cache` | Redis cache for config and analytics |

## Data integrity

- Webhook `event_id` is unique — replay is a no-op.
- Dedup key is normalized email **or** E.164 phone.
- Merge never drops previous `raw_data`; it keeps a rolling history.
- Bitrix24 writes are asynchronous; local `bitrix24_sync_status` is the source of truth until ACK.
- Failed jobs after max attempts land in `dead_letter_jobs`.
