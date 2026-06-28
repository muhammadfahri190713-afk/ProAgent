'use strict';
// ============================================================
//  MARKDOWN RENDERER — render markdown ke terminal berwarna
// ============================================================
const { C } = require('./theme');

function inline(text) {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, (_, m) => C.Y + C.BD + m + C.RS)
    .replace(/\*\*(.*?)\*\*/g,     (_, m) => C.W + C.BD + m + C.RS)
    .replace(/__(.*?)__/g,          (_, m) => C.W + C.BD + m + C.RS)
    .replace(/\*([^*\n]+)\*/g,     (_, m) => C.C + m + C.RS)
    .replace(/`([^`\n]+)`/g,       (_, m) => C.Y + m + C.RS)
    .replace(/~~(.*?)~~/g,         (_, m) => C.R + m + C.RS);
}

function renderMd(text) {
  if (!text) return '';

  const out = [];
  let inCode = false;
  let codeLang = '';
  let codeBuf = [];
  const bar = 50;

  const flushCode = () => {
    const lang = (codeLang.trim() || 'code');
    const top = '+-' + lang + ' ' + '-'.repeat(Math.max(0, bar - lang.length - 3)) + '+';
    out.push('  ' + C.C + top + C.RS);
    for (const cl of codeBuf) {
      const pad = Math.max(0, bar - cl.length);
      out.push('  ' + C.C + '|' + C.RS + ' ' + C.Y + cl + C.RS + ' '.repeat(pad) + ' ' + C.C + '|' + C.RS);
    }
    out.push('  ' + C.C + '+' + '-'.repeat(bar) + '+' + C.RS);
  };

  for (const rawLine of text.split('\n')) {
    const stripped = rawLine.trim();

    if (stripped.startsWith('```')) {
      if (!inCode) { inCode = true; codeLang = stripped.slice(3); codeBuf = []; }
      else { inCode = false; flushCode(); codeBuf = []; codeLang = ''; }
      continue;
    }
    if (inCode) { codeBuf.push(rawLine); continue; }

    if (/^#{4} /.test(stripped)) {
      out.push('  ' + C.W + C.BD + '# ' + inline(stripped.slice(5)) + C.RS);
    } else if (/^#{3} /.test(stripped)) {
      out.push('\n  ' + C.C + C.BD + '>> ' + inline(stripped.slice(4)) + C.RS);
    } else if (/^#{2} /.test(stripped)) {
      const t = stripped.slice(3);
      out.push('\n  ' + C.M + C.BD + '> ' + inline(t) + C.RS);
      out.push('  ' + C.M + '-'.repeat(Math.min(48, t.length + 2)) + C.RS);
    } else if (/^# /.test(stripped)) {
      const t = stripped.slice(2);
      const w = Math.min(50, t.length + 4);
      out.push('\n  ' + C.Y + C.BD + '='.repeat(w) + C.RS);
      out.push('  ' + C.Y + C.BD + '  ' + inline(t) + C.RS);
      out.push('  ' + C.Y + C.BD + '='.repeat(w) + C.RS);
    } else if (/^[-*_]{3,}$/.test(stripped)) {
      out.push('  ' + C.C + '-'.repeat(50) + C.RS);
    } else if (/^(\s*)[-*+] /.test(rawLine)) {
      const indent = rawLine.length - rawLine.trimStart().length;
      const body = rawLine.trimStart().replace(/^[-*+] /, '');
      const sym = indent === 0 ? '•' : '◦';
      const prefix = '  ' + '  '.repeat(Math.floor(indent / 2));
      out.push(prefix + C.C + sym + C.RS + ' ' + inline(body));
    } else if (/^\d+\. /.test(stripped)) {
      const m = stripped.match(/^(\d+)\. (.*)/);
      if (m) out.push('  ' + C.Y + m[1] + '.' + C.RS + ' ' + inline(m[2]));
    } else if (stripped.startsWith('> ')) {
      out.push('  ' + C.C + '|' + C.RS + ' ' + inline(stripped.slice(2)));
    } else if (stripped === '') {
      out.push('');
    } else {
      out.push('  ' + inline(rawLine));
    }
  }

  if (inCode) flushCode();
  return out.join('\n');
}

module.exports = { renderMd };
