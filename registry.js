/* Verzeichnis aller Verfahren */
(function () {
  const TR = (window.TR = window.TR || {});
  TR.cats = [
    { id: 'desc', name: 'Beschreibende Statistik', short: 'Beschreiben', color: '#0A84FF', glyph: 'x̄' },
    { id: 'zus', name: 'Zusammenhang & Regression', short: 'Regression', color: '#BF5AF2', glyph: 'β' },
    { id: 'norm', name: 'Normalverteilung', short: 'Normal', color: '#30D158', glyph: 'N' },
    { id: 'inf', name: 'Schätzen & Testen', short: 'Testen', color: '#FF9F0A', glyph: 'p' },
    { id: 'fin', name: 'Finanzmathematik', short: 'Finanzen', color: '#FF375F', glyph: '€' },
  ];
  TR.tools = [];
  TR.addTool = (t) => TR.tools.push(t);

  class InputError extends Error {}
  TR.InputError = InputError;

  // Zugriff auf Eingaben mit Prüfung
  TR.makeGetter = function (raw, tool) {
    const label = (id) => (tool.inputs.find((i) => i.id === id) || {}).label || id;
    const names = raw.__names || {};
    return {
      raw,
      // Name der Variable (Spaltenname aus dem Projekt oder Ersatztext)
      nm(id, fallback) {
        return names[id] ? '„' + names[id] + '“' : fallback;
      },
      // „ von „Spalte““ oder leer
      von(id) {
        return names[id] ? ' von „' + names[id] + '“' : '';
      },
      fromProject: Object.keys(names).length > 0,
      num(id, o = {}) {
        const v = TR.F.parseNum(raw[id]);
        if (!isFinite(v)) {
          if (o.optional) return null;
          throw new InputError(`Bitte eine Zahl bei „${label(id)}“ eingeben.`);
        }
        if (o.int && !Number.isInteger(v)) throw new InputError(`„${label(id)}“ muss eine ganze Zahl sein.`);
        if (o.min != null && v < o.min) throw new InputError(`„${label(id)}“ muss mindestens ${TR.F.fmt(o.min)} sein.`);
        if (o.max != null && v > o.max) throw new InputError(`„${label(id)}“ darf höchstens ${TR.F.fmt(o.max)} sein.`);
        if (o.gt != null && v <= o.gt) throw new InputError(`„${label(id)}“ muss größer als ${TR.F.fmt(o.gt)} sein.`);
        if (o.lt != null && v >= o.lt) throw new InputError(`„${label(id)}“ muss kleiner als ${TR.F.fmt(o.lt)} sein.`);
        return v;
      },
      list(id, o = {}) {
        const { values, bad } = TR.F.parseList(raw[id]);
        if (bad.length) throw new InputError(`„${label(id)}“: „${bad[0]}“ ist keine Zahl.`);
        const min = o.min || 1;
        if (values.length < min) throw new InputError(`Bitte mindestens ${min} Werte bei „${label(id)}“ eingeben.`);
        return values;
      },
      texts(id, o = {}) {
        const v = TR.F.parseTextList(raw[id]);
        if (v.length < (o.min || 1)) throw new InputError(`Bitte mindestens ${o.min || 1} Einträge bei „${label(id)}“ eingeben.`);
        return v;
      },
      matrix(id) {
        const m = TR.F.parseMatrix(raw[id]);
        if (m.length < 2) throw new InputError(`Bitte mindestens 2 Zeilen bei „${label(id)}“ eingeben (eine Zeile pro Gruppe).`);
        return m;
      },
      sel(id) {
        return raw[id];
      },
      str(id) {
        return String(raw[id] || '').trim();
      },
    };
  };

  // gemeinsame Bausteine
  TR.alternatives = [
    { v: 'two', t: 'ungleich ≠ (zweiseitig)' },
    { v: 'greater', t: 'größer > (einseitig)' },
    { v: 'less', t: 'kleiner < (einseitig)' },
  ];
  TR.altSym = { two: '\\neq', greater: '>', less: '<' };
  TR.altSymLE = { two: '=', greater: '\\leq', less: '\\geq' };
  TR.levels = [
    { v: '0.95', t: '95 %' },
    { v: '0.9', t: '90 %' },
    { v: '0.99', t: '99 %' },
  ];
  TR.alphas = [
    { v: '0.05', t: 'α = 5 %' },
    { v: '0.01', t: 'α = 1 %' },
    { v: '0.1', t: 'α = 10 %' },
  ];
  // Testentscheidung als Schritt
  TR.decision = function (p, alpha) {
    const F = TR.F;
    const rej = p < alpha;
    return {
      t: 'Testentscheidung',
      tex: `p = ${F.tex(p)} ${rej ? '<' : '\\geq'} \\alpha = ${F.tex(alpha)}`,
      text: rej
        ? `Der p-Wert ist kleiner als α: H₀ wird verworfen. Das Ergebnis ist statistisch signifikant zum Niveau ${F.pct(alpha, 0)}.`
        : `Der p-Wert ist nicht kleiner als α: H₀ kann nicht verworfen werden (das heißt nicht, dass H₀ bewiesen ist). Nicht signifikant zum Niveau ${F.pct(alpha, 0)}.`,
    };
  };
  TR.pFromT = function (t, df, alt) {
    const S = TR.S;
    if (alt === 'greater') return 1 - S.pt(t, df);
    if (alt === 'less') return S.pt(t, df);
    return 2 * (1 - S.pt(Math.abs(t), df));
  };
  TR.pFromZ = function (z, alt) {
    const S = TR.S;
    if (alt === 'greater') return 1 - S.pnorm(z);
    if (alt === 'less') return S.pnorm(z);
    return 2 * (1 - S.pnorm(Math.abs(z)));
  };
  TR.pFormula = function (alt, stat, distTex) {
    if (alt === 'greater') return `p = P(${distTex} \\geq ${stat})`;
    if (alt === 'less') return `p = P(${distTex} \\leq ${stat})`;
    return `p = 2 \\cdot P(${distTex} \\geq |${stat}|)`;
  };
  // Dichte-Grafik einer t- bzw. z-Teststatistik mit p-Bereich
  TR.testChart = function (stat, alt, df) {
    const S = TR.S;
    const fn = df
      ? (x) => Math.exp(S.logGamma((df + 1) / 2) - S.logGamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + (x * x) / df, -(df + 1) / 2)
      : (x) => S.dnorm(x);
    const lim = Math.max(4, Math.abs(stat) * 1.15);
    const a = Math.abs(stat);
    const shade = alt === 'greater' ? [[stat, lim]] : alt === 'less' ? [[-lim, stat]] : [[-lim, -a], [a, lim]];
    return TR.C.density(fn, -lim, lim, shade, { marks: [stat] });
  };
})();
