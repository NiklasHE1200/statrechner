// Erzeugt die App-Icons (PNG).  Aufruf: NODE_PATH=$(npm root -g) node scripts/build-icons.js
const { chromium } = require('playwright');
const path = require('path');
const html = (s, r) => `<html><body style="margin:0;background:transparent">
<div style="width:${s}px;height:${s}px;border-radius:${r}px;position:relative;overflow:hidden;
background:linear-gradient(145deg,#1c1c1e,#3a3a3c);display:grid;place-items:center;font-family:-apple-system,Helvetica,Arial">
<div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(10,132,255,.9),transparent 60%),radial-gradient(circle at 80% 90%,rgba(191,90,242,.85),transparent 55%)"></div>
<span style="position:relative;color:#fff;font-size:${s * 0.52}px;font-weight:600;line-height:1;margin-top:-${s * 0.03}px">Σ</span></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [name, s, r] of [['icon-512.png', 512, 0], ['icon-192.png', 192, 0], ['apple-touch-icon.png', 180, 0]]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(html(s, r));
    await p.screenshot({ path: path.join(__dirname, '..', 'docs', 'icons', name), omitBackground: true });
  }
  await b.close();
})();
