// Erzeugt die bebilderte Anleitung (PDF + Seitenbilder) aus echten Screenshots der App.
// Voraussetzung: App läuft lokal, z. B.  npx http-server docs -p 8765
// Aufruf:  NODE_PATH=$(npm root -g) node scripts/build-guide.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const URL = process.env.APP_URL || 'http://localhost:8765/';
const ROOT = path.join(__dirname, '..');
const OUT = process.env.OUT_DIR || path.join(ROOT, 'docs', 'guide');
const DEMO = !!process.env.DEMO; // Demo-Version: keine Login-Seite
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'guide-'));

const shots = {};
async function mark(p, items) {
  await p.evaluate((items) => {
    document.querySelectorAll('.__mk').forEach((e) => e.remove());
    items.forEach(({ sel, n, at }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ring = document.createElement('div');
      ring.className = '__mk';
      Object.assign(ring.style, { position: 'fixed', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px', border: '3px solid #ff9f0a', borderRadius: '16px', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 0 0 4px rgba(255,159,10,.25)' });
      const dot = document.createElement('div');
      dot.className = '__mk';
      dot.textContent = n;
      const x = at === 'left' ? r.left - 14 : r.right - 14, y = r.top - 14;
      Object.assign(dot.style, { position: 'fixed', left: Math.max(2, Math.min(window.innerWidth - 32, x)) + 'px', top: Math.max(2, y) + 'px', width: '30px', height: '30px', borderRadius: '50%', background: '#ff9f0a', color: '#fff', font: '700 17px -apple-system,Helvetica,Arial', display: 'grid', placeItems: 'center', zIndex: 10000, boxShadow: '0 2px 8px rgba(0,0,0,.4)' });
      document.body.appendChild(ring);
      document.body.appendChild(dot);
    });
  }, items);
}
const clearMarks = (p) => p.evaluate(() => document.querySelectorAll('.__mk').forEach((e) => e.remove()));
async function shot(p, name) {
  const f = path.join(tmp, name + '.png');
  await p.screenshot({ path: f });
  shots[name] = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
}
async function scrollTo(p, sel, offset = 70) {
  await p.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o); }, [sel, offset]);
  await p.waitForTimeout(250);
}

