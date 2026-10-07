// Prüft den Statistik-Kern gegen unabhängig berechnete Referenzwerte.  Aufruf: node tests/stats.test.js
global.window = {};
require('../docs/js/stats.js');
const S = window.TR.S;
let fail = 0;
function eq(name, got, exp, tol = 1e-6) {
  const ok = Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp));
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + ': ' + got + ' (erwartet ' + exp + ')');
}
eq('pnorm(42,50,8)', S.pnorm(42, 50, 8), 0.15865525393145707);
eq('qnorm(0.95,60,12)', S.qnorm(0.95, 60, 12), 79.73824352341767);
eq('qnorm(0.975)', S.qnorm(0.975), 1.959964);
eq('pnorm(-2)', S.pnorm(-2), 0.02275013);
eq('qt(0.975,24)', S.qt(0.975, 24), 2.063899);
eq('qt(0.995,5)', S.qt(0.995, 5), 4.032143);
eq('pt(2.1,10)', S.pt(2.1, 10), 0.9689614);
eq('pchisq(3.84,1)', S.pchisq(3.841459, 1), 0.95);
eq('pchisq(10,4)', S.pchisq(10, 4), 0.9595723);
eq('pf(3,2,20)', S.pf(3, 2, 20), 0.9274618);
eq('P(X>=12), n=40, p=0,25', 1 - S.pbinom(11, 40, 0.25), 0.28485560710188584);
eq('binom.test(7,20,0.5) p', S.binomTwoSided(7, 20, 0.5), 0.2632, 1e-3);
const d = [12, 15, 9, 22, 15, 18, 11, 30, 14, 16];
eq('mean', S.mean(d), 16.2);
eq('var', S.variance(d), 36.84444444444444);
eq('Q1', S.quantileEmp(d, 0.25).value, 12);
eq('Q3', S.quantileEmp(d, 0.75).value, 18);
eq('Median', S.quantileEmp(d, 0.5).value, 15.0);
eq('Q1 interpoliert', S.quantileR7(d, 0.25), 12.5);
eq('Kovarianz', S.covariance([3, 5, 6, 8, 10], [41, 47, 50, 55, 60]), 19.7);
process.exit(fail ? 1 : 0);
