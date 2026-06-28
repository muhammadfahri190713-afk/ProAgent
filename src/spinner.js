'use strict';
// ============================================================
//  SPINNER — loading indicator saat AI berpikir
// ============================================================
const { C } = require('./theme');

class Spinner {
  constructor(label = 'ProAgent berpikir...') {
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.label = label;
    this._timer = null;
    this._i = 0;
  }
  start() {
    if (!process.stdout.isTTY) return;
    this._timer = setInterval(() => {
      process.stdout.write('\r  ' + C.C + this.frames[this._i % this.frames.length] + ' ' + this.label + C.RS);
      this._i++;
    }, 100);
  }
  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    process.stdout.write('\r' + ' '.repeat(45) + '\r');
  }
}

module.exports = { Spinner };
