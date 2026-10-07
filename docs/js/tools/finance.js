/* Finanzmathematik (Zusatz) */
(function () {
  const TR = window.TR, F = TR.F, S = TR.S;
  const rate = (g, id) => {
    const raw = String(g.raw[id] || '').trim();
    let v = F.parseNum(raw);
    if (!isFinite(v)) throw new TR.InputError('Bitte einen Zinssatz eingeben (z. B. 3 oder 3 %).');
    // "3" bedeutet 3 %, "3%" ist schon 0,03, "0,03" bleibt 0,03
    if (!raw.includes('%') && v >= 1) v = v / 100;
    return v;
  };
  const rateIn = (id = 'i', label = 'Zinssatz pro Jahr (z. B. 3 oder 3 %)') => ({ id, label, type: 'number', ph: 'z. B. 3 %' });

  TR.addTool({
    id: 'zinseszins', cat: 'fin', title: 'Zinseszins',
    sub: 'Endwert, Barwert, Zinssatz oder Laufzeit',
    keys: 'zinseszins endwert barwert kapital zinsen laufzeit aufzinsen abzinsen sparen',
    inputs: [
      { id: 'mode', label: 'Gesucht', type: 'select', options: [{ v: 'kn', t: 'Endkapital Kₙ' }, { v: 'k0', t: 'Anfangskapital K₀ (Barwert)' }, { v: 'i', t: 'Zinssatz i' }, { v: 'n', t: 'Laufzeit n' }] },
      { id: 'k0', label: 'Anfangskapital K₀ (€)', type: 'number', ph: 'z. B. 5000', showIf: (v) => v.mode !== 'k0' },
      { id: 'kn', label: 'Endkapital Kₙ (€)', type: 'number', ph: 'z. B. 6500', showIf: (v) => v.mode !== 'kn' },
      Object.assign(rateIn(), { showIf: (v) => v.mode !== 'i' }),
      { id: 'n', label: 'Laufzeit n (Jahre)', type: 'number', ph: 'z. B. 10', showIf: (v) => v.mode !== 'n' },
    ],
    example: { mode: 'kn', k0: '5000', i: '3,5', n: '10', kn: '' },
    compute(g) {
      const mode = g.sel('mode');
      const steps = [{ t: 'Grundformel', tex: 'K_n = K_0 \\cdot (1+i)^n = K_0 \\cdot q^n' }];
      let main;
      if (mode === 'kn') {
        const k0 = g.num('k0'), i = rate(g, 'i'), n = g.num('n', { min: 0 });
        const kn = k0 * (1 + i) ** n;
        steps.push({ t: 'Einsetzen', tex: `K_n = ${F.tex(k0, 2)} \\cdot (1 + ${F.tex(i)})^{${F.tex(n)}} = ${F.tex(k0, 2)} \\cdot ${F.tex((1 + i) ** n, 6)} = ${F.tex(kn, 2)}` });
        steps.push({ t: 'Zinsen insgesamt', tex: `K_n - K_0 = ${F.tex(kn - k0, 2)}` });
        const xs = [], ys = []; for (let t = 0; t <= Math.min(n, 60); t++) { xs.push(t); ys.push(k0 * (1 + i) ** t); }
        return { main: [{ label: 'Endkapital Kₙ', value: F.money(kn), big: true }, { label: 'Zinsen', value: F.money(kn - k0) }], steps, chart: TR.C.line(xs, ys), note: [`Aus ${F.money(k0)} werden nach ${F.fmt(n)} Jahren bei ${F.pct(i, 2)} Zinsen ${F.money(kn)}. Davon sind ${F.money(kn - k0)} Zinsen (Zinseszinseffekt: Auch die Zinsen werden mitverzinst).`] };
      }
      if (mode === 'k0') {
        const kn = g.num('kn'), i = rate(g, 'i'), n = g.num('n', { min: 0 });
        const k0 = kn / (1 + i) ** n;
        steps.push({ t: 'Nach K₀ umstellen (abzinsen)', tex: `K_0 = \\frac{K_n}{(1+i)^n} = \\frac{${F.tex(kn, 2)}}{(1+${F.tex(i)})^{${F.tex(n)}}} = ${F.tex(k0, 2)}` });
        main = [{ label: 'Barwert K₀', value: F.money(k0), big: true }];
        steps.note = [`Um nach ${F.fmt(n)} Jahren ${F.money(kn)} zu haben, müssen heute ${F.money(k0)} angelegt werden. ${F.money(kn)} in der Zukunft sind heute also nur ${F.money(k0)} wert.`];
      } else if (mode === 'i') {
        const k0 = g.num('k0', { gt: 0 }), kn = g.num('kn', { gt: 0 }), n = g.num('n', { gt: 0 });
        const i = (kn / k0) ** (1 / n) - 1;
        steps.push({ t: 'Nach i umstellen', tex: `i = \\sqrt[n]{\\frac{K_n}{K_0}} - 1 = \\left(\\frac{${F.tex(kn, 2)}}{${F.tex(k0, 2)}}\\right)^{1/${F.tex(n)}} - 1 = ${F.tex(i, 6)}` });
        main = [{ label: 'Zinssatz i', value: F.pct(i, 3), big: true }];
        steps.note = [`Damit aus ${F.money(k0)} in ${F.fmt(n)} Jahren ${F.money(kn)} werden, ist ein jährlicher Zinssatz von ${F.pct(i, 3)} nötig.`];
      } else {
        const k0 = g.num('k0', { gt: 0 }), kn = g.num('kn', { gt: 0 }), i = rate(g, 'i');
        if (i <= 0) throw new TR.InputError('Der Zinssatz muss größer als 0 sein.');
        const n = Math.log(kn / k0) / Math.log(1 + i);
        steps.push({ t: 'Nach n umstellen (Logarithmus)', tex: `n = \\frac{\\ln(K_n / K_0)}{\\ln(1+i)} = \\frac{\\ln(${F.tex(kn / k0, 6)})}{\\ln(${F.tex(1 + i, 6)})} = ${F.tex(n)}` });
        main = [{ label: 'Laufzeit n', value: F.fmt(n, 2) + ' Jahre', big: true }, { label: 'aufgerundet', value: Math.ceil(n - 1e-9) + ' Jahre' }];
        steps.note = [`Bei ${F.pct(i, 2)} Zinsen dauert es ${F.fmt(n, 2)} Jahre, bis aus ${F.money(k0)} ${F.money(kn)} werden – bei jährlicher Verzinsung also ${Math.ceil(n - 1e-9)} volle Jahre.`];
      }
      return { main, steps, note: steps.note };
    },
  });

  TR.addTool({
    id: 'effektivzins', cat: 'fin', title: 'Unterjährige & stetige Verzinsung',
    sub: 'Effektiver Jahreszins',
    keys: 'unterjährig monatlich quartal effektivzins effektiver jahreszins stetig nominalzins',
    inputs: [
      rateIn('i', 'Nominalzins pro Jahr (z. B. 6 %)'),
      { id: 'm', label: 'Zinsperioden pro Jahr m', type: 'select', options: [{ v: '12', t: 'monatlich (12)' }, { v: '4', t: 'vierteljährlich (4)' }, { v: '2', t: 'halbjährlich (2)' }, { v: '365', t: 'täglich (365)' }, { v: '1', t: 'jährlich (1)' }] },
      { id: 'k0', label: 'Kapital (optional, €)', type: 'number', ph: 'z. B. 1000', optional: true },
      { id: 'n', label: 'Jahre (optional)', type: 'number', ph: 'z. B. 5', optional: true },
    ],
    example: { i: '6', m: '12', k0: '1000', n: '5' },
    compute(g) {
      const i = rate(g, 'i'), m = parseInt(g.sel('m'), 10);
      const eff = (1 + i / m) ** m - 1, cont = Math.exp(i) - 1;
      const main = [{ label: 'Effektiver Jahreszins', value: F.pct(eff, 4), big: true }, { label: 'bei stetiger Verzinsung', value: F.pct(cont, 4) }];
      const steps = [
        { t: 'Zinssatz pro Periode', tex: `\\frac{i}{m} = \\frac{${F.tex(i)}}{${m}} = ${F.tex(i / m, 6)}` },
        { t: 'Effektiver Jahreszins', tex: `i_{eff} = \\left(1 + \\frac{i}{m}\\right)^m - 1 = (1 + ${F.tex(i / m, 6)})^{${m}} - 1 = ${F.tex(eff, 6)}` },
        { t: 'Stetige Verzinsung (Grenzfall m → ∞)', tex: `i_{eff} = e^{i} - 1 = e^{${F.tex(i)}} - 1 = ${F.tex(cont, 6)}` },
      ];
      const k0 = g.num('k0', { optional: true }), n = g.num('n', { optional: true });
      if (k0 != null && n != null) {
        const kn = k0 * (1 + i / m) ** (m * n);
        steps.push({ t: 'Endkapital', tex: `K_n = K_0 \\left(1+\\frac{i}{m}\\right)^{m \\cdot n} = ${F.tex(k0, 2)} \\cdot (1 + ${F.tex(i / m, 6)})^{${F.tex(m * n)}} = ${F.tex(kn, 2)}` });
        main.push({ label: 'Endkapital', value: F.money(kn) }, { label: 'stetig', value: F.money(k0 * Math.exp(i * n)) });
      }
      return { main, steps, note: [`Bei ${m} Zinsperioden pro Jahr wirkt ein Nominalzins von ${F.pct(i, 2)} wie ein Jahreszins von ${F.pct(eff, 3)}, weil die Zinsen schon unterjährig mitverzinst werden.`, `Je häufiger verzinst wird, desto höher der effektive Zins – höchstens ${F.pct(cont, 3)} (stetige Verzinsung).`] };
    },
  });

  TR.addTool({
    id: 'rente', cat: 'fin', title: 'Rentenrechnung',
    sub: 'Regelmäßige Zahlungen: End- und Barwert',
    keys: 'rente rentenrechnung sparplan ratensparen endwert barwert nachschüssig vorschüssig regelmäßige zahlung',
    inputs: [
      { id: 'r', label: 'Zahlung pro Periode r (€)', type: 'number', ph: 'z. B. 100' },
      rateIn('i', 'Zinssatz pro Periode (z. B. 4 %)'),
      { id: 'n', label: 'Anzahl Zahlungen n', type: 'number', ph: 'z. B. 20' },
      { id: 'typ', label: 'Zahlungszeitpunkt', type: 'select', options: [{ v: 'nach', t: 'nachschüssig (am Periodenende)' }, { v: 'vor', t: 'vorschüssig (am Periodenanfang)' }] },
    ],
    example: { r: '1200', i: '4', n: '15', typ: 'nach' },
    compute(g) {
      const r = g.num('r'), i = rate(g, 'i'), n = g.num('n', { int: true, min: 1 }), vor = g.sel('typ') === 'vor';
      const q = 1 + i;
      const f = i === 0 ? n : (q ** n - 1) / i;
      const rn = r * f * (vor ? q : 1), r0 = rn / q ** n;
      return {
        main: [{ label: 'Rentenendwert Rₙ', value: F.money(rn), big: true }, { label: 'Rentenbarwert R₀', value: F.money(r0) }, { label: 'Summe Einzahlungen', value: F.money(r * n) }, { label: 'Zinsen', value: F.money(rn - r * n) }],
        steps: [
          { t: 'Aufzinsungsfaktor', tex: `q = 1 + i = ${F.tex(q, 6)}` },
          { t: `Rentenendwert (${vor ? 'vorschüssig' : 'nachschüssig'})`, tex: `R_n = r \\cdot ${vor ? 'q \\cdot ' : ''}\\frac{q^n - 1}{q - 1} = ${F.tex(r, 2)} \\cdot ${vor ? F.tex(q, 6) + ' \\cdot ' : ''}\\frac{${F.tex(q, 6)}^{${n}} - 1}{${F.tex(i, 6)}} = ${F.tex(rn, 2)}` },
          { t: 'Rentenbarwert (abzinsen)', tex: `R_0 = \\frac{R_n}{q^n} = \\frac{${F.tex(rn, 2)}}{${F.tex(q, 6)}^{${n}}} = ${F.tex(r0, 2)}` },
        ],
        note: [`Wer ${n}-mal ${F.money(r)} ${vor ? 'zu Beginn' : 'am Ende'} jeder Periode einzahlt, hat am Ende ${F.money(rn)}. Eingezahlt wurden ${F.money(r * n)}, der Rest (${F.money(rn - r * n)}) sind Zinsen.`, `Alle Zahlungen zusammen sind heute ${F.money(r0)} wert (Barwert).`],
      };
    },
  });

  TR.addTool({
    id: 'annuitaet', cat: 'fin', title: 'Annuitätendarlehen',
    sub: 'Rate & Tilgungsplan',
    keys: 'annuität kredit darlehen rate tilgung tilgungsplan zinsanteil restschuld',
    inputs: [
      { id: 'k', label: 'Darlehensbetrag K₀ (€)', type: 'number', ph: 'z. B. 20000' },
      rateIn('i', 'Zinssatz pro Jahr (z. B. 5 %)'),
      { id: 'n', label: 'Laufzeit n (Jahre)', type: 'number', ph: 'z. B. 5' },
    ],
    example: { k: '20000', i: '5', n: '5' },
    compute(g) {
      const k = g.num('k', { gt: 0 }), i = rate(g, 'i'), n = g.num('n', { int: true, min: 1, max: 100 });
      const q = 1 + i;
      const A = i === 0 ? k / n : (k * q ** n * i) / (q ** n - 1);
      const rows = [];
      let rest = k, zs = 0;
      for (let t = 1; t <= n; t++) {
        const z = rest * i, tl = A - z;
        zs += z;
        rows.push([t, F.money(rest), F.money(z), F.money(tl), F.money(A), F.money(Math.max(0, rest - tl))]);
        rest -= tl;
      }
      return {
        main: [{ label: 'Annuität (Rate pro Jahr)', value: F.money(A), big: true }, { label: 'Zinsen gesamt', value: F.money(zs) }, { label: 'Gesamtzahlung', value: F.money(A * n) }],
        steps: [
          { t: 'Annuitätenformel', tex: `A = K_0 \\cdot \\frac{q^n (q-1)}{q^n - 1} = ${F.tex(k, 2)} \\cdot \\frac{${F.tex(q, 6)}^{${n}} \\cdot ${F.tex(i, 6)}}{${F.tex(q, 6)}^{${n}} - 1} = ${F.tex(A, 2)}` },
          { t: 'Tilgungsplan', text: 'Zinsen = Restschuld · i, Tilgung = Annuität − Zinsen.', table: { head: ['Jahr', 'Restschuld Anfang', 'Zinsen', 'Tilgung', 'Annuität', 'Restschuld Ende'], rows } },
        ],
        note: [`Für ${F.money(k)} Kredit zahlst du ${n} Jahre lang jeweils ${F.money(A)}. Insgesamt sind das ${F.money(A * n)}, davon ${F.money(zs)} Zinsen.`, 'Die Rate bleibt gleich: Am Anfang ist der Zinsanteil hoch, mit sinkender Restschuld steigt der Tilgungsanteil.'],
      };
    },
  });

  TR.addTool({
    id: 'kapitalwert', cat: 'fin', title: 'Kapitalwert & interner Zinsfuß',
    sub: 'Investitionsrechnung mit Zahlungsreihe',
    keys: 'kapitalwert npv barwert investition interner zinsfuß irr zahlungsreihe cashflow',
    inputs: [
      { id: 'c', label: 'Zahlungen ab Zeitpunkt 0 (€)', type: 'list', ph: 'z. B. −10000; 3000; 4000; 5000', hint: 'Auszahlungen negativ, Einzahlungen positiv. Erster Wert = heute (t = 0).' },
      rateIn('i', 'Kalkulationszins (z. B. 6 %)'),
    ],
    example: { c: '-10000; 3000; 4000; 4500', i: '6' },
    compute(g) {
      const c = g.list('c', { min: 2 }), i = rate(g, 'i');
      const npv = (r) => S.sum(c.map((v, t) => v / (1 + r) ** t));
      const k = npv(i);
      let irr = null, lo = -0.99, hi = 10;
      if (npv(lo) * npv(hi) < 0) {
        for (let it = 0; it < 200; it++) { const mid = (lo + hi) / 2; if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid; }
        irr = (lo + hi) / 2;
      }
      const rows = c.map((v, t) => [t, F.money(v), F.fmt(1 / (1 + i) ** t, 6), F.money(v / (1 + i) ** t)]);
      rows.push(['Σ', '', '', F.money(k)]);
      return {
        main: [{ label: 'Kapitalwert C₀', value: F.money(k), big: true }, { label: 'Interner Zinsfuß', value: irr == null ? 'nicht eindeutig' : F.pct(irr, 3) }],
        steps: [
          { t: 'Formel', tex: `C_0 = \\sum_{t=0}^{n} \\frac{z_t}{(1+i)^t}` },
          { t: 'Abzinsen jeder Zahlung', table: { head: ['t', 'Zahlung zₜ', 'Abzinsfaktor', 'Barwert'], rows } },
          { t: 'Interner Zinsfuß', text: irr == null ? 'Kein Vorzeichenwechsel des Kapitalwerts gefunden.' : `Der Zinssatz, bei dem der Kapitalwert genau 0 ist (numerisch bestimmt): ${F.pct(irr, 3)}.` },
        ],
        note: [k >= 0 ? `Der Kapitalwert ist positiv (${F.money(k)}): Die Investition lohnt sich beim Kalkulationszins ${F.pct(i, 2)} – sie bringt mehr als eine Anlage zu diesem Zins.` : `Der Kapitalwert ist negativ (${F.money(k)}): Die Investition lohnt sich beim Kalkulationszins ${F.pct(i, 2)} nicht.`, ...(irr != null ? [`Der interne Zinsfuß von ${F.pct(irr, 2)} ist die Rendite der Investition. Liegt er über dem Kalkulationszins, lohnt sie sich.`] : [])],
      };
    },
  });
})();
