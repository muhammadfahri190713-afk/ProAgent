'use strict';
// ============================================================
//  UI — banner, boxes, dividers, headers
// ============================================================
const { C, rpad, plen, termWidth, clear } = require('./theme');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Box drawing -------------------------------------------
function boxRow(content, w) {
  return '  ' + C.C + '|' + C.RS + ' ' + rpad(content, w - 3) + ' ' + C.C + '|' + C.RS;
}

function boxTop(w, title = '') {
  if (title) {
    const t = ' ' + title + ' ';
    const bar = w - t.length - 2;
    const l = Math.floor(bar / 2);
    const r = bar - l;
    return '  ' + C.C + '+' + '-'.repeat(l) + C.Y + C.BD + t + C.RS + C.C + '-'.repeat(r) + '+' + C.RS;
  }
  return '  ' + C.C + '+' + '-'.repeat(w) + '+' + C.RS;
}

function boxMid(w) { return '  ' + C.C + '+' + '-'.repeat(w) + '+' + C.RS; }
function boxBot(w) { return '  ' + C.C + '+' + '-'.repeat(w) + '+' + C.RS; }

function div(w, col, ch = '-') {
  col = col || C.C;
  const n = w || Math.min(termWidth(), 68) - 4;
  console.log('  ' + col + ch.repeat(n) + C.RS);
}

function bw() { return Math.min(termWidth() - 4, 62); }

// ---- Banner ------------------------------------------------
const BANNER_TEBAL = [
  ' ██████╗ ██████╗  ██████╗  █████╗  ██████╗ ███████╗███╗   ██╗████████╗',
  ' ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝',
  ' ██████╔╝██████╔╝██║   ██║███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ',
  ' ██╔═══╝ ██╔══██╗██║   ██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ',
  ' ██║     ██║  ██║╚██████╔╝██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ',
  ' ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ',
];

const BANNER_LIDI = [
  '  ____  ____   ___    _    ____ _____ _   _ _____ ',
  ' |  _ \\|  _ \\ / _ \\  / \\  / ___| ____| \\ | |_   _|',
  ' | |_) | |_) | | | |/ _ \\| |  _|  _| |  \\| | | | ',
  ' |  __/|  _ <| |_| / ___ \\ |_| | |___| |\\  | | | ',
  ' |_|   |_| \\_\\\\___/_/   \\_\\____|_____|_| \\_| |_| ',
];

const GRAD_TEBAL = [C.R + C.BD, C.R + C.BD, C.M + C.BD, C.M + C.BD, C.C + C.BD, C.C + C.BD];
const GRAD_LIDI  = [C.M + C.BD, C.C + C.BD, C.C + C.BD, C.B + C.BD, C.B + C.BD];

async function showBanner(animate = false) {
  clear();
  const cols = termWidth();
  console.log();

  const art  = cols >= 73 ? BANNER_TEBAL : BANNER_LIDI;
  const grad = cols >= 73 ? GRAD_TEBAL : GRAD_LIDI;

  for (let i = 0; i < art.length; i++) {
    const col = grad[i % grad.length];
    if (animate) {
      process.stdout.write(' ' + col);
      for (const ch of art[i]) {
        process.stdout.write(ch);
        await sleep(2);
      }
      process.stdout.write(C.RS + '\n');
    } else {
      console.log(' ' + col + art[i] + C.RS);
    }
  }

  console.log();
  console.log(' ' + C.M + C.BD + '[ Ultimate AI Chat Client ]' + C.RS);
  console.log(' ' + C.C + 'Secure Edition  |  v3.0' + C.RS);
  console.log(' ' + C.W + 'Terminal Edition  🚀' + C.RS);
  console.log();
  div(66, C.C, '=');
  console.log();
}

module.exports = {
  boxRow, boxTop, boxMid, boxBot, div, bw, showBanner, sleep,
};
