/* Schätzen & Testen */
(function () {
  const TR = window.TR, S = TR.S, F = TR.F;
  const HINT = 'Werte mit Semikolon, Leerzeichen oder neuer Zeile trennen. Dezimalkomma erlaubt.';
  const modeIn = { id: 'mode', label: 'Eingabe', type: 'select', options: [{ v: 'data', t: 'Rohdaten eingeben' }, { v: 'stats', t: 'Kennzahlen (x̄, s, n) eingeben' }] };
  const isData = (v) => v.mode !== 'stats';
  const isStats = (v) => v.mode === 'stats';

  function meanInputs(g, suffix = '') {
    if (g.sel('mode') === 'stats') {
      return { m: g.num('m' + suffix), s: g.num('s' + suffix, { gt: 0 }), n: g.num('n' + suffix, { int: true, min: 2 }) };
    }
    const x = g.list('x' + suffix, { min: 2 });
    return { m: S.mean(x), s: S.sd(x), n: x.length, x };
  }
  function meanStep(d, name = '') {
    return d.x
      ? { t: `Kennzahlen der Stichprobe${name}`, tex: `n = ${d.n}, \\quad \\bar{x} = ${F.tex(d.m)}, \\quad s = ${F.tex(d.s)}` }
      : { t: `Gegebene Kennzahlen${name}`, tex: `n = ${d.n}, \\quad \\bar{x} = ${F.tex(d.m)}, \\quad s = ${F.tex(d.s)}` };
  }

  // ---------- Konfidenzintervall Mittelwert ----------
  TR.addTool({
    id: 'kimittel', cat: 'inf', title: 'Konfidenzintervall Mittelwert',
    sub: 'Standardfehler, Faustregel ± 2·se, t-Intervall',
    keys: 'konfidenzintervall vertrauensintervall mittelwert standardfehler se bereichsschätzung punktschätzung',
    inputs: [
      modeIn,
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 12; 15; 11; 14; 13', hint: HINT, showIf: isData },
      { id: 'm', label: 'Mittelwert x̄', type: 'number', ph: 'z. B. 24,5', showIf: isStats },
      { id: 's', label: 'Standardabweichung s', type: 'number', ph: 'z. B. 6,2', showIf: isStats },
      { id: 'n', label: 'Stichprobenumfang n', type: 'number', ph: 'z. B. 40', showIf: isStats },
      { id: 'lv', label: 'Konfidenzniveau', type: 'select', options: TR.levels },
    ],
    example: { mode: 'stats', m: '24,5', s: '6,2', n: '40', lv: '0.95', x: '' },
    compute(g) {
      const d = meanInputs(g), lv = parseFloat(g.sel('lv'));
      const se = d.s / Math.sqrt(d.n);
      const tq = S.qt(1 - (1 - lv) / 2, d.n - 1), zq = S.qnormStd(1 - (1 - lv) / 2);
      const lo = d.m - tq * se, hi = d.m + tq * se;
      return {
        main: [
          { label: `${F.pct(lv, 0)}-KI (t)`, value: `[${F.fmt(lo)}; ${F.fmt(hi)}]`, big: true, wide: true },
          { label: 'Punktschätzer μ̂ = x̄', value: F.fmt(d.m) },
          { label: 'Standardfehler se', value: F.fmt(se) },
          { label: 'Faustregel x̄ ± 2·se', value: `[${F.fmt(d.m - 2 * se)}; ${F.fmt(d.m + 2 * se)}]`, wide: true },
        ],
        steps: [
          meanStep(d),
          { t: 'Punktschätzung', tex: `\\hat\\mu = \\bar{x} = ${F.tex(d.m)}` },
          { t: 'Standardfehler des Mittelwerts', tex: `se = \\frac{s}{\\sqrt{n}} = \\frac{${F.tex(d.s)}}{\\sqrt{${d.n}}} = ${F.tex(se)}`, text: 'Der Standardfehler sinkt mit wachsendem n.' },
          { t: 'Faustregel (n > 30, 95 %)', tex: `\\bar{x} \\pm 2 \\cdot se = ${F.tex(d.m)} \\pm 2 \\cdot ${F.tex(se)} = [${F.tex(d.m - 2 * se)};\\; ${F.tex(d.m + 2 * se)}]` },
          { t: `Genaues ${F.pct(lv, 0)}-Intervall mit t-Verteilung`, tex: `\\bar{x} \\pm t_{${F.tex(1 - (1 - lv) / 2)};\\,${d.n - 1}} \\cdot se = ${F.tex(d.m)} \\pm ${F.tex(tq)} \\cdot ${F.tex(se)} = [${F.tex(lo)};\\; ${F.tex(hi)}]` },
          { t: 'Zum Vergleich mit Normalverteilung (z)', tex: `\\bar{x} \\pm ${F.tex(zq)} \\cdot ${F.tex(se)} = [${F.tex(d.m - zq * se)};\\; ${F.tex(d.m + zq * se)}]` },
        ],
        note: [
          `Der Mittelwert${g.fromProject ? g.von('x') : ' der Stichprobe'} beträgt ${F.fmt(d.m)}. Mit ${F.pct(lv, 0)} Sicherheit liegt der unbekannte Mittelwert der Population zwischen ${F.fmt(lo)} und ${F.fmt(hi)}.`,
          `Die Schätzung ist auf etwa ± ${F.fmt(tq * se)} genau. Ein größeres n macht das Intervall schmaler, eine höhere Sicherheit macht es breiter.`,
        ],
      };
    },
  });

  // ---------- Konfidenzintervall Anteil ----------
  TR.addTool({
    id: 'kianteil', cat: 'inf', title: 'Konfidenzintervall Anteil',
    sub: 'Anteil p mit Standardfehler',
    keys: 'konfidenzintervall anteil prozent quote standardfehler pi bereichsschätzung',
    inputs: [
      { id: 'x', label: 'Anzahl Treffer x', type: 'number', ph: 'z. B. 18' },
      { id: 'n', label: 'Stichprobenumfang n', type: 'number', ph: 'z. B. 50' },
      { id: 'lv', label: 'Konfidenzniveau', type: 'select', options: TR.levels },
    ],
    example: { x: '18', n: '50', lv: '0.95' },
    compute(g) {
      const n = g.num('n', { int: true, min: 1 }), x = g.num('x', { int: true, min: 0, max: n });
      const lv = parseFloat(g.sel('lv'));
      const p = x / n, se = Math.sqrt((p * (1 - p)) / n), z = S.qnormStd(1 - (1 - lv) / 2);
      return {
        main: [
          { label: `${F.pct(lv, 0)}-KI`, value: `[${F.fmt(Math.max(0, p - z * se))}; ${F.fmt(Math.min(1, p + z * se))}]`, big: true, wide: true },
          { label: 'Anteil p', value: F.fmt(p) },
          { label: 'Standardfehler', value: F.fmt(se) },
        ],
        steps: [
          { t: 'Punktschätzung', tex: `\\hat\\pi = p = \\frac{x}{n} = \\frac{${x}}{${n}} = ${F.tex(p)}` },
          { t: 'Standardfehler', tex: `se = \\sqrt{\\frac{p(1-p)}{n}} = \\sqrt{\\frac{${F.tex(p)} \\cdot ${F.tex(1 - p)}}{${n}}} = ${F.tex(se)}` },
          { t: 'Faustregel (95 %)', tex: `p \\pm 2 \\cdot se = [${F.tex(p - 2 * se)};\\; ${F.tex(p + 2 * se)}]` },
          { t: `${F.pct(lv, 0)}-Intervall`, tex: `p \\pm z \\cdot se = ${F.tex(p)} \\pm ${F.tex(z)} \\cdot ${F.tex(se)} = [${F.tex(p - z * se)};\\; ${F.tex(p + z * se)}]` },
        ],
        note: [
          `In der Stichprobe beträgt der Anteil ${F.pct(p, 1)}. Mit ${F.pct(lv, 0)} Sicherheit liegt der Anteil in der Population zwischen ${F.pct(Math.max(0, p - z * se), 1)} und ${F.pct(Math.min(1, p + z * se), 1)}.`,
          ...(n * p < 5 || n * (1 - p) < 5 ? ['Achtung: n·p oder n·(1−p) ist kleiner als 5 – die Näherung ist ungenau.'] : []),
        ],
      };
    },
  });

  // ---------- Bootstrap ----------
  TR.addTool({
    id: 'bootstrap', cat: 'inf', title: 'Bootstrap-Konfidenzintervall',
    sub: 'Resampling (Ziehen mit Zurücklegen)',
    keys: 'bootstrap resampling ziehen mit zurücklegen simulation perzentil intervall standardfehler',
    inputs: [
      { id: 'x', label: 'Daten (Stichprobe)', type: 'list', ph: 'z. B. 12; 15; 11; 14; 13', hint: HINT + ' Für Anteile 0/1 eingeben.' },
      { id: 'stat', label: 'Statistik', type: 'select', options: [{ v: 'mean', t: 'Mittelwert' }, { v: 'median', t: 'Median' }, { v: 'sd', t: 'Standardabweichung' }, { v: 'prop', t: 'Anteil der Einsen (0/1-Daten)' }] },
      { id: 'reps', label: 'Wiederholungen', type: 'select', options: [{ v: '10000', t: '10.000' }, { v: '1000', t: '1.000' }, { v: '5000', t: '5.000' }] },
      { id: 'lv', label: 'Konfidenzniveau', type: 'select', options: TR.levels },
      { id: 'seed', label: 'Startwert Zufall (für gleiche Ergebnisse)', type: 'number', ph: '2025', def: '2025' },
    ],
    example: { x: '23; 31; 18; 27; 35; 22; 29; 41; 26; 30; 24; 33; 28; 19; 37; 25; 32; 21; 34; 27', stat: 'mean', reps: '10000', lv: '0.95', seed: '1896' },
    compute(g) {
      const x = g.list('x', { min: 3 });
      const stat = g.sel('stat'), reps = parseInt(g.sel('reps'), 10), lv = parseFloat(g.sel('lv'));
      const seed = g.num('seed', { optional: true }) || 2025;
      const fn = { mean: S.mean, median: (a) => S.quantileEmp(a, 0.5).value, sd: S.sd, prop: (a) => a.filter((v) => v === 1).length / a.length }[stat];
      const name = { mean: 'Mittelwert', median: 'Median', sd: 'Standardabweichung', prop: 'Anteil' }[stat];
      const r = S.rng(seed);
      const boot = new Array(reps);
      for (let i = 0; i < reps; i++) boot[i] = fn(S.resample(x, r));
      const est = fn(x);
      const lo = S.quantileR7(boot, (1 - lv) / 2), hi = S.quantileR7(boot, 1 - (1 - lv) / 2);
      const se = S.sd(boot);
      return {
        main: [
          { label: `${F.pct(lv, 0)}-Bootstrap-KI`, value: `[${F.fmt(lo)}; ${F.fmt(hi)}]`, big: true, wide: true },
          { label: `${name} der Stichprobe`, value: F.fmt(est) },
          { label: 'Bootstrap-Standardfehler', value: F.fmt(se) },
        ],
        steps: [
          { t: 'Punktschätzung aus der Originalstichprobe', tex: `\\delta^* = ${F.tex(est)} \\quad (n = ${x.length})` },
          { t: 'Resampling', text: `${F.fmt(reps)}-mal wird aus der Stichprobe eine neue Stichprobe vom Umfang n = ${x.length} mit Zurücklegen gezogen (einzelne Werte können mehrfach vorkommen) und jeweils der ${name} berechnet.` },
          { t: 'Bootstrap-Verteilung', text: 'Das Histogramm zeigt die Verteilung der simulierten Werte. Die markierten Linien sind die Intervallgrenzen.' },
          { t: 'Standardfehler', tex: `se = sd(\\text{Bootstrap-Werte}) = ${F.tex(se)}` },
          { t: 'Perzentil-Intervall', tex: `[\\,q_{${F.tex((1 - lv) / 2)}};\\; q_{${F.tex(1 - (1 - lv) / 2)}}\\,] = [${F.tex(lo)};\\; ${F.tex(hi)}]`, text: `Die mittleren ${F.pct(lv, 0)} der Bootstrap-Werte bilden das Intervall.` },
        ],
        chart: TR.C.histogram(boot, { vlines: [lo, hi], bins: 30 }),
        note: [
          `Der ${name}${g.fromProject ? g.von('x') : ' der Stichprobe'} beträgt ${F.fmt(est)}. Plausible Werte für die Population (${F.pct(lv, 0)}-Bootstrap-Intervall) liegen zwischen ${F.fmt(lo)} und ${F.fmt(hi)}.`,
          `Voraussetzungen: zufällige Stichprobe und nicht zu kleines n (als grobe Orientierung mindestens 30 bis 40 Werte).${x.length < 30 ? ' Hier ist n kleiner – das Ergebnis ist nur eine grobe Schätzung.' : ''} Mit dem gleichen Startwert erhältst du immer das gleiche Ergebnis.`,
        ],
      };
    },
  });

  // ---------- Anteilstest ----------
  TR.addTool({
    id: 'anteilstest', cat: 'inf', title: 'Test für einen Anteil',
    sub: 'Binomialtest + Simulation',
    keys: 'anteil test binomial münzwurf zufall simulation nullhypothese pi trefferquote quote p wert',
    inputs: [
      { id: 'x', label: 'Anzahl Treffer x', type: 'number', ph: 'z. B. 12' },
      { id: 'n', label: 'Anzahl Versuche n', type: 'number', ph: 'z. B. 34' },
      { id: 'p0', label: 'Anteil unter H₀: π₀ (z. B. 0,5 oder 1/3)', type: 'number', ph: '1/3' },
      { id: 'alt', label: 'Alternativhypothese π …', type: 'select', options: TR.alternatives },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { x: '15', n: '30', p0: '1/3', alt: 'greater', alpha: '0.05' },
    compute(g) {
      const n = g.num('n', { int: true, min: 1, max: 100000 }), x = g.num('x', { int: true, min: 0, max: n });
      const p0 = g.num('p0', { gt: 0, lt: 1 }), alt = g.sel('alt'), alpha = parseFloat(g.sel('alpha'));
      let p;
      if (alt === 'greater') p = 1 - S.pbinom(x - 1, n, p0);
      else if (alt === 'less') p = S.pbinom(x, n, p0);
      else p = S.binomTwoSided(x, n, p0);
      // Simulation unter H0
      const r = S.rng(2025), reps = 10000, counts = new Array(n + 1).fill(0);
      for (let i = 0; i < reps; i++) { let k = 0; for (let j = 0; j < n; j++) if (r() < p0) k++; counts[k]++; }
      const exp = n * p0;
      const ext = (k) => (alt === 'greater' ? k >= x : alt === 'less' ? k <= x : Math.abs(k - exp) >= Math.abs(x - exp) - 1e-9);
      let simP = 0; counts.forEach((c, k) => { if (ext(k)) simP += c; }); simP /= reps;
      const z = (x - exp) / Math.sqrt(n * p0 * (1 - p0));
      const lo = Math.max(0, Math.floor(exp - 4.5 * Math.sqrt(n * p0 * (1 - p0)))), hi = Math.min(n, Math.ceil(exp + 4.5 * Math.sqrt(n * p0 * (1 - p0))));
      const ks = []; for (let k = Math.min(lo, x); k <= Math.max(hi, x); k++) ks.push(k);
      return {
        main: [
          { label: 'p-Wert (exakt)', value: F.fmtP(p), big: true },
          { label: 'p-Wert (Simulation)', value: F.fmtP(simP) },
          { label: 'Anteil p = x/n', value: F.fmt(x / n) },
          { label: 'Entscheidung', value: p < alpha ? 'H₀ verwerfen' : 'H₀ nicht verwerfen' },
        ],
        steps: [
          { t: 'Hypothesen', tex: `H_0: \\pi ${TR.altSymLE[alt]} ${F.tex(p0)} \\qquad H_A: \\pi ${TR.altSym[alt]} ${F.tex(p0)}` },
          { t: 'Teststatistik', tex: `x = ${x} \\text{ Treffer bei } n = ${n}, \\quad p = \\frac{${x}}{${n}} = ${F.tex(x / n)}, \\quad \\text{erwartet unter } H_0: n\\pi_0 = ${F.tex(exp)}` },
          { t: 'Verteilung unter H₀ simulieren', text: `Simuliere 10.000-mal: n = ${n} Versuche mit Trefferwahrscheinlichkeit ${F.fmt(p0)} („Münzwurf“) und zähle die Treffer. Das Diagramm zeigt die simulierte Verteilung, orange = mindestens so extrem wie beobachtet.` },
          { t: 'p-Wert', tex: alt === 'greater' ? `p = P(X \\geq ${x} \\mid H_0) = ${F.tex(p)}` : alt === 'less' ? `p = P(X \\leq ${x} \\mid H_0) = ${F.tex(p)}` : `p = P(\\text{mind. so extrem wie } ${x} \\mid H_0) = ${F.tex(p)}`, text: `Exakt über die Binomialverteilung B(${n}; ${F.fmt(p0)}). Simulation: ${F.fmt(simP)}. Näherung über Normalverteilung: z = ${F.fmt(z)}.` },
          TR.decision(p, alpha),
        ],
        chart: TR.C.bars(ks.map(String), ks.map((k) => counts[k]), (i) => ext(ks[i])),
        note: [
          `Beobachtet wurden ${x} Treffer bei ${n} Versuchen (${F.pct(x / n, 1)}), erwartet wären unter H₀ ${F.fmt(exp)} (${F.pct(p0, 1)}).`,
          p < alpha ? `Mit ${F.pTxt(p)} < α ist die Abweichung signifikant: Die Daten sprechen dagegen, dass der wahre Anteil ${TR.altSymLE[alt] === '=' ? 'gleich' : TR.altSymLE[alt] === '\\leq' ? 'höchstens' : 'mindestens'} ${F.pct(p0, 1)} ist.` : `Mit ${F.pTxt(p)} ≥ α ist die Abweichung nicht signifikant: Das Ergebnis ist mit dem Anteil ${F.pct(p0, 1)} vereinbar.`,
          'Merke: Ein kleiner p-Wert heißt „diese Daten wären unter H₀ überraschend“ – er ist keine Wahrscheinlichkeit dafür, dass H₀ falsch ist.',
        ],
      };
    },
  });

  // ---------- t-Test eine Stichprobe ----------
  TR.addTool({
    id: 'ttest1', cat: 'inf', title: 't-Test (eine Stichprobe)',
    sub: 'Mittelwert gegen einen Sollwert μ₀',
    keys: 't test einstichproben mittelwert sollwert mu0 hypothese p wert',
    inputs: [
      modeIn,
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 498; 502; 495; 501', hint: HINT, showIf: isData },
      { id: 'm', label: 'Mittelwert x̄', type: 'number', ph: 'z. B. 497,2', showIf: isStats },
      { id: 's', label: 'Standardabweichung s', type: 'number', ph: 'z. B. 4,1', showIf: isStats },
      { id: 'n', label: 'Stichprobenumfang n', type: 'number', ph: 'z. B. 25', showIf: isStats },
      { id: 'mu0', label: 'Wert unter H₀: μ₀', type: 'number', ph: 'z. B. 500' },
      { id: 'alt', label: 'Alternativhypothese μ …', type: 'select', options: TR.alternatives },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { mode: 'data', x: '497; 502; 495; 499; 494; 498; 501; 496; 493; 497; 500; 495', mu0: '500', alt: 'two', alpha: '0.05' },
    compute(g) {
      const d = meanInputs(g), mu0 = g.num('mu0'), alt = g.sel('alt'), alpha = parseFloat(g.sel('alpha'));
      const se = d.s / Math.sqrt(d.n), t = (d.m - mu0) / se, df = d.n - 1, p = TR.pFromT(t, df, alt);
      const crit = alt === 'two' ? S.qt(1 - alpha / 2, df) : S.qt(1 - alpha, df);
      return {
        main: [
          { label: 'p-Wert', value: F.fmtP(p), big: true },
          { label: 't-Wert', value: F.fmt(t) },
          { label: 'Freiheitsgrade', value: String(df) },
          { label: 'Entscheidung', value: p < alpha ? 'H₀ verwerfen' : 'H₀ nicht verwerfen' },
        ],
        steps: [
          { t: 'Hypothesen', tex: `H_0: \\mu ${TR.altSymLE[alt]} ${F.tex(mu0)} \\qquad H_A: \\mu ${TR.altSym[alt]} ${F.tex(mu0)}` },
          meanStep(d),
          { t: 'Standardfehler', tex: `se = \\frac{s}{\\sqrt{n}} = \\frac{${F.tex(d.s)}}{\\sqrt{${d.n}}} = ${F.tex(se)}` },
          { t: 'Teststatistik', tex: `t = \\frac{\\bar{x} - \\mu_0}{se} = \\frac{${F.tex(d.m)} - ${F.texP(mu0)}}{${F.tex(se)}} = ${F.tex(t)}`, text: `Der Mittelwert liegt ${F.fmt(Math.abs(t))} Standardfehler ${t >= 0 ? 'über' : 'unter'} μ₀.` },
          { t: 'p-Wert (t-Verteilung)', tex: `${TR.pFormula(alt, F.tex(t), `T_{${df}}`)} = ${F.tex(p)}`, text: `Kritischer Wert: ${alt === 'two' ? '±' : alt === 'less' ? '−' : ''}${F.fmt(crit)}.` },
          TR.decision(p, alpha),
        ],
        note: [
          `Der Mittelwert${g.fromProject ? g.von('x') : ' der Stichprobe'} (${F.fmt(d.m)}) liegt ${F.fmt(Math.abs(d.m - mu0))} ${d.m >= mu0 ? 'über' : 'unter'} dem Vergleichswert ${F.fmt(mu0)}.`,
          p < alpha ? `Diese Abweichung ist signifikant (${F.pTxt(p)} < α = ${F.fmt(alpha)}): Der wahre Mittelwert ${alt === 'two' ? 'weicht vermutlich von' : alt === 'greater' ? 'liegt vermutlich über' : 'liegt vermutlich unter'} ${F.fmt(mu0)}${alt === 'two' ? ' ab' : ''}.` : `Diese Abweichung ist nicht signifikant (${F.pTxt(p)} ≥ α = ${F.fmt(alpha)}): Sie kann durch Zufall in der Stichprobe erklärt werden.`,
        ],
        chart: TR.testChart(t, alt, df),
      };
    },
  });

  // ---------- Zwei Mittelwerte ----------
  TR.addTool({
    id: 'ttest2', cat: 'inf', title: 'Zwei Mittelwerte vergleichen',
    sub: 't-Test & Permutationstest (unabhängig)',
    keys: 'zwei gruppen mittelwertsdifferenz diffmean t test welch permutationstest shuffle unabhängige stichproben vergleich',
    inputs: [
      modeIn,
      { id: 'x1', label: 'Daten Gruppe 1', type: 'list', ph: 'z. B. 12; 15; 11; 14', hint: HINT, showIf: isData },
      { id: 'x2', label: 'Daten Gruppe 2', type: 'list', ph: 'z. B. 16; 18; 15; 17', showIf: isData },
      { id: 'm1', label: 'x̄ Gruppe 1', type: 'number', showIf: isStats },
      { id: 's1', label: 's Gruppe 1', type: 'number', showIf: isStats },
      { id: 'n1', label: 'n Gruppe 1', type: 'number', showIf: isStats },
      { id: 'm2', label: 'x̄ Gruppe 2', type: 'number', showIf: isStats },
      { id: 's2', label: 's Gruppe 2', type: 'number', showIf: isStats },
      { id: 'n2', label: 'n Gruppe 2', type: 'number', showIf: isStats },
      { id: 'alt', label: 'Alternativhypothese μ₂ − μ₁ … 0', type: 'select', options: TR.alternatives },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { mode: 'data', x1: '14,2; 16,8; 13,5; 15,9; 17,1; 14,8; 16,0; 15,2; 13,9; 16,4', x2: '17,5; 18,9; 16,2; 19,4; 17,8; 18,1; 20,3; 16,9; 18,6; 17,2', alt: 'two', alpha: '0.05' },
    compute(g) {
      const a = meanInputs(g, '1'), b = meanInputs(g, '2'), alt = g.sel('alt'), alpha = parseFloat(g.sel('alpha'));
      const diff = b.m - a.m;
      const v1 = a.s ** 2 / a.n, v2 = b.s ** 2 / b.n, se = Math.sqrt(v1 + v2);
      const t = diff / se, df = (v1 + v2) ** 2 / (v1 ** 2 / (a.n - 1) + v2 ** 2 / (b.n - 1));
      const p = TR.pFromT(t, df, alt);
      const main = [
        { label: 'p-Wert (t-Test)', value: F.fmtP(p), big: true },
        { label: 'Differenz x̄₂ − x̄₁', value: F.fmt(diff) },
        { label: 't-Wert', value: F.fmt(t) },
        { label: 'Entscheidung', value: p < alpha ? 'H₀ verwerfen' : 'H₀ nicht verwerfen' },
      ];
      const steps = [
        { t: 'Hypothesen', tex: `H_0: \\mu_2 - \\mu_1 ${TR.altSymLE[alt]} 0 \\qquad H_A: \\mu_2 - \\mu_1 ${TR.altSym[alt]} 0` },
        meanStep(a, ' (Gruppe 1)'), meanStep(b, ' (Gruppe 2)'),
        { t: 'Teststatistik: Differenz der Mittelwerte', tex: `\\bar{x}_2 - \\bar{x}_1 = ${F.tex(b.m)} - ${F.texP(a.m)} = ${F.tex(diff)}` },
        { t: 'Standardfehler der Differenz', tex: `se = \\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}} = \\sqrt{\\frac{${F.tex(a.s)}^2}{${a.n}} + \\frac{${F.tex(b.s)}^2}{${b.n}}} = ${F.tex(se)}` },
        { t: 't-Wert (Welch-Test)', tex: `t = \\frac{${F.tex(diff)}}{${F.tex(se)}} = ${F.tex(t)}, \\quad df \\approx ${F.tex(df, 2)}` },
        { t: 'p-Wert', tex: `${TR.pFormula(alt, F.tex(t), 'T')} = ${F.tex(p)}` },
      ];
      let chart = TR.testChart(t, alt, df);
      if (a.x && b.x) {
        const all = a.x.concat(b.x), n1 = a.x.length, r = S.rng(2025), reps = 10000, sim = new Array(reps);
        for (let i = 0; i < reps; i++) {
          const sh = S.shuffle(all, r);
          let s1 = 0, s2 = 0;
          for (let j = 0; j < all.length; j++) (j < n1 ? (s1 += sh[j]) : (s2 += sh[j]));
          sim[i] = s2 / (all.length - n1) - s1 / n1;
        }
        const ext = (v) => (alt === 'greater' ? v >= diff - 1e-12 : alt === 'less' ? v <= diff + 1e-12 : Math.abs(v) >= Math.abs(diff) - 1e-12);
        const pp = sim.filter(ext).length / reps;
        main.splice(1, 0, { label: 'p-Wert (Permutation)', value: F.fmtP(pp) });
        steps.push({ t: 'Permutationstest (Simulation)', text: `Unter H₀ spielt die Gruppenzugehörigkeit keine Rolle. Daher werden die Gruppen 10.000-mal zufällig neu gemischt und jeweils die Mittelwertdifferenz berechnet. Bei ${F.fmt(pp * 100, 2)} % der Mischungen war die Differenz genauso groß oder größer – das ist der simulierte p-Wert.` });
        chart = TR.C.histogram(sim, { bins: 30, hl: ext, vlines: alt === 'two' ? [diff, -diff] : [diff] });
      }
      steps.push(TR.decision(p, alpha));
      return { main, steps, chart, note: [
        `Im Mittel liegt ${g.nm('x2', 'Gruppe 2')} bei ${F.fmt(b.m)} und ${g.nm('x1', 'Gruppe 1')} bei ${F.fmt(a.m)} – ein Unterschied von ${F.fmt(diff)}.`,
        p < alpha ? `Der Unterschied ist signifikant (${F.pTxt(p)} < α = ${F.fmt(alpha)}): Es gibt Hinweise auf einen echten Mittelwertunterschied in der Population.` : `Der Unterschied ist nicht signifikant (${F.pTxt(p)} ≥ α = ${F.fmt(alpha)}): Er könnte auch zufällig entstanden sein.`,
        'Voraussetzung: unabhängige, zufällige Stichproben. Ein Kausalschluss ist nur bei einem randomisierten Experiment möglich.',
      ] };
    },
  });

  // ---------- Zwei Anteile ----------
  TR.addTool({
    id: 'zweianteile', cat: 'inf', title: 'Zwei Anteile vergleichen',
    sub: 'Differenz der Anteile, z-Test',
    keys: 'zwei anteile differenz anteile diffprop vergleich gruppen quote prozent z test',
    inputs: [
      { id: 'x1', label: 'Treffer Gruppe 1', type: 'number', ph: 'z. B. 30' },
      { id: 'n1', label: 'n Gruppe 1', type: 'number', ph: 'z. B. 80' },
      { id: 'x2', label: 'Treffer Gruppe 2', type: 'number', ph: 'z. B. 45' },
      { id: 'n2', label: 'n Gruppe 2', type: 'number', ph: 'z. B. 85' },
      { id: 'alt', label: 'Alternativhypothese π₂ − π₁ … 0', type: 'select', options: TR.alternatives },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { x1: '28', n1: '70', x2: '41', n2: '68', alt: 'greater', alpha: '0.05' },
    compute(g) {
      const n1 = g.num('n1', { int: true, min: 1 }), x1 = g.num('x1', { int: true, min: 0, max: n1 });
      const n2 = g.num('n2', { int: true, min: 1 }), x2 = g.num('x2', { int: true, min: 0, max: n2 });
      const alt = g.sel('alt'), alpha = parseFloat(g.sel('alpha'));
      const p1 = x1 / n1, p2 = x2 / n2, d = p2 - p1, pp = (x1 + x2) / (n1 + n2);
      const se = Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
      if (se === 0) throw new TR.InputError('Alle oder keine Beobachtungen sind Treffer – der Test ist nicht durchführbar.');
      const z = d / se, p = TR.pFromZ(z, alt);
      const seU = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
      return {
        main: [
          { label: 'p-Wert', value: F.fmtP(p), big: true },
          { label: 'Differenz p₂ − p₁', value: F.fmt(d) },
          { label: 'z-Wert', value: F.fmt(z) },
          { label: '95 %-KI Differenz', value: `[${F.fmt(d - 1.96 * seU)}; ${F.fmt(d + 1.96 * seU)}]`, wide: true },
        ],
        steps: [
          { t: 'Hypothesen', tex: `H_0: \\pi_2 - \\pi_1 ${TR.altSymLE[alt]} 0 \\qquad H_A: \\pi_2 - \\pi_1 ${TR.altSym[alt]} 0` },
          { t: 'Anteile', tex: `p_1 = \\frac{${x1}}{${n1}} = ${F.tex(p1)}, \\quad p_2 = \\frac{${x2}}{${n2}} = ${F.tex(p2)}, \\quad p_2 - p_1 = ${F.tex(d)}` },
          { t: 'Gemeinsamer Anteil unter H₀', tex: `\\bar{p} = \\frac{${x1} + ${x2}}{${n1} + ${n2}} = ${F.tex(pp)}` },
          { t: 'Standardfehler', tex: `se = \\sqrt{\\bar{p}(1-\\bar{p})\\left(\\frac{1}{n_1}+\\frac{1}{n_2}\\right)} = ${F.tex(se)}` },
          { t: 'Teststatistik', tex: `z = \\frac{p_2 - p_1}{se} = \\frac{${F.tex(d)}}{${F.tex(se)}} = ${F.tex(z)}` },
          { t: 'p-Wert (Standardnormalverteilung)', tex: `${TR.pFormula(alt, F.tex(z), 'Z')} = ${F.tex(p)}` },
          TR.decision(p, alpha),
        ],
        note: [
          `Der Anteil liegt in ${g.nm('x2', 'Gruppe 2')} bei ${F.pct(p2, 1)} und in ${g.nm('x1', 'Gruppe 1')} bei ${F.pct(p1, 1)} – eine Differenz von ${F.fmt(d * 100, 1)} Prozentpunkten.`,
          p < alpha ? `Der Unterschied ist signifikant (${F.pTxt(p)} < α): Die Anteile unterscheiden sich vermutlich auch in der Population.` : `Der Unterschied ist nicht signifikant (${F.pTxt(p)} ≥ α): Er könnte zufällig entstanden sein.`,
        ],
        chart: TR.testChart(z, alt, 0),
      };
    },
  });

  // ---------- Chi²-Unabhängigkeit ----------
  TR.addTool({
    id: 'chiunab', cat: 'inf', title: 'χ²-Test Unabhängigkeit',
    sub: 'Zusammenhang zweier kategorialer Merkmale',
    keys: 'chi quadrat chi2 unabhängigkeit kreuztabelle kontingenz erwartete häufigkeiten kategorial cramer',
    inputs: [
      { id: 'm', label: 'Beobachtete Häufigkeiten', type: 'matrix', ph: '30 12\n18 25', hint: 'Eine Zeile pro Ausprägung von Merkmal A, Spalten = Ausprägungen von Merkmal B.' },
      { id: 'rn', label: 'Zeilennamen (optional)', type: 'short', ph: 'z. B. ja, nein' },
      { id: 'cn', label: 'Spaltennamen (optional)', type: 'short', ph: 'z. B. Gruppe A, Gruppe B' },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { m: '42 18\n28 32', rn: 'zufrieden, unzufrieden', cn: 'Filiale A, Filiale B', alpha: '0.05' },
    compute(g) {
      const M = g.matrix('m');
      TR.checkMatrix(M);
      const { rn, cn } = TR.tableNames(g, M.length, M[0].length);
      const t = TR.crossTable(M, rn, cn);
      const alpha = parseFloat(g.sel('alpha'));
      const E = M.map((r, i) => r.map((_, j) => (t.rs[i] * t.cs[j]) / t.n));
      let chi = 0;
      const contrib = M.map((r, i) => r.map((o, j) => { const c = (o - E[i][j]) ** 2 / E[i][j]; chi += c; return c; }));
      const df = (t.R - 1) * (t.C - 1), p = 1 - S.pchisq(chi, df);
      const V = Math.sqrt(chi / (t.n * (Math.min(t.R, t.C) - 1)));
      const small = E.flat().some((e) => e < 5);
      return {
        main: [
          { label: 'p-Wert', value: F.fmtP(p), big: true },
          { label: 'χ²', value: F.fmt(chi) },
          { label: 'Freiheitsgrade', value: String(df) },
          { label: 'Cramérs V', value: F.fmt(V) },
        ],
        steps: [
          { t: 'Hypothesen', text: 'H₀: Die Merkmale sind unabhängig (kein Zusammenhang).  H_A: Es gibt einen Zusammenhang.' },
          { t: 'Beobachtete Häufigkeiten mit Randsummen', table: { head: t.head, rows: t.abs } },
          { t: 'Erwartete Häufigkeiten unter H₀', tex: `e_{ij} = \\frac{\\text{Zeilensumme}_i \\cdot \\text{Spaltensumme}_j}{n}`, table: { head: [''].concat(cn), rows: E.map((r, i) => [rn[i]].concat(r.map((v) => F.fmt(v)))) } },
          { t: 'Beiträge (o − e)² / e', table: { head: [''].concat(cn), rows: contrib.map((r, i) => [rn[i]].concat(r.map((v) => F.fmt(v)))) } },
          { t: 'Teststatistik', tex: `\\chi^2 = \\sum \\frac{(o_{ij} - e_{ij})^2}{e_{ij}} = ${F.tex(chi)}, \\quad df = (${t.R}-1)(${t.C}-1) = ${df}` },
          { t: 'p-Wert', tex: `p = P(\\chi^2_{${df}} \\geq ${F.tex(chi)}) = ${F.tex(p)}` },
          TR.decision(p, alpha),
        ],
        chart: TR.C.density((x) => (x <= 0 ? 0 : Math.exp((df / 2 - 1) * Math.log(x) - x / 2 - (df / 2) * Math.log(2) - S.logGamma(df / 2))), 0.001, Math.max(chi * 1.3, df + 4 * Math.sqrt(2 * df)), [[chi, Infinity]], { marks: [chi] }),
        note: [
          p < alpha ? `Es gibt einen signifikanten Zusammenhang zwischen ${g.nm('m', 'den beiden Merkmalen')} (χ² = ${F.fmt(chi)}, ${F.pTxt(p)} < α): Die Verteilung des einen Merkmals hängt vom anderen ab.` : `Es gibt keinen signifikanten Zusammenhang zwischen ${g.nm('m', 'den beiden Merkmalen')} (${F.pTxt(p)} ≥ α): Die Abweichungen von der Unabhängigkeit können zufällig sein.`,
          `Cramérs V = ${F.fmt(V, 3)} beschreibt die Stärke: ${V < 0.1 ? 'kaum ein' : V < 0.3 ? 'ein schwacher' : V < 0.5 ? 'ein mittlerer' : 'ein starker'} Zusammenhang.`,
          ...(small ? ['Achtung: Mindestens eine erwartete Häufigkeit ist kleiner als 5 – das Ergebnis ist nur eingeschränkt verlässlich.'] : []),
        ],
      };
    },
  });

  // ---------- Chi²-Anpassung ----------
  TR.addTool({
    id: 'chianp', cat: 'inf', title: 'χ²-Anpassungstest',
    sub: 'Passen Häufigkeiten zu erwarteten Anteilen?',
    keys: 'chi quadrat anpassungstest gleichverteilung erwartete anteile goodness of fit kategorial',
    inputs: [
      { id: 'o', label: 'Beobachtete Häufigkeiten', type: 'list', ph: 'z. B. 18; 22; 30; 30' },
      { id: 'p', label: 'Erwartete Anteile (leer = gleich verteilt)', type: 'list', ph: 'z. B. 0,25; 0,25; 0,25; 0,25', optional: true },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { o: '28; 35; 22; 39; 26', p: '', alpha: '0.05' },
    compute(g) {
      const o = g.list('o', { min: 2 });
      let pr = g.str('p') ? g.list('p', { min: 2 }) : o.map(() => 1 / o.length);
      if (pr.length !== o.length) throw new TR.InputError('Es müssen genauso viele Anteile wie Häufigkeiten angegeben werden.');
      const ps = S.sum(pr);
      if (Math.abs(ps - 1) > 1e-6) pr = pr.map((v) => v / ps);
      const n = S.sum(o), e = pr.map((p) => p * n), alpha = parseFloat(g.sel('alpha'));
      const c = o.map((v, i) => (v - e[i]) ** 2 / e[i]), chi = S.sum(c), df = o.length - 1, p = 1 - S.pchisq(chi, df);
      return {
        main: [{ label: 'p-Wert', value: F.fmtP(p), big: true }, { label: 'χ²', value: F.fmt(chi) }, { label: 'Freiheitsgrade', value: String(df) }],
        steps: [
          { t: 'Hypothesen', text: 'H₀: Die Daten folgen den erwarteten Anteilen.  H_A: Mindestens ein Anteil weicht ab.' },
          { t: 'Erwartete Häufigkeiten eᵢ = n · πᵢ', table: { head: ['Kategorie', 'beobachtet o', 'Anteil π', 'erwartet e', '(o−e)²/e'], rows: o.map((v, i) => [i + 1, F.fmt(v), F.fmt(pr[i]), F.fmt(e[i]), F.fmt(c[i])]).concat([['Σ', F.fmt(n), '1', F.fmt(n), F.fmt(chi)]]) } },
          { t: 'Teststatistik', tex: `\\chi^2 = \\sum \\frac{(o_i-e_i)^2}{e_i} = ${F.tex(chi)}, \\quad df = k - 1 = ${df}` },
          { t: 'p-Wert', tex: `p = P(\\chi^2_{${df}} \\geq ${F.tex(chi)}) = ${F.tex(p)}` },
          TR.decision(p, alpha),
        ],
        note: [p < alpha ? `Die beobachteten Häufigkeiten weichen signifikant von den erwarteten Anteilen ab (${F.pTxt(p)} < α).` : `Die beobachteten Häufigkeiten passen zu den erwarteten Anteilen (${F.pTxt(p)} ≥ α) – die Abweichungen können zufällig sein.`, `Den größten Beitrag zu χ² liefert Kategorie ${c.indexOf(Math.max(...c)) + 1}.`],
        chart: TR.C.bars(o.map((_, i) => String(i + 1)), o),
      };
    },
  });

  // ---------- Korrelationstest ----------
  TR.addTool({
    id: 'kortest', cat: 'inf', title: 'Test auf Korrelation',
    sub: 'H₀: ρ = 0',
    keys: 'korrelation test rho signifikant zusammenhang t wert',
    inputs: [
      { id: 'r', label: 'Korrelationskoeffizient r', type: 'number', ph: 'z. B. 0,45' },
      { id: 'n', label: 'Stichprobenumfang n', type: 'number', ph: 'z. B. 30' },
      { id: 'alt', label: 'Alternativhypothese ρ … 0', type: 'select', options: TR.alternatives },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { r: '0,42', n: '30', alt: 'two', alpha: '0.05' },
    compute(g) {
      const r = g.num('r', { gt: -1, lt: 1 }), n = g.num('n', { int: true, min: 3 }), alt = g.sel('alt'), alpha = parseFloat(g.sel('alpha'));
      const df = n - 2, t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r), p = TR.pFromT(t, df, alt);
      return {
        main: [{ label: 'p-Wert', value: F.fmtP(p), big: true }, { label: 't-Wert', value: F.fmt(t) }, { label: 'df', value: String(df) }],
        steps: [
          { t: 'Hypothesen', tex: `H_0: \\rho ${TR.altSymLE[alt]} 0 \\qquad H_A: \\rho ${TR.altSym[alt]} 0` },
          { t: 'Teststatistik', tex: `t = \\frac{r\\sqrt{n-2}}{\\sqrt{1-r^2}} = \\frac{${F.tex(r)}\\cdot\\sqrt{${df}}}{\\sqrt{1-${F.texP(r)}^2}} = ${F.tex(t)}` },
          { t: 'p-Wert', tex: `${TR.pFormula(alt, F.tex(t), `T_{${df}}`)} = ${F.tex(p)}` },
          TR.decision(p, alpha),
        ],
        note: [p < alpha ? `Die Korrelation r = ${F.fmt(r)} ist signifikant (${F.pTxt(p)} < α): Es gibt vermutlich auch in der Population einen linearen Zusammenhang.` : `Die Korrelation r = ${F.fmt(r)} ist nicht signifikant (${F.pTxt(p)} ≥ α): Bei n = ${n} könnte sie zufällig entstanden sein.`],
        chart: TR.testChart(t, alt, df),
      };
    },
  });

  // ---------- Koeffiziententest ----------
  TR.addTool({
    id: 'koeftest', cat: 'inf', title: 'Regressionskoeffizient testen',
    sub: 'Schätzwert & Standardfehler → t, p, KI',
    keys: 'koeffizient steigung test standardfehler t wert p wert beta null regression signifikant',
    inputs: [
      { id: 'b', label: 'Geschätzter Koeffizient β̂', type: 'number', ph: 'z. B. 0,82' },
      { id: 'se', label: 'Standardfehler se(β̂)', type: 'number', ph: 'z. B. 0,0074' },
      { id: 'df', label: 'Freiheitsgrade (n − Anzahl Koeffizienten)', type: 'number', ph: 'z. B. 242' },
      { id: 'b0', label: 'Wert unter H₀ (meist 0)', type: 'number', ph: '0', def: '0' },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { b: '0,82', se: '0,31', df: '48', b0: '0', alpha: '0.05' },
    compute(g) {
      const b = g.num('b'), se = g.num('se', { gt: 0 }), df = g.num('df', { int: true, min: 1 }), b0 = g.num('b0', { optional: true }) || 0;
      const alpha = parseFloat(g.sel('alpha'));
      const t = (b - b0) / se, p = 2 * (1 - S.pt(Math.abs(t), df)), tq = S.qt(1 - alpha / 2, df);
      return {
        main: [{ label: 'p-Wert', value: F.fmtP(p), big: true }, { label: 't-Wert', value: F.fmt(t) }, { label: `${F.pct(1 - alpha, 0)}-KI`, value: `[${F.fmt(b - tq * se)}; ${F.fmt(b + tq * se)}]`, wide: true }],
        steps: [
          { t: 'Hypothesen', tex: `H_0: \\beta = ${F.tex(b0)} \\qquad H_A: \\beta \\neq ${F.tex(b0)}` },
          { t: 'Abweichung in Standardfehlern', tex: `t = \\frac{\\hat\\beta - ${F.texP(b0)}}{se} = \\frac{${F.tex(b)} - ${F.texP(b0)}}{${F.tex(se)}} = ${F.tex(t)}` },
          { t: 'p-Wert', tex: `p = 2\\cdot P(T_{${df}} \\geq |${F.tex(t)}|) = ${F.tex(p)}` },
          { t: 'Konfidenzintervall', tex: `\\hat\\beta \\pm t_{${df}} \\cdot se = ${F.tex(b)} \\pm ${F.tex(tq)} \\cdot ${F.tex(se)} = [${F.tex(b - tq * se)};\\; ${F.tex(b + tq * se)}]`, text: (b - tq * se) * (b + tq * se) > 0 ? 'Das Intervall enthält die 0 nicht → passt zur Ablehnung von H₀.' : 'Das Intervall enthält die 0 → passt dazu, dass H₀ nicht verworfen wird.' },
          TR.decision(p, alpha),
        ],
        note: [
          `Der Koeffizient ${F.fmt(b)} liegt ${F.fmt(Math.abs(t))} Standardfehler von ${F.fmt(b0)} entfernt.`,
          p < alpha ? `Er ist signifikant (${F.pTxt(p)} < α): Die zugehörige Variable hat vermutlich einen Einfluss auf y (unter sonst gleichen Umständen).` : `Er ist nicht signifikant (${F.pTxt(p)} ≥ α): Ein Einfluss der Variable lässt sich mit diesen Daten nicht nachweisen.`,
        ],
        chart: TR.testChart(t, 'two', df),
      };
    },
  });

  // ---------- Varianzanalyse ----------
  TR.addTool({
    id: 'anova', cat: 'inf', title: 'Varianzanalyse (ANOVA)',
    sub: 'Mittelwerte von mehreren Gruppen, F-Test',
    keys: 'anova varianzanalyse f test mehrere gruppen streuungszerlegung zwischen innerhalb quadratsumme',
    inputs: [
      { id: 'm', label: 'Daten je Gruppe', type: 'matrix', ph: '12 14 11 13\n15 17 16\n10 9 12 11', hint: 'Eine Zeile pro Gruppe. Gruppen dürfen unterschiedlich groß sein.' },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { m: '23 25 21 27 24 22\n28 30 27 31 29\n22 20 24 21 23 19 22', alpha: '0.05' },
    compute(g) {
      const G = g.matrix('m'), alpha = parseFloat(g.sel('alpha'));
      if (G.some((r) => r.length < 2)) throw new TR.InputError('Jede Gruppe braucht mindestens 2 Werte.');
      const gname = (i) => (g.raw.__groups && g.raw.__groups[i] != null ? g.raw.__groups[i] : 'Gruppe ' + (i + 1));
      const all = G.flat(), N = all.length, k = G.length, gm = S.mean(all);
      const stats = G.map((r) => ({ n: r.length, m: S.mean(r), s: S.sd(r) }));
      const ssb = S.sum(stats.map((s) => s.n * (s.m - gm) ** 2)), ssw = S.sum(stats.map((s) => (s.n - 1) * s.s ** 2)), sst = ssb + ssw;
      const df1 = k - 1, df2 = N - k, Fv = ssb / df1 / (ssw / df2), p = 1 - S.pf(Fv, df1, df2);
      return {
        main: [{ label: 'p-Wert', value: F.fmtP(p), big: true }, { label: 'F-Wert', value: F.fmt(Fv) }, { label: 'R² (η²)', value: F.fmt(ssb / sst) }],
        steps: [
          { t: 'Hypothesen', text: 'H₀: Alle Gruppenmittelwerte sind gleich.  H_A: Mindestens ein Mittelwert unterscheidet sich.' },
          { t: 'Kennzahlen je Gruppe', table: { head: ['Gruppe', 'nⱼ', 'x̄ⱼ', 'sⱼ'], rows: stats.map((s, i) => [gname(i), s.n, F.fmt(s.m), F.fmt(s.s)]).concat([['gesamt', N, F.fmt(gm), F.fmt(S.sd(all))]]) } },
          { t: 'Streuung zwischen den Gruppen', tex: `SS_{zw} = \\sum n_j(\\bar{x}_j - \\bar{x})^2 = ${F.tex(ssb)}` },
          { t: 'Streuung innerhalb der Gruppen (Rest)', tex: `SS_{in} = \\sum (n_j - 1)\\, s_j^2 = ${F.tex(ssw)}` },
          { t: 'F-Statistik', tex: `F = \\frac{SS_{zw}/(k-1)}{SS_{in}/(N-k)} = \\frac{${F.tex(ssb)}/${df1}}{${F.tex(ssw)}/${df2}} = ${F.tex(Fv)}` },
          { t: 'p-Wert', tex: `p = P(F_{${df1};${df2}} \\geq ${F.tex(Fv)}) = ${F.tex(p)}` },
          TR.decision(p, alpha),
        ],
        note: [
          `${g.fromProject ? 'Bei ' + g.nm('m', '') + ': ' : ''}Der höchste Gruppenmittelwert ist ${F.fmt(Math.max(...stats.map((s) => s.m)))} (${gname(stats.findIndex((s) => s.m === Math.max(...stats.map((x) => x.m))))}), der niedrigste ${F.fmt(Math.min(...stats.map((s) => s.m)))} (${gname(stats.findIndex((s) => s.m === Math.min(...stats.map((x) => x.m))))}).`,
          p < alpha ? `Die Unterschiede sind signifikant (${F.pTxt(p)} < α): Mindestens eine Gruppe unterscheidet sich im Mittel von den anderen.` : `Die Unterschiede sind nicht signifikant (${F.pTxt(p)} ≥ α): Sie können zufällig sein.`,
          `Die Gruppenzugehörigkeit erklärt ${F.pct(ssb / sst, 1)} der Gesamtstreuung (η²).`,
        ],
      };
    },
  });

  // ---------- Testentscheidung ----------
  TR.addTool({
    id: 'entscheidung', cat: 'inf', title: 'p-Wert & Testentscheidung',
    sub: 'Signifikant oder nicht? Fehlerarten',
    keys: 'p wert signifikanzniveau alpha entscheidung fehler 1 art 2 art alpha fehler beta fehler signifikant',
    inputs: [
      { id: 'p', label: 'p-Wert', type: 'number', ph: 'z. B. 0,032' },
      { id: 'alpha', label: 'Signifikanzniveau', type: 'select', options: TR.alphas },
    ],
    example: { p: '0,032', alpha: '0.05' },
    compute(g) {
      const p = g.num('p', { min: 0, max: 1 }), alpha = parseFloat(g.sel('alpha'));
      const rej = p < alpha;
      return {
        main: [{ label: 'Entscheidung', value: rej ? 'H₀ verwerfen' : 'H₀ nicht verwerfen', big: true, wide: true }],
        steps: [
          TR.decision(p, alpha),
          {
            t: 'Mögliche Fehler',
            table: { head: ['', 'H₀ nicht verwerfen', 'H₀ verwerfen'], rows: [['in Wahrheit gilt H₀', 'richtig', 'Fehler 1. Art (α)'], ['in Wahrheit gilt H_A', 'Fehler 2. Art (β)', 'richtig']] },
            text: rej ? `Da H₀ verworfen wird, könnte ein Fehler 1. Art vorliegen. Seine Wahrscheinlichkeit ist höchstens α = ${F.pct(alpha, 0)}.` : 'Da H₀ nicht verworfen wird, könnte ein Fehler 2. Art vorliegen. Er wird kleiner, wenn die Stichprobe größer ist.',
          },
        ],
        note: 'Der p-Wert ist die Wahrscheinlichkeit für ein mindestens so extremes Ergebnis, wenn H₀ gilt. Er sagt nichts über die Größe oder Relevanz eines Effekts.',
      };
    },
  });
})();
