/* Beschreibende Statistik */
(function () {
  const TR = window.TR, S = TR.S, F = TR.F;
  const DATA_HINT = 'Werte mit Semikolon, Leerzeichen oder neuer Zeile trennen. Dezimalkomma erlaubt. 12x3 = dreimal die 12.';

  function quantSteps(x, p, method, name) {
    const s = S.sorted(x), n = s.length;
    const q = S.quantileEmp(x, p);
    let text;
    if (q.rule === 'mid') text = `n·p = ${F.fmt(q.np)} ist ganzzahlig → Mittelwert aus dem ${q.i}. und ${q.i + 1}. Wert der sortierten Liste: (${F.fmt(s[q.i - 1])} + ${F.fmt(s[q.i])}) / 2 = ${F.fmt(q.value)}.`;
    else if (q.rule === 'up') text = `n·p = ${F.fmt(q.np)} ist nicht ganzzahlig → aufrunden auf ${q.i}. Der ${q.i}. Wert der sortierten Liste ist ${F.fmt(q.value)}.`;
    else text = `Randfall: ${F.fmt(q.value)}.`;
    return {
      value: q.value,
      step: { t: name, tex: `n \\cdot p = ${n} \\cdot ${F.tex(p)} = ${F.tex(q.np)}`, text },
    };
  }
  TR.quantSteps = quantSteps;

  function sortedStep(x) {
    const s = S.sorted(x);
    return { t: 'Daten sortieren', text: `n = ${x.length} Werte, aufsteigend sortiert:`, mono: s.map((v) => F.fmt(v)).join('; ') };
  }

  // ---------- Lagemaße ----------
  TR.addTool({
    id: 'lagemasse', cat: 'desc', title: 'Lagemaße',
    sub: 'Mittelwert, Median, Modus, Min/Max',
    keys: 'mittelwert durchschnitt median zentralwert modus modalwert minimum maximum arithmetisch mean',
    inputs: [
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 12; 15; 9; 15; 21', hint: DATA_HINT },
    ],
    example: { x: '31; 27; 35; 27; 42; 29; 33; 38; 27; 30' },
    compute(g) {
      const x = g.list('x', { min: 1 });
      const n = x.length, s = S.sorted(x), sum = S.sum(x), m = sum / n;
      const md = quantSteps(x, 0.5, 'emp', 'Median (50 %-Quantil)');
      const mo = S.modes(x);
      const steps = [sortedStep(x)];
      steps.push({ t: 'Minimum und Maximum', tex: `x_{min} = ${F.tex(s[0])}, \\quad x_{max} = ${F.tex(s[n - 1])}` });
      steps.push({
        t: 'Modus (häufigster Wert)',
        text: mo.count === 1 ? 'Jeder Wert kommt nur einmal vor – es gibt keinen eindeutigen Modus.' : mo.values.length === 1 ? `${F.fmt(mo.values[0])} kommt am häufigsten vor (${mo.count}-mal).` : `${mo.values.map((v) => F.fmt(v)).join(' und ')} kommen am häufigsten vor (je ${mo.count}-mal).`,
      });
      steps.push(md.step);
      steps.push({
        t: 'Arithmetischer Mittelwert',
        tex: `\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i = \\frac{${F.texSumList(x)}}{${n}} = \\frac{${F.tex(sum)}}{${n}} = ${F.tex(m)}`,
      });
      return {
        main: [
          { label: 'Mittelwert x̄', value: F.fmt(m), big: true },
          { label: 'Median', value: F.fmt(md.value) },
          { label: 'Modus', value: mo.count === 1 ? '–' : mo.values.map((v) => F.fmt(v)).join('; ') },
          { label: 'Minimum', value: F.fmt(s[0]) },
          { label: 'Maximum', value: F.fmt(s[n - 1]) },
          { label: 'n', value: String(n) },
        ],
        steps,
        note: [
          `Im Durchschnitt (arithmetischer Mittelwert) liegt ${g.nm('x', 'der Wert')} bei ${F.fmt(m)}.`,
          `Die Hälfte der Beobachtungen ist kleiner oder gleich ${F.fmt(md.value)} (Median), die andere Hälfte größer oder gleich.`,
          `Die Werte reichen von ${F.fmt(s[0])} bis ${F.fmt(s[n - 1])}` + (mo.count > 1 ? `, am häufigsten kommt ${mo.values.map((v) => F.fmt(v)).join(' bzw. ')} vor.` : '.'),
          m > md.value ? 'Da der Mittelwert über dem Median liegt, ist die Verteilung eher rechtsschief (einzelne große Werte ziehen den Mittelwert nach oben).' : m < md.value ? 'Da der Mittelwert unter dem Median liegt, ist die Verteilung eher linksschief (einzelne kleine Werte ziehen den Mittelwert nach unten).' : 'Mittelwert und Median sind gleich – die Daten sind eher symmetrisch verteilt.',
        ],
      };
    },
  });

  // ---------- Streuungsmaße ----------
  TR.addTool({
    id: 'streuung', cat: 'desc', title: 'Streuungsmaße',
    sub: 'Varianz, Standardabweichung, IQR, Spannweite',
    keys: 'varianz standardabweichung sd streuung iqr interquartilsabstand spannweite range abweichungsquadrate',
    inputs: [
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 4; 8; 6; 5; 7', hint: DATA_HINT },
    ],
    example: { x: '31; 27; 35; 27; 42; 29; 33; 38; 27; 30' },
    compute(g) {
      const x = g.list('x', { min: 2 });
      const n = x.length, m = S.mean(x), s = S.sorted(x);
      const dev = x.map((v) => v - m);
      const ss = S.sum(dev.map((d) => d * d));
      const v = ss / (n - 1), sd = Math.sqrt(v);
      const q1 = quantSteps(x, 0.25, 'emp', 'Unteres Quartil Q1 (25 %)');
      const q3 = quantSteps(x, 0.75, 'emp', 'Oberes Quartil Q3 (75 %)');
      const steps = [
        { t: 'Mittelwert', tex: `\\bar{x} = \\frac{${F.tex(S.sum(x))}}{${n}} = ${F.tex(m)}` },
        {
          t: 'Abweichungen vom Mittelwert und deren Quadrate',
          table: { head: ['i', 'xᵢ', 'xᵢ − x̄', '(xᵢ − x̄)²'], rows: x.map((xi, i) => [i + 1, F.fmt(xi), F.fmt(dev[i]), F.fmt(dev[i] ** 2)]).concat([['Σ', F.fmt(S.sum(x)), '0', F.fmt(ss)]]) },
        },
        { t: 'Varianz (Stichprobe, geteilt durch n − 1)', tex: `s^2 = \\frac{1}{n-1}\\sum (x_i-\\bar{x})^2 = \\frac{${F.tex(ss)}}{${n - 1}} = ${F.tex(v)}` },
        { t: 'Standardabweichung', tex: `sd = s = \\sqrt{s^2} = \\sqrt{${F.tex(v)}} = ${F.tex(sd)}` },
        sortedStep(x),
        q1.step, q3.step,
        { t: 'Interquartilsabstand', tex: `IQR = Q_3 - Q_1 = ${F.tex(q3.value)} - ${F.texP(q1.value)} = ${F.tex(q3.value - q1.value)}` },
        { t: 'Spannweite', tex: `x_{max} - x_{min} = ${F.tex(s[n - 1])} - ${F.texP(s[0])} = ${F.tex(s[n - 1] - s[0])}` },
      ];
      return {
        main: [
          { label: 'Standardabweichung s', value: F.fmt(sd), big: true },
          { label: 'Varianz s²', value: F.fmt(v) },
          { label: 'IQR', value: F.fmt(q3.value - q1.value) },
          { label: 'Spannweite', value: F.fmt(s[n - 1] - s[0]) },
          { label: 'Mittelwert', value: F.fmt(m) },
          { label: 'Quadratsumme', value: F.fmt(ss) },
        ],
        steps,
        note: [
          `Die Werte${g.von('x')} weichen im Schnitt um etwa ${F.fmt(sd)} (Standardabweichung) vom Mittelwert ${F.fmt(m)} ab.`,
          `Die mittleren 50 % der Werte liegen in einem Bereich der Breite ${F.fmt(q3.value - q1.value)} (IQR), alle Werte zusammen in einem Bereich der Breite ${F.fmt(s[n - 1] - s[0])} (Spannweite).`,
          `Der Variationskoeffizient sd / x̄ beträgt ${m !== 0 ? F.pct(sd / Math.abs(m), 1) : '–'}: ${m !== 0 && sd / Math.abs(m) > 0.5 ? 'die Streuung ist im Verhältnis zum Mittelwert groß.' : 'die Streuung ist im Verhältnis zum Mittelwert eher gering.'}`,
          'Der IQR ist robust gegen Ausreißer, die Standardabweichung nicht.',
        ],
      };
    },
  });

  // ---------- Kennzahlen & Boxplot ----------
  TR.addTool({
    id: 'boxplot', cat: 'desc', title: 'Kennzahlen & Boxplot',
    sub: 'Fünf-Punkte-Zusammenfassung, Ausreißer',
    keys: 'boxplot favstats fünf punkte quartile ausreißer antennen whisker zusammenfassung kennzahlen',
    inputs: [
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 3; 7; 8; 5; 12; 14; 21; 13; 18', hint: DATA_HINT },
    ],
    example: { x: '2,1; 3,4; 2,8; 3,9; 4,2; 3,1; 2,5; 9,6; 3,3; 2,9; 3,7; 4,0' },
    compute(g) {
      const x = g.list('x', { min: 4 });
      const s = S.sorted(x), n = x.length;
      const q1 = quantSteps(x, 0.25, 'emp', 'Q1'), md = quantSteps(x, 0.5, 'emp', 'Median'), q3 = quantSteps(x, 0.75, 'emp', 'Q3');
      const iqr = q3.value - q1.value;
      const lf = q1.value - 1.5 * iqr, uf = q3.value + 1.5 * iqr;
      const inside = s.filter((v) => v >= lf && v <= uf);
      const lw = inside[0], uw = inside[inside.length - 1];
      const outl = s.filter((v) => v < lf || v > uf);
      const m = S.mean(x), sd = S.sd(x);
      return {
        main: [
          { label: 'Median', value: F.fmt(md.value), big: true },
          { label: 'Q1', value: F.fmt(q1.value) },
          { label: 'Q3', value: F.fmt(q3.value) },
          { label: 'Min', value: F.fmt(s[0]) },
          { label: 'Max', value: F.fmt(s[n - 1]) },
          { label: 'Mittelwert', value: F.fmt(m) },
          { label: 'sd', value: F.fmt(sd) },
          { label: 'Ausreißer', value: outl.length ? outl.map((v) => F.fmt(v)).join('; ') : 'keine' },
        ],
        steps: [
          sortedStep(x), q1.step, md.step, q3.step,
          { t: 'Interquartilsabstand', tex: `IQR = ${F.tex(q3.value)} - ${F.texP(q1.value)} = ${F.tex(iqr)}` },
          {
            t: 'Grenzen für Ausreißer (1,5 · IQR)',
            tex: `\\text{unten: } Q_1 - 1{,}5\\cdot IQR = ${F.tex(lf)} \\qquad \\text{oben: } Q_3 + 1{,}5\\cdot IQR = ${F.tex(uf)}`,
            text: outl.length ? `Werte außerhalb dieser Grenzen gelten als mögliche Ausreißer: ${outl.map((v) => F.fmt(v)).join('; ')}.` : 'Kein Wert liegt außerhalb – keine Ausreißer.',
          },
          { t: 'Antennen (Whisker)', text: `Die Antennen reichen bis zum letzten Wert innerhalb der Grenzen: unten ${F.fmt(lw)}, oben ${F.fmt(uw)}.` },
        ],
        chart: TR.C.boxplot({ min: s[0], max: s[n - 1], q1: q1.value, q3: q3.value, med: md.value, lw, uw, outliers: outl }),
        note: [
          `50 % der Beobachtungen${g.von('x')} liegen zwischen ${F.fmt(q1.value)} (Q1) und ${F.fmt(q3.value)} (Q3), der Median beträgt ${F.fmt(md.value)}.`,
          outl.length ? `${outl.length === 1 ? 'Ein Wert gilt' : outl.length + ' Werte gelten'} als möglicher Ausreißer (${outl.map((v) => F.fmt(v)).join('; ')}). Diese Werte sollten geprüft werden – sie beeinflussen den Mittelwert (${F.fmt(m)}) stark.` : 'Es gibt keine Ausreißer nach der 1,5·IQR-Regel.',
          md.value - q1.value < q3.value - md.value ? 'Die obere Hälfte der Box ist breiter: Die Verteilung ist eher rechtsschief.' : md.value - q1.value > q3.value - md.value ? 'Die untere Hälfte der Box ist breiter: Die Verteilung ist eher linksschief.' : 'Der Median liegt mittig in der Box: eher symmetrisch.',
        ],
      };
    },
  });

  // ---------- Quantil ----------
  TR.addTool({
    id: 'quantil', cat: 'desc', title: 'Quantil / Perzentil',
    sub: 'p-Quantil einer Datenreihe',
    keys: 'quantil perzentil quartil dezil prozent nicht überschritten',
    inputs: [
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 3; 7; 8; 5; 12', hint: DATA_HINT },
      { id: 'p', label: 'p (Anteil, z. B. 0,9 oder 90 %)', type: 'number', ph: '0,9' },
    ],
    example: { x: '31; 27; 35; 27; 42; 29; 33; 38; 27; 30', p: '0,9' },
    compute(g) {
      const x = g.list('x', { min: 2 });
      const p = g.num('p', { min: 0, max: 1 });
      const a = quantSteps(x, p, 'emp', `${F.pct(p, 1)}-Quantil`);
      return {
        main: [
          { label: `${F.pct(p, 1)}-Quantil`, value: F.fmt(a.value), big: true },
        ],
        steps: [sortedStep(x), a.step],
        note: [
          `${F.pct(p, 1)} der Beobachtungen${g.von('x')} sind kleiner oder gleich ${F.fmt(a.value)}; ${F.pct(1 - p, 1)} sind größer oder gleich.`,
          'Hinweis: Es gibt verschiedene Berechnungsarten für Quantile – andere Methoden können leicht abweichende Werte liefern.',
        ],
      };
    },
  });

  // ---------- z-Werte ----------
  TR.addTool({
    id: 'zscore', cat: 'desc', title: 'z-Werte einer Datenreihe',
    sub: 'Standardisierung mit x̄ und sd',
    keys: 'z wert zscore standardisierung studentisierung z-transformation',
    inputs: [{ id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 4; 9; 6; 11', hint: DATA_HINT }],
    example: { x: '12; 18; 9; 25; 16' },
    compute(g) {
      const x = g.list('x', { min: 2 });
      const m = S.mean(x), sd = S.sd(x);
      const z = x.map((v) => (v - m) / sd);
      return {
        main: [
          { label: 'Mittelwert', value: F.fmt(m) },
          { label: 'Standardabweichung', value: F.fmt(sd) },
        ],
        steps: [
          { t: 'Mittelwert und Standardabweichung', tex: `\\bar{x} = ${F.tex(m)}, \\quad sd = ${F.tex(sd)}` },
          { t: 'Formel', tex: `z_i = \\frac{x_i - \\bar{x}}{sd}` },
          { t: 'z-Werte', table: { head: ['xᵢ', 'Rechnung', 'zᵢ'], rows: x.map((v, i) => [F.fmt(v), `(${F.fmt(v)} − ${F.fmt(m)}) / ${F.fmt(sd)}`, F.fmt(z[i])]) } },
        ],
        note: [
          `Ein z-Wert gibt an, um wie viele Standardabweichungen ein Wert über (z > 0) oder unter (z < 0) dem Mittelwert liegt.`,
          z.some((v) => Math.abs(v) > 2) ? `Auffällig (|z| > 2): ${x.filter((_, i) => Math.abs(z[i]) > 2).map((v) => F.fmt(v)).join('; ')}.` : 'Kein Wert liegt mehr als 2 Standardabweichungen vom Mittelwert entfernt – keine auffälligen Werte.',
        ],
      };
    },
  });

  // ---------- Empirische Verteilungsfunktion ----------
  TR.addTool({
    id: 'ecdf', cat: 'desc', title: 'Empirische Verteilungsfunktion',
    sub: 'Anteil der Werte ≤ x',
    keys: 'verteilungsfunktion empirisch fn pdata anteil höchstens kleiner gleich',
    inputs: [
      { id: 'x', label: 'Daten', type: 'list', ph: 'z. B. 3; 7; 8; 5; 12', hint: DATA_HINT },
      { id: 'q', label: 'Stelle x', type: 'number', ph: 'z. B. 10' },
    ],
    example: { x: '31; 27; 35; 27; 42; 29; 33; 38; 27; 30', q: '30' },
    compute(g) {
      const x = g.list('x', { min: 1 });
      const q = g.num('q');
      const k = x.filter((v) => v <= q).length, n = x.length;
      return {
        main: [
          { label: `Fₙ(${F.fmt(q)})`, value: F.fmt(k / n), big: true },
          { label: 'in Prozent', value: F.pct(k / n) },
          { label: 'Anteil > x', value: F.fmt(1 - k / n) },
        ],
        steps: [
          sortedStep(x),
          { t: 'Werte ≤ x zählen', text: `${k} von ${n} Werten sind kleiner oder gleich ${F.fmt(q)}.` },
          { t: 'Verteilungsfunktion', tex: `F_n(${F.tex(q)}) = \\frac{\\text{Anzahl } x_i \\leq ${F.tex(q)}}{n} = \\frac{${k}}{${n}} = ${F.tex(k / n)}` },
        ],
        note: [`${F.pct(k / n)} der Beobachtungen${g.von('x')} sind höchstens ${F.fmt(q)}, ${F.pct(1 - k / n)} sind größer als ${F.fmt(q)}.`],
      };
    },
  });

  // ---------- Häufigkeiten (kategorial) ----------
  TR.addTool({
    id: 'haeufigkeit', cat: 'desc', title: 'Häufigkeiten & Anteile',
    sub: 'Absolute / relative Häufigkeit (kategorial)',
    keys: 'häufigkeit absolut relativ anteil kategorial nominal säulendiagramm modus',
    inputs: [
      { id: 'x', label: 'Beobachtungen (Kategorien)', type: 'text', ph: 'z. B. ja, nein, ja, ja, vielleicht', hint: 'Kategorien mit Komma, Semikolon oder neuer Zeile trennen.' },
      { id: 's', label: 'Anteil wovon? (optional)', type: 'short', ph: 'z. B. ja' },
    ],
    example: { x: 'Bus, Rad, Auto, Bus, Bahn, Rad, Bus, Auto, Bus, Rad, Bahn, Bus', s: 'Bus' },
    compute(g) {
      const x = g.texts('x', { min: 1 });
      const mo = S.modes(x);
      const cats = [...mo.counts.keys()].sort((a, b) => String(a).localeCompare(String(b), 'de'));
      const n = x.length;
      const succ = g.str('s');
      const rows = cats.map((c) => [c, mo.counts.get(c), F.fmt(mo.counts.get(c) / n), F.pct(mo.counts.get(c) / n)]);
      rows.push(['Σ', n, '1', '100 %']);
      const main = [{ label: 'n', value: String(n) }, { label: 'Modus', value: mo.values.join('; ') }];
      const steps = [
        { t: 'Absolute Häufigkeit hᵢ zählen und relative Häufigkeit fᵢ = hᵢ / n berechnen', table: { head: ['Kategorie', 'hᵢ', 'fᵢ', '%'], rows } },
      ];
      if (succ) {
        const h = mo.counts.get(succ) || 0;
        main.unshift({ label: `Anteil „${succ}“`, value: F.fmt(h / n), big: true });
        steps.push({ t: `Anteil p von „${succ}“`, tex: `p = \\frac{h}{n} = \\frac{${h}}{${n}} = ${F.tex(h / n)}` });
      }
      return {
        main, steps,
        chart: TR.C.bars(cats, cats.map((c) => mo.counts.get(c)), (i) => cats[i] === succ),
        note: [
          `Am häufigsten kommt bei ${g.nm('x', 'den Beobachtungen')} „${mo.values.join('“ bzw. „')}“ vor (${mo.count} von ${n}, also ${F.pct(mo.count / n, 1)}).`,
          succ ? `Der Anteil von „${succ}“ beträgt ${F.pct((mo.counts.get(succ) || 0) / n, 1)}.` : `Es gibt ${cats.length} verschiedene Kategorien.`,
          'Für kategoriale Merkmale sind Häufigkeiten, Anteile und der Modus sinnvoll – ein Mittelwert nicht.',
        ],
      };
    },
  });

  // ---------- Mittelwert aus Häufigkeiten ----------
  TR.addTool({
    id: 'gewmittel', cat: 'desc', title: 'Mittelwert aus Häufigkeiten',
    sub: 'Gewichteter Mittelwert, Varianz',
    keys: 'gewichtet häufigkeitstabelle klassen mittelwert gruppen gewichte',
    inputs: [
      { id: 'x', label: 'Werte (Ausprägungen)', type: 'list', ph: 'z. B. 1; 2; 3; 4', hint: DATA_HINT },
      { id: 'h', label: 'Häufigkeiten bzw. Gewichte', type: 'list', ph: 'z. B. 5; 8; 4; 3', hint: 'Gleiche Reihenfolge wie die Werte.' },
    ],
    example: { x: '20; 25; 120', h: '3; 2; 1' },
    compute(g) {
      const x = g.list('x', { min: 1 }), h = g.list('h', { min: 1 });
      if (x.length !== h.length) throw new TR.InputError('Werte und Häufigkeiten müssen gleich viele Einträge haben.');
      const n = S.sum(h);
      if (n <= 0) throw new TR.InputError('Die Summe der Häufigkeiten muss größer als 0 sein.');
      const sxh = S.sum(x.map((v, i) => v * h[i]));
      const m = sxh / n;
      const ss = S.sum(x.map((v, i) => h[i] * (v - m) ** 2));
      const rows = x.map((v, i) => [F.fmt(v), F.fmt(h[i]), F.fmt(v * h[i]), F.fmt(h[i] * (v - m) ** 2)]);
      rows.push(['Σ', F.fmt(n), F.fmt(sxh), F.fmt(ss)]);
      const main = [{ label: 'Gewichteter Mittelwert', value: F.fmt(m), big: true }, { label: 'Summe Gewichte n', value: F.fmt(n) }];
      const steps = [
        { t: 'Tabelle', table: { head: ['xⱼ', 'hⱼ', 'xⱼ·hⱼ', 'hⱼ·(xⱼ−x̄)²'], rows } },
        { t: 'Mittelwert', tex: `\\bar{x} = \\frac{\\sum x_j h_j}{\\sum h_j} = \\frac{${F.tex(sxh)}}{${F.tex(n)}} = ${F.tex(m)}` },
      ];
      if (n > 1 && Number.isInteger(n)) {
        steps.push({ t: 'Varianz und Standardabweichung (n − 1)', tex: `s^2 = \\frac{${F.tex(ss)}}{${F.tex(n)} - 1} = ${F.tex(ss / (n - 1))}, \\quad s = ${F.tex(Math.sqrt(ss / (n - 1)))}` });
        main.push({ label: 'Standardabweichung', value: F.fmt(Math.sqrt(ss / (n - 1))) });
      }
      const simple = S.mean(x);
      steps.push({ t: 'Zum Vergleich: ungewichteter Mittelwert der Werte', tex: `\\frac{${F.texSumList(x)}}{${x.length}} = ${F.tex(simple)}` });
      return { main, steps, note: [`Gewichtet mit den Häufigkeiten beträgt der Mittelwert ${F.fmt(m)}${Math.abs(m - simple) > 1e-9 ? `, ungewichtet wären es ${F.fmt(simple)}. Der Unterschied entsteht, weil die Werte unterschiedlich oft vorkommen.` : '.'}`] };
    },
  });

  // ---------- Kreuztabelle ----------
  TR.crossTable = function (M, rn, cn) {
    const R = M.length, C = M[0].length;
    const rs = M.map((r) => S.sum(r));
    const cs = M[0].map((_, j) => S.sum(M.map((r) => r[j])));
    const n = S.sum(rs);
    const head = [''].concat(cn, ['Σ']);
    const abs = M.map((r, i) => [rn[i]].concat(r.map((v) => F.fmt(v)), [F.fmt(rs[i])])).concat([['Σ'].concat(cs.map((v) => F.fmt(v)), [F.fmt(n)])]);
    const byCol = M.map((r, i) => [rn[i]].concat(r.map((v, j) => F.fmt(v / cs[j]))));
    byCol.push(['Σ'].concat(cs.map(() => '1')));
    const byRow = M.map((r, i) => [rn[i]].concat(r.map((v) => F.fmt(v / rs[i])), ['1']));
    const tot = M.map((r, i) => [rn[i]].concat(r.map((v) => F.fmt(v / n)), [F.fmt(rs[i] / n)]));
    return { R, C, rs, cs, n, head, abs, byCol, byRow, tot };
  };
  TR.tableNames = function (g, R, C) {
    let rn = g.str('rn') ? TR.F.parseTextList(g.str('rn')) : [];
    let cn = g.str('cn') ? TR.F.parseTextList(g.str('cn')) : [];
    rn = Array.from({ length: R }, (_, i) => rn[i] || 'Zeile ' + (i + 1));
    cn = Array.from({ length: C }, (_, j) => cn[j] || 'Spalte ' + (j + 1));
    return { rn, cn };
  };
  TR.checkMatrix = function (M) {
    const C = M[0].length;
    if (C < 2) throw new TR.InputError('Bitte mindestens 2 Spalten eingeben.');
    if (M.some((r) => r.length !== C)) throw new TR.InputError('Alle Zeilen müssen gleich viele Werte haben.');
    if (M.some((r) => r.some((v) => v < 0))) throw new TR.InputError('Häufigkeiten dürfen nicht negativ sein.');
  };

  TR.addTool({
    id: 'kreuztabelle', cat: 'desc', title: 'Kreuztabelle',
    sub: 'Bedingte relative Häufigkeiten',
    keys: 'kreuztabelle kontingenztabelle bedingt relative häufigkeit mosaikplot zeilen spalten',
    inputs: [
      { id: 'm', label: 'Absolute Häufigkeiten', type: 'matrix', ph: '30 12\n18 25', hint: 'Eine Zeile pro Ausprägung des ersten Merkmals, Werte mit Leerzeichen oder ; trennen.' },
      { id: 'rn', label: 'Zeilennamen (optional)', type: 'short', ph: 'z. B. ja, nein' },
      { id: 'cn', label: 'Spaltennamen (optional)', type: 'short', ph: 'z. B. Gruppe A, Gruppe B' },
    ],
    example: { m: '42 18\n28 32', rn: 'zufrieden, unzufrieden', cn: 'Filiale A, Filiale B' },
    compute(g) {
      const M = g.matrix('m');
      TR.checkMatrix(M);
      const { rn, cn } = TR.tableNames(g, M.length, M[0].length);
      const t = TR.crossTable(M, rn, cn);
      return {
        main: [{ label: 'Gesamtzahl n', value: F.fmt(t.n), big: true }],
        steps: [
          { t: 'Absolute Häufigkeiten mit Randsummen', table: { head: t.head, rows: t.abs } },
          { t: 'Anteile je Spalte (Spalte = 100 %)', text: 'Jeder Wert geteilt durch seine Spaltensumme', table: { head: [''].concat(cn), rows: t.byCol } },
          { t: 'Anteile je Zeile (Zeile = 100 %)', text: 'Jeder Wert geteilt durch seine Zeilensumme.', table: { head: [''].concat(rn.length ? cn : [], ['Σ']), rows: t.byRow } },
          { t: 'Anteile an der Gesamtzahl', table: { head: [''].concat(cn, ['Σ']), rows: t.tot } },
        ],
        note: [
          `Insgesamt wurden ${F.fmt(t.n)} Beobachtungen ausgezählt. Für die Spalte „${cn[0]}“ entfällt der größte Anteil auf „${rn[M.map((r) => r[0] / t.cs[0]).indexOf(Math.max(...M.map((r) => r[0] / t.cs[0])))]}“.`,
          'Unterscheiden sich die Anteile je Spalte deutlich, deutet das auf einen Zusammenhang der beiden Merkmale hin (prüfen mit dem χ²-Test).',
          'Wichtig ist immer die Bezugsgröße: „Anteil von A innerhalb von B“ und „Anteil von B innerhalb von A“ sind zwei verschiedene Zahlen.',
        ],
      };
    },
  });
})();
