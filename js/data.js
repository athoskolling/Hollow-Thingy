/*
 * Hollow Knight Companion — DATA
 * ---------------------------------------------------------------
 * Single structured database. The UI is rendered from this file.
 * Sources: hollowknight.wiki (Completion, Charms, Mask Shard, Vessel Fragment,
 * Pale Ore, Simple Key, Seer, Dream Nail/Essence, Colosseum of Fools,
 * Grimm Troupe quest, Pantheons, Nailmasters, Queen's Gardens, etc.)
 *
 * Item fields
 *   id          unique id (kebab-case)
 *   name        official in-game name
 *   type        ability | spell | nail | nailart | mask | vessel | charm | notch | ore |
 *               key | boss | warrior | dreamboss | dreamer | dream | colosseum | grimm |
 *               godhome | ending | root | item | npc | access | derived
 *   region      region id (see REGIONS)
 *   completion  0 | 1 | 2 — OFFICIAL contribution to the 112% (wiki "Completion (Hollow Knight)")
 *   tags        filter tags
 *   req         hard requirements (ALL must be done)            → ids
 *   any         alternative requirements (AT LEAST ONE)         → ids
 *   soft        numeric conditions {essence, charms, grubs}     → shown as warnings, never blocking
 *   cost        {geo, ore}
 *   stage       roadmap stage id
 *   goal        true = main-route objective of its stage
 *   optional    not needed for 112% (and not on the critical route)
 *   beyond      Beyond-112% content (Pantheon of Hallownest, etc.)
 *   derived     auto-calculated (cannot be clicked): mask/vessel upgrades, rule slots
 *   save        mapping for the real-save importer (see save-importer.js)
 */
