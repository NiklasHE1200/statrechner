/* Welche Eingaben eines Verfahrens aus Projektdaten (Excel-Spalten) befüllt werden können */
(function () {
  const TR = window.TR;
  const tool = (id) => TR.tools.find((t) => t.id === id);
  const inp = (id, iid) => tool(id).inputs.find((i) => i.id === iid);

  // Spalten, die zeilengleich gelesen werden müssen (nur vollständige Zeilen)
  tool('korrelation').pairs = [['x', 'y']];
  tool('regression').pairs = [['x', 'y']];
  tool('multireg').pairs = [['y', 'x1', 'x2', 'x3']];
  tool('gewmittel').pairs = [['x', 'h']];

  // Tabellen aus zwei Spalten
  inp('kreuztabelle', 'm').proj = 'crosstab';
  inp('chiunab', 'm').proj = 'crosstab';
  inp('anova', 'm').proj = 'groups';

  // Anzahl Treffer x und n aus einer Spalte zählen
  tool('kianteil').counts = [{ x: 'x', n: 'n' }];
  tool('anteilstest').counts = [{ x: 'x', n: 'n' }];
  tool('zweianteile').counts = [{ x: 'x1', n: 'n1', title: 'Gruppe 1' }, { x: 'x2', n: 'n2', title: 'Gruppe 2' }];

  // keine Rohdaten
  inp('prognose', 'b').noProject = true;
  inp('prognose', 'x').noProject = true;
  inp('chianp', 'o').noProject = true;
  inp('chianp', 'p').noProject = true;

  TR.projectInputs = (t) => t.inputs.filter((i) => !i.noProject && (i.type === 'list' || i.type === 'text' || (i.type === 'matrix' && i.proj)));
  TR.supportsProject = (t) => TR.projectInputs(t).length > 0 || !!t.counts;
})();
