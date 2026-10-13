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

/* ---- Account / cloud sync (pure parts) ---- */
const Cloud = require(path.join(root, 'js/cloud.js'));
t('a brand-new device starts at epoch so it can never overwrite synced progress', () => {
  const { s } = fresh(); assert.strictEqual(Date.parse(s.get().updatedAt), 0);
  assert.ok(Cloud.isPristine(s.get()));
  s.setCheck('mantis-claw', true); assert.ok(Date.parse(s.get().updatedAt) > 0); assert.ok(!Cloud.isPristine(s.get()));
});
t('cloud merge: union of checks, max of resources, notes/later/builds/history combined', () => {
  const a = { checks: { 'mantis-claw': true }, resources: { geo: 100, essence: 5, grubs: 1 }, notes: { x: 'local' }, later: ['kingsoul'], builds: [{ id: 'b1', name: 'A', charms: [] }], history: [{ d: '2026-10-01', v: 4, c: 3 }], settings: { spoilers: true }, currentRegion: 'greenpath' };
  const b = { checks: { 'crystal-heart': true }, resources: { geo: 50, essence: 9, grubs: 0 }, notes: { x: 'remote', y: 'r' }, later: ['kingsoul', 'mantis-claw'], builds: [{ id: 'b1', name: 'B', charms: [] }, { id: 'b2', name: 'C', charms: [] }], history: [{ d: '2026-10-01', v: 6, c: 5 }, { d: '2026-10-02', v: 7, c: 6 }], settings: {}, currentRegion: 'dirtmouth' };
  const m = Cloud.merge(a, b);
  assert.deepStrictEqual(Object.keys(m.checks).sort(), ['crystal-heart', 'mantis-claw']);
  assert.deepStrictEqual(m.resources, { geo: 100, essence: 9, grubs: 1 });
  assert.deepStrictEqual(m.notes, { x: 'local', y: 'r' }); assert.deepStrictEqual(m.later, ['kingsoul', 'mantis-claw']);
  assert.deepStrictEqual(m.builds.map(x => x.id), ['b1', 'b2']); assert.deepStrictEqual(m.history, [{ d: '2026-10-01', v: 6, c: 5 }, { d: '2026-10-02', v: 7, c: 6 }]);
  assert.strictEqual(m.currentRegion, 'greenpath');
  const s = St.createStore(D, null); s.importJSON(Object.assign({ version: 1 }, m)); assert.ok(s.isChecked('crystal-heart') && s.isChecked('mantis-claw'));
});
t('cloud: sameProgress ignores order/timestamps; parseConfig reads the Firebase snippet', () => {
  assert.ok(Cloud.sameProgress({ checks: { a: true, b: true }, resources: { geo: 1 }, updatedAt: 'x' }, { checks: { b: true, a: true }, resources: { geo: 1 }, updatedAt: 'y' }));
  assert.ok(!Cloud.sameProgress({ checks: { a: true } }, { checks: {} }));
  const c = Cloud.parseConfig('const firebaseConfig = {\n apiKey: "AIzaX",\n authDomain: "p.firebaseapp.com",\n projectId: "p",\n appId: "1:2:web:3",\n};');
  assert.deepStrictEqual([c.apiKey, c.projectId, c.appId], ['AIzaX', 'p', '1:2:web:3']);
  assert.strictEqual(Cloud.parseConfig('nothing here'), null);
});
t('firestore.rules: owner-only, validated fields, default deny', () => {
  const r = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  assert.ok(/request\.auth\.uid == uid/.test(r) && /hasOnly\(\['state', 'updatedAt', 'v'\]\)/.test(r) && /allow read, write: if false/.test(r));
});

