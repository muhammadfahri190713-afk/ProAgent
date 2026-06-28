'use strict';
// ============================================================
//  AUTH — layar login/daftar (Supabase / local fallback)
// ============================================================
const { C } = require('./theme');
const { boxTop, boxRow, boxMid, boxBot, bw, div, showBanner } = require('./ui');
const { ask, askHidden } = require('./prompt');

function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

async function loginScreen(store) {
  while (true) {
    await showBanner();
    const W = bw();
    const badge = store.mode === 'supabase' ? 'Supabase Auth' : 'Local Auth (offline)';

    console.log(boxTop(W, 'Akses Terkunci'));
    console.log(boxRow(C.W + 'Login dulu buat masuk ProAgent.' + C.RS, W));
    console.log(boxRow(C.GR + 'Backend : ' + C.RS + C.C + badge + C.RS, W));
    console.log(boxMid(W));
    console.log(boxRow(C.G + C.BD + '[1]' + C.RS + ' ' + C.W + 'Login' + C.RS, W));
    console.log(boxRow(C.G + C.BD + '[2]' + C.RS + ' ' + C.W + 'Daftar akun baru' + C.RS, W));
    console.log(boxRow(C.R + C.BD + '[3]' + C.RS + ' ' + C.W + 'Keluar' + C.RS, W));
    console.log(boxBot(W));
    console.log();

    const choice = (await ask('  ' + C.W + 'Pilih: ' + C.C)).trim();
    process.stdout.write(C.RS);

    if (choice === '3') {
      console.log('\n  ' + C.Y + 'Sampai jumpa!' + C.RS + '\n');
      process.exit(0);
    }
    if (choice !== '1' && choice !== '2') {
      console.log('  ' + C.R + '[!] Pilihan tidak valid.' + C.RS);
      await ask('  ' + C.GR + 'Enter untuk lanjut...' + C.RS);
      continue;
    }

    const isRegister = choice === '2';
    console.log();
    const email = (await ask('  ' + C.W + 'Email    : ' + C.C)).trim();
    process.stdout.write(C.RS);
    if (!validEmail(email)) {
      console.log('  ' + C.R + '[!] Format email tidak valid.' + C.RS);
      await ask('  ' + C.GR + 'Enter untuk lanjut...' + C.RS);
      continue;
    }
    const password = (await askHidden('  ' + C.W + 'Password : ' + C.C)).trim();
    process.stdout.write(C.RS);
    if (password.length < 6) {
      console.log('  ' + C.R + '[!] Password minimal 6 karakter.' + C.RS);
      await ask('  ' + C.GR + 'Enter untuk lanjut...' + C.RS);
      continue;
    }

    console.log('\n  ' + C.C + (isRegister ? 'Mendaftarkan akun...' : 'Memverifikasi...') + C.RS);

    let res;
    try {
      res = isRegister ? await store.signUp(email, password) : await store.signIn(email, password);
    } catch (e) {
      res = { error: e.message || 'Gagal terhubung.' };
    }

    if (res.error) {
      console.log('  ' + C.R + '[!] ' + res.error + C.RS);
      await ask('  ' + C.GR + 'Enter untuk coba lagi...' + C.RS);
      continue;
    }

    const user = res.user;
    console.log('  ' + C.G + C.BD + '[OK] ' + (isRegister ? 'Akun dibuat' : 'Login berhasil') + '!' + C.RS);
    if (user.is_owner) {
      console.log('  ' + C.Y + C.BD + '👑 Selamat datang, OWNER.' + C.RS);
    }
    div(W);
    await new Promise((r) => setTimeout(r, 700));
    return user;
  }
}

module.exports = { loginScreen };
      
