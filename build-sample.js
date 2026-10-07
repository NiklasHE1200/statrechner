// Erzeugt eine fiktive Beispiel-Exceldatei (docs/beispiel/beispiel-projekt.xlsx + .csv).
// Aufruf: node scripts/build-sample.js
const fs = require('fs');
const path = require('path');
const fflate = require('../docs/vendor/fflate.min.js');

let seed = 7;
const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const norm = () => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
const head = ['Filiale', 'Werbebudget', 'Umsatz', 'Zufriedenheit', 'Kundentyp', 'Treueprogramm'];
const rows = [];
for (let i = 0; i < 60; i++) {
  const fil = ['Nord', 'Süd', 'West'][i % 3];
  const wb = Math.round((8 + r() * 22) * 10) / 10;
  const um = Math.round((40 + 3.2 * wb + (fil === 'Süd' ? 12 : fil === 'West' ? -6 : 0) + norm() * 9) * 10) / 10;
  const zu = Math.max(1, Math.min(7, Math.round(4.6 + (fil === 'Süd' ? 0.8 : 0) + norm() * 1.1)));
  const typ = r() < 0.55 ? 'Stammkunde' : 'Neukunde';
  const tp = r() < (typ === 'Stammkunde' ? 0.7 : 0.35) ? 'ja' : 'nein';
  rows.push([fil, wb, um, zu, typ, tp]);
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const colL = (j) => String.fromCharCode(65 + j);
const cell = (v, ref) => (typeof v === 'number' ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`);
const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${[head, ...rows].map((row, i) => `<row r="${i + 1}">${row.map((v, j) => cell(v, colL(j) + (i + 1))).join('')}</row>`).join('')}</sheetData></worksheet>`;
const files = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Filialen" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
  'xl/worksheets/sheet1.xml': sheet,
};
const zip = fflate.zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, fflate.strToU8(v)])));
const out = path.join(__dirname, '..', 'docs', 'beispiel');
fs.writeFileSync(path.join(out, 'beispiel-projekt.xlsx'), zip);
fs.writeFileSync(path.join(out, 'beispiel-projekt.csv'), '﻿' + [head, ...rows].map((row) => row.map((v) => (typeof v === 'number' ? String(v).replace('.', ',') : v)).join(';')).join('\n'));
console.log('Beispieldatei erstellt:', rows.length, 'Zeilen');
