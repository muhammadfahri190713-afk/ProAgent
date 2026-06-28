#!/usr/bin/env node
'use strict';
// ============================================================
//  BUILD — obfuscate semua source ke dist/  (offline, reliable)
//  Pakai:  npm run build
//  Output: dist/src/*.js (ter-obfuscate) + package.json + README
//
//  Distribusi public:
//    1. zip folder dist/ + node_modules (atau suruh user npm install)
//    2. jalankan: node dist/src/index.js
//  Secret SUDAH ter-obfuscate 2 lapis: XOR+Base64 (secrets.js)
//  lalu di-obfuscate lagi sama javascript-obfuscator.
// ============================================================
const fs = require('fs');
const path = require('path');
const JsObfuscator = require('javascript-obfuscator');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const OUT_SRC = path.join(DIST, 'src');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(OUT_SRC, { recursive: true });

const obfOpts = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.6,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.25,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  splitStrings: true,
  splitStringsChunkLength: 8,
  identifierNamesGenerator: 'hexadecimal',
  selfDefending: true,
  numbersToExpressions: true,
  simplify: true,
  transformObjectKeys: true,
};

let count = 0;
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith('.js')) continue;
  const code = fs.readFileSync(path.join(SRC, f), 'utf8');
  const res = JsObfuscator.obfuscate(code, obfOpts);
  fs.writeFileSync(path.join(OUT_SRC, f), res.getObfuscatedCode());
  count++;
}

// package.json minimal untuk dist
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const distPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  bin: { proagent: 'src/index.js' },
  main: 'src/index.js',
  scripts: { start: 'node src/index.js' },
  dependencies: pkg.dependencies,
};
fs.writeFileSync(path.join(DIST, 'package.json'), JSON.stringify(distPkg, null, 2));

if (fs.existsSync(path.join(ROOT, 'README.md'))) {
  fs.copyFileSync(path.join(ROOT, 'README.md'), path.join(DIST, 'README.md'));
}

console.log('\n[OK] ' + count + ' file ter-obfuscate -> dist/src/');
console.log('     Distribusi: copy folder dist/, lalu di mesin user:');
console.log('       cd dist && npm install --omit=dev && node src/index.js\n');
