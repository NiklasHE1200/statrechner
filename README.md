# StatRechner – Statistik-Taschenrechner mit Rechenweg

**👉 Live-Demo: [niklashe1200.github.io/statrechner](https://niklashe1200.github.io/statrechner/)** – ohne Anmeldung, direkt im Browser, auch auf dem Handy.

StatRechner ist eine Web-App im Apple-Stil, die wie ein normaler Handy-Taschenrechner funktioniert und
zusätzlich **36 Verfahren aus Statistik und Finanzmathematik** beherrscht. Statt nur ein Ergebnis
auszuspucken, zeigt sie den **kompletten Rechenweg Schritt für Schritt** und erklärt am Ende in Worten,
was das Ergebnis bedeutet.

Entstanden ist die App als persönliches Lernwerkzeug für eine Statistik-Vorlesung im Studium.
Sie enthält ausschließlich allgemeine, frei bekannte Rechenverfahren mit eigenen Formulierungen und
frei erfundenen Beispielwerten.

## Features

- **Rechenweg Schritt für Schritt**: Formeln sauber gesetzt (KaTeX), Rechentabellen, Zwischenergebnisse
- **Interpretation in Worten** zu jedem Ergebnis, z. B. „Der Unterschied ist signifikant …“
- **Diagramme**: Boxplot, Histogramm, Normalverteilungskurve, Streudiagramm mit Regressionsgerade
- **Eigene Daten**: Excel- (.xlsx) oder CSV-Datei hochladen und direkt mit den Spalten rechnen –
  inklusive Filter für Gruppenvergleiche
- **Taschenrechner** mit Punkt-vor-Strich, Klammern, Potenzen, Wurzel, Winkelfunktionen und Verlauf
- **Schnellauswahl** nach Themen und Suche
- **Mobil optimiert**: als App auf dem Home-Bildschirm installierbar (PWA), funktioniert offline
- **Hell- und Dunkelmodus**, folgt automatisch der Systemeinstellung
- **Datenschutz**: Alle Berechnungen laufen lokal im Browser, es werden keine Daten an einen Server gesendet
- **Bebilderte Kurzanleitung** als PDF mit Klickstrecken

## Enthaltene Verfahren

| Thema | Verfahren |
|---|---|
| Beschreibende Statistik | Lagemaße · Streuungsmaße · Kennzahlen & Boxplot · Quantile · z-Werte · empirische Verteilungsfunktion · Häufigkeiten · gewichteter Mittelwert · Kreuztabelle |
| Zusammenhang & Regression | Kovarianz & Korrelation (Pearson, Spearman) · einfache lineare Regression mit Prognose- und Konfidenzintervallen · multiple Regression (Matrixformel) · Prognose aus Koeffizienten |
| Normalverteilung | Wahrscheinlichkeiten · Quantile · z-Transformation · Vergleich zweier Ergebnisse · 68-95-99,7-Regel |
| Schätzen & Testen | Konfidenzintervalle · Bootstrap · Binomialtest mit Simulation · t-Tests · Permutationstest · Vergleich zweier Anteile · χ²-Tests · Korrelationstest · Koeffiziententest · Varianzanalyse · Testentscheidung |
| Finanzmathematik | Zinseszins · unterjährige/stetige Verzinsung · Rentenrechnung · Annuitätendarlehen · Kapitalwert & interner Zinsfuß |

## Technik

- **Reines HTML, CSS und JavaScript** – kein Framework, kein Build-Schritt, keine Server-Komponente
- **Eigene Statistik-Bibliothek** (`docs/js/stats.js`): Normal-, t-, χ²-, F- und Binomialverteilung
  (inkl. unvollständiger Beta-/Gammafunktion), Matrizenrechnung, reproduzierbarer Zufallsgenerator für
  Bootstrap und Permutationstests
- **Eigener Formel-Parser** für den Taschenrechner (ohne `eval`)
- **Eigener schlanker Excel-Leser**: entpackt .xlsx mit [fflate](https://github.com/101arrowz/fflate)
  und liest die XML-Tabellen direkt
- **[KaTeX](https://katex.org)** für den Formelsatz, **SVG** für alle Diagramme
- **Service Worker** für die Offline-Nutzung, **Web-App-Manifest** für die Installation
- **Playwright** erzeugt die Anleitung automatisch aus echten Screenshots der App
- Veröffentlicht über **GitHub Pages** (Ordner `docs/`)

## Lokal starten

```bash
npx http-server docs -p 8080
# dann http://localhost:8080 öffnen
```

Oder einfach `docs/index.html` im Browser öffnen.

Tests der Rechenfunktionen: `node tests/stats.test.js`

## Projektstruktur

```
docs/                  die App (wird per GitHub Pages veröffentlicht)
  index.html, css/style.css
  js/stats.js          Statistik-Kern
  js/calculator.js     Formel-Parser des Taschenrechners
  js/tools/*.js        die einzelnen Verfahren mit Rechenweg und Interpretation
  js/projects.js       Excel/CSV einlesen, Projekte im Browser speichern
  js/app.js            Oberfläche
  guide/               Kurzanleitung (PDF + Seitenbilder)
scripts/               Anleitung, App-Icons und Beispieldatei erzeugen
tests/                 Tests der Rechenfunktionen
```

## Entwickelt mit KI-Unterstützung

Diese App wurde mit Unterstützung von **[Claude Code](https://claude.com/claude-code)** (Anthropic)
entwickelt. Ich habe die Anforderungen, das Design und die Funktionen vorgegeben, getestet und
iterativ verfeinert; Claude Code hat dabei große Teile des Codes geschrieben.

## Hinweis

Die Ergebnisse wurden sorgfältig gegen unabhängig berechnete Referenzwerte geprüft. Trotzdem gilt: Für
Prüfungen und wissenschaftliche Arbeiten bitte die Rechenwege selbst nachvollziehen.
