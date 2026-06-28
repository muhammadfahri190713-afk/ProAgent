'use strict';
// ============================================================
//  API — komunikasi ke Backend ProAgentsAI (native fetch Node 18+)
// ============================================================
const { CONFIG } = require('./config');

async function checkApiKey() {
  if (!CONFIG.API_KEY) return { ok: false, status: 'Belum diisi' };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(CONFIG.ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const tbl = {
      200: { ok: true,  status: 'Aktif ✓' },
      401: { ok: false, status: 'Tidak Valid ✗' },
      403: { ok: false, status: 'Akses Ditolak ✗' },
      429: { ok: true,  status: 'Rate Limited !' },
    };
    return tbl[r.status] || { ok: false, status: 'HTTP ' + r.status };
  } catch (e) {
    if (e.name === 'AbortError') return { ok: false, status: 'Timeout' };
    return { ok: false, status: 'Tidak Ada Koneksi' };
  }
}

async function callApi(modelKey, history) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 120000);
  let r;
  try {
    r = await fetch(CONFIG.ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelKey,
        messages: [{ role: 'system', content: CONFIG.SYS_PROMPT }, ...history],
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE,
        stream: false,
      }),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(t);
    if (e.name === 'AbortError') return '[ERROR] Timeout — server lambat.';
    return '[ERROR] Tidak ada koneksi internet.';
  }
  clearTimeout(t);

  if (r.status === 401 || r.status === 403) return '[ERROR] API Key tidak valid (HTTP ' + r.status + ')';
  if (r.status === 429) return '[ERROR] Rate limit — tunggu sebentar.';
  if (!r.ok) {
    const txt = (await r.text()).slice(0, 200);
    return '[ERROR] HTTP ' + r.status + ': ' + txt;
  }
  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content;
  return reply || data.content || data.response || '[Tidak ada respons]';
}

module.exports = { checkApiKey, callApi };
