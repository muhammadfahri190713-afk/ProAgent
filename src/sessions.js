'use strict';
// ============================================================
//  SESSIONS — simpan/lanjut riwayat chat (per-user, lokal)
// ============================================================
const fs = require('fs');
const { CONFIG } = require('./config');

function fileFor(userId) {
  // satu file global, di-scope per user lewat field "owner"
  return CONFIG.SESSIONS_FILE;
}

function loadSessions(userId) {
  try {
    const all = JSON.parse(fs.readFileSync(fileFor(userId), 'utf8'));
    return all.filter((s) => !userId || s.user === userId);
  } catch { return []; }
}

function loadAll() {
  try { return JSON.parse(fs.readFileSync(CONFIG.SESSIONS_FILE, 'utf8')); }
  catch { return []; }
}

function saveSessions(sessions, userId) {
  try {
    const others = loadAll().filter((s) => s.user !== userId);
    fs.writeFileSync(CONFIG.SESSIONS_FILE, JSON.stringify([...others, ...sessions], null, 2));
  } catch {}
}

function upsertSession(sessions, sess) {
  const i = sessions.findIndex((s) => s.id === sess.id);
  if (i >= 0) sessions[i] = sess; else sessions.push(sess);
  return sessions;
}

module.exports = { loadSessions, saveSessions, upsertSession };
