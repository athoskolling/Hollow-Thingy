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
t('new game: 0% and the first steps are Vengeful Spirit → False Knight → Hornet → Mothwing Cloak → Mantis Claw', () => {
  const { s, E } = fresh();
  assert.strictEqual(E.completion().value, 0);
  assert.strictEqual(Object.keys(s.get().checks).length, 0);
  assert.strictEqual(s.get().currentRegion, 'dirtmouth');
  const order = [];
  for (let k = 0; k < 6; k++) { const o = E.nextObjective(); order.push(o.item.id); s.setCheck(o.item.id, true); }
  assert.deepStrictEqual(order.slice(0, 5), ['vengeful-spirit', 'false-knight', 'hornet-protector', 'mothwing-cloak', 'mantis-claw']);
  assert.ok(!['crystal-heart', 'void-heart'].includes(order[5]));
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
t('reset returns to initial state', () => { const { s, E } = fresh(); s.setChecks({ 'crystal-heart': true }); s.reset(); assert.strictEqual(E.completion().value, 0); });
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

/* ---- Plan features: later list, history, builds, profiles, guide data ---- */
function memStore() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; }
t('come-back-later list toggles, dedupes and survives export/import', () => {
  const { s } = fresh();
  assert.strictEqual(s.toggleLater('crystal-heart'), true); assert.ok(s.isLater('crystal-heart'));
  assert.strictEqual(s.toggleLater('crystal-heart'), false); assert.ok(!s.isLater('crystal-heart'));
  assert.strictEqual(s.toggleLater('not-an-item'), false);
  s.toggleLater('mantis-claw'); s.toggleLater('desolate-dive');
  const s2 = St.createStore(D, null); s2.importJSON(s.exportJSON());
  assert.deepStrictEqual(s2.get().later, ['desolate-dive', 'mantis-claw']);
});
t('history keeps one point per day and never bumps updatedAt (no sync ping-pong)', () => {
  const { s } = fresh(); const u = s.get().updatedAt;
  s.recordHistory('2026-10-01', 5, 10); s.recordHistory('2026-10-01', 7, 12); s.recordHistory('2026-10-02', 7, 12);
  assert.deepStrictEqual(s.get().history, [{ d: '2026-10-01', v: 7, c: 12 }, { d: '2026-10-02', v: 7, c: 12 }]);
  assert.strictEqual(s.get().updatedAt, u);
});
t('history import drops malformed entries and clamps values', () => {
  const { s } = fresh();
  s.importJSON({ version: 1, history: [{ d: 'bad', v: 3 }, { d: '2026-01-01', v: 500, c: 2 }, null, { d: '2026-01-02', v: 'x' }] });
  assert.deepStrictEqual(s.get().history, [{ d: '2026-01-01', v: 112, c: 2 }]);
});
t('charm builds: save, update, delete, unknown charms are dropped', () => {
  const { s } = fresh();
  const id = s.saveBuild({ name: 'Boss', charms: ['quick-slash', 'nope', 'fragile-heart'] });
  assert.ok(id); assert.deepStrictEqual(s.get().builds[0].charms.filter(c => c === 'nope'), []);
  s.saveBuild({ id, name: 'Boss v2', charms: ['quick-slash'] });
  assert.strictEqual(s.get().builds.length, 1); assert.strictEqual(s.get().builds[0].name, 'Boss v2');
  s.deleteBuild(id); assert.strictEqual(s.get().builds.length, 0);
});
t('save profiles: independent progress, rename, remove, main protected', () => {
  const mem = memStore(); const s = St.createStore(D, mem);
  s.setCheck('mantis-claw', true);
  const id = s.profiles.create('Steel Soul');
  assert.strictEqual(s.profiles.active(), id); assert.strictEqual(Object.keys(s.get().checks).length, 0);
  s.setCheck('crystal-heart', true);
  assert.ok(s.profiles.switchTo('main')); assert.ok(s.isChecked('mantis-claw')); assert.ok(!s.isChecked('crystal-heart'));
  const s2 = St.createStore(D, mem); assert.strictEqual(s2.profiles.active(), 'main'); assert.ok(s2.isChecked('mantis-claw'));
  s2.profiles.switchTo(id); assert.ok(s2.isChecked('crystal-heart'));
  s2.profiles.rename(id, 'SS run'); assert.strictEqual(s2.profiles.list().find(p => p.id === id).name, 'SS run');
  assert.strictEqual(s2.profiles.remove('main'), false);
  assert.ok(s2.profiles.remove(id)); assert.strictEqual(s2.profiles.active(), 'main'); assert.strictEqual(s2.profiles.list().length, 1);
  assert.ok(!(('hk-companion-state--' + id) in mem._m));
});
t('save profiles are capped at 8', () => {
  const s = St.createStore(D, memStore()); for (let k = 0; k < 7; k++) assert.ok(s.profiles.create('p' + k));
  assert.strictEqual(s.profiles.create('too many'), null);
});
t('guide data: boss/root/missable ids exist, every entry has a source, no invented HP', () => {
  const G = require(path.join(root, 'js/guide.js')); const ids = new Set(D.ITEMS.map(i => i.id));
  const g = G.GUIDE || G;
  Object.keys(g.BOSSES).forEach(k => { assert.ok(ids.has(k), 'boss ' + k); assert.ok(g.BOSSES[k].source, 'source ' + k); });
  Object.keys(g.ROOTS).forEach(k => { assert.ok(ids.has(k), 'root ' + k); assert.ok(g.ROOTS[k].source, 'source ' + k); });
  g.MISSABLES.forEach(m => { assert.ok(['permanent', 'choice', 'caution'].includes(m.severity)); assert.ok(m.source); m.items.forEach(i => assert.ok(ids.has(i), 'missable item ' + i)); });
  assert.ok(Object.keys(g.ROOTS).length === D.ITEMS.filter(i => /^root-/.test(i.id)).length);
});
t('every geo-priced item has a numeric cost and farms have a wiki source', () => {
  D.ITEMS.filter(i => i.cost && i.cost.geo !== undefined).forEach(i => assert.ok(Number.isFinite(i.cost.geo) && i.cost.geo > 0, i.id));
  D.FARMS.forEach(f => assert.ok(f.name && f.where && f.wiki));
});
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
