'use strict';
// ============================================================
//  CONFIG — reveal secret runtime + env override
//  Prioritas: ENV var  >  obfuscated blob
// ============================================================
const os = require('os');
const path = require('path');
const { reveal } = require('./cipher');
const { BLOB } = require('./secrets');

let revealed = {};
try {
  revealed = reveal(BLOB);
} catch (e) {
  revealed = {};
}

function pick(envName, key, fallback) {
  return process.env[envName] || revealed[key] || fallback || '';
}

const CONFIG = {
  API_KEY:           pick('PROAGENT_API_KEY',        'API_KEY'),
  ENDPOINT:          pick('PROAGENT_ENDPOINT',       'ENDPOINT', 'https://api.manus.im/api/llm-proxy/v1/chat/completions'),
  SUPABASE_URL:      pick('SUPABASE_URL',            'SUPABASE_URL'),
  SUPABASE_ANON_KEY: pick('SUPABASE_ANON_KEY',       'SUPABASE_ANON_KEY'),
  OWNER_EMAIL:       (pick('PROAGENT_OWNER',         'OWNER_EMAIL')).toLowerCase(),

  MAX_TOKENS:  16384,
  TEMPERATURE: 0.7,

  FREE_GEMS:   30,          // jatah gems user free
  GEM_COST:    1,           // biaya per pesan

  SESSIONS_FILE: path.join(os.homedir(), '.proagent_sessions.json'),
  LOCAL_DB_FILE: path.join(os.homedir(), '.proagent_users.json'),

  SYS_PROMPT: (
    'You are ProAgent, a next-gen elite AI assistant. 🚀 ' +
    'Cool, sharp, confident vibes. Use emojis naturally. 😊' +
    'Be direct and insightful. do not forget , dont always say "Hello im proagent" , because its showing off.If the user doesnt ask who you are, then dont say "Im ProAgent" and that will disrupt your work.' +
    "CRITICAL: NEVER introduce yourself. NEVER say your name or 'I am ProAgent' or 'As an AI' etc. " +
    'NEVER start with greetings about your identity. Just answer naturally and immediately. ' +
    'Reply in the same language the user writes in. Stay smooth. 🔥, Never using a markdown like ** or ## and others. Just respone normal character. Act normal'
  ),
};

// apakah Supabase dikonfigurasi?
CONFIG.HAS_SUPABASE = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

module.exports = { CONFIG };
