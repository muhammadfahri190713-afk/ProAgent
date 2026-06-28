'use strict';
// ============================================================
//  STORE — abstraksi user + gems
//  Backend: Supabase (utama)  |  Local terenkripsi (fallback)
//
//  Skema Supabase yang dibutuhkan (tabel: profiles)
//    id uuid PK (= auth.users.id)
//    email text
//    gems int4 default 30
//    is_pro bool default false
//    is_owner bool default false
//    created_at timestamptz default now()
// ============================================================
const fs = require('fs');
const crypto = require('crypto');
const { CONFIG } = require('./config');

const isOwnerEmail = (email) =>
  CONFIG.OWNER_EMAIL && String(email).toLowerCase() === CONFIG.OWNER_EMAIL;

// ------------------------------------------------------------
//  LOCAL BACKEND (fallback, password di-hash scrypt + salt)
// ------------------------------------------------------------
function loadDb() {
  try { return JSON.parse(fs.readFileSync(CONFIG.LOCAL_DB_FILE, 'utf8')); }
  catch { return { users: {} }; }
}
function saveDb(db) {
  try { fs.writeFileSync(CONFIG.LOCAL_DB_FILE, JSON.stringify(db, null, 2)); } catch {}
}
function hashPw(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(password, salt, 32).toString('hex');
  return salt + ':' + h;
}
function verifyPw(password, stored) {
  const [salt, h] = String(stored).split(':');
  if (!salt || !h) return false;
  const test = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(test));
}

const localStore = {
  mode: 'local',
  async signUp(email, password) {
    email = email.toLowerCase();
    const db = loadDb();
    if (db.users[email]) return { error: 'Email sudah terdaftar. Coba login.' };
    const owner = isOwnerEmail(email);
    db.users[email] = {
      id: crypto.randomUUID(),
      email,
      pw: hashPw(password),
      gems: owner ? 999999 : CONFIG.FREE_GEMS,
      is_pro: owner,
      is_owner: owner,
      created_at: Date.now(),
    };
    saveDb(db);
    return { user: publicUser(db.users[email]) };
  },
  async signIn(email, password) {
    email = email.toLowerCase();
    const db = loadDb();
    const u = db.users[email];
    if (!u) return { error: 'Akun tidak ditemukan. Daftar dulu.' };
    if (!verifyPw(password, u.pw)) return { error: 'Password salah.' };
    return { user: publicUser(u) };
  },
  async getProfile(email) {
    const db = loadDb();
    const u = db.users[email.toLowerCase()];
    return u ? publicUser(u) : null;
  },
  async setGems(email, gems) {
    const db = loadDb();
    const u = db.users[email.toLowerCase()];
    if (!u) return { error: 'User tidak ada.' };
    u.gems = gems; saveDb(db); return { ok: true };
  },
  async addGems(email, delta) {
    const db = loadDb();
    const u = db.users[email.toLowerCase()];
    if (!u) return { error: 'User tidak ada.' };
    u.gems = Math.max(0, (u.gems || 0) + delta); saveDb(db);
    return { ok: true, gems: u.gems };
  },
  async setPro(email, val) {
    const db = loadDb();
    const u = db.users[email.toLowerCase()];
    if (!u) return { error: 'User tidak ada.' };
    u.is_pro = val; saveDb(db); return { ok: true };
  },
  async listUsers() {
    const db = loadDb();
    return Object.values(db.users).map(publicUser);
  },
};

function publicUser(u) {
  return {
    id: u.id, email: u.email, gems: u.gems,
    is_pro: !!u.is_pro, is_owner: !!u.is_owner,
    created_at: u.created_at,
  };
}

// ------------------------------------------------------------
//  SUPABASE BACKEND
// ------------------------------------------------------------
function makeSupabaseStore() {
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  async function ensureProfile(authUser) {
    const email = authUser.email.toLowerCase();
    const owner = isOwnerEmail(email);
    // cek profile
    let { data: prof } = await sb.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (!prof) {
      const row = {
        id: authUser.id, email,
        gems: owner ? 999999 : CONFIG.FREE_GEMS,
        is_pro: owner, is_owner: owner,
      };
      const { data } = await sb.from('profiles').insert(row).select().maybeSingle();
      prof = data || row;
    } else if (owner && !prof.is_owner) {
      const { data } = await sb.from('profiles').update({ is_owner: true, is_pro: true })
        .eq('id', authUser.id).select().maybeSingle();
      prof = data || prof;
    }
    return prof;
  }

  return {
    mode: 'supabase',
    async signUp(email, password) {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Cek email untuk konfirmasi, lalu login.' };
      const prof = await ensureProfile(data.user);
      return { user: prof };
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      const prof = await ensureProfile(data.user);
      return { user: prof };
    },
    async getProfile(email) {
      const { data } = await sb.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
      return data || null;
    },
    async setGems(email, gems) {
      const { error } = await sb.from('profiles').update({ gems }).eq('email', email.toLowerCase());
      return error ? { error: error.message } : { ok: true };
    },
    async addGems(email, delta) {
      const cur = await this.getProfile(email);
      if (!cur) return { error: 'User tidak ada.' };
      const gems = Math.max(0, (cur.gems || 0) + delta);
      const { error } = await sb.from('profiles').update({ gems }).eq('email', email.toLowerCase());
      return error ? { error: error.message } : { ok: true, gems };
    },
    async setPro(email, val) {
      const { error } = await sb.from('profiles').update({ is_pro: val }).eq('email', email.toLowerCase());
      return error ? { error: error.message } : { ok: true };
    },
    async listUsers() {
      const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  };
}

// ------------------------------------------------------------
//  FACTORY
// ------------------------------------------------------------
function getStore() {
  if (CONFIG.HAS_SUPABASE) {
    try { return makeSupabaseStore(); }
    catch { return localStore; }
  }
  return localStore;
}

module.exports = { getStore, isOwnerEmail };
