/*
 * Hollow Knight Companion — MAP GEOMETRY (original drawing)
 * ---------------------------------------------------------------
 * A hand-drawn, simplified "rooms and corridors" redrawing of Hallownest made for this site.
 * It follows the real relative geography of the areas (what is above / below / beside what) and
 * places named sub-areas where they are, but it is NOT a copy or tracing of the official map:
 * room shapes, sizes and corridors are simplified and approximate.
 *
 * Units: a 2000 × 1640 canvas. Rooms are [x, y, w, h].
 */
(function (root) {
  'use strict';
  var W = 2000, H = 1640;

  var ROOMS = {
    'howling-cliffs': [[60, 50, 90, 40], [140, 64, 60, 14], [190, 40, 140, 70], [200, 110, 30, 120], [230, 150, 120, 40], [120, 170, 90, 80],
      [110, 240, 180, 22], [300, 180, 24, 130], [320, 260, 90, 60], [230, 300, 90, 30], [96, 90, 22, 80]],
    'dirtmouth': [[440, 250, 160, 40], [470, 290, 120, 30], [598, 262, 44, 16], [640, 210, 330, 60], [960, 232, 50, 40], [790, 270, 24, 70],
      [690, 268, 80, 18], [700, 196, 110, 16]],
    'crystal-peak': [[1040, 200, 220, 30], [1060, 150, 40, 60], [1100, 250, 250, 28], [1260, 170, 170, 30], [1380, 40, 70, 150], [1430, 40, 80, 40],
      [1450, 120, 110, 170], [1480, 290, 90, 100], [1300, 300, 170, 30], [1180, 320, 140, 60], [1320, 350, 100, 50], [1150, 400, 180, 40],
      [1380, 410, 90, 50], [1150, 440, 26, 26], [1120, 100, 120, 30], [1230, 120, 24, 60]],
    'greenpath': [[60, 400, 180, 40], [60, 440, 40, 200], [100, 470, 150, 30], [230, 420, 200, 40], [420, 440, 200, 40], [560, 470, 60, 60],
      [260, 480, 40, 140], [300, 540, 200, 40], [120, 600, 180, 40], [380, 580, 40, 130], [420, 640, 120, 70], [200, 660, 200, 40],
      [60, 680, 160, 70], [240, 730, 140, 30], [480, 500, 24, 60], [150, 520, 90, 40]],
    'forgotten-crossroads': [[760, 380, 90, 40], [640, 410, 140, 60], [680, 470, 30, 160], [800, 420, 340, 30], [960, 390, 90, 40],
      [820, 460, 110, 70], [940, 470, 30, 170], [980, 520, 180, 40], [1180, 450, 110, 40], [1240, 490, 30, 200], [700, 600, 240, 30],
      [740, 640, 120, 50], [980, 600, 240, 30], [1080, 630, 60, 70], [1130, 630, 110, 40], [1180, 670, 130, 40], [1270, 570, 40, 30],
      [1040, 470, 120, 30], [720, 520, 100, 30]],
    'resting-grounds': [[1330, 500, 120, 50], [1450, 480, 40, 140], [1490, 470, 150, 40], [1520, 510, 100, 50], [1340, 580, 140, 40],
      [1490, 580, 150, 40], [1560, 620, 80, 80], [1360, 640, 140, 30], [1400, 690, 240, 52]],
    'fog-canyon': [[390, 790, 130, 60], [520, 800, 240, 40], [700, 780, 90, 50], [480, 840, 40, 140], [540, 850, 160, 50], [600, 900, 40, 60],
      [580, 950, 160, 50], [420, 960, 150, 30], [660, 840, 30, 60]],
    'queens-gardens': [[60, 800, 180, 50], [40, 840, 40, 120], [120, 860, 200, 40], [300, 840, 50, 90], [150, 900, 120, 80], [60, 970, 120, 40],
      [200, 990, 140, 40], [40, 1010, 60, 90], [110, 1050, 240, 40], [280, 1080, 70, 30], [240, 920, 30, 70]],
    'fungal-wastes': [[400, 1010, 140, 50], [540, 1020, 180, 30], [700, 1010, 110, 60], [440, 1060, 30, 150], [480, 1080, 240, 40],
      [380, 1100, 60, 60], [560, 1120, 40, 90], [620, 1140, 180, 40], [400, 1170, 160, 60], [380, 1220, 120, 50], [560, 1220, 100, 30],
      [640, 1210, 140, 70]],
    'city-of-tears': [[860, 780, 120, 40], [840, 820, 40, 150], [880, 840, 150, 50], [920, 890, 110, 60], [880, 960, 120, 40], [1030, 850, 40, 180],
      [1070, 870, 200, 40], [1060, 930, 300, 30], [1270, 780, 50, 140], [1320, 790, 80, 50], [1180, 970, 140, 60], [1330, 1000, 80, 70],
      [1400, 880, 70, 120], [1000, 1040, 200, 30], [1150, 820, 110, 50]],
    'royal-waterways': [[840, 1120, 120, 40], [920, 1150, 30, 100], [950, 1170, 300, 30], [960, 1200, 120, 50], [840, 1230, 100, 40],
      [1100, 1140, 140, 30], [1250, 1150, 170, 40], [1300, 1200, 120, 60], [1020, 1240, 60, 30], [1160, 1200, 30, 60]],
    'kingdoms-edge': [[1520, 752, 140, 56], [1600, 800, 40, 150], [1640, 820, 160, 40], [1780, 800, 50, 200], [1830, 850, 70, 90],
      [1660, 880, 120, 60], [1640, 940, 30, 240], [1680, 980, 100, 40], [1740, 1020, 130, 60], [1700, 1100, 120, 60], [1530, 1220, 140, 60],
      [1680, 1240, 100, 50], [1560, 1180, 80, 40]],
    'the-hive': [[1650, 1400, 80, 50], [1720, 1330, 120, 60], [1700, 1380, 40, 80], [1760, 1400, 120, 60], [1740, 1460, 80, 20]],
    'deepnest': [[160, 1290, 180, 60], [60, 1350, 120, 60], [60, 1420, 60, 130], [120, 1480, 160, 60], [200, 1360, 240, 30], [300, 1390, 40, 130],
      [340, 1440, 160, 50], [420, 1330, 120, 50], [540, 1300, 180, 40], [520, 1340, 60, 100], [400, 1520, 200, 40], [600, 1470, 120, 90],
      [180, 1420, 100, 40]],
    'ancient-basin': [[850, 1290, 120, 40], [780, 1330, 200, 40], [780, 1370, 90, 100], [960, 1330, 40, 140], [1000, 1320, 160, 40],
      [1000, 1380, 200, 40], [1180, 1300, 130, 90], [900, 1450, 240, 30]],
    'the-abyss': [[860, 1510, 120, 50], [960, 1500, 40, 110], [1000, 1560, 160, 40], [1150, 1510, 110, 60]],
    'white-palace': [[1350, 1520, 220, 40], [1420, 1560, 80, 40], [1440, 1490, 40, 30]],
    'godhome': [[1630, 1520, 260, 40], [1700, 1560, 120, 40], [1740, 1490, 40, 30]]
  };

  // Main label position per region
  var LABELS = {
    'howling-cliffs': [265, 82], 'dirtmouth': [805, 240], 'crystal-peak': [1240, 344], 'greenpath': [350, 560], 'forgotten-crossroads': [1060, 540],
    'resting-grounds': [1565, 490], 'fog-canyon': [620, 875], 'queens-gardens': [210, 940], 'fungal-wastes': [600, 1100], 'city-of-tears': [1170, 890],
    'royal-waterways': [1100, 1185], 'kingdoms-edge': [1720, 840], 'the-hive': [1800, 1430], 'deepnest': [330, 1465], 'ancient-basin': [1100, 1400],
    'the-abyss': [1080, 1580], 'white-palace': [1460, 1540], 'godhome': [1760, 1540]
  };

  // Named sub-areas (small labels when zoomed in) — anchors for markers
  var SUB = {
    'stag-nest': [105, 68, 'Stag Nest'], 'joni': [365, 290, "Joni's Repose"], 'mato': [165, 205, "Mato's hut"], 'cliffs-top': [260, 75, ''],
    'kings-pass': [520, 270, "King's Pass"], 'town': [800, 225, ''], 'graveyard': [985, 252, 'Graveyard'],
    'crown': [1470, 60, "Hallownest's Crown"], 'peak-lift': [1080, 175, 'Lift'], 'golems': [1525, 335, 'Golem tunnels'], 'peak-mid': [1250, 350, ''],
    'guardian': [1370, 375, 'Crystal Guardian'], 'peak-dark': [1240, 420, 'Dark room'], 'cr-mound': [1425, 435, 'Crystallised Mound'], 'peak-west': [1150, 215, ''],
    'peak-quirrel': [1180, 115, ''],
    'gp-nw': [150, 420, ''], 'gp-north': [330, 440, ''], 'gp-east': [585, 495, ''], 'gp-toll': [400, 560, ''], 'gp-stone': [480, 675, 'Stone Sanctuary'],
    'gp-unn': [140, 715, 'Lake of Unn'], 'gp-moss': [300, 680, ''], 'gp-west': [80, 560, ''], 'gp-south': [310, 745, ''], 'gp-mid': [195, 540, ''],
    'cx-well': [805, 400, ''], 'cx-egg': [1005, 410, 'Black Egg Temple'], 'cx-mound': [875, 495, 'Ancestral Mound'], 'cx-fk': [1070, 540, ''],
    'cx-gruz': [1235, 470, ''], 'cx-west': [700, 440, ''], 'cx-mawlek': [660, 450, ''], 'cx-spring': [800, 665, ''], 'cx-lift': [1110, 680, ''],
    'cx-stag': [1185, 650, ''], 'cx-village': [1245, 690, 'Deserted Village'], 'cx-tram': [1290, 585, 'Tram'], 'cx-myla': [1100, 485, ''],
    'cx-lowwest': [820, 615, ''], 'cx-shaft': [955, 600, ''],
    'rg-stag': [1385, 525, ''], 'rg-seer': [1600, 490, 'Seer'], 'rg-glade': [1570, 535, "Spirits' Glade"], 'rg-graves': [1410, 600, ''],
    'rg-crypts': [1540, 600, 'Crypts'], 'rg-mansion': [1600, 660, 'Grey Mansion'], 'rg-tram': [1430, 655, ''], 'rg-lake': [1520, 725, 'Blue Lake'],
    'rg-shrine': [1470, 545, 'Dreamer Shrine'],
    'fc-mound': [455, 820, 'Overgrown Mound'], 'fc-ne': [745, 805, ''], 'fc-mid': [620, 875, ''], 'fc-arch': [660, 975, "Teacher's Archives"],
    'fc-bank': [495, 975, ''], 'fc-west': [500, 900, ''],
    'qg-house': [150, 825, 'Greenhouse'], 'qg-west': [60, 900, ''], 'qg-stag': [210, 940, ''], 'qg-east': [325, 885, ''], 'qg-chapel': [270, 1010, 'Moss Chapel'],
    'qg-sw': [70, 1070, ''], 'qg-arena': [315, 1095, ''], 'qg-south': [200, 1070, ''], 'qg-mid': [220, 880, ''],
    'fw-station': [470, 1035, "Queen's Station"], 'fw-ne': [755, 1040, ''], 'fw-mid': [600, 1100, ''], 'fw-spore': [410, 1130, ''],
    'fw-mantis': [480, 1200, 'Mantis Village'], 'fw-lords': [440, 1245, ''], 'fw-south': [610, 1235, ''], 'fw-core': [710, 1245, 'Fungal Core'],
    'fw-east': [710, 1160, ''],
    'ct-store': [920, 800, 'City Storerooms'], 'ct-west': [955, 865, ''], 'ct-sanctum': [975, 920, 'Soul Sanctum'], 'ct-smith': [940, 980, ''],
    'ct-centre': [1170, 890, ''], 'ct-spire': [1295, 805, "Watcher's Spire"], 'ct-pleasure': [1250, 1000, 'Pleasure House'],
    'ct-love': [1370, 1035, 'Tower of Love'], 'ct-kings': [1435, 940, "King's Station"], 'ct-south': [1100, 1055, ''], 'ct-north': [1205, 845, ''],
    'rw-nw': [900, 1140, ''], 'rw-bench': [1100, 1185, ''], 'rw-dung': [1020, 1225, ''], 'rw-isma': [890, 1250, "Isma's Grove"],
    'rw-fluke': [1335, 1170, ''], 'rw-pit': [1360, 1230, 'Junk Pit'], 'rw-lift': [1050, 1255, ''], 'rw-west': [935, 1200, ''], 'rw-ne': [1170, 1155, ''],
    'ke-colo': [1590, 782, 'Colosseum of Fools'], 'ke-north': [1720, 840, ''], 'ke-shell': [1865, 895, 'Cast-Off Shell'], 'ke-bardoon': [1720, 910, ''],
    'ke-oro': [1805, 1050, ''], 'ke-markoth': [1760, 1130, ''], 'ke-tram': [1600, 1250, 'Tram'], 'ke-hive': [1730, 1265, ''], 'ke-mid': [1730, 1000, ''],
    'ke-shaft': [1655, 1060, ''], 'ke-sw': [1600, 1200, ''],
    'hv-sw': [1690, 1425, ''], 'hv-knight': [1780, 1360, ''], 'hv-queen': [1820, 1430, ''], 'hv-low': [1780, 1470, ''],
    'dn-village': [250, 1320, 'Distant Village'], 'dn-weaver': [120, 1380, "Weavers' Den"], 'dn-den': [200, 1510, "Beast's Den"],
    'dn-mid': [320, 1375, ''], 'dn-nosk': [420, 1465, ''], 'dn-spring': [480, 1355, ''], 'dn-upper': [630, 1320, ''], 'dn-galien': [550, 1390, ''],
    'dn-tramway': [500, 1540, 'Failed Tramway'], 'dn-tram': [660, 1515, 'Tram'], 'dn-west': [90, 1460, ''],
    'ab-tram': [910, 1310, 'Tram'], 'ab-west': [825, 1420, ''], 'ab-north': [880, 1350, ''], 'ab-fountain': [1080, 1340, ''], 'ab-toll': [1100, 1400, ''],
    'ab-palace': [1245, 1345, 'Palace Grounds'], 'ab-gate': [1020, 1465, 'Abyss gate'],
    'ay-west': [920, 1535, ''], 'ay-birth': [1080, 1580, 'Birthplace'], 'ay-light': [1205, 1540, 'Lighthouse'], 'ay-mid': [980, 1555, ''],
    'wp-s': [1380, 1540, ''], 'wp-c': [1460, 1580, ''], 'wp-n': [1540, 1540, ''], 'wp-throne': [1460, 1500, ''],
    'gh-a': [1660, 1540, ''], 'gh-b': [1760, 1580, ''], 'gh-c': [1860, 1540, ''], 'gh-top': [1760, 1500, '']
  };

  // Marker → sub-area. Static points of interest use "region|name"; checklist items use "item:<id>".
  var AT = {
    // Dirtmouth
    'dirtmouth|Dirtmouth Bench': 'town', 'dirtmouth|Dirtmouth Station': 'town', 'dirtmouth|Iselda — map shop': 'town', 'dirtmouth|Sly — shop': 'town',
    'dirtmouth|Confessor Jiji': 'graveyard', 'dirtmouth|Divine — Grimm Troupe': 'town', 'dirtmouth|Elderbug': 'town', "dirtmouth|Bretta's house": 'town',
    'dirtmouth|Grimm Troupe tent': 'town', "dirtmouth|Lifeblood Cocoon — King's Pass": 'kings-pass', 'dirtmouth|Well to the Forgotten Crossroads': 'town',
    'item:fury-of-the-fallen': 'kings-pass', 'item:flame-master-kings-pass': 'kings-pass', 'item:use-key-jiji': 'graveyard', 'item:grey-prince-zote': 'town',
    'item:troupe-master-grimm': 'town', 'item:nightmare-king-grimm': 'town',
    // Howling Cliffs
    "howling-cliffs|Mato's Hut Bench": 'mato', 'howling-cliffs|Stag Nest': 'stag-nest', 'howling-cliffs|Nailmaster Mato': 'mato',
    'howling-cliffs|Blue Child Joni': 'joni', 'item:jonis-blessing': 'joni', 'item:vessel-stag-nest': 'stag-nest', 'item:cyclone-slash': 'mato',
    'item:gorb': 'cliffs-top', 'item:baldur-shell': 'joni', 'item:nightmare-lantern': 'cliffs-top', 'item:all-stag-stations': 'stag-nest',
    // Crystal Peak
    'crystal-peak|Dark Room Bench': 'peak-dark', 'crystal-peak|Crystal Guardian Bench': 'guardian', 'crystal-peak|Snail Shaman — Crystallised Mound': 'cr-mound',
    'crystal-peak|Quirrel': 'peak-quirrel', 'crystal-peak|Lift to Dirtmouth': 'peak-lift', "crystal-peak|Hallownest's Crown": 'crown',
    'item:crystal-heart': 'golems', 'item:descending-dark': 'cr-mound', 'item:ore-crystal-peak': 'crown', 'item:crystal-guardian': 'guardian',
    'item:enraged-guardian': 'guardian', 'item:mask-enraged-guardian': 'guardian', 'item:deep-focus': 'peak-mid', 'item:shopkeepers-key': 'peak-west',
    'item:flame-novice-peak': 'peak-west',
    // Greenpath
    'greenpath|East Bench': 'gp-east', 'greenpath|Stone Sanctuary Bench': 'gp-stone', 'greenpath|Toll Bench': 'gp-toll', 'greenpath|Stag Station Bench': 'gp-nw',
    'greenpath|Lake of Unn Bench': 'gp-unn', "greenpath|Sheo's Hut Bench": 'gp-west', 'greenpath|Greenpath Station': 'gp-nw', 'greenpath|Nailmaster Sheo': 'gp-west',
    'greenpath|The Hunter': 'gp-stone', 'greenpath|Unn': 'gp-unn', 'greenpath|Quirrel': 'gp-unn', 'greenpath|Zote the Mighty': 'gp-north',
    'greenpath|Lifeblood Cocoon': 'gp-east', 'item:hornet-protector': 'gp-nw', 'item:mothwing-cloak': 'gp-nw', 'item:vengefly-king': 'gp-north',
    'item:no-eyes': 'gp-stone', 'item:mask-stone-sanctuary': 'gp-stone', 'item:shape-of-unn': 'gp-unn', 'item:great-slash': 'gp-west',
    'item:massive-moss-charger': 'gp-moss', 'item:thorns-of-agony': 'gp-mid', 'item:vessel-greenpath': 'gp-south', 'item:flame-novice-greenpath': 'gp-north',
    // Forgotten Crossroads
    'forgotten-crossroads|Hot Spring Bench': 'cx-spring', 'forgotten-crossroads|Stag Station Bench': 'cx-stag', 'forgotten-crossroads|Ancestral Mound Bench': 'cx-mound',
    "forgotten-crossroads|Salubra's Bench": 'cx-village', 'forgotten-crossroads|Black Egg Temple Bench': 'cx-egg', 'forgotten-crossroads|Forgotten Crossroads Station': 'cx-stag',
    'forgotten-crossroads|Salubra — charm shop': 'cx-village', 'forgotten-crossroads|Grubfather': 'cx-west', 'forgotten-crossroads|Snail Shaman — Ancestral Mound': 'cx-mound',
    'forgotten-crossroads|Sly (lost)': 'cx-village', 'forgotten-crossroads|Myla': 'cx-myla', 'forgotten-crossroads|Menderbug': 'cx-village',
    'forgotten-crossroads|Quirrel': 'cx-egg', 'forgotten-crossroads|Hot Spring': 'cx-spring', 'forgotten-crossroads|Upper Tram station': 'cx-tram',
    'forgotten-crossroads|Lifeblood Cocoon — Ancestral Mound': 'cx-mound', 'forgotten-crossroads|Temple of the Black Egg': 'cx-egg',
    'forgotten-crossroads|Lift to the City of Tears': 'cx-lift', 'forgotten-crossroads|The Hollow Knight': 'cx-egg', 'forgotten-crossroads|The Radiance': 'cx-egg',
    'item:false-knight': 'cx-fk', 'item:failed-champion': 'cx-fk', 'item:gruz-mother': 'cx-gruz', 'item:brooding-mawlek': 'cx-mawlek',
    'item:mask-mawlek': 'cx-mawlek', 'item:vengeful-spirit': 'cx-mound', 'item:soul-catcher': 'cx-mound', 'item:grubsong': 'cx-west',
    'item:grubberflys-elegy': 'cx-west', 'item:mask-grubfather': 'cx-west', 'item:ore-grubfather': 'cx-west', 'item:vessel-crossroads-lift': 'cx-lift',
    'item:glowing-womb': 'cx-gruz', 'item:city-crest': 'cx-fk', 'item:black-egg': 'cx-egg', 'item:ending-thk': 'cx-egg', 'item:ending-sealed-siblings': 'cx-egg',
    'item:ending-dream-no-more': 'cx-egg', 'item:shaman-stone': 'cx-village', 'item:steady-body': 'cx-village', 'item:longnail': 'cx-village',
    'item:quick-focus': 'cx-village', 'item:lifeblood-heart': 'cx-village', 'item:notch-salubra-1': 'cx-village', 'item:notch-salubra-2': 'cx-village',
    'item:notch-salubra-3': 'cx-village', 'item:notch-salubra-4': 'cx-village', 'item:mask-crossroads-goams': 'cx-shaft',
    // Resting Grounds
    'resting-grounds|Stag Station Bench': 'rg-stag', 'resting-grounds|Grey Mansion Bench': 'rg-mansion', 'resting-grounds|Resting Grounds Station': 'rg-stag',
    'resting-grounds|Seer': 'rg-seer', 'resting-grounds|Grey Mourner': 'rg-mansion', 'resting-grounds|Quirrel · Tiso': 'rg-lake',
    "resting-grounds|Cornifer's letter": 'rg-stag', 'resting-grounds|Upper Tram station': 'rg-tram', 'resting-grounds|Dreamer Shrine': 'rg-shrine',
    'item:xero': 'rg-graves', 'item:dream-nail': 'rg-shrine', 'item:awoken-dream-nail': 'rg-seer', 'item:seer-ascension': 'rg-seer',
    'item:soul-eater': 'rg-crypts', 'item:dreamshield': 'rg-crypts', 'item:dream-wielder': 'rg-seer', 'item:mask-seer': 'rg-seer', 'item:vessel-seer': 'rg-seer',
    'item:ore-seer': 'rg-seer', 'item:seer-seal': 'rg-seer', 'item:seer-glade': 'rg-glade', 'item:seer-dreamgate': 'rg-seer', 'item:seer-arcane-egg': 'rg-seer',
    'item:mask-grey-mourner': 'rg-mansion', 'item:delicate-flower': 'rg-mansion', 'item:flame-master-resting': 'rg-graves',
    // Fog Canyon
    "fog-canyon|Teacher's Archives Bench": 'fc-arch', 'fog-canyon|Millibelle the Banker': 'fc-bank', 'fog-canyon|Snail Shaman — Overgrown Mound': 'fc-mound',
    'fog-canyon|Monomon the Teacher': 'fc-arch', 'fog-canyon|Quirrel': 'fc-arch', 'fog-canyon|Lifeblood Cocoon': 'fc-mid',
    'item:uumuu': 'fc-arch', 'item:monomon': 'fc-arch', 'item:howling-wraiths': 'fc-mound', 'item:notch-fog-canyon': 'fc-ne',
    // Queen's Gardens
    "queens-gardens|Arena Bench": 'qg-arena', 'queens-gardens|Toll Bench': 'qg-sw', 'queens-gardens|Stag Station Bench': 'qg-stag',
    "queens-gardens|Queen's Gardens Station": 'qg-stag', 'queens-gardens|White Lady': 'qg-west', 'queens-gardens|Moss Prophet': 'qg-chapel',
    'item:traitor-lord': 'qg-house', 'item:white-fragment-queen': 'qg-west', 'item:marmu': 'qg-mid', 'item:love-key': 'qg-east', 'item:kingsoul': 'qg-west',
    // Fungal Wastes
    "fungal-wastes|Queen's Station Bench": 'fw-station', "fungal-wastes|Leg Eater's Bench": 'fw-ne', 'fungal-wastes|Mantis Village Bench (east shaft)': 'fw-mantis',
    'fungal-wastes|Mantis Village Bench (treasury)': 'fw-lords', "fungal-wastes|Queen's Station": 'fw-station', 'fungal-wastes|Leg Eater': 'fw-ne',
    'fungal-wastes|Bretta (lost)': 'fw-south', 'fungal-wastes|Willoh': 'fw-station', 'fungal-wastes|Cloth': 'fw-ne', 'fungal-wastes|Quirrel': 'fw-station',
    'fungal-wastes|Lifeblood Cocoon': 'fw-lords', 'item:mantis-lords': 'fw-lords', 'item:mantis-claw': 'fw-mantis', 'item:elder-hu': 'fw-ne',
    'item:mask-queens-station': 'fw-station', 'item:spore-shroom': 'fw-spore', 'item:dashmaster': 'fw-south', 'item:mark-of-pride': 'fw-lords',
    'item:fragile-heart': 'fw-ne', 'item:fragile-greed': 'fw-ne', 'item:fragile-strength': 'fw-ne', 'item:bretta-rescued': 'fw-south',
    'item:notch-shrumal': 'fw-east', 'item:flame-nightmare-core': 'fw-core',
    // City of Tears
    'city-of-tears|West Bench': 'ct-west', 'city-of-tears|City Storerooms Bench': 'ct-store', 'city-of-tears|Toll Bench': 'ct-sanctum',
    'city-of-tears|Pleasure House Bench': 'ct-pleasure', "city-of-tears|King's Station Bench": 'ct-kings', "city-of-tears|Watcher's Spire Bench": 'ct-spire',
    'city-of-tears|City Storerooms': 'ct-store', "city-of-tears|King's Station": 'ct-kings', 'city-of-tears|Nailsmith': 'ct-smith',
    'city-of-tears|Relic Seeker Lemm': 'ct-west', 'city-of-tears|Lurien the Watcher': 'ct-spire', 'city-of-tears|Millibelle': 'ct-pleasure',
    'city-of-tears|Marissa · Poggy Thorax': 'ct-pleasure', 'city-of-tears|Quirrel': 'ct-west', 'city-of-tears|Hot Spring': 'ct-pleasure',
    'city-of-tears|Soul Sanctum': 'ct-sanctum', 'city-of-tears|Tower of Love': 'ct-love',
    'item:soul-warrior': 'ct-sanctum', 'item:soul-master': 'ct-sanctum', 'item:soul-tyrant': 'ct-sanctum', 'item:desolate-dive': 'ct-sanctum',
    'item:spell-twister': 'ct-sanctum', 'item:watcher-knights': 'ct-spire', 'item:lurien': 'ct-spire', 'item:the-collector': 'ct-love',
    'item:vessel-kings-station': 'ct-kings', 'item:shade-soul': 'ct-sanctum', 'item:nail-1': 'ct-smith', 'item:nail-2': 'ct-smith', 'item:nail-3': 'ct-smith',
    'item:nail-4': 'ct-smith', 'item:use-key-pleasure-house': 'ct-pleasure', 'item:use-key-waterways': 'ct-south', 'item:key-city': 'ct-centre',
    'item:access-city': 'ct-north', 'item:flame-novice-city': 'ct-north',
    // Royal Waterways
    'royal-waterways|Waterways Bench': 'rw-bench', 'royal-waterways|Godseeker (cocoon)': 'rw-pit', 'royal-waterways|Tuk': 'rw-west',
    'royal-waterways|Fluke Hermit': 'rw-west', 'royal-waterways|Junk Pit': 'rw-pit', "royal-waterways|Isma's Grove": 'rw-isma',
    'item:dung-defender': 'rw-dung', 'item:white-defender': 'rw-dung', 'item:defenders-crest': 'rw-dung', 'item:flukemarm': 'rw-fluke',
    'item:flukenest': 'rw-fluke', 'item:ismas-tear': 'rw-isma', 'item:mask-waterways': 'rw-nw', 'item:use-key-godseeker': 'rw-pit',
    'item:flame-nightmare-waterways': 'rw-ne',
    // Kingdom's Edge
    "kingdoms-edge|Oro's Hut Bench": 'ke-oro', 'kingdoms-edge|Colosseum Bench': 'ke-colo', "kingdoms-edge|Hornet's Tent Bench": 'ke-shell',
    'kingdoms-edge|Nailmaster Oro': 'ke-oro', 'kingdoms-edge|Little Fool — Colosseum': 'ke-colo', 'kingdoms-edge|Bardoon': 'ke-bardoon',
    'kingdoms-edge|Zote / Tiso': 'ke-colo', 'kingdoms-edge|Hot Spring': 'ke-colo', 'kingdoms-edge|Lower Tram station': 'ke-tram',
    'kingdoms-edge|Lifeblood Cocoon': 'ke-bardoon', 'kingdoms-edge|Cast-Off Shell': 'ke-shell', 'kingdoms-edge|Colosseum of Fools': 'ke-colo',
    'item:hornet-sentinel': 'ke-shell', 'item:kings-brand': 'ke-shell', 'item:markoth': 'ke-markoth', 'item:dash-slash': 'ke-oro',
    'item:quick-slash': 'ke-oro', 'item:trial-warrior': 'ke-colo', 'item:trial-conqueror': 'ke-colo', 'item:trial-fool': 'ke-colo',
    'item:oblobbles': 'ke-colo', 'item:god-tamer': 'ke-colo', 'item:notch-colosseum': 'ke-colo', 'item:ore-colosseum': 'ke-colo',
    'item:pale-lurker': 'ke-colo', 'item:key-lurker': 'ke-colo', 'item:flame-master-edge': 'ke-mid',
    // Hive
    'the-hive|Hive Bench': 'hv-sw', 'the-hive|Hive Queen Vespa': 'hv-queen', 'the-hive|Hive entrance': 'hv-sw',
    'item:hive-knight': 'hv-knight', 'item:hiveblood': 'hv-low', 'item:mask-hive': 'hv-sw', 'item:flame-nightmare-hive': 'hv-queen',
    // Deepnest
    'deepnest|Hot Spring Bench': 'dn-spring', 'deepnest|Failed Tramway Bench': 'dn-tramway', 'deepnest|Bench above the Distant Village': 'dn-village',
    'deepnest|Distant Village Station': 'dn-village', 'deepnest|Herrah the Beast': 'dn-den', 'deepnest|Midwife': 'dn-mid', 'deepnest|Mask Maker': 'dn-mid',
    'deepnest|Brumm': 'dn-village', 'deepnest|Quirrel': 'dn-spring', 'deepnest|Hot Spring': 'dn-spring', 'deepnest|Lower Tram station': 'dn-tram',
    'deepnest|Cornifer — Deepnest map': 'dn-upper', 'deepnest|Lifeblood Cocoon — Galien': 'dn-galien', 'deepnest|Lifeblood Cocoon — Failed Tramway': 'dn-tramway',
    'deepnest|Trap bench (Distant Village)': 'dn-village', 'item:nosk': 'dn-nosk', 'item:ore-nosk': 'dn-nosk', 'item:galien': 'dn-galien',
    'item:herrah': 'dn-den', 'item:weaversong': 'dn-weaver', 'item:sharp-shadow': 'dn-spring', 'item:mask-deepnest': 'dn-upper',
    'item:vessel-deepnest': 'dn-tram', 'item:tram-pass': 'dn-tramway', 'item:brumm': 'dn-village',
    // Ancient Basin
    'ancient-basin|Toll Bench': 'ab-toll', 'ancient-basin|Hidden Station Bench': 'ab-palace', 'ancient-basin|Hidden Station': 'ab-palace',
    'ancient-basin|Pale King fountain': 'ab-fountain', 'ancient-basin|Lower Tram station': 'ab-tram', 'ancient-basin|White Palace entrance': 'ab-palace',
    'ancient-basin|Abyss gate': 'ab-gate', 'item:broken-vessel': 'ab-west', 'item:lost-kin': 'ab-west', 'item:monarch-wings': 'ab-west',
    'item:vessel-fountain': 'ab-fountain', 'item:ore-basin': 'ab-toll', 'item:key-basin': 'ab-north',
    // Abyss
    'the-abyss|No bench here': 'ay-mid', 'the-abyss|Lighthouse': 'ay-light', 'the-abyss|Birthplace': 'ay-birth',
    'item:shade-cloak': 'ay-light', 'item:abyss-shriek': 'ay-west', 'item:lifeblood-core': 'ay-mid', 'item:void-heart': 'ay-birth',
    // White Palace & Godhome
    'white-palace|South Bench': 'wp-s', 'white-palace|Atrium Bench': 'wp-c', 'white-palace|North Bench': 'wp-n', "white-palace|Pale King's throne": 'wp-throne',
    'white-palace|Path of Pain': 'wp-n', 'item:white-fragment-king': 'wp-throne'
  };

  root.HK = root.HK || {};
  root.HK.MapGeo = { W: W, H: H, ROOMS: ROOMS, LABELS: LABELS, SUB: SUB, AT: AT };
})(typeof window !== 'undefined' ? window : globalThis);
