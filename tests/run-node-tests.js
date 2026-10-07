#!/usr/bin/env node
/* Unit tests (no dependencies): node tests/run-node-tests.js */
'use strict';
const path = require('path'), fs = require('fs'), assert = require('assert');
const root = path.join(__dirname, '..');
const D = require(path.join(root, 'js/data.js'));
const St = require(path.join(root, 'js/state.js'));
const { createEngine } = require(path.join(root, 'js/roadmap.js'));
const SI = require(path.join(root, 'js/save-importer.js'));
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('PASS', name); } catch (e) { fail++; console.log('FAIL', name, '—', e.message); } }
function fresh() { const s = St.createStore(D, null); return { s, E: createEngine(D, s.get) }; }

t('database sums to exactly 112', () => assert.strictEqual(D.ITEMS.reduce((a, i) => a + i.completion, 0), 112));
t('no Beyond-112 item counts', () => assert.ok(D.ITEMS.filter(i => i.beyond).every(i => !i.completion)));
t('Pantheon of Hallownest is not counted', () => assert.strictEqual(D.ITEMS.find(i => i.id === 'pantheon-hallownest').completion, 0));
t('AES-256 known answer (FIPS-197 C.3)', () => {
  const key = Uint8Array.from({ length: 32 }, (_, i) => i);
  const ct = Uint8Array.from(Buffer.from('8ea2b7ca516745bfeafc49904b496089', 'hex'));
  assert.strictEqual(Buffer.from(SI.aesEcbDecrypt(key, ct)).toString('hex'), '00112233445566778899aabbccddeeff');
});
t('initial state = 7% and next = Crystal Heart', () => {
  const { E } = fresh();
  assert.strictEqual(E.completion().value, 7);
  assert.strictEqual(E.nextObjective().item.id, 'crystal-heart');
});
t('out-of-order Monarch Wings is never recommended again & implies Broken Vessel', () => {
  const { s, E } = fresh();
  s.setChecks({ 'monarch-wings': true });
  for (let k = 0; k < 40; k++) { const o = E.nextObjective(); assert.notStrictEqual(o.item.id, 'monarch-wings'); assert.notStrictEqual(o.item.id, 'broken-vessel'); s.setCheck(o.item.id, true); }
  assert.ok(E.inconsistencies().some(w => w.item && w.item.id === 'monarch-wings'));
});
t('Void Heart never recommended before THK, even when everything else is done', () => {
  const { s, E } = fresh();
  const all = {}; D.ITEMS.forEach(i => { if (!i.derived && i.id !== 'void-heart' && i.id !== 'ending-thk' && !i.optional) all[i.id] = true; });
  s.setChecks(all);
  const o = E.nextObjective();
  assert.ok(!o || o.item.id !== 'void-heart', 'recommended void heart');
  assert.ok(E.isVoidHeartLocked());
  s.setCheck('ending-thk', true);
  assert.ok(!E.isVoidHeartLocked());
});
t('ending order: THK stage before Kingsoul stage', () => assert.ok(D.STAGES.findIndex(x => x.id === 's-thk') < D.STAGES.findIndex(x => x.id === 's-kingsoul')));
t('full completion reaches 112 (with NKG path)', () => {
  const { s, E } = fresh();
  const all = {}; D.ITEMS.forEach(i => { if (!i.derived) all[i.id] = true; }); all['banishment'] = false; all['carefree-melody'] = false;
  s.setChecks(all); assert.strictEqual(E.completion().value, 112);
});
t('Banishment path also reaches 112', () => {
  const { s, E } = fresh();
  const all = {}; D.ITEMS.forEach(i => { if (!i.derived) all[i.id] = true; }); all['nightmare-king-grimm'] = false; all['grimmchild'] = false;
  s.setChecks(all); assert.strictEqual(E.completion().value, 112);
});
t('Kingsoul with one fragment flags inconsistency', () => { const { s, E } = fresh(); s.setChecks({ kingsoul: true, 'white-fragment-queen': true }); assert.ok(E.inconsistencies().some(w => w.item && w.item.id === 'kingsoul')); });
t('nail/ore accounting', () => {
  const { s, E } = fresh(); s.setResource('geo', 800);
  s.setChecks({ 'nail-1': true, 'ore-basin': true });
  assert.deepStrictEqual([E.ore().held, E.nextNail().ready], [1, true]);
  s.setChecks({ 'nail-2': true }); assert.strictEqual(E.ore().held, 0);
});
t('masks: 16 shards → 9 masks, +4%', () => { const { s, E } = fresh(); const m = {}; D.ITEMS.filter(i => i.type === 'mask').forEach(i => m[i.id] = true); s.setChecks(m); assert.strictEqual(E.shards().masks, 9); assert.strictEqual(E.completionBreakdown()['Mask Shards'].got, 4); });
t('JSON export/import roundtrip + version check', () => {
  const { s } = fresh(); s.setChecks({ 'crystal-heart': true }); s.setResource('geo', 1234);
  const txt = s.exportJSON(); const b = fresh(); b.s.importJSON(txt);
  assert.ok(b.s.isChecked('crystal-heart')); assert.strictEqual(b.s.get().resources.geo, 1234);
  assert.throws(() => b.s.importJSON('{"version":99}')); assert.throws(() => b.s.importJSON('{}'));
});
t('reset returns to initial state', () => { const { s, E } = fresh(); s.setChecks({ 'crystal-heart': true }); s.reset(); assert.strictEqual(E.completion().value, 7); });
t('real-save pipeline decodes synthetic user.dat', () => {
  const f = path.join(__dirname, 'fixtures', 'user-test.dat');
  if (!fs.existsSync(f)) throw new Error('fixture missing — run python3 tools/make_test_save.py');
  const save = SI.decode(fs.readFileSync(f));
  const res = SI.analyze(save, D, St.defaultState(D).checks);
  assert.strictEqual(res.summary.essence, 1437); assert.strictEqual(res.summary.nailLevel, 3);
  assert.ok(res.changes.some(c => c.id === 'monarch-wings' && c.to === true));
  assert.ok(!res.changes.some(c => c.id === 'ismas-tear'));
});
t('importer rejects non-save files', () => { assert.throws(() => SI.decode(Buffer.from('hello world'))); });
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
