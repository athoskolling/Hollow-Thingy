/*
 * Hollow Knight Companion — ATLAS (schematic world map)
 * An ORIGINAL, simplified diagram of Hallownest: each region is a blob placed roughly where it sits
 * relative to the others, linked to its neighbours. NOT to scale and NOT the official map — for the
 * real in-game map, the Map page links to community interactive maps.
 */
(function (root) {
  'use strict';
  var W = 1000, H = 760;
  // id: [cx, cy, rx, ry]
  var NODES = {
    'howling-cliffs': [135, 105, 95, 58], 'dirtmouth': [345, 100, 105, 55], 'resting-grounds': [640, 105, 92, 52], 'crystal-peak': [845, 135, 95, 62],
    'greenpath': [150, 265, 100, 62], 'forgotten-crossroads': [390, 250, 105, 68], 'city-of-tears': [630, 265, 100, 66], 'kingdoms-edge': [860, 340, 92, 70],
    'fog-canyon': [275, 385, 82, 52], 'queens-gardens': [135, 440, 92, 56], 'fungal-wastes': [450, 420, 100, 62], 'royal-waterways': [635, 435, 95, 55], 'the-hive': [880, 480, 70, 50],
    'deepnest': [400, 565, 105, 62], 'ancient-basin': [640, 575, 98, 56], 'white-palace': [850, 600, 82, 52], 'the-abyss': [640, 700, 92, 40], 'godhome': [165, 665, 92, 52]
  };
  var LINKS = [['dirtmouth', 'forgotten-crossroads'], ['forgotten-crossroads', 'greenpath'], ['greenpath', 'howling-cliffs'], ['dirtmouth', 'howling-cliffs'], ['forgotten-crossroads', 'fungal-wastes'],
    ['forgotten-crossroads', 'city-of-tears'], ['forgotten-crossroads', 'crystal-peak'], ['dirtmouth', 'city-of-tears'], ['city-of-tears', 'resting-grounds'], ['resting-grounds', 'crystal-peak'], ['city-of-tears', 'royal-waterways'],
    ['city-of-tears', 'kingdoms-edge'], ['fungal-wastes', 'city-of-tears'], ['greenpath', 'fog-canyon'], ['fog-canyon', 'fungal-wastes'], ['fog-canyon', 'queens-gardens'], ['fungal-wastes', 'deepnest'],
    ['kingdoms-edge', 'deepnest'], ['kingdoms-edge', 'the-hive'], ['royal-waterways', 'ancient-basin'], ['ancient-basin', 'the-abyss'], ['deepnest', 'ancient-basin'], ['ancient-basin', 'white-palace'], ['queens-gardens', 'deepnest']];
  var cache = {};
  function rng(seed) { var h = 2166136261; for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
  function blob(id) {
    if (cache[id]) return cache[id];
    var n = NODES[id], r = rng(id), N = 11, pts = [], i;
    for (i = 0; i < N; i++) { var a = i / N * Math.PI * 2, k = 0.82 + r() * 0.32; pts.push([n[0] + Math.cos(a) * n[2] * k, n[1] + Math.sin(a) * n[3] * k]); }
    var d = '';
    for (i = 0; i < N; i++) { // smooth closed curve through midpoints
      var p0 = pts[i], p1 = pts[(i + 1) % N], m0 = [(pts[(i + N - 1) % N][0] + p0[0]) / 2, (pts[(i + N - 1) % N][1] + p0[1]) / 2], m1 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      if (i === 0) d += 'M' + m0[0].toFixed(1) + ' ' + m0[1].toFixed(1);
      d += ' Q' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' ' + m1[0].toFixed(1) + ' ' + m1[1].toFixed(1);
    }
    return (cache[id] = d + 'Z');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /**
   * m[id] = { name, short, color, level (0..1 fill strength), badge (text), sub (text), state: 'complete'|'locked'|'' }
   */
  function svg(m, selected) {
    var s = '<svg class="atlas-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Schematic map of Hallownest">' +
      '<defs><filter id="atl-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>';
    LINKS.forEach(function (l) {
      var a = NODES[l[0]], b = NODES[l[1]]; if (!a || !b) return;
      s += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="atl-link"/>';
    });
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id], x = m[id]; if (!x) return;
      var cls = 'atl-node' + (x.state ? ' ' + x.state : '') + (selected === id ? ' sel' : '');
      s += '<a href="#/map/' + id + '" class="' + cls + '" aria-label="' + esc(x.name + ': ' + x.sub) + '" style="--c:' + x.color + '">' +
        '<path d="' + blob(id) + '" class="atl-glow" style="fill:' + x.color + ';opacity:' + (0.15 + x.level * 0.5).toFixed(2) + '" filter="url(#atl-glow)"/>' +
        '<path d="' + blob(id) + '" class="atl-shape" style="fill:' + x.color + ';fill-opacity:' + (0.07 + x.level * 0.5).toFixed(2) + '"/>' +
        '<text x="' + n[0] + '" y="' + (n[1] - 4) + '" class="atl-name" text-anchor="middle">' + esc(x.short) + '</text>' +
        '<text x="' + n[0] + '" y="' + (n[1] + 20) + '" class="atl-badge" text-anchor="middle">' + esc(x.badge) + '</text></a>';
    });
    return s + '</svg>';
  }
  root.HK = root.HK || {};
  root.HK.Atlas = { svg: svg, NODES: NODES, LINKS: LINKS };
})(typeof window !== 'undefined' ? window : globalThis);
