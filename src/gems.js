'use strict';
// ============================================================
//  GEMS — tampilan & logika gems user
// ============================================================
const { C } = require('./theme');
const { boxTop, boxRow, boxMid, boxBot, bw } = require('./ui');

function tier(user) {
  if (user.is_owner) return 'owner';
  if (user.is_pro) return 'pro';
  return 'free';
}

function gemsLabel(user) {
  if (user.is_owner || user.is_pro) return '∞ (unlimited)';
  return String(user.gems);
}

// tampilan command /gems
function showGems(user) {
  const W = bw();
  const t = tier(user);
  console.log();
  console.log(boxTop(W, 'Gems'));
  console.log(boxRow(C.W + 'User   : ' + C.RS + C.C + user.email + C.RS, W));
  console.log(boxRow(C.W + 'Tier   : ' + C.RS + C.Y + C.BD + t.toUpperCase() + C.RS, W));
  console.log(boxMid(W));
  // baris persis kayak permintaan: "gems user free: 30"
  const line = C.M + C.BD + 'gems user ' + t + ': ' + C.RS + C.G + C.BD + gemsLabel(user) + C.RS;
  console.log(boxRow('💎 ' + line, W));
  console.log(boxBot(W));
  if (t === 'free') {
    console.log('  ' + C.GR + 'Tiap balasan AI = 1 gem. Habis? upgrade ke PRO.' + C.RS);
  }
  console.log();
}

// cek apakah user masih punya gem buat kirim pesan
function canSpend(user) {
  if (user.is_owner || user.is_pro) return true;
  return (user.gems || 0) > 0;
}

module.exports = { showGems, canSpend, tier, gemsLabel };
