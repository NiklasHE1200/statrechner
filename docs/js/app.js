/* Oberfläche: Login, Navigation, Rechner, Verfahren, Anleitung */
(function () {
  const TR = window.TR, F = TR.F;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat */ } },
  };
  const ICON = {
    chev: '<svg class="chev" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l-8 8 8 8"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    bulb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  };
  const cat = (id) => TR.cats.find((c) => c.id === id);
  const icon = (c) => `<span class="ic" style="background:${c.color}">${c.glyph}</span>`;
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1900);
  }

  // ================= Login =================
  const CFG = window.TR_CONFIG || {};
  const DEMO = !!CFG.demoMode;
  if (DEMO) document.documentElement.classList.add('demo');
  if (CFG.demoUrl && !DEMO) { const dl = $('#demo-link'); dl.href = CFG.demoUrl; dl.classList.remove('hidden'); }
  function showLogin() {
    if (DEMO) return showApp();
    $('#login').classList.remove('hidden');
    $('#app').classList.add('hidden');
    setTimeout(() => $('#pw').focus(), 300);
  }
  function showApp() {
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
    route();
    if (!store.get('tr-welcomed', false)) (DEMO ? openDemoWelcome : openWelcome)();
  }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = await TR.Auth.login($('#pw').value);
    if (ok) {
      $('#pw').value = '';
      $('#login-err').textContent = '';
      showApp();
    } else {
      $('#login-err').textContent = 'Falsches Passwort. Bitte erneut versuchen.';
      const c = $('.login-card');
      c.classList.remove('shake');
      void c.offsetWidth;
      c.classList.add('shake');
    }
  });
  $('#pw-eye').addEventListener('click', () => {
    const i = $('#pw');
    i.type = i.type === 'password' ? 'text' : 'password';
  });

  // ================= Router =================
  function route() {
    const h = location.hash.replace(/^#\/?/, '') || 'rechner';
    const [a, b, c] = h.split('/').map(decodeURIComponent);
    $$('.view').forEach((v) => v.classList.remove('active', 'push'));
    $$('.tabbar button').forEach((b2) => b2.classList.remove('active'));
    if (a === 'verfahren' && b) {
      const tool = TR.tools.find((t) => t.id === b);
      if (tool) { renderTool(tool, c); $('#view-tool').classList.add('active', 'push'); $('#tab-tools').classList.add('active'); window.scrollTo(0, 0); return; }
    }
    if (a === 'verfahren') { renderTools(); $('#view-tools').classList.add('active'); $('#tab-tools').classList.add('active'); }
    else if (a === 'projekte' && b) { renderProject(b); $('#view-project').classList.add('active', 'push'); $('#tab-projects').classList.add('active'); }
    else if (a === 'projekte') { renderProjects(); $('#view-projects').classList.add('active'); $('#tab-projects').classList.add('active'); }
    else if (a === 'anleitung') { renderGuide(); $('#view-guide').classList.add('active'); $('#tab-guide').classList.add('active'); }
    else { renderCalc(); $('#view-calc').classList.add('active'); $('#tab-calc').classList.add('active'); }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => TR.Auth.isLoggedIn() && route());
  $$('.tabbar button').forEach((b) =>
    b.addEventListener('click', () => {
      const target = { calc: '#/rechner', tools: '#/verfahren', projects: '#/projekte', guide: '#/anleitung' }[b.dataset.tab];
      if (location.hash === target) route(); else location.hash = target;
    })
  );

  // ================= Rechner =================
  const calc = { expr: '', ans: 0, deg: store.get('tr-deg', true), sci: store.get('tr-sci', false), done: false, hist: store.get('tr-hist', []), showHist: false };
  function renderCalc() {
    const v = $('#view-calc');
    if (!v.dataset.ready) {
      v.dataset.ready = '1';
      v.innerHTML = `
      <div class="calc">
        <div class="calc-top">
          <button class="pill" id="c-hist">Verlauf</button>
          <div style="display:flex;gap:8px">
            <button class="pill" id="c-deg"></button>
            <button class="pill" id="c-sci">f(x)</button>
          </div>
        </div>
        <div class="card hidden history" id="c-histlist"></div>
        <div class="calc-display" id="c-display"><div class="calc-expr" id="c-expr"></div><div class="calc-result" id="c-res">0</div></div>
        <div class="sci" id="c-scipad">
          ${['(', ')', 'x²', 'xʸ', '√', 'sin', 'cos', 'tan', 'ln', 'log', 'π', 'e', 'n!', '1/x', 'Ans'].map((k) => `<button class="key s" data-k="${k}">${k}</button>`).join('')}
        </div>
        <div class="keys">
          ${[
            ['AC', 'fn'], ['⌫', 'fn'], ['%', 'fn'], ['÷', 'op'],
            ['7'], ['8'], ['9'], ['×', 'op'],
            ['4'], ['5'], ['6'], ['−', 'op'],
            ['1'], ['2'], ['3'], ['+', 'op'],
            ['±'], ['0'], [','], ['=', 'op'],
          ].map(([k, c]) => `<button class="key ${c || ''}" data-k="${k}">${k}</button>`).join('')}
        </div>
      </div>`;
      $$('.key', v).forEach((b) => b.addEventListener('click', () => calcKey(b.dataset.k)));
      $('#c-deg').addEventListener('click', () => { calc.deg = !calc.deg; store.set('tr-deg', calc.deg); updateCalc(); });
      $('#c-sci').addEventListener('click', () => { calc.sci = !calc.sci; store.set('tr-sci', calc.sci); updateCalc(); });
      $('#c-hist').addEventListener('click', () => { calc.showHist = !calc.showHist; updateCalc(); });
      $('#c-res').addEventListener('click', () => {
        const t = $('#c-res').textContent;
        navigator.clipboard && navigator.clipboard.writeText(t).then(() => toast('Ergebnis kopiert'), () => {});
      });
      document.addEventListener('keydown', (e) => {
        if (!$('#view-calc').classList.contains('active') || e.target.matches('input,textarea,select')) return;
        const map = { Enter: '=', '=': '=', Backspace: '⌫', Escape: 'AC', '*': '×', '/': '÷', '-': '−', '.': ',', ',': ',', '^': 'xʸ' };
        const k = map[e.key] || (/^[0-9+%()!]$/.test(e.key) ? e.key : null);
        if (k) { e.preventDefault(); calcKey(k); }
      });
    }
    updateCalc();
  }
  function calcKey(k) {
    const ops = ['+', '−', '×', '÷'];
    if (k === 'AC') { calc.expr = ''; calc.done = false; }
    else if (k === '⌫') { calc.expr = calc.done ? '' : calc.expr.replace(/(sin|cos|tan|ln|log|√|Ans|.)$/, ''); calc.done = false; }
    else if (k === '=') {
      if (!calc.expr) return;
      try {
        const v = TR.Calc.evaluate(calc.expr, { deg: calc.deg, ans: calc.ans });
        calc.hist.unshift({ e: calc.expr, r: TR.Calc.fmtResult(v), v });
        calc.hist = calc.hist.slice(0, 30);
        store.set('tr-hist', calc.hist);
        calc.ans = v;
        calc.lastExpr = calc.expr;
        calc.expr = isFinite(v) ? TR.Calc.fmtResult(v).replace(/\./g, '') : '';
        calc.done = true;
      } catch (e) {
        flashError();
        return;
      }
    } else {
      let ins = { 'x²': '^2', 'xʸ': '^', 'n!': '!', '1/x': '1÷(', sin: 'sin(', cos: 'cos(', tan: 'tan(', ln: 'ln(', log: 'log(', '√': '√(' }[k] || k;
      if (k === '±') {
        if (!calc.expr) calc.expr = '−';
        else if (/^−\(.*\)$/.test(calc.expr)) calc.expr = calc.expr.slice(2, -1);
        else if (/^−[\d,]+$/.test(calc.expr)) calc.expr = calc.expr.slice(1);
        else calc.expr = /^[\d,]+$/.test(calc.expr) ? '−' + calc.expr : '−(' + calc.expr + ')';
        calc.done = false;
        updateCalc();
        return;
      }
      if (calc.done) {
        // nach "=": Operator rechnet weiter, Zahl startet neu
        if (ops.includes(ins) || ins === '^' || ins === '^2' || ins === '!' || ins === '%') { /* weiter mit Ergebnis */ }
        else calc.expr = '';
        calc.done = false;
      }
      if (ops.includes(ins) && ops.includes(calc.expr.slice(-1)) && !(ins === '−' && calc.expr.slice(-1) !== '−')) calc.expr = calc.expr.slice(0, -1);
      if (ins === ',' && /[\d]*,[\d]*$/.test(calc.expr.split(/[^\d,]/).pop())) return;
      if (calc.expr.length > 120) return;
      calc.expr += ins;
    }
    updateCalc();
  }
  function flashError() {
    const r = $('#c-res');
    r.textContent = 'Fehler';
    r.classList.remove('shake');
    void r.offsetWidth;
    r.classList.add('shake');
  }
  function updateCalc() {
    $('#c-deg').textContent = calc.deg ? 'DEG' : 'RAD';
    $('#c-sci').classList.toggle('on', calc.sci);
    $('#c-hist').classList.toggle('on', calc.showHist);
    $('#c-scipad').classList.toggle('hidden', !calc.sci);
    const hl = $('#c-histlist');
    hl.classList.toggle('hidden', !calc.showHist);
    if (calc.showHist) {
      hl.innerHTML = calc.hist.length
        ? calc.hist.map((h, i) => `<div class="history-item" data-i="${i}"><span>${F.esc(h.e)}</span><span>= ${F.esc(h.r)}</span></div>`).join('') + '<div class="history-item" id="c-clear"><span class="danger">Verlauf löschen</span><span></span></div>'
        : '<div class="empty">Noch keine Rechnungen</div>';
      $$('.history-item[data-i]', hl).forEach((el) => el.addEventListener('click', () => {
        const h = calc.hist[+el.dataset.i];
        calc.expr = calc.done || !calc.expr ? h.r.replace(/\./g, '') : calc.expr + h.r.replace(/\./g, '');
        calc.done = false; calc.showHist = false; updateCalc();
      }));
      const cl = $('#c-clear');
      cl && cl.addEventListener('click', () => { calc.hist = []; store.set('tr-hist', []); updateCalc(); });
    }
    const ex = $('#c-expr'), res = $('#c-res');
    if (calc.done) {
      ex.textContent = (calc.lastExpr || '') + ' =';
      res.textContent = TR.Calc.fmtResult(calc.ans);
      res.classList.remove('preview');
    } else {
      ex.innerHTML = F.esc(calc.expr) + '<span class="cursor"></span>';
      let prev = '0';
      res.classList.add('preview');
      if (calc.expr) {
        try {
          const v = TR.Calc.evaluate(calc.expr, { deg: calc.deg, ans: calc.ans });
          prev = TR.Calc.fmtResult(v);
        } catch (e) { prev = res.textContent === 'Fehler' ? '0' : res.textContent; }
      } else res.classList.remove('preview');
      res.textContent = prev;
    }
    const len = res.textContent.length;
    res.classList.toggle('small', len > 9 && len <= 13);
    res.classList.toggle('xs', len > 13);
    $$('.key.op').forEach((b) => b.classList.toggle('sel', !calc.done && calc.expr.slice(-1) === b.dataset.k && b.dataset.k !== '='));
  }

  // ================= Verfahren-Liste =================
  let filterCat = store.get('tr-cat', 'all');
  let query = '';
  let fromList = false;
  function renderTools() {
    const v = $('#view-tools');
    if (!v.dataset.ready) {
      v.dataset.ready = '1';
      v.innerHTML = `
        <div class="large-title">Verfahren</div>
        ${DEMO ? '<div class="demo-banner"><b>Demo-Version</b> · Jedes Verfahren ist mit Beispielwerten vorausgefüllt – ändere sie einfach und tippe auf „Berechnen“.</div>' : ''}
        <div class="search">${ICON.search}<input id="t-search" type="search" placeholder="Suchen, z. B. Median, t-Test, Zins" autocomplete="off"></div>
        <div class="section-label" style="margin-top:6px">Schnellauswahl</div>
        <div class="quick" id="t-quick">
          ${TR.cats.map((c) => `<button class="tile" data-cat="${c.id}" style="background:linear-gradient(140deg, ${c.color}, ${shade(c.color)})"><b>${c.glyph}</b><div><span>${c.short}</span><br><small>${TR.tools.filter((t) => t.cat === c.id).length} Verfahren</small></div></button>`).join('')}
        </div>
        <div class="chips" id="t-chips" style="margin-top:14px">
          <button class="chip" data-cat="all">Alle</button>
          ${TR.cats.map((c) => `<button class="chip" data-cat="${c.id}">${c.short}</button>`).join('')}
        </div>
        <div id="t-list"></div>`;
      $('#t-search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); listTools(); });
      $$('[data-cat]', v).forEach((b) => b.addEventListener('click', () => {
        filterCat = b.dataset.cat;
        store.set('tr-cat', filterCat);
        listTools();
        if (b.classList.contains('tile')) $('#t-chips').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
    listTools();
  }
  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 60), g = Math.max(0, ((n >> 8) & 255) - 60), b = Math.max(0, (n & 255) - 10);
    return `rgb(${r},${g},${b})`;
  }
  function listTools() {
    $$('#t-chips .chip').forEach((c) => c.classList.toggle('active', c.dataset.cat === filterCat));
    const words = query.split(/\s+/).filter(Boolean);
    const match = (t) => {
      if (filterCat !== 'all' && t.cat !== filterCat && !words.length) return false;
      const hay = (t.title + ' ' + t.sub + ' ' + t.keys + ' ' + cat(t.cat).name).toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const tools = TR.tools.filter(match);
    const groups = TR.cats.map((c) => ({ c, items: tools.filter((t) => t.cat === c.id) })).filter((g) => g.items.length);
    $('#t-list').innerHTML = groups.length
      ? groups.map((g) => `<div class="section-label">${g.c.name}</div><div class="card">${g.items.map((t) => `<button class="row" data-id="${t.id}">${icon(g.c)}<div class="row-text"><div class="row-title">${t.title}</div><div class="row-sub">${t.sub}</div></div>${ICON.chev}</button>`).join('')}</div>`).join('')
      : `<div class="empty">Kein Verfahren gefunden für „${F.esc(query)}“.</div>`;
    $$('#t-list .row').forEach((r) => r.addEventListener('click', () => { fromList = true; location.hash = '#/verfahren/' + r.dataset.id; }));
  }

  // ================= Verfahren-Detail =================
  function useSeg(inp) {
    return inp.type === 'select' && inp.options.length <= 3 && inp.options.every((o) => o.t.length <= 18);
  }
  function renderTool(tool, pid) {
    const v = $('#view-tool');
    const c = cat(tool.cat);
    const proj = pid ? TR.P.get(pid) : null;
    const KEY = 'tr-in-' + tool.id + (proj ? '@' + proj.id : '');
    const saved = store.get(KEY, null);
    const vals = { __names: {}, __sel: {}, __groups: null };
    tool.inputs.forEach((i) => {
      vals[i.id] = saved && saved[i.id] != null ? saved[i.id] : i.type === 'select' ? i.options[0].v : i.def || '';
    });
    if (saved) ['__names', '__sel', '__groups'].forEach((k) => saved[k] && (vals[k] = saved[k]));
    const save = () => store.set(KEY, vals);
    v.innerHTML = `
      <div class="navbar" id="tool-nav"><button class="back" id="tool-back">${ICON.back}<span>${proj ? 'Projekt' : 'Verfahren'}</span></button><div class="nav-title">${tool.title}</div></div>
      <div class="tool-head">${icon(c)}<div><h2>${tool.title}</h2><p>${tool.sub}</p></div></div>
      ${proj ? `<div class="proj-banner"><span class="ic" style="background:#64d2ff">▦</span><div><b>${F.esc(proj.name)}</b><small>Wähle unten die Spalten aus deiner Datei.</small></div><a href="#/verfahren/${tool.id}" class="pill">ohne Projekt</a></div>` : ''}
      <div class="tool-actions"><button class="pill" id="t-ex">Beispiel einsetzen</button><button class="pill" id="t-clear">Leeren</button></div>
      <form class="card" id="t-form" autocomplete="off">
        ${proj && tool.counts ? tool.counts.map((cn, k) => countPickHtml(proj, cn, k)).join('') : ''}
        ${tool.inputs.map((i) => fieldHtml(i, proj, tool)).join('')}
      </form>
      <button class="btn-primary calc-btn" id="t-go">Berechnen</button>
      <div id="t-err"></div>
      <div class="results" id="t-res"></div>`;
    const form = $('#t-form');
    const setVals = (o) => {
      tool.inputs.forEach((i) => {
        const val = o[i.id] != null ? o[i.id] : i.type === 'select' ? i.options[0].v : i.def || '';
        vals[i.id] = val;
        const el = form.querySelector(`[name="${i.id}"]`);
        if (el) el.value = val;
        $$(`.seg[data-for="${i.id}"] button`, form).forEach((b) => b.classList.toggle('on', b.dataset.v === val));
      });
      applyShow();
    };
    const read = () => {
      tool.inputs.forEach((i) => { const el = form.querySelector(`[name="${i.id}"]`); if (el) vals[i.id] = el.value; });
      return vals;
    };
    const applyShow = () => {
      tool.inputs.forEach((i) => {
        if (!i.showIf) return;
        const el = form.querySelector(`[data-field="${i.id}"]`);
        el.classList.toggle('hidden', !i.showIf(vals));
      });
    };
    setVals(vals);
    form.addEventListener('input', (e) => {
      // Handeingabe in ein Feld löst die Verbindung zur Projektspalte
      const n = e.target.name;
      if (n && vals.__names[n] && !e.target.closest('.pick')) {
        delete vals.__names[n]; delete vals.__sel[n];
        const ps = form.querySelector(`.pick[data-for="${n}"] .pick-col`);
        if (ps) ps.value = '';
      }
      read(); save();
    });
    form.addEventListener('change', () => { read(); applyShow(); });
    $$('.seg button', form).forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const id = b.parentElement.dataset.for;
      form.querySelector(`[name="${id}"]`).value = b.dataset.v;
      $$('button', b.parentElement).forEach((x) => x.classList.toggle('on', x === b));
      read(); applyShow(); save();
    }));
    $$('.acc button', form).forEach((b) => b.addEventListener('mousedown', (e) => e.preventDefault()));
    $$('.acc button', form).forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const ta = form.querySelector(`[name="${b.parentElement.dataset.for}"]`);
      insertAt(ta, b.dataset.ins);
      read(); save();
    }));
    $$('.sign', form).forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const inp = form.querySelector(`[name="${b.dataset.for}"]`);
      const s = inp.value.trim();
      inp.value = s.startsWith('-') || s.startsWith('−') ? s.slice(1) : '−' + s;
      read(); save();
    }));
    if (proj) wirePickers(tool, proj, form, vals, { setVals, read, save, applyShow });
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); run(); } });
    $('#t-ex').addEventListener('click', () => {
      vals.__names = {}; vals.__sel = {}; vals.__groups = null;
      $$('.pick select', form).forEach((s2) => (s2.value = ''));
      setVals(tool.example); save(); run();
    });
    $('#t-clear').addEventListener('click', () => {
      const empty = {};
      tool.inputs.forEach((i) => { if (i.type === 'select') empty[i.id] = vals[i.id]; else empty[i.id] = i.def || ''; });
      vals.__names = {}; vals.__sel = {}; vals.__groups = null;
      $$('.pick select', form).forEach((s2) => (s2.value = ''));
      setVals(empty);
      save();
      $('#t-res').innerHTML = ''; $('#t-err').innerHTML = '';
    });
    $('#t-go').addEventListener('click', run);
    $('#tool-back').addEventListener('click', () => {
      if (proj) { location.hash = '#/projekte/' + proj.id; return; }
      if (fromList) { fromList = false; history.back(); } else location.hash = '#/verfahren';
    });
    if (proj) { $('#tab-tools').classList.remove('active'); setTimeout(() => { $('#tab-tools').classList.remove('active'); $('#tab-projects').classList.add('active'); }); }
    function run() {
      read();
      $('#t-err').innerHTML = '';
      let res;
      try {
        res = tool.compute(TR.makeGetter(vals, tool));
      } catch (e) {
        $('#t-res').innerHTML = '';
        $('#t-err').innerHTML = `<div class="err-box">${F.esc(e instanceof TR.InputError ? e.message : 'Bei der Berechnung ist ein Fehler aufgetreten. Bitte Eingaben prüfen.')}</div>`;
        if (!(e instanceof TR.InputError)) console.error(e);
        return;
      }
      showResult(res);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      setTimeout(() => $('#t-res').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
    if (saved && tool.inputs.some((i) => i.type !== 'select' && String(saved[i.id] || '').trim())) {
      try { showResult(tool.compute(TR.makeGetter(vals, tool)), true); } catch (e) { /* unvollständig */ }
    } else if (DEMO && !proj) {
      // Demo: Beispielwerte vorausfüllen und Ergebnis direkt zeigen
      setVals(tool.example);
      try { showResult(tool.compute(TR.makeGetter(vals, tool)), true); } catch (e) { /* egal */ }
    }
  }

  // ---------- Spaltenauswahl aus einem Projekt ----------
  const opt = (v, t, sel) => `<option value="${F.esc(v)}"${sel ? ' selected' : ''}>${F.esc(t)}</option>`;
  const colOpts = (p, filterFn, ph, cur) => opt('', ph, !cur) + p.columns.filter(filterFn).map((c) => opt(c.name, c.name + (c.type === 'num' ? '  (Zahlen)' : '  (Text)'), c.name === cur)).join('');
  const isNum = (c) => c.type === 'num';
  const isAny = () => true;
  const fewValues = (p) => (c) => TR.P.distinct(p, c.name).length <= 40;
  function pairGroup(tool, id) {
    return (tool.pairs || []).find((g) => g.includes(id));
  }
  function pickHtml(i, p, tool) {
    if (i.type === 'matrix' && i.proj === 'crosstab') {
      return `<div class="pick" data-for="${i.id}" data-kind="crosstab">
        <div class="pick-row"><span>Zeilen</span><select class="pick-a">${colOpts(p, isAny, 'Merkmal wählen …')}</select></div>
        <div class="pick-row"><span>Spalten</span><select class="pick-b">${colOpts(p, isAny, 'Merkmal wählen …')}</select></div></div>`;
    }
    if (i.type === 'matrix' && i.proj === 'groups') {
      return `<div class="pick" data-for="${i.id}" data-kind="groups">
        <div class="pick-row"><span>Werte</span><select class="pick-a">${colOpts(p, isNum, 'Zahlen-Spalte wählen …')}</select></div>
        <div class="pick-row"><span>Gruppen</span><select class="pick-b">${colOpts(p, fewValues(p), 'Gruppen-Spalte wählen …')}</select></div></div>`;
    }
    const paired = !!pairGroup(tool, i.id);
    return `<div class="pick" data-for="${i.id}" data-kind="${i.type === 'text' ? 'text' : 'num'}">
      <div class="pick-row"><span>Spalte</span><select class="pick-col">${colOpts(p, i.type === 'text' ? isAny : isNum, 'aus Projekt wählen …')}</select>${paired ? '' : '<button type="button" class="pill pick-ft">Filter</button>'}</div>
      ${paired ? '' : `<div class="pick-row pick-filter hidden"><span>nur wenn</span><select class="pick-fcol">${colOpts(p, fewValues(p), 'Spalte …')}</select><span>=</span><select class="pick-fval"><option value="">Wert …</option></select></div>`}
    </div>`;
  }
  function countPickHtml(p, cn, k) {
    return `<div class="field pick-count" data-k="${k}"><label>${cn.title ? cn.title + ': ' : ''}Treffer aus Projekt zählen</label>
      <div class="pick" data-kind="count">
        <div class="pick-row"><span>Spalte</span><select class="pick-col">${colOpts(p, fewValues(p), 'Spalte wählen …')}</select></div>
        <div class="pick-row"><span>Treffer =</span><select class="pick-val"><option value="">Wert …</option></select></div>
        <div class="pick-row"><span>nur wenn</span><select class="pick-fcol">${colOpts(p, fewValues(p), '(kein Filter)')}</select><span>=</span><select class="pick-fval"><option value="">Wert …</option></select></div>
      </div><div class="hint">Zählt, wie oft der gewählte Wert vorkommt (x) und wie viele Einträge es insgesamt gibt (n).</div></div>`;
  }
  function fillValues(sel, vals) {
    sel.innerHTML = '<option value="">Wert …</option>' + vals.map((v) => opt(v, v, false)).join('');
  }
  function wirePickers(tool, p, form, vals, h) {
    const fmtList = (a) => a.map((x) => String(x).replace('.', ',')).join('; ');
    const setField = (id, text) => { const el = form.querySelector(`[name="${id}"]`); if (el) el.value = text; vals[id] = text; };
    const useData = () => {
      const m = tool.inputs.find((i) => i.id === 'mode');
      if (m && vals.mode !== 'data') {
        h.read(); vals.mode = 'data';
        form.querySelector('[name="mode"]').value = 'data';
        $$('.seg[data-for="mode"] button', form).forEach((b) => b.classList.toggle('on', b.dataset.v === 'data'));
        h.applyShow();
      }
    };
    const info = (box, txt) => {
      let el = box.querySelector('.pick-info');
      if (!el) { el = document.createElement('div'); el.className = 'pick-info'; box.appendChild(el); }
      el.textContent = txt;
    };
    function applyNum(box) {
      const id = box.dataset.for;
      const col = box.querySelector('.pick-col').value;
      const fcol = box.querySelector('.pick-fcol') ? box.querySelector('.pick-fcol').value : '';
      const fval = box.querySelector('.pick-fval') ? box.querySelector('.pick-fval').value : '';
      if (!col) { delete vals.__sel[id]; delete vals.__names[id]; h.save(); return; }
      const sel = { col, fcol: fcol && fval !== '' ? fcol : '', fval };
      vals.__sel[id] = sel;
      vals.__names[id] = TR.P.label(sel);
      const grp = pairGroup(tool, id);
      if (grp) {
        const ids = grp.filter((g) => vals.__sel[g]);
        const r = TR.P.numericColumns(p, ids.map((g) => vals.__sel[g]));
        ids.forEach((g, k) => setField(g, fmtList(r.values[k])));
        ids.forEach((g) => { const b = form.querySelector(`.pick[data-for="${g}"]`); info(b, `${r.values[0].length} vollständige Zeilen${r.dropped ? `, ${r.dropped} mit Lücken übersprungen` : ''}`); });
      } else if (box.dataset.kind === 'text') {
        const r = TR.P.textColumn(p, sel);
        setField(id, r.values.join(', '));
        info(box, `${r.values.length} Einträge übernommen`);
      } else {
        const r = TR.P.numericColumn(p, sel);
        setField(id, fmtList(r.values));
        info(box, `${r.values.length} Werte übernommen${r.dropped ? `, ${r.dropped} leere/ungültige übersprungen` : ''}`);
      }
      useData();
      h.save();
    }
    function applyMatrix(box) {
      const id = box.dataset.for;
      const a = box.querySelector('.pick-a').value, b = box.querySelector('.pick-b').value;
      vals.__sel[id] = { a, b };
      if (!a || !b) return h.save();
      if (box.dataset.kind === 'crosstab') {
        if (a === b) return info(box, 'Bitte zwei verschiedene Merkmale wählen.');
        const r = TR.P.crossCounts(p, a, b);
        setField(id, r.M.map((row) => row.join(' ')).join('\n'));
        setField('rn', r.rn.join(', '));
        setField('cn', r.cn.join(', '));
        vals.__names[id] = a + '“ und „' + b;
        info(box, `${r.rn.length} × ${r.cn.length} Tabelle erstellt`);
      } else {
        const r = TR.P.groupValues(p, a, b);
        const keep = r.groups.map((g2) => g2.length > 0);
        setField(id, r.groups.filter((_, k) => keep[k]).map((g2) => g2.map((x) => String(x).replace('.', ',')).join(' ')).join('\n'));
        vals.__groups = r.names.filter((_, k) => keep[k]);
        vals.__names[id] = a + '“ nach „' + b;
        info(box, `${vals.__groups.length} Gruppen: ${vals.__groups.join(', ')}`);
      }
      h.save();
    }
    function applyCount(box, k) {
      const cn = tool.counts[k];
      const col = box.querySelector('.pick-col').value, val = box.querySelector('.pick-val').value;
      const fcol = box.querySelector('.pick-fcol').value, fval = box.querySelector('.pick-fval').value;
      if (!col || val === '') return;
      const r = TR.P.textColumn(p, { col, fcol: fcol && fval !== '' ? fcol : '', fval });
      const x = r.values.filter((v2) => v2 === val).length;
      setField(cn.x, String(x));
      setField(cn.n, String(r.values.length));
      vals.__names[cn.x] = `${col} = ${val}` + (fcol && fval !== '' ? ` (${fcol} = ${fval})` : '');
      info(box, `x = ${x} Treffer von n = ${r.values.length}`);
      h.save();
    }
    $$('.pick', form).forEach((box) => {
      const kind = box.dataset.kind;
      if (kind === 'crosstab' || kind === 'groups') {
        const s0 = vals.__sel[box.dataset.for];
        if (s0) { box.querySelector('.pick-a').value = s0.a || ''; box.querySelector('.pick-b').value = s0.b || ''; }
        $$('select', box).forEach((s2) => s2.addEventListener('change', () => applyMatrix(box)));
        return;
      }
      if (kind === 'count') {
        const k = +box.closest('.pick-count').dataset.k;
        const colS = box.querySelector('.pick-col'), valS = box.querySelector('.pick-val');
        const fS = box.querySelector('.pick-fcol'), fvS = box.querySelector('.pick-fval');
        colS.addEventListener('change', () => { fillValues(valS, colS.value ? TR.P.distinct(p, colS.value) : []); });
        valS.addEventListener('change', () => applyCount(box, k));
        fS.addEventListener('change', () => { fillValues(fvS, fS.value ? TR.P.distinct(p, fS.value) : []); applyCount(box, k); });
        fvS.addEventListener('change', () => applyCount(box, k));
        return;
      }
      const colS = box.querySelector('.pick-col');
      const ft = box.querySelector('.pick-ft');
      const fS = box.querySelector('.pick-fcol'), fvS = box.querySelector('.pick-fval');
      const s0 = vals.__sel[box.dataset.for];
      if (s0) {
        colS.value = s0.col;
        if (s0.fcol && fS) { box.querySelector('.pick-filter').classList.remove('hidden'); fS.value = s0.fcol; fillValues(fvS, TR.P.distinct(p, s0.fcol)); fvS.value = s0.fval; }
      }
      colS.addEventListener('change', () => applyNum(box));
      if (ft) ft.addEventListener('click', () => box.querySelector('.pick-filter').classList.toggle('hidden'));
      if (fS) {
        fS.addEventListener('change', () => { fillValues(fvS, fS.value ? TR.P.distinct(p, fS.value) : []); applyNum(box); });
        fvS.addEventListener('change', () => applyNum(box));
      }
    });
  }
  function insertAt(ta, text) {
    const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    const e = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.focus();
  }
  function fieldHtml(i, proj, tool) {
    const ph = i.ph ? ` placeholder="${F.esc(i.ph)}"` : '';
    let ctrl;
    const acc = (items) => `<div class="acc" data-for="${i.id}" style="display:flex;gap:6px;margin-top:8px">${items.map(([l, ins]) => `<button class="pill" type="button" data-ins="${F.esc(ins)}">${l}</button>`).join('')}</div>`;
    if (i.type === 'select') {
      ctrl = useSeg(i)
        ? `<input type="hidden" name="${i.id}"><div class="seg" data-for="${i.id}">${i.options.map((o) => `<button type="button" data-v="${o.v}">${F.esc(o.t)}</button>`).join('')}</div>`
        : `<select name="${i.id}">${i.options.map((o) => `<option value="${o.v}">${F.esc(o.t)}</option>`).join('')}</select>`;
    } else if (i.type === 'list') {
      ctrl = `<textarea name="${i.id}" rows="3" inputmode="decimal"${ph}></textarea>` + acc([['; Trenner', '; '], ['− minus', '−'], ['Leer­zeichen', ' ']]);
    } else if (i.type === 'matrix') {
      ctrl = `<textarea name="${i.id}" rows="4" inputmode="decimal"${ph}></textarea>` + acc([['Leerzeichen', ' '], ['↵ neue Zeile', '\n'], ['−', '−']]);
    } else if (i.type === 'text') {
      ctrl = `<textarea name="${i.id}" rows="3"${ph}></textarea>`;
    } else if (i.type === 'short') {
      ctrl = `<input type="text" name="${i.id}"${ph}>`;
    } else {
      ctrl = `<div style="display:flex;gap:8px"><input type="text" inputmode="decimal" name="${i.id}"${ph}><button type="button" class="pill sign" data-for="${i.id}" style="height:46px;border-radius:12px;flex:none" aria-label="Vorzeichen">±</button></div>`;
    }
    const pick = proj && tool && TR.projectInputs(tool).includes(i) ? pickHtml(i, proj, tool) : '';
    return `<div class="field" data-field="${i.id}"><label>${F.esc(i.label)}</label>${pick}${ctrl}${i.hint ? `<div class="hint">${F.esc(i.hint)}</div>` : ''}</div>`;
  }
  function tex(t) {
    try { return window.katex ? katex.renderToString(t, { displayMode: true, throwOnError: false }) : `<code>${F.esc(t)}</code>`; }
    catch (e) { return `<code>${F.esc(t)}</code>`; }
  }
  function showResult(r, quiet) {
    const out = $('#t-res');
    let h = `<div class="card card-pad"><h3>Ergebnis</h3><div class="metrics">${r.main.map((m) => `<div class="metric${m.big ? ' big' : ''}${m.wide ? ' wide' : ''}" data-copy="${F.esc(m.value)}"><small>${F.esc(m.label)}</small><div>${F.esc(m.value)}</div></div>`).join('')}</div></div>`;
    if (r.chart) h += `<div class="card card-pad">${r.chart}</div>`;
    if (r.steps && r.steps.length) {
      h += `<div class="card card-pad"><h3>Rechenweg</h3><div class="steps">${r.steps.map((s) => `
        <div class="step"><div class="step-n"></div><div class="step-body">
          <div class="step-t">${F.esc(s.t)}</div>
          ${s.tex ? `<div class="step-tex">${tex(s.tex)}</div>` : ''}
          ${s.text ? `<div class="step-x">${F.esc(s.text)}</div>` : ''}
          ${s.mono ? `<div class="mono">${F.esc(s.mono)}</div>` : ''}
          ${s.table ? `<div class="tbl-wrap"><table><tr>${s.table.head.map((x) => `<th>${F.esc(x)}</th>`).join('')}</tr>${s.table.rows.map((row) => `<tr>${row.map((x) => `<td>${F.esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
        </div></div>`).join('')}</div></div>`;
    }
    const notes = Array.isArray(r.note) ? r.note : r.note ? [r.note] : [];
    if (notes.length) h += `<div class="card card-pad"><h3><span class="bulb">${ICON.bulb}</span>Interpretation</h3><div class="interp">${notes.map((n) => `<p>${F.esc(n)}</p>`).join('')}</div></div>`;
    out.innerHTML = h;
    out.classList.toggle('anim', !quiet);
    $$('.metric', out).forEach((m) => m.addEventListener('click', () => {
      navigator.clipboard && navigator.clipboard.writeText(m.dataset.copy).then(() => toast('Kopiert: ' + m.dataset.copy), () => {});
    }));
  }
  window.addEventListener('scroll', () => {
    $$('#tool-nav, #proj-nav').forEach((n) => n.classList.toggle('scrolled', window.scrollY > 70));
  }, { passive: true });

  // ================= Projekte =================
  const PICON = '<span class="ic" style="background:linear-gradient(140deg,#64d2ff,#0a84ff)">▦</span>';
  function renderProjects() {
    const v = $('#view-projects');
    const list = TR.P.list();
    v.innerHTML = `
      <div class="large-title">Projekte</div>
      <div class="card card-pad intro">
        <p>Lade eine <b>Excel-</b> oder <b>CSV-Datei</b> hoch und rechne direkt mit deinen Spalten – inklusive Rechenweg und Interpretation.</p>
        <button class="btn-primary" id="p-new">＋ Neues Projekt</button>
      </div>
      ${list.length ? `<div class="section-label">Meine Projekte</div><div class="card">${list.map((m) => `<button class="row" data-id="${m.id}">${PICON}<div class="row-text"><div class="row-title">${F.esc(m.name)}</div><div class="row-sub">${m.nRows} Zeilen · ${m.nCols} Spalten · ${new Date(m.created).toLocaleDateString('de-DE')}</div></div>${ICON.chev}</button>`).join('')}</div>` : '<div class="empty">Noch keine Projekte. Tippe auf „Neues Projekt“.</div>'}
      <div class="foot">Projekte werden nur auf diesem Gerät gespeichert – deine Daten verlassen das Gerät nicht.</div>`;
    $('#p-new').addEventListener('click', openNewProject);
    $$('.row[data-id]', v).forEach((r) => r.addEventListener('click', () => (location.hash = '#/projekte/' + r.dataset.id)));
  }

  function openNewProject() {
    if ($('#welcome')) return;
    const w = document.createElement('div');
    w.id = 'welcome';
    w.innerHTML = `<div class="sheet" role="dialog" aria-label="Neues Projekt">
      <div class="sheet-head"><div class="grabber"></div><h2>Neues Projekt</h2><p>Erste Zeile = Spaltennamen, darunter die Werte.</p></div>
      <div class="sheet-body">
        <div class="card">
          <div class="field"><label>Projektname</label><input type="text" id="np-name" placeholder="z. B. Umfrage Seminararbeit"></div>
          <div class="field"><label>Datei (.xlsx oder .csv)</label>
            <label class="file-btn"><input type="file" id="np-file" accept=".xlsx,.xlsm,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">📄 Datei auswählen</label>
            <div class="hint" id="np-fname">Oder unten Daten aus Excel einfügen.</div>
            <button type="button" class="pill" id="np-sample" style="margin-top:8px">Beispieldatei verwenden</button>
          </div>
          <div class="field"><label>… oder Daten einfügen (aus Excel kopieren)</label><textarea id="np-paste" rows="4" placeholder="Spalte1&#9;Spalte2&#10;1,5&#9;ja&#10;2,0&#9;nein"></textarea></div>
          <div class="field hidden" id="np-sheet-f"><label>Tabellenblatt</label><select id="np-sheet"></select></div>
        </div>
        <div id="np-err"></div>
        <div id="np-prev"></div>
      </div>
      <div class="sheet-foot"><div style="display:flex;gap:10px"><button class="btn-soft" id="np-cancel" style="height:54px">Abbrechen</button><button class="btn-primary" id="np-go" disabled>Projekt anlegen</button></div></div>
    </div>`;
    document.body.appendChild(w);
    let sheets = null, table = null, source = '';
    const err = (m) => ($('#np-err').innerHTML = m ? `<div class="err-box">${F.esc(m)}</div>` : '');
    const preview = () => {
      err('');
      table = null;
      $('#np-go').disabled = true;
      $('#np-prev').innerHTML = '';
      try {
        let raw;
        if (sheets) raw = sheets[+$('#np-sheet').value || 0].rows;
        else if ($('#np-paste').value.trim()) { raw = TR.P.readDelimited($('#np-paste').value); source = 'eingefügt'; }
        else return;
        table = TR.P.buildTable(raw);
      } catch (e) { err(e instanceof TR.InputError ? e.message : 'Die Daten konnten nicht gelesen werden.'); return; }
      $('#np-go').disabled = false;
      $('#np-prev').innerHTML = `<div class="section-label">Vorschau · ${table.rows.length} Zeilen</div>
        <div class="card card-pad">${colChips(table.columns)}${dataTable(table, 6)}${table.truncated ? `<div class="hint">Es werden höchstens ${TR.P.MAX_ROWS} Zeilen übernommen.</div>` : ''}</div>`;
    };
    const loadFile = async (file) => {
      err('');
      try {
        sheets = await TR.P.readFile(file);
        if (!sheets.length) throw new TR.InputError('Die Datei enthält keine Daten.');
        source = file.name;
        $('#np-fname').textContent = '✓ ' + file.name;
        if (!$('#np-name').value) $('#np-name').value = file.name.replace(/\.[^.]+$/, '');
        $('#np-sheet').innerHTML = sheets.map((sh, i) => opt(i, sh.name, i === 0)).join('');
        $('#np-sheet-f').classList.toggle('hidden', sheets.length < 2);
        $('#np-paste').value = '';
        preview();
      } catch (e) { sheets = null; err(e instanceof TR.InputError ? e.message : 'Die Datei konnte nicht gelesen werden. Bitte als .xlsx oder .csv speichern.'); }
    };
    $('#np-file').addEventListener('change', (e) => e.target.files[0] && loadFile(e.target.files[0]));
    $('#np-sample').addEventListener('click', async () => {
      try {
        const res = await fetch('beispiel/beispiel-projekt.xlsx');
        const blob = await res.blob();
        await loadFile(new File([blob], 'beispiel-projekt.xlsx'));
        $('#np-name').value = 'Beispiel: Filialen';
      } catch (e) { err('Die Beispieldatei konnte nicht geladen werden (nur online verfügbar).'); }
    });
    $('#np-paste').addEventListener('input', () => { sheets = null; $('#np-sheet-f').classList.add('hidden'); $('#np-fname').textContent = 'Oder unten Daten aus Excel einfügen.'; preview(); });
    $('#np-sheet').addEventListener('change', preview);
    const close = () => w.remove();
    $('#np-cancel').addEventListener('click', close);
    $('#np-go').addEventListener('click', () => {
      if (!table) return;
      try {
        const pr = TR.P.create($('#np-name').value.trim() || 'Mein Projekt', table, source);
        close();
        location.hash = '#/projekte/' + pr.id;
      } catch (e) { err(e.message); }
    });
  }
  function colChips(cols) {
    return `<div class="colchips">${cols.map((c) => `<span class="colchip ${c.type}"><i>${c.type === 'num' ? '123' : 'Abc'}</i>${F.esc(c.name)}</span>`).join('')}</div>`;
  }
  function dataTable(p, max) {
    const rows = p.rows.slice(0, max);
    const cell = (v) => (v == null ? '<span class="na">–</span>' : typeof v === 'number' ? F.esc(TR.F.fmt(v, 6)) : F.esc(v));
    return `<div class="tbl-wrap"><table class="data"><tr><th>#</th>${p.columns.map((c) => `<th>${F.esc(c.name)}</th>`).join('')}</tr>${rows.map((r, i) => `<tr><td>${i + 1}</td>${r.map((v) => `<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</table></div>${p.rows.length > max ? `<div class="hint">… und ${p.rows.length - max} weitere Zeilen</div>` : ''}`;
  }
  function quickAnalysis(p) {
    const S = TR.S;
    const nums = p.columns.map((c, j) => ({ c, j })).filter((x) => x.c.type === 'num');
    const cats = p.columns.map((c, j) => ({ c, j })).filter((x) => x.c.type === 'cat');
    let h = '';
    const notes = [];
    if (nums.length) {
      const rows = nums.map(({ c, j }) => {
        const v = p.rows.map((r) => r[j]).filter((x) => typeof x === 'number');
        if (v.length < 2) return [c.name, v.length, '–', '–', '–', '–', '–'];
        const m = S.mean(v), md = S.quantileEmp(v, 0.5).value, sd = S.sd(v), s = S.sorted(v);
        notes.push(`„${c.name}“: im Mittel ${F.fmt(m)} (Median ${F.fmt(md)}), typische Abweichung ±${F.fmt(sd)}, Bereich ${F.fmt(s[0])} bis ${F.fmt(s[s.length - 1])}${m > md * 1.05 ? ' – eher rechtsschief' : m < md * 0.95 ? ' – eher linksschief' : ''}.`);
        return [c.name, v.length, F.fmt(m), F.fmt(md), F.fmt(sd), F.fmt(s[0]), F.fmt(s[s.length - 1])];
      });
      h += `<div class="step-t">Zahlen-Spalten</div><div class="tbl-wrap"><table><tr><th>Spalte</th><th>n</th><th>Mittelwert</th><th>Median</th><th>sd</th><th>Min</th><th>Max</th></tr>${rows.map((r) => `<tr>${r.map((x) => `<td>${F.esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    }
    if (cats.length) {
      const rows = cats.map(({ c, j }) => {
        const v = p.rows.map((r) => r[j]).filter((x) => x != null);
        const mo = S.modes(v);
        const k = mo.counts.size;
        if (k <= 12) notes.push(`„${c.name}“: ${k} Kategorien, am häufigsten „${mo.values[0]}“ (${F.pct(mo.count / v.length, 1)}).`);
        return [c.name, v.length, k, String(mo.values[0]), F.pct(mo.count / v.length, 1)];
      });
      h += `<div class="step-t" style="margin-top:14px">Text-Spalten (Kategorien)</div><div class="tbl-wrap"><table><tr><th>Spalte</th><th>n</th><th>Kategorien</th><th>häufigste</th><th>Anteil</th></tr>${rows.map((r) => `<tr>${r.map((x) => `<td>${F.esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    }
    return { html: h, notes };
  }
  function renderProject(id) {
    const v = $('#view-project');
    const p = TR.P.get(id);
    if (!p) { v.innerHTML = `<div class="navbar"><button class="back" onclick="location.hash='#/projekte'">${ICON.back}<span>Projekte</span></button></div><div class="empty">Projekt nicht gefunden.</div>`; return; }
    const qa = quickAnalysis(p);
    const tools = TR.tools.filter(TR.supportsProject);
    const groups = TR.cats.map((c) => ({ c, items: tools.filter((t) => t.cat === c.id) })).filter((g) => g.items.length);
    v.innerHTML = `
      <div class="navbar" id="proj-nav"><button class="back" id="pr-back">${ICON.back}<span>Projekte</span></button><div class="nav-title">${F.esc(p.name)}</div></div>
      <div class="tool-head">${PICON.replace('class="ic"', 'class="ic" ')}<div><h2>${F.esc(p.name)}</h2><p>${p.rows.length} Zeilen · ${p.columns.length} Spalten${p.source ? ' · ' + F.esc(p.source) : ''}</p></div></div>
      <div class="tool-actions"><button class="pill" id="pr-ren">Umbenennen</button><button class="pill danger" id="pr-del">Löschen</button></div>
      <div class="card card-pad"><h3>Daten</h3>${colChips(p.columns)}${dataTable(p, 30)}</div>
      <div class="card card-pad"><h3>Schnellanalyse</h3>${qa.html}</div>
      ${qa.notes.length ? `<div class="card card-pad"><h3><span class="bulb">${ICON.bulb}</span>Interpretation</h3><div class="interp">${qa.notes.map((n) => `<p>${F.esc(n)}</p>`).join('')}</div></div>` : ''}
      <div class="section-label">Mit diesen Daten rechnen</div>
      ${groups.map((g) => `<div class="section-label sub">${g.c.name}</div><div class="card">${g.items.map((t) => `<button class="row" data-tool="${t.id}">${icon(g.c)}<div class="row-text"><div class="row-title">${t.title}</div><div class="row-sub">${t.sub}</div></div>${ICON.chev}</button>`).join('')}</div>`).join('')}`;
    $('#pr-back').addEventListener('click', () => (location.hash = '#/projekte'));
    $('#pr-ren').addEventListener('click', () => {
      const n = prompt('Neuer Projektname:', p.name);
      if (n && n.trim()) { TR.P.rename(p.id, n.trim()); renderProject(p.id); }
    });
    $('#pr-del').addEventListener('click', () => {
      if (confirm(`Projekt „${p.name}“ wirklich löschen?`)) { TR.P.remove(p.id); location.hash = '#/projekte'; }
    });
    $$('.row[data-tool]', v).forEach((r) => r.addEventListener('click', () => (location.hash = `#/verfahren/${r.dataset.tool}/${p.id}`)));
  }

  // ================= Anleitung & Einstellungen =================
  const G = window.TR_GUIDE || { pdf: 'guide/anleitung.pdf', pages: [] };
  const pagesHtml = () => (G.pages.length ? G.pages.map((p, i) => `<img class="guide-page" src="${p}" alt="Anleitung Seite ${i + 1}" loading="${i < 2 ? 'eager' : 'lazy'}">`).join('') : '<div class="empty">Die Anleitung wird geladen …</div>');
  function renderGuide() {
    const v = $('#view-guide');
    const theme = store.get('tr-theme', 'auto');
    v.innerHTML = `
      <div class="large-title">Anleitung</div>
      <div class="guide-actions">
        <a class="btn-soft" href="${G.pdf}" target="_blank" rel="noopener">PDF öffnen</a>
        <a class="btn-soft" href="${G.pdf}" download>PDF speichern</a>
      </div>
      ${pagesHtml()}
      <div class="section-label">Einstellungen</div>
      <div class="card">
        <div class="setting-row"><span>Darstellung</span><div class="seg" id="s-theme">${[['auto', 'Auto'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button data-v="${k}" class="${theme === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <button class="setting-row" id="s-welcome" style="width:100%;text-align:left">Kurzanleitung beim Start erneut zeigen</button>
        ${DEMO ? '' : '<button class="setting-row danger" id="s-logout" style="width:100%;text-align:left">Abmelden</button>'}
      </div>
      <div class="foot">${TR.tools.length} Verfahren · funktioniert auch offline</div>`;
    $$('#s-theme button').forEach((b) => b.addEventListener('click', () => {
      store.set('tr-theme', b.dataset.v);
      try { localStorage.setItem('tr-theme', b.dataset.v); } catch (e) { /* egal */ }
      if (b.dataset.v === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', b.dataset.v);
      $$('#s-theme button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $('#s-welcome').addEventListener('click', DEMO ? openDemoWelcome : openWelcome);
    if ($('#s-logout')) $('#s-logout').addEventListener('click', () => { TR.Auth.logout(); showLogin(); });
  }
  function openDemoWelcome() {
    if ($('#welcome')) return;
    const w = document.createElement('div');
    w.id = 'welcome';
    const feat = [
      ['Σ', 'Taschenrechner', 'Wie auf dem Handy – plus wissenschaftliche Funktionen und Verlauf.'],
      ['β', `${TR.tools.length} Rechenverfahren`, 'Statistik und Finanzmathematik mit Schnellauswahl und Suche.'],
      ['1·2·3', 'Rechenweg Schritt für Schritt', 'Formeln, Tabellen, Diagramme – und eine Interpretation in Worten.'],
      ['▦', 'Eigene Excel-Daten', 'Im Tab „Projekte“ eine Datei hochladen und mit den Spalten rechnen.'],
    ];
    w.innerHTML = `<div class="sheet demo-sheet" role="dialog" aria-label="Demo">
      <div class="sheet-head"><div class="grabber"></div><h2>StatRechner · Demo</h2><p>Alle Funktionen frei ausprobieren – ohne Anmeldung.</p></div>
      <div class="sheet-body">
        <div class="card">${feat.map(([g, t, d]) => `<div class="row" style="cursor:default"><span class="ic" style="background:linear-gradient(140deg,#0a84ff,#5e5ce6);font-size:${g.length > 2 ? 11 : 17}px">${g}</span><div class="row-text"><div class="row-title">${t}</div><div class="row-sub" style="white-space:normal">${d}</div></div></div>`).join('')}</div>
        <p class="foot">Alle Beispielwerte sind frei erfunden. Eingaben und Projekte bleiben nur in deinem Browser.</p>
      </div>
      <div class="sheet-foot"><button class="btn-primary" id="w-go">Ausprobieren</button></div>
    </div>`;
    document.body.appendChild(w);
    const close = () => { store.set('tr-welcomed', true); w.remove(); };
    $('#w-go').addEventListener('click', close);
    w.addEventListener('click', (e) => { if (e.target === w) close(); });
  }
  function openWelcome() {
    if ($('#welcome')) return;
    const w = document.createElement('div');
    w.id = 'welcome';
    w.innerHTML = `<div class="sheet" role="dialog" aria-label="Kurzanleitung">
      <div class="sheet-head"><div class="grabber"></div><h2>Willkommen 👋</h2><p>So funktioniert dein Rechner – in wenigen Schritten.</p></div>
      <div class="sheet-body">${pagesHtml()}</div>
      <div class="sheet-foot"><button class="btn-primary" id="w-go">Los geht’s</button></div>
    </div>`;
    document.body.appendChild(w);
    const close = () => { store.set('tr-welcomed', true); w.remove(); };
    $('#w-go').addEventListener('click', close);
    w.addEventListener('click', (e) => { if (e.target === w) close(); });
  }

  // ================= Start =================
  if (TR.Auth.isLoggedIn()) showApp(); else showLogin();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
