/* Zusammenhang & Regression */
(function () {
  const TR = window.TR, S = TR.S, F = TR.F;
  const HINT = 'Werte mit Semikolon, Leerzeichen oder neuer Zeile trennen. Gleiche Reihenfolge bei x und y.';

  function pair(g) {
    const x = g.list('x', { min: 3 }), y = g.list('y', { min: 3 });
    if (x.length !== y.length) throw new TR.InputError(`x hat ${x.length} Werte, y hat ${y.length} Werte – es müssen gleich viele sein.`);
    if (S.sd(x) === 0) throw new TR.InputError('Alle x-Werte sind gleich – dann ist keine Berechnung möglich.');
    return { x, y, n: x.length };
  }

  // ---------- Kovarianz & Korrelation ----------
  TR.addTool({
    id: 'korrelation', cat: 'zus', title: 'Kovarianz & Korrelation',
    sub: 'Pearson r, Spearman, mit Rechentabelle',
    keys: 'korrelation kovarianz pearson bravais spearman rang zusammenhang r streudiagramm',
    inputs: [
      { id: 'x', label: 'x-Werte', type: 'list', ph: 'z. B. 2; 4; 5; 7; 9', hint: HINT },
      { id: 'y', label: 'y-Werte', type: 'list', ph: 'z. B. 1; 3; 4; 4; 6' },
    ],
    example: { x: '3; 5; 6; 8; 10; 12', y: '41; 47; 50; 55; 60; 69' },
    compute(g) {
      const { x, y, n } = pair(g);
      if (S.sd(y) === 0) throw new TR.InputError('Alle y-Werte sind gleich – die Korrelation ist nicht definiert.');
      const mx = S.mean(x), my = S.mean(y);
      const dx = x.map((v) => v - mx), dy = y.map((v) => v - my);
      const sxx = S.sum(dx.map((d) => d * d)), syy = S.sum(dy.map((d) => d * d)), sxy = S.sum(dx.map((d, i) => d * dy[i]));
      const vx = sxx / (n - 1), vy = syy / (n - 1), cov = sxy / (n - 1);
      const r = cov / Math.sqrt(vx * vy);
      const rx = S.ranks(x), ry = S.ranks(y);
      const rs = S.covariance(rx, ry) / (S.sd(rx) * S.sd(ry));
      const rows = x.map((v, i) => [i + 1, F.fmt(v), F.fmt(y[i]), F.fmt(dx[i]), F.fmt(dy[i]), F.fmt(dx[i] ** 2), F.fmt(dy[i] ** 2), F.fmt(dx[i] * dy[i])]);
      rows.push(['Σ', F.fmt(S.sum(x)), F.fmt(S.sum(y)), '0', '0', F.fmt(sxx), F.fmt(syy), F.fmt(sxy)]);
      const strength = Math.abs(r) >= 0.7 ? 'starker' : Math.abs(r) >= 0.3 ? 'mittlerer' : 'schwacher';
      return {
        main: [
          { label: 'Korrelation r', value: F.fmt(r), big: true },
          { label: 'Kovarianz sₓᵧ', value: F.fmt(cov) },
          { label: 'Spearman (Rang)', value: F.fmt(rs) },
          { label: 'sₓ', value: F.fmt(Math.sqrt(vx)) },
          { label: 'sᵧ', value: F.fmt(Math.sqrt(vy)) },
          { label: 'R² = r²', value: F.fmt(r * r) },
        ],
        steps: [
          { t: 'Mittelwerte', tex: `\\bar{x} = \\frac{${F.tex(S.sum(x))}}{${n}} = ${F.tex(mx)}, \\quad \\bar{y} = \\frac{${F.tex(S.sum(y))}}{${n}} = ${F.tex(my)}` },
          { t: 'Rechentabelle', table: { head: ['i', 'xᵢ', 'yᵢ', 'xᵢ−x̄', 'yᵢ−ȳ', '(xᵢ−x̄)²', '(yᵢ−ȳ)²', '(xᵢ−x̄)(yᵢ−ȳ)'], rows } },
          { t: 'Varianzen und Standardabweichungen', tex: `s_x^2 = \\frac{${F.tex(sxx)}}{${n - 1}} = ${F.tex(vx)}, \\; s_x = ${F.tex(Math.sqrt(vx))} \\qquad s_y^2 = \\frac{${F.tex(syy)}}{${n - 1}} = ${F.tex(vy)}, \\; s_y = ${F.tex(Math.sqrt(vy))}` },
          { t: 'Kovarianz', tex: `s_{xy} = \\frac{1}{n-1}\\sum (x_i-\\bar{x})(y_i-\\bar{y}) = \\frac{${F.tex(sxy)}}{${n - 1}} = ${F.tex(cov)}` },
          { t: 'Korrelationskoeffizient nach Pearson', tex: `r = \\frac{s_{xy}}{s_x \\cdot s_y} = \\frac{${F.tex(cov)}}{${F.tex(Math.sqrt(vx))} \\cdot ${F.tex(Math.sqrt(vy))}} = ${F.tex(r)}` },
          { t: 'Rangkorrelation nach Spearman', text: 'Gleiche Rechnung, aber mit den Rängen statt den Werten (bei Gleichstand mittlere Ränge).', table: { head: ['Rang x', 'Rang y'], rows: rx.map((v, i) => [F.fmt(v), F.fmt(ry[i])]) }, tex: `r_s = ${F.tex(rs)}` },
        ],
        chart: TR.C.scatter(x, y),
        note: [
          `Zwischen ${g.nm('x', 'x')} und ${g.nm('y', 'y')} besteht ein ${strength} ${r > 0 ? 'positiver' : 'negativer'} linearer Zusammenhang (r = ${F.fmt(r, 3)}).`,
          r > 0 ? 'Höhere x-Werte gehen tendenziell mit höheren y-Werten einher.' : 'Höhere x-Werte gehen tendenziell mit niedrigeren y-Werten einher.',
          `r² = ${F.fmt(r * r, 3)}: ${F.pct(r * r, 1)} der Streuung lassen sich durch den linearen Zusammenhang beschreiben.`,
          'Achtung: Korrelation bedeutet nicht automatisch Kausalität, und ein Streudiagramm sollte immer mit angeschaut werden (Ausreißer, nicht-lineare Muster).',
        ],
      };
    },
  });

  // ---------- Einfache lineare Regression ----------
  TR.linReg = function (x, y) {
    const n = x.length, mx = S.mean(x), my = S.mean(y);
    const sxx = S.sum(x.map((v) => (v - mx) ** 2)), sxy = S.sum(x.map((v, i) => (v - mx) * (y[i] - my)));
    const b1 = sxy / sxx, b0 = my - b1 * mx;
    const yhat = x.map((v) => b0 + b1 * v), res = y.map((v, i) => v - yhat[i]);
    const sse = S.sum(res.map((e) => e * e)), sst = S.sum(y.map((v) => (v - my) ** 2)), ssr = sst - sse;
    const df = n - 2;
    const sigma = Math.sqrt(sse / df);
    const se1 = sigma / Math.sqrt(sxx), se0 = sigma * Math.sqrt(1 / n + (mx * mx) / sxx);
    return { n, mx, my, sxx, sxy, b1, b0, yhat, res, sse, sst, ssr, r2: sst ? ssr / sst : 0, df, sigma, se1, se0 };
  };

  TR.addTool({
    id: 'regression', cat: 'zus', title: 'Einfache lineare Regression',
    sub: 'Gerade, R², Prognose, p-Werte',
    keys: 'regression linear gerade steigung achsenabschnitt kleinste quadrate bestimmtheitsmaß r2 prognose residuen vorhersage',
    inputs: [
      { id: 'x', label: 'x-Werte (unabhängige Variable)', type: 'list', ph: 'z. B. 10; 15; 20; 25; 30', hint: HINT },
      { id: 'y', label: 'y-Werte (abhängige Variable)', type: 'list', ph: 'z. B. 1,8; 2,4; 3,1; 3,3; 4,2' },
      { id: 'x0', label: 'Prognose für x₀ (optional)', type: 'number', ph: 'z. B. 22', optional: true },
      { id: 'lv', label: 'Konfidenzniveau', type: 'select', options: TR.levels },
    ],
    example: { x: '12; 18; 25; 9; 31; 22; 15; 28', y: '2,1; 2,9; 3,8; 1,6; 4,4; 3,0; 2,5; 4,1', x0: '20', lv: '0.95' },
    compute(g) {
      const { x, y, n } = pair(g);
      if (n < 3) throw new TR.InputError('Mindestens 3 Wertepaare nötig.');
      const L = TR.linReg(x, y);
      const lv = parseFloat(g.sel('lv'));
      const steps = [
        { t: 'Modell', tex: `\\hat{y} = \\hat\\beta_0 + \\hat\\beta_1 \\cdot x \\qquad \\text{(Methode der kleinsten Quadrate)}` },
        { t: 'Mittelwerte', tex: `\\bar{x} = ${F.tex(L.mx)}, \\quad \\bar{y} = ${F.tex(L.my)}` },
        { t: 'Steigung', tex: `\\hat\\beta_1 = \\frac{s_{xy}}{s_x^2} = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2} = \\frac{${F.tex(L.sxy)}}{${F.tex(L.sxx)}} = ${F.tex(L.b1)}` },
        { t: 'Achsenabschnitt', tex: `\\hat\\beta_0 = \\bar{y} - \\hat\\beta_1 \\cdot \\bar{x} = ${F.tex(L.my)} - ${F.texP(L.b1)} \\cdot ${F.texP(L.mx)} = ${F.tex(L.b0)}` },
        { t: 'Geschätzte Regressionsgleichung', tex: `\\hat{y} = ${F.tex(L.b0)} ${L.b1 < 0 ? '-' : '+'} ${F.tex(Math.abs(L.b1))} \\cdot x` },
        {
          t: 'Angepasste Werte und Residuen',
          table: { head: ['xᵢ', 'yᵢ', 'ŷᵢ', 'eᵢ = yᵢ − ŷᵢ', 'eᵢ²'], rows: x.map((v, i) => [F.fmt(v), F.fmt(y[i]), F.fmt(L.yhat[i]), F.fmt(L.res[i]), F.fmt(L.res[i] ** 2)]).concat([['Σ', '', '', '0', F.fmt(L.sse)]]) },
        },
        { t: 'Bestimmtheitsmaß', tex: `R^2 = 1 - \\frac{\\sum (y_i-\\hat{y}_i)^2}{\\sum (y_i-\\bar{y})^2} = 1 - \\frac{${F.tex(L.sse)}}{${F.tex(L.sst)}} = ${F.tex(L.r2)}` },
      ];
      const main = [
        { label: 'Gleichung', value: `ŷ = ${F.fmt(L.b0)} ${L.b1 < 0 ? '−' : '+'} ${F.fmt(Math.abs(L.b1))} · x`, big: true, wide: true },
        { label: 'Steigung β̂₁', value: F.fmt(L.b1) },
        { label: 'Achsenabschnitt β̂₀', value: F.fmt(L.b0) },
        { label: 'R²', value: F.fmt(L.r2) },
      ];
      if (n > 2) {
        const t1 = L.b1 / L.se1, p1 = 2 * (1 - S.pt(Math.abs(t1), L.df));
        const t0 = L.b0 / L.se0, p0 = 2 * (1 - S.pt(Math.abs(t0), L.df));
        const tq = S.qt(1 - (1 - lv) / 2, L.df);
        steps.push({ t: 'Residuenstandardfehler', tex: `\\hat\\sigma = \\sqrt{\\frac{\\sum e_i^2}{n-2}} = \\sqrt{\\frac{${F.tex(L.sse)}}{${L.df}}} = ${F.tex(L.sigma)}` });
        steps.push({ t: 'Standardfehler der Steigung', tex: `se(\\hat\\beta_1) = \\frac{\\hat\\sigma}{\\sqrt{\\sum (x_i-\\bar{x})^2}} = \\frac{${F.tex(L.sigma)}}{\\sqrt{${F.tex(L.sxx)}}} = ${F.tex(L.se1)}` });
        steps.push({ t: 'Test H₀: β₁ = 0', tex: `t = \\frac{\\hat\\beta_1 - 0}{se(\\hat\\beta_1)} = \\frac{${F.tex(L.b1)}}{${F.tex(L.se1)}} = ${F.tex(t1)}, \\quad df = n-2 = ${L.df}, \\quad p = ${F.tex(p1)}`, text: 'Der beobachtete Wert ist |t| Standardfehler von 0 entfernt.' });
        steps.push({ t: `${F.pct(lv, 0)}-Konfidenzintervall für β₁`, tex: `\\hat\\beta_1 \\pm t_{${F.tex(1 - (1 - lv) / 2)};\\,${L.df}} \\cdot se = ${F.tex(L.b1)} \\pm ${F.tex(tq)} \\cdot ${F.tex(L.se1)} = [${F.tex(L.b1 - tq * L.se1)};\\; ${F.tex(L.b1 + tq * L.se1)}]` });
        main.push({ label: 'p-Wert Steigung', value: F.fmtP(p1) }, { label: 'p-Wert Achsenabschnitt', value: F.fmtP(p0) }, { label: 'σ̂ (Residual SE)', value: F.fmt(L.sigma) });
        steps.push({
          t: 'Zusammenfassung der Koeffizienten',
          table: { head: ['', 'Schätzwert', 'Std.-Fehler', 't-Wert', 'p-Wert'], rows: [['Achsenabschnitt', F.fmt(L.b0), F.fmt(L.se0), F.fmt(t0, 3), F.fmtP(p0)], ['x', F.fmt(L.b1), F.fmt(L.se1), F.fmt(t1, 3), F.fmtP(p1)]] },
        });
      }
      const x0 = g.num('x0', { optional: true });
      if (x0 != null) {
        const y0 = L.b0 + L.b1 * x0;
        main.splice(1, 0, { label: `Prognose ŷ(${F.fmt(x0)})`, value: F.fmt(y0) });
        const step = { t: `Punktprognose für x₀ = ${F.fmt(x0)}`, tex: `\\hat{y}_0 = ${F.tex(L.b0)} ${L.b1 < 0 ? '-' : '+'} ${F.tex(Math.abs(L.b1))} \\cdot ${F.texP(x0)} = ${F.tex(y0)}` };
        if (n > 2) {
          const tq = S.qt(1 - (1 - lv) / 2, L.df);
          const sePred = L.sigma * Math.sqrt(1 + 1 / n + (x0 - L.mx) ** 2 / L.sxx);
          const seConf = L.sigma * Math.sqrt(1 / n + (x0 - L.mx) ** 2 / L.sxx);
          step.text = `${F.pct(lv, 0)}-Prognoseintervall (für einen einzelnen y-Wert): [${F.fmt(y0 - tq * sePred)}; ${F.fmt(y0 + tq * sePred)}]. ${F.pct(lv, 0)}-Konfidenzintervall (für den Mittelwert von y): [${F.fmt(y0 - tq * seConf)}; ${F.fmt(y0 + tq * seConf)}].`;
          if (x0 < Math.min(...x) || x0 > Math.max(...x)) step.text += ' Achtung: x₀ liegt außerhalb der beobachteten x-Werte (Extrapolation)!';
        }
        steps.push(step);
      }
      return {
        main, steps,
        chart: TR.C.scatter(x, y, { b0: L.b0, b1: L.b1 }),
        note: [
          `Steigt ${g.nm('x', 'x')} um eine Einheit, ${L.b1 >= 0 ? 'steigt' : 'sinkt'} ${g.nm('y', 'y')} im Mittel um ${F.fmt(Math.abs(L.b1))}.`,
          `Der Achsenabschnitt ${F.fmt(L.b0)} ist der modellierte Wert bei x = 0 (nur sinnvoll interpretierbar, wenn x = 0 im Datenbereich liegt).`,
          `Das Modell erklärt ${F.pct(L.r2, 1)} der Variation von ${g.nm('y', 'y')} (R² = ${F.fmt(L.r2, 3)}) – ${L.r2 >= 0.7 ? 'eine hohe' : L.r2 >= 0.3 ? 'eine mittlere' : 'eine geringe'} Erklärungskraft.`,
          n > 2 ? (2 * (1 - S.pt(Math.abs(L.b1 / L.se1), L.df)) < 0.05 ? `Der Zusammenhang ist signifikant (p-Wert der Steigung < 0,05): Es gibt Hinweise auf einen echten linearen Zusammenhang in der Population.` : `Der Zusammenhang ist nicht signifikant (p-Wert der Steigung ≥ 0,05): Er könnte auch zufällig entstanden sein.`) : '',
        ].filter(Boolean),
      };
    },
  });

  // ---------- Multiple Regression ----------
  TR.addTool({
    id: 'multireg', cat: 'zus', title: 'Multiple Regression',
    sub: 'Bis zu 3 erklärende Variablen, Matrixformel',
    keys: 'multiple regression mehrere variablen matrix ceteris paribus dummy koeffizienten adjusted r2',
    inputs: [
      { id: 'y', label: 'y-Werte (abhängige Variable)', type: 'list', ph: 'z. B. 5; 7; 8; 11; 12; 14', hint: HINT },
      { id: 'x1', label: 'x₁-Werte', type: 'list', ph: 'z. B. 1; 2; 3; 4; 5; 6' },
      { id: 'x2', label: 'x₂-Werte', type: 'list', ph: 'z. B. 0; 1; 0; 1; 0; 1', hint: 'Kategoriale Variable als Dummy 0/1 eingeben.' },
      { id: 'x3', label: 'x₃-Werte (optional)', type: 'list', ph: 'leer lassen, wenn nicht benötigt', optional: true },
    ],
    example: { y: '3,1; 4,0; 2,2; 5,1; 3,6; 4,8; 2,9; 5,5; 3,3; 4,4', x1: '15; 22; 10; 30; 18; 27; 14; 33; 16; 25', x2: '0; 1; 0; 1; 1; 0; 1; 0; 0; 1', x3: '' },
    compute(g) {
      const y = g.list('y', { min: 4 });
      const xs = [g.list('x1', { min: 2 }), g.list('x2', { min: 2 })];
      if (g.str('x3')) xs.push(g.list('x3', { min: 2 }));
      xs.forEach((x, j) => { if (x.length !== y.length) throw new TR.InputError(`x${j + 1} hat ${x.length} Werte, y hat ${y.length} – es müssen gleich viele sein.`); });
      const n = y.length, k = xs.length;
      if (n <= k + 1) throw new TR.InputError(`Für ${k} Variablen werden mindestens ${k + 2} Beobachtungen benötigt.`);
      const X = y.map((_, i) => [1].concat(xs.map((x) => x[i])));
      const Xt = S.transpose(X);
      const XtX = S.matMul(Xt, X);
      const inv = S.inverse(XtX);
      if (!inv) throw new TR.InputError('Die Variablen sind linear abhängig (z. B. identische Spalten) – keine eindeutige Lösung.');
      const Xty = S.matMul(Xt, y.map((v) => [v]));
      const b = S.matMul(inv, Xty).map((r) => r[0]);
      const yhat = X.map((row) => row.reduce((s, v, j) => s + v * b[j], 0));
      const res = y.map((v, i) => v - yhat[i]);
      const my = S.mean(y);
      const sse = S.sum(res.map((e) => e * e)), sst = S.sum(y.map((v) => (v - my) ** 2));
      const r2 = 1 - sse / sst, df = n - k - 1;
      const adj = 1 - (1 - r2) * (n - 1) / df;
      const sigma2 = sse / df;
      const se = b.map((_, j) => Math.sqrt(sigma2 * inv[j][j]));
      const tv = b.map((v, j) => v / se[j]);
      const pv = tv.map((t) => 2 * (1 - S.pt(Math.abs(t), df)));
      const Fst = ((sst - sse) / k) / sigma2, pF = 1 - S.pf(Fst, k, df);
      const names = ['Achsenabschnitt', 'x₁', 'x₂', 'x₃'];
      const eq = 'ŷ = ' + F.fmt(b[0]) + b.slice(1).map((v, j) => ` ${v < 0 ? '−' : '+'} ${F.fmt(Math.abs(v))}·x${'₁₂₃'[j]}`).join('');
      const texM = (M) => '\\begin{pmatrix}' + M.map((r) => r.map((v) => F.tex(v, 3)).join(' & ')).join(' \\\\ ') + '\\end{pmatrix}';
      return {
        main: [
          { label: 'Gleichung', value: eq, big: true, wide: true },
          { label: 'R²', value: F.fmt(r2) },
          { label: 'R² (adjustiert)', value: F.fmt(adj) },
          { label: 'σ̂', value: F.fmt(Math.sqrt(sigma2)) },
          { label: 'F-Test p-Wert', value: F.fmtP(pF) },
        ],
        steps: [
          { t: 'Modell', tex: `y_i = \\beta_0 + ${xs.map((_, j) => `\\beta_${j + 1} x_{i${j + 1}}`).join(' + ')} + \\epsilon_i` },
          { t: 'Lösung nach der Methode der kleinsten Quadrate', tex: `\\hat\\beta = (X^T X)^{-1} X^T y` },
          { t: 'Matrix XᵀX', tex: `X^TX = ${texM(XtX)}` },
          { t: 'Vektor Xᵀy', tex: `X^Ty = ${texM(Xty)}` },
          { t: 'Ergebnis', tex: `\\hat\\beta = ${texM(b.map((v) => [v]))}` },
          { t: 'Bestimmtheitsmaß', tex: `R^2 = 1 - \\frac{${F.tex(sse)}}{${F.tex(sst)}} = ${F.tex(r2)}, \\quad R^2_{adj} = 1-(1-R^2)\\frac{n-1}{n-k-1} = ${F.tex(adj)}` },
          {
            t: 'Koeffiziententabelle',
            table: { head: ['', 'Schätzwert', 'Std.-Fehler', 't-Wert', 'p-Wert'], rows: b.map((v, j) => [names[j], F.fmt(v), F.fmt(se[j]), F.fmt(tv[j], 3), F.fmtP(pv[j])]) },
          },
          { t: 'F-Test (Modell insgesamt)', tex: `F = \\frac{(SST-SSE)/k}{SSE/(n-k-1)} = ${F.tex(Fst)}, \\quad df = (${k};\\,${df}), \\quad p = ${F.tex(pF)}` },
        ],
        note: [
          ...b.slice(1).map((v, j) => `${g.nm('x' + (j + 1), 'x' + '₁₂₃'[j])}: Steigt diese Variable um 1 (alle anderen konstant), ${v >= 0 ? 'steigt' : 'sinkt'} ${g.nm('y', 'y')} im Mittel um ${F.fmt(Math.abs(v))} – ${pv[j + 1] < 0.05 ? 'signifikant (p < 0,05).' : 'nicht signifikant (p ≥ 0,05).'}`),
          `Das Modell erklärt ${F.pct(r2, 1)} der Variation (adjustiert: ${F.pct(adj, 1)}). ${pF < 0.05 ? 'Insgesamt ist das Modell signifikant.' : 'Insgesamt ist das Modell nicht signifikant.'}`,
          'Bei einer Dummy-Variable (0/1) gibt der Koeffizient den Unterschied der Gruppe „1“ zur Referenzgruppe „0“ an.',
        ],
      };
    },
  });

  // ---------- Prognose mit gegebener Gleichung ----------
  TR.addTool({
    id: 'prognose', cat: 'zus', title: 'Regressionsgleichung einsetzen',
    sub: 'Prognose aus Koeffizienten (z. B. aus einer Aufgabe)',
    keys: 'prognose vorhersage einsetzen koeffizienten gleichung dummy wechselwirkung interaktion',
    inputs: [
      { id: 'b0', label: 'Achsenabschnitt β̂₀', type: 'number', ph: 'z. B. 12,5' },
      { id: 'b', label: 'Koeffizienten β̂₁, β̂₂, …', type: 'list', ph: 'z. B. 2,4; −3,1', hint: 'Bei Wechselwirkung den Koeffizienten der Interaktion ebenfalls eintragen.' },
      { id: 'x', label: 'Werte der Variablen x₁, x₂, …', type: 'list', ph: 'z. B. 6; 1', hint: 'Dummy: 1 = Kategorie trifft zu, 0 = Referenz. Interaktion: Produkt der beiden Werte eintragen.' },
    ],
    example: { b0: '12,5', b: '2,4; −3,1; 0,8', x: '6; 1; 6' },
    compute(g) {
      const b0 = g.num('b0');
      const b = g.list('b', { min: 1 }), x = g.list('x', { min: 1 });
      if (b.length !== x.length) throw new TR.InputError('Es müssen genauso viele x-Werte wie Koeffizienten eingegeben werden.');
      const parts = b.map((v, i) => v * x[i]);
      const y = b0 + S.sum(parts);
      return {
        main: [{ label: 'Prognose ŷ', value: F.fmt(y), big: true }],
        steps: [
          { t: 'Einsetzen', tex: `\\hat{y} = ${F.tex(b0)} ${b.map((v, i) => `${v < 0 ? '-' : '+'} ${F.tex(Math.abs(v))} \\cdot ${F.texP(x[i])}`).join(' ')}` },
          { t: 'Einzelne Summanden', table: { head: ['Koeffizient', 'x', 'Produkt'], rows: [['β̂₀', '–', F.fmt(b0)]].concat(b.map((v, i) => [F.fmt(v), F.fmt(x[i]), F.fmt(parts[i])])) } },
          { t: 'Ergebnis', tex: `\\hat{y} = ${F.tex(y)}` },
        ],
        note: [`Für die eingesetzten Werte sagt das Modell im Mittel ${F.fmt(y)} voraus.`, 'Die Prognose ist ein geschätzter Mittelwert – einzelne Beobachtungen streuen um diesen Wert. Vorsicht bei x-Werten außerhalb des beobachteten Bereichs (Extrapolation).'],
      };
    },
  });
})();
