/*
 * Hollow Knight Companion — CHARM BUILDS
 * Pure helpers (also run in Node for the tests): synergies, build templates and the "best build with what you own" picker.
 *
 * SYNERGIES come from the Hollow Knight Wiki (checked Oct 2026): the "Charm Synergies" page and the Synergies section
 * of each charm page. Only pairs where the wiki names BOTH charms are listed; rows that don't name their partner were left out.
 * TEMPLATES are editorial: each one groups charms whose wiki effect fits the goal. They never change the roadmap.
 * Notch costs and effects come from HK.DATA (item.notches / item.fn).
 */
(function (root) {
  'use strict';
  var WIKI = function (p) { return 'https://hollowknight.wiki/w/' + p; };

  var SYNERGIES = [
    { a: 'grubsong', b: 'grubberflys-elegy', fx: 'SOUL gained when you take damage goes from 15 to 25.', src: WIKI('Grubsong') },
    { a: 'grubsong', b: 'weaversong', fx: 'Weaverlings give 3 SOUL per hit, even on enemies that give none from nail hits.', src: WIKI('Grubsong') },
    { a: 'fury-of-the-fallen', b: 'grubberflys-elegy', fx: 'At 1 mask the beams turn red and deal about 67.5% of nail damage each (works only at 1 mask).', src: WIKI('Grubberfly%27s_Elegy') },
    { a: 'mark-of-pride', b: 'grubberflys-elegy', fx: 'The beams are 35% taller.', src: WIKI('Grubberfly%27s_Elegy') },
    { a: 'defenders-crest', b: 'spore-shroom', fx: 'The spore cloud deals about 40 damage and still lasts 4.1 s.', src: WIKI('Spore_Shroom') },
    { a: 'defenders-crest', b: 'glowing-womb', fx: 'Hatchlings deal 5 less contact damage but leave a 1 s dung cloud (about 5 damage).', src: WIKI('Glowing_Womb') },
    { a: 'defenders-crest', b: 'flukenest', fx: 'The fluke horde becomes one large volatile fluke that explodes into a dung cloud (about 22 damage over 2.2 s).', src: WIKI('Flukenest') },
    { a: 'sprintmaster', b: 'dashmaster', fx: 'Running is faster still (wiki: base speed 8.3, 10 with Sprintmaster, 11.5 with both).', src: WIKI('Charm_Synergies') }
  ];

  var TEMPLATES = [
    { id: 'spells', name: 'Spell caster', goal: 'Cast spells more often and harder.', picks: ['shaman-stone', 'spell-twister', 'soul-catcher', 'soul-eater'] },
    { id: 'nail', name: 'Nail damage', goal: 'Hit harder and reach further with the nail.', picks: ['fragile-strength', 'quick-slash', 'mark-of-pride', 'longnail', 'steady-body'] },
    { id: 'tank', name: 'Take more hits', goal: 'More health and longer safety after a hit.', picks: ['fragile-heart', 'lifeblood-heart', 'stalwart-shell', 'baldur-shell', 'hiveblood', 'lifeblood-core'] },
    { id: 'heal', name: 'Heal faster or safer', goal: 'Shorter or safer healing.', picks: ['quick-focus', 'shape-of-unn', 'deep-focus', 'spore-shroom', 'defenders-crest'] },
    { id: 'beams', name: 'Low-health beams', goal: 'Nail beams while on 1 mask, fed by SOUL from damage.', picks: ['fury-of-the-fallen', 'grubberflys-elegy', 'mark-of-pride', 'grubsong'] },
    { id: 'clouds', name: 'Damage clouds', goal: 'Stand in the cloud and let it work.', picks: ['defenders-crest', 'spore-shroom', 'glowing-womb', 'flukenest'] },
    { id: 'soul', name: 'SOUL from damage', goal: 'Turn hits taken into SOUL.', picks: ['grubsong', 'grubberflys-elegy', 'weaversong'] },
    { id: 'explore', name: 'Exploring', goal: 'Move fast and pick up loose Geo.', picks: ['wayward-compass', 'gathering-swarm', 'dashmaster', 'sprintmaster'] }
  ];

  function cost(byId, id) { var c = byId[id]; return (c && c.notches) || 0; }
  function used(byId, sel) { return (sel || []).reduce(function (s, id) { return s + cost(byId, id); }, 0); }

  /** Synergies whose two charms are both in `sel`. */
  function active(sel) {
    var set = {}; (sel || []).forEach(function (id) { set[id] = true; });
    return SYNERGIES.filter(function (s) { return set[s.a] && set[s.b]; });
  }
  /** Synergies where you hold one side in `sel` and the other is missing from it. */
  function partners(sel) {
    var set = {}; (sel || []).forEach(function (id) { set[id] = true; });
    return SYNERGIES.filter(function (s) { return (set[s.a] && !set[s.b]) || (set[s.b] && !set[s.a]); });
  }

  /**
   * Best build from a template with what the player owns: walk the picks in priority order and keep each owned charm that still fits.
   * Never overcharms. Returns the chosen charms, the notches used, the owned charms that did not fit and the picks not owned yet.
   */
  function fit(tpl, byId, owned, notches) {
    var chosen = [], skipped = [], missing = [], u = 0;
    tpl.picks.forEach(function (id) {
      if (!byId[id]) return;
      if (!owned(id)) { missing.push(id); return; }
      var c = cost(byId, id);
      if (u + c <= notches) { chosen.push(id); u += c; } else skipped.push(id);
    });
    return { id: tpl.id, chosen: chosen, used: u, skipped: skipped, missing: missing, total: tpl.picks.length, owned: chosen.length + skipped.length };
  }

  var api = { SYNERGIES: SYNERGIES, TEMPLATES: TEMPLATES, used: used, active: active, partners: partners, fit: fit };
  root.HK = root.HK || {};
  root.HK.Builds = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
