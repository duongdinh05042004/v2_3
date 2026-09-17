# Hướng dẫn sử dụng

Tài liệu này mô tả cách gọi API sau khi đã triển khai authentication bằng API key và workflow phê duyệt Deal (người quản lý trực tiếp + quyền chỉnh sửa trước bước phê duyệt cuối).

## 1. Khởi động (mọi máy sau clone/pull)

```bash
npm run setup                 # tạo .env nếu chưa có
cp .env.example .env          # tương đương nếu chưa chạy setup
```

**Docker full (khuyến nghị):**

```bash
docker compose up --build
docker compose exec api npm run seed
```

**API local + infra Docker:**

```bash
npm install
npm run infra:up
npm run migration:run && npm run seed
npm run start:dev
```

Giá trị `API_KEY` trong `.env` là bí mật service-to-service. Mặc định demo: `change-me-to-a-strong-random-key`.
Chi tiết portable setup: [DEPLOYMENT.md](DEPLOYMENT.md) / README mục 1.

## 2. Authentication (API key)

`ThrottlerGuard` **và** `ApiKeyGuard` đều được đăng ký `APP_GUARD` toàn cục. **`@UseGuards(ApiKeyGuard)` gắn trên mọi controller** (leads, deals, config, analytics, reports, webhooks, health). Webhook + health đánh dấu `@Public()` nên không cần API key; chữ ký TikTok / secret Bitrix **bắt buộc**.

| Surface | Xác thực |
| --- | --- |
| `GET /health`, `/health/live`, `/health/ready` | Public (`@Public()`), không throttle |
| `POST /webhooks/tiktok/leads` | Public + header `TikTok-Signature` bắt buộc |
| `POST /webhooks/bitrix24/deals` | Public + header `x-bitrix-secret` bắt buộc |
| `/api/v1/leads/*` | `x-api-key` |
| `/api/v1/deals/*` | `x-api-key` |
| `/api/v1/config/*` | `x-api-key` |
| `/api/v1/analytics/*` | `x-api-key` |
| `/api/v1/reports/*` | `x-api-key` |
| `/docs`, `/docs/swagger.json` | `x-api-key` hoặc `?api_key=` (tắt mặc định khi `NODE_ENV=production`) |

Interceptor: mọi request được log (che `api_key` trong URL); response JSON bọc `{ success, data }` trừ health/webhook/export/docs.

Gửi key bằng một trong hai cách:

```http
x-api-key: change-me-to-a-strong-random-key
```

```http
Authorization: Bearer change-me-to-a-strong-random-key
```

Thiếu hoặc sai key → `401 Invalid or missing API key`.

Swagger UI (`/docs`) cũng yêu cầu API key: mở `http://localhost:3000/docs?api_key=change-me-to-a-strong-random-key` rồi Authorize để gọi thử API.

Màn mapping `http://localhost:3000` tự gửi `x-api-key` (mặc định trùng `API_KEY` trong `.env.example`).


```bash
curl -s -H "x-api-key: change-me-to-a-strong-random-key" \
  http://localhost:3000/api/v1/config/mappings
```

## 3. Workflow Deal: quản lý trực tiếp và quyền sửa

Mỗi sales person có `manager_external_id` (người quản lý trực tiếp). Seed mặc định:

| External id | Tên | Quản lý trực tiếp |
| --- | --- | --- |
| `sp_manager` | Huong Le | (không) |
| `sp_hanoi` | Lan Nguyen | `sp_manager` |
| `sp_tech` | Minh Tran | `sp_manager` |
| `sp_round_robin` | Round Robin Desk | `sp_manager` |

Khi Lead convert thành Deal, hệ thống **snapshot** `managerExternalId` từ assignee. Actor được gửi qua header `x-actor-id` (external id của sales person).

```mermaid
stateDiagram-v2
  [*] --> draft: convert Lead → Deal
  draft --> pending_approval: POST submit-approval\n(chỉ assignee)
  draft --> draft: PATCH deal\n(assignee hoặc manager)
  pending_approval --> pending_approval: PATCH deal\n(vẫn được sửa)
  pending_approval --> approved: POST approve\n(chỉ direct manager)
  approved --> won: PATCH status=won
  draft --> lost: PATCH status=lost
  pending_approval --> lost: PATCH status=lost
```

Quy tắc quyền:

