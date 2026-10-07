/* Eigene Projekte: Excel/CSV einlesen, speichern, Spalten auswählen. window.TR.P */
(function () {
  const TR = (window.TR = window.TR || {});
  const MAX_ROWS = 20000;

  // ---------- XML-Hilfen ----------
  const decode = (s) =>
    s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
      const map = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
      if (map[e.toLowerCase()]) return map[e.toLowerCase()];
      return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    });
  const attr = (tag, name) => {
    const m = tag.match(new RegExp('\\s' + name + '="([^"]*)"'));
    return m ? decode(m[1]) : null;
  };
  const colIndex = (ref) => {
    const letters = ref.replace(/[0-9]/g, '');
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  };
  const textOf = (xml) => {
    let out = '';
    xml.replace(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, (_, t) => (out += decode(t)));
    return out;
  };

  // ---------- XLSX lesen ----------
  function readXlsx(buf) {
    if (!window.fflate) throw new Error('Entpacker fehlt');
    let files;
    try {
      files = fflate.unzipSync(new Uint8Array(buf));
    } catch (e) {
      throw new TR.InputError('Die Datei konnte nicht gelesen werden. Bitte als .xlsx oder .csv speichern.');
    }
    const str = (p) => (files[p] ? fflate.strFromU8(files[p]) : null);
    const wb = str('xl/workbook.xml');
    if (!wb) throw new TR.InputError('Das ist keine gültige Excel-Datei (.xlsx).');
    const rels = {};
    (str('xl/_rels/workbook.xml.rels') || '').replace(/<Relationship\b[^>]*>/g, (t) => {
      rels[attr(t, 'Id')] = attr(t, 'Target');
    });
    const shared = [];
    const ss = str('xl/sharedStrings.xml');
    if (ss) ss.replace(/<si>([\s\S]*?)<\/si>/g, (_, si) => shared.push(textOf(si)));
    const sheets = [];
    wb.replace(/<sheet\b[^>]*>/g, (t) => {
      const target = rels[attr(t, 'r:id')] || '';
      const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
      sheets.push({ name: attr(t, 'name'), path });
    });
    return sheets.map((sh) => ({ name: sh.name, rows: parseSheet(str(sh.path) || '', shared) }));
  }
  function parseSheet(xml, shared) {
    const rows = [];
    const rowRe = /<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g;
    let rm, rIdx = 0;
    while ((rm = rowRe.exec(xml))) {
      const rTag = rm[0].slice(0, rm[0].indexOf('>') + 1);
      const rn = attr(rTag, 'r');
      if (rn) rIdx = parseInt(rn, 10) - 1;
      const row = [];
      const body = rm[1] || '';
      const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let cm, cIdx = 0;
      while ((cm = cRe.exec(body))) {
        const tag = '<c' + cm[1] + '>';
        const ref = attr(tag, 'r');
        if (ref) cIdx = colIndex(ref);
        const t = attr(tag, 't');
        const inner = cm[2] || '';
        const vm = inner.match(/<v>([\s\S]*?)<\/v>/);
        let val = null;
        if (t === 's') val = vm ? shared[parseInt(vm[1], 10)] : null;
        else if (t === 'inlineStr') val = textOf(inner);
        else if (t === 'str') val = vm ? decode(vm[1]) : null;
        else if (t === 'b') val = vm ? (vm[1] === '1' ? 'WAHR' : 'FALSCH') : null;
        else if (t === 'e') val = null;
        else if (vm) { const n = parseFloat(vm[1]); val = isFinite(n) ? n : decode(vm[1]); }
        row[cIdx] = val;
        cIdx++;
      }
      rows[rIdx] = row;
      rIdx++;
      if (rIdx > MAX_ROWS + 50) break;
    }
    return rows.map((r) => r || []);
  }

  // ---------- CSV / eingefügter Text ----------
  function readDelimited(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/).find((l) => l.trim()) || '';
    const counts = { '\t': (first.match(/\t/g) || []).length, ';': (first.match(/;/g) || []).length, ',': (first.match(/,/g) || []).length };
    const d = counts['\t'] ? '\t' : counts[';'] >= counts[','] && counts[';'] ? ';' : counts[','] ? ',' : ';';
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === d) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
        if (rows.length > MAX_ROWS + 50) break;
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map((r) => r.map((v) => (v.trim() === '' ? null : v.trim())));
  }

  // ---------- Tabelle aufbereiten ----------
  function toNumber(v) {
    if (typeof v === 'number') return v;
    if (v == null) return NaN;
    return TR.F.parseNum(String(v));
  }
  function buildTable(raw) {
    const rows = raw.filter((r) => r && r.some((v) => v != null && String(v).trim() !== ''));
    if (rows.length < 2) throw new TR.InputError('Es wurden zu wenige Daten gefunden. Erste Zeile = Spaltennamen, darunter die Werte.');
    const width = Math.max(...rows.map((r) => r.length));
    const head = rows[0];
    let names = Array.from({ length: width }, (_, j) => (head[j] != null && String(head[j]).trim() !== '' ? String(head[j]).trim() : 'Spalte ' + (j + 1)));
    const seen = {};
    names = names.map((n) => (seen[n] ? n + ' (' + ++seen[n] + ')' : ((seen[n] = 1), n)));
    let body = rows.slice(1, MAX_ROWS + 1).map((r) => Array.from({ length: width }, (_, j) => (r[j] == null || String(r[j]).trim() === '' ? null : r[j])));
    const columns = names.map((name, j) => {
      const vals = body.map((r) => r[j]).filter((v) => v != null);
      const num = vals.filter((v) => isFinite(toNumber(v))).length;
      const type = vals.length && num / vals.length >= 0.8 ? 'num' : 'cat';
      return { name, type };
    });
    // leere Spalten entfernen
    const keep = columns.map((c, j) => body.some((r) => r[j] != null));
    body = body.map((r) => r.filter((_, j) => keep[j]).map((v, k) => v));
    const cols = columns.filter((_, j) => keep[j]);
    body = body.map((r) => r.map((v, j) => (v == null ? null : cols[j].type === 'num' ? (isFinite(toNumber(v)) ? toNumber(v) : null) : String(v))));
    return { columns: cols, rows: body, truncated: rows.length - 1 > MAX_ROWS };
  }

  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xls')) throw new TR.InputError('Das alte Excel-Format .xls wird nicht unterstützt. Bitte in Excel „Speichern unter“ → .xlsx oder .csv wählen.');
    if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
      const sheets = readXlsx(await file.arrayBuffer());
      return sheets.filter((s) => s.rows.some((r) => r.some((v) => v != null)));
    }
    const text = await file.text();
    return [{ name: 'Tabelle', rows: readDelimited(text) }];
  }

  // ---------- Speicher ----------
  const IDX = 'tr-projects';
  const list = () => { try { return JSON.parse(localStorage.getItem(IDX) || '[]'); } catch (e) { return []; } };
  const get = (id) => { try { return JSON.parse(localStorage.getItem('tr-proj-' + id)); } catch (e) { return null; } };
  function save(p) {
    const meta = { id: p.id, name: p.name, created: p.created, nRows: p.rows.length, nCols: p.columns.length, source: p.source };
    try {
      localStorage.setItem('tr-proj-' + p.id, JSON.stringify(p));
      const l = list().filter((x) => x.id !== p.id);
      l.unshift(meta);
      localStorage.setItem(IDX, JSON.stringify(l));
    } catch (e) {
      throw new TR.InputError('Die Datei ist zu groß für den Speicher dieses Browsers. Bitte weniger Zeilen oder Spalten verwenden.');
    }
  }
  function create(name, table, source) {
    const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name || 'Mein Projekt', created: Date.now(), source: source || '', columns: table.columns, rows: table.rows };
    save(p);
    return p;
  }
  function remove(id) {
    try {
      localStorage.removeItem('tr-proj-' + id);
      localStorage.setItem(IDX, JSON.stringify(list().filter((x) => x.id !== id)));
    } catch (e) { /* egal */ }
  }
  function rename(id, name) {
    const p = get(id);
    if (!p) return;
    p.name = name;
    save(p);
  }

  // ---------- Spalten auswählen ----------
  // sel = { col, fcol, fval }  ->  Zeilenindizes, die den Filter erfüllen
  function rowFilter(p, sel) {
    const fj = sel.fcol != null && sel.fcol !== '' ? p.columns.findIndex((c) => c.name === sel.fcol) : -1;
    return p.rows.map((_, i) => i).filter((i) => fj < 0 || String(p.rows[i][fj]) === String(sel.fval));
  }
  const colIdx = (p, name) => p.columns.findIndex((c) => c.name === name);
  const label = (sel) => sel.col + (sel.fcol ? ` (${sel.fcol} = ${sel.fval})` : '');
  function distinct(p, name) {
    const j = colIdx(p, name);
    const s = new Set();
    p.rows.forEach((r) => r[j] != null && s.add(String(r[j])));
    return [...s].sort((a, b) => (isFinite(a) && isFinite(b) ? a - b : a.localeCompare(b, 'de')));
  }
  // mehrere Spalten zeilengleich (für x/y-Paare): nur Zeilen, in denen alle Werte Zahlen sind
  function numericColumns(p, sels) {
    let idx = rowFilter(p, sels[0]);
    const js = sels.map((s) => colIdx(p, s.col));
    const before = idx.length;
    idx = idx.filter((i) => js.every((j) => typeof p.rows[i][j] === 'number'));
    return { values: js.map((j) => idx.map((i) => p.rows[i][j])), dropped: before - idx.length };
  }
  function numericColumn(p, sel) {
    const j = colIdx(p, sel.col);
    const idx = rowFilter(p, sel);
    const vals = idx.map((i) => p.rows[i][j]).filter((v) => typeof v === 'number');
    return { values: vals, dropped: idx.length - vals.length };
  }
  function textColumn(p, sel) {
    const j = colIdx(p, sel.col);
    const vals = rowFilter(p, sel).map((i) => p.rows[i][j]).filter((v) => v != null).map(String);
    return { values: vals };
  }
  function crossCounts(p, rowCol, colCol) {
    const a = colIdx(p, rowCol), b = colIdx(p, colCol);
    const rn = distinct(p, rowCol), cn = distinct(p, colCol);
    const M = rn.map(() => cn.map(() => 0));
    p.rows.forEach((r) => {
      if (r[a] == null || r[b] == null) return;
      M[rn.indexOf(String(r[a]))][cn.indexOf(String(r[b]))]++;
    });
    return { M, rn, cn };
  }
  function groupValues(p, valCol, grpCol) {
    const v = colIdx(p, valCol), g = colIdx(p, grpCol);
    const names = distinct(p, grpCol);
    const groups = names.map((n) => p.rows.filter((r) => String(r[g]) === n && typeof r[v] === 'number').map((r) => r[v]));
    return { names, groups };
  }

  TR.P = { readFile, readDelimited, readXlsx, buildTable, list, get, create, save, remove, rename, distinct, numericColumn, numericColumns, textColumn, crossCounts, groupValues, label, colIdx, MAX_ROWS };
})();
