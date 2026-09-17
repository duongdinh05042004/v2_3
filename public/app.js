const currentEl = document.getElementById('current-config');
const editorEl = document.getElementById('mapping-editor');
const statusEl = document.getElementById('status');

const API_KEY_STORAGE = 'tb24.apiKey';
const DEFAULT_API_KEY = 'change-me-to-a-strong-random-key';

function unwrap(payload) {
  if (payload && payload.success === true && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function showStatus(message) {
  statusEl.textContent = message;
}

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || DEFAULT_API_KEY;
}

function apiHeaders(extra) {
  return {
    ...(extra || {}),
    'x-api-key': getApiKey(),
  };
}

async function readError(res) {
  try {
    const body = await res.json();
    const err = body?.error ?? body?.message ?? body;
    if (Array.isArray(err)) {
      return err.join('; ');
    }
    if (typeof err === 'string') {
      return err;
    }
    return JSON.stringify(err);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

async function loadConfig() {
  showStatus('');
  const [mappingRes, rulesRes] = await Promise.all([
    fetch('/api/v1/config/mappings', { headers: apiHeaders() }),
    fetch('/api/v1/config/rules', { headers: apiHeaders() }),
  ]);
  if (mappingRes.status === 401 || rulesRes.status === 401) {
    throw new Error('Sai API_KEY. Giá trị mặc định phải trùng API_KEY trong .env.');
  }
  if (!mappingRes.ok || !rulesRes.ok) {
    const detail = !mappingRes.ok ? await readError(mappingRes) : await readError(rulesRes);
    throw new Error(`Không đọc được cấu hình (${detail}). Kiểm tra API/Redis đã chạy.`);
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
    showStatus('Cần đúng 2 khóa: field_mapping và deal_rules.');
    return;
  }
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
    showStatus('Sai API_KEY (phải trùng API_KEY trong .env).');
    return;
  }
  if (!mappingRes.ok || !rulesRes.ok) {
    const detail = !mappingRes.ok ? await readError(mappingRes) : await readError(rulesRes);
    showStatus(`Lưu thất bại: ${detail}`);
    return;
  }
  await loadConfig();
  showStatus('Đã lưu.');
}

document.getElementById('save-btn').addEventListener('click', () => {
  saveConfig().catch((error) => showStatus(error.message));
});
document.getElementById('reload-btn').addEventListener('click', () => {
  loadConfig().catch((error) => {
    currentEl.textContent = error.message;
    showStatus(error.message);
  });
});

loadConfig().catch((error) => {
  currentEl.textContent = error.message;
  showStatus(error.message);
});