(async () => {
  const b = await chromium.launch();
  const mk = async () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' });

  // --- Login ---
  let ctx = await mk();
  let p = await ctx.newPage();
  await p.goto(URL);
  await p.waitForTimeout(600);
  if (!DEMO) {
  await p.fill('#pw', 'geheim');
  await mark(p, [{ sel: '.pw-wrap', n: 1, at: 'left' }, { sel: '.login-card .btn-primary', n: 2, at: 'left' }]);
  await shot(p, 'login');
  await clearMarks(p);
  // Anmeldung ohne Passwort-Kenntnis: gespeicherten Hash setzen und neu laden
  await p.evaluate(() => localStorage.setItem('tr-login', window.TR_CONFIG.passwordHash));
  await p.reload();
  await p.waitForTimeout(900);
  }
  await mark(p, [{ sel: '#w-go', n: 3, at: 'left' }]);
  await shot(p, 'welcome');
  await p.click('#w-go');

  // --- Rechner ---
  await p.evaluate(() => localStorage.setItem('tr-sci', 'false'));
  for (const k of ['1', '2', '5', '×', '1', ',', '1', '9']) await p.click(`.keys .key[data-k="${k}"]`);
  await mark(p, [{ sel: '#c-display', n: 1, at: 'left' }, { sel: '.keys', n: 2, at: 'left' }, { sel: '#c-hist', n: 3, at: 'right' }, { sel: '#c-sci', n: 4, at: 'left' }]);
  await shot(p, 'calc');
  await clearMarks(p);
  await p.click('.keys .key[data-k="="]');
  await p.click('#c-sci');
  await p.click('.keys .key[data-k="AC"]');
  for (const k of ['√', '2', '5', ')', '+', 'x²']) await p.click(`.key[data-k="${k}"]`);
  await p.evaluate(() => { const e = document.querySelector('#c-expr'); });
  await mark(p, [{ sel: '#c-scipad', n: 5, at: 'left' }, { sel: '#c-deg', n: 6, at: 'left' }]);
  await shot(p, 'calcsci');
  await clearMarks(p);
  await p.click('.keys .key[data-k="AC"]');
  await p.click('#c-sci');

  // --- Verfahren ---
  await p.goto(URL + '#/verfahren');
  await p.waitForTimeout(500);
  await mark(p, [{ sel: '.search', n: 1, at: 'left' }, { sel: '#t-quick', n: 2, at: 'left' }]);
  await shot(p, 'tools');
  await clearMarks(p);
  await scrollTo(p, '#t-chips', 60);
  await mark(p, [{ sel: '#t-chips', n: 3, at: 'left' }, { sel: '#t-list .row', n: 4, at: 'left' }]);
  await shot(p, 'tools2');
  await clearMarks(p);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.fill('#t-search', 'median');
  await p.waitForTimeout(300);
  await mark(p, [{ sel: '#t-list .row', n: 5, at: 'left' }]);
  await shot(p, 'search');
  await clearMarks(p);
  await p.fill('#t-search', '');

  // --- Klickstrecke: Lagemaße ---
  await p.goto(URL + '#/verfahren/lagemasse');
  await p.waitForTimeout(400);
  await p.fill('textarea[name="x"]', '');
  await mark(p, [{ sel: 'textarea[name="x"]', n: 1, at: 'left' }, { sel: '#t-ex', n: 2, at: 'right' }]);
  await shot(p, 'k1');
  await clearMarks(p);
  await p.fill('textarea[name="x"]', '4; 7; 7; 9; 12; 15');
  await p.dispatchEvent('textarea[name="x"]', 'input');
  await mark(p, [{ sel: '.acc', n: 3, at: 'right' }, { sel: '#t-go', n: 4, at: 'left' }]);
  await shot(p, 'k2');
  await clearMarks(p);
  await p.click('#t-go');
  await p.waitForTimeout(900);
  await scrollTo(p, '#t-res', 56);
  await mark(p, [{ sel: '.metric.big', n: 5, at: 'right' }]);
  await shot(p, 'k3');
  await clearMarks(p);
  await scrollTo(p, '.steps', 110);
  await mark(p, [{ sel: '.step', n: 6, at: 'right' }]);
  await shot(p, 'k4');
  await clearMarks(p);

  // --- Klickstrecke: Normalverteilung ---
  await p.goto(URL + '#/verfahren');
  await p.waitForTimeout(400);
  await mark(p, [{ sel: '.tile[data-cat="norm"]', n: 1, at: 'right' }]);
  await shot(p, 'n1');
  await clearMarks(p);
  await p.click('.tile[data-cat="norm"]');
  await p.waitForTimeout(700);
  await scrollTo(p, '#t-chips', 60);
  await mark(p, [{ sel: '.row[data-id="normwk"]', n: 2, at: 'left' }]);
  await shot(p, 'n2');
  await clearMarks(p);
  await p.click('.row[data-id="normwk"]');
  await p.waitForTimeout(500);
  await p.fill('input[name="mu"]', '60');
  await p.fill('input[name="sd"]', '12');
  await p.selectOption('select[name="mode"]', 'ge');
  await p.fill('input[name="a"]', '75');
  await p.dispatchEvent('input[name="a"]', 'input');
  await mark(p, [{ sel: '[data-field="mu"]', n: 3, at: 'right' }, { sel: '[data-field="mode"]', n: 4, at: 'right' }, { sel: '[data-field="a"]', n: 5, at: 'right' }]);
  await shot(p, 'n3');
  await clearMarks(p);
  await p.click('#t-go');
  await p.waitForTimeout(900);
  await scrollTo(p, '#t-res', 56);
  await mark(p, [{ sel: '#t-res .card:nth-child(2)', n: 6, at: 'right' }]);
  await shot(p, 'n4');
  await clearMarks(p);

  // --- Klickstrecke: Test ---
  await p.goto(URL + '#/verfahren/ttest2');
  await p.waitForTimeout(400);
  await mark(p, [{ sel: '[data-field="mode"]', n: 1, at: 'right' }]);
  await shot(p, 't1');
  await clearMarks(p);
  await p.click('#t-ex');
  await p.waitForTimeout(1200);
  await scrollTo(p, '#t-res', 56);
  await mark(p, [{ sel: '.metric.big', n: 2, at: 'right' }]);
  await shot(p, 't2');
  await clearMarks(p);
  const decY = await p.evaluate(() => { const s = [...document.querySelectorAll('.step')].pop(); s.id = '__dec'; return 1; });
  void decY;
  await scrollTo(p, '#__dec', 300);
  await mark(p, [{ sel: '#__dec', n: 3, at: 'right' }]);
  await shot(p, 't3');
  await clearMarks(p);

  // --- Projekte ---
  await p.goto(URL + '#/projekte');
  await p.waitForTimeout(400);
  await mark(p, [{ sel: '#p-new', n: 1, at: 'right' }]);
  await shot(p, 'pr1');
  await clearMarks(p);
  await p.click('#p-new');
  await p.waitForTimeout(300);
  await p.click('#np-sample');
  await p.waitForTimeout(900);
  await mark(p, [{ sel: '.file-btn', n: 2, at: 'right' }, { sel: '#np-go', n: 3, at: 'left' }]);
  await shot(p, 'pr2');
  await clearMarks(p);
  await p.click('#np-go');
  await p.waitForTimeout(700);
  const pid = (await p.evaluate(() => location.hash)).split('/')[2];
  await scrollTo(p, '.row[data-tool]', 200);
  await mark(p, [{ sel: '.row[data-tool="regression"]', n: 4, at: 'right' }]);
  await shot(p, 'pr3');
  await clearMarks(p);
  await p.goto(URL + '#/verfahren/regression/' + pid);
  await p.waitForTimeout(400);
  await p.selectOption('.pick[data-for="x"] .pick-col', 'Werbebudget');
  await p.selectOption('.pick[data-for="y"] .pick-col', 'Umsatz');
  await scrollTo(p, '.pick[data-for="x"]', 120);
  await mark(p, [{ sel: '.pick[data-for="x"]', n: 5, at: 'right' }, { sel: '.pick[data-for="y"]', n: 6, at: 'right' }]);
  await shot(p, 'pr4');
  await clearMarks(p);
  await p.click('#t-go');
  await p.waitForTimeout(900);
  await p.evaluate(() => { const c = document.querySelector('.interp').closest('.card'); c.id = '__int'; });
  await scrollTo(p, '#__int', 120);
  await mark(p, [{ sel: '#__int', n: 7, at: 'right' }]);
  await shot(p, 'pr5');
  await clearMarks(p);
  await p.evaluate((id) => { const l = JSON.parse(localStorage.getItem('tr-projects') || '[]').filter((x) => x.id !== id); localStorage.setItem('tr-projects', JSON.stringify(l)); localStorage.removeItem('tr-proj-' + id); }, pid);

  // --- Finanzen ---
  await p.goto(URL + '#/verfahren/zinseszins');
  await p.waitForTimeout(400);
  await p.click('#t-ex');
  await p.waitForTimeout(800);
  await scrollTo(p, '#t-res', 56);
  await shot(p, 'f1');

  // --- Anleitung-Tab ---
  await p.goto(URL + '#/anleitung');
  await p.waitForTimeout(400);
  await mark(p, [{ sel: '.guide-actions', n: 1, at: 'right' }]);
  await shot(p, 'g1');

  const tools = await p.evaluate(() => window.TR.tools.map((t) => ({ cat: window.TR.cats.find((c) => c.id === t.cat), title: t.title, sub: t.sub })));
  await ctx.close();

  // ===== Dokument zusammensetzen =====
  const phone = (k, cap) => `<figure class="ph"><img src="${shots[k]}"><figcaption>${cap || ''}</figcaption></figure>`;
  const arrow = '<div class="arr">→</div>';
  const strip = (items) => `<div class="strip">${items.map(([k, c], i) => (i ? arrow : '') + phone(k, c)).join('')}</div>`;
  const steps = (arr) => `<ol class="st">${arr.map((s) => `<li>${s}</li>`).join('')}</ol>`;
  const page = (num, title, body, cls = '') => `<section class="page ${cls}"><header><span class="num">${num}</span><h2>${title}</h2></header>${body}<footer>StatRechner · Kurzanleitung</footer></section>`;
  const byCat = {};
  tools.forEach((t) => (byCat[t.cat.name] = byCat[t.cat.name] || { c: t.cat, items: [] }).items.push(t));

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1d1f; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; padding: 16mm 15mm 14mm; position: relative; page-break-after: always; overflow: hidden; background: #fff; }
  header { display: flex; align-items: center; gap: 12px; margin-bottom: 8mm; }
  .num { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #0a84ff, #5e5ce6); color: #fff; font-weight: 700; display: grid; place-items: center; font-size: 18px; }
  h2 { margin: 0; font-size: 26px; letter-spacing: -0.4px; }
  footer { position: absolute; bottom: 8mm; left: 15mm; right: 15mm; font-size: 10px; color: #8e8e93; border-top: 0.5px solid #e5e5ea; padding-top: 3mm; }
  p, li { font-size: 13px; line-height: 1.5; }
  .lead { font-size: 14px; color: #3a3a3c; margin: 0 0 6mm; }
  .strip { display: flex; align-items: center; justify-content: center; gap: 2mm; margin: 2mm 0 5mm; }
  .ph { margin: 0; text-align: center; }
  .ph img { width: 40mm; border-radius: 6mm; box-shadow: 0 0 0 1.2mm #1c1c1e, 0 3mm 8mm rgba(0,0,0,.25); display: block; margin: 0 auto; }
  .big .ph img { width: 50mm; }
  .ph figcaption { font-size: 10.5px; color: #3a3a3c; margin-top: 3.5mm; max-width: 44mm; line-height: 1.35; }
  .arr { font-size: 22px; color: #ff9f0a; font-weight: 700; margin-bottom: 10mm; }
  .st { margin: 0; padding: 0; list-style: none; counter-reset: s; columns: 2; column-gap: 8mm; }
  .st.one { columns: 1; }
  .st li { counter-increment: s; position: relative; padding-left: 30px; margin-bottom: 3mm; break-inside: avoid; }
  .st li::before { content: counter(s); position: absolute; left: 0; top: 0; width: 21px; height: 21px; border-radius: 50%; background: #ff9f0a; color: #fff; font-weight: 700; font-size: 12px; display: grid; place-items: center; }
  .box { background: #f2f2f7; border-radius: 4mm; padding: 4mm 5mm; margin-top: 4mm; }
  .box h4 { margin: 0 0 2mm; font-size: 14px; }
  .box ul { margin: 0; padding-left: 18px; }
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: radial-gradient(circle at 20% 10%, #0a3a7a, transparent 55%), radial-gradient(circle at 90% 95%, #4b1f73, transparent 55%), #000; color: #fff; }
  .icon { width: 34mm; height: 34mm; border-radius: 9mm; background: linear-gradient(145deg,#1c1c1e,#3a3a3c); position: relative; overflow: hidden; display: grid; place-items: center; box-shadow: 0 6mm 18mm rgba(10,132,255,.45); }
  .icon::before { content:''; position:absolute; inset:0; background: radial-gradient(circle at 30% 20%, rgba(10,132,255,.9), transparent 60%), radial-gradient(circle at 80% 90%, rgba(191,90,242,.85), transparent 55%); }
  .icon span { position: relative; font-size: 18mm; font-weight: 600; }
  .cover h1 { font-size: 46px; margin: 10mm 0 2mm; letter-spacing: -1px; }
  .cover p { font-size: 17px; color: rgba(255,255,255,.75); margin: 0; }
  .toc { margin-top: 16mm; text-align: left; background: rgba(255,255,255,.08); border-radius: 6mm; padding: 7mm 10mm; width: 120mm; }
  .toc div { display: flex; justify-content: space-between; font-size: 14px; padding: 1.6mm 0; border-bottom: 0.5px solid rgba(255,255,255,.12); }
  .toc div:last-child { border: 0; }
  .cover footer { color: rgba(255,255,255,.4); border-color: rgba(255,255,255,.15); }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  td { padding: 1.05mm 2mm; border-bottom: 0.5px solid #e5e5ea; vertical-align: top; }
  td:first-child { font-weight: 600; width: 62mm; }
  .cat { display: flex; align-items: center; gap: 8px; margin: 3.5mm 0 1mm; font-weight: 700; font-size: 14px; }
  .cat i { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; color: #fff; font: italic 700 13px Georgia, serif; }
  .nofoot footer { display: none; }
  .nofoot header { margin-bottom: 4mm; }
  .compact .ph img { width: 35mm; }
  .compact .strip { margin: 0 0 3mm; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: start; }
  </style></head><body>
  <section class="page cover">
    <div class="icon"><span>Σ</span></div>
    <h1>StatRechner</h1>
    <p>Kurzanleitung mit Klickstrecken</p>
    <div class="toc">
      ${[DEMO ? 'Start & als App speichern' : 'Anmelden & als App speichern', 'Der Taschenrechner', 'Verfahren finden', 'Klickstrecke: Rechnen mit Rechenweg', 'Klickstrecke: Normalverteilung', 'Klickstrecke: Hypothesentest', 'Eigene Projekte mit Excel', 'Eingabe-Tipps', 'Alle Verfahren im Überblick'].map((t, i) => `<div><span>${i + 1}&nbsp;&nbsp;${t}</span><span>${i + 2}</span></div>`).join('')}
    </div>
    <footer>Alle Berechnungen laufen direkt im Browser – auch offline.</footer>
  </section>

  ${page(1, DEMO ? 'Start &amp; als App speichern' : 'Anmelden &amp; als App speichern', `
    <p class="lead">Öffne den Link im Browser (Safari auf dem iPhone, Chrome auf Android).</p>
    <div class="strip big">${DEMO ? phone('welcome', 'Beim ersten Start erscheint eine kurze Übersicht – mit „Ausprobieren“ (3) geht es los.') : phone('login', 'Passwort eingeben (1) und auf „Entsperren“ tippen (2).') + arrow + phone('welcome', 'Beim ersten Start erscheint diese Anleitung – mit „Los geht’s“ (3) geht es zum Rechner.')}</div>
    <div class="two">
      <div class="box"><h4>iPhone (Safari)</h4><ul><li>Unten auf <b>Teilen</b> tippen (Quadrat mit Pfeil)</li><li><b>„Zum Home-Bildschirm“</b> wählen</li><li><b>Hinzufügen</b> – fertig, der Rechner startet wie eine App</li></ul></div>
      <div class="box"><h4>Android (Chrome)</h4><ul><li>Oben rechts auf <b>⋮</b> tippen</li><li><b>„App installieren“</b> bzw. „Zum Startbildschirm hinzufügen“</li><li>Bestätigen – das Icon liegt auf dem Startbildschirm</li></ul></div>
    </div>
    <div class="box"><h4>Gut zu wissen</h4><ul>${DEMO ? '<li>In der Demo ist jedes Verfahren mit Beispielwerten vorausgefüllt.</li>' : '<li>Das Passwort musst du nur einmal pro Gerät eingeben.</li>'}<li>Nach dem ersten Öffnen funktioniert der Rechner auch ohne Internet.</li>${DEMO ? '' : '<li>Abmelden: Tab <b>Anleitung</b> → <b>Abmelden</b>.</li>'}</ul></div>
  `)}

  ${page(2, 'Der Taschenrechner', `
    <p class="lead">Der Tab <b>Rechner</b> funktioniert wie der Rechner auf deinem Handy – die ganze Rechnung bleibt sichtbar und das Ergebnis wird schon beim Tippen angezeigt.</p>
    <div class="strip big">${phone('calc', 'Normale Ansicht')}${arrow}${phone('calcsci', 'Mit wissenschaftlichen Funktionen')}</div>
    ${steps([
      '<b>Anzeige:</b> oben die Rechnung, darunter das Ergebnis (grau = Vorschau). Antippen kopiert das Ergebnis.',
      '<b>Tasten:</b> Punkt- vor Strichrechnung wird beachtet. <b>⌫</b> löscht das letzte Zeichen, <b>AC</b> alles, <b>±</b> wechselt das Vorzeichen.',
      '<b>Verlauf:</b> zeigt die letzten 30 Rechnungen. Ein Ergebnis antippen, um damit weiterzurechnen.',
      '<b>f(x):</b> blendet Klammern, Potenzen, Wurzel, sin/cos/tan, ln/log, π, e, n! und 1/x ein.',
      '<b>Funktionsleiste:</b> „Ans“ setzt das letzte Ergebnis ein. Beispiel: 200 + 10 % = 220.',
      '<b>DEG/RAD:</b> Winkel in Grad oder im Bogenmaß.',
    ])}
  `)}

  ${page(3, 'Verfahren finden', `
    <p class="lead">Im Tab <b>Verfahren</b> findest du alle Rechenverfahren – sortiert nach Themen.</p>
    <div class="strip">${phone('tools', 'Suche (1) und Schnellauswahl nach Thema (2)')}${arrow}${phone('tools2', 'Filter (3) und Liste – Verfahren antippen (4)')}${arrow}${phone('search', 'Suche nach „median“ – Treffer antippen (5)')}</div>
    ${steps([
      '<b>Suche:</b> Stichwort eingeben, z. B. „Median“, „t-Test“, „Konfidenz“, „Zins“.',
      '<b>Schnellauswahl:</b> Eine Kachel antippen, um nur dieses Thema anzuzeigen.',
      '<b>Filter-Leiste:</b> schnell zwischen den Themen wechseln, „Alle“ zeigt alles.',
      '<b>Verfahren öffnen:</b> Zeile antippen. Mit „‹ Verfahren“ oben links geht es zurück.',
      'Die Suche kennt auch Begriffe wie „Durchschnitt“, „Ausreißer“, „Signifikanz“.',
    ])}
  `)}

  ${page(4, 'Klickstrecke: Rechnen mit Rechenweg', `
    <p class="lead">Jedes Verfahren funktioniert gleich: <b>Daten eingeben → Berechnen → Ergebnis und Rechenweg ablesen.</b> Beispiel: Lagemaße.</p>
    ${strip([['k1', 'Daten ins Feld tippen (1) – oder „Beispiel einsetzen“ (2)'], ['k2', 'Hilfstasten für ; und − (3), dann „Berechnen“ (4)']])}
    ${strip([['k3', 'Ergebnis (5) – antippen zum Kopieren'], ['k4', 'Darunter der komplette Rechenweg Schritt für Schritt (6)']])}
    ${steps([
      'Eingabefeld antippen und Werte eintragen.',
      '„Beispiel einsetzen“ zeigt, wie die Eingabe aussehen muss.',
      'Werte mit Semikolon oder Leerzeichen trennen.',
      '„Berechnen“ tippen.',
      'Das wichtigste Ergebnis steht groß oben.',
      'Rechenweg mit Formeln, Tabellen, Diagramm und Interpretation.',
    ])}
  `, 'compact')}

  ${page(5, 'Klickstrecke: Normalverteilung', `
    <p class="lead">Aufgabe: Punkte sind normalverteilt mit μ = 60 und σ = 12. Wie wahrscheinlich sind mindestens 75 Punkte?</p>
    ${strip([['n1', 'Kachel „Normal“ antippen (1)'], ['n2', '„Wahrscheinlichkeit berechnen“ wählen (2)']])}
    ${strip([['n3', 'μ und σ (3), „mindestens“ (4) und x = 75 (5) eingeben'], ['n4', 'Ergebnis mit Grafik: der orange Bereich ist die gesuchte Wahrscheinlichkeit (6)']])}
    <div class="box"><h4>Weitere Verfahren zur Normalverteilung</h4><ul><li><b>Quantil / Grenzwert:</b> „Welcher Wert wird nur von den obersten 5 % erreicht?“</li><li><b>z-Transformation</b>, <b>zwei Ergebnisse vergleichen</b> und die <b>68-95-99,7-Regel</b></li></ul></div>
  `, 'compact')}

  ${page(6, 'Klickstrecke: Hypothesentest', `
    <p class="lead">Beispiel: Unterscheiden sich die Mittelwerte zweier Gruppen? (Verfahren „Zwei Mittelwerte vergleichen“)</p>
    <div class="strip big">${phone('t1', 'Eingabeart wählen: Rohdaten oder Kennzahlen (1)')}${arrow}${phone('t2', 'p-Wert und Kennzahlen (2), auch per Simulation')}${arrow}${phone('t3', 'Am Ende steht die Testentscheidung in Worten (3)')}</div>
    <div class="box"><h4>So liest du einen Test</h4><ul>
      <li><b>Hypothesen</b> stehen im ersten Schritt (H₀ und H<sub>A</sub>).</li>
      <li><b>p-Wert &lt; α</b> → H₀ verwerfen, das Ergebnis ist signifikant.</li>
      <li><b>p-Wert ≥ α</b> → H₀ kann nicht verworfen werden (das ist kein Beweis für H₀).</li>
      <li>Ein- oder zweiseitig wählst du bei „Alternativhypothese“, α bei „Signifikanzniveau“.</li>
    </ul></div>
  `)}

  ${page(7, 'Eigene Projekte mit Excel', `
    <p class="lead">Im Tab <b>Projekte</b> lädst du eine Excel- oder CSV-Datei hoch und rechnest direkt mit deinen Spalten. Jedes Ergebnis endet mit einer <b>Interpretation</b> in Worten.</p>
    ${strip([['pr1', '„Neues Projekt“ antippen (1)'], ['pr2', 'Datei wählen (2), Vorschau prüfen, „Projekt anlegen“ (3)'], ['pr3', 'Schnellanalyse ansehen, dann Verfahren wählen (4)']])}
    ${strip([['pr4', 'Spalten statt Zahlen auswählen (5, 6) – optional mit Filter'], ['pr5', 'Ergebnis mit Interpretation, die deine Spaltennamen nennt (7)']])}
    <div class="box"><h4>Tipps</h4><ul>
      <li>Erste Zeile der Tabelle = Spaltennamen. Unterstützt: <b>.xlsx</b> und <b>.csv</b> (alte .xls bitte als .xlsx speichern).</li>
      <li>Auf dem Handy: Daten in Excel markieren, kopieren und ins Feld „Daten einfügen“ einsetzen.</li>
      <li><b>Filter</b> (z. B. „nur wenn Filiale = Süd“) ermöglicht Gruppenvergleiche.</li>
      <li>Projekte bleiben nur auf deinem Gerät gespeichert.</li>
    </ul></div>
  `, 'compact')}

  ${page(8, 'Eingabe-Tipps', `
    <div class="two">
      <div>
        <div class="box" style="margin-top:0"><h4>Zahlen eingeben</h4><ul>
          <li>Dezimalkomma: <b>2,5</b> (Punkt geht auch: 2.5)</li>
          <li>Listen trennen mit <b>;</b> oder Leerzeichen oder neuer Zeile</li>
          <li>Wiederholungen: <b>12x3</b> = dreimal die 12</li>
          <li>Brüche: <b>1/3</b> · Prozent: <b>5 %</b> = 0,05</li>
          <li>Negative Zahlen: Taste <b>±</b> neben dem Feld</li>
        </ul></div>
        <div class="box"><h4>Tabellen (Kreuztabelle, χ², ANOVA)</h4><ul>
          <li>Eine Zeile pro Gruppe/Ausprägung</li>
          <li>Werte in der Zeile mit Leerzeichen trennen</li>
          <li>Beispiel:<br><code>42 18</code><br><code>28 32</code></li>
        </ul></div>
        <div class="box"><h4>Praktisch</h4><ul>
          <li>Eingaben bleiben gespeichert, auch nach dem Schließen.</li>
          <li>Jede Ergebnis-Kachel antippen = Wert kopieren.</li>
          <li>Hell-/Dunkelmodus im Tab „Anleitung“.</li>
        </ul></div>
      </div>
      <div>${phone('f1', 'Auch Finanzmathematik: Zinseszins, Renten, Annuitäten, Kapitalwert')}<div style="height:6mm"></div>${phone('g1', 'Diese Anleitung jederzeit im Tab „Anleitung“ – auch als PDF (1)')}</div>
    </div>
  `)}

  ${page(9, 'Alle Verfahren im Überblick', Object.values(byCat).map((g) => `<div class="cat"><i style="background:${g.c.color}">${g.c.glyph}</i>${g.c.name}</div><table>${g.items.map((t) => `<tr><td>${t.title}</td><td>${t.sub}</td></tr>`).join('')}</table>`).join(''), 'nofoot')}
  </body></html>`;

  ctx = await b.newContext();
  p = await ctx.newPage();
  await p.setContent(html, { waitUntil: 'load' });
  const pdf = path.join(OUT, 'anleitung.pdf');
  await p.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();

  // Seitenbilder für die Anzeige in der App
  const pagesDir = path.join(OUT, 'pages');
  fs.rmSync(pagesDir, { recursive: true, force: true });
  fs.mkdirSync(pagesDir, { recursive: true });
  execSync(`pdftoppm -jpeg -jpegopt quality=82 -r 96 "${pdf}" "${path.join(pagesDir, 'seite')}"`);
  const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.jpg')).sort().map((f) => 'guide/pages/' + f);
  fs.writeFileSync(path.join(OUT, 'pages.js'), `window.TR_GUIDE = ${JSON.stringify({ pdf: 'guide/anleitung.pdf', pages }, null, 2)};\n`);
  console.log('PDF:', pdf, '|', pages.length, 'Seiten');
})();
