/* Normaler Taschenrechner mit eigenem Formel-Parser (kein eval). window.TR.Calc */
(function () {
  const TR = (window.TR = window.TR || {});

  const FUNCS = {
    sin: (x, deg) => Math.sin(deg ? (x * Math.PI) / 180 : x),
    cos: (x, deg) => Math.cos(deg ? (x * Math.PI) / 180 : x),
    tan: (x, deg) => Math.tan(deg ? (x * Math.PI) / 180 : x),
    ln: (x) => Math.log(x),
    log: (x) => Math.log10(x),
    '√': (x) => Math.sqrt(x),
    exp: (x) => Math.exp(x),
  };

  function tokenize(s) {
    const t = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (/[0-9,.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9,.]/.test(s[j])) j++;
        let num = s.slice(i, j).replace(',', '.');
        if ((num.match(/\./g) || []).length > 1) throw new Error('Zahl');
        // wissenschaftliche Schreibweise E
        if (s[j] === 'E') {
          let k = j + 1;
          if (s[k] === '-' || s[k] === '−') k++;
          while (k < s.length && /[0-9]/.test(s[k])) k++;
          num += 'e' + s.slice(j + 1, k).replace('−', '-');
          j = k;
        }
        t.push({ type: 'num', v: parseFloat(num) });
        i = j;
        continue;
      }
      const fn = Object.keys(FUNCS).find((f) => s.startsWith(f, i));
      if (fn) { t.push({ type: 'fn', v: fn }); i += fn.length; continue; }
      if (s.startsWith('Ans', i)) { t.push({ type: 'ans' }); i += 3; continue; }
      if (c === 'π') { t.push({ type: 'num', v: Math.PI }); i++; continue; }
      if (c === 'e') { t.push({ type: 'num', v: Math.E }); i++; continue; }
      if ('+-−×÷*/^()%!'.includes(c)) {
        t.push({ type: 'op', v: { '−': '-', '*': '×', '/': '÷' }[c] || c });
        i++;
        continue;
      }
      throw new Error('Zeichen');
    }
    return t;
  }

  // rekursiver Abstieg: expr = term {(+|-) term}; term = factor {(×|÷) factor}; implizite Multiplikation
  function evaluate(src, opts = {}) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const isOp = (v) => peek() && peek().type === 'op' && peek().v === v;
    function expr() {
      let v = term();
      while (isOp('+') || isOp('-')) {
        const o = toks[p++].v;
        let r = term();
        // a + b% -> a + a·b/100 (wie beim Handy-Rechner)
        if (r && r.pct) r = { v: v.v * r.v };
        v = { v: o === '+' ? v.v + r.v : v.v - r.v };
      }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (isOp('×') || isOp('÷')) {
          const o = toks[p++].v;
          const r = unary();
          v = { v: o === '×' ? v.v * r.v : v.v / r.v };
        } else if (peek() && (peek().type === 'num' || peek().type === 'fn' || peek().type === 'ans' || isOp('('))) {
          v = { v: v.v * unary().v };
        } else break;
      }
      return v;
    }
    function unary() {
      if (isOp('-')) { p++; const r = unary(); return { v: -r.v, pct: r.pct }; }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const b = postfix();
      if (isOp('^')) { p++; const e = unary(); return { v: Math.pow(b.v, e.v) }; }
      return b;
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp('!')) { p++; v = { v: fact(v.v) }; }
        else if (isOp('%')) { p++; v = { v: v.v / 100, pct: true }; }
        else break;
      }
      return v;
    }
    function primary() {
      const tk = toks[p++];
      if (!tk) throw new Error('Ende');
      if (tk.type === 'num') return { v: tk.v };
      if (tk.type === 'ans') return { v: opts.ans || 0 };
      if (tk.type === 'fn') {
        let arg;
        if (isOp('(')) { p++; arg = expr(); if (isOp(')')) p++; }
        else arg = power();
        return { v: FUNCS[tk.v](arg.v, opts.deg) };
      }
      if (tk.type === 'op' && tk.v === '(') {
        const v = expr();
        if (isOp(')')) p++; // fehlende Klammer am Ende tolerieren
        return { v: v.v };
      }
      throw new Error('Syntax');
    }
    const r = expr();
    if (p < toks.length) throw new Error('Syntax');
    return r.v;
  }
  function fact(n) {
    if (n < 0 || !Number.isInteger(n)) return Math.exp(TR.S.logGamma(n + 1));
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function fmtResult(v) {
    if (!isFinite(v)) return isNaN(v) ? 'Fehler' : v > 0 ? '∞' : '−∞';
    if (Math.abs(v) >= 1e15 || (v !== 0 && Math.abs(v) < 1e-9)) {
      return v.toExponential(8).replace(/\.?0+e/, 'e').replace('.', ',').replace('e+', 'E').replace('e-', 'E−').replace('-', '−');
    }
    const r = parseFloat(v.toPrecision(12));
    const [ip, dp] = String(Math.abs(r)).split('.');
    const s = ip.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dp ? ',' + dp : '');
    return (r < 0 ? '−' : '') + s;
  }

  TR.Calc = { evaluate, fmtResult };
})();
