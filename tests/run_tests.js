// Run with:  node tests/run_tests.js
// Checks the skill extractor on hand-labelled snippets (written by the author, so the score is optimistic).
const E = require("../docs/engine.js");
const cases = require("./cases.json");
let tp = 0, fp = 0, fn = 0, exact = 0;
const failures = [];
for (const c of cases) {
  const got = new Set(E.extractSkills(c.text)), exp = new Set(c.expect);
  const ok = [...exp].every(s => got.has(s)) && [...got].every(s => exp.has(s));
  exact += ok;
  for (const s of got) exp.has(s) ? tp++ : fp++;
  for (const s of exp) if (!got.has(s)) fn++;
  if (!ok) failures.push({ text: c.text, expected: c.expect, got: [...got] });
}
const p = tp / (tp + fp), r = tp / (tp + fn);
console.log(`Cases: ${cases.length} | exact matches: ${exact}/${cases.length}`);
console.log(`Precision ${(p * 100).toFixed(1)}% | recall ${(r * 100).toFixed(1)}% (tp ${tp}, fp ${fp}, fn ${fn})`);
failures.forEach(f => console.log("FAIL:", JSON.stringify(f)));
// ---- role profiles ----
const names = new Set(E.SKILLS.map(s => s.n));
let roleFail = 0;
for (const r of E.ROLES) for (const k of ["core", "junior", "middle", "nice"]) for (const s of r[k]) if (!names.has(s)) { console.log("FAIL unknown skill", r.id, s); roleFail++; }
const rq = [["стажировка data analyst", "data-analyst", "intern"], ["ML инженер junior", "ml-engineer", "junior"], ["bi аналитик", "bi-analyst", null],
  ["marketing analyst intern", "marketing-analyst", "intern"], ["продуктовый аналитик стажёр", "product-analyst", "intern"], ["Data Scientist middle", "data-scientist", "middle"], ["abracadabra", null, null]];
for (const [q, role, lv] of rq) { const g = E.resolveRole(q); if (g.role !== role || g.level !== lv) { console.log("FAIL resolveRole", q, JSON.stringify(g)); roleFail++; } }
console.log("Role checks:", roleFail ? roleFail + " failed" : "all passed (" + (E.ROLES.length) + " roles, " + rq.length + " queries)");
process.exit(failures.length || roleFail ? 1 : 0);