/* ---- Roadmap sanity (wiki-checked fixes) ---- */
function walkRoute(s, E, hook, max) {
  const picked = [];
  for (let k = 0; k < (max || 260); k++) { const o = E.nextObjective(); if (!o) break; if (hook) hook(o.item); picked.push(o.item.id); s.setCheck(o.item.id, true); s.setRegion(o.item.region); }
  return picked;
}
t('nail upgrades need Pale Ore in hand: never recommended before the ore, and Pure Nail needs all 6', () => {
  const { s, E } = fresh();
  const n2 = D.ITEMS.find(i => i.id === 'nail-2');
  assert.ok(E.softIssues(n2).some(x => x.key === 'ore'));
  s.setCheck('ore-basin', true); assert.ok(!E.softIssues(n2).length);
  s.setCheck('nail-1', true); s.setCheck('nail-2', true);
  const n3 = D.ITEMS.find(i => i.id === 'nail-3'); assert.ok(E.softIssues(n3).some(x => x.key === 'ore'), 'Coiled needs 2 more in hand');
  const { s: s2, E: E2 } = fresh(); const bad = [];
  walkRoute(s2, E2, it => { if (it.type === 'nail' && E2.softIssues(it).length) bad.push(it.id); });
  assert.deepStrictEqual(bad, [], 'nail recommended without the ore: ' + bad);
  assert.strictEqual(E2.completion().value, 112);
});
t('route order: Sharpened/Channelled Nail come early (after the first 2 ore), Pure Nail only after every Pale Ore', () => {
  const { s, E } = fresh(); const r = walkRoute(s, E);
  assert.ok(r.indexOf('nail-2') < 40, 'Channelled Nail at step ' + r.indexOf('nail-2'));
  ['ore-crystal-peak', 'ore-basin', 'ore-nosk', 'ore-seer', 'ore-grubfather', 'ore-colosseum'].forEach(o => assert.ok(r.indexOf(o) < r.indexOf('nail-4'), o + ' after Pure Nail'));
});
t('Crystal Peak ore is sent after Monarch Wings; White Palace and Love Key gates include Monarch Wings / Isma’s Tear', () => {
  const { s, E } = fresh(); const r = walkRoute(s, E);
  assert.ok(r.indexOf('monarch-wings') < r.indexOf('ore-crystal-peak'));
  assert.ok(D.REGIONS.find(x => x.id === 'white-palace').req.includes('monarch-wings'));
  assert.ok(D.ITEMS.find(i => i.id === 'love-key').req.includes('ismas-tear'));
});
t('route never recommends an item whose hard requirements are missing, and Void Heart only after THK', () => {
  const { s, E } = fresh(); const r = []; walkRoute(s, E, it => { assert.deepStrictEqual(E.missing(it), [], it.id + ' recommended with missing reqs'); r.push(it.id); });
  assert.ok(r.indexOf('ending-thk') < r.indexOf('void-heart'));
  assert.ok(r.indexOf('void-heart') < r.indexOf('ending-sealed-siblings') && r.indexOf('void-heart') < r.indexOf('ending-dream-no-more'));
  assert.ok(r.indexOf('awoken-dream-nail') < r.indexOf('white-fragment-king'));
});
t('every region has a difficulty 1-5, valid min/rec ids, and min covers the region gate', () => {
  D.REGIONS.forEach(r => {
    const g = D.REGION_GUIDE[r.id]; assert.ok(g, r.id);
    assert.ok(g.diff >= 1 && g.diff <= 5 && D.DIFF_LABELS[g.diff]);
    (g.min || []).concat((g.rec && g.rec.items) || []).forEach(id => assert.ok(D.ITEMS.some(i => i.id === id), r.id + ' → ' + id));
    (r.req || []).forEach(id => assert.ok(g.min.includes(id), r.id + ' min lacks gate ' + id));
  });
  Object.keys(D.BOSS_DIFF).forEach(id => assert.ok(D.ITEMS.some(i => i.id === id), id));
});
t('readiness reacts to nail level, masks and items; never blocks', () => {
  const { s, E } = fresh();
  assert.strictEqual(E.readiness('deepnest').level, 'blocked'); s.setCheck('mantis-claw', true); s.setCheck('mothwing-cloak', true); assert.strictEqual(E.readiness('deepnest').level, 'under');
  assert.strictEqual(E.readiness('dirtmouth').level, 'ready');
  ['mantis-claw', 'mothwing-cloak', 'lumafly-lantern', 'nail-1', 'nail-2', 'nail-3'].forEach(id => s.setCheck(id, true));
  assert.ok(E.readiness('deepnest').rec.nail.ok);
  assert.ok(E.readiness('deepnest').rec.items[0].ok);
});
t('Geo per region sums purchases, shrinks when bought, and ignores excluded/beyond', () => {
  const { s, E } = fresh();
  const g0 = E.regionGeo('dirtmouth'); assert.ok(g0.total > 0 && g0.remaining === g0.total);
  const first = g0.items[0]; s.setCheck(first.id, true);
  assert.strictEqual(E.regionGeo('dirtmouth').remaining, g0.remaining - first.geo);
  const all = D.REGIONS.reduce((a, r) => a + E.regionGeo(r.id).total, 0);
  const direct = D.ITEMS.filter(i => !i.derived && !i.beyond && i.cost && i.cost.geo).reduce((a, i) => a + i.cost.geo, 0);
  assert.strictEqual(all, direct);
});
t('under-prepared Hollow Knight fight is deferred behind cleanup', () => {
  const { s, E } = fresh();
  ['lurien', 'monomon', 'herrah'].forEach(id => s.setCheck(id, true));
  const thk = D.ITEMS.find(i => i.id === 'ending-thk');
  assert.ok(E.itemGap(thk).gap > 0);
  assert.notStrictEqual(E.nextObjective().item.id, 'ending-thk');
});
t('regionPlan lists what is left by kind, with Geo/ore and shrinks when items are done', () => {
  const s = St.createStore(D, null), E = createEngine(D, s.get);
  const p = E.regionPlan('city-of-tears');
  assert.ok(p.left > 0 && p.main > 0 && p.main <= p.left);
  assert.strictEqual(p.kinds.reduce((a, k) => a + k.total, 0), p.left);
  assert.strictEqual(p.geo.remaining, E.regionGeo('city-of-tears').remaining);
  s.setCheck('soul-master', true);
  assert.strictEqual(E.regionPlan('city-of-tears').left, p.left - 1);
  assert.strictEqual(E.regionPlan('white-palace').kinds.length > 0, true);
});
t('save watch: picks only user1-4.dat slots, newest first, and compares with last import', () => {
  const W = require('../js/savewatch.js');
  const f = (name, m) => ({ name, lastModified: m, size: 10 });
  const slots = W.pickSlots([f('user1.dat', 5), f('user1.dat', 9), f('user2.dat.bak1', 3), f('notes.txt', 1), f('user4.dat', 7), f('User3.DAT', 2)]);
  assert.deepStrictEqual(slots.map(x => x.name + ':' + x.modified), ['user1.dat:9', 'user3.dat:2', 'user4.dat:7']);
  assert.strictEqual(W.compare({}, slots[0]), 'new');
  assert.strictEqual(W.compare({ imported: { name: 'user1.dat', modified: 9 } }, slots[0]), 'imported');
  assert.strictEqual(W.compare({ imported: { name: 'user1.dat', modified: 5 } }, slots[0]), 'new');
  assert.strictEqual(W.compare({ dismissed: { name: 'user1.dat', modified: 9 } }, slots[0]), 'dismissed');
  assert.strictEqual(W.compare({}, null), 'none');
});

