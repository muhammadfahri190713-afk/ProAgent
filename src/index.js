#!/usr/bin/env node
'use strict';
// ============================================================
//  ProAgent — Ultimate AI Chat Client (Terminal Edition v3.0)
//  Supabase Auth + Gems + Owner Panel + Secure Secrets
// ============================================================
const { C, termWidth, clear } = require('./theme');
const { boxTop, boxRow, boxMid, boxBot, bw, div, showBanner, sleep } = require('./ui');
const { ask, closeRl } = require('./prompt');
const { CONFIG } = require('./config');
const { MODELS } = require('./models');
const { checkApiKey, callApi } = require('./api');
const { Spinner } = require('./spinner');
const { getStore } = require('./store');
const { loginScreen } = require('./auth');
const { ownerPanel } = require('./panel');
const { showGems, canSpend, tier } = require('./gems');
const { loadSessions, saveSessions, upsertSession } = require('./sessions');

// ----- MODEL PICKER -----------------------------------------
function showModelList() {
  // banner sudah ditampilkan oleh pemanggil
  const W = bw();
  const GCL = { GPT: C.C + C.BD, Claude: C.M + C.BD, Gemini: C.G + C.BD };
  console.log(boxTop(W, 'List Model By ProAgent'));

  const numMap = {};
  let idx = 1;
  let curGrp = null;

  for (const m of MODELS) {
    if (m.group !== curGrp) {
      curGrp = m.group;
      const gcol = GCL[curGrp] || (C.W + C.BD);
      console.log(boxRow(gcol + '  -- ' + curGrp + ' Series --' + C.RS, W));
    }
    const nc = m.pro ? (C.Y + C.BD) : C.W;
    const badge = m.pro ? (C.Y + 'PRO' + C.RS) : '   ';
    const content =
      C.Y + String(idx).padStart(2) + C.RS + '. ' +
      nc + m.name.padEnd(20) + C.RS + ' ' + badge + '  ' +
      C.C + m.sub.slice(0, 22) + C.RS;
    console.log(boxRow(content, W));
    numMap[String(idx)] = m;
    idx++;
  }
  console.log(boxBot(W));
  console.log();
  return { numMap, total: idx - 1 };
}

async function pickModel(user) {
  await showBanner();
  const { numMap, total } = showModelList();
  while (true) {
    const c = (await ask('  ' + C.W + 'Pilih model: ' + C.C)).trim();
    process.stdout.write(C.RS);
    const m = numMap[c];
    if (m) {
      if (m.pro && !(user.is_pro || user.is_owner)) {
        console.log('  ' + C.R + '[!] Model PRO. Upgrade dulu / pilih model free.' + C.RS);
        continue;
      }
      return m;
    }
    console.log('  ' + C.R + '[!] Pilih angka 1-' + total + C.RS);
  }
}

// ----- CHAT HEADER ------------------------------------------
async function showChatHeader(model, user, keyStatus, keyOk) {
  clear();
  await showBanner();
  const W = bw();
  const skol = keyOk ? (C.G + C.BD) : (C.R + C.BD);
  const pro = model.pro ? ' [PRO]' : '';
  const gemsStr = (user.is_owner || user.is_pro) ? '∞' : String(user.gems);

  console.log(boxTop(W, 'ProAgent Secure Chat'));
  console.log(boxRow(C.W + 'User    : ' + C.RS + C.C + user.email + ' (' + tier(user) + ')' + C.RS, W));
  console.log(boxRow(C.W + 'Model   : ' + C.RS + C.Y + C.BD + model.name + pro + C.RS, W));
  console.log(boxRow(C.W + 'Deskripsi: ' + C.RS + C.C + model.sub + C.RS, W));
  console.log(boxRow(C.W + 'Gems    : ' + C.RS + C.G + C.BD + '💎 ' + gemsStr + C.RS, W));
  console.log(boxRow(C.W + 'API Key : ' + C.RS + skol + keyStatus + C.RS, W));
  console.log(boxMid(W));
  console.log(boxRow(C.G + C.BD + '  Chat With ProAgent  ' + C.RS, W));
  console.log(boxBot(W));
  console.log();
  console.log('  ' + C.Y + 'Ketik /command untuk semua perintah' + C.RS);
  div(W);
  console.log();
}