(function (root) {
  'use strict';
  var W = function (page) { return 'https://hollowknight.wiki/w/' + page; };

  /* ------------------------------------------------------------------ */
  /* REGIONS                                                             */
  /* ------------------------------------------------------------------ */
  var REGIONS = [
    { id: 'dirtmouth', name: "Dirtmouth & King's Pass", theme: 'dirtmouth', order: 0,
      access: 'Starting town. Sly, Iselda, Bretta, Elderbug, Grimm Troupe tents and Bretta\'s basement live here.' },
    { id: 'forgotten-crossroads', name: 'Forgotten Crossroads', theme: 'crossroads', order: 1,
      access: 'Below Dirtmouth (well).' },
    { id: 'greenpath', name: 'Greenpath', theme: 'greenpath', order: 2,
      access: 'West of the Forgotten Crossroads.' },
    { id: 'fungal-wastes', name: 'Fungal Wastes', theme: 'fungal', order: 3,
      access: "Through Queen's Station / Forgotten Crossroads. Includes Mantis Village and the Fungal Core." },
    { id: 'city-of-tears', name: 'City of Tears', theme: 'city', order: 4,
      access: 'City Crest gate (Forgotten Crossroads) or Fungal Wastes.' , req: ['access-city'] },
    { id: 'crystal-peak', name: 'Crystal Peak', theme: 'crystal', order: 5,
      access: 'From Dirtmouth (east, Desolate Dive) or from the Forgotten Crossroads (dark passage — Lumafly Lantern recommended).',
      any: ['desolate-dive', 'lumafly-lantern'] },
    { id: 'resting-grounds', name: 'Resting Grounds', theme: 'resting', order: 6,
      access: 'East of the City of Tears / Blue Lake. Seer, Dream Nail, Grey Mourner.',
      any: ['desolate-dive', 'access-city'] },
    { id: 'royal-waterways', name: 'Royal Waterways', theme: 'waterways', order: 7,
      access: 'Simple Key manhole (south-west City of Tears) or a Desolate Dive floor in the City.',
      any: ['desolate-dive', 'use-key-waterways'] },
    { id: 'fog-canyon', name: 'Fog Canyon', theme: 'fog', order: 8,
      access: "Between Greenpath, Queen's Station and the Crossroads. Acid blocks some entrances (Isma's Tear)." },
    { id: 'ancient-basin', name: 'Ancient Basin', theme: 'basin', order: 9,
      access: 'Below the City of Tears / Royal Waterways. Palace Grounds and the Abyss gate are here.',
      any: ['desolate-dive'] },
    { id: 'kingdoms-edge', name: "Kingdom's Edge & Colosseum", theme: 'edge', order: 10,
      access: "East of King's Station (City of Tears). The Colosseum of Fools is at the top of the western chasm." },
    { id: 'deepnest', name: 'Deepnest', theme: 'deepnest', order: 11,
      access: 'Behind the Mantis Lords, from the Fungal Core, or via the tram. Very dark — Lumafly Lantern helps.' },
    { id: 'the-hive', name: 'The Hive', theme: 'hive', order: 12,
      access: "Hidden in Kingdom's Edge." },
    { id: 'howling-cliffs', name: 'Howling Cliffs', theme: 'cliffs', order: 13,
      access: 'West of Dirtmouth / above Greenpath.' },
    { id: 'queens-gardens', name: "Queen's Gardens", theme: 'gardens', order: 14,
      access: "From Fog Canyon (Isma's Tear under the vines, or Shade Cloak via Overgrown Mound) or from Deepnest (Monarch Wings plank).",
      any: ['ismas-tear', 'shade-cloak', 'monarch-wings'] },
    { id: 'the-abyss', name: 'The Abyss', theme: 'abyss', order: 15,
      access: "Gate in the Ancient Basin opened with the King's Brand. Monarch Wings strongly recommended.",
      req: ['kings-brand'] },
    { id: 'white-palace', name: 'White Palace', theme: 'palace', order: 16,
      access: 'Dream Nail the Kingsmould corpse in the Palace Grounds (Ancient Basin) — requires the Awoken Dream Nail.',
      req: ['awoken-dream-nail'] },
    { id: 'godhome', name: 'Godhome', theme: 'godhome', order: 17,
      access: "Unlock the Godseeker's cocoon in the Junk Pit (Royal Waterways) with a Simple Key, then Dream Nail her.",
      req: ['use-key-godseeker', 'dream-nail'] }
  ];

  /* ------------------------------------------------------------------ */
  /* ROADMAP STAGES (recommended order — never mandatory)                */
  /* ------------------------------------------------------------------ */
  var STAGES = [
    { id: 's-start', title: 'Start — Vengeful Spirit, Mothwing Cloak & Mantis Claw', region: 'forgotten-crossroads' },
    { id: 's-city', title: 'City of Tears / Soul Master / Desolate Dive', region: 'city-of-tears' },
    { id: 's-peak', title: "Crystal Peak — Crystal Heart, Shopkeeper's Key, Pale Ore, Descending Dark", region: 'crystal-peak' },
    { id: 's-rest', title: 'Resting Grounds — Dream Nail, Seer, Essence', region: 'resting-grounds' },
    { id: 's-water', title: "Royal Waterways — Dung Defender, Isma's Tear", region: 'royal-waterways' },
    { id: 's-basin', title: 'Ancient Basin — Broken Vessel, Monarch Wings, Pale Ore', region: 'ancient-basin' },
    { id: 's-spells', title: 'Complete spells — Howling Wraiths, Shade Soul, Descending Dark', region: 'fog-canyon' },
    { id: 's-edge', title: "Kingdom's Edge — Hornet Sentinel, King's Brand, Nail Art", region: 'kingdoms-edge' },
    { id: 's-abyss', title: 'The Abyss — Shade Cloak, Abyss Shriek', region: 'the-abyss' },
    { id: 's-cleanup', title: 'Clean-up & upgrades — Nail, Masks, Vessels, Charms, Nail Arts, Essence, Dreams', region: null },
    { id: 's-dreamers', title: 'Dreamers — Herrah, Lurien, Monomon', region: null },
    { id: 's-thk', title: 'Black Egg → ENDING: The Hollow Knight', region: 'forgotten-crossroads' },
    { id: 's-kingsoul', title: "Queen's Gardens + White Palace → Kingsoul → Birthplace → Void Heart", region: 'queens-gardens' },
    { id: 's-endings', title: 'Sealed Siblings + Dream No More', region: 'forgotten-crossroads' },
    { id: 's-grimm', title: 'Grimm Troupe', region: 'dirtmouth' },
    { id: 's-colo', title: 'Colosseum of Fools', region: 'kingdoms-edge' },
    { id: 's-godhome', title: 'Godhome — Pantheons 1–4', region: 'godhome' },
    { id: 's-112', title: '112% — Pure Completion', region: null },
    { id: 's-beyond', title: 'BEYOND 112% — Pantheon of Hallownest, Absolute Radiance', region: 'godhome' }
  ];

  /* ------------------------------------------------------------------ */
  /* ITEMS                                                               */
  /* ------------------------------------------------------------------ */
  var ITEMS = [];
  function I(id, name, type, region, completion, o) {
    o = o || {};
    o.id = id; o.name = name; o.type = type; o.region = region; o.completion = completion || 0;
    o.tags = o.tags || [];
    o.req = o.req || []; o.any = o.any || [];
    ITEMS.push(o);
  }

  /* ---------- ACCESS / PROGRESS FLAGS (not counted) ---------- */
  I('access-city', 'Access to City of Tears', 'access', 'city-of-tears', 0, {
    tags: ['progression'], stage: 's-city', goal: true,
    loc: 'City Crest gate (Forgotten Crossroads) or the Fungal Wastes side.',
    how: 'Use the City Crest (dropped by False Knight) on the gate in the Forgotten Crossroads, or enter from the Fungal Wastes.',
    fn: 'Opens the City of Tears.', wiki: W('City_of_Tears') });

  I('lumafly-lantern', 'Lumafly Lantern', 'item', 'dirtmouth', 0, {
    tags: ['progression', 'key'], stage: 's-cleanup', cost: { geo: 1800 },
    loc: 'Sold by Sly in Dirtmouth.',
    how: 'Buy from Sly for 1800 Geo.', fn: 'Lights dark areas (Crystal Peak dark rooms, Stone Sanctuary, Deepnest).',
    unlocks: ['mask-stone-sanctuary', 'no-eyes', 'descending-dark'],
    wiki: W('Lumafly_Lantern'), save: { pd: 'hasLantern' } });

  /* ---------- EQUIPMENT (14%) ---------- */
  I('mothwing-cloak', 'Mothwing Cloak', 'ability', 'greenpath', 2, {
    tags: ['progression', 'skill'], stage: 's-start', goal: true, prio: 7, req: ['hornet-protector'],
    loc: 'Greenpath — reward after defeating Hornet Protector.', fn: 'Dash.',
    how: 'Defeat Hornet in Greenpath; the cloak is behind her arena.',
    unlocks: ['crystal-heart', 'thorns-of-agony'], wiki: W('Mothwing_Cloak'), save: { pd: 'hasDash' } });
  I('mantis-claw', 'Mantis Claw', 'ability', 'fungal-wastes', 2, {
    tags: ['progression', 'skill'], stage: 's-start', goal: true, prio: 5,
    loc: 'Mantis Village (Fungal Wastes).', fn: 'Wall jump / cling to walls.',
    how: 'Descend into Mantis Village; the claw is on a pedestal before the Mantis Lords.',
    unlocks: ['crystal-heart', 'mantis-lords', 'howling-wraiths'], wiki: W('Mantis_Claw'), save: { pd: 'hasWalljump' } });
  I('crystal-heart', 'Crystal Heart', 'ability', 'crystal-peak', 2, {
    tags: ['progression', 'skill'], stage: 's-peak', goal: true, prio: 10,
    req: ['mantis-claw', 'mothwing-cloak'],
    loc: 'Crystal Peak — inside an old mining golem at the end of a platforming section.',
    fn: 'Super Dash: hold to charge (~0.8 s) on the ground or a wall, then fly horizontally.',
    how: 'Reach the deep south-east part of Crystal Peak and finish the conveyor/laser platforming to the golem.',
    unlocks: ['ismas-tear', 'monarch-wings', 'broken-vessel', 'nosk', 'glowing-womb', 'deep-focus', 'great-slash'],
    wiki: W('Crystal_Heart'), save: { pd: 'hasSuperDash' } });
  I('monarch-wings', 'Monarch Wings', 'ability', 'ancient-basin', 2, {
    tags: ['progression', 'skill'], stage: 's-basin', goal: true, prio: 10,
    req: ['crystal-heart', 'broken-vessel'],
    loc: 'Ancient Basin — just after the Broken Vessel fight.', fn: 'Double jump.',
    how: 'Defeat Broken Vessel in the far left of the Ancient Basin; collect the wings behind the arena.',
    unlocks: ['hornet-sentinel', 'kings-brand', 'ore-crystal-peak', 'mask-deepnest', 'mask-enraged-guardian'],
    wiki: W('Monarch_Wings'), save: { pd: 'hasDoubleJump' } });
  I('ismas-tear', "Isma's Tear", 'ability', 'royal-waterways', 2, {
    tags: ['progression', 'skill'], stage: 's-water', goal: true, prio: 9,
    req: ['crystal-heart', 'dung-defender'],
    loc: "Isma's Grove, Royal Waterways.", fn: 'Swim in acid without taking damage.',
    how: "Defeat the Dung Defender, then use Crystal Heart to reach Isma's Grove.",
    unlocks: ['shape-of-unn', 'notch-fog-canyon', 'uumuu', 'monomon'],
    wiki: W("Isma%27s_Tear"), save: { pd: 'hasAcidArmour' } });
  I('kings-brand', "King's Brand", 'ability', 'kingdoms-edge', 2, {
    tags: ['progression', 'skill', 'key'], stage: 's-edge', goal: true, prio: 10,
    req: ['hornet-sentinel'],
    loc: "Kingdom's Edge — Cast-Off Shell, after defeating Hornet Sentinel.",
    fn: "Opens the Abyss gate in the Ancient Basin. Required for the Shade Cloak and for the 'The Hollow Knight' ending route.",
    how: 'Defeat Hornet Sentinel (needs Monarch Wings to reach), then claim the brand.',
    unlocks: ['shade-cloak', 'abyss-shriek', 'lifeblood-core'], wiki: W("King%27s_Brand"), save: { pd: 'hasKingsBrand' } });
  I('shade-cloak', 'Shade Cloak', 'ability', 'the-abyss', 2, {
    tags: ['progression', 'skill'], stage: 's-abyss', goal: true, prio: 10,
    req: ['kings-brand'],
    loc: 'The Abyss — far east past the sea of Void.',
    fn: 'Shadow Dash: dash through enemies, attacks and black Shade Gates.',
    how: 'Climb the lighthouse on the west side of the Void sea and turn on its light; cross east and stand in the Void fountain. Monarch Wings strongly recommended.',
    unlocks: ['traitor-lord', 'sharp-shadow', 'markoth', 'white-fragment-queen'],
    wiki: W('Shade_Cloak'), save: { pd: 'hasShadowDash' } });

  /* ---------- SPELLS (6%) ---------- */
  I('vengeful-spirit', 'Vengeful Spirit', 'spell', 'forgotten-crossroads', 1, {
    tags: ['progression', 'spell'], stage: 's-start', goal: true, prio: 10,
    loc: 'Ancestral Mound (Forgotten Crossroads) — Snail Shaman.', fn: 'Projectile spell.',
    how: 'Talk to the Snail Shaman in the Ancestral Mound.', wiki: W('Vengeful_Spirit'), save: { pdGte: ['fireballLevel', 1] } });
  I('shade-soul', 'Shade Soul', 'spell', 'city-of-tears', 1, {
    tags: ['progression', 'spell'], stage: 's-spells', goal: true, prio: 6,
    req: ['vengeful-spirit', 'elegant-key'],
    loc: 'Soul Sanctum side wing (City of Tears), behind a locked door.', fn: 'Upgraded Vengeful Spirit.',
    how: 'Buy the Elegant Key from Sly (needs Shopkeeper\'s Key), open the door in the Soul Sanctum and defeat the Soul Warrior there.',
    wiki: W('Shade_Soul'), save: { pdGte: ['fireballLevel', 2] } });
  I('desolate-dive', 'Desolate Dive', 'spell', 'city-of-tears', 1, {
    tags: ['progression', 'spell'], stage: 's-city', goal: true, req: ['soul-master'],
    loc: 'Soul Sanctum (City of Tears) — after Soul Master.', fn: 'Dive down, breaks fragile floors.',
    how: 'Defeat Soul Master.', unlocks: ['descending-dark', 'soul-eater', 'quick-slash', 'flukenest'],
    wiki: W('Desolate_Dive'), save: { pdGte: ['quakeLevel', 1] } });
  I('descending-dark', 'Descending Dark', 'spell', 'crystal-peak', 1, {
    tags: ['progression', 'spell'], stage: 's-peak', goal: true, prio: 6, req: ['desolate-dive'],
    loc: 'Crystallised Mound (Crystal Peak) — on a Snail Shaman corpse.', fn: 'Upgraded Desolate Dive.',
    how: 'Reach the Crystallised Mound and dive through the floors to the shaman. Lumafly Lantern recommended.',
    wiki: W('Descending_Dark'), save: { pdGte: ['quakeLevel', 2] } });
  I('howling-wraiths', 'Howling Wraiths', 'spell', 'fog-canyon', 1, {
    tags: ['progression', 'spell'], stage: 's-spells', goal: true, prio: 8, req: ['mantis-claw'],
    loc: "Overgrown Mound (Fog Canyon), next to the Queen's Gardens entrance.", fn: 'Upward scream spell.',
    how: 'Climb into the Overgrown Mound (Mantis Claw) and talk to the Snail Shaman.',
    unlocks: ['abyss-shriek'], wiki: W('Howling_Wraiths'), save: { pdGte: ['screamLevel', 1] } });
  I('abyss-shriek', 'Abyss Shriek', 'spell', 'the-abyss', 1, {
    tags: ['progression', 'spell'], stage: 's-abyss', goal: true, prio: 8,
    req: ['howling-wraiths', 'kings-brand'],
    loc: 'The Abyss.', fn: 'Upgraded Howling Wraiths.',
    how: 'In the Abyss, cast Howling Wraiths at the shaman podium to receive the upgrade. Monarch Wings recommended for the climb.',
    wiki: W('Abyss_Shriek'), save: { pdGte: ['screamLevel', 2] } });

  /* ---------- NAIL UPGRADES (4%) ---------- */
  I('nail-1', 'Sharpened Nail', 'nail', 'city-of-tears', 1, {
    tags: ['progression'], stage: 's-cleanup', cost: { geo: 250, ore: 0 },
    loc: "Nailsmith's hut (City of Tears).", fn: 'Old Nail → Sharpened Nail (5 → 9 damage).',
    how: 'Pay the Nailsmith 250 Geo.', wiki: W('Nail'), save: { pdGte: ['nailSmithUpgrades', 1] } });
  I('nail-2', 'Channelled Nail', 'nail', 'city-of-tears', 1, {
    tags: ['progression', 'ore'], stage: 's-cleanup', req: ['nail-1'], cost: { geo: 800, ore: 1 },
    loc: "Nailsmith's hut (City of Tears).", fn: 'Sharpened → Channelled Nail.',
    how: 'Pay 800 Geo + 1 Pale Ore.', wiki: W('Nail'), save: { pdGte: ['nailSmithUpgrades', 2] } });
  I('nail-3', 'Coiled Nail', 'nail', 'city-of-tears', 1, {
    tags: ['progression', 'ore'], stage: 's-cleanup', req: ['nail-2'], cost: { geo: 2000, ore: 2 },
    loc: "Nailsmith's hut (City of Tears).", fn: 'Channelled → Coiled Nail.',
    how: 'Pay 2000 Geo + 2 Pale Ore.', wiki: W('Nail'), save: { pdGte: ['nailSmithUpgrades', 3] } });
  I('nail-4', 'Pure Nail', 'nail', 'city-of-tears', 1, {
    tags: ['progression', 'ore'], stage: 's-cleanup', req: ['nail-3'], cost: { geo: 4000, ore: 3 },
    loc: "Nailsmith's hut (City of Tears).", fn: 'Coiled → Pure Nail (maximum damage).',
    how: 'Pay 4000 Geo + 3 Pale Ore. Afterwards you may spare the Nailsmith (Happy Couple, with Sheo).',
    wiki: W('Nail'), save: { pdGte: ['nailSmithUpgrades', 4] } });

  /* ---------- NAIL ARTS (3%) ---------- */
  I('great-slash', 'Great Slash', 'nailart', 'greenpath', 1, {
    tags: ['skill'], stage: 's-cleanup', any: ['crystal-heart', 'monarch-wings'],
    loc: "Nailmaster Sheo's hut — Greenpath, end of a spike-filled tunnel.", fn: 'Charged forward slash with extra damage.',
    how: 'Reach Sheo (Crystal Heart or Monarch Wings required) and accept his lesson. Free.',
    wiki: W('Great_Slash'), save: { pd: 'hasDashSlash' } });
  I('dash-slash', 'Dash Slash', 'nailart', 'kingdoms-edge', 1, {
    tags: ['skill'], stage: 's-edge', goal: true, prio: 4, cost: { geo: 800 },
    loc: "Nailmaster Oro's hut — far end of Kingdom's Edge.", fn: 'Charged slash right after a dash.',
    how: 'Reach Oro (Monarch Wings recommended) and pay 800 Geo.',
    wiki: W('Dash_Slash'), save: { pd: 'hasUpwardSlash' } });
  I('cyclone-slash', 'Cyclone Slash', 'nailart', 'howling-cliffs', 1, {
    tags: ['skill'], stage: 's-cleanup',
    loc: "Nailmaster Mato's hut — top of the Howling Cliffs.", fn: 'Spinning attack on all sides.',
    how: 'Climb to the top of the Howling Cliffs (Mantis Claw) and accept his lesson. Free.',
    wiki: W('Cyclone_Slash'), save: { pd: 'hasCyclone' } });

  /* ---------- MASK SHARDS (16 → 4%) ---------- */
  function shard(id, name, region, o) { o.tags = ['mask']; o.contrib = true; o.stage = o.stage || 's-cleanup'; I(id, name, 'mask', region, 0, o); }
  shard('mask-sly-1', 'Mask Shard — Sly #1', 'dirtmouth', { cost: { geo: 150 }, loc: 'Sly (Dirtmouth).', how: 'Buy for 150 Geo (after rescuing Sly).', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { pd: 'slyShellFrag1' } });
  shard('mask-sly-2', 'Mask Shard — Sly #2', 'dirtmouth', { cost: { geo: 500 }, req: ['mask-sly-1'], loc: 'Sly (Dirtmouth).', how: 'Buy for 500 Geo.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { pd: 'slyShellFrag2' } });
  shard('mask-sly-3', 'Mask Shard — Sly #3', 'dirtmouth', { cost: { geo: 800 }, req: ['mask-sly-2', 'shopkeepers-key'], loc: 'Sly (Dirtmouth).', how: "Buy for 800 Geo — requires the Shopkeeper's Key.", wiki: W('Mask_Shard_(Hollow_Knight)'), save: { pd: 'slyShellFrag3' } });
  shard('mask-sly-4', 'Mask Shard — Sly #4', 'dirtmouth', { cost: { geo: 1500 }, req: ['mask-sly-3'], loc: 'Sly (Dirtmouth).', how: 'Buy for 1500 Geo.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { pd: 'slyShellFrag4' } });
  shard('mask-mawlek', 'Mask Shard — Brooding Mawlek', 'forgotten-crossroads', { req: ['brooding-mawlek'], loc: 'Far west end of the Forgotten Crossroads.', how: 'Reward for defeating Brooding Mawlek.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Crossroads_09'] } });
  shard('mask-grubfather', 'Mask Shard — Grubfather (5 Grubs)', 'forgotten-crossroads', { soft: { grubs: 5 }, loc: 'Grubfather (Forgotten Crossroads).', how: 'Rescue 5 Grubs and talk to the Grubfather.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Crossroads_38'] } });
  shard('mask-crossroads-goams', 'Mask Shard — Crossroads (Goams)', 'forgotten-crossroads', { loc: 'Forgotten Crossroads, south of the False Knight, where some Goams are.', how: 'Mantis Claw recommended.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Crossroads_13'] } });
  shard('mask-queens-station', "Mask Shard — Queen's Station", 'fungal-wastes', { req: ['mantis-claw'], loc: "Queen's Station, near the east side (below the Fungal Wastes entrance).", how: 'Requires Mantis Claw.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Fungus2_01'] } });
  shard('mask-bretta', "Mask Shard — Bretta's house", 'dirtmouth', { req: ['bretta-rescued'], loc: "Bretta's house in Dirtmouth.", how: 'Rescue Bretta in the Fungal Wastes, then visit her house.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Room_Bretta'] } });
  shard('mask-stone-sanctuary', 'Mask Shard — Stone Sanctuary', 'greenpath', { loc: 'Stone Sanctuary (Greenpath), room north-east of No Eyes.', how: 'Lumafly Lantern recommended (dark).', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Fungus1_36'] } });
  shard('mask-waterways', 'Mask Shard — Royal Waterways', 'royal-waterways', { loc: 'North-west Royal Waterways — swim west under the main path.', how: 'Explore the north-west section.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Waterways_04b'] } });
  shard('mask-deepnest', 'Mask Shard — Deepnest (Fungal Core)', 'deepnest', { req: ['monarch-wings'], loc: 'Deepnest, when entered through the Fungal Core, near the Mantis Lords.', how: 'Requires Monarch Wings.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Fungus2_25'] } });
  shard('mask-enraged-guardian', 'Mask Shard — Enraged Guardian', 'crystal-peak', { req: ['monarch-wings'], loc: 'Crystal Peak, west of the Enraged Guardian.', how: 'Defeat the Enraged Guardian (requires Monarch Wings).', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Mines_32'] } });
  shard('mask-hive', 'Mask Shard — The Hive', 'the-hive', { loc: "Behind a wall in the Hive, west of Hive Knight's arena.", how: 'Bait a Hive Guardian into breaking the wall.', wiki: W('Mask_Shard_(Hollow_Knight)'), save: { scene: ['Heart Piece', 'Hive_04'] } });
  shard('mask-seer', 'Mask Shard — Seer (1500 Essence)', 'resting-grounds', { req: ['dream-nail'], soft: { essence: 1500 }, stage: 's-cleanup', loc: 'Seer (Resting Grounds).', how: 'Bring 1500 Essence to the Seer.', wiki: W('Seer'), save: { pd: 'dreamReward7' } });
  shard('mask-grey-mourner', 'Mask Shard — Grey Mourner', 'resting-grounds', { req: ['delicate-flower'], loc: 'Grey Mourner (Resting Grounds).', how: 'Complete the Delicate Flower quest.', wiki: W('Delicate_Flower_(Quest)'), save: { scene: ['Heart Piece', 'Room_Mansion'] } });

  /* ---------- VESSEL FRAGMENTS (9 → 3%) ---------- */
  function vessel(id, name, region, o) { o.tags = ['vessel']; o.contrib = true; o.stage = o.stage || 's-cleanup'; I(id, name, 'vessel', region, 0, o); }
  vessel('vessel-sly-1', 'Vessel Fragment — Sly #1', 'dirtmouth', { cost: { geo: 550 }, loc: 'Sly (Dirtmouth).', how: 'Buy for 550 Geo.', wiki: W('Vessel_Fragment'), save: { pd: 'slyVesselFrag1' } });
  vessel('vessel-sly-2', 'Vessel Fragment — Sly #2', 'dirtmouth', { cost: { geo: 900 }, req: ['shopkeepers-key'], loc: 'Sly (Dirtmouth).', how: "Buy for 900 Geo — requires the Shopkeeper's Key.", wiki: W('Vessel_Fragment'), save: { pd: 'slyVesselFrag2' } });
  vessel('vessel-greenpath', 'Vessel Fragment — Greenpath', 'greenpath', { loc: "Greenpath, near the (initially inaccessible) Queen's Gardens entrance.", how: 'Platforming over thorns.', wiki: W('Vessel_Fragment'), save: { scene: ['Vessel Fragment', 'Fungus1_13'] } });
  vessel('vessel-crossroads-lift', 'Vessel Fragment — Crossroads lift', 'forgotten-crossroads', { req: ['access-city'], loc: 'Left of the lift in the Forgotten Crossroads.', how: 'Unlock the lift from the City of Tears side.', wiki: W('Vessel_Fragment'), save: { scene: ['Vessel Fragment', 'Crossroads_37'] } });
  vessel('vessel-kings-station', "Vessel Fragment — King's Station", 'city-of-tears', { loc: "Above King's Station (City of Tears), near a lift.", how: 'Explore above the station.', wiki: W('Vessel_Fragment'), save: { scene: ['Vessel Fragment', 'Ruins2_09'] } });
  vessel('vessel-deepnest', 'Vessel Fragment — Deepnest', 'deepnest', { loc: 'Deepnest, above the working tram (Goam platforming).', how: 'Platform over the Goams.', wiki: W('Vessel_Fragment'), save: { scene: ['Vessel Fragment', 'Deepnest_38'] } });
  vessel('vessel-stag-nest', 'Vessel Fragment — Stag Nest', 'howling-cliffs', { req: ['all-stag-stations'], loc: 'Beginning of the Stag Nest.', how: 'Open every Stag Station, then ride to the Stag Nest.', wiki: W('Vessel_Fragment'), save: { pd: 'vesselFragStagNest' } });
  vessel('vessel-seer', 'Vessel Fragment — Seer (700 Essence)', 'resting-grounds', { req: ['dream-nail'], soft: { essence: 700 }, stage: 's-rest', loc: 'Seer (Resting Grounds).', how: 'Bring 700 Essence to the Seer.', wiki: W('Seer'), save: { pd: 'dreamReward5' } });
  vessel('vessel-fountain', 'Vessel Fragment — Basin Fountain', 'ancient-basin', { cost: { geo: 3000 }, loc: 'Fountain in the Ancient Basin.', how: 'Drop a total of 3000 Geo into the fountain (it only takes up to 3000).', wiki: W('Vessel_Fragment'), save: { scene: ['Vessel Fragment', 'Abyss_04'] } });

  /* ---------- PALE ORE (6) ---------- */
  function ore(id, name, region, o) { o.tags = ['ore']; o.contrib = true; I(id, name, 'ore', region, 0, o); }
  ore('ore-basin', 'Pale Ore — Ancient Basin', 'ancient-basin', { stage: 's-basin', goal: true, prio: 5, loc: 'Ancient Basin, west of the tram station near the main entrance.', how: 'Defeat the two Lesser Mawleks guarding it.', wiki: W('Pale_Ore'), save: { scene: ['Battle Scene Ore', 'Abyss_17'] } });
  ore('ore-seer', 'Pale Ore — Seer (300 Essence)', 'resting-grounds', { stage: 's-rest', req: ['dream-nail'], soft: { essence: 300 }, loc: 'Seer (Resting Grounds).', how: 'Bring 300 Essence to the Seer.', wiki: W('Pale_Ore'), save: { pd: 'dreamReward3' } });
  ore('ore-crystal-peak', "Pale Ore — Hallownest's Crown", 'crystal-peak', { stage: 's-peak', goal: true, prio: 5, req: ['mantis-claw'], loc: "Hallownest's Crown, very top of Crystal Peak, inside a Radiance statue base.", how: 'Requires Mantis Claw; Monarch Wings and Crystal Heart recommended (the climb is hard without wings).', wiki: W('Pale_Ore'), save: { scene: ['Shiny Item Stand', 'Mines_34'] } });
  ore('ore-nosk', 'Pale Ore — Nosk', 'deepnest', { stage: 's-cleanup', req: ['nosk'], loc: "Nosk's lair (Deepnest) — break a wall in the room west of the Hot Spring.", how: 'Defeat Nosk.', wiki: W('Pale_Ore'), save: { scene: ['Shiny Item Stand', 'Deepnest_32'] } });
  ore('ore-grubfather', 'Pale Ore — Grubfather (31 Grubs)', 'forgotten-crossroads', { stage: 's-cleanup', soft: { grubs: 31 }, loc: 'Grubfather (Forgotten Crossroads).', how: 'Rescue 31 Grubs.', wiki: W('Pale_Ore'), save: { scene: ['Shiny Item Ore', 'Crossroads_38'] } });
  ore('ore-colosseum', 'Pale Ore — Trial of the Conqueror', 'kingdoms-edge', { stage: 's-colo', req: ['trial-conqueror'], loc: 'Colosseum of Fools.', how: 'First clear of the Trial of the Conqueror.', wiki: W('Pale_Ore'), save: { pd: 'colosseumSilverCompleted' } });

  /* ---------- KEYS & ACCESS ITEMS ---------- */
  I('key-sly', 'Simple Key — Sly', 'key', 'dirtmouth', 0, { tags: ['key'], stage: 's-cleanup', cost: { geo: 950 }, keyObtain: true, loc: 'Sly (Dirtmouth).', how: 'Buy for 950 Geo.', wiki: W('Simple_Key_(Hollow_Knight)'), save: { pd: 'slySimpleKey' } });
  I('key-city', 'Simple Key — City of Tears', 'key', 'city-of-tears', 0, { tags: ['key'], stage: 's-city', keyObtain: true, loc: 'North-west City of Tears, south of the City Storerooms — topmost alcove on the right side of the room.', how: 'Climb to the alcove.', wiki: W('Simple_Key_(Hollow_Knight)'), save: { scene: ['Shiny Item', 'Ruins1_17'] } });
  I('key-basin', 'Simple Key — Ancient Basin', 'key', 'ancient-basin', 0, { tags: ['key'], stage: 's-basin', keyObtain: true, loc: 'South-west Ancient Basin, on a Royal Retainer corpse inside a Mawlurk.', how: 'Explore the lower-left Basin.', wiki: W('Simple_Key_(Hollow_Knight)'), save: { scene: ['Shiny Item Stand', 'Abyss_20'] } });
  I('key-lurker', 'Simple Key — Pale Lurker', 'key', 'kingdoms-edge', 0, { tags: ['key'], stage: 's-colo', keyObtain: true, loc: "Pale Lurker's Retreat, behind the Colosseum of Fools (break the wall far east of the warriors' pit).", how: 'Defeat the Pale Lurker.', wiki: W('Pale_Lurker'), save: { pd: 'gotLurkerKey' } });
  I('use-key-waterways', 'Use Simple Key — Waterways manhole', 'key', 'city-of-tears', 0, { tags: ['key'], stage: 's-water', keyUse: true, soft: { keyHeld: 1 }, loc: 'South-west City of Tears, west of the Fountain Square.', how: 'Use a Simple Key on the mechanism. Optional if you enter the Waterways another way.', fn: 'Opens the Royal Waterways.', wiki: W('Simple_Key_(Hollow_Knight)'), optional: true, save: { pd: 'openedWaterwaysManhole' } });
  I('use-key-pleasure-house', 'Use Simple Key — Pleasure House', 'key', 'city-of-tears', 0, { tags: ['key', 'optional'], stage: 's-cleanup', keyUse: true, soft: { keyHeld: 1 }, optional: true, loc: "South-east City of Tears, west of King's Station.", how: 'Use a Simple Key on the door (bath house — a Hallownest Seal… and lore).', wiki: W('Pleasure_House'), save: { pd: 'bathHouseOpened' } });
  I('use-key-jiji', "Use Simple Key — Jiji's cave", 'key', 'dirtmouth', 0, { tags: ['key', 'optional'], stage: 's-cleanup', keyUse: true, soft: { keyHeld: 1 }, optional: true, loc: 'East of Dirtmouth, beyond the graveyard.', how: 'Use a Simple Key on the stone door (Confessor Jiji).', wiki: W('Confessor_Jiji'), save: { pd: 'jijiDoorUnlocked' } });
  I('use-key-godseeker', "Use Simple Key — Godseeker's cocoon", 'key', 'royal-waterways', 0, { tags: ['key', 'progression'], stage: 's-godhome', goal: true, prio: 10, keyUse: true, soft: { keyHeld: 1 }, loc: 'Junk Pit (Royal Waterways).', how: 'Use a Simple Key on the chained cocoon, then Dream Nail the Godseeker.', fn: 'Access to Godhome and the Godtuner.', wiki: W('Godseeker'), save: { pd: 'godseekerUnlocked' } });
  I('shopkeepers-key', "Shopkeeper's Key", 'key', 'crystal-peak', 0, { tags: ['key', 'progression'], stage: 's-peak', goal: true, prio: 7, loc: 'Crystal Peak (below where Quirrel can be met).', how: 'Explore Crystal Peak; return it to Sly to unlock more stock (Elegant Key, Sly shards #3/#4, Vessel #2, Heavy Blow, Sprintmaster).', unlocks: ['elegant-key', 'mask-sly-3', 'vessel-sly-2', 'heavy-blow', 'sprintmaster'], wiki: W("Shopkeeper%27s_Key"), save: { any: ['hasSlykey', 'gaveSlykey'] } });
  I('elegant-key', 'Elegant Key', 'key', 'dirtmouth', 0, { tags: ['key', 'progression'], stage: 's-spells', goal: true, prio: 7, req: ['shopkeepers-key'], cost: { geo: 800 }, loc: 'Sly (Dirtmouth).', how: "Buy for 800 Geo after giving Sly his Shopkeeper's Key.", unlocks: ['shade-soul'], wiki: W('Elegant_Key'), save: { any: ['hasWhiteKey', 'usedWhiteKey'] } });
  I('love-key', 'Love Key', 'key', 'queens-gardens', 0, { tags: ['key'], stage: 's-cleanup', loc: "Queen's Gardens — corpse in the south-east part of the Gardens.", how: "Grab the key (an Isma's Tear arena nearby triggers after taking it).", unlocks: ['the-collector'], wiki: W('Love_Key'), save: { any: ['hasLoveKey', 'openedLoveDoor'] } });
  I('tram-pass', 'Tram Pass', 'key', 'deepnest', 0, { tags: ['key', 'optional'], optional: true, stage: 's-cleanup', loc: 'Failed Tramway (Deepnest).', how: 'Pick it up in the Failed Tramway; lets you ride the trams.', wiki: W('Tram_Pass'), save: { pd: 'hasTramPass' } });
  I('city-crest', 'City Crest', 'key', 'forgotten-crossroads', 0, { tags: ['key', 'progression'], stage: 's-city', req: ['false-knight'], loc: 'Dropped by the False Knight.', how: 'Defeat False Knight; use it on the City of Tears gate.', wiki: W('City_Crest'), save: { pd: 'falseKnightDefeated' } });
  I('all-stag-stations', 'All Stag Stations opened', 'access', 'howling-cliffs', 0, { tags: ['progression'], stage: 's-cleanup', loc: 'Stag Stations across Hallownest (Dirtmouth, Crossroads 50, Greenpath 140, Queen\'s Station 120, City Storerooms 200, Resting Grounds, King\'s Station 300, Queen\'s Gardens 200, Distant Village 250, Hidden Station 300 Geo).', how: 'Open every station; the Stag Nest then becomes available.', unlocks: ['vessel-stag-nest'], wiki: W('Stag_Station'), save: { pd: 'openedStagNest' } });

  /* ---------- DREAM NAIL & ESSENCE (3%) ---------- */
  I('dream-nail', 'Dream Nail', 'dream', 'resting-grounds', 1, { tags: ['progression', 'dream', 'skill'], stage: 's-rest', goal: true, prio: 10,
    loc: 'Resting Grounds — inspect the Dreamers memorial.', fn: 'Collect Essence, read minds, enter dreams, Warrior Dreams, Dreamers.',
    how: 'Inspect the memorial; in the dream take the Dream Nail from the Seer and climb out. Then talk to the Seer.', wiki: W('Dream_Nail'), save: { pd: 'hasDreamNail' } });
  I('awoken-dream-nail', 'Awoken Dream Nail', 'dream', 'resting-grounds', 1, { tags: ['progression', 'dream'], stage: 's-cleanup', goal: true, prio: 6, req: ['dream-nail'], soft: { essence: 1800 },
    loc: 'Seer (Resting Grounds).', fn: 'Opens the White Palace (Kingsmould corpse) and protected memories.',
    how: 'Bring 1800 Essence to the Seer.', unlocks: ['white-fragment-king'], wiki: W('Dream_Nail'), save: { pd: 'dreamNailUpgraded' } });
  I('seer-ascension', "Seer's final words (2400)", 'dream', 'resting-grounds', 1, { tags: ['dream'], stage: 's-cleanup', req: ['awoken-dream-nail'], soft: { essence: 2400 },
    loc: 'Seer (Resting Grounds).', fn: 'Ascension achievement.', how: 'Bring 2400 Essence to the Seer.', wiki: W('Seer'), save: { pd: 'mothDeparted' } });
  function seer(id, name, ess, o) { o.tags = ['dream', 'optional']; o.optional = true; o.req = ['dream-nail']; o.soft = { essence: ess }; o.stage = 's-cleanup'; o.loc = 'Seer (Resting Grounds).'; o.wiki = W('Seer'); I(id, name, 'item', 'resting-grounds', 0, o); }
  seer('seer-seal', 'Seer 100 — Hallownest Seal', 100, { how: 'Relic, sell to Lemm for 450 Geo.', save: { pd: 'dreamReward1' } });
  seer('seer-glade', "Seer 200 — Spirits' Glade opens", 200, { how: "Opens the Spirits' Glade (Whispering Root, spirits)." });
  seer('seer-dreamgate', 'Seer 900 — Dreamgate', 900, { how: 'Learn Dreamgate (1 Essence per warp).' });
  seer('seer-arcane-egg', 'Seer 1200 — Arcane Egg', 1200, { how: 'Relic, sell to Lemm for 1200 Geo.', save: { pd: 'dreamReward6' } });

  /* ---------- CHARMS (36 base + 4 Grimm Troupe) ---------- */
  function charm(id, num, name, notches, region, o) {
    o.tags = (o.tags || []).concat(['charm']); o.notches = notches; o.charmNum = num;
    o.stage = o.stage || 's-cleanup'; o.wiki = o.wiki || W(name.replace(/ /g, '_').replace(/'/g, '%27'));
    if (!o.save) o.save = { pd: 'gotCharm_' + num };
    I(id, name, 'charm', region, o.completion === undefined ? 1 : o.completion, o);
  }
  charm('wayward-compass', 2, 'Wayward Compass', 1, 'dirtmouth', { cost: { geo: 220 }, loc: 'Iselda (Dirtmouth).', how: 'Buy for 220 Geo (after meeting Cornifer).', fn: 'Shows your position on the map.' });
  charm('gathering-swarm', 1, 'Gathering Swarm', 1, 'dirtmouth', { cost: { geo: 300 }, loc: 'Sly (Dirtmouth).', how: 'Buy for 300 Geo.', fn: 'Collects loose Geo.' });
  charm('stalwart-shell', 4, 'Stalwart Shell', 2, 'dirtmouth', { cost: { geo: 200 }, loc: 'Sly (Dirtmouth).', how: 'Buy for 200 Geo.', fn: 'Longer invulnerability after damage.' });
  charm('soul-catcher', 20, 'Soul Catcher', 2, 'forgotten-crossroads', { loc: 'Ancestral Mound, west of Elder Baldur.', how: 'Explore the Ancestral Mound.', fn: 'More SOUL per nail hit.' });
  charm('shaman-stone', 19, 'Shaman Stone', 3, 'forgotten-crossroads', { cost: { geo: 220 }, loc: 'Salubra (Forgotten Crossroads).', how: 'Buy for 220 Geo.', fn: 'Stronger spells.' });
  charm('soul-eater', 21, 'Soul Eater', 4, 'resting-grounds', { req: ['desolate-dive'], stage: 's-rest', goal: false, loc: 'Resting Grounds.', how: 'Requires Desolate Dive (break the floor).', fn: 'Greatly more SOUL per nail hit.' });
  charm('dashmaster', 31, 'Dashmaster', 2, 'fungal-wastes', { loc: 'Fungal Wastes, south of Mantis Village.', how: 'Dashmaster statue room.', fn: 'Faster/downward dash.' });
  charm('thorns-of-agony', 12, 'Thorns of Agony', 1, 'greenpath', { req: ['mothwing-cloak'], loc: 'Greenpath, middle of the area.', how: 'Requires Mothwing Cloak.', fn: 'Thorns damage nearby foes when hit.' });
  charm('fury-of-the-fallen', 6, 'Fury of the Fallen', 2, 'dirtmouth', { loc: "King's Pass, east of the starting room.", how: 'Nail-bounce over the spikes.', fn: 'More damage at 1 mask.' });
  charm('fragile-heart', 23, 'Fragile Heart', 2, 'fungal-wastes', { cost: { geo: 350 }, loc: 'Leg Eater (Fungal Wastes).', how: "Buy for 350 Geo (280 with Defender's Crest). Breaks on death (Leg Eater repairs). Must NOT be held by Divine when you count 112%.", fn: '+2 masks.' });
  charm('fragile-greed', 24, 'Fragile Greed', 2, 'fungal-wastes', { cost: { geo: 250 }, loc: 'Leg Eater (Fungal Wastes).', how: "Buy for 250 Geo (200 with Defender's Crest).", fn: 'More Geo from enemies.' });
  charm('fragile-strength', 25, 'Fragile Strength', 3, 'fungal-wastes', { cost: { geo: 600 }, loc: 'Leg Eater (Fungal Wastes).', how: "Buy for 600 Geo (480 with Defender's Crest).", fn: '+50% nail damage.' });
  charm('spell-twister', 33, 'Spell Twister', 2, 'city-of-tears', { stage: 's-city', loc: 'Soul Sanctum, room before Soul Master.', how: 'Explore the Soul Sanctum.', fn: 'Spells cost 24 SOUL.' });
  charm('steady-body', 14, 'Steady Body', 1, 'forgotten-crossroads', { cost: { geo: 120 }, loc: 'Salubra (Forgotten Crossroads).', how: 'Buy for 120 Geo.', fn: 'No recoil on nail hits.' });
  charm('heavy-blow', 15, 'Heavy Blow', 2, 'dirtmouth', { cost: { geo: 350 }, req: ['shopkeepers-key'], loc: 'Sly (Dirtmouth).', how: "Buy for 350 Geo — requires the Shopkeeper's Key.", fn: 'More knockback.' });
  charm('quick-slash', 32, 'Quick Slash', 3, 'kingdoms-edge', { req: ['desolate-dive'], stage: 's-edge', loc: "Kingdom's Edge, south of Oro's hut.", how: 'Requires Desolate Dive.', fn: 'Faster nail swings.' });
  charm('longnail', 18, 'Longnail', 2, 'forgotten-crossroads', { cost: { geo: 300 }, loc: 'Salubra (Forgotten Crossroads).', how: 'Buy for 300 Geo.', fn: 'Longer nail range.' });
  charm('mark-of-pride', 13, 'Mark of Pride', 3, 'fungal-wastes', { req: ['mantis-lords'], loc: 'Mantis Village, north-east of the Mantis Lords room.', how: 'Defeat the Mantis Lords.', fn: 'Much longer nail range.' });
  charm('baldur-shell', 5, 'Baldur Shell', 2, 'howling-cliffs', { loc: 'Howling Cliffs — chest to the south.', how: 'Break the Baldurs (spells help).', fn: 'Shield while focusing.' });
  charm('flukenest', 11, 'Flukenest', 3, 'royal-waterways', { req: ['desolate-dive'], stage: 's-water', loc: 'Royal Waterways.', how: 'Defeat Flukemarm (requires Desolate Dive).', fn: 'Vengeful Spirit becomes baby flukes.' });
  charm('defenders-crest', 10, "Defender's Crest", 1, 'royal-waterways', { req: ['dung-defender'], stage: 's-water', loc: 'Royal Waterways.', how: 'Dropped by the Dung Defender.', fn: 'Heroic odour (damaging cloud).' });
  charm('glowing-womb', 22, 'Glowing Womb', 2, 'forgotten-crossroads', { req: ['crystal-heart'], loc: 'Forgotten Crossroads, east of the False Knight.', how: 'Requires Crystal Heart.', fn: 'Spawns hatchlings.' });
  charm('quick-focus', 7, 'Quick Focus', 3, 'forgotten-crossroads', { cost: { geo: 800 }, loc: 'Salubra (Forgotten Crossroads).', how: 'Buy for 800 Geo.', fn: 'Faster healing.' });
  charm('deep-focus', 34, 'Deep Focus', 4, 'crystal-peak', { req: ['crystal-heart'], stage: 's-peak', loc: 'Crystal Peak, south of Cornifer.', how: 'Requires Crystal Heart.', fn: 'Slower but double healing.' });
  charm('lifeblood-heart', 8, 'Lifeblood Heart', 2, 'forgotten-crossroads', { cost: { geo: 250 }, loc: 'Salubra (Forgotten Crossroads).', how: 'Buy for 250 Geo.', fn: 'Lifeblood masks when resting.' });
  charm('lifeblood-core', 9, 'Lifeblood Core', 3, 'the-abyss', { req: ['kings-brand'], stage: 's-abyss', loc: 'The Abyss, west wall (Lifeblood door).', how: "Have 14 Lifeblood masks (15 with Joni's Blessing) to open the door.", fn: 'Large Lifeblood coating.' });
  charm('jonis-blessing', 27, "Joni's Blessing", 4, 'howling-cliffs', { loc: "Joni's Repose (Howling Cliffs).", how: 'Reach Joni\'s Repose.', fn: 'More (blue) health, no focus healing.' });
  charm('grubsong', 3, 'Grubsong', 1, 'forgotten-crossroads', { soft: { grubs: 10 }, loc: 'Grubfather (Forgotten Crossroads).', how: 'Rescue 10 Grubs.', fn: 'SOUL when damaged.' });
  charm('grubberflys-elegy', 35, "Grubberfly's Elegy", 3, 'forgotten-crossroads', { soft: { grubs: 46 }, loc: 'Grubfather (Forgotten Crossroads).', how: 'Rescue all 46 Grubs.', fn: 'Nail beams at full health.' });
  charm('hiveblood', 29, 'Hiveblood', 4, 'the-hive', { req: ['hive-knight'], loc: "The Hive, south of Hive Knight.", how: 'Defeat Hive Knight.', fn: 'Regenerates health over time.' });
  charm('spore-shroom', 17, 'Spore Shroom', 1, 'fungal-wastes', { loc: "Fungal Wastes, west end near the Queen's Gardens entrance.", how: 'Explore the west Fungal Wastes.', fn: 'Spore cloud when focusing.' });
  charm('sharp-shadow', 16, 'Sharp Shadow', 2, 'deepnest', { req: ['shade-cloak'], loc: 'Deepnest, south-east of the Hot Spring.', how: 'Requires Shade Cloak.', fn: 'Shadow Dash damages enemies.' });
  charm('shape-of-unn', 28, 'Shape of Unn', 2, 'greenpath', { req: ['ismas-tear'], loc: 'Lake of Unn (Greenpath).', how: "Requires Isma's Tear.", fn: 'Move while focusing.' });
  charm('nailmasters-glory', 26, "Nailmaster's Glory", 1, 'dirtmouth', { req: ['great-slash', 'dash-slash', 'cyclone-slash'], loc: 'Sly (Dirtmouth).', how: 'Learn all 3 Nail Arts, then talk to Sly.', fn: 'Faster Nail Art charge.' });
  charm('dream-wielder', 30, 'Dream Wielder', 1, 'resting-grounds', { req: ['dream-nail'], soft: { essence: 500 }, stage: 's-rest', loc: 'Seer (Resting Grounds).', how: 'Bring 500 Essence.', fn: 'Faster Dream Nail, more SOUL.' });
  charm('kingsoul', 36, 'Kingsoul', 5, 'queens-gardens', { tags: ['progression'], stage: 's-kingsoul', goal: true, prio: 8, req: ['white-fragment-queen', 'white-fragment-king'],
    loc: "Combine the White Lady's fragment (Queen's Gardens) and the Pale King's fragment (end of the White Palace).",
    how: 'Only counts for completion when BOTH halves are collected.', fn: 'Slowly generates SOUL. Opens the way to the Birthplace.',
    unlocks: ['void-heart'], save: { allOf: ['gotQueenFragment', 'gotKingFragment'] } });
  // Grimm Troupe charms (completion counted in Grimm Troupe 6%)
  charm('dreamshield', 38, 'Dreamshield', 3, 'resting-grounds', { stage: 's-rest', loc: 'Resting Grounds, south of the Seer.', how: 'Explore below the Seer.', fn: 'Floating shield.' });
  charm('sprintmaster', 37, 'Sprintmaster', 1, 'dirtmouth', { cost: { geo: 400 }, req: ['shopkeepers-key'], loc: 'Sly (Dirtmouth).', how: "Buy for 400 Geo — requires the Shopkeeper's Key.", fn: 'Faster running.' });
  charm('weaversong', 39, 'Weaversong', 2, 'deepnest', { loc: "Weavers' Den (Deepnest).", how: "Reach the Weavers' Den.", fn: 'Summons weaverlings.' });
  // Mutually exclusive slot charms (completion via rule item below)
  charm('grimmchild', 40, 'Grimmchild', 2, 'dirtmouth', { completion: 0, tags: ['grimm'], stage: 's-grimm', goal: true, prio: 9, req: ['nightmare-lantern'], loc: 'Grimm (Dirtmouth tent).', how: 'Light the Nightmare Lantern, then talk to Grimm in his tent.', fn: 'Required for collecting Grimmkin flames.', save: { custom: 'grimmchild' } });
  charm('carefree-melody', 40, 'Carefree Melody', 3, 'dirtmouth', { completion: 0, tags: ['grimm'], stage: 's-grimm', req: ['banishment'], loc: 'Nymm (Dirtmouth) — after Banishment.', how: 'Banish the Troupe with Brumm, then talk to Nymm.', fn: 'Chance to block damage.', excludes: ['grimmchild-ritual'], save: { custom: 'carefree' } });
  // Fragile → Unbreakable (optional upgrades, Divine)
  function unbreak(id, name, base, geo, pdKey) {
    I(id, name, 'charm', 'dirtmouth', 0, { tags: ['charm', 'optional', 'grimm'], optional: true, stage: 's-grimm', req: [base], cost: { geo: geo },
      loc: 'Divine (Grimm Troupe tent, Dirtmouth).', how: 'Give the Fragile version to Divine and pay ' + geo + ' Geo. WARNING: while Divine holds the charm it does NOT count for completion.',
      wiki: W(name.replace('Unbreakable', 'Fragile').replace(/ /g, '_')), save: { pd: pdKey } });
  }
  unbreak('unbreakable-heart', 'Unbreakable Heart', 'fragile-heart', 12000, 'fragileHealth_unbreakable');
  unbreak('unbreakable-greed', 'Unbreakable Greed', 'fragile-greed', 9000, 'fragileGreed_unbreakable');
  unbreak('unbreakable-strength', 'Unbreakable Strength', 'fragile-strength', 15000, 'fragileStrength_unbreakable');

  I('white-fragment-queen', 'White Fragment (White Lady)', 'item', 'queens-gardens', 0, { tags: ['progression', 'charm'], stage: 's-kingsoul', goal: true, prio: 9, req: ['traitor-lord'],
    loc: "Queen's Gardens — White Lady, west of the greenhouse.", how: 'Defeat the Traitor Lord (Shade Cloak needed for his arena), then visit the White Lady.', wiki: W('Kingsoul'), save: { pd: 'gotQueenFragment' } });
  I('white-fragment-king', 'White Fragment (Pale King)', 'item', 'white-palace', 0, { tags: ['progression', 'charm'], stage: 's-kingsoul', goal: true, prio: 9, req: ['awoken-dream-nail'],
    loc: 'End of the White Palace (Pale King).', how: 'Enter the White Palace by Dream Nailing the Kingsmould corpse in the Palace Grounds with the Awoken Dream Nail, then finish the palace.', wiki: W('White_Palace'), save: { pd: 'gotKingFragment' } });
  I('void-heart', 'Void Heart', 'charm', 'the-abyss', 0, { tags: ['progression', 'charm'], stage: 's-kingsoul', goal: true, prio: 1, req: ['kingsoul'], voidHeart: true,
    loc: 'Birthplace (The Abyss) — requires Kingsoul equipped.',
    how: 'Equip Kingsoul, go to the bottom of the Abyss and open the Birthplace. ⚠ Replaces Kingsoul permanently and changes the ending of the Hollow Knight fight.',
    fn: 'Unlocks Sealed Siblings / Dream No More; required for the Pantheon of Hallownest.', wiki: W('Void_Heart'), save: { pd: 'gotShadeCharm' } });

  /* ---------- CHARM NOTCHES (8) ---------- */
  function notch(id, name, region, o) { o.tags = ['charm']; o.stage = o.stage || 's-cleanup'; o.wiki = W('Charms#Notches'); I(id, name, 'notch', region, 0, o); }
  notch('notch-salubra-1', 'Charm Notch — Salubra #1', 'forgotten-crossroads', { cost: { geo: 120 }, soft: { charms: 5 }, loc: 'Salubra (Forgotten Crossroads).', how: '120 Geo, requires 5 Charms.', save: { pd: 'salubraNotch1' } });
  notch('notch-salubra-2', 'Charm Notch — Salubra #2', 'forgotten-crossroads', { cost: { geo: 500 }, soft: { charms: 10 }, req: ['notch-salubra-1'], loc: 'Salubra.', how: '500 Geo, requires 10 Charms.', save: { pd: 'salubraNotch2' } });
  notch('notch-salubra-3', 'Charm Notch — Salubra #3', 'forgotten-crossroads', { cost: { geo: 900 }, soft: { charms: 18 }, req: ['notch-salubra-2'], loc: 'Salubra.', how: '900 Geo, requires 18 Charms.', save: { pd: 'salubraNotch3' } });
  notch('notch-salubra-4', 'Charm Notch — Salubra #4', 'forgotten-crossroads', { cost: { geo: 1400 }, soft: { charms: 25 }, req: ['notch-salubra-3'], loc: 'Salubra.', how: '1400 Geo, requires 25 Charms.', save: { pd: 'salubraNotch4' } });
  notch('notch-fog-canyon', 'Charm Notch — Fog Canyon', 'fog-canyon', { any: ['ismas-tear', 'monarch-wings'], loc: 'North-east of Cornifer in Fog Canyon, hidden area (explosive eggs room).', how: "Requires Isma's Tear or Monarch Wings.", save: { pd: 'notchFogCanyon' } });
  notch('notch-shrumal', 'Charm Notch — Shrumal Ogres', 'fungal-wastes', { loc: 'Fungal Wastes.', how: 'Defeat the 2 Shrumal Ogres.', save: { pd: 'notchShroomOgres' } });
  notch('notch-colosseum', 'Charm Notch — Trial of the Warrior', 'kingdoms-edge', { stage: 's-colo', req: ['trial-warrior'], loc: 'Colosseum of Fools.', how: 'First clear of the Trial of the Warrior.', save: { pd: 'colosseumBronzeCompleted' } });
  notch('notch-grimm', 'Charm Notch — Grimm', 'dirtmouth', { stage: 's-grimm', req: ['troupe-master-grimm'], loc: "Grimm's tent (Dirtmouth).", how: 'Defeat Troupe Master Grimm.', save: { pd: 'gotGrimmNotch' } });

  /* ---------- BOSSES (14%) ---------- */
  function boss(id, name, region, o) { o.tags = (o.tags || []).concat(['boss']); I(id, name, 'boss', region, o.completion === undefined ? 1 : o.completion, o); }
  boss('gruz-mother', 'Gruz Mother', 'forgotten-crossroads', { stage: 's-cleanup', loc: 'Forgotten Crossroads, lower right area.', how: 'Early boss.', reward: 'Geo', tip: 'Stay under her and punish after slams.', wiki: W('Gruz_Mother'), save: { scene: ['Battle Scene', 'Crossroads_04'] } });
  boss('false-knight', 'False Knight', 'forgotten-crossroads', { stage: 's-start', goal: true, prio: 9, loc: 'Forgotten Crossroads, middle area.', reward: 'City Crest', tip: 'Hit the head when he is stunned.', wiki: W('False_Knight'), save: { pd: 'falseKnightDefeated' } });
  boss('hornet-protector', 'Hornet Protector', 'greenpath', { stage: 's-start', goal: true, prio: 9, loc: 'Greenpath, above the Stag Station.', reward: 'Mothwing Cloak', tip: 'Watch for her needle throw wind-up.', wiki: W('Hornet_Protector'), save: { pd: 'hornet1Defeated' } });
  boss('brooding-mawlek', 'Brooding Mawlek', 'forgotten-crossroads', { stage: 's-cleanup', req: ['mantis-claw'], loc: 'Far west of the Forgotten Crossroads (use Mantis Claw).', reward: 'Mask Shard', tip: 'Stay close and attack after its leap.', wiki: W('Brooding_Mawlek'), save: { scene: ['Battle Scene', 'Crossroads_09'] } });
  boss('mantis-lords', 'Mantis Lords', 'fungal-wastes', { stage: 's-cleanup', req: ['mantis-claw'], loc: 'Mantis Village throne room (pull the floor lever right of the Mantis Claw).', reward: 'Mark of Pride, access to Deepnest', tip: 'Learn the 3 attacks before the 2-lord phase.', wiki: W('Mantis_Lords'), save: { pd: 'defeatedMantisLords' } });
  boss('soul-master', 'Soul Master', 'city-of-tears', { stage: 's-city', goal: true, prio: 10, loc: 'Soul Sanctum (City of Tears).', reward: 'Desolate Dive', tip: 'Dive attack: move away from the shockwave.', wiki: W('Soul_Master'), save: { pd: 'mageLordDefeated' } });
  boss('dung-defender', 'Dung Defender', 'royal-waterways', { stage: 's-water', goal: true, prio: 10, loc: 'Royal Waterways, right area.', reward: "Defender's Crest, path to Isma's Tear", tip: 'Jump over the rolling dung balls.', wiki: W('Dung_Defender'), save: { pd: 'defeatedDungDefender' } });
  boss('broken-vessel', 'Broken Vessel', 'ancient-basin', { stage: 's-basin', goal: true, prio: 10, req: ['crystal-heart'], loc: 'Ancient Basin, lower left (Crystal Heart needed).', reward: 'Monarch Wings', tip: 'Avoid the infection blobs after it falls.', wiki: W('Broken_Vessel'), save: { pd: 'killedInfectedKnight' } });
  boss('nosk', 'Nosk', 'deepnest', { stage: 's-cleanup', req: ['crystal-heart'], loc: 'Deepnest, left of the Hot Spring (Crystal Heart).', reward: 'Pale Ore', tip: 'Stay away from its charging legs.', wiki: W('Nosk'), save: { pd: 'killedMimicSpider' } });
  boss('the-collector', 'The Collector', 'city-of-tears', { stage: 's-cleanup', req: ['love-key'], loc: 'Tower of Love (City of Tears).', reward: "Collector's Map + 3 Grubs", tip: 'Kill summoned jars fast.', wiki: W('The_Collector'), save: { pd: 'collectorDefeated' } });
  boss('uumuu', 'Uumuu', 'fog-canyon', { stage: 's-dreamers', goal: true, prio: 8, req: ['ismas-tear'], loc: "Teacher's Archives (Fog Canyon).", reward: 'Access to Monomon', tip: 'Quirrel helps break its shell.', wiki: W('Uumuu'), save: { pd: 'defeatedMegaJelly' } });
  boss('hornet-sentinel', 'Hornet Sentinel', 'kingdoms-edge', { stage: 's-edge', goal: true, prio: 9, req: ['monarch-wings'], loc: "Kingdom's Edge (Monarch Wings required).", reward: "King's Brand", tip: 'Burn the spike traps she leaves with spells.', wiki: W('Hornet_Sentinel'), save: { pd: 'hornetOutskirtsDefeated' } });
  boss('traitor-lord', 'Traitor Lord', 'queens-gardens', { stage: 's-kingsoul', goal: true, prio: 10, req: ['shade-cloak'], loc: "Queen's Gardens greenhouse (Shade Cloak needed for the arena).", reward: 'White Lady access', tip: 'Cloth helps if you met her in the Basin.', wiki: W('Traitor_Lord'), save: { pd: 'killedTraitorLord' } });
  boss('watcher-knights', 'Watcher Knights', 'city-of-tears', { stage: 's-dreamers', goal: true, prio: 9, loc: "Watcher's Spire (City of Tears).", reward: 'Access to Lurien', tip: 'Fight near a wall, keep 2 knights in view.', wiki: W('Watcher_Knight'), save: { pd: 'killedBlackKnight' } });
  boss('hive-knight', 'Hive Knight', 'the-hive', { stage: 's-cleanup', tags: ['lifeblood'], loc: 'The Hive.', reward: 'Hiveblood', tip: 'Jump the bee waves.', wiki: W('Hive_Knight'), save: { pd: 'killedHiveKnight' } });
  // optional bosses
  boss('massive-moss-charger', 'Massive Moss Charger', 'greenpath', { completion: 0, optional: true, tags: ['optional'], stage: 's-cleanup', loc: 'Greenpath, near Fog Canyon.', reward: 'Geo; Pantheon of the Master lock', tip: 'Hit it while it emerges.', wiki: W('Massive_Moss_Charger'), save: { pd: 'killedMegaMossCharger' } });
  boss('vengefly-king', 'Vengefly King', 'greenpath', { completion: 0, optional: true, tags: ['optional'], stage: 's-cleanup', loc: 'Greenpath (and Trial of the Warrior).', reward: 'Free Zote (Greenpath)', tip: 'Stay mobile; kill the summoned flies.', wiki: W('Vengefly_King'), save: { pd: 'killedBigBuzzer' } });
  boss('flukemarm', 'Flukemarm', 'royal-waterways', { completion: 0, optional: true, tags: ['optional'], stage: 's-water', req: ['desolate-dive'], loc: 'Royal Waterways (Desolate Dive).', reward: 'Flukenest', wiki: W('Flukemarm'), save: { pd: 'killedFlukeMother' } });
  boss('crystal-guardian', 'Crystal Guardian', 'crystal-peak', { completion: 0, optional: true, tags: ['optional'], stage: 's-peak', loc: 'Crystal Peak — guards the central bench.', reward: 'Bench; Pantheon of the Artist lock', wiki: W('Crystal_Guardian'), save: { scene: ['Mega Zombie Beam Miner (1)', 'Mines_18'] } });
  boss('enraged-guardian', 'Enraged Guardian', 'crystal-peak', { completion: 0, optional: true, tags: ['optional'], stage: 's-cleanup', req: ['monarch-wings'], loc: 'Crystal Peak (Monarch Wings).', reward: 'Mask Shard', wiki: W('Enraged_Guardian'), save: { scene: ['Zombie Beam Miner Rematch', 'Mines_32'] } });
  boss('soul-warrior', 'Soul Warrior', 'city-of-tears', { completion: 0, optional: true, tags: ['optional'], stage: 's-city', loc: 'Soul Sanctum.', reward: 'Geo; Pantheon of the Master lock', wiki: W('Soul_Warrior'), save: { scene: ['Battle Scene v2', 'Ruins1_23'] } });
  boss('pale-lurker', 'Pale Lurker', 'kingdoms-edge', { completion: 0, optional: true, tags: ['optional'], stage: 's-colo', loc: "Pale Lurker's Retreat (behind the Colosseum).", reward: 'Simple Key', wiki: W('Pale_Lurker'), save: { pd: 'gotLurkerKey' } });
  boss('oblobbles', 'Oblobbles', 'kingdoms-edge', { completion: 0, optional: true, tags: ['optional'], stage: 's-colo', loc: 'Trial of the Conqueror.', reward: 'Pantheon of the Artist lock', wiki: W('Oblobbles'), save: { pd: 'killedOblobble' } });
  boss('god-tamer', 'God Tamer', 'kingdoms-edge', { completion: 0, optional: true, tags: ['optional'], stage: 's-colo', loc: 'Trial of the Fool.', reward: '—', wiki: W('God_Tamer'), save: { pd: 'killedLobsterLancer' } });

  /* ---------- WARRIOR DREAMS (7%) ---------- */
  function wd(id, name, region, ess, o) { o.tags = ['boss', 'dream']; o.req = ['dream-nail'].concat(o.req || []); o.essence = ess; o.stage = o.stage || 's-cleanup'; o.reward = ess + ' Essence'; o.wiki = W(name.replace(/ /g, '_')); I(id, name, 'warrior', region, 1, o); }
  wd('gorb', 'Gorb', 'howling-cliffs', 100, { loc: 'Howling Cliffs, top middle area.', how: 'Dream Nail his grave.', tip: 'Keep moving between spike volleys.', save: { pdGte: ['aladarSlugDefeated', 2] } });
  wd('xero', 'Xero', 'resting-grounds', 100, { stage: 's-rest', goal: false, loc: 'Resting Grounds, below the drop from Crystal Peak.', how: 'Dream Nail the grave.', tip: 'Swords are launched in pairs.', save: { pdGte: ['xeroDefeated', 2] } });
  wd('marmu', 'Marmu', 'queens-gardens', 150, { loc: "Queen's Gardens, left of the Stag Station.", how: 'Dream Nail her body.', tip: 'Hit her to bounce her away.', save: { pdGte: ['mumCaterpillarDefeated', 2] } });
  wd('elder-hu', 'Elder Hu', 'fungal-wastes', 100, { loc: 'Fungal Wastes, above the acid bridge.', how: 'Dream Nail him.', tip: 'Rings fall in patterns — find the gaps.', save: { pdGte: ['elderHuDefeated', 2] } });
  wd('galien', 'Galien', 'deepnest', 200, { loc: 'Deepnest, below the Failed Tramway.', how: 'Dream Nail him.', tip: 'Focus on him, dodge the scythes.', save: { pdGte: ['galienDefeated', 2] } });
  wd('no-eyes', 'No Eyes', 'greenpath', 200, { loc: 'Stone Sanctuary (Greenpath) — Lumafly Lantern recommended.', how: 'Dream Nail her.', tip: 'Ghosts home in — circle around.', save: { pdGte: ['noEyesDefeated', 2] } });
  wd('markoth', 'Markoth', 'kingdoms-edge', 250, { req: ['shade-cloak'], loc: "Kingdom's Edge (Shade Cloak).", how: 'Dream Nail his corpse.', tip: 'Shade dash through the shield.', save: { pdGte: ['markothDefeated', 2] } });

  /* ---------- DREAM BOSSES (optional, Essence) ---------- */
  function db(id, name, region, ess, o) { o.tags = ['boss', 'dream', 'optional']; o.optional = true; o.req = ['dream-nail'].concat(o.req || []); o.essence = ess; o.reward = ess + ' Essence'; o.stage = o.stage || 's-cleanup'; o.wiki = W(name.replace(/ /g, '_')); I(id, name, 'dreamboss', region, 0, o); }
  db('failed-champion', 'Failed Champion', 'forgotten-crossroads', 300, { req: ['false-knight'], loc: "False Knight's arena (Forgotten Crossroads).", how: "Dream Nail the False Knight's corpse.", save: { pd: 'falseKnightDreamDefeated' } });
  db('soul-tyrant', 'Soul Tyrant', 'city-of-tears', 300, { req: ['soul-master'], loc: 'Soul Sanctum (City of Tears).', how: "Dream Nail Soul Master's corpse.", save: { pd: 'mageLordDreamDefeated' } });
  db('lost-kin', 'Lost Kin', 'ancient-basin', 400, { req: ['broken-vessel'], loc: "Broken Vessel's arena (Ancient Basin).", how: "Dream Nail Broken Vessel's corpse.", save: { pd: 'infectedKnightDreamDefeated' } });
  db('white-defender', 'White Defender', 'royal-waterways', 300, { req: ['dung-defender', 'herrah', 'lurien', 'monomon'], loc: "Hidden room below the far right of the Dung Defender's arena.", how: 'After all 3 Dreamers: drop through the floor under the floating platform and Dream Nail the sleeping Dung Defender.', save: { pd: 'whiteDefenderDefeated' } });
  db('grey-prince-zote', 'Grey Prince Zote', 'dirtmouth', 300, { req: ['bretta-rescued', 'monarch-wings'], loc: "Bretta's basement (Dirtmouth).", how: 'Rescue Bretta and Zote, defeat Zote in the Colosseum, open the basement (Monarch Wings) and Dream Nail the statue.', save: { pd: 'greyPrinceDefeated' } });

  /* ---------- WHISPERING ROOTS (15 = 482 Essence) ---------- */
  function rootI(n, region, ess, loc, scene) { I('root-' + n, 'Whispering Root — ' + loc, 'root', region, 0, { tags: ['dream', 'optional'], optional: true, essence: ess, req: ['dream-nail'], stage: 's-cleanup', reward: ess + ' Essence', loc: loc, how: 'Strike it with the Dream Nail and collect all Essence orbs.', wiki: W('Whispering_Root'), save: { scene: ['Dream Plant', scene] } }); }
  rootI(1, 'forgotten-crossroads', 29, "Forgotten Crossroads: main area", 'Crossroads_07');
  rootI(2, 'forgotten-crossroads', 42, "Ancestral Mound", 'Crossroads_ShamanTemple');
  rootI(3, 'fungal-wastes', 18, "Fungal Wastes: near Mantis Village", 'Fungus2_17');
  rootI(4, 'city-of-tears', 28, "City of Tears: near the City Storerooms", 'Ruins1_17');
  rootI(5, 'howling-cliffs', 46, "Howling Cliffs", 'Cliffs_01');
  rootI(6, 'crystal-peak', 21, "Crystal Peak", 'Mines_23');
  rootI(7, 'resting-grounds', 20, "Resting Grounds: just outside the Seer's home", 'RestingGrounds_05');
  rootI(8, 'resting-grounds', 34, "Spirits' Glade (Seer 200)", 'RestingGrounds_08');
  rootI(9, 'royal-waterways', 35, "Royal Waterways: broken lift", 'Abyss_01');
  rootI(10, 'greenpath', 44, "Greenpath", 'Fungus1_13');
  rootI(11, 'fungal-wastes', 20, "Fungal Wastes: near Fog Canyon", 'Fungus2_33');
  rootI(12, 'queens-gardens', 29, "Queen's Gardens", 'Fungus3_11');
  rootI(13, 'kingdoms-edge', 51, "Kingdom's Edge", 'Deepnest_East_07');
  rootI(14, 'deepnest', 45, "Deepnest", 'Deepnest_39');
  rootI(15, 'the-hive', 20, "The Hive", 'Hive_02');

  /* ---------- DREAMERS (3%) ---------- */
  function dreamer(id, name, region, o) { o.tags = ['progression', 'dream']; o.stage = 's-dreamers'; o.goal = true; o.prio = o.prio || 8; I(id, name, 'dreamer', region, 1, o); }
  dreamer('lurien', 'Lurien the Watcher', 'city-of-tears', { req: ['dream-nail', 'watcher-knights'], loc: "Top of the Watcher's Spire (City of Tears).", how: 'Defeat the Watcher Knights, ride the lift up and Dream Nail Lurien.', wiki: W('Lurien_the_Watcher'), save: { pd: 'lurienDefeated' } });
  dreamer('monomon', 'Monomon the Teacher', 'fog-canyon', { req: ['dream-nail', 'uumuu'], loc: "Teacher's Archives (Fog Canyon).", how: 'Defeat Uumuu and Dream Nail Monomon.', wiki: W('Monomon_the_Teacher'), save: { pd: 'monomonDefeated' } });
  dreamer('herrah', 'Herrah the Beast', 'deepnest', { req: ['dream-nail'], loc: "Beast's Den, Distant Village (Deepnest).", how: 'Reach the top of the Beast\'s Den and Dream Nail Herrah.', wiki: W('Herrah_the_Beast'), save: { pd: 'hegemolDefeated' } });

  /* ---------- ENDINGS ---------- */
  I('black-egg', 'Black Egg Temple opened', 'derived', 'forgotten-crossroads', 0, { tags: ['progression'], derived: true, rule: { allOf: ['lurien', 'monomon', 'herrah'] }, stage: 's-thk',
    loc: 'Black Egg Temple (Forgotten Crossroads).', how: 'Opens automatically after the 3 Dreamers.', wiki: W('Black_Egg_Temple') });
  I('ending-thk', 'ENDING: The Hollow Knight', 'ending', 'forgotten-crossroads', 0, { tags: ['progression'], stage: 's-thk', goal: true, prio: 10, req: ['lurien', 'monomon', 'herrah'],
    loc: 'Black Egg Temple.', how: 'Defeat the Hollow Knight WITHOUT the Void Heart. After the credits the save returns to before the fight.',
    fn: 'Preserves the first ending. Only after this is the Void Heart safe.', wiki: W('Endings_(Hollow_Knight)'), save: { custom: 'thk' } });
  I('ending-sealed-siblings', 'ENDING: Sealed Siblings', 'ending', 'forgotten-crossroads', 0, { tags: ['progression'], stage: 's-endings', goal: true, prio: 7, req: ['void-heart'],
    loc: 'Black Egg Temple.', how: 'Defeat the Hollow Knight with the Void Heart (do not Dream Nail it at the end).', wiki: W('Endings_(Hollow_Knight)') });
  I('ending-dream-no-more', 'ENDING: Dream No More', 'ending', 'forgotten-crossroads', 0, { tags: ['progression', 'dream'], stage: 's-endings', goal: true, prio: 8, req: ['void-heart', 'awoken-dream-nail'],
    loc: 'Black Egg Temple.', how: 'With the Void Heart, Dream Nail the Hollow Knight when Hornet restrains it and defeat the Radiance.', wiki: W('The_Radiance'), save: { pd: 'killedFinalBoss' } });
  I('ending-embrace-void', 'GODHOME ENDING: Embrace the Void', 'ending', 'godhome', 0, { tags: ['optional'], beyond: true, optional: true, stage: 's-beyond', req: ['pantheon-hallownest'],
    loc: 'Pantheon of Hallownest.', how: 'Complete the Pantheon of Hallownest.', wiki: W('Endings_(Hollow_Knight)') });
  I('ending-delicate-flower', 'GODHOME ENDING: Delicate Flower', 'ending', 'godhome', 0, { tags: ['optional'], beyond: true, optional: true, stage: 's-beyond', req: ['pantheon-hallownest', 'delicate-flower'],
    loc: 'Pantheon of Hallownest.', how: 'Give a Delicate Flower to the Godseeker (possible after at least 2 Pantheons), then complete the Pantheon of Hallownest.', wiki: W('Endings_(Hollow_Knight)') });

  /* ---------- GRIMM TROUPE (6%) ---------- */
  I('nightmare-lantern', 'Light the Nightmare Lantern', 'grimm', 'howling-cliffs', 0, { tags: ['grimm', 'progression'], stage: 's-grimm', goal: true, prio: 10, req: ['dream-nail'],
    loc: 'Howling Cliffs — through two breakable walls, then a hidden gap to the corpse of a large bug.', how: 'Dream Nail the corpse, return to the previous room and strike the brazier until the cutscene plays.', wiki: W('Grimm_Troupe_(Quest)'), save: { pd: 'nightmareLanternLit' } });
  function flame(id, name, region, tier, o) { o.tags = ['grimm']; o.stage = 's-grimm'; o.req = (tier === 1 ? ['grimmchild'] : tier === 2 ? ['grimmchild', 'flames-novice-done'] : ['grimmchild', 'troupe-master-grimm']).concat(o.req || []); o.flameTier = tier; o.wiki = W(tier === 1 ? 'Grimmkin_Novice' : tier === 2 ? 'Grimmkin_Master' : 'Grimmkin_Nightmare'); o.how = o.how || 'Equip Grimmchild, approach the torch and defeat the Grimmkin.'; o.save = { custom: 'flame' + tier }; I(id, name, 'grimm', region, 0, o); }
  flame('flame-novice-greenpath', 'Grimmkin Novice — Greenpath', 'greenpath', 1, { loc: 'Greenpath (map marks uncollected flames).' });
  flame('flame-novice-peak', 'Grimmkin Novice — Crystal Peak', 'crystal-peak', 1, { loc: 'Crystal Peak.' });
  flame('flame-novice-city', 'Grimmkin Novice — City of Tears', 'city-of-tears', 1, { loc: 'City of Tears.' });
  I('flames-novice-done', 'Return 3 flames to Grimm (Grimmchild lv2)', 'derived', 'dirtmouth', 0, { tags: ['grimm'], derived: true, rule: { allOf: ['flame-novice-greenpath', 'flame-novice-peak', 'flame-novice-city'] }, stage: 's-grimm', loc: "Grimm's tent.", how: 'Automatic once the 3 Novice flames are checked.' });
  flame('flame-master-kings-pass', "Grimmkin Master — King's Pass", 'dirtmouth', 2, { loc: "King's Pass." });
  flame('flame-master-resting', 'Grimmkin Master — Resting Grounds', 'resting-grounds', 2, { loc: 'Resting Grounds.' });
  flame('flame-master-edge', "Grimmkin Master — Kingdom's Edge", 'kingdoms-edge', 2, { loc: "Kingdom's Edge." });
  boss('troupe-master-grimm', 'Troupe Master Grimm', 'dirtmouth', { tags: ['grimm'], stage: 's-grimm', goal: true, prio: 9, req: ['flame-master-kings-pass', 'flame-master-resting', 'flame-master-edge'],
    loc: "Grimm's tent (Dirtmouth).", how: 'Return the 6 flames and accept the fight.', reward: 'Charm Notch, Grimmchild lv3', tip: 'Learn the dash/uppercut tells.', wiki: W('Troupe_Master_Grimm'), save: { pd: 'killedGrimm' } });
  flame('flame-nightmare-core', 'Grimmkin Nightmare — Fungal Core', 'fungal-wastes', 3, { loc: 'Fungal Core.' });
  flame('flame-nightmare-waterways', 'Grimmkin Nightmare — Waterways/Basin edge', 'royal-waterways', 3, { loc: 'Royal Waterways, at the edge of the Ancient Basin.' });
  flame('flame-nightmare-hive', 'Grimmkin Nightmare — The Hive', 'the-hive', 3, { loc: 'The Hive.' });
  I('brumm', 'Brumm (4th flame / Banishment option)', 'npc', 'deepnest', 0, { tags: ['grimm', 'optional'], optional: true, stage: 's-grimm', req: ['troupe-master-grimm'],
    loc: 'Deepnest (Distant Village area).', how: 'Brumm carries one of the 4 Nightmare-phase flames. Listening to him offers Banishment at the Nightmare Lantern.', wiki: W('Brumm') });
  boss('nightmare-king-grimm', 'Nightmare King Grimm', 'dirtmouth', { completion: 0, tags: ['grimm', 'dream'], stage: 's-grimm', goal: true, prio: 8, req: ['flame-nightmare-core', 'flame-nightmare-waterways', 'flame-nightmare-hive'], excludes: ['banishment'],
    loc: "Grimm's tent — Dream Nail the sleeping Grimm.", how: 'With 3 Nightmare flames, Dream Nail Grimm. Completes the Ritual (Grimmchild lv4). Mutually exclusive with Banishment.', reward: 'Grimmchild lv4, Ritual achievement', tip: 'Hardest optional boss — learn each attack.', wiki: W('Nightmare_King_Grimm'), save: { custom: 'nkg' } });
  I('banishment', 'Banishment (with Brumm)', 'grimm', 'howling-cliffs', 0, { tags: ['grimm', 'optional'], stage: 's-grimm', req: ['brumm'], excludes: ['nightmare-king-grimm'],
    loc: 'Nightmare Lantern (Howling Cliffs).', how: 'Meet Brumm at the Lantern and destroy it. Removes Grimmchild; Nymm gives Carefree Melody. ⚠ Any Fragile charm you have not made Unbreakable stays fragile forever. Mutually exclusive with Nightmare King Grimm.',
    wiki: W('Grimm_Troupe_(Quest)'), save: { custom: 'banish' } });
  // Rule items that carry the official Grimm %
  I('grimmchild-slot', 'Charm slot 40 — Grimmchild or Carefree Melody', 'derived', 'dirtmouth', 1, { tags: ['grimm', 'charm'], derived: true, rule: { anyOf: ['grimmchild', 'carefree-melody'] }, stage: 's-grimm',
    loc: 'Dirtmouth.', how: 'Counts 1% if you own Grimmchild or Carefree Melody (same slot).', wiki: W('Completion_(Hollow_Knight)') });
  I('grimmchild-ritual', 'Nightmare King Grimm or Banishment', 'derived', 'dirtmouth', 1, { tags: ['grimm'], derived: true, rule: { anyOf: ['nightmare-king-grimm', 'banishment'] }, stage: 's-grimm',
    loc: 'Dirtmouth / Howling Cliffs.', how: 'Counts 1% for either ending of the Grimm Troupe quest.', wiki: W('Completion_(Hollow_Knight)') });

  /* ---------- COLOSSEUM (3%) ---------- */
  function trial(id, name, fee, reward, o) { o.tags = ['boss']; o.stage = 's-colo'; o.goal = true; o.cost = { geo: fee }; o.reward = reward; o.wiki = W(name.replace(/ /g, '_')); o.loc = 'Colosseum of Fools (top of the western chasm of Kingdom\'s Edge).'; I(id, name, 'colosseum', 'kingdoms-edge', 1, o); }
  trial('trial-warrior', 'Trial of the Warrior', 100, 'Charm Notch + 1000–1024 Geo', { prio: 9, how: 'Pay Little Fool 100 Geo once; repeat runs are free and give 1000–1024 Geo.', tip: 'Includes Zote if you rescued him in Deepnest.', save: { pd: 'colosseumBronzeCompleted' } });
  trial('trial-conqueror', 'Trial of the Conqueror', 450, 'Pale Ore + 2000–2020 Geo', { prio: 8, req: ['trial-warrior'], how: 'Pay 450 Geo; requires the Trial of the Warrior. Lots of wall/air combat.', tip: 'Monarch Wings + Mantis Claw essential.', save: { pd: 'colosseumSilverCompleted' } });
  trial('trial-fool', 'Trial of the Fool', 800, '3000–3020 Geo', { prio: 7, req: ['trial-conqueror'], how: 'Pay 800 Geo; requires the Conqueror.', tip: 'Spells + Quick Focus/Grubsong builds help.', save: { pd: 'colosseumGoldCompleted' } });

  /* ---------- GODHOME (5%) ---------- */
  I('godtuner', 'Godtuner', 'godhome', 'godhome', 1, { tags: ['progression'], stage: 's-godhome', goal: true, prio: 9, req: ['use-key-godseeker', 'dream-nail'],
    loc: 'Godhome (received from the Godseeker).', how: 'Unlock the Godseeker cocoon in the Junk Pit with a Simple Key and Dream Nail her.', fn: 'Hall of Gods / Pantheons.', wiki: W('Godtuner'), save: { pd: 'hasGodfinder' } });
  function pan(id, name, o) { o.tags = (o.tags || []).concat(['boss']); o.stage = o.beyond ? 's-beyond' : 's-godhome'; o.goal = !o.beyond; o.req = ['godtuner'].concat(o.req || []); o.wiki = W(name.replace(/ /g, '_')); I(id, name, 'godhome', 'godhome', o.completion === undefined ? 1 : o.completion, o); }
  pan('pantheon-master', 'Pantheon of the Master', { prio: 9, loc: 'Godhome.', how: 'Unlocked when its bosses were defeated in the world (Vengefly King, Gruz Mother, False Knight, Massive Moss Charger, Hornet Protector, Gorb, Dung Defender, Soul Warrior, Brooding Mawlek…). Final: Brothers Oro & Mato.', save: { door: 'bossDoorStateTier1' } });
  pan('pantheon-artist', 'Pantheon of the Artist', { prio: 8, loc: 'Godhome.', how: 'Early–mid game bosses (Xero, Crystal Guardian, Soul Master, Oblobbles, Mantis Lords, Marmu, Nosk, Flukemarm, Broken Vessel…). Final: Paintmaster Sheo.', save: { door: 'bossDoorStateTier2' } });
  pan('pantheon-sage', 'Pantheon of the Sage', { prio: 7, loc: 'Godhome.', how: 'Mid–late bosses (Hive Knight, Elder Hu, The Collector, God Tamer, Troupe Master Grimm, Galien, Grey Prince Zote*, Uumuu, Hornet Sentinel…). Final: Great Nailsage Sly. *GPZ is skipped if Zote died.', save: { door: 'bossDoorStateTier3' } });
  pan('pantheon-knight', 'Pantheon of the Knight', { prio: 6, req: ['pantheon-master', 'pantheon-artist', 'pantheon-sage'], loc: 'Godhome.', how: 'Requires the first three Pantheons. Late bosses incl. Enraged Guardian, Traitor Lord, Watcher Knights, Markoth, No Eyes. Final: Pure Vessel.', save: { door: 'bossDoorStateTier4' } });
  pan('pantheon-hallownest', 'Pantheon of Hallownest', { completion: 0, beyond: true, optional: true, tags: ['optional'], req: ['pantheon-knight', 'void-heart'], loc: 'Godhome.', how: 'Requires Pantheons 1–4 and the Void Heart. All bosses + Absolute Radiance. NOT required for 112%.', save: { door: 'bossDoorStateTier5' } });
  I('absolute-radiance', 'Absolute Radiance', 'boss', 'godhome', 0, { tags: ['boss', 'optional'], beyond: true, optional: true, stage: 's-beyond', req: ['pantheon-hallownest'], loc: 'Peak of the Pantheon of Hallownest.', how: 'Final boss of the Pantheon of Hallownest (beyond 112%).', wiki: W('Absolute_Radiance') });

  /* ---------- MASK / VESSEL / RULE ITEMS (derived %) ---------- */
  var SHARD_IDS = ITEMS.filter(function (i) { return i.type === 'mask'; }).map(function (i) { return i.id; });
  var VESSEL_IDS = ITEMS.filter(function (i) { return i.type === 'vessel'; }).map(function (i) { return i.id; });
  [1, 2, 3, 4].forEach(function (n) {
    I('mask-upgrade-' + n, 'Ancient Mask #' + n + ' (4 shards)', 'derived', 'dirtmouth', 1, { tags: ['mask'], derived: true, rule: { countOf: SHARD_IDS, atLeast: 4 * n }, stage: 's-cleanup', how: 'Automatically complete when ' + (4 * n) + ' Mask Shards are checked.', wiki: W('Mask_Shard_(Hollow_Knight)') });
  });
  [1, 2, 3].forEach(function (n) {
    I('vessel-upgrade-' + n, 'Soul Vessel #' + n + ' (3 fragments)', 'derived', 'dirtmouth', 1, { tags: ['vessel'], derived: true, rule: { countOf: VESSEL_IDS, atLeast: 3 * n }, stage: 's-cleanup', how: 'Automatically complete when ' + (3 * n) + ' Vessel Fragments are checked.', wiki: W('Vessel_Fragment') });
  });

  /* ---------- MISC QUEST / NPC ITEMS ---------- */
  I('bretta-rescued', 'Rescue Bretta', 'npc', 'fungal-wastes', 0, { tags: ['optional'], stage: 's-cleanup', loc: 'Fungal Wastes, near the Dashmaster statue.', how: 'Talk to her; she returns to Dirtmouth.', unlocks: ['mask-bretta', 'grey-prince-zote'], wiki: W('Bretta'), save: { pd: 'brettaRescued' } });
  I('delicate-flower', 'Delicate Flower quest', 'item', 'resting-grounds', 0, { tags: ['optional'], stage: 's-cleanup', loc: 'Grey Mourner (Resting Grounds).', how: "Accept the flower and deliver it to the Traitors' Child's grave in Queen's Gardens WITHOUT taking any damage (the flower breaks on hit).", unlocks: ['mask-grey-mourner'], wiki: W('Delicate_Flower_(Quest)'), save: { pd: 'xunRewardGiven' } });

  /* ------------------------------------------------------------------ */
  /* GEO FARMS (no glitches)                                             */
  /* ------------------------------------------------------------------ */
  var FARMS = [
    { phase: 'Any', name: 'Sell relics to Relic Seeker Lemm', where: 'City of Tears (Lemm\'s shop).', req: 'Relics found while exploring.', difficulty: 'None',
      ret: "Wanderer's Journal 200 · Hallownest Seal 450 · King's Idol 800 · Arcane Egg 1200 Geo (14 / 17 / 8 / 4 exist).", bench: 'City of Tears benches', wiki: W('Relic_Seeker_Lemm') },
    { phase: 'Early', name: 'Geo rocks & chests while exploring', where: 'Everywhere (one-time).', req: '—', difficulty: 'Low', ret: 'One-time; varies per rock/chest.', bench: '—', wiki: W('Geo') },
    { phase: 'Early', name: 'Forgotten Crossroads / Greenpath enemy loop', where: 'Rooms around a bench (enemies respawn when you rest/leave).', req: 'Gathering Swarm + Fragile Greed recommended.', difficulty: 'Low', ret: 'Low (small Geo per enemy).', bench: 'Any nearby bench', wiki: W('Fragile_Greed') },
    { phase: 'Mid', name: 'Soul Sanctum (Follies / Mistakes / Soul Twisters)', where: 'Soul Sanctum, City of Tears.', req: 'Access to the Sanctum.', difficulty: 'Medium', ret: 'Moderate.', bench: 'Soul Sanctum bench', wiki: W('Soul_Sanctum') },
    { phase: 'Mid', name: 'Crystal Peak husk miners', where: 'Crystal Peak rooms near the Dark Room bench.', req: 'Crystal Peak access.', difficulty: 'Medium', ret: 'Moderate.', bench: 'Crystal Peak benches', wiki: W('Crystal_Peak') },
    { phase: 'Mid–Late', name: 'Trial of the Warrior (repeat)', where: 'Colosseum of Fools.', req: '100 Geo once; Trial cleared once.', difficulty: 'Medium', ret: '1000–1024 Geo per clear (verified, wiki).', bench: "Colosseum warriors' pit bench", wiki: W('Colosseum_of_Fools') },
    { phase: 'Late', name: 'Trial of the Conqueror (repeat)', where: 'Colosseum of Fools.', req: '450 Geo once; Warrior cleared.', difficulty: 'High', ret: '2000–2020 Geo per clear (verified, wiki).', bench: "Colosseum warriors' pit bench", wiki: W('Colosseum_of_Fools') },
    { phase: 'Late', name: 'Trial of the Fool (repeat)', where: 'Colosseum of Fools.', req: '800 Geo once; Conqueror cleared.', difficulty: 'Very high', ret: '3000–3020 Geo per clear (verified, wiki).', bench: "Colosseum warriors' pit bench", wiki: W('Colosseum_of_Fools') }
  ];

  var SEER_MILESTONES = [
    { essence: 100, reward: 'Hallownest Seal', id: 'seer-seal' },
    { essence: 200, reward: "Spirits' Glade opens", id: 'seer-glade' },
    { essence: 300, reward: 'Pale Ore', id: 'ore-seer' },
    { essence: 500, reward: 'Dream Wielder', id: 'dream-wielder' },
    { essence: 700, reward: 'Vessel Fragment', id: 'vessel-seer' },
    { essence: 900, reward: 'Dreamgate', id: 'seer-dreamgate' },
    { essence: 1200, reward: 'Arcane Egg', id: 'seer-arcane-egg' },
    { essence: 1500, reward: 'Mask Shard', id: 'mask-seer' },
    { essence: 1800, reward: 'Awoken Dream Nail (+1%)', id: 'awoken-dream-nail' },
    { essence: 2400, reward: "Seer's final words (+1%)", id: 'seer-ascension' }
  ];

  /* Official category totals from the wiki — used by the audit. */
  var OFFICIAL_BREAKDOWN = {
    'Bosses': 14, 'Warrior Dreams': 7, 'Colosseum of Fools': 3, 'Charms (base)': 36, 'Equipment': 14,
    'Spells': 6, 'Nail Arts': 3, 'Mask Shards': 4, 'Vessel Fragments': 3, 'Nail Upgrades': 4,
    'Dream Nail and Essence': 3, 'Dreamers': 3, 'The Grimm Troupe': 6, 'Lifeblood': 1, 'Godmaster': 5
  };
  function auditCategory(item) {
    var g = ['dreamshield', 'sprintmaster', 'weaversong', 'troupe-master-grimm', 'grimmchild-slot', 'grimmchild-ritual'];
    if (g.indexOf(item.id) >= 0) return 'The Grimm Troupe';
    if (item.id === 'hive-knight') return 'Lifeblood';
    switch (item.type) {
      case 'boss': return 'Bosses';
      case 'warrior': return 'Warrior Dreams';
      case 'colosseum': return 'Colosseum of Fools';
      case 'charm': return 'Charms (base)';
      case 'ability': return 'Equipment';
      case 'spell': return 'Spells';
      case 'nailart': return 'Nail Arts';
      case 'nail': return 'Nail Upgrades';
      case 'dream': return 'Dream Nail and Essence';
      case 'dreamer': return 'Dreamers';
      case 'godhome': return 'Godmaster';
      case 'derived':
        if (/^mask-upgrade/.test(item.id)) return 'Mask Shards';
        if (/^vessel-upgrade/.test(item.id)) return 'Vessel Fragments';
        return 'Other';
      default: return 'Other';
    }
  }

  var DATA = {
    version: 1, REGIONS: REGIONS, STAGES: STAGES, ITEMS: ITEMS, FARMS: FARMS,
    SEER_MILESTONES: SEER_MILESTONES, OFFICIAL_BREAKDOWN: OFFICIAL_BREAKDOWN, auditCategory: auditCategory,
    TOTAL_ESSENCE_ONE_TIME: 3208, GRUBS_TOTAL: 46
  };
  root.HK = root.HK || {};
  root.HK.DATA = DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
