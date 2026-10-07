/*
 * Hollow Knight Companion — POINTS OF INTEREST (map layer)
 * ---------------------------------------------------------------
 * Benches, Stag Stations, vendors & services, NPCs, hot springs, trams, Cornifer,
 * Lifeblood Cocoons and landmarks — grouped by region.
 * Sources (checked Oct 2026): hollowknight.wiki — Bench (Hollow Knight), Save Data/Save Points,
 * Stag Station, Cornifer, Lifeblood Cocoon, Hot Spring, Tram, and each area page;
 * cross-checked with game-checklists.com (benches).
 *
 * Bosses, Whispering Roots, Dreamers and collectibles are NOT duplicated here: the map
 * builds those markers from HK.DATA.ITEMS so they share the same done/undone state.
 *
 * Positions on the companion map are SCHEMATIC: the region is correct, the exact spot is not
 * (the official map is not copied).
 */
(function (root) {
  'use strict';
  var W = function (p) { return 'https://hollowknight.wiki/w/' + p; };

  var TYPES = {
    bench:    { label: 'Benches',          one: 'Bench',            color: '#9fd2ff' },
    stag:     { label: 'Stag Stations',    one: 'Stag Station',     color: '#e7c97a' },
    vendor:   { label: 'Vendors & services', one: 'Vendor / service', color: '#ffb36b' },
    boss:     { label: 'Bosses',           one: 'Boss',             color: '#f08a8a' },
    root:     { label: 'Whispering Roots', one: 'Whispering Root',  color: '#d79bff' },
    npc:      { label: 'NPCs',             one: 'NPC',              color: '#c9d4e8' },
    spring:   { label: 'Hot Springs',      one: 'Hot Spring',       color: '#7fd6c5' },
    tram:     { label: 'Trams',            one: 'Tram station',     color: '#8fb6ff' },
    cornifer: { label: 'Cornifer (maps)',  one: 'Cornifer',         color: '#e6e1d3' },
    cocoon:   { label: 'Lifeblood Cocoons', one: 'Lifeblood Cocoon', color: '#6fc8ff' },
    landmark: { label: 'Landmarks & gates', one: 'Landmark',        color: '#b9c3d6' },
    item:     { label: 'Items left (checklist)', one: 'Item',       color: '#8fe0b4' }
  };

  var L = [];
  function P(region, type, name, note, opts) {
    opts = opts || {};
    L.push({ id: region + '|' + name, region: region, type: type, name: name, note: note || '',
      cost: opts.cost || 0, sub: opts.sub || '', item: opts.item || null, wiki: opts.wiki || null });
  }

  /* ----------------------------- Dirtmouth ----------------------------- */
  P('dirtmouth', 'bench', 'Dirtmouth Bench', 'In town.');
  P('dirtmouth', 'stag', 'Dirtmouth Station', 'Free — opens from the inside once any other Stag Station has been opened.', { wiki: W('Stag_Station') });
  P('dirtmouth', 'vendor', 'Iselda — map shop', 'Next to the Stag Station. Maps, Quill, pins and Wayward Compass. Opens after you buy a map from Cornifer or defeat the False Knight.', { sub: 'shop', wiki: W('Iselda') });
  P('dirtmouth', 'vendor', 'Sly — shop', 'Moves here after being rescued in the Forgotten Crossroads. Mask Shards, Vessel Fragments, charms, Lumafly Lantern, Simple Key.', { sub: 'shop', wiki: W('Sly') });
  P('dirtmouth', 'vendor', 'Confessor Jiji', 'Cave beyond the graveyard (Simple Key). Summons your Shade for a Rancid Egg.', { sub: 'service', item: 'use-key-jiji', wiki: W('Confessor_Jiji') });
  P('dirtmouth', 'vendor', 'Divine — Grimm Troupe', 'Smaller Troupe tent. Makes Fragile charms Unbreakable (Heart 12000 · Greed 9000 · Strength 15000 Geo).', { sub: 'service', wiki: W('Divine') });
  P('dirtmouth', 'npc', 'Elderbug', 'The only original resident left in town.');
  P('dirtmouth', 'npc', 'Bretta\'s house', 'Bretta returns after her rescue; a Mask Shard is in the house, Grey Prince Zote is fought in the basement.', { item: 'mask-bretta' });
  P('dirtmouth', 'npc', 'Grimm Troupe tent', 'Appears after lighting the Nightmare Lantern (Grimm, Brumm\'s tent).');
  P('dirtmouth', 'cocoon', 'Lifeblood Cocoon — King\'s Pass', 'North-west of the Focus tutorial sign · 2 Lifeseeds.', { wiki: W('Lifeblood_Cocoon') });
  P('dirtmouth', 'landmark', 'Well to the Forgotten Crossroads', 'The way down into Hallownest.');

  /* ------------------------- Forgotten Crossroads ------------------------- */
  P('forgotten-crossroads', 'bench', 'Hot Spring Bench', '');
  P('forgotten-crossroads', 'bench', 'Stag Station Bench', '');
  P('forgotten-crossroads', 'bench', 'Ancestral Mound Bench', 'Outside the Ancestral Mound.');
  P('forgotten-crossroads', 'bench', 'Salubra\'s Bench', 'Outside Salubra\'s shop.');
  P('forgotten-crossroads', 'bench', 'Black Egg Temple Bench', 'Boss chamber of the Temple of the Black Egg.');
  P('forgotten-crossroads', 'stag', 'Forgotten Crossroads Station', '', { cost: 50, wiki: W('Stag_Station') });
  P('forgotten-crossroads', 'vendor', 'Salubra — charm shop', 'South-east, Deserted Village area. Charms and Charm Notches (notches need 5 / 10 / 18 / 25 charms).', { sub: 'shop', wiki: W('Salubra') });
  P('forgotten-crossroads', 'vendor', 'Grubfather', 'Grubhome (north-west). Rewards per Grub rescued.', { sub: 'service', wiki: W('Grubfather') });
  P('forgotten-crossroads', 'vendor', 'Snail Shaman — Ancestral Mound', 'Grants Vengeful Spirit.', { sub: 'service', item: 'vengeful-spirit' });
  P('forgotten-crossroads', 'npc', 'Sly (lost)', 'Rescue him in a house of the Deserted Village — he then opens his shop in Dirtmouth.');
  P('forgotten-crossroads', 'npc', 'Myla', 'Upper connection to Crystal Peak.');
  P('forgotten-crossroads', 'npc', 'Menderbug', 'House in the Deserted Village.');
  P('forgotten-crossroads', 'npc', 'Quirrel', 'Temple of the Black Egg (first meeting).');
  P('forgotten-crossroads', 'spring', 'Hot Spring', 'Restores Soul.');
  P('forgotten-crossroads', 'tram', 'Upper Tram station', 'South-east end · to the Resting Grounds · needs the Tram Pass. The tram car itself counts as one bench.', { item: 'tram-pass' });
  P('forgotten-crossroads', 'cornifer', 'Cornifer — Crossroads map', 'Sells the area map for 30 Geo (later also from Iselda).', { cost: 30, wiki: W('Cornifer') });
  P('forgotten-crossroads', 'cocoon', 'Lifeblood Cocoon — Ancestral Mound', 'North-west of Elder Baldur · 2 Lifeseeds.');
  P('forgotten-crossroads', 'landmark', 'Temple of the Black Egg', 'Opens once all three Dreamers are defeated.', { item: 'black-egg' });
  P('forgotten-crossroads', 'landmark', 'Lift to the City of Tears', 'Unlocked from the City side.');

  /* ------------------------------ Greenpath ------------------------------ */
  P('greenpath', 'bench', 'East Bench', 'By a lamppost near the Crossroads entrance.');
  P('greenpath', 'bench', 'Stone Sanctuary Bench', 'Room above the Stone Sanctuary.');
  P('greenpath', 'bench', 'Toll Bench', 'Pay the toll machine to use it.', { cost: 50 });
  P('greenpath', 'bench', 'Stag Station Bench', '');
  P('greenpath', 'bench', 'Lake of Unn Bench', 'Shrine at the lake edge.');
  P('greenpath', 'bench', 'Sheo\'s Hut Bench', 'Outside Nailmaster Sheo\'s hut.');
  P('greenpath', 'stag', 'Greenpath Station', 'Reached after the north-west gauntlet.', { cost: 140, wiki: W('Stag_Station') });
  P('greenpath', 'vendor', 'Nailmaster Sheo', 'Hut at the end of the thorny path (south-west). Teaches Great Slash.', { sub: 'service', item: 'great-slash' });
  P('greenpath', 'npc', 'The Hunter', 'Cave above the Stone Sanctuary — Hunter\'s Journal.');
  P('greenpath', 'npc', 'Unn', 'Bottom of the Lake of Unn — Shape of Unn.', { item: 'shape-of-unn' });
  P('greenpath', 'npc', 'Quirrel', 'Lake of Unn bench (second meeting).');
  P('greenpath', 'npc', 'Zote the Mighty', 'North — being attacked by the Vengefly King.');
  P('greenpath', 'cornifer', 'Cornifer — Greenpath map', '60 Geo.', { cost: 60, wiki: W('Cornifer') });
  P('greenpath', 'cocoon', 'Lifeblood Cocoon', 'Behind a breakable wall above the first Moss Knight · 2 Lifeseeds.');

  /* ------------------------------ Fog Canyon ------------------------------ */
  P('fog-canyon', 'bench', 'Teacher\'s Archives Bench', '');
  P('fog-canyon', 'vendor', 'Millibelle the Banker', 'South outskirts near Queen\'s Station. (She later turns up in the Pleasure House.)', { sub: 'service', wiki: W('Millibelle') });
  P('fog-canyon', 'vendor', 'Snail Shaman — Overgrown Mound', 'Howling Wraiths, next to the larger shaman\'s body.', { sub: 'service', item: 'howling-wraiths' });
  P('fog-canyon', 'npc', 'Monomon the Teacher', 'Sleeping in the Teacher\'s Archives, guarded by Uumuu (Dreamer).', { item: 'monomon' });
  P('fog-canyon', 'npc', 'Quirrel', 'Outside, then inside the Teacher\'s Archives.');
  P('fog-canyon', 'cornifer', 'Cornifer — Fog Canyon map', '150 Geo.', { cost: 150, wiki: W('Cornifer') });
  P('fog-canyon', 'cocoon', 'Lifeblood Cocoon', 'Above a hallway of Charged Lumaflies · 3 Lifeseeds.');

  /* ----------------------------- Fungal Wastes ----------------------------- */
  P('fungal-wastes', 'bench', 'Queen\'s Station Bench', '');
  P('fungal-wastes', 'bench', 'Leg Eater\'s Bench', 'A bug corpse used as a bench, in Leg Eater\'s room.');
  P('fungal-wastes', 'bench', 'Mantis Village Bench (east shaft)', '');
  P('fungal-wastes', 'bench', 'Mantis Village Bench (treasury)', 'After defeating the Mantis Lords.');
  P('fungal-wastes', 'stag', 'Queen\'s Station', 'Between Fog Canyon and the Fungal Wastes.', { cost: 120, wiki: W('Stag_Station') });
  P('fungal-wastes', 'vendor', 'Leg Eater', 'North-east. Fragile Heart 350 · Fragile Greed 250 · Fragile Strength 600 Geo (cheaper with Defender\'s Crest); repairs Fragile charms.', { sub: 'shop', wiki: W('Leg_Eater') });
  P('fungal-wastes', 'npc', 'Bretta (lost)', 'Far south near Mantis Village.', { item: 'bretta-rescued' });
  P('fungal-wastes', 'npc', 'Willoh', 'Stagway tunnel in Queen\'s Station.');
  P('fungal-wastes', 'npc', 'Cloth', 'Hidden underground near Leg Eater.');
  P('fungal-wastes', 'npc', 'Quirrel', 'Queen\'s Station and Mantis Village.');
  P('fungal-wastes', 'cornifer', 'Cornifer — Fungal Wastes map', '75 Geo.', { cost: 75, wiki: W('Cornifer') });
  P('fungal-wastes', 'cocoon', 'Lifeblood Cocoon', 'Upper-left of the Mantis Lords arena, behind a breakable wall · 2 Lifeseeds.');

  /* ---------------------------- Queen's Gardens ---------------------------- */
  P('queens-gardens', 'bench', 'Arena Bench', 'South-east, one room west of Cornifer.');
  P('queens-gardens', 'bench', 'Toll Bench', 'South-west, in front of a Pale King statue.', { cost: 150 });
  P('queens-gardens', 'bench', 'Stag Station Bench', '');
  P('queens-gardens', 'stag', 'Queen\'s Gardens Station', 'Central Gardens.', { cost: 200, wiki: W('Stag_Station') });
  P('queens-gardens', 'npc', 'White Lady', 'West of the greenhouse. Gives the Queen\'s White Fragment after the Traitor Lord.', { item: 'white-fragment-queen' });
  P('queens-gardens', 'npc', 'Moss Prophet', 'Moss Chapel.');
  P('queens-gardens', 'cornifer', 'Cornifer — Queen\'s Gardens map', '150 Geo.', { cost: 150, wiki: W('Cornifer') });

  /* ----------------------------- City of Tears ----------------------------- */
  P('city-of-tears', 'bench', 'West Bench', 'Beside a window — the first bench when you enter.');
  P('city-of-tears', 'bench', 'City Storerooms Bench', 'Stag Station.');
  P('city-of-tears', 'bench', 'Toll Bench', 'Outside the Soul Sanctum.', { cost: 150 });
  P('city-of-tears', 'bench', 'Pleasure House Bench', 'Needs a Simple Key to enter.', { item: 'use-key-pleasure-house' });
  P('city-of-tears', 'bench', 'King\'s Station Bench', '');
  P('city-of-tears', 'bench', 'Watcher\'s Spire Bench', 'Midway up the Spire.');
  P('city-of-tears', 'stag', 'City Storerooms', 'West side.', { cost: 200, wiki: W('Stag_Station') });
  P('city-of-tears', 'stag', 'King\'s Station', 'Far east.', { cost: 300, wiki: W('Stag_Station') });
  P('city-of-tears', 'vendor', 'Nailsmith', 'Forge on the west side — Nail upgrades.', { sub: 'service', item: 'nail-1', wiki: W('Nailsmith') });
  P('city-of-tears', 'vendor', 'Relic Seeker Lemm', 'West side shop — buys relics (Wanderer\'s Journal 200 · Seal 450 · King\'s Idol 800 · Arcane Egg 1200).', { sub: 'shop', wiki: W('Relic_Seeker_Lemm') });
  P('city-of-tears', 'npc', 'Lurien the Watcher', 'Top of the Watcher\'s Spire (Dreamer).', { item: 'lurien' });
  P('city-of-tears', 'npc', 'Millibelle', 'Pleasure House — hit her to recover your Geo.');
  P('city-of-tears', 'npc', 'Marissa · Poggy Thorax', 'Pleasure House.');
  P('city-of-tears', 'npc', 'Quirrel', 'First building next to the west bench.');
  P('city-of-tears', 'spring', 'Hot Spring', 'Top room of the Pleasure House.');
  P('city-of-tears', 'cornifer', 'Cornifer — City of Tears map', '90 Geo.', { cost: 90, wiki: W('Cornifer') });
  P('city-of-tears', 'landmark', 'Soul Sanctum', 'Soul Warrior, Soul Master, Spell Twister.');
  P('city-of-tears', 'landmark', 'Tower of Love', 'Opened with the Love Key — The Collector.', { item: 'love-key' });

  /* ---------------------------- Royal Waterways ---------------------------- */
  P('royal-waterways', 'bench', 'Waterways Bench', 'Follow the painted sign — the only tilted bench.');
  P('royal-waterways', 'npc', 'Godseeker (cocoon)', 'Golden cocoon in the Junk Pit — unlock with a Simple Key, then Dream Nail her to reach Godhome.', { item: 'use-key-godseeker' });
  P('royal-waterways', 'npc', 'Tuk', 'West side.');
  P('royal-waterways', 'npc', 'Fluke Hermit', 'West side.');
  P('royal-waterways', 'cornifer', 'Cornifer — Royal Waterways map', '75 Geo.', { cost: 75, wiki: W('Cornifer') });
  P('royal-waterways', 'landmark', 'Junk Pit', 'Below the bench (Desolate Dive) — the way to Godhome.');
  P('royal-waterways', 'landmark', 'Isma\'s Grove', 'Isma\'s Tear.', { item: 'ismas-tear' });

  /* ------------------------------ Crystal Peak ------------------------------ */
  P('crystal-peak', 'bench', 'Dark Room Bench', 'South, in the dark area — Lumafly Lantern recommended.');
  P('crystal-peak', 'bench', 'Crystal Guardian Bench', 'Usable after defeating the Crystal Guardian.', { item: 'crystal-guardian' });
  P('crystal-peak', 'vendor', 'Snail Shaman — Crystallised Mound', 'Descending Dark.', { sub: 'service', item: 'descending-dark' });
  P('crystal-peak', 'npc', 'Quirrel', 'Room overlooking Dirtmouth.');
  P('crystal-peak', 'cornifer', 'Cornifer — Crystal Peak map', '112 Geo.', { cost: 112, wiki: W('Cornifer') });
  P('crystal-peak', 'landmark', 'Lift to Dirtmouth', 'North-west.');
  P('crystal-peak', 'landmark', 'Hallownest\'s Crown', 'Pale Ore at the Radiance statue on the summit.', { item: 'ore-crystal-peak' });

  /* ----------------------------- Resting Grounds ----------------------------- */
  P('resting-grounds', 'bench', 'Stag Station Bench', '');
  P('resting-grounds', 'bench', 'Grey Mansion Bench', 'Outside the Grey Mansion.');
  P('resting-grounds', 'stag', 'Resting Grounds Station', 'Free — flip the lever.', { wiki: W('Stag_Station') });
  P('resting-grounds', 'vendor', 'Seer', 'Top north-east. Trade Essence for rewards (Dream Wielder, Vessel Fragment, Dreamgate, Mask Shard, Awoken Dream Nail…).', { sub: 'service', wiki: W('Seer') });
  P('resting-grounds', 'npc', 'Grey Mourner', 'Grey Mansion — Delicate Flower quest → Mask Shard.', { item: 'delicate-flower' });
  P('resting-grounds', 'npc', 'Quirrel · Tiso', 'Blue Lake (Quirrel\'s final meeting).');
  P('resting-grounds', 'npc', 'Cornifer\'s letter', 'Cornifer is not met here — he leaves a letter at the Stag Station.');
  P('resting-grounds', 'tram', 'Upper Tram station', 'Above the Blue Lake · shared with the Crossroads.', { item: 'tram-pass' });
  P('resting-grounds', 'landmark', 'Dreamer Shrine', 'Dream Nail.', { item: 'dream-nail' });

  /* ----------------------------- Howling Cliffs ----------------------------- */
  P('howling-cliffs', 'bench', 'Mato\'s Hut Bench', 'Inside Nailmaster Mato\'s hut.');
  P('howling-cliffs', 'stag', 'Stag Nest', 'Free — opens after every other station is opened. Its bell is broken.', { item: 'all-stag-stations', wiki: W('Stag_Station') });
  P('howling-cliffs', 'vendor', 'Nailmaster Mato', 'Cyclone Slash.', { sub: 'service', item: 'cyclone-slash' });
  P('howling-cliffs', 'npc', 'Blue Child Joni', 'Joni\'s Repose — Joni\'s Blessing.', { item: 'jonis-blessing' });
  P('howling-cliffs', 'cornifer', 'Cornifer — Howling Cliffs map', '75 Geo.', { cost: 75, wiki: W('Cornifer') });

  /* ------------------------ Kingdom's Edge & Colosseum ------------------------ */
  P('kingdoms-edge', 'bench', 'Oro\'s Hut Bench', 'Outside Nailmaster Oro\'s hut.');
  P('kingdoms-edge', 'bench', 'Colosseum Bench', 'Warriors\' pit below the arena.');
  P('kingdoms-edge', 'bench', 'Hornet\'s Tent Bench', 'Tent north-west of the Hornet Sentinel arena.');
  P('kingdoms-edge', 'vendor', 'Nailmaster Oro', 'Dash Slash (800 Geo).', { sub: 'service', item: 'dash-slash' });
  P('kingdoms-edge', 'vendor', 'Little Fool — Colosseum', 'Trials: Warrior 100 · Conqueror 450 · Fool 800 Geo.', { sub: 'service', item: 'trial-warrior' });
  P('kingdoms-edge', 'npc', 'Bardoon', '');
  P('kingdoms-edge', 'npc', 'Zote / Tiso', 'Warriors\' pit (conditional).');
  P('kingdoms-edge', 'spring', 'Hot Spring', 'Colosseum — behind a breakable wall right of the bench.');
  P('kingdoms-edge', 'tram', 'Lower Tram station', 'South-west · Lower Tram (Deepnest ↔ Ancient Basin ↔ Kingdom\'s Edge). The tram car counts as one bench.', { item: 'tram-pass' });
  P('kingdoms-edge', 'cornifer', 'Cornifer — Kingdom\'s Edge map', '112 Geo.', { cost: 112, wiki: W('Cornifer') });
  P('kingdoms-edge', 'cocoon', 'Lifeblood Cocoon', 'Secret path below Bardoon · 3 Lifeseeds.');
  P('kingdoms-edge', 'landmark', 'Cast-Off Shell', 'King\'s Brand.', { item: 'kings-brand' });
  P('kingdoms-edge', 'landmark', 'Colosseum of Fools', 'Top of the western chasm.');

  /* -------------------------------- The Hive -------------------------------- */
  P('the-hive', 'bench', 'Hive Bench', 'South-west — break its honey glob.');
  P('the-hive', 'npc', 'Hive Queen Vespa', '');
  P('the-hive', 'landmark', 'Hive entrance', 'Breakable wall east of the Kingdom\'s Edge tram.');

  /* -------------------------------- Deepnest -------------------------------- */
  P('deepnest', 'bench', 'Hot Spring Bench', '');
  P('deepnest', 'bench', 'Failed Tramway Bench', 'East of the Failed Tramway.');
  P('deepnest', 'bench', 'Bench above the Distant Village', 'Room above the Distant Villagers.');
  P('deepnest', 'stag', 'Distant Village Station', 'North-east of the Distant Village (its bench is webbed and broken).', { cost: 250, wiki: W('Stag_Station') });
  P('deepnest', 'npc', 'Herrah the Beast', 'Beast\'s Den (Dreamer).', { item: 'herrah' });
  P('deepnest', 'npc', 'Midwife', '');
  P('deepnest', 'npc', 'Mask Maker', '');
  P('deepnest', 'npc', 'Brumm', 'Distant Village (Grimm Troupe).', { item: 'brumm' });
  P('deepnest', 'npc', 'Quirrel', 'Hot Spring.');
  P('deepnest', 'spring', 'Hot Spring', 'West of the working tram.');
  P('deepnest', 'tram', 'Lower Tram station', 'South-east · the Tram Pass is in the Failed Tramway.', { item: 'tram-pass' });
  P('deepnest', 'cornifer', 'Cornifer — Deepnest map', '38 Geo · at the lower or upper entrance.', { cost: 38, wiki: W('Cornifer') });
  P('deepnest', 'cocoon', 'Lifeblood Cocoon — Galien', 'Directly above Galien\'s arena · 3 Lifeseeds.');
  P('deepnest', 'cocoon', 'Lifeblood Cocoon — Failed Tramway', 'Secret room at the top of the Failed Tramway · 2 Lifeseeds.');
  P('deepnest', 'landmark', 'Trap bench (Distant Village)', 'A fake bench set by the Distant Villagers — not counted.');

  /* ------------------------------ Ancient Basin ------------------------------ */
  P('ancient-basin', 'bench', 'Toll Bench', '', { cost: 150 });
  P('ancient-basin', 'bench', 'Hidden Station Bench', 'Palace Grounds.');
  P('ancient-basin', 'stag', 'Hidden Station', 'East Palace Grounds — breakable wall near two Royal Retainer corpses.', { cost: 300, wiki: W('Stag_Station') });
  P('ancient-basin', 'vendor', 'Pale King fountain', 'Donate 3000 Geo → Vessel Fragment.', { sub: 'service', item: 'vessel-fountain' });
  P('ancient-basin', 'tram', 'Lower Tram station', 'Northern part.', { item: 'tram-pass' });
  P('ancient-basin', 'cornifer', 'Cornifer — Ancient Basin map', '112 Geo.', { cost: 112, wiki: W('Cornifer') });
  P('ancient-basin', 'landmark', 'White Palace entrance', 'Dream Nail the Kingsmould corpse in the Palace Grounds (Awoken Dream Nail).', { item: 'awoken-dream-nail' });
  P('ancient-basin', 'landmark', 'Abyss gate', 'Bottom of the Basin — opened with the King\'s Brand.', { item: 'kings-brand' });

  /* -------------------------------- The Abyss -------------------------------- */
  P('the-abyss', 'landmark', 'No bench here', 'The Abyss is the only area without a bench.');
  P('the-abyss', 'landmark', 'Lighthouse', 'The path east leads to the Shade Cloak.', { item: 'shade-cloak' });
  P('the-abyss', 'landmark', 'Birthplace', 'Void Heart — only after the ending “The Hollow Knight”.', { item: 'void-heart' });

  /* ------------------------------- White Palace ------------------------------- */
  P('white-palace', 'bench', 'South Bench', 'Near the entrance.');
  P('white-palace', 'bench', 'Atrium Bench', 'Above the first lift.');
  P('white-palace', 'bench', 'North Bench', 'Before the final platforming.');
  P('white-palace', 'landmark', 'Pale King\'s throne', 'King\'s White Fragment.', { item: 'white-fragment-king' });
  P('white-palace', 'landmark', 'Path of Pain', 'Breakable wall, second floor of the first buzz-saw room (optional).');

  /* --------------------------------- Godhome --------------------------------- */
  P('godhome', 'bench', 'Pantheon Bench', 'Above the first three Pantheons.');
  P('godhome', 'bench', 'Hot Spring Bench', 'Inside the Pantheons (counted once).');
  P('godhome', 'bench', 'Hall of Gods Bench', '');
  P('godhome', 'bench', 'Pantheon of Hallownest Bench', 'Under the right edge — after the Pantheon of the Knight.');
  P('godhome', 'npc', 'Godseeker', '');
  P('godhome', 'spring', 'Hot Springs', 'Two in Godhome, plus springs inside the Pantheons.');
  P('godhome', 'landmark', 'Hall of Gods', 'Refight bosses at Attuned / Ascended / Radiant.');

  /* Extra bosses without their own checklist entry (Godhome finals, etc.) */
  var EXTRA_BOSSES = [
    ['godhome', 'Brothers Oro & Mato', 'Final boss of the Pantheon of the Master.', 'pantheon-master'],
    ['godhome', 'Paintmaster Sheo', 'Final boss of the Pantheon of the Artist.', 'pantheon-artist'],
    ['godhome', 'Great Nailsage Sly', 'Final boss of the Pantheon of the Sage.', 'pantheon-sage'],
    ['godhome', 'Pure Vessel', 'Final boss of the Pantheon of the Knight.', 'pantheon-knight'],
    ['forgotten-crossroads', 'The Hollow Knight', 'Temple of the Black Egg — after the three Dreamers.', 'ending-thk'],
    ['forgotten-crossroads', 'The Radiance', 'Temple of the Black Egg — the Dream No More ending.', 'ending-dream-no-more']
  ];
  EXTRA_BOSSES.forEach(function (b) { P(b[0], 'boss', b[1], b[2], { item: b[3] }); });

  var api = {
    TYPES: TYPES,
    LIST: L,
    BENCHES_TOTAL: 50, // wiki: 50 incl. 7 in the Dream Realm; each tram counts once
    NOTE: 'Schematic positions — the region is right, the exact spot is approximate. Not the official map.'
  };
  root.HK = root.HK || {};
  root.HK.POI = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
