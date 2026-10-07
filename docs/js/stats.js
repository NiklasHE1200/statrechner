/* Statistik-Kern: Kennzahlen, Verteilungen, Zufallszahlen.
   Alle Funktionen liegen unter window.TR.S */
(function () {
  const TR = (window.TR = window.TR || {});

  // ---------- Grundlagen ----------
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const mean = (a) => sum(a) / a.length;
  const sorted = (a) => a.slice().sort((x, y) => x - y);
  const sqDev = (a) => {
    const m = mean(a);
    return sum(a.map((v) => (v - m) * (v - m)));
  };
  const variance = (a) => sqDev(a) / (a.length - 1);
  const sd = (a) => Math.sqrt(variance(a));

  // Quantil nach der "Lehrbuch"-Regel: n*p ganzzahlig -> Mittel aus x(np), x(np+1); sonst x(aufrunden(np))
  function quantileEmp(a, p) {
    const s = sorted(a);
    const n = s.length;
    const np = n * p;
    const eps = 1e-9;
    if (p <= 0) return { value: s[0], np, rule: 'min', i: 1 };
    if (p >= 1) return { value: s[n - 1], np, rule: 'max', i: n };
    if (Math.abs(np - Math.round(np)) < eps) {
      const k = Math.round(np);
      return { value: (s[k - 1] + s[k]) / 2, np, rule: 'mid', i: k };
    }
    const k = Math.ceil(np);
    return { value: s[k - 1], np, rule: 'up', i: k };
  }
  // Quantil mit linearer Interpolation zwischen den Nachbarwerten
  function quantileR7(a, p) {
    const s = sorted(a);
    const n = s.length;
    const h = (n - 1) * p;
    const lo = Math.floor(h);
    const hi = Math.ceil(h);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
  }
  function modes(a) {
    const counts = new Map();
    a.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    let max = 0;
    counts.forEach((c) => (max = Math.max(max, c)));
    const res = [];
    counts.forEach((c, v) => c === max && res.push(v));
    return { values: res.sort((x, y) => (typeof x === 'number' ? x - y : String(x).localeCompare(String(y)))), count: max, counts };
  }
  function covariance(x, y) {
    const mx = mean(x), my = mean(y);
    let s = 0;
    for (let i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my);
    return s / (x.length - 1);
  }
  function ranks(a) {
    const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(a.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
      i = j + 1;
    }
    return r;
  }

  // ---------- Spezielle Funktionen ----------
  function logGamma(x) {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - logGamma(1 - x);
    x -= 1;
    let a = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  // regularisierte unvollständige Betafunktion I_x(a,b)
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  // regularisierte untere unvollständige Gammafunktion P(a,x)
  function igamma(a, x) {
    if (x <= 0) return 0;
    const gln = logGamma(a);
    if (x < a + 1) {
      let ap = a, s = 1 / a, del = s;
      for (let n = 0; n < 1000; n++) {
        ap += 1; del *= x / ap; s += del;
        if (Math.abs(del) < Math.abs(s) * 1e-16) break;
      }
      return s * Math.exp(-x + a * Math.log(x) - gln);
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
  }

  // ---------- Normalverteilung ----------
  // Standardnormal-Verteilungsfunktion (Algorithmus nach West/Hart, doppelte Genauigkeit)
  function pnormStd(z) {
    const x = Math.abs(z);
    let c;
    if (x > 37) c = 0;
    else {
      const e = Math.exp(-x * x / 2);
      if (x < 7.07106781186547) {
        let b = 3.52624965998911e-2 * x + 0.700383064443688;
        b = b * x + 6.37396220353165; b = b * x + 33.912866078383; b = b * x + 112.079291497871;
        b = b * x + 221.213596169931; b = b * x + 220.206867912376;
        c = e * b;
        b = 8.83883476483184e-2 * x + 1.75566716318264;
        b = b * x + 16.064177579207; b = b * x + 86.7807322029461; b = b * x + 296.564248779674;
        b = b * x + 637.333633378831; b = b * x + 793.826512519948; b = b * x + 440.413735824752;
        c = c / b;
      } else {
        let b = x + 0.65; b = x + 4 / b; b = x + 3 / b; b = x + 2 / b; b = x + 1 / b;
        c = e / b / 2.506628274631;
      }
    }
    return z > 0 ? 1 - c : c;
  }
  const dnorm = (x, mu = 0, s = 1) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  const pnorm = (x, mu = 0, s = 1) => pnormStd((x - mu) / s);
  // Quantilsfunktion (Acklam + Halley-Verfeinerung)
  function qnormStd(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let q, r, x;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= 1 - pl) {
      q = p - 0.5; r = q * q;
      x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    const e = pnormStd(x) - p;
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    return x - u / (1 + (x * u) / 2);
  }
  const qnorm = (p, mu = 0, s = 1) => mu + s * qnormStd(p);

  // ---------- t-, Chi²-, F-Verteilung ----------
  function pt(t, df) {
    const x = df / (df + t * t);
    const tail = 0.5 * ibeta(x, df / 2, 0.5);
    return t > 0 ? 1 - tail : tail;
  }
  function qt(p, df) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    // Startwert über Normalverteilung, dann Bisektion/Newton
    let lo = -1e3, hi = 1e3;
    let x = qnormStd(p);
    for (let i = 0; i < 200; i++) {
      const f = pt(x, df) - p;
      if (Math.abs(f) < 1e-14) break;
      if (f > 0) hi = x; else lo = x;
      const dens = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
      let nx = x - f / dens;
      if (!(nx > lo && nx < hi) || !isFinite(nx)) nx = (lo + hi) / 2;
      x = nx;
    }
    return x;
  }
  const pchisq = (x, df) => (x <= 0 ? 0 : igamma(df / 2, x / 2));
  const pf = (f, d1, d2) => (f <= 0 ? 0 : ibeta((d1 * f) / (d1 * f + d2), d1 / 2, d2 / 2));

  // ---------- Binomialverteilung ----------
  function logChoose(n, k) {
    return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
  }
  function dbinom(k, n, p) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  function pbinom(k, n, p) {
    let s = 0;
    for (let i = 0; i <= Math.min(k, n); i++) s += dbinom(i, n, p);
    return Math.min(1, s);
  }
  // exakter zweiseitiger Binomialtest (Summe aller nicht wahrscheinlicheren Ergebnisse)
  function binomTwoSided(x, n, p) {
    const d = dbinom(x, n, p);
    const rel = 1 + 1e-7;
    let s = 0;
    for (let i = 0; i <= n; i++) {
      const di = dbinom(i, n, p);
      if (di <= d * rel) s += di;
    }
    return Math.min(1, s);
  }

  // ---------- Zufallszahlen (reproduzierbar) ----------
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function resample(a, r) {
    const n = a.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = a[(r() * n) | 0];
    return out;
  }
  function shuffle(a, r) {
    const out = a.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = (r() * (i + 1)) | 0;
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  // ---------- Lineare Algebra ----------
  function transpose(M) { return M[0].map((_, j) => M.map((row) => row[j])); }
  function matMul(A, B) {
    return A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
  }
  function inverse(M) {
    const n = M.length;
    const A = M.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-12) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      const f = A[c][c];
      for (let j = 0; j < 2 * n; j++) A[c][j] /= f;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const g = A[r][c];
        if (g !== 0) for (let j = 0; j < 2 * n; j++) A[r][j] -= g * A[c][j];
      }
    }
    return A.map((row) => row.slice(n));
  }

  TR.S = {
    sum, mean, sorted, sqDev, variance, sd, quantileEmp, quantileR7, modes, covariance, ranks,
    logGamma, ibeta, igamma, pnorm, dnorm, qnorm, pnormStd, qnormStd, pt, qt, pchisq, pf,
    dbinom, pbinom, binomTwoSided, rng, resample, shuffle, transpose, matMul, inverse,
  };
})();
