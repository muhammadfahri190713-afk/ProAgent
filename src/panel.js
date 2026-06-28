'use strict';
// ============================================================
//  PANEL — Owner Control Panel (khusus owner)
// ============================================================
const { C } = require('./theme');
const { boxTop, boxRow, boxMid, boxBot, bw, div, showBanner } = require('./ui');
const { ask } = require('./prompt');
const { gemsLabel, tier } = require('./gems');

async function listUsersView(store) {
  const W = bw();
  let users = [];
  try { users = await store.listUsers(); } catch (e) { users = []; }

  console.log();
  console.log(boxTop(W, 'Daftar User (' + users.length + ')'));
  if (!users.length) {
    console.log(boxRow(C.Y + 'Belum ada user terdaftar.' + C.RS, W));
  } else {
    users.forEach((u, i) => {
      const t = tier(u);
      const tcol = u.is_owner ? C.Y + C.BD : (u.is_pro ? C.C + C.BD : C.W);
      const content =
        C.Y + String(i + 1).padStart(2) + '.' + C.RS + ' ' +
        tcol + u.email.slice(0, 26).padEnd(26) + C.RS + ' ' +
        C.GR + t.padEnd(5) + C.RS + ' ' +
        C.G + '💎 ' + gemsLabel(u) + C.RS;
      console.log(boxRow(content, W));
    });
  }
  console.log(boxBot(W));
  console.log();
}

async function ownerPanel(store, owner) {
  while (true) {
    await showBanner();
    const W = bw();
    console.log(boxTop(W, '👑 OWNER CONTROL PANEL'));
    console.log(boxRow(C.W + 'Login : ' + C.RS + C.Y + C.BD + owner.email + C.RS, W));
    console.log(boxRow(C.W + 'Mode  : ' + C.RS + C.C + store.mode + C.RS, W));
    console.log(boxMid(W));
    console.log(boxRow(C.G + C.BD + '[1]' + C.RS + ' ' + C.W + 'Lihat semua user' + C.RS, W));
    console.log(boxRow(C.G + C.BD + '[2]' + C.RS + ' ' + C.W + 'Set gems user' + C.RS, W));
    console.log(boxRow(C.G + C.BD + '[3]' + C.RS + ' ' + C.W + 'Tambah / kurangi gems' + C.RS, W));
    console.log(boxRow(C.G + C.BD + '[4]' + C.RS + ' ' + C.W + 'Toggle status PRO' + C.RS, W));
    console.log(boxRow(C.C + C.BD + '[5]' + C.RS + ' ' + C.W + 'Masuk ke chat' + C.RS, W));
    console.log(boxBot(W));
    console.log();

    const c = (await ask('  ' + C.W + 'Pilih: ' + C.C)).trim();
    process.stdout.write(C.RS);

    if (c === '5') return;

    if (c === '1') {
      await listUsersView(store);
      await ask('  ' + C.GR + 'Enter untuk kembali...' + C.RS);
      continue;
    }

    if (c === '2' || c === '3') {
      await listUsersView(store);
      const email = (await ask('  ' + C.W + 'Email user : ' + C.C)).trim();
      process.stdout.write(C.RS);
      const valStr = (await ask('  ' + C.W + (c === '2' ? 'Set gems ke : ' : 'Delta (+/-) : ') + C.C)).trim();
      process.stdout.write(C.RS);
      const val = parseInt(valStr, 10);
      if (Number.isNaN(val)) { console.log('  ' + C.R + '[!] Angka tidak valid.' + C.RS); await ask('  ' + C.GR + 'Enter...' + C.RS); continue; }
      const res = c === '2' ? await store.setGems(email, val) : await store.addGems(email, val);
      if (res.error) console.log('  ' + C.R + '[!] ' + res.error + C.RS);
      else console.log('  ' + C.G + '[OK] Gems diperbarui.' + C.RS);
      await ask('  ' + C.GR + 'Enter untuk kembali...' + C.RS);
      continue;
    }

    if (c === '4') {
      await listUsersView(store);
      const email = (await ask('  ' + C.W + 'Email user : ' + C.C)).trim();
      process.stdout.write(C.RS);
      const prof = await store.getProfile(email);
      if (!prof) { console.log('  ' + C.R + '[!] User tidak ditemukan.' + C.RS); await ask('  ' + C.GR + 'Enter...' + C.RS); continue; }
      const res = await store.setPro(email, !prof.is_pro);
      if (res.error) console.log('  ' + C.R + '[!] ' + res.error + C.RS);
      else console.log('  ' + C.G + '[OK] PRO -> ' + (!prof.is_pro) + C.RS);
      await ask('  ' + C.GR + 'Enter untuk kembali...' + C.RS);
      continue;
    }

    console.log('  ' + C.R + '[!] Pilihan tidak valid.' + C.RS);
    await ask('  ' + C.GR + 'Enter...' + C.RS);
  }
}

module.exports = { ownerPanel };
