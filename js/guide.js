/*
 * Hollow Knight Companion — GUIDE DATA (bosses, Whispering Roots detail, missable warnings)
 * Researched on hollowknight.wiki (Oct 2026) and paraphrased; each entry keeps its source URL.
 * Where the wiki gives no precise value, the field is null / omitted — nothing here is guessed.
 */
(function (root) {
  'use strict';
  var GUIDE = {
    BOSSES: {
 "gruz-mother": {
  "hp": 90,
  "attacks": [
   "Charge straight at you",
   "Wild Slam: repeated floor-to-ceiling slams while drifting forward",
   "Idle flying with no attack"
  ],
  "tips": [
   "Mothwing Cloak makes the fast Wild Slam easier to dodge",
   "Vengeful Spirit is the easiest kill: about 6 casts, or about 18 Old Nail hits",
   "She rarely attacks, so healing from a distance is safe"
  ],
  "bring": [
   "Vengeful Spirit",
   "Mothwing Cloak"
  ],
  "note": "Killing the Crossroads Gruz Mother releases 7-8 Gruzzers you must clear before leaving. (HP: 140 in the Trial of the Warrior version.)",
  "source": "https://hollowknight.wiki/w/Gruz_Mother"
 },
 "false-knight": {
  "hp": 355,
  "attacks": [
   "Leap and Charge into a Leaping Bludgeon",
   "Slam: ground shockwave (falling barrels in later phases)",
   "Rage: repeated mace slams at the arena centre after the armour breaks"
  ],
  "tips": [
   "Heal during Rage from a corner while watching for falling barrels",
   "Hit falling barrels so they land on him for about 10 damage each",
   "Hitting the armour gives no SOUL; only the exposed Maggot gives SOUL, so spend it then",
   "After the third exposure and a final Rage he breaks the floor; drop down and hit the Maggot to finish"
  ],
  "bring": [],
  "note": "HP is the page's stated minimum total (armour 65 per stage x3 plus Maggot 40 per stage x4). Page says the fight can repeat indefinitely if you do not hit the Maggot. Using the Dream Nail on the corpse opens the optional Failed Champion fight.",
  "source": "https://hollowknight.wiki/w/False_Knight"
 },
 "hornet-protector": {
  "hp": 225,
  "attacks": [
   "Lunge and Aerial Lunge (jump then dive)",
   "Thread Storm: area attack around herself",
   "Needle Throw that can hit on the return"
  ],
  "tips": [
   "She is stationary for about a second at the start, so land upward Nail hits",
   "At roughly a fifth health lost she staggers; use it to heal or cast Vengeful Spirit",
   "Heal during Needle Throw or Thread Storm since both take time to finish",
   "If you mistime a jump over the needle, a downward slash bounces you off it safely"
  ],
  "bring": [
   "Vengeful Spirit"
  ],
  "note": "Her Journal entry needs two defeats (both forms, or Greenpath plus Godhome). The Mothwing Cloak reward is needed to enter the Fungal Wastes.",
  "source": "https://hollowknight.wiki/w/Hornet_Protector"
 },
 "brooding-mawlek": {
  "hp": 300,
  "attacks": [
   "Slash with claw when you are close",
   "Spit: arcing Infection blobs",
   "Leap to your position and back",
   "Vomit: many blobs at once"
  ],
  "tips": [
   "Without reach charms, hit a few times and back off when it raises its claw",
   "Dodge the Leap by running away, then strike while it is airborne",
   "Dash over Vomit blobs with Mothwing Cloak or weave through the gaps",
   "Baldur Shell plus Cyclone Slash lets you chip it and heal safely inside the shell"
  ],
  "bring": [
   "Baldur Shell",
   "Cyclone Slash",
   "Mothwing Cloak",
   "Sharp Shadow",
   "Mark of Pride",
   "Longnail"
  ],
  "note": "Hidden room past a wall-jump section; Mantis Claw is recommended to get there. Described as optional in a Kickstarter update.",
  "source": "https://hollowknight.wiki/w/Brooding_Mawlek"
 },
 "mantis-lords": {
  "hp": 530,
  "attacks": [
   "Lance Dash across the arena",
   "Lance Drop from above",
   "Blade Boomerang thrown from a wall",
   "Phase 2: two Lords with simultaneous dashes and paired boomerangs"
  ],
  "tips": [
   "Upgrade your Nail first (page recommends it)",
   "Heal during Boomerang; it is the easiest attack to dodge",
   "Stay on one side and avoid corners to limit contact damage from dash teleports",
   "Standing in the centre during a short-arc double boomerang avoids the blades"
  ],
  "bring": [
   "Quick Focus",
   "Shape of Unn",
   "Dreamshield"
  ],
  "note": "HP is 210 for phase 1 plus 160 + 160 for phase 2. Needs Mantis Claw and a lever in the Mantis Village. Winning grants the Mark of Pride charm and Deepnest passage.",
  "source": "https://hollowknight.wiki/w/Mantis_Lords"
 },
 "soul-master": {
  "hp": 385,
  "attacks": [
   "Dash and homing Orb",
   "Clock: four orbiting orbs",
   "Slam with shockwaves, plus Fake Out Slam",
   "Phase 2: chained explosive Altered Slams and Altered Orb"
  ],
  "tips": [
   "Dodge the Orb by jumping or dashing sideways when he is far away",
   "For Clock, approach mid-attack and jump the bottom orb when it is nearest the ground",
   "Heal during his deflate stagger or from the arena centre after he vanishes in Clock",
   "Phase 2 is easier: keep moving during Slams and hit him when he conjures orbs"
  ],
  "bring": [],
  "note": "HP is 275 for phase 1 plus 110 for phase 2. Defeating him grants Desolate Dive; page says he is the only boss that gives the Knight a spell. Soul Tyrant dream fight needs the Dream Nail on his corpse.",
  "source": "https://hollowknight.wiki/w/Soul_Master"
 },
 "dung-defender": {
  "hp": 700,
  "attacks": [
   "Dung Toss: bouncing ball then a Dive",
   "Burst: tunnels then erupts, launching four balls",
   "Toss Combo: two bouncing balls",
   "Zeal: frenzy of rapid Bursts once at 50% HP"
  ],
  "tips": [
   "When he stops to conjure balls, hit once, step back as he throws, then hit again",
   "Spells destroy his balls; a single Nail hit does not",
   "Standing in a corner during his ball throws gives long healing openings",
   "Desolate Dive or Descending Dark while he burrows knocks him out and stuns him"
  ],
  "bring": [
   "Desolate Dive",
   "Descending Dark"
  ],
  "note": "HP scales with Nail upgrade: 700 / 750 / 800 / 850 / 900 for Nail 0-4 (700 shown). Defeating him gives the Defender's Crest and access to Isma's Grove.",
  "source": "https://hollowknight.wiki/w/Dung_Defender"
 },
 "broken-vessel": {
  "hp": 525,
  "attacks": [
   "Slash/Aerial Slash dashes and Flail",
   "Slam releasing four Infection blobs",
   "Cascade: waves of blobs at 370, 220 and 110 HP",
   "Balloon: spawns 1-HP Infected Balloons after 420 HP"
  ],
  "tips": [
   "Match his reach with Longnail or Mark of Pride",
   "Clear Balloons with Spore Shroom or Defender's Crest",
   "Vengeful Spirit or Shade Soul can hit twice because of his knockback",
   "Desolate Dive or Descending Dark is strong during Cascade or staggers; Cyclone Slash can stagger him"
  ],
  "bring": [
   "Quick Focus",
   "Mark of Pride",
   "Longnail",
   "Spore Shroom",
   "Defender's Crest",
   "Shaman Stone",
   "Desolate Dive",
   "Cyclone Slash"
  ],
  "note": "In the far west of the Ancient Basin; Crystal Heart is needed to reach the area. His room blocks the way to Monarch Wings. Dream variant is Lost Kin.",
  "source": "https://hollowknight.wiki/w/Broken_Vessel"
 },
 "nosk": {
  "hp": 680,
  "attacks": [
   "Charge: fast rush, preceded by a screech",
   "Leap around the arena",
   "Eruption: sprays Infection blobs in arcs",
   "Rain: hides in the ceiling and drops blobs (at 560 HP or below)"
  ],
  "tips": [
   "Stand against the middle platform's walls; Charges pass over you and it is safe for healing",
   "Keep moving during Rain, since blobs track a stationary Knight",
   "Listen for the screech before each Charge",
   "Nosk can still be hit while in the ceiling during Rain"
  ],
  "bring": [
   "Shade Cloak",
   "Sharp Shadow",
   "Desolate Dive",
   "Descending Dark",
   "Howling Wraiths",
   "Abyss Shriek",
   "Longnail",
   "Mark of Pride"
  ],
  "note": "Hidden room needing Monarch Wings or Crystal Heart; drops one Pale Ore. Page warns that killing it with Grimmchild or Weaversong before it transforms can soft-lock the arena doors.",
  "source": "https://hollowknight.wiki/w/Nosk"
 },
 "the-collector": {
  "hp": 750,
  "attacks": [
   "Jar: drops jars releasing Vengeflies, Baldurs or Aspid Hunters",
   "Grab: leaping long-reach grab",
   "Hop: series of jumps around the arena"
  ],
  "tips": [
   "Get the Coiled Nail first so it one-shots the summoned enemies",
   "Clear summons quickly; Nail Arts and Cyclone Slash help",
   "Stay on the ground",
   "Heal carefully; Quick Focus and Shape of Unn make it safer"
  ],
  "bring": [
   "Quick Focus",
   "Shape of Unn",
   "Fragile Strength",
   "Unbreakable Strength",
   "Shade Cloak",
   "Desolate Dive",
   "Vengeful Spirit"
  ],
  "note": "HP scales with Nail: 750 / 750 / 750 / 800 / 850 for Nail 0-4. He gives no SOUL when hit, so SOUL is scarce. Needs the Love Key to reach the Tower of Love.",
  "source": "https://hollowknight.wiki/w/The_Collector"
 },
 "uumuu": {
  "hp": 300,
  "attacks": [
   "Burst: lightning bursts in set patterns (bottom platforms always safe)",
   "Chase: about 8 bursts follow your position",
   "Hover: drifts slowly after you"
  ],
  "tips": [
   "His core is shielded; Quirrel pops the shield after you dodge a few attacks, giving about 3.75 seconds to hit",
   "Do not jump into the acid; it slows and damages you without Isma's Tear",
   "Hits and SOUL are scarce, so use SOUL-gain options",
   "Shaman Stone with Abyss Shriek can kill him in one cycle with enough SOUL beforehand"
  ],
  "bring": [
   "Quick Focus",
   "Soul Catcher",
   "Soul Eater",
   "Shaman Stone",
   "Abyss Shriek",
   "Great Slash"
  ],
  "note": "Defender's Crest and Spore Shroom cannot damage Uumuu. Winning gives access to Monomon the Teacher.",
  "source": "https://hollowknight.wiki/w/Uumuu"
 },
 "hornet-sentinel": {
  "hp": 700,
  "attacks": [
   "Same moves as Protector: Lunge, Aerial Lunge, Thread Storm, Needle Throw",
   "Parry with counter-slash",
   "Spike Traps (only after dropping below 480 HP)"
  ],
  "tips": [
   "Dashing over her Lunge is generally safe",
   "Vengeful Spirit or Shade Soul works from range and can clear Spike Traps",
   "Spike Traps can be bounced on; Grimmchild targets them instead of Hornet",
   "Desolate Dive or Descending Dark avoids damage while casting"
  ],
  "bring": [
   "Quick Focus",
   "Shaman Stone",
   "Grimmchild",
   "Soul Catcher",
   "Soul Eater",
   "Desolate Dive"
  ],
  "note": "Located at the entrance to the Cast-Off Shell in Kingdom's Edge. Her Journal entry needs two defeats (both forms, or Greenpath plus Godhome).",
  "source": "https://hollowknight.wiki/w/Hornet_Sentinel"
 },
 "traitor-lord": {
  "hp": 800,
  "attacks": [
   "Dive: two-part angled jump and dive",
   "Dash ending in a claw swipe",
   "Dancing Glaive wind-scythes (Lifeblood content)",
   "Ground Pound shockwaves after 500 HP (Lifeblood content)"
  ],
  "tips": [
   "Dash through attacks with Shade Cloak",
   "Dodge the Dive by moving sideways so he lands past you",
   "Stay close, since distance triggers Glaive and Ground Pound",
   "Invincibility (Desolate Dive or Descending Dark) is the only reliable answer to Ground Pound"
  ],
  "bring": [
   "Shade Cloak",
   "Sharp Shadow",
   "Desolate Dive",
   "Descending Dark",
   "Shape of Unn"
  ],
  "note": "Reached through a Shade Gate, so Shade Cloak is needed. He blocks the path to the White Lady. If Cloth's quest is complete she joins the fight.",
  "source": "https://hollowknight.wiki/w/Traitor_Lord"
 },
 "watcher-knights": {
  "hp": 220,
  "attacks": [
   "Double Slash",
   "Roll: immune to Nail while rolling, but Spells hurt",
   "Bouncing Roll",
   "Run before attacking"
  ],
  "tips": [
   "Avoid corners and attack from above; their spinning jump is their only anti-air counter",
   "Quick Focus is recommended because of their fast attacks",
   "Sharp Shadow with Shade Cloak lets you dash through them for damage",
   "Shaman Stone with Descending Dark or Desolate Dive can kill one Knight in about three casts"
  ],
  "bring": [
   "Quick Focus",
   "Lifeblood Heart",
   "Stalwart Shell",
   "Sharp Shadow",
   "Shade Cloak",
   "Dashmaster",
   "Dream Wielder",
   "Shaman Stone"
  ],
  "note": "HP is per Knight (six of them): 220 at Nail 0-2, 240 at Nail 3, 260 at Nail 4. Only two are active at once. Dropping the chandelier beforehand reduces the count to five.",
  "source": "https://hollowknight.wiki/w/Watcher_Knights"
 },
 "hive-knight": {
  "hp": 800,
  "attacks": [
   "Lunge across most of the arena",
   "Leap somersault",
   "Swarm Release: Hivelings from the ceiling (below 549 HP)",
   "Surprise Slash teleport, and Honey Spikes (below 779 HP)"
  ],
  "tips": [
   "Get Shade Cloak first; it dashes through Surprise Slash and Lunge",
   "Heal when out of range, at the start of Swarm Release, during Honey Spikes from a safe spot, or in the stagger",
   "Cyclone Slash is very strong since you can move while attacking",
   "Vengeful Spirit or Shade Soul is strong"
  ],
  "bring": [
   "Shade Cloak",
   "Mark of Pride",
   "Steady Body",
   "Quick Slash",
   "Heavy Blow",
   "Shape of Unn",
   "Sharp Shadow",
   "Quick Focus"
  ],
  "note": "HP scales with Nail: 800 at Nail 0-2, 850 at Nail 3, 920 at Nail 4. Lifeblood content; defeating him grants the Hiveblood charm.",
  "source": "https://hollowknight.wiki/w/Hive_Knight"
 },
 "massive-moss-charger": {
  "hp": 100,
  "attacks": [
   "Charge: forward rush",
   "Belly-flop: hop toward you then ground slam"
  ],
  "tips": [
   "Stand near the room edge; it can snag during Belly-flop, giving time to dash away",
   "Quick Slash and/or Heavy Blow let you win by attacking rapidly during its Charge animation",
   "Hitting it does not expose a vulnerable bug like regular Moss Chargers"
  ],
  "bring": [
   "Quick Slash",
   "Heavy Blow",
   "Mothwing Cloak"
  ],
  "note": "Optional; you are not locked in. It stays buried if you are not touching the ground. Defeating it reveals four unkillable Moss Chargers.",
  "source": "https://hollowknight.wiki/w/Massive_Moss_Charger"
 },
 "vengefly-king": {
  "hp": 55,
  "attacks": [
   "Swoop: jaw opens, then a wide U-shaped dive",
   "Summoning Scream: calls two Vengeflies (each 75% chance)"
  ],
  "tips": [
   "Watch for the open jaw, jump the Swoop, then downward slash or just dodge",
   "Kill summoned Vengeflies quickly; they also give easy SOUL",
   "There is time to heal right after dodging a Swoop"
  ],
  "bring": [],
  "note": "HP is the Greenpath value (100 in the Trial of the Warrior). He holds Zote; Zote is eaten if not freed before you get Mantis Claw or you enter certain nearby rooms.",
  "source": "https://hollowknight.wiki/w/Vengefly_King"
 },
 "flukemarm": {
  "hp": 350,
  "attacks": [
   "Spawn: spits out two Flukefeys at a time (her only attack)",
   "Infection leaking from an orifice warns where Flukefeys will emerge (max 6 active)"
  ],
  "tips": [
   "Kill Flukefeys quickly and hit Flukemarm between spawns",
   "Use SOUL from Flukefeys for Vengeful Spirit or Shade Soul",
   "Nail-bounce off her head and use Longnail or Mark of Pride for reach",
   "Abyss Shriek boosted by Shaman Stone kills her in about three uninterrupted casts"
  ],
  "bring": [
   "Abyss Shriek",
   "Shaman Stone",
   "Longnail",
   "Mark of Pride",
   "Quick Focus",
   "Stalwart Shell",
   "Soul Catcher",
   "Grubsong"
  ],
  "note": "Needs Desolate Dive or Descending Dark to break the floor to her cave in the Royal Waterways. Falling into water is the main danger (cannot attack while swimming). Reward: Flukenest charm.",
  "source": "https://hollowknight.wiki/w/Flukemarm"
 },
 "crystal-guardian": {
  "hp": 280,
  "attacks": [
   "Laser Beam aimed where you stood when it starts",
   "Sky Beams: up to four beams from the ceiling (opens the fight)",
   "Hop around the arena"
  ],
  "tips": [
   "Nail-bounce does not damage his armour",
   "Watch the thin light lines that telegraph each beam",
   "Hit him a few times between Laser Beams, or jump and dash over one to strike",
   "Desolate Dive/Descending Dark and Vengeful Spirit/Shade Soul are the safer ranged options"
  ],
  "bring": [
   "Vengeful Spirit",
   "Shade Soul",
   "Desolate Dive",
   "Descending Dark"
  ],
  "note": "Both Guardian forms must be beaten for the Journal entry. Monarch Wings are needed to reach the Enraged Guardian room above. He can be damaged from afar to avoid triggering the fight.",
  "source": "https://hollowknight.wiki/w/Crystal_Guardian"
 },
 "enraged-guardian": {
  "hp": 450,
  "attacks": [
   "Laser Beam",
   "Sky Beams fired in sequence (orange)",
   "Hop"
  ],
  "tips": [
   "Crystal Guardian strategies still apply",
   "Standing on the far east side makes most Sky Beams miss, leaving mainly the Laser Beam",
   "When he jumps close he tends to fire backwards, leaving time for several hits"
  ],
  "bring": [
   "Kingsoul",
   "Vengeful Spirit",
   "Shade Soul"
  ],
  "note": "HP scales with Nail: 450 / 450 / 500 / 550 / 600. Requires Monarch Wings and beating the Crystal Guardian first; defeating him gives a Mask Shard. The wiki also notes the fight can be skipped by casting spells from outside the arena with Kingsoul, which is not confirmed to count toward the Journal.",
  "source": "https://hollowknight.wiki/w/Enraged_Guardian"
 },
 "soul-warrior": {
  "hp": 180,
  "attacks": [
   "Dive-Slash: teleports above you (always opens the fight)",
   "Dash-Slash",
   "Conjure Orb: homing Soul orb",
   "Teleport and Skitter to reposition"
  ],
  "tips": [
   "After Dive-Slash, sidestep and land as many hits as possible",
   "After Dash-Slash, jump over and down-strike, or stay just outside its short range",
   "It stays on the ground, so its homing orb is more predictable than a Soul Master's"
  ],
  "bring": [],
  "note": "HP is 300 for the Elegant Key room version. That room needs the Elegant Key. Two Soul Warrior defeats unlock the Journal entry.",
  "source": "https://hollowknight.wiki/w/Soul_Warrior"
 },
 "pale-lurker": {
  "hp": 200,
  "attacks": [
   "Leaps away, hopping across floor and walls",
   "Drops indestructible spikes along its path",
   "Arm lash when you are close, then burrows and reappears"
  ],
  "tips": [
   "Attack from range with Vengeful Spirit or Shade Soul",
   "Grubberfly's Elegy sword beams work well",
   "For melee, combine Sharp Shadow with Dash Slash, especially with Nailmaster's Glory"
  ],
  "bring": [
   "Vengeful Spirit",
   "Shade Soul",
   "Grubberfly's Elegy",
   "Grimmchild",
   "Sharp Shadow",
   "Nailmaster's Glory"
  ],
  "note": "HP scales with Nail: 200 / 240 / 290 / 340 / 400. Secret area east of the Colosseum of Fools behind a breakable wall; you are locked in once you enter. Page says it is not technically a boss, and defeating it opens the gate back to the Colosseum.",
  "source": "https://hollowknight.wiki/w/Pale_Lurker"
 },
 "oblobbles": {
  "hp": 260,
  "attacks": [
   "Acid Cannonade: sets of four liquid shots around each body",
   "Fly: diagonal bouncing movement",
   "Frenzy: survivor flies and fires faster after the other dies"
  ],
  "tips": [
   "Focus one Oblobble, or spread damage so the last one has little health (spells help)",
   "Heal in arena corners between Acid Cannonade attacks",
   "Nail Arts are strong in Frenzy; Cyclone Slash works in phase one but not in Frenzy",
   "Two to four Abyss Shrieks can kill one if you have enough SOUL"
  ],
  "bring": [
   "Shaman Stone",
   "Spell Twister",
   "Soul Eater",
   "Shape of Unn",
   "Quick Focus",
   "Great Slash",
   "Abyss Shriek"
  ],
  "note": "HP listed as 260 + 260 for phase one, then up to 300 for phase two (total 560-620). Found only at the top of the Trial of the Conqueror in the Colosseum of Fools. Journal entry unlocks after defeating either one, even if you lose.",
  "source": "https://hollowknight.wiki/w/Oblobbles"
 },
 "god-tamer": {
  "hp": 1050,
  "attacks": [
   "Tamer: Leap with lance onto your starting position",
   "Beast: Roll across the arena (immune to Nail while rolling)",
   "Beast: Spew of Infection blobs in three groups"
  ],
  "tips": [
   "Focus the Beast; once it dies, God Tamer stops fighting",
   "Cyclone Slash answers the Beast's Roll",
   "Down-strike the Beast when it is not rolling",
   "Both enemies have low health, so burst damage works well"
  ],
  "bring": [
   "Shaman Stone",
   "Stalwart Shell",
   "Shade Cloak",
   "Weaversong",
   "Cyclone Slash"
  ],
  "note": "HP is combined: God Tamer 600 plus the Beast 450. The Colosseum has no checkpoints, so losing means restarting the Trial of the Fool. If the Tamer dies first the Beast keeps fighting.",
  "source": "https://hollowknight.wiki/w/God_Tamer"
 },
 "gorb": {
  "hp": 200,
  "attacks": [
   "Spear Cast: ring of 8 spears, repeated more often as HP drops (2 waves at 70%, 3 at 40%)",
   "Directed Spear: one aimed spear every 1-2 seconds",
   "Teleport to a random spot in the arena"
  ],
  "tips": [
   "Spear Cast is slow enough to dodge with good timing",
   "Melee is awkward because his spears cluster around him; ranged attacks and spells avoid the problem",
   "Shade Cloak makes close-range nail hits easier"
  ],
  "bring": [
   "Shade Cloak",
   "Spells"
  ],
  "note": "HP scales with Nail upgrades (hp = Nail 0). Spirit appears at his tomb once you have the Dream Nail.",
  "source": "https://hollowknight.wiki/w/Gorb",
  "hpByNail": [
   200,
   320,
   416,
   500,
   570
  ],
  "essence": 100
 },
 "xero": {
  "hp": 200,
  "attacks": [
   "Nail Cast: spawns 2 glowing nails, shoots one at you and pulls it back (the return still hurts)",
   "After 50% HP: 2 extra nails and a shot every ~0.75 seconds"
  ],
  "tips": [
   "Dodge with dashes, especially Shadow Dash",
   "Great Slash and Dash Slash deal good damage; Vengeful Spirit/Shade Soul has huge range",
   "Heal by dodging a nail and standing on the opposite side of Xero's path, or retreat to the far left off the platform"
  ],
  "bring": [
   "Shade Cloak",
   "Quick Focus",
   "Shape of Unn",
   "Great Slash",
   "Dash Slash",
   "Vengeful Spirit"
  ],
  "note": "He only has one attack type. HP scales with Nail upgrades (hp = Nail 0).",
  "source": "https://hollowknight.wiki/w/Xero",
  "hpByNail": [
   200,
   320,
   416,
   500,
   570
  ],
  "essence": 100
 },
 "marmu": {
  "hp": 200,
  "attacks": [
   "Hurl: curls into a ball and throws herself at you from various angles (inaccurate)",
   "Teleport to a random part of the arena",
   "Gains speed after bouncing off a wall or ceiling"
  ],
  "tips": [
   "Stay underneath her and hit upward to juggle her",
   "Stick to a corner to limit the angles she can attack from",
   "Healing is safer during Hurl because it is inaccurate; Baldur Shell can block stray hits"
  ],
  "bring": [
   "Quick Slash",
   "Thorns of Agony",
   "Spore Shroom",
   "Longnail",
   "Mark of Pride",
   "Quick Focus",
   "Shape of Unn",
   "Baldur Shell"
  ],
  "note": "In Queen's Gardens, west of Stag Station. HP scales with Nail upgrades (hp = Nail 0).",
  "source": "https://hollowknight.wiki/w/Marmu",
  "hpByNail": [
   200,
   320,
   416,
   500,
   570
  ],
  "essence": 150
 },
 "elder-hu": {
  "hp": 250,
  "attacks": [
   "Ring Slam: rings appear mid-air with safe gaps, then slam down together",
   "Ring Curtain: pairs of rings slam down from the arena edges toward the center",
   "Teleport to dodge or set up attacks"
  ],
  "tips": [
   "He stays put during ring attacks and floats low enough to hit; dodge the rings and strike in the gaps",
   "Alternative: Shade Cloak through Ring Slam, then finish fast with Howling Wraiths/Abyss Shriek"
  ],
  "bring": [
   "Shade Cloak",
   "Shaman Stone",
   "Spell Twister",
   "Soul Catcher",
   "Soul Eater",
   "Howling Wraiths",
   "Abyss Shriek"
  ],
  "note": "Fought at his memorial in eastern Fungal Wastes. Shade Cloak is highly recommended but not required. HP scales with Nail upgrades (hp = Nail 0).",
  "source": "https://hollowknight.wiki/w/Elder_Hu",
  "hpByNail": [
   250,
   420,
   550,
   600,
   650
  ],
  "essence": 100
 },
 "galien": {
  "hp": 230,
  "attacks": [
   "Spinning Scythe: bouncing, spinning scythe that slowly tracks you",
   "Dream Scythes: two small drifting scythes, spawned at 70% and 40% HP"
  ],
  "tips": [
   "Kill him quickly, because the Dream Scythes become overwhelming if he lives",
   "Stay on the ground and hit upward; Howling Wraiths/Abyss Shriek is very effective, especially at the start",
   "Use Shade Cloak only when a hit is unavoidable; count the scythe's bounces to find safe healing windows"
  ],
  "bring": [
   "Shade Cloak",
   "Howling Wraiths",
   "Abyss Shriek",
   "Vengeful Spirit",
   "Shade Soul",
   "Desolate Dive",
   "Descending Dark",
   "Nail Arts"
  ],
  "note": "A Lifeblood Cocoon sits on a short path left of his corpse in Deepnest. HP scales with Nail upgrades (hp = Nail 0).",
  "source": "https://hollowknight.wiki/w/Galien",
  "hpByNail": [
   230,
   368,
   479,
   570,
   640
  ],
  "essence": 200
 },
 "no-eyes": {
  "hp": 200,
  "attacks": [
   "Spirit Summon: spirits glide across the screen in bobbing wave patterns, spawning faster as her HP drops",
   "Teleport to a random spot, then hover until the next teleport"
  ],
  "tips": [
   "She never attacks directly; the fight is slow and predictable but can drag on",
   "Use SOUL-generating charms since chances to hit her are scarce",
   "Stand at the center of the ground platform, where spirits almost never hit, and use hit-and-run to attack and heal"
  ],
  "bring": [],
  "note": "Her statue spirit appears only after you have the Dream Nail and bought the Lumafly Lantern. HP scales with Nail upgrades (hp = Nail 0).",
  "source": "https://hollowknight.wiki/w/No_Eyes",
  "hpByNail": [
   200,
   320,
   416,
   500,
   570
  ],
  "essence": 200
 },
 "markoth": {
  "hp": 250,
  "attacks": [
   "Dreamshield Summon: orbiting shield that blocks hits and hurts on contact (a second one at 50% HP)",
   "Nail Barrage: aimed nail every 1-2 seconds, faster at 50% HP",
   "Shield Cyclone: spins the shield outward in a widening radius, then retracts it"
  ],
  "tips": [
   "Heal during Shield Cyclone, when the shield's range is limited",
   "Nails stop homing once launched and are slow, so they are easy to dodge",
   "Wall-slide with Mantis Claw and shoot Vengeful Spirit/Shade Soul; he moves slowly and has a big hitbox"
  ],
  "bring": [
   "Shape of Unn",
   "Mantis Claw",
   "Vengeful Spirit",
   "Shade Soul"
  ],
  "note": "You need the Shade Cloak to pass the Shade Gate before his room. HP scales with Nail upgrades (hp = Nail 0).",
  "source": "https://hollowknight.wiki/w/Markoth",
  "hpByNail": [
   250,
   400,
   520,
   624,
   705
  ],
  "essence": 250
 },
 "failed-champion": {
  "hp": null,
  "attacks": [
   "Leaping Bludgeon: lower jump, more common after the first phase",
   "Slam: faster, with a larger and taller shockwave",
   "Falling barrels in every phase"
  ],
  "tips": [
   "He gives no SOUL: keep nearby Maggots alive and Dream Nail them to gain SOUL",
   "Hitting his armour during a stagger resets the timer, buying time for a Dream Nail hit or a Focus",
   "Dash under his jumps to avoid the mace; Desolate Dive/Descending Dark gives invincibility frames and damage"
  ],
  "bring": [
   "Shade Cloak",
   "Sharp Shadow",
   "Dream Wielder",
   "Quick Focus",
   "Desolate Dive",
   "Descending Dark",
   "Shaman Stone",
   "Dreamshield"
  ],
  "note": "Dream Nail the dead False Knight's body behind a breakable wall above its old arena. His health is armour (360 per stage, 3 stages) plus maggot head stages rather than one bar, so no single HP number.",
  "source": "https://hollowknight.wiki/w/Failed_Champion",
  "essence": 300
 },
 "soul-tyrant": {
  "hp": 1250,
  "attacks": [
   "Clock: six orbs in two rows of three rotate around him (back-to-back in phase 2)",
   "Slam: taller, larger, faster shockwaves; the phase 2 version has a much bigger radius",
   "Very rapid teleporting"
  ],
  "tips": [
   "Hitting him and filling SOUL is hard, so SOUL-generating charms help",
   "Safest heal is right after he vanishes during Clock, in the middle of the arena; you can also heal on the leftover side floor before phase 2",
   "In phase 2 there is almost no time to heal, so use high-damage spells while he summons orbs"
  ],
  "bring": [
   "Soul Catcher",
   "Soul Eater",
   "Abyss Shriek",
   "Descending Dark"
  ],
  "note": "Strike Soul Master's corpse with the Dream Nail. 1250 = 900 (phase 1) + 350 (phase 2). Rare soft-lock bug in phase 2 if he dies as you take damage.",
  "source": "https://hollowknight.wiki/w/Soul_Tyrant",
  "essence": 300
 },
 "lost-kin": {
  "hp": 1200,
  "attacks": [
   "Faster Broken Vessel moveset: Aerial Slash and Leap with quicker falls",
   "Slam releasing six Infection blobs instead of four",
   "Infected Balloons every 2-3 seconds, up to 6 alive at once"
  ],
  "tips": [
   "The balloons are the hardest part because their spawn rate can block healing",
   "Stay low to the ground, since he jumps a lot",
   "Quick Slash staggers him easily for a healing window; Desolate Dive/Descending Dark clears balloons and builds SOUL"
  ],
  "bring": [
   "Defender's Crest",
   "Quick Slash",
   "Shaman Stone",
   "Vengeful Spirit",
   "Shade Soul",
   "Descending Dark",
   "Shape of Unn",
   "Quick Focus"
  ],
  "note": "Dream Nail Broken Vessel near the far left of Ancient Basin. You wake beside him instead of dying, so Fragile charms do not break.",
  "source": "https://hollowknight.wiki/w/Lost_Kin",
  "essence": 400
 },
 "white-defender": {
  "hp": 1600,
  "attacks": [
   "Dung Toss: bouncing dung balls that last until they hit the floor twice",
   "Dive and Burst: goes underground and erupts elsewhere, releasing dung balls",
   "Spike Slam and Defender Jubilee: ground spikes that can't be jumped even with Monarch Wings",
   "Zeal: once, at 600 HP, six Ground Bursts in a row"
  ],
  "tips": [
   "Shade Soul can destroy a dung ball while hitting him; Howling Wraiths/Abyss Shriek hit hardest as he drops back to the ground after a burst",
   "The left and right corners are generally safe spots",
   "Zeal is a good time to heal if you have Shape of Unn"
  ],
  "bring": [
   "Quick Slash",
   "Mark of Pride",
   "Longnail",
   "Fragile Strength",
   "Unbreakable Strength",
   "Shade Soul",
   "Howling Wraiths",
   "Abyss Shriek"
  ],
  "note": "Beat Dung Defender and all three Dreamers first, then Dream Nail Dung Defender in the hidden room under the Royal Waterways. Can be fought up to 5 times, each win adds a mask of damage; he does not stagger.",
  "source": "https://hollowknight.wiki/w/White_Defender",
  "essence": 300
 },
 "grey-prince-zote": {
  "hp": null,
  "attacks": [
   "Flail: charges you, then falls and sends out shockwaves",
   "Zoteling Spit: spawns 1-3 Zotelings (hopping ones from fight 2)",
   "Shadow Slam, Nail Slam and Leap: slams and shockwaves, sometimes chained",
   "Summon Bombs: 3-4 Volatile Zotelings, from the third fight on"
  ],
  "tips": [
   "Heal when he is staggered or during Zoteling and bomb summons; Quick Focus, Deep Focus and Shape of Unn help",
   "Clear Zotelings fast with nail charms; the wiki recommends Shade Soul and Descending Dark for spells",
   "Healing gets very difficult around the 8th fight"
  ],
  "bring": [
   "Quick Focus",
   "Deep Focus",
   "Shape of Unn",
   "Quick Slash",
   "Fragile Strength",
   "Unbreakable Strength",
   "Mark of Pride",
   "Longnail"
  ],
  "note": "Needs Bretta and Zote saved, Zote beaten in the Colosseum of Fools, and Monarch Wings to open the basement; strike the statue with the Dream Nail. Health rises 100 per fight from 1200 up to a 1500 cap (fight 4+). Essence only on the first win; Golden Zote Statue on the tenth. You wake beside the statue instead of dying.",
  "source": "https://hollowknight.wiki/w/Grey_Prince_Zote",
  "essence": 300
 },
 "troupe-master-grimm": {
  "hp": 800,
  "attacks": [
   "Fire Bats: three bats launched while he stays still",
   "Dive Dash and Dash Uppercut: drill-and-dash, then an uppercut raining five fireballs",
   "Cloak Spikes: floor spikes with gaps, dangerous only briefly at full height",
   "Pufferfish: fireball burst at 75%, 50% and 25% HP"
  ],
  "tips": [
   "Heal during the Cloak Spikes window; Quick Focus helps and Shape of Unn allows safe healing during Fire Bats",
   "Shade Cloak dashes through both dash attacks; standing beside the Dash Uppercut impact avoids all five fireballs",
   "Great Slash and Dash Slash keep you at range; stay near a screen edge and hop slightly for Pufferfish"
  ],
  "bring": [
   "Grimmchild",
   "Quick Focus",
   "Shape of Unn",
   "Sharp Shadow",
   "Shade Cloak",
   "Shaman Stone",
   "Abyss Shriek",
   "Grubsong"
  ],
  "note": "Grimmchild charm is required to start the fight. The wiki says the Troupe also disappears if you help Brumm banish them instead of facing the King. hp is the Nail 0 value.",
  "source": "https://hollowknight.wiki/w/Troupe_Master_Grimm",
  "hpByNail": [
   800,
   800,
   800,
   930,
   1000
  ]
 },
 "nightmare-king-grimm": {
  "hp": 1500,
  "attacks": [
   "Fire Bats: four bats in a high/low pattern, two more if you get close",
   "Dive Dash: leaves a damaging flame trail on both the dive and the dash",
   "Dash Uppercut: shorter pause, then six fireballs",
   "Flame Pillars: four pillars erupt in sequence (plus faster Cloak Spikes and Pufferfish)"
  ],
  "tips": [
   "Dash or jump through Fire Bats; Shade Cloak is the safest way",
   "Jump or dash past Dive Dash, then down-strike or Great Slash while he stands up",
   "Healing windows exist during Fire Bats, Dash Uppercut, Cloak Spikes and his stagger; Shape of Unn and Quick Focus with Deep Focus make it easier"
  ],
  "bring": [
   "Grimmchild",
   "Shade Cloak",
   "Dreamshield",
   "Sharp Shadow",
   "Longnail",
   "Mark of Pride",
   "Nailmaster's Glory",
   "Shape of Unn"
  ],
  "note": "Grimmchild must be equipped to start the fight. The wiki page does not describe a missable Banishment choice (only that he can be unlocked in the Hall of Gods after defeating him or banishing the Troupe).",
  "source": "https://hollowknight.wiki/w/Nightmare_King_Grimm"
 },
 "absolute-radiance": {
  "hp": 2181,
  "attacks": [
   "Beam Burst, Orb and Sword Burst: fast, homing or rotated projectile patterns",
   "Sword Rain, Sword Wall and Wall of Light: falling swords and sweeping walls",
   "Spike Floor: blocks half the floor (constant in phase 3)",
   "Big Beam (phase 5) and Orb Barrage (phase 6) in the final phases"
  ],
  "tips": [
   "Panic heals are costly because she deals double damage and attacks often",
   "Only Shadow Dash or Descending Dark dodges Wall of Light; orbs can be destroyed with the floor, platforms or a shadow dash",
   "In phase 4, staying on one platform and waiting for her is slow but reliable"
  ],
  "bring": [
   "Fragile Strength",
   "Unbreakable Strength",
   "Longnail",
   "Mark of Pride",
   "Quick Slash",
   "Shaman Stone",
   "Spell Twister",
   "Quick Focus"
  ],
  "note": "Godhome / beyond-112% boss: final fight of the Pantheon of Hallownest (after Pure Vessel). The infobox 2181 HP is listed under Ascended; Attuned is not stated on the page. Dream Nail only works in phase 4.",
  "source": "https://hollowknight.wiki/w/Absolute_Radiance"
 }
},
    ROOTS: {
 "root-1": {
  "where": "Main Forgotten Crossroads area (not the Ancestral Mound sub-area). The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-2": {
  "where": "Inside the Ancestral Mound, the Crossroads sub-area where the Snail Shaman and Elder Baldur are. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Ancestral_Mound"
 },
 "root-3": {
  "where": "In the Fungal Wastes, above Mantis Village (the area page words it 'near Mantis Village').",
  "reach": "Area-level note from the Fungal Wastes page (not root-specific): the Mothwing Cloak is required to progress into the Fungal Wastes from the Fog Canyon and Forgotten Crossroads entrances.",
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-4": {
  "where": "In the City of Tears, near the City Storerooms (the two caverns bordering the Fungal Wastes).",
  "reach": null,
  "source": "https://hollowknight.wiki/w/City_of_Tears"
 },
 "root-5": {
  "where": "Howling Cliffs. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-6": {
  "where": "Crystal Peak. The wiki lists it only at area level and gives no room, landmark or bench. The wiki does not tie it to Hallownest's Crown or the Crystallised Mound.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-7": {
  "where": "Main Resting Grounds area. The Seer's dialogue on the wiki points to a root just outside her home, at the top of the tall north-east part of the area.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Seer"
 },
 "root-8": {
  "where": "In the Spirits' Glade sub-area of the Resting Grounds, which is entered through the door just outside the Seer's home.",
  "reach": "The Seer opens the Spirits' Glade door when you bring her 200 Essence. The wiki names no movement ability for it.",
  "source": "https://hollowknight.wiki/w/Seer"
 },
 "root-9": {
  "where": "In the Royal Waterways at the broken lift (the wiki's area page also says 'near Ancient Basin').",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-10": {
  "where": "Greenpath. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-11": {
  "where": "In the Fungal Wastes, near Fog Canyon.",
  "reach": "Area-level note from the Fungal Wastes page (not root-specific): the Mothwing Cloak is required to progress into the Fungal Wastes from the Fog Canyon and Forgotten Crossroads entrances.",
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-12": {
  "where": "Queen's Gardens. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-13": {
  "where": "Kingdom's Edge. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-14": {
  "where": "Deepnest. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 },
 "root-15": {
  "where": "The Hive. The wiki lists it only at area level and gives no room, landmark or bench.",
  "reach": null,
  "source": "https://hollowknight.wiki/w/Whispering_Root"
 }
},
    MISSABLES: [
 {
  "id": "grimm-ritual-or-banishment",
  "title": "Grimm ritual vs Banishment",
  "warning": "Finishing the ritual (Nightmare King Grimm) and Banishing the Troupe are mutually exclusive: only one can be unlocked per save profile. Banishing removes the Grimmchild charm and swaps it for Carefree Melody (from Nymm in Dirtmouth); the wiki's completion table gives the Grimm Troupe pair one shared 1% slot either way.",
  "avoid": "Decide before you go to the Nightmare Lantern room with Brumm. If you want Grimmchild at level 4 and Nightmare King Grimm, never help Brumm break the brazier; if you want every Unbreakable charm, buy them first (see the next entry).",
  "items": [
   "nightmare-king-grimm",
   "banishment",
   "grimmchild",
   "carefree-melody",
   "grimmchild-ritual",
   "grimmchild-slot",
   "brumm"
  ],
  "severity": "choice",
  "source": "https://hollowknight.wiki/w/The_Grimm_Troupe_(Quest)"
 },
 {
  "id": "banishment-unbreakable-lock",
  "title": "Banishment locks out Unbreakable charms",
  "warning": "If you Banish the Troupe, any Unbreakable charm you have not yet acquired becomes permanently unobtainable. If Divine was holding a consumed Fragile charm at that moment, it is left on the ground in its Fragile form.",
  "avoid": "Finish every Fragile-to-Unbreakable upgrade with Divine (9,000 / 12,000 / 15,000 Geo for Greed / Heart / Strength) before destroying the Nightmare Lantern, or take the ritual route instead.",
  "items": [
   "unbreakable-heart",
   "unbreakable-greed",
   "unbreakable-strength",
   "fragile-heart",
   "fragile-greed",
   "fragile-strength",
   "banishment"
  ],
  "severity": "permanent",
  "source": "https://hollowknight.wiki/w/Divine"
 },
 {
  "id": "banishment-brumm-room",
  "title": "Leaving Brumm's lantern room early",
  "warning": "Inside the Nightmare Lantern room, if you leave after talking to Brumm but before breaking the brazier, Brumm disappears and Banishment becomes unavailable forever.",
  "avoid": "If you intend to Banish, talk to Brumm and break the brazier without leaving the room. If you do not want to Banish, you can simply skip Brumm there.",
  "items": [
   "banishment",
   "brumm",
   "nightmare-lantern"
  ],
  "severity": "permanent",
  "source": "https://hollowknight.wiki/w/Brumm"
 },
 {
  "id": "divine-holds-charm",
  "title": "Divine consumes your Fragile charm",
  "warning": "To upgrade, Divine asks for an equipped Fragile charm, eats it, and only later asks for Geo; her dialogue warns that a gift is lost to you forever. While she holds it, that charm does not count for completion percentage, and the charm count needed for Salubra's purchases drops by one.",
  "avoid": "Walk up with the full price in hand (9,000 Greed, 12,000 Heart, 15,000 Strength) and finish each exchange before checking your completion or Salubra's Blessing. If several Fragile charms are equipped she takes Heart first, then Greed, then Strength.",
  "items": [
   "unbreakable-heart",
   "unbreakable-greed",
   "unbreakable-strength",
   "fragile-heart",
   "fragile-greed",
   "fragile-strength"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Divine"
 },
 {
  "id": "fragile-charms-break",
  "title": "Fragile charms break on death",
  "warning": "Fragile Heart, Greed and Strength break when the Knight dies and cannot be equipped until Leg Eater repairs them for Geo (200 / 150 / 350, or 160 / 120 / 280 with Defender's Crest).",
  "avoid": "Keep spare Geo for repairs and consider unequipping them before risky boss fights or hazard areas.",
  "items": [
   "fragile-heart",
   "fragile-greed",
   "fragile-strength"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Leg_Eater"
 },
 {
  "id": "nailsmith-kill-or-spare",
  "title": "Nailsmith: kill or spare",
  "warning": "After the Pure Nail is forged, the Nailsmith asks to be cut down. Killing him gives the Purity achievement; sparing him lets you find him with Sheo for Happy Couple. The two achievements are mutually exclusive on one save because the game autosaves right after he dies. The wiki does not list any lost nail upgrade or completion change.",
  "avoid": "Finish all four nail upgrades first. For Happy Couple he only moves to Sheo's hut once you have Great Slash and then rest on a bench or use the Stagways, so learn Great Slash before choosing to spare him.",
  "items": [
   "nail-4"
  ],
  "severity": "choice",
  "source": "https://hollowknight.wiki/w/Nailsmith"
 },
 {
  "id": "void-heart-blocks-ending-one",
  "title": "Void Heart locks out the plain Hollow Knight ending",
  "warning": "Once you hold Void Heart, the plain 'The Hollow Knight' ending can no longer be unlocked on that save profile. Void Heart replaces Kingsoul, cannot be unequipped (outside Godhome's Binding), and is needed for the Sealed Siblings and Dream No More endings. After any ending the profile reverts to its state before the final bosses.",
  "avoid": "If you want all three base endings, clear The Hollow Knight ending first, before taking Void Heart in the Birthplace; the Sealed Siblings and Dream No More endings come afterwards.",
  "items": [
   "void-heart",
   "kingsoul",
   "ending-thk",
   "ending-sealed-siblings",
   "ending-dream-no-more"
  ],
  "severity": "permanent",
  "source": "https://hollowknight.wiki/w/Endings_(Hollow_Knight)"
 },
 {
  "id": "kingsoul-needs-both-halves",
  "title": "Kingsoul counts only when complete",
  "warning": "Each half of the White Fragment does not count as a charm; Kingsoul only counts toward charm count, Salubra purchases and completion once both halves are combined. It shares one 1% slot with Void Heart, which later replaces it permanently.",
  "avoid": "Collect both fragments (White Lady in Queen's Gardens, and the Pale King's body after the White Palace) before checking completion; do not expect extra % from Void Heart on top of Kingsoul.",
  "items": [
   "kingsoul",
   "white-fragment-queen",
   "white-fragment-king",
   "void-heart"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Kingsoul"
 },
 {
  "id": "banish-then-nymm",
  "title": "Take Carefree Melody after banishing",
  "warning": "Banishing while holding Grimmchild lowers the charm count Salubra requires by one; obtaining Carefree Melody (from Nymm in Dirtmouth) restores it. Her Blessing needs all 40 charms.",
  "avoid": "After Banishment, talk to Nymm in Dirtmouth for Carefree Melody before buying Salubra's Blessing.",
  "items": [
   "carefree-melody",
   "grimmchild",
   "banishment"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Salubra"
 },
 {
  "id": "grimmchild-blocks-banking",
  "title": "Grimmchild and Carefree Melody block Millibelle's bank",
  "warning": "Grimmchild (beyond its first phase) and Carefree Melody both stop the Knight from using Millibelle's banking service in Fog Canyon.",
  "avoid": "Unequip them before banking Geo with Millibelle, especially before spending large sums or risking a death.",
  "items": [
   "grimmchild",
   "carefree-melody"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Grimmchild"
 },
 {
  "id": "shade-geo-loss",
  "title": "Dying twice loses Geo for good",
  "warning": "A death leaves a Shade holding your Geo. If you die again before killing it, the earlier Shade disappears and its Geo is lost for good. Until the Shade is killed, your SOUL meter is limited to 66.",
  "avoid": "Recover your Shade before attempting anything risky. Jiji can summon it to her room for a Rancid Egg if it is stuck somewhere unreachable.",
  "items": [],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Shade"
 },
 {
  "id": "delicate-flower-fragile",
  "title": "Delicate Flower is easily destroyed",
  "warning": "The Delicate Flower is destroyed if you take any damage or ride the Stagways, becoming a worthless Ruined Flower. The Mask Shard reward comes from delivering it to the Traitors' Child grave and returning to the Grey Mourner.",
  "avoid": "Walk it there carefully (trams and Dreamgates are safe). If it breaks, take another flower from the Grey Mourner and try again.",
  "items": [
   "delicate-flower",
   "mask-grey-mourner"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Delicate_Flower"
 },
 {
  "id": "zote-greenpath-death",
  "title": "Zote can die in Greenpath",
  "warning": "Per the wiki, Zote dies in Greenpath if he is not saved before you get the Mantis Claw, or if you enter either room between Relic Seeker Lemm and Cornifer in the City of Tears, or the Deepnest Hot Spring room, first. Hitting his shell then gives the Neglect achievement. The wiki does not say whether this can be undone or that it changes completion percentage; its Colosseum entry says he later becomes the final boss of the Trial of the Warrior after being saved twice.",
  "avoid": "Free Zote in Greenpath (Vengefly King) before picking up the Mantis Claw if you want him alive for the Colosseum.",
  "items": [
   "vengefly-king",
   "mantis-claw"
  ],
  "severity": "caution",
  "source": "https://hollowknight.wiki/w/Zote_the_Mighty"
 },
 {
  "id": "godseeker-delicate-flower-ending",
  "title": "Delicate Flower to the Godseeker",
  "warning": "Giving the Delicate Flower to the Godseeker makes the normal 'Embrace the Void' Godhome ending inaccessible. The Godseeker needs the Godtuner and Pantheons 1 and 2 for that dialogue, and both variants grant the same achievement.",
  "avoid": "Only give her the flower if you specifically want the flower variant; the wiki says there is little reason to do both for the achievement.",
  "items": [
   "ending-embrace-void",
   "ending-delicate-flower",
   "delicate-flower"
  ],
  "severity": "choice",
  "source": "https://hollowknight.wiki/w/Endings_(Hollow_Knight)"
 }
]
  };
  root.HK = root.HK || {};
  root.HK.GUIDE = GUIDE;
  if (typeof module !== 'undefined' && module.exports) module.exports = GUIDE;
})(typeof window !== 'undefined' ? window : globalThis);