t('builds: every synergy and template charm exists and has a notch cost; synergy pairs are real charms', () => {
  const B = require('../js/builds.js'), by = {}; D.ITEMS.forEach(i => { by[i.id] = i; });
  B.SYNERGIES.forEach(s => { assert.ok(by[s.a] && by[s.a].notches, s.a); assert.ok(by[s.b] && by[s.b].notches, s.b); assert.ok(/^https:\/\/hollowknight\.wiki\//.test(s.src)); assert.ok(s.fx.length > 10); });
  B.TEMPLATES.forEach(tp => tp.picks.forEach(id => { assert.ok(by[id] && by[id].type === 'charm' && by[id].notches, tp.id + ':' + id); assert.ok(!by[id].voidHeart); }));
});
t('builds: fit never overcharms, keeps priority order, reports missing vs no-room; synergies need both charms', () => {
  const B = require('../js/builds.js'), by = {}; D.ITEMS.forEach(i => { by[i.id] = i; });
  const tpl = { id: 'x', picks: ['fragile-strength', 'quick-slash', 'longnail', 'steady-body'] };   // 3, 3, 2, 1 notches
  const own = new Set(['fragile-strength', 'quick-slash', 'steady-body']);
  const f = B.fit(tpl, by, id => own.has(id), 5);
  assert.deepStrictEqual(f.chosen, ['fragile-strength', 'steady-body']);       // quick-slash (3) no longer fits after 3
  assert.deepStrictEqual(f.skipped, ['quick-slash']); assert.deepStrictEqual(f.missing, ['longnail']);
  assert.ok(f.used <= 5); assert.strictEqual(f.owned, 3);
  assert.strictEqual(B.fit(tpl, by, () => false, 11).chosen.length, 0);
  assert.strictEqual(B.active(['grubsong']).length, 0);
  assert.strictEqual(B.active(['grubsong', 'grubberflys-elegy']).length, 1);
  assert.strictEqual(B.partners(['defenders-crest']).length, 3);
});

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