// ----- COMMAND HELP -----------------------------------------
function showCommands(user) {
  const W = bw();
  const cmds = [
    ['/command',      'Tampilkan semua perintah ini'],
    ['/gems',         'Cek sisa gems kamu'],
    ['/memory',       'Hapus memori / bersihkan konteks'],
    ['/chat',         'Refresh tampilan & lanjut chat'],
    ['/history',      'Lihat riwayat pesan sesi ini'],
    ['/new-chat /nw', 'Mulai sesi chat baru'],
    ['/osbm',         'Buka & lanjutkan obrolan lama'],
    ['/model',        'Ganti model AI'],
    ['/exit',         'Keluar dari ProAgent'],
  ];
  if (user.is_owner) cmds.splice(1, 0, ['/panel', '👑 Buka Owner Control Panel']);

  console.log();
  console.log(boxTop(W, 'Daftar Perintah'));
  for (const [cmd, desc] of cmds) {
    console.log(boxRow(C.G + C.BD + cmd.padEnd(18) + C.RS + '  ' + C.W + desc + C.RS, W));
  }
  console.log(boxBot(W));
  console.log();
}

// ----- OSBM (riwayat) ---------------------------------------
async function showOsbm(sessions) {
  if (!sessions.length) {
    console.log('\n  ' + C.Y + 'Belum ada obrolan tersimpan.' + C.RS + '\n');
    return null;
  }
  const W = bw();
  const sorted = [...sessions].sort((a, b) => (b.time || 0) - (a.time || 0));

  console.log();
  console.log(boxTop(W, 'Obrolan Sebelumnya'));
  sorted.forEach((s, i) => {
    const title = (s.title || 'Chat').slice(0, 26);
    const ts = new Date((s.time || 0) * 1000).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const n = (s.messages || []).length;
    const content =
      C.Y + String(i + 1).padStart(2) + C.RS + '. ' +
      C.W + C.BD + title.padEnd(26) + C.RS + ' ' +
      C.C + ts + C.RS + '  ' + C.G + n + 'msg' + C.RS;
    console.log(boxRow(content, W));
  });
  console.log(boxBot(W));
  console.log('  ' + C.Y + '[0] Batalkan' + C.RS + '\n');

  while (true) {
    const c = (await ask('  ' + C.W + 'Pilih nomor: ' + C.C)).trim();
    process.stdout.write(C.RS);
    if (c === '0') return null;
    const idx = parseInt(c, 10) - 1;
    if (idx >= 0 && idx < sorted.length) return sorted[idx];
    console.log('  ' + C.R + '[!] Angka tidak valid' + C.RS);
  }
}

