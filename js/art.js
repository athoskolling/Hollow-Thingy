/*
 * Hollow Knight Companion — ART
 * Procedural, ORIGINAL silhouettes (spires, crystals, mushrooms, graves…) drawn as SVG.
 * No game sprites or official artwork are used or traced.
 */
(function (root) {
  'use strict';
  var cache = {};
  function rng(seed) { var h = 2166136261; for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
  var KIND = { dirtmouth: 'town', crossroads: 'arches', greenpath: 'foliage', fungal: 'shrooms', city: 'spires', crystal: 'crystals', resting: 'graves',
    waterways: 'pipes', fog: 'bubbles', basin: 'arches', edge: 'spikes', deepnest: 'webs', hive: 'hive', cliffs: 'spikes', gardens: 'foliage',
    abyss: 'void', palace: 'spires', godhome: 'halo' };
  var TINT = { dirtmouth: ['#1b2333', '#9fb3d6'], crossroads: ['#18213a', '#7f9fd6'], greenpath: ['#10261a', '#8fe08a'], fungal: ['#2a1d10', '#e8b26e'],
    city: ['#0f1a33', '#8fb6ff'], crystal: ['#2a1230', '#f2a9d8'], resting: ['#1d1630', '#c9b3ff'], waterways: ['#0d2422', '#7fd6c5'],
    fog: ['#26142c', '#e7b7f2'], basin: ['#171b24', '#b9c3d6'], edge: ['#24221d', '#e6e1d3'], deepnest: ['#1a1316', '#b9a7a7'],
    hive: ['#2b2008', '#ffcf5c'], cliffs: ['#1a1f28', '#cfd8e6'], gardens: ['#0f2619', '#7ee0a1'], abyss: ['#050507', '#8a8aa6'],
    palace: ['#2a2820', '#fff6d8'], godhome: ['#2b2310', '#ffd98a'] };

  function layer(kind, r, W, H, base, fill, op) {
    var d = '', x = 0, i;
    if (kind === 'spires' || kind === 'town') {
      d = 'M0 ' + H;
      while (x < W) {
        var w = 18 + r() * 40, h = base * (0.35 + r() * 0.65) * (kind === 'town' ? 0.55 : 1), top = H - h;
        d += ' L' + x + ' ' + (H - h * 0.55) + ' L' + x + ' ' + top + ' L' + (x + w / 2) + ' ' + (top - 12 - r() * 26) + ' L' + (x + w) + ' ' + top + ' L' + (x + w) + ' ' + (H - h * 0.5);
        x += w + r() * 10;
      }
      d += ' L' + W + ' ' + H + 'Z';
    } else if (kind === 'crystals') {
      d = 'M0 ' + H;
      while (x < W) { var cw = 10 + r() * 26, ch = base * (0.3 + r() * 0.8); d += ' L' + x + ' ' + (H - ch * 0.4) + ' L' + (x + cw * 0.5) + ' ' + (H - ch) + ' L' + (x + cw) + ' ' + (H - ch * 0.35); x += cw * 0.8; }
      d += ' L' + W + ' ' + H + 'Z';
    } else if (kind === 'shrooms') {
      d = 'M0 ' + H + ' L' + W + ' ' + H + ' L' + W + ' ' + (H - 8) + ' L0 ' + (H - 8) + 'Z';
      for (i = 0; i < 9; i++) { var sx = r() * W, sh = base * (0.3 + r() * 0.7), sr = 14 + r() * 26; d += ' M' + (sx - 3) + ' ' + H + ' L' + (sx - 3) + ' ' + (H - sh) + ' L' + (sx + 3) + ' ' + (H - sh) + ' L' + (sx + 3) + ' ' + H + 'Z M' + (sx - sr) + ' ' + (H - sh) + ' Q' + sx + ' ' + (H - sh - sr * 1.2) + ' ' + (sx + sr) + ' ' + (H - sh) + 'Z'; }
    } else if (kind === 'foliage') {
      d = 'M0 ' + H;
      while (x < W) { var fw = 12 + r() * 30, fh = base * (0.3 + r() * 0.7); d += ' Q' + (x + fw * 0.2) + ' ' + (H - fh) + ' ' + (x + fw * 0.5) + ' ' + (H - fh * 0.9) + ' Q' + (x + fw * 0.8) + ' ' + (H - fh * 0.4) + ' ' + (x + fw) + ' ' + (H - fh * 0.25); x += fw; }
      d += ' L' + W + ' ' + H + 'Z';
    } else if (kind === 'graves') {
      d = 'M0 ' + H + ' L' + W + ' ' + H + ' L' + W + ' ' + (H - 10) + ' L0 ' + (H - 6) + 'Z';
      for (i = 0; i < 12; i++) { var gx = r() * W, gh = base * (0.2 + r() * 0.5), gw = 10 + r() * 14; d += ' M' + gx + ' ' + H + ' L' + gx + ' ' + (H - gh) + ' Q' + (gx + gw / 2) + ' ' + (H - gh - gw * 0.8) + ' ' + (gx + gw) + ' ' + (H - gh) + ' L' + (gx + gw) + ' ' + H + 'Z'; }
    } else if (kind === 'pipes') {
      d = 'M0 ' + H + ' L' + W + ' ' + H + ' L' + W + ' ' + (H - 12) + ' L0 ' + (H - 12) + 'Z';
      for (i = 0; i < 6; i++) { var px = r() * W, ph = base * (0.4 + r() * 0.6), pw = 12 + r() * 16; d += ' M' + px + ' ' + H + ' L' + px + ' ' + (H - ph) + ' L' + (px + pw) + ' ' + (H - ph) + ' L' + (px + pw) + ' ' + H + 'Z M' + (px - 4) + ' ' + (H - ph) + ' L' + (px + pw + 4) + ' ' + (H - ph) + ' L' + (px + pw + 4) + ' ' + (H - ph + 6) + ' L' + (px - 4) + ' ' + (H - ph + 6) + 'Z'; }
    } else if (kind === 'arches') {
      d = 'M0 ' + H;
      while (x < W) { var aw = 40 + r() * 50, ah = base * (0.4 + r() * 0.5); d += ' L' + x + ' ' + (H - ah) + ' L' + (x + 6) + ' ' + (H - ah) + ' L' + (x + 6) + ' ' + (H - ah * 0.4) + ' Q' + (x + aw / 2) + ' ' + (H - ah * 1.05) + ' ' + (x + aw - 6) + ' ' + (H - ah * 0.4) + ' L' + (x + aw - 6) + ' ' + (H - ah) + ' L' + (x + aw) + ' ' + (H - ah); x += aw; }
      d += ' L' + W + ' ' + H + 'Z';
    } else if (kind === 'spikes' || kind === 'webs') {
      d = 'M0 ' + H;
      while (x < W) { var kw = 6 + r() * 18, kh = base * (0.2 + r() * 0.8); d += ' L' + (x + kw / 2) + ' ' + (H - kh) + ' L' + (x + kw) + ' ' + (H - kh * 0.15); x += kw; }
      d += ' L' + W + ' ' + H + 'Z';
      if (kind === 'webs') for (i = 0; i < 4; i++) { var wx = r() * W; d += ' M' + wx + ' 0 L' + (wx + 1.2) + ' 0 L' + (wx + 1.2) + ' ' + (H * 0.5 * r() + 10) + ' L' + wx + ' ' + (H * 0.5) + 'Z'; }
    } else if (kind === 'hive') {
      for (i = 0; i < 40; i++) { var hx = (i % 10) * 34 + (Math.floor(i / 10) % 2) * 17, hy = H - 20 - Math.floor(i / 10) * 28 * (base / 90); if (r() < 0.35) continue; var s = 15; d += ' M' + (hx * W / 340) + ' ' + (hy - s) + ' l13 7.5 v15 l-13 7.5 l-13 -7.5 v-15z'; }
    } else if (kind === 'bubbles') {
      d = 'M0 ' + H + ' L' + W + ' ' + H + ' L' + W + ' ' + (H - 14) + ' Q' + W / 2 + ' ' + (H - 30) + ' 0 ' + (H - 14) + 'Z';
      for (i = 0; i < 14; i++) { var bx = r() * W, by = H - r() * base * 1.2, br = 3 + r() * 12; d += ' M' + (bx - br) + ' ' + by + ' a' + br + ' ' + br + ' 0 1 0 ' + (br * 2) + ' 0 a' + br + ' ' + br + ' 0 1 0 ' + (-br * 2) + ' 0'; }
    } else if (kind === 'halo') {
      d = 'M0 ' + H;
      while (x < W) { var hw = 50 + r() * 40, hh = base * (0.5 + r() * 0.4); d += ' L' + x + ' ' + (H - hh * 0.6) + ' Q' + (x + hw / 2) + ' ' + (H - hh * 1.2) + ' ' + (x + hw) + ' ' + (H - hh * 0.6); x += hw; }
      d += ' L' + W + ' ' + H + 'Z';
    } else { // void
      d = 'M0 ' + H + ' L' + W + ' ' + H + ' L' + W + ' ' + (H - base * 0.3) + ' Q' + W * 0.5 + ' ' + (H - base * 0.05) + ' 0 ' + (H - base * 0.35) + 'Z';
    }
    return '<path d="' + d + '" fill="' + fill + '" opacity="' + op + '"/>';
  }
  function scene(theme, W, H, seed) {
    var key = theme + W + 'x' + H + (seed || '');
    if (cache[key]) return cache[key];
    var kind = KIND[theme] || 'arches', t = TINT[theme] || TINT.crossroads, r = rng(key);
    var s = '<svg class="scene" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="sk-' + key + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t[0] + '"/><stop offset="1" stop-color="#03050a"/></linearGradient>' +
      '<radialGradient id="gl-' + key + '" cx="70%" cy="35%" r="60%"><stop offset="0" stop-color="' + t[1] + '" stop-opacity=".35"/><stop offset="1" stop-color="' + t[1] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#sk-' + key + ')"/><rect width="' + W + '" height="' + H + '" fill="url(#gl-' + key + ')"/>';
    s += layer(kind, r, W, H - 2, H * 0.85, t[1], 0.10);
    s += layer(kind, r, W, H, H * 0.62, '#0a0f1c', 0.75);
    s += layer(kind, r, W, H + 2, H * 0.4, '#04060b', 0.95);
    for (var i = 0; i < 16; i++) s += '<circle cx="' + (r() * W).toFixed(1) + '" cy="' + (r() * H * 0.8).toFixed(1) + '" r="' + (0.6 + r() * 1.6).toFixed(1) + '" fill="' + t[1] + '" opacity="' + (0.25 + r() * 0.5).toFixed(2) + '"/>';
    s += '</svg>';
    cache[key] = s;
    return s;
  }
  /* Dashboard hero: a city of spires in the rain, lanterns glowing. */
  function hero() {
    if (cache.hero) return cache.hero;
    var W = 1200, H = 260, r = rng('hero-hallownest'), s = '<svg class="scene hero-scene" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101b36"/><stop offset=".7" stop-color="#070b16"/><stop offset="1" stop-color="#04060b"/></linearGradient>' +
      '<radialGradient id="hmoon" cx="62%" cy="20%" r="45%"><stop offset="0" stop-color="#9fc4ff" stop-opacity=".35"/><stop offset="1" stop-color="#9fc4ff" stop-opacity="0"/></radialGradient>' +
      '<pattern id="hrain" width="40" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><line x1="10" y1="0" x2="10" y2="18" stroke="#a9c6ff" stroke-opacity=".12" stroke-width="1"/><line x1="30" y1="40" x2="30" y2="54" stroke="#a9c6ff" stroke-opacity=".08" stroke-width="1"/></pattern></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#hsky)"/><rect width="' + W + '" height="' + H + '" fill="url(#hmoon)"/>';
    s += layer('spires', r, W, H, H * 0.95, '#6f8fd0', 0.08);
    s += layer('spires', r, W, H, H * 0.75, '#0c1428', 0.85);
    // lanterns
    for (var i = 0; i < 22; i++) { var lx = r() * W, ly = H * 0.45 + r() * H * 0.45; s += '<circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="' + (1.2 + r() * 1.8).toFixed(1) + '" fill="#ffd98a" opacity="' + (0.4 + r() * 0.5).toFixed(2) + '"/><circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="7" fill="#ffd98a" opacity=".06"/>'; }
    s += layer('spires', r, W, H + 4, H * 0.45, '#04060b', 0.97);
    s += '<rect class="rain" width="' + W + '" height="' + H + '" fill="url(#hrain)"/></svg>';
    cache.hero = s;
    return s;
  }
  root.HK = root.HK || {};
  root.HK.Art = { scene: scene, hero: hero, TINT: TINT };
})(typeof window !== 'undefined' ? window : globalThis);
