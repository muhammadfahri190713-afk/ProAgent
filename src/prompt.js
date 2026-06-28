'use strict';
// ============================================================
//  PROMPT — input helper (line-queue, robust TTY & pipe)
//  + password masking saat TTY
// ============================================================
const readline = require('readline');

let rl = null;
let muted = false;
const lineBuf = [];
let waiter = null;
let closed = false;

function init() {
  if (rl) return;
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });

  // listener persisten -> semua baris ditampung, anti-skip saat pipe
  rl.on('line', (line) => {
    if (waiter) { const w = waiter; waiter = null; w(line); }
    else lineBuf.push(line);
  });
  rl.on('close', () => {
    closed = true;
    if (waiter) { const w = waiter; waiter = null; w(null); }
  });

  // masking: override output writer saat muted
  const origWrite = rl._writeToOutput ? rl._writeToOutput.bind(rl) : null;
  rl._writeToOutput = function (str) {
    if (!muted) { if (origWrite) origWrite(str); else rl.output.write(str); return; }
    // saat muted: tampilkan '*' untuk tiap karakter ketikan, biarkan newline
    if (/[\r\n]/.test(str)) rl.output.write('\n');
    else rl.output.write('*'.repeat(str.length));
  };
}

function nextLine() {
  init();
  return new Promise((resolve) => {
    if (lineBuf.length) { resolve(lineBuf.shift()); return; }
    if (closed) { resolve(null); return; }
    waiter = resolve;
  });
}

async function ask(question) {
  init();
  process.stdout.write(question);
  const l = await nextLine();
  return l == null ? '' : l;
}

async function askHidden(question) {
  init();
  process.stdout.write(question);
  muted = true;
  const l = await nextLine();
  muted = false;
  return l == null ? '' : l;
}

function closeRl() {
  if (rl) { rl.close(); rl = null; }
}

module.exports = { ask, askHidden, closeRl };
