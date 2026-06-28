'use strict';
// ============================================================
//  THEME — ANSI colors (zero-dependency, biar bundle ringan)
// ============================================================

const ON = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const code = (n) => (ON ? `\x1b[${n}m` : '');

const C = {
  R:  code(31),  // red
  G:  code(32),  // green
  Y:  code(33),  // yellow
  C:  code(36),  // cyan
  M:  code(35),  // magenta
  W:  code(37),  // white
  B:  code(34),  // blue
  GR: code(90),  // gray
  RS: code(0),   // reset
  BD: code(1),   // bold
  DIM: code(2),
};

// strip ANSI untuk hitung panjang asli string
function stripAnsi(s) {
  return String(s).replace(/\x1b\[[0-9;]*[mGKHJABCDsu]/g, '');
}

function plen(s) {
  return stripAnsi(s).length;
}

function rpad(coloredStr, totalWidth) {
  const pad = Math.max(0, totalWidth - plen(coloredStr));
  return coloredStr + ' '.repeat(pad);
}

function termWidth() {
  return process.stdout.columns || 80;
}

function clear() {
  process.stdout.write(process.platform === 'win32' ? '\x1b[2J\x1b[0f' : '\x1b[2J\x1b[H');
}

module.exports = { C, ON, stripAnsi, plen, rpad, termWidth, clear };
