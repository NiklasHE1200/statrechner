/* Eingaben lesen und Zahlen deutsch formatieren. window.TR.F */
(function () {
  const TR = (window.TR = window.TR || {});

  function parseNum(str) {
    if (typeof str === 'number') return str;
    if (str == null) return NaN;
    let s = String(str).trim().replace(/\s/g, '').replace(/−/g, '-');
    if (s === '') return NaN;
    // Brüche wie 1/3
    if (/^-?[\d.,]+\/[\d.,]+$/.test(s)) {
      const [a, b] = s.split('/');
      return parseNum(a) / parseNum(b);
    }
    // Prozent
    let factor = 1;
    if (s.endsWith('%')) { factor = 0.01; s = s.slice(0, -1); }
    // Tausenderpunkte bei deutscher Schreibweise (1.234,5) entfernen
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s) * factor;
  }

  // Liste aus Text: Trenner ; Leerzeichen Zeilenumbruch, oder ", " – Komma ohne Leerzeichen = Dezimalkomma
  function splitList(str) {
    let s = String(str || '').trim().replace(/−/g, '-');
    if (!s) return [];
    s = s.replace(/,\s+/g, ';');
    // nur Kommas, keine anderen Trenner, mehrere Kommas -> Kommas sind Trenner
    if (!/[;\s]/.test(s) && (s.match(/,/g) || []).length > 1) s = s.replace(/,/g, ';');
    return s.split(/[;\s\t\n]+/).filter((t) => t !== '');
  }
  function parseList(str) {
    const tokens = splitList(str);
    const vals = [];
    const bad = [];
    tokens.forEach((t) => {
      // Kurzschreibweise 12x3 oder 12*3 = dreimal die 12
      const rep = t.match(/^(.+?)[x×*](\d+)$/i);
      if (rep) {
        const v = parseNum(rep[1]);
        const k = parseInt(rep[2], 10);
        if (isFinite(v) && k > 0 && k < 100000) { for (let i = 0; i < k; i++) vals.push(v); return; }
      }
      const v = parseNum(t);
      if (isFinite(v)) vals.push(v); else bad.push(t);
    });
    return { values: vals, bad };
  }
  function parseTextList(str) {
    return String(str || '')
      .split(/[;,\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  function parseMatrix(str) {
    const rows = String(str || '')
      .trim()
      .split(/\n+/)
      .map((r) => parseList(r).values)
      .filter((r) => r.length);
    return rows;
  }

  // Zahl deutsch formatieren
  function fmt(x, digits = 4) {
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    if (typeof x !== 'number' || isNaN(x)) return '–';
    if (x !== 0 && (Math.abs(x) < 1e-4 || Math.abs(x) >= 1e12)) {
      const [m, e] = x.toExponential(Math.max(1, digits - 1)).split('e');
      return trim(m).replace('.', ',').replace('-', '−') + ' · 10^' + parseInt(e, 10);
    }
    let s = x.toFixed(digits);
    s = trim(s);
    if (s === '-0') s = '0';
    const [ip, dp] = s.split('.');
    const ipg = ip.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (dp ? ipg + ',' + dp : ipg).replace('-', '−');
  }
  function trim(s) {
    return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  }
  function fmtP(p) {
    if (p < 0.0001) return '< 0,0001';
    return fmt(p, 4);
  }
  function pTxt(p) {
    return p < 0.0001 ? 'p < 0,0001' : 'p = ' + fmt(p, 4);
  }
  function pct(x, d = 2) {
    return fmt(x * 100, d) + ' %';
  }
  function money(x) {
    if (!isFinite(x)) return '–';
    return x.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  // Zahl für TeX (Komma als {,})
  function tex(x, digits = 4) {
    const s = fmt(x, digits);
    if (s.includes('10^')) {
      const [m, e] = s.split(' · 10^');
      return m.replace(',', '{,}').replace('−', '-') + '\\cdot 10^{' + e + '}';
    }
    return s.replace(/\./g, '{.}').replace(',', '{,}').replace('−', '-').replace('∞', '\\infty');
  }
  // Zahl in Klammern, falls negativ
  function texP(x, d = 4) {
    return x < 0 ? '(' + tex(x, d) + ')' : tex(x, d);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  // Kurze Liste für TeX: a + b + ... + z
  function texSumList(vals, d = 4, max = 6) {
    if (vals.length <= max) return vals.map((v) => texP(v, d)).join(' + ');
    return vals.slice(0, 3).map((v) => texP(v, d)).join(' + ') + ' + \\dots + ' + texP(vals[vals.length - 1], d);
  }

  TR.F = { pTxt, parseNum, parseList, parseTextList, parseMatrix, splitList, fmt, fmtP, pct, money, tex, texP, esc, texSumList };
})();