1. **Xác định quản lý trực tiếp** — `sales_persons.manager_external_id` của người được assign; lưu trên deal lúc convert.
2. **Chỉnh sửa trước phê duyệt cuối** — assignee **hoặc** direct manager được `PATCH /api/v1/deals/:id` khi `approval_status` là `draft` hoặc `pending_approval`.
3. **Sau phê duyệt cuối** — deal khóa chỉnh sửa (`canEdit = false`). Chỉ còn đóng deal (`won` / `lost`).
4. **Won** bắt buộc `approval_status = approved`. Convert TikTok `CompletePayment` chỉ chạy khi won.

### API workflow

Mọi request dưới đây cần `x-api-key`.

```bash
# Quyền hiện tại của actor
curl -s -H "x-api-key: $API_KEY" -H "x-actor-id: sp_tech" \
  http://localhost:3000/api/v1/deals/$DEAL_ID/workflow

# Sửa title/amount/stage trước khi manager duyệt
curl -s -X PATCH -H "x-api-key: $API_KEY" -H "x-actor-id: sp_tech" \
  -H "Content-Type: application/json" \
  -d '{"title":"Spring Sale - Nguyen Van A","amount":"8000000"}' \
  http://localhost:3000/api/v1/deals/$DEAL_ID

# Assignee gửi duyệt
curl -s -X POST -H "x-api-key: $API_KEY" -H "x-actor-id: sp_tech" \
  http://localhost:3000/api/v1/deals/$DEAL_ID/submit-approval

# Direct manager phê duyệt cuối
curl -s -X POST -H "x-api-key: $API_KEY" -H "x-actor-id: sp_manager" \
  http://localhost:3000/api/v1/deals/$DEAL_ID/approve

# Đánh dấu won (chỉ sau khi approved)
curl -s -X PATCH -H "x-api-key: $API_KEY" -H "x-actor-id: sp_tech" \
  -H "Content-Type: application/json" \
  -d '{"status":"won","stage":"WON"}' \
  http://localhost:3000/api/v1/deals/$DEAL_ID/status
```

`GET .../workflow` trả về:

```json
{
  "assignedTo": "sp_tech",
  "directManager": "sp_manager",
  "approvalStatus": "draft",
  "canEdit": true,
  "canSubmitApproval": true,
  "canApprove": false,
  "finalStepLocked": false
}
```

## 4. Luồng chính Lead → Deal

1. TikTok gọi `POST /webhooks/tiktok/leads` (không API key, có chữ ký HMAC).
2. Worker chuẩn hóa, dedup, sync Bitrix24 Lead.
3. Rule Engine (`deal_rules`) match → tạo Deal, assign sales, gắn direct manager, `approval_status=draft`.
4. Sales sửa deal (nếu cần) → submit → manager approve → `PATCH status=won`.
5. Won + `ttclid` → queue TikTok conversion.

Mapping / rules:

```bash
curl -s -H "x-api-key: $API_KEY" http://localhost:3000/api/v1/config/mappings
curl -s -H "x-api-key: $API_KEY" http://localhost:3000/api/v1/config/rules
```

Analytics / export cũng cần API key:

```bash
curl -s -H "x-api-key: $API_KEY" \
  http://localhost:3000/api/v1/analytics/conversion-rates
curl -s -H "x-api-key: $API_KEY" \
  "http://localhost:3000/api/v1/reports/export?format=csv&date_range=30d" -o leads.csv
```

## 5. Seed lại hierarchy

Nếu database đã seed trước khi có cột manager:

```bash
npm run migration:run
npm run seed
```

Seed cập nhật `manager_external_id` cho sales person hiện có.

## 6. Validation DTO / request body

`ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform`. Body/query không đúng schema → `400`.

| Endpoint | DTO |
| --- | --- |
| `POST /webhooks/tiktok/leads` | `TikTokWebhookDto` (`event`, `event_id`, `timestamp` bắt buộc) |
| `POST /webhooks/bitrix24/deals` | `Bitrix24WebhookDto` |
| `POST /api/v1/leads/batch-import` | `{ payloads: TikTokWebhookDto[] }` tối đa 500 |
| `PUT /api/v1/config/mappings` | `{ field_mapping: Record<string, string> }` không rỗng |
| `PUT /api/v1/config/rules` | `{ deal_rules: DealRuleDto[] }`, `action` chỉ `create_deal` |
| `PATCH /api/v1/deals/:id` | ít nhất một trong `title` / `amount` / `stage`; amount là số thập phân |
| `PATCH /api/v1/deals/:id/status` | `status` ∈ `open \| won \| lost` |
| `GET /api/v1/reports/export` | `format` ∈ `csv \| xlsx \| json`, `date_range` = `{1-365}d` |

