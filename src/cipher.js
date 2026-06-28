'use strict';
// ============================================================
//  CIPHER — XOR + Base64 obfuscation util (shared)
//  Dipakai encoder (tools) & reveal runtime (config)
// ============================================================

// Key dirakit dari beberapa potongan -> susah di-grep utuh
function buildKey() {
  const a = ['pR0', 'Ag3', 'nt'];
  const b = ['_v3', '::', 'sec'];
  const c = ['ure', '#', '2026'];
  return (a.join('') + b.join('') + c.join(''));
}

function xor(str, key) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

// encode: object -> base64(xor(json))
function seal(obj) {
  const json = JSON.stringify(obj);
  const x = xor(json, buildKey());
  return Buffer.from(x, 'binary').toString('base64');
}

// decode: base64(xor(json)) -> object
function reveal(blob) {
  const x = Buffer.from(blob, 'base64').toString('binary');
  const json = xor(x, buildKey());
  return JSON.parse(json);
}

module.exports = { seal, reveal, buildKey };
