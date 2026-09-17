const currentEl = document.getElementById('current-config');
const editorEl = document.getElementById('mapping-editor');
const statusEl = document.getElementById('status');
const apiKeyEl = document.getElementById('api-key');

const API_KEY_STORAGE = 'tb24.apiKey';

function unwrap(payload) {
  if (payload && payload.success === true && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function showStatus(message) {
  statusEl.textContent = message;
}

function apiHeaders(extra) {
  const headers = { ...(extra || {}) };
  const apiKey = apiKeyEl.value.trim();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

function persistApiKey() {
  localStorage.setItem(API_KEY_STORAGE, apiKeyEl.value.trim());
}

async function loadConfig() {
  showStatus('');
  persistApiKey();
  const [mappingRes, rulesRes] = await Promise.all([
    fetch('/api/v1/config/mappings', { headers: apiHeaders() }),
    fetch('/api/v1/config/rules', { headers: apiHeaders() }),
  ]);
  if (mappingRes.status === 401 || rulesRes.status === 401) {
    throw new Error('Thiếu hoặc sai API key. Điền x-api-key (giá trị API_KEY trong .env).');
  }
  if (!mappingRes.ok || !rulesRes.ok) {
    throw new Error('Không đọc được cấu hình. Kiểm tra API đã chạy chưa.');
  }
  const mapping = unwrap(await mappingRes.json());
  const rules = unwrap(await rulesRes.json());
  const config = {
    field_mapping: mapping.field_mapping ?? mapping,
    deal_rules: rules.deal_rules ?? rules,
  };
  const text = JSON.stringify(config, null, 2);
  currentEl.textContent = text;
  editorEl.value = text;
}

async function saveConfig() {
  let parsed;
  try {
    parsed = JSON.parse(editorEl.value);
  } catch {
    showStatus('JSON không hợp lệ.');
    return;
  }
  if (!parsed.field_mapping || !parsed.deal_rules) {
    showStatus('Cần đúng 2 khóa đề bài: field_mapping và deal_rules.');
    return;
  }
  persistApiKey();
  const [mappingRes, rulesRes] = await Promise.all([
    fetch('/api/v1/config/mappings', {
      method: 'PUT',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ field_mapping: parsed.field_mapping }),
    }),
    fetch('/api/v1/config/rules', {
      method: 'PUT',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ deal_rules: parsed.deal_rules }),
    }),
  ]);
  if (mappingRes.status === 401 || rulesRes.status === 401) {
    showStatus('Thiếu hoặc sai API key.');
    return;
  }
  if (!mappingRes.ok || !rulesRes.ok) {
    showStatus('Lưu thất bại.');
    return;
  }
  await loadConfig();
  showStatus('Đã lưu.');
}

apiKeyEl.value = localStorage.getItem(API_KEY_STORAGE) || 'change-me-to-a-strong-random-key';

document.getElementById('save-btn').addEventListener('click', () => {
  saveConfig().catch((error) => showStatus(error.message));
});
document.getElementById('reload-btn').addEventListener('click', () => {
  loadConfig().catch((error) => {
    currentEl.textContent = error.message;
    showStatus(error.message);
  });
});
apiKeyEl.addEventListener('change', persistApiKey);

loadConfig().catch((error) => {
  currentEl.textContent = error.message;
  showStatus(error.message);
});
