#!/usr/bin/env node
/* Programmatic audit of the database: official completion must sum to exactly 112. */
'use strict';
const path = require('path');
const DATA = require(path.join(__dirname, '..', 'js', 'data.js'));

const errors = [];
const ids = new Set();
for (const it of DATA.ITEMS) {
  if (ids.has(it.id)) errors.push('Duplicate id: ' + it.id);
  ids.add(it.id);
  if (![0, 1, 2].includes(it.completion)) errors.push('Bad completion on ' + it.id);
  if (!DATA.REGIONS.find(r => r.id === it.region)) errors.push('Unknown region on ' + it.id + ': ' + it.region);
  if (it.stage && !DATA.STAGES.find(s => s.id === it.stage)) errors.push('Unknown stage on ' + it.id + ': ' + it.stage);
  if (it.beyond && it.completion) errors.push('Beyond-112 item counts for completion: ' + it.id);
}
for (const it of DATA.ITEMS) {
  for (const r of [...it.req, ...it.any, ...(it.unlocks || []), ...(it.excludes || [])]) if (!ids.has(r)) errors.push('Unknown ref in ' + it.id + ': ' + r);
  if (it.rule) for (const r of (it.rule.allOf || it.rule.anyOf || it.rule.countOf)) if (!ids.has(r)) errors.push('Unknown rule ref in ' + it.id + ': ' + r);
}
for (const r of DATA.REGIONS) for (const x of [...(r.req || []), ...(r.any || [])]) if (!ids.has(x)) errors.push('Unknown region req ' + r.id + ': ' + x);

const byCat = {};
let total = 0;
for (const it of DATA.ITEMS) {
  if (!it.completion) continue;
  const c = DATA.auditCategory(it);
  byCat[c] = (byCat[c] || 0) + it.completion;
  total += it.completion;
}
const rows = [];
for (const [cat, expected] of Object.entries(DATA.OFFICIAL_BREAKDOWN)) {
  const got = byCat[cat] || 0;
  rows.push({ category: cat, expected, got, ok: got === expected });
  if (got !== expected) errors.push(`Category ${cat}: expected ${expected}, got ${got}`);
}
if (byCat.Other) errors.push('Items counted in "Other": ' + byCat.Other);
const counts = {
  shards: DATA.ITEMS.filter(i => i.type === 'mask').length,
  vessels: DATA.ITEMS.filter(i => i.type === 'vessel').length,
  ore: DATA.ITEMS.filter(i => i.type === 'ore').length,
  charmsCounted: DATA.ITEMS.filter(i => i.type === 'charm' && i.completion).length,
  notches: DATA.ITEMS.filter(i => i.type === 'notch').length,
  roots: DATA.ITEMS.filter(i => i.type === 'root').length,
  rootEssence: DATA.ITEMS.filter(i => i.type === 'root').reduce((a, i) => a + i.essence, 0),
  simpleKeys: DATA.ITEMS.filter(i => i.keyObtain).length
};
const expectCounts = { shards: 16, vessels: 9, ore: 6, charmsCounted: 39, notches: 8, roots: 15, rootEssence: 482, simpleKeys: 4 };
for (const k in expectCounts) if (counts[k] !== expectCounts[k]) errors.push(`Count ${k}: expected ${expectCounts[k]}, got ${counts[k]}`);
if (total !== 112) errors.push('TOTAL is ' + total + ' (expected 112)');

console.table(rows);
console.log('Counts:', counts);
console.log('TOTAL official completion =', total);
console.log('Items in database =', DATA.ITEMS.length);
if (errors.length) { console.error('AUDIT FAILED:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log('AUDIT PASSED ✓ (sum = 112)');
