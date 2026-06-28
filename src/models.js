'use strict';
// ============================================================
//  MODELS — daftar model AI yang tersedia
// ============================================================

const MODELS = [
  { key: 'gpt-5',                  name: 'GPT-5',            sub: 'Flagship Reasoning',        group: 'GPT',    pro: true  },
  { key: 'gpt-5.5',                name: 'GPT-5.5',          sub: 'Advanced Deep Thinking',    group: 'GPT',    pro: true  },
  { key: 'gpt-5-mini',             name: 'GPT-5 Mini',       sub: 'Fast & Smart Utility',      group: 'GPT',    pro: false },
  { key: 'gpt-5-nano',             name: 'GPT-5 Nano',       sub: 'Ultra Fast Efficient',      group: 'GPT',    pro: false },
  { key: 'gpt-4.1-mini',           name: 'GPT-4.1 Mini',     sub: 'Balanced Productivity',     group: 'GPT',    pro: false },
  { key: 'gpt-4.1-nano',           name: 'GPT-4.1 Nano',     sub: 'Lightning Speed Micro',     group: 'GPT',    pro: false },
  { key: 'claude-opus-4-7',        name: 'Claude Opus 4.7',  sub: 'Supreme Analytical Engine', group: 'Claude', pro: true  },
  { key: 'claude-opus-4-6',        name: 'Claude Opus 4.6',  sub: 'Elite Intelligence',        group: 'Claude', pro: true  },
  { key: 'claude-sonnet-4-6',      name: 'Claude Sonnet 4.6',sub: 'Speed & High IQ',           group: 'Claude', pro: false },
  { key: 'claude-haiku-4-5',       name: 'Claude Haiku 4.5', sub: 'Lightweight & Competent',   group: 'Claude', pro: false },
  { key: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro',   sub: 'Next-Gen Multi-modal Pro',  group: 'Gemini', pro: true  },
  { key: 'gemini-3-flash-preview', name: 'Gemini 3 Flash',   sub: 'Ultra Fast Multi-modal',    group: 'Gemini', pro: false },
  { key: 'gemini-2.5-flash',       name: 'Gemini 2.5 Flash', sub: 'Creative Fast Engine',      group: 'Gemini', pro: false },
];

module.exports = { MODELS };
