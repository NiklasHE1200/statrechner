/* Kleine SVG-Diagramme. window.TR.C */
(function () {
  const TR = (window.TR = window.TR || {});
  const W = 340, H = 190, PL = 34, PR = 12, PT = 14, PB = 30;

  function niceTicks(min, max, count = 5) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const start = Math.ceil(min / step - 1e-9) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }
  const f = (v) => TR.F.fmt(v, 3);
  const svg = (inner, h = H) =>
    `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

  function axes(xmin, xmax, ymin, ymax, opts = {}) {
    const sx = (v) => PL + ((v - xmin) / (xmax - xmin || 1)) * (W - PL - PR);
    const sy = (v) => H - PB - ((v - ymin) / (ymax - ymin || 1)) * (H - PT - PB);
    let g = `<line class="ch-axis" x1="${PL}" y1="${H - PB}" x2="${W - PR}" y2="${H - PB}"/>`;
    if (!opts.noX) niceTicks(xmin, xmax, opts.xTicks || 5).forEach((t) => {
      if (t < xmin - 1e-9 || t > xmax + 1e-9) return;
      g += `<text class="ch-text" x="${sx(t)}" y="${H - PB + 16}" text-anchor="middle">${f(t)}</text>`;
    });
    if (!opts.noY) niceTicks(ymin, ymax, 4).forEach((t) => {
      if (t < ymin - 1e-9 || t > ymax + 1e-9) return;
      g += `<line class="ch-grid" x1="${PL}" y1="${sy(t)}" x2="${W - PR}" y2="${sy(t)}"/>`;
      g += `<text class="ch-text" x="${PL - 5}" y="${sy(t) + 3}" text-anchor="end">${f(t)}</text>`;
    });
    return { sx, sy, g };
  }

  // Säulendiagramm (labels, Werte, optional hervorgehobene Indizes)
  function bars(labels, values, hl = () => false) {
    const ymax = Math.max(...values, 0) * 1.1 || 1;
    const { sy, g } = axes(0, 1, 0, ymax, { noX: true });
    const n = values.length;
    const bw = (W - PL - PR) / n;
    let out = g;
    values.forEach((v, i) => {
      const x = PL + i * bw + bw * 0.12;
      const y = sy(v);
      out += `<rect class="${hl(i) ? 'ch-hl' : 'ch-bar'}" x="${x}" y="${y}" width="${bw * 0.76}" height="${Math.max(0, H - PB - y)}" rx="${Math.min(5, bw * 0.2)}"/>`;
      const showLabel = n <= 14 || i % Math.ceil(n / 14) === 0;
      if (showLabel) out += `<text class="ch-text" x="${x + bw * 0.38}" y="${H - PB + 16}" text-anchor="middle">${TR.F.esc(labels[i])}</text>`;
    });
    return svg(out);
  }

  // Histogramm aus Werten
  function histogram(values, opts = {}) {
    const min = Math.min(...values), max = Math.max(...values);
    let k = opts.bins || Math.min(30, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const width = (max - min) / k || 1;
    const counts = new Array(k).fill(0);
    values.forEach((v) => { let i = Math.floor((v - min) / width); if (i >= k) i = k - 1; counts[i]++; });
    const ymax = Math.max(...counts) * 1.1;
    const { sx, sy, g } = axes(min, min + k * width, 0, ymax);
    let out = g;
    counts.forEach((c, i) => {
      const x0 = sx(min + i * width), x1 = sx(min + (i + 1) * width);
      const mid = min + (i + 0.5) * width;
      const cls = opts.hl && opts.hl(mid) ? 'ch-hl' : 'ch-bar';
      out += `<rect class="${cls}" x="${x0 + 0.5}" y="${sy(c)}" width="${Math.max(0.5, x1 - x0 - 1)}" height="${H - PB - sy(c)}" rx="1.5"/>`;
    });
    (opts.vlines || []).forEach((v) => {
      if (v < min || v > min + k * width) return;
      out += `<line class="ch-vline" x1="${sx(v)}" y1="${PT}" x2="${sx(v)}" y2="${H - PB}"/>`;
    });
    return svg(out);
  }

  // Boxplot (horizontal)
  function boxplot(s) {
    const lo = Math.min(s.min, s.lw), hi = Math.max(s.max, s.uw);
    const pad = (hi - lo) * 0.06 || 1;
    const { sx, g } = axes(lo - pad, hi + pad, 0, 1, { noY: true });
    const y = 70, h = 50;
    let out = g;
    out += `<line class="ch-line" x1="${sx(s.lw)}" y1="${y + h / 2}" x2="${sx(s.q1)}" y2="${y + h / 2}"/>`;
    out += `<line class="ch-line" x1="${sx(s.q3)}" y1="${y + h / 2}" x2="${sx(s.uw)}" y2="${y + h / 2}"/>`;
    out += `<line class="ch-line" x1="${sx(s.lw)}" y1="${y + 12}" x2="${sx(s.lw)}" y2="${y + h - 12}"/>`;
    out += `<line class="ch-line" x1="${sx(s.uw)}" y1="${y + 12}" x2="${sx(s.uw)}" y2="${y + h - 12}"/>`;
    out += `<rect class="ch-box" x="${sx(s.q1)}" y="${y}" width="${Math.max(1, sx(s.q3) - sx(s.q1))}" height="${h}" rx="6"/>`;
    out += `<line class="ch-median" x1="${sx(s.med)}" y1="${y}" x2="${sx(s.med)}" y2="${y + h}"/>`;
    (s.outliers || []).forEach((v) => (out += `<circle class="ch-out" cx="${sx(v)}" cy="${y + h / 2}" r="4"/>`));
    const lab = (v, t, dy) => `<text class="ch-text" x="${sx(v)}" y="${y + dy}" text-anchor="middle">${t}</text>`;
    out += lab(s.q1, 'Q1', -8) + lab(s.med, 'Median', -22) + lab(s.q3, 'Q3', -8);
    return svg(out);
  }

  // Normalverteilungskurve mit schraffiertem Bereich [a,b]
  function normal(mu, sigma, a, b, opts = {}) {
    const xmin = mu - 4 * sigma, xmax = mu + 4 * sigma;
    const S = TR.S;
    const ymax = S.dnorm(mu, mu, sigma) * 1.12;
    const { sx, sy, g } = axes(xmin, xmax, 0, ymax, { noY: true });
    const N = 160;
    let path = '', area = '';
    const lo = Math.max(xmin, a), hi = Math.min(xmax, b);
    for (let i = 0; i <= N; i++) {
      const x = xmin + ((xmax - xmin) * i) / N;
      path += (i ? 'L' : 'M') + sx(x).toFixed(1) + ',' + sy(S.dnorm(x, mu, sigma)).toFixed(1);
    }
    if (hi > lo) {
      area = `M${sx(lo)},${sy(0)}`;
      for (let i = 0; i <= N; i++) {
        const x = lo + ((hi - lo) * i) / N;
        area += 'L' + sx(x).toFixed(1) + ',' + sy(S.dnorm(x, mu, sigma)).toFixed(1);
      }
      area += `L${sx(hi)},${sy(0)}Z`;
    }
    let out = g + (area ? `<path class="ch-area" d="${area}"/>` : '') + `<path class="ch-curve" d="${path}"/>`;
    (opts.marks || []).forEach((m) => {
      if (!isFinite(m) || m < xmin || m > xmax) return;
      out += `<line class="ch-vline" x1="${sx(m)}" y1="${PT}" x2="${sx(m)}" y2="${H - PB}"/>`;
    });
    if (opts.label) out += `<text class="ch-big" x="${W - PR}" y="${PT + 10}" text-anchor="end">${TR.F.esc(opts.label)}</text>`;
    return svg(out);
  }

  // t-Verteilung bzw. beliebige Dichte für Teststatistik
  function density(fn, xmin, xmax, shade, opts = {}) {
    const N = 160;
    let ymax = 0;
    for (let i = 0; i <= N; i++) ymax = Math.max(ymax, fn(xmin + ((xmax - xmin) * i) / N));
    ymax *= 1.12;
    const { sx, sy, g } = axes(xmin, xmax, 0, ymax, { noY: true });
    let path = '';
    for (let i = 0; i <= N; i++) {
      const x = xmin + ((xmax - xmin) * i) / N;
      path += (i ? 'L' : 'M') + sx(x).toFixed(1) + ',' + sy(fn(x)).toFixed(1);
    }
    let out = g;
    (shade || []).forEach(([a, b]) => {
      const lo = Math.max(xmin, a), hi = Math.min(xmax, b);
      if (hi <= lo) return;
      let area = `M${sx(lo)},${sy(0)}`;
      for (let i = 0; i <= 80; i++) {
        const x = lo + ((hi - lo) * i) / 80;
        area += 'L' + sx(x).toFixed(1) + ',' + sy(fn(x)).toFixed(1);
      }
      out += `<path class="ch-area" d="${area}L${sx(hi)},${sy(0)}Z"/>`;
    });
    out += `<path class="ch-curve" d="${path}"/>`;
    (opts.marks || []).forEach((m) => {
      if (!isFinite(m) || m < xmin || m > xmax) return;
      out += `<line class="ch-vline" x1="${sx(m)}" y1="${PT}" x2="${sx(m)}" y2="${H - PB}"/>`;
    });
    return svg(out);
  }

  // Streudiagramm mit optionaler Geraden
  function scatter(x, y, line) {
    const xmin = Math.min(...x), xmax = Math.max(...x), ymin = Math.min(...y), ymax = Math.max(...y);
    const px = (xmax - xmin) * 0.08 || 1, py = (ymax - ymin) * 0.12 || 1;
    const A = axes(xmin - px, xmax + px, ymin - py, ymax + py);
    let out = A.g;
    if (line) {
      const x0 = xmin - px, x1 = xmax + px;
      out += `<line class="ch-reg" x1="${A.sx(x0)}" y1="${A.sy(line.b0 + line.b1 * x0)}" x2="${A.sx(x1)}" y2="${A.sy(line.b0 + line.b1 * x1)}"/>`;
    }
    x.forEach((v, i) => (out += `<circle class="ch-pt" cx="${A.sx(v)}" cy="${A.sy(y[i])}" r="4.5"/>`));
    return svg(out);
  }

  // Liniendiagramm (z. B. Kapitalentwicklung)
  function line(xs, ys) {
    const A = axes(Math.min(...xs), Math.max(...xs), Math.min(0, ...ys), Math.max(...ys) * 1.08);
    let p = '';
    xs.forEach((x, i) => (p += (i ? 'L' : 'M') + A.sx(x).toFixed(1) + ',' + A.sy(ys[i]).toFixed(1)));
    let out = A.g + `<path class="ch-curve" d="${p}"/>`;
    if (xs.length <= 40) xs.forEach((x, i) => (out += `<circle class="ch-pt" cx="${A.sx(x)}" cy="${A.sy(ys[i])}" r="3"/>`));
    return svg(out);
  }

  TR.C = { bars, histogram, boxplot, normal, density, scatter, line };
})();
