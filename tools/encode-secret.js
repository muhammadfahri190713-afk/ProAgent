#!/usr/bin/env node
'use strict';
// ============================================================
//  ENCODE-SECRET — generate src/secrets.js dari config rahasia
//
//  Pakai:
//    1) buat file secrets.plain.json (lihat secrets.plain.example.json)
//    2) jalankan: npm run encode
//    3) src/secrets.js otomatis ke-generate (blob ter-obfuscate)
//    4) JANGAN commit secrets.plain.json (udah di .gitignore)
// ============================================================
const fs = require('fs');
const path = require('path');
const { seal } = require('../src/cipher');

const PLAIN = path.join(__dirname, '..', 'secrets.plain.json');
const OUT = path.join(__dirname, '..', 'src', 'secrets.js');

if (!fs.existsSync(PLAIN)) {
  console.error('\n[!] File secrets.plain.json tidak ditemukan.');
  console.error('    Copy dari secrets.plain.example.json lalu isi nilainya.\n');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(PLAIN, 'utf8'));
} catch (e) {
  console.error('\n[!] secrets.plain.json bukan JSON valid:', e.message, '\n');
  process.exit(1);
}

const required = ['API_KEY', 'ENDPOINT', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OWNER_EMAIL'];
for (const k of required) {
  if (!(k in data)) {
    console.error(`\n[!] Field wajib hilang: ${k}\n`);
    process.exit(1);
  }
}

const blob = seal(data);

const content = `'use strict';
// ============================================================
//  SECRETS — AUTO-GENERATED. JANGAN edit manual.
//  Generate ulang: npm run encode
//  Nilai asli ter-obfuscate (XOR + Base64). Aman buat di-public.
// ============================================================
module.exports = { BLOB: ${JSON.stringify(blob)} };
`;

fs.writeFileSync(OUT, content, 'utf8');
console.log('\n[OK] src/secrets.js berhasil di-generate (' + blob.length + ' chars blob).');
console.log('     Secret kamu sekarang ter-obfuscate. Gas obfuscate full: npm run build\n');
