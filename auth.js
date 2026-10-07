/* Passwortschutz (SHA-256). window.TR.Auth */
(function () {
  const TR = (window.TR = window.TR || {});
  const KEY = 'tr-login';

  // kompakte SHA-256-Implementierung (falls crypto.subtle fehlt, z. B. ohne HTTPS)
  function sha256Fallback(ascii) {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const bytes = new TextEncoder().encode(ascii);
    const K = [], H = [];
    let n = 2, c = 0;
    const isPrime = (x) => { for (let i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; };
    while (c < 64) {
      if (isPrime(n)) {
        if (c < 8) H[c] = (Math.pow(n, 1 / 2) * 4294967296) | 0;
        K[c++] = (Math.pow(n, 1 / 3) * 4294967296) | 0;
      }
      n++;
    }
    const l = bytes.length;
    const words = [];
    const padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[l] = 0x80;
    const bits = l * 8;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, bits >>> 0);
    dv.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
    for (let i = 0; i < padded.length; i += 4) words.push(dv.getUint32(i));
    for (let j = 0; j < words.length; j += 16) {
      const w = words.slice(j, j + 16);
      const old = H.slice(0);
      for (let i = 0; i < 64; i++) {
        if (i >= 16) {
          const w15 = w[i - 15], w2 = w[i - 2];
          w[i] = (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0;
        }
        const [a, b, cc, d, e, f, g, h] = H;
        const t1 = (h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & cc) ^ (b & cc))) | 0;
        H.unshift((t1 + t2) | 0);
        H.pop();
        H[4] = (H[4] + t1) | 0;
        void d;
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + old[i]) | 0;
    }
    return H.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }

  async function sha256(text) {
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { /* Fallback unten */ }
    return sha256Fallback(text);
  }

  const cfg = () => window.TR_CONFIG || {};
  function isLoggedIn() {
    if (cfg().demoMode) return true;
    try {
      return localStorage.getItem(KEY) === cfg().passwordHash || sessionStorage.getItem(KEY) === cfg().passwordHash;
    } catch (e) {
      return TR.Auth._mem === cfg().passwordHash;
    }
  }
  async function login(pw) {
    const h = await sha256(cfg().salt + ':' + pw);
    if (h !== cfg().passwordHash) return false;
    try {
      (cfg().rememberLogin ? localStorage : sessionStorage).setItem(KEY, h);
    } catch (e) {
      TR.Auth._mem = h;
    }
    return true;
  }
  function logout() {
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* egal */ }
    TR.Auth._mem = null;
  }
  TR.Auth = { sha256, sha256Fallback, isLoggedIn, login, logout };
})();