// ----- CHAT LOOP --------------------------------------------
async function chatLoop(ctx) {
  let { model, user, store, keyOk, keyStatus } = ctx;
  let sessions = loadSessions(user.id);
  let history = [];
  let sessId = Math.random().toString(36).slice(2, 10);
  const spinner = new Spinner();
  const W = bw();

  const save = () => {
    if (!history.length) return;
    const s = {
      id: sessId, user: user.id,
      title: history[0].content.slice(0, 40),
      time: Date.now() / 1000,
      model_key: model.key, model_name: model.name,
      messages: history,
    };
    sessions = upsertSession(sessions, s);
    saveSessions(sessions, user.id);
  };

  await showChatHeader(model, user, keyStatus, keyOk);

  while (true) {
    const userIn = (await ask('\n  ' + C.G + C.BD + 'Kamu' + C.RS + '  : ')).trim();
    if (!userIn) continue;
    const cmd = userIn.toLowerCase().trim();

    if (cmd === '/command') { showCommands(user); continue; }

    if (cmd === '/gems') { showGems(user); continue; }

    if (cmd === '/panel') {
      if (!user.is_owner) { console.log('  ' + C.R + '[!] Khusus owner.' + C.RS); continue; }
      save();
      await ownerPanel(store, user);
      // refresh profil owner (gems dsb bisa berubah)
      const fresh = await store.getProfile(user.email);
      if (fresh) user = fresh;
      await showChatHeader(model, user, keyStatus, keyOk);
      continue;
    }

    if (cmd === '/exit') {
      save();
      console.log('\n  ' + C.Y + 'Sampai jumpa!' + C.RS + '\n');
      closeRl();
      process.exit(0);
    }

    if (cmd === '/memory') {
      history = [];
      console.log('\n  ' + C.G + '[OK] Memori dihapus! Konteks bersih.' + C.RS + '\n');
      div(W); continue;
    }

    if (cmd === '/chat') { await showChatHeader(model, user, keyStatus, keyOk); continue; }

    if (cmd === '/new-chat' || cmd === '/nw') {
      save();
      history = [];
      sessId = Math.random().toString(36).slice(2, 10);
      await showChatHeader(model, user, keyStatus, keyOk);
      console.log('  ' + C.G + '[OK] Sesi baru dimulai!' + C.RS + '\n');
      div(W); continue;
    }

    if (cmd === '/history') {
      if (!history.length) {
        console.log('\n  ' + C.Y + 'Riwayat kosong.' + C.RS + '\n');
      } else {
        console.log();
        console.log(boxTop(W, 'Riwayat Sesi'));
        for (const msg of history) {
          const lbl = msg.role === 'user' ? (C.G + C.BD + 'Kamu    ' + C.RS) : (C.M + C.BD + 'ProAgent' + C.RS);
          let body = msg.content.slice(0, 46);
          if (msg.content.length > 46) body += '...';
          console.log(boxRow(lbl + ': ' + C.W + body + C.RS, W));
        }
        console.log(boxBot(W));
        console.log();
      }
      continue;
    }

    if (cmd === '/osbm') {
      save();
      sessions = loadSessions(user.id);
      const chosen = await showOsbm(sessions);
      if (chosen) {
        history = chosen.messages || [];
        sessId = chosen.id;
        const found = MODELS.find((m) => m.key === chosen.model_key);
        if (found) model = found;
        await showChatHeader(model, user, keyStatus, keyOk);
        console.log('  ' + C.G + '[OK] Lanjut: ' + C.Y + C.BD + chosen.title + C.RS + '\n');
        div(W);
      }
      continue;
    }

    if (cmd === '/model') {
      save();
      model = await pickModel(user);
      await showChatHeader(model, user, keyStatus, keyOk);
      console.log('  ' + C.G + '[OK] Model -> ' + C.Y + C.BD + model.name + C.RS + '\n');
      div(W); continue;
    }

    // ----- kirim pesan ke AI (cek gems dulu) -----
    if (!canSpend(user)) {
      console.log('\n  ' + C.R + C.BD + '💎 Gems habis!' + C.RS + ' ' + C.Y + 'Upgrade ke PRO buat lanjut chat.' + C.RS + '\n');
      div(W); continue;
    }

    history.push({ role: 'user', content: userIn });
    console.log();
    spinner.start();
    let reply;
    try { reply = await callApi(model.key, history); }
    catch (e) { reply = '[ERROR] ' + (e.message || e); }
    finally { spinner.stop(); }

    const isErr = reply.startsWith('[ERROR]');
    console.log('  ' + C.M + C.BD + 'ProAgent' + C.RS + ':\n');
    if (isErr) {
      console.log('  ' + C.R + reply + C.RS);
      history.pop(); // batalin user msg yang gagal
    } else {
      for (const line of reply.split('\n')) console.log('  ' + line);
    }
    console.log();

    if (!isErr) {
      history.push({ role: 'assistant', content: reply });
      // potong gems untuk user free
      if (!(user.is_owner || user.is_pro)) {
        const res = await store.addGems(user.email, -CONFIG.GEM_COST);
        if (res && typeof res.gems === 'number') user.gems = res.gems;
        else user.gems = Math.max(0, (user.gems || 0) - CONFIG.GEM_COST);
        console.log('  ' + C.GR + '💎 sisa gems: ' + user.gems + C.RS);
      }
      save();
    }
    div(W);
  }
}

// ----- MAIN -------------------------------------------------
async function main() {
  await showBanner(true);

  const store = getStore();

  // 1) LOGIN
  const user = await loginScreen(store);

  // 2) OWNER -> tawarkan control panel
  if (user.is_owner) {
    const W = bw();
    console.log('\n  ' + C.Y + C.BD + '👑 Owner terdeteksi.' + C.RS);
    const go = (await ask('  ' + C.W + 'Buka Control Panel dulu? (y/n): ' + C.C)).trim().toLowerCase();
    process.stdout.write(C.RS);
    if (go === 'y' || go === 'ya') await ownerPanel(store, user);
  }

  // 3) cek API key
  await showBanner();
  process.stdout.write('  ' + C.C + 'Memeriksa API Key...' + C.RS);
  const { ok: keyOk, status: keyStatus } = await checkApiKey();
  await sleep(300);
  if (keyOk) {
    process.stdout.write('\r  ' + C.G + C.BD + '[OK] API Key  :  ' + keyStatus.padEnd(30) + C.RS + '\n\n');
  } else {
    process.stdout.write('\r  ' + C.R + C.BD + '[!!] API Key  :  ' + keyStatus.padEnd(30) + C.RS + '\n');
    console.log('  ' + C.Y + '  -> Lanjut dengan status tidak valid...' + C.RS + '\n');
  }
  await sleep(500);

  // 4) pilih model
  const model = await pickModel(user);

  // 5) chat
  await chatLoop({ model, user, store, keyOk, keyStatus });
}

main().catch((e) => {
  console.error('\n  ' + C.R + '[FATAL] ' + (e.message || e) + C.RS + '\n');
  closeRl();
  process.exit(1);
});
