/* Normalverteilung */
(function () {
  const TR = window.TR, S = TR.S, F = TR.F;
  const muIn = { id: 'mu', label: 'Mittelwert μ', type: 'number', ph: 'z. B. 50' };
  const sdIn = { id: 'sd', label: 'Standardabweichung σ', type: 'number', ph: 'z. B. 8' };

  TR.addTool({
    id: 'normwk', cat: 'norm', title: 'Wahrscheinlichkeit berechnen',
    sub: 'P(X ≤ x), P(X ≥ x), P(a ≤ X ≤ b)',
    keys: 'normalverteilung wahrscheinlichkeit verteilungsfunktion höchstens mindestens zwischen',
    inputs: [
      muIn, sdIn,
      { id: 'mode', label: 'Gesucht', type: 'select', options: [
        { v: 'le', t: 'P(X ≤ x) – höchstens' },
        { v: 'ge', t: 'P(X ≥ x) – mindestens' },
        { v: 'ab', t: 'P(a ≤ X ≤ b) – zwischen' },
        { v: 'out', t: 'P(X < a oder X > b) – außerhalb' },
      ] },
      { id: 'a', label: 'x bzw. untere Grenze a', type: 'number', ph: 'z. B. 85' },
      { id: 'b', label: 'obere Grenze b', type: 'number', ph: 'z. B. 115', showIf: (v) => v.mode === 'ab' || v.mode === 'out' },
    ],
    example: { mu: '60', sd: '12', mode: 'le', a: '48,5', b: '' },
    compute(g) {
      const mu = g.num('mu'), sd = g.num('sd', { gt: 0 }), mode = g.sel('mode');
      const a = g.num('a');
      const za = (a - mu) / sd, Fa = S.pnorm(za);
      const zStep = (x, z, name) => ({ t: `Standardisieren (${name})`, tex: `z = \\frac{${name} - \\mu}{\\sigma} = \\frac{${F.tex(x)} - ${F.texP(mu)}}{${F.tex(sd)}} = ${F.tex(z)}` });
      const steps = [{ t: 'Verteilung', tex: `X \\sim N(\\mu, \\sigma^2) = N(${F.tex(mu)},\\, ${F.tex(sd)}^2)` }];
      let p, lo, hi, label, txt;
      if (mode === 'le' || mode === 'ge') {
        steps.push(zStep(a, za, 'x'));
        steps.push({ t: 'Verteilungsfunktion der Standardnormalverteilung', tex: `\\Phi(${F.tex(za)}) = ${F.tex(Fa)}` });
        if (mode === 'le') {
          p = Fa; lo = -Infinity; hi = a; label = `P(X ≤ ${F.fmt(a)})`;
          steps.push({ t: 'Ergebnis', tex: `P(X \\leq ${F.tex(a)}) = \\Phi(${F.tex(za)}) = ${F.tex(p)}` });
          txt = `Mit einer Wahrscheinlichkeit von ${F.pct(p)} ist ein Wert höchstens ${F.fmt(a)}.`;
        } else {
          p = 1 - Fa; lo = a; hi = Infinity; label = `P(X ≥ ${F.fmt(a)})`;
          steps.push({ t: 'Gegenwahrscheinlichkeit', tex: `P(X \\geq ${F.tex(a)}) = 1 - \\Phi(${F.tex(za)}) = 1 - ${F.tex(Fa)} = ${F.tex(p)}` });
          txt = `Mit einer Wahrscheinlichkeit von ${F.pct(p)} ist ein Wert mindestens ${F.fmt(a)}.`;
        }
      } else {
        const b = g.num('b');
        if (b <= a) throw new TR.InputError('Die obere Grenze b muss größer als a sein.');
        const zb = (b - mu) / sd, Fb = S.pnorm(zb);
        steps.push(zStep(a, za, 'a'), zStep(b, zb, 'b'));
        steps.push({ t: 'Verteilungsfunktion', tex: `\\Phi(${F.tex(za)}) = ${F.tex(Fa)}, \\quad \\Phi(${F.tex(zb)}) = ${F.tex(Fb)}` });
        if (mode === 'ab') {
          p = Fb - Fa; lo = a; hi = b; label = `P(${F.fmt(a)} ≤ X ≤ ${F.fmt(b)})`;
          steps.push({ t: 'Differenz', tex: `P(${F.tex(a)} \\leq X \\leq ${F.tex(b)}) = \\Phi(${F.tex(zb)}) - \\Phi(${F.tex(za)}) = ${F.tex(Fb)} - ${F.tex(Fa)} = ${F.tex(p)}` });
          txt = `${F.pct(p)} der Werte liegen zwischen ${F.fmt(a)} und ${F.fmt(b)}.`;
        } else {
          p = 1 - (Fb - Fa); lo = a; hi = b; label = `P(außerhalb)`;
          steps.push({ t: 'Gegenwahrscheinlichkeit', tex: `P = 1 - (\\Phi(${F.tex(zb)}) - \\Phi(${F.tex(za)})) = 1 - ${F.tex(Fb - Fa)} = ${F.tex(p)}` });
          txt = `${F.pct(p)} der Werte liegen außerhalb von ${F.fmt(a)} bis ${F.fmt(b)}.`;
        }
      }
      const chart = mode === 'out'
        ? TR.C.density((x) => S.dnorm(x, mu, sd), mu - 4 * sd, mu + 4 * sd, [[-Infinity, lo], [hi, Infinity]], { marks: [lo, hi] })
        : TR.C.normal(mu, sd, lo, hi, { marks: [a, mode === 'ab' ? g.num('b') : NaN] });
      return { main: [{ label, value: F.fmt(p), big: true }, { label: 'in Prozent', value: F.pct(p) }], steps, chart, note: txt };
    },
  });

  TR.addTool({
    id: 'normquantil', cat: 'norm', title: 'Quantil / Grenzwert',
    sub: 'Welcher Wert trennt die oberen bzw. unteren x %?',
    keys: 'quantil quantilsfunktion grenze obere untere prozent besten drittel umkehrfunktion',
    inputs: [
      muIn, sdIn,
      { id: 'mode', label: 'Art', type: 'select', options: [
        { v: 'below', t: 'Anteil p liegt unterhalb' },
        { v: 'above', t: 'Anteil p liegt oberhalb (z. B. beste 10 %)' },
        { v: 'mid', t: 'zentraler Bereich mit Anteil p' },
      ] },
      { id: 'p', label: 'Anteil p (z. B. 0,1 oder 10 %)', type: 'number', ph: '0,1' },
    ],
    example: { mu: '60', sd: '12', mode: 'above', p: '5%' },
    compute(g) {
      const mu = g.num('mu'), sd = g.num('sd', { gt: 0 }), mode = g.sel('mode');
      const p = g.num('p', { gt: 0, lt: 1 });
      const steps = [{ t: 'Verteilung', tex: `X \\sim N(${F.tex(mu)},\\, ${F.tex(sd)}^2)` }];
      if (mode === 'mid') {
        const pl = (1 - p) / 2, z = S.qnormStd(1 - pl);
        const lo = mu - z * sd, hi = mu + z * sd;
        steps.push({ t: 'Rand-Anteile', tex: `\\text{je Seite: } \\frac{1-${F.tex(p)}}{2} = ${F.tex(pl)} \\Rightarrow z = \\Phi^{-1}(${F.tex(1 - pl)}) = ${F.tex(z)}` });
        steps.push({ t: 'Zurückrechnen', tex: `\\mu \\pm z \\cdot \\sigma = ${F.tex(mu)} \\pm ${F.tex(z)} \\cdot ${F.tex(sd)} = [${F.tex(lo)};\\; ${F.tex(hi)}]` });
        return {
          main: [{ label: 'Untergrenze', value: F.fmt(lo), big: true }, { label: 'Obergrenze', value: F.fmt(hi), big: true }],
          steps, chart: TR.C.normal(mu, sd, lo, hi, { marks: [lo, hi] }),
          note: `${F.pct(p)} der Werte liegen zwischen ${F.fmt(lo)} und ${F.fmt(hi)}.`,
        };
      }
      const pp = mode === 'below' ? p : 1 - p;
      const z = S.qnormStd(pp), q = mu + z * sd;
      if (mode === 'above') steps.push({ t: 'Umrechnen', text: `Oberhalb soll der Anteil ${F.fmt(p)} liegen, also unterhalb 1 − ${F.fmt(p)} = ${F.fmt(pp)}.` });
      steps.push({ t: 'z-Quantil der Standardnormalverteilung', tex: `z = \\Phi^{-1}(${F.tex(pp)}) = ${F.tex(z)}` });
      steps.push({ t: 'Zurückrechnen (z-Transformation umkehren)', tex: `q = \\mu + z \\cdot \\sigma = ${F.tex(mu)} + ${F.texP(z)} \\cdot ${F.tex(sd)} = ${F.tex(q)}` });
      return {
        main: [{ label: `${F.pct(pp, 1)}-Quantil`, value: F.fmt(q), big: true }, { label: 'z-Wert', value: F.fmt(z) }],
        steps,
        chart: TR.C.normal(mu, sd, mode === 'below' ? -Infinity : q, mode === 'below' ? q : Infinity, { marks: [q] }),
        note: mode === 'above' ? `Ab einem Wert von ${F.fmt(q)} gehört man zu den oberen ${F.pct(p, 1)}.` : `${F.pct(p, 1)} der Werte liegen unter ${F.fmt(q)}.`,
      };
    },
  });

  TR.addTool({
    id: 'ztrans', cat: 'norm', title: 'z-Transformation',
    sub: 'x → z oder z → x',
    keys: 'z transformation standardisierung z wert umrechnen standardnormal',
    inputs: [
      muIn, sdIn,
      { id: 'mode', label: 'Richtung', type: 'select', options: [{ v: 'xz', t: 'x gegeben → z berechnen' }, { v: 'zx', t: 'z gegeben → x berechnen' }] },
      { id: 'v', label: 'Wert (x bzw. z)', type: 'number', ph: 'z. B. 62' },
    ],
    example: { mu: '50', sd: '8', mode: 'xz', v: '62' },
    compute(g) {
      const mu = g.num('mu'), sd = g.num('sd', { gt: 0 }), v = g.num('v');
      if (g.sel('mode') === 'xz') {
        const z = (v - mu) / sd;
        return {
          main: [{ label: 'z-Wert', value: F.fmt(z), big: true }, { label: 'Anteil darunter Φ(z)', value: F.pct(S.pnorm(z)) }],
          steps: [
            { t: 'Formel', tex: `z = \\frac{x - \\mu}{\\sigma} = \\frac{${F.tex(v)} - ${F.texP(mu)}}{${F.tex(sd)}} = ${F.tex(z)}` },
            { t: 'Einordnung', tex: `\\Phi(${F.tex(z)}) = ${F.tex(S.pnorm(z))}` },
          ],
          chart: TR.C.normal(0, 1, -Infinity, z, { marks: [z] }),
          note: `Der Wert ${F.fmt(v)} liegt ${F.fmt(Math.abs(z))} Standardabweichungen ${z >= 0 ? 'über' : 'unter'} dem Mittelwert. ${Math.abs(z) > 2 ? 'Das ist eher ungewöhnlich (|z| > 2, außerhalb der mittleren 95 %).' : 'Das ist ein üblicher Wert (|z| ≤ 2).'}`,
        };
      }
      const x = mu + v * sd;
      return {
        main: [{ label: 'x-Wert', value: F.fmt(x), big: true }],
        steps: [{ t: 'Umgestellte Formel', tex: `x = \\mu + z \\cdot \\sigma = ${F.tex(mu)} + ${F.texP(v)} \\cdot ${F.tex(sd)} = ${F.tex(x)}` }],
        chart: TR.C.normal(mu, sd, -Infinity, x, { marks: [x] }),
        note: `z = ${F.fmt(v)} entspricht dem Wert ${F.fmt(x)}.`,
      };
    },
  });

  TR.addTool({
    id: 'zvergleich', cat: 'norm', title: 'Zwei Ergebnisse vergleichen',
    sub: 'Wer war besser? (verschiedene Skalen)',
    keys: 'vergleich zwei tests besser abgeschnitten z wert verschiedene verteilungen',
    inputs: [
      { id: 'x1', label: 'Ergebnis A', type: 'number', ph: 'z. B. 80' },
      { id: 'm1', label: 'μ von A', type: 'number', ph: 'z. B. 70' },
      { id: 's1', label: 'σ von A', type: 'number', ph: 'z. B. 8' },
      { id: 'x2', label: 'Ergebnis B', type: 'number', ph: 'z. B. 310' },
      { id: 'm2', label: 'μ von B', type: 'number', ph: 'z. B. 280' },
      { id: 's2', label: 'σ von B', type: 'number', ph: 'z. B. 20' },
    ],
    example: { x1: '82', m1: '70', s1: '8', x2: '318', m2: '290', s2: '20' },
    compute(g) {
      const x1 = g.num('x1'), m1 = g.num('m1'), s1 = g.num('s1', { gt: 0 });
      const x2 = g.num('x2'), m2 = g.num('m2'), s2 = g.num('s2', { gt: 0 });
      const z1 = (x1 - m1) / s1, z2 = (x2 - m2) / s2;
      const better = Math.abs(z1 - z2) < 1e-12 ? 'Beide sind gleich gut.' : z1 > z2 ? 'A hat relativ besser abgeschnitten.' : 'B hat relativ besser abgeschnitten.';
      return {
        main: [{ label: 'z von A', value: F.fmt(z1), big: true }, { label: 'z von B', value: F.fmt(z2), big: true }, { label: 'Perzentil A', value: F.pct(S.pnorm(z1), 1) }, { label: 'Perzentil B', value: F.pct(S.pnorm(z2), 1) }],
        steps: [
          { t: 'A standardisieren', tex: `z_A = \\frac{${F.tex(x1)} - ${F.texP(m1)}}{${F.tex(s1)}} = ${F.tex(z1)}` },
          { t: 'B standardisieren', tex: `z_B = \\frac{${F.tex(x2)} - ${F.texP(m2)}}{${F.tex(s2)}} = ${F.tex(z2)}` },
          { t: 'Vergleich', tex: `z_A = ${F.tex(z1)} \\; ${z1 > z2 ? '>' : z1 < z2 ? '<' : '='} \\; z_B = ${F.tex(z2)}`, text: better },
        ],
        note: better + ' Durch die z-Transformation werden Ergebnisse verschiedener Skalen vergleichbar.',
      };
    },
  });

  TR.addTool({
    id: 'regel68', cat: 'norm', title: '68-95-99,7-Regel',
    sub: 'Bereiche μ ± 1σ, 2σ, 3σ',
    keys: '68 95 99,7 regel sigma bereiche faustregel üblich ungewöhnlich',
    inputs: [muIn, sdIn],
    example: { mu: '70', sd: '6' },
    compute(g) {
      const mu = g.num('mu'), sd = g.num('sd', { gt: 0 });
      const rows = [1, 2, 3].map((k) => [`μ ± ${k}σ`, `${F.fmt(mu - k * sd)} bis ${F.fmt(mu + k * sd)}`, ['≈ 68 %', '≈ 95 %', '≈ 99,7 %'][k - 1], F.pct(S.pnorm(k) - S.pnorm(-k), 2)]);
      return {
        main: [{ label: '95 %-Bereich', value: `${F.fmt(mu - 2 * sd)} – ${F.fmt(mu + 2 * sd)}`, big: true, wide: true }],
        steps: [{ t: 'Bereiche', table: { head: ['Bereich', 'Werte', 'Faustregel', 'exakt'], rows } }],
        chart: TR.C.normal(mu, sd, mu - 2 * sd, mu + 2 * sd, { marks: [mu - sd, mu + sd, mu - 3 * sd, mu + 3 * sd] }),
        note: 'Werte außerhalb von μ ± 2σ gelten als eher ungewöhnlich, außerhalb von μ ± 3σ als sehr selten.',
      };
    },
  });
})();
