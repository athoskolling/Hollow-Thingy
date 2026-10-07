/*
 * Hollow Knight Companion — INTERACTIVE WORLD MAP
 * An ORIGINAL schematic of Hallownest: each region is a cluster of "rooms" placed in roughly
 * the right direction relative to its neighbours. It is not a tracing of the official map.
 * Markers: benches, stag stations, vendors, bosses, roots, springs, trams, Cornifer, cocoons,
 * landmarks and (optionally) checklist items still missing. Exact spots are approximate.
 *
 * Pan: drag · Zoom: wheel / pinch / buttons · Click a region to select it · Click a marker for info.
 */
(function (root) {
  'use strict';
  var VW = 1000, VH = 700;
  var SHAPES = {
    'howling-cliffs':       [[30, 30, 140, 46], [90, 70, 140, 52], [40, 76, 70, 60]],
    'dirtmouth':            [[262, 58, 200, 30], [300, 42, 72, 20], [420, 48, 30, 14]],
    'crystal-peak':         [[500, 20, 170, 60], [560, 76, 190, 70], [690, 40, 90, 60], [600, 146, 110, 36]],
    'greenpath':            [[20, 150, 220, 70], [40, 216, 190, 60], [150, 190, 110, 40]],
    'forgotten-crossroads': [[268, 100, 226, 66], [290, 162, 214, 64], [496, 150, 74, 70], [262, 150, 50, 40]],
    'resting-grounds':      [[790, 150, 150, 60], [820, 206, 120, 70], [756, 186, 44, 40]],
    'fog-canyon':           [[250, 240, 150, 60], [270, 296, 110, 50]],
    'queens-gardens':       [[20, 300, 200, 70], [40, 366, 170, 70], [200, 330, 40, 50]],
    'fungal-wastes':        [[250, 356, 170, 60], [260, 412, 150, 70], [410, 382, 30, 40]],
    'city-of-tears':        [[432, 240, 250, 80], [450, 316, 240, 80], [680, 280, 52, 60]],
    'kingdoms-edge':        [[800, 290, 150, 90], [830, 376, 130, 110], [760, 330, 50, 50]],
    'the-hive':             [[880, 500, 90, 60]],
    'royal-waterways':      [[450, 410, 262, 50], [480, 456, 220, 40], [710, 420, 40, 30]],
    'deepnest':             [[20, 460, 220, 80], [30, 536, 250, 90], [240, 500, 60, 60]],
    'ancient-basin':        [[380, 510, 250, 60], [410, 566, 200, 50], [620, 530, 60, 40]],
    'the-abyss':            [[400, 630, 180, 46], [440, 672, 100, 22]],
    'white-palace':         [[700, 594, 110, 46], [722, 636, 66, 26]],
    'godhome':              [[840, 604, 130, 46], [870, 646, 70, 28]]
  };
  var DREAM = { 'white-palace': 1, 'godhome': 1 };
  var COLORS = { dirtmouth: '#c9d4e8', crossroads: '#7f9fd6', greenpath: '#7fcf7a', fungal: '#d9a45e', city: '#6f98e8', crystal: '#e59ad0',
    resting: '#b09ae8', waterways: '#5fc0b0', fog: '#d19ae6', basin: '#9aa7bf', edge: '#d9d3c2', deepnest: '#9a8494', hive: '#f0bf4a',
    cliffs: '#a9b8cc', gardens: '#5fcf8a', abyss: '#6a6a86', palace: '#f3ead0', godhome: '#f0c870' };
  var ORDER = ['stag', 'bench', 'tram', 'vendor', 'boss', 'root', 'spring', 'cornifer', 'cocoon', 'npc', 'landmark', 'item'];
  var DEFAULT_LAYERS = { bench: true, stag: true, vendor: true, boss: true, root: true, npc: false, spring: true, tram: true, cornifer: true, cocoon: true, landmark: true, item: false };
  var ITEM_LAYER_TYPES = { ability: 1, spell: 1, nailart: 1, mask: 1, vessel: 1, charm: 1, notch: 1, ore: 1, key: 1, dream: 1, item: 1, grimm: 1, colosseum: 1 };

  var VIEW = {};          // per-map pan/zoom/popover state (survives re-renders)
  var POSCACHE = null;    // marker positions (stable)
  var ALLPOIS = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bbox(id) {
    var r = SHAPES[id], x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    r.forEach(function (q) { x1 = Math.min(x1, q[0]); y1 = Math.min(y1, q[1]); x2 = Math.max(x2, q[0] + q[2]); y2 = Math.max(y2, q[1] + q[3]); });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
  }
  function labelPos(id) {
    var main = SHAPES[id][0];
    return { x: main[0] + main[2] / 2, y: main[1] + main[3] / 2 };
  }
  function shortName(n) { return n.replace(" & King's Pass", '').replace(' & Colosseum', ''); }
  function seeded(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

  /* ----------------------------- markers ----------------------------- */
  function allPois(DATA, POI) {
    if (ALLPOIS) return ALLPOIS;
    var out = POI.LIST.slice();
    DATA.ITEMS.forEach(function (it) {
      if (it.type === 'boss' || it.type === 'warrior' || it.type === 'dreamboss') {
        if (it.region === 'godhome' && it.id !== 'absolute-radiance') return;
        out.push({ id: 'item:' + it.id, region: it.region, type: 'boss', name: it.name, note: it.loc || '', item: it.id, wiki: it.wiki, fromItem: true });
      } else if (it.type === 'root') {
        out.push({ id: 'item:' + it.id, region: it.region, type: 'root', name: it.name, note: it.loc || '', item: it.id, wiki: it.wiki, fromItem: true });
      } else if (ITEM_LAYER_TYPES[it.type] && !it.derived) {
        out.push({ id: 'item:' + it.id, region: it.region, type: 'item', name: it.name, note: it.loc || '', item: it.id, wiki: it.wiki, fromItem: true, itemType: it.type });
      }
    });
    ALLPOIS = out;
    return out;
  }
  function positions(DATA, POI) {
    if (POSCACHE) return POSCACHE;
    POSCACHE = {};
    var pois = allPois(DATA, POI);
    Object.keys(SHAPES).forEach(function (rid) {
      var list = pois.filter(function (p) { return p.region === rid; })
        .sort(function (a, b) { return ORDER.indexOf(a.type) - ORDER.indexOf(b.type); });
      if (!list.length) return;
      var lp = labelPos(rid), reg = (DATA.REGIONS.filter(function (r) { return r.id === rid; })[0] || { name: rid });
      var lw = shortName(reg.name).length * 4.4 + 12, lh = 17;
      var cands = [], sp = 20, m = 8;
      while (sp >= 6) {
        cands = [];
        SHAPES[rid].forEach(function (q, qi) {
          for (var x = q[0] + m; x <= q[0] + q[2] - m; x += sp) {
            for (var y = q[1] + m; y <= q[1] + q[3] - m; y += sp) {
              if (Math.abs(x - lp.x) < lw && Math.abs(y - lp.y) < lh) continue;
              cands.push([x, y]);
            }
          }
        });
        if (cands.length >= list.length * 1.4) break;
        sp -= 2;
      }
      var rnd = seeded(rid);
      cands.forEach(function (c) { c[0] += (rnd() - 0.5) * sp * 0.5; c[1] += (rnd() - 0.5) * sp * 0.4; });
      var chosen = [];
      list.forEach(function (p, i) {
        var best = null, bestD = -1;
        cands.forEach(function (c) {
          if (c.used) return;
          var d = Infinity;
          chosen.forEach(function (o) { var dx = c[0] - o[0], dy = c[1] - o[1]; d = Math.min(d, dx * dx + dy * dy); });
          var dl = Math.pow(c[0] - lp.x, 2) / 4 + Math.pow(c[1] - lp.y, 2);
          d = Math.min(d, dl * 1.2);
          if (d > bestD) { bestD = d; best = c; }
        });
        if (!best) { best = [lp.x + (i % 6) * 6 - 15, lp.y + 16 + Math.floor(i / 6) * 6]; } else best.used = true;
        chosen.push(best);
        POSCACHE[p.id] = { x: Math.round(best[0] * 10) / 10, y: Math.round(best[1] * 10) / 10 };
      });
    });
    return POSCACHE;
  }

  /* ----------------------------- rendering ----------------------------- */
  function regionStatusMap(ctx) {
    var E = ctx.E, s = ctx.store.get(), out = {};
    ctx.DATA.REGIONS.forEach(function (r) {
      var p = E.regionProgress(r.id);
      var st = r.id === s.currentRegion ? 'current' : p.complete ? 'complete' : p.accessible ? 'accessible' : 'locked';
      out[r.id] = { status: st, p: p, region: r };
    });
    return out;
  }
  function symbolDefs() {
    var I = root.HK.Icons.PATHS, d = '';
    ['bench', 'stag', 'vendor', 'skull', 'root', 'npc', 'spring', 'tram', 'cornifer', 'cocoon', 'landmark', 'item', 'check', 'lock'].forEach(function (n) {
      d += '<symbol id="wm-i-' + n + '" viewBox="0 0 24 24"><path d="' + I[n] + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>';
    });
    d += '<pattern id="wm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.06)" stroke-width="1.4"/></pattern>';
    d += '<filter id="wm-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    d += '<radialGradient id="wm-vig" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#0d1730" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>';
    return '<defs>' + d + '</defs>';
  }
  var TYPE_SYMBOL = { bench: 'bench', stag: 'stag', vendor: 'vendor', boss: 'skull', root: 'root', npc: 'npc', spring: 'spring', tram: 'tram', cornifer: 'cornifer', cocoon: 'cocoon', landmark: 'landmark', item: 'item' };

  function svgMarkup(ctx, key) {
    var DATA = ctx.DATA, POI = root.HK.POI, E = ctx.E, s = ctx.store.get();
    var layers = getLayers(ctx), stat = regionStatusMap(ctx), pos = positions(DATA, POI), sel = ctx.selectedRegion;
    var h = '<svg class="wm-svg" viewBox="0 0 ' + VW + ' ' + VH + '" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Interactive schematic map of Hallownest">' + symbolDefs();
    h += '<rect x="-2000" y="-2000" width="5000" height="5000" fill="transparent" class="wm-bg"/>';
    h += '<g class="wm-world">';
    h += '<rect x="0" y="0" width="' + VW + '" height="' + VH + '" fill="url(#wm-vig)" pointer-events="none"/>';
    // dream realm frame
    h += '<g class="wm-dream" pointer-events="none"><rect x="688" y="582" width="296" height="108" rx="14"/><text x="836" y="578">DREAM REALM</text></g>';
    // regions
    DATA.REGIONS.forEach(function (r) {
      if (!SHAPES[r.id]) return;
      var st = stat[r.id], col = COLORS[r.theme] || '#9fb3d6', rects = SHAPES[r.id];
      var cls = 'wm-reg st-' + st.status + (DREAM[r.id] ? ' dream' : '') + (sel === r.id ? ' sel' : '');
      h += '<g class="' + cls + '" data-region="' + r.id + '" style="--c:' + col + '" tabindex="0" role="button" aria-label="' + esc(r.name) + ' — ' + st.status + ', ' + st.p.mainDone + ' of ' + st.p.main + ' main items">';
      rects.forEach(function (q) { h += '<rect class="ro" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" rx="5"/>'; });
      rects.forEach(function (q) { h += '<rect class="rf" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" rx="5"/>'; });
      rects.forEach(function (q) { h += '<rect class="rh" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" rx="5"/>'; });
      var lp = labelPos(r.id);
      h += '<g class="wm-label" data-lx="' + lp.x + '" data-ly="' + lp.y + '" transform="translate(' + lp.x + ',' + lp.y + ')">' +
        '<text class="ln" y="-1">' + esc(shortName(r.name)) + '</text>' +
        '<text class="lp" y="11">' + (st.status === 'locked' ? '🔒 ' : st.status === 'complete' ? '✓ ' : '') + st.p.mainDone + '/' + st.p.main + '</text></g>';
      h += '</g>';
    });
    // markers
    var pois = allPois(DATA, POI);
    h += '<g class="wm-pois">';
    pois.forEach(function (p) {
      if (!layers[p.type]) return;
      var done = p.item ? E.isDone(p.item) : false;
      if (p.type === 'item' && done) return; // "items left" only
      if (p.item === 'void-heart' && E.isVoidHeartLocked()) { /* keep marker, warning in popover */ }
      var q = pos[p.id]; if (!q) return;
      var t = root.HK.POI.TYPES[p.type];
      h += '<g class="wm-poi t-' + p.type + (done ? ' done' : '') + (VIEW[key] && VIEW[key].poi === p.id ? ' on' : '') + '" data-poi="' + esc(p.id) + '" data-x="' + q.x + '" data-y="' + q.y + '" transform="translate(' + q.x + ',' + q.y + ')" style="--pc:' + t.color + '" tabindex="0" role="button" aria-label="' + esc(t.one + ': ' + p.name) + '">' +
        '<circle r="7.2"/><use href="#wm-i-' + TYPE_SYMBOL[p.type] + '" x="-5" y="-5" width="10" height="10"/>' +
        (done ? '<circle class="dk" cx="5.5" cy="-5.5" r="3"/>' : '') + '</g>';
    });
    h += '</g>';
    // compass (original ornament)
    h += '<g class="wm-compass" transform="translate(345,655)" pointer-events="none"><circle r="24"/><path d="M0-30 5 0 0 30-5 0z"/><path d="M-30 0 0 4 30 0 0-4z" opacity=".5"/><text y="-34">N</text></g>';
    h += '</g></svg>';
    return h;
  }
  function getLayers(ctx) {
    var l = (ctx.store.get().settings || {}).mapLayers;
    var out = {}; Object.keys(DEFAULT_LAYERS).forEach(function (k) { out[k] = l && typeof l[k] === 'boolean' ? l[k] : DEFAULT_LAYERS[k]; });
    return out;
  }
  function layerCounts(ctx) {
    var c = {}, E = ctx.E;
    allPois(ctx.DATA, root.HK.POI).forEach(function (p) {
      if (p.type === 'item' && p.item && E.isDone(p.item)) return;
      c[p.type] = (c[p.type] || 0) + 1;
    });
    return c;
  }
  function layerChips(ctx, compact) {
    var L = getLayers(ctx), T = root.HK.POI.TYPES, c = layerCounts(ctx), I = root.HK.Icons;
    return ORDER.map(function (k) {
      return '<button type="button" class="wm-layer' + (L[k] ? ' on' : '') + '" data-wm-layer="' + k + '" aria-pressed="' + !!L[k] + '" style="--pc:' + T[k].color + '">' +
        I.svg(TYPE_SYMBOL[k] === 'skull' ? 'skull' : TYPE_SYMBOL[k]) + '<span>' + esc(T[k].label) + '</span><b>' + (k === 'bench' ? root.HK.POI.BENCHES_TOTAL : (c[k] || 0)) + '</b></button>';
    }).join('');
  }
  function legend() {
    return '<div class="wm-legend"><span><i class="lg complete"></i>Completed</span><span><i class="lg current"></i>Current</span><span><i class="lg accessible">✦</i>Accessible</span><span><i class="lg locked"></i>Locked</span></div>';
  }
  /** Markup for a map container. key: unique per page ('dash' | 'full'). */
  function html(ctx, key, opts) {
    opts = opts || {};
    var I = root.HK.Icons;
    var h = '<div class="wm' + (opts.compact ? ' compact' : ' full') + '" data-wm="' + key + '">';
    h += '<div class="wm-stage">' + svgMarkup(ctx, key) +
      '<div class="wm-zoom"><button type="button" class="icon-btn" data-wm-zoom="in" aria-label="Zoom in">' + I.svg('plus') + '</button>' +
      '<button type="button" class="icon-btn" data-wm-zoom="out" aria-label="Zoom out">' + I.svg('minus') + '</button>' +
      '<button type="button" class="icon-btn" data-wm-zoom="reset" aria-label="Reset view">' + I.svg('target') + '</button>' +
      (opts.compact ? '<button type="button" class="icon-btn" data-wm-toggle-layers aria-label="Map layers">' + I.svg('layers') + '</button>' : '') + '</div>' +
      '<div class="wm-pop" hidden></div>' +
      (opts.compact ? '<div class="wm-layers-pop" hidden><div class="wm-layers">' + layerChips(ctx, true) + '</div></div>' : '') +
      '</div>';
    if (!opts.compact) h += '<div class="wm-layers">' + layerChips(ctx) + '<button type="button" class="wm-layer all" data-wm-all="1">All</button><button type="button" class="wm-layer all" data-wm-all="0">None</button></div>';
    h += legend() + '<p class="wm-note">' + esc(root.HK.POI.NOTE) + '</p></div>';
    return h;
  }

  /* ----------------------------- popover ----------------------------- */
  function poiById(ctx, id) { var l = allPois(ctx.DATA, root.HK.POI); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function popHtml(ctx, p) {
    var T = root.HK.POI.TYPES[p.type], E = ctx.E, it = p.item ? E.byId[p.item] : null, rn = E.regionById[p.region];
    var h = '<button type="button" class="wm-pop-x" data-wm-close aria-label="Close">✕</button>';
    h += '<div class="wm-pop-type" style="--pc:' + T.color + '">' + root.HK.Icons.svg(TYPE_SYMBOL[p.type]) + esc(p.type === 'item' && it ? (ctx.typeLabel(it.type) || T.one) : T.one) + (p.sub ? ' · ' + esc(p.sub) : '') + '</div>';
    h += '<h4>' + esc(p.name) + '</h4><div class="wm-pop-reg">' + esc(rn ? rn.name : p.region) + '</div>';
    if (p.note) h += '<p>' + esc(p.note) + '</p>';
    if (p.cost) h += '<p class="wm-cost">' + (p.type === 'bench' ? 'Toll: ' : 'Cost: ') + p.cost + ' Geo</p>';
    if (it && it.voidHeart && E.isVoidHeartLocked()) h += '<p class="wm-vh">🔒 VOID HEART — NÃO PEGUE AINDA</p>';
    if (it) {
      var done = E.isDone(it.id);
      h += '<div class="wm-pop-actions">' + (it.derived ? '<span class="badge">' + (done ? '✓ done' : 'auto') + '</span>' :
        '<label class="toggle"><input type="checkbox" class="chk" data-action="toggle" data-id="' + it.id + '"' + (done ? ' checked' : '') + '> ' + esc(it.name) + '</label>') +
        '<button type="button" class="btn tiny" data-action="open-item" data-id="' + it.id + '">Details</button></div>';
    }
    if (p.wiki) h += '<a class="wm-wiki" href="' + p.wiki + '" target="_blank" rel="noopener">Wiki ↗</a>';
    return h;
  }

  /* ----------------------------- interaction ----------------------------- */
  function hydrate(scope, ctx) {
    scope.querySelectorAll('.wm[data-wm]').forEach(function (wm) { bind(wm, ctx); });
  }
  function bind(wm, ctx) {
    var key = wm.getAttribute('data-wm'), compact = wm.classList.contains('compact');
    var v = VIEW[key] || (VIEW[key] = { x: 0, y: 0, k: 1, poi: null });
    var svg = wm.querySelector('.wm-svg'), world = wm.querySelector('.wm-world'), stage = wm.querySelector('.wm-stage'), pop = wm.querySelector('.wm-pop');
    var pois = Array.prototype.slice.call(wm.querySelectorAll('.wm-poi')), labels = Array.prototype.slice.call(wm.querySelectorAll('.wm-label'));
    function scale() { var r = svg.getBoundingClientRect(); var sc = Math.min(r.width / VW, r.height / VH) || 1; return { r: r, sc: sc, ox: (r.width - VW * sc) / 2, oy: (r.height - VH * sc) / 2 }; }
    function toSvg(cx, cy) { var s = scale(); return { x: (cx - s.r.left - s.ox) / s.sc, y: (cy - s.r.top - s.oy) / s.sc }; }
    function clamp() {
      v.k = Math.max(1, Math.min(7, v.k));
      var minX = VW - VW * v.k, minY = VH - VH * v.k;
      v.x = Math.min(0, Math.max(minX, v.x)); v.y = Math.min(0, Math.max(minY, v.y));
    }
    function apply() {
      clamp();
      world.setAttribute('transform', 'translate(' + v.x.toFixed(2) + ',' + v.y.toFixed(2) + ') scale(' + v.k.toFixed(3) + ')');
      var ms = 1 / Math.pow(v.k, 0.72) * (compact && v.k < 1.6 ? 0.8 : 1), ls = 1 / Math.pow(v.k, compact ? 0.8 : 0.55);
      pois.forEach(function (g) { g.setAttribute('transform', 'translate(' + g.getAttribute('data-x') + ',' + g.getAttribute('data-y') + ') scale(' + ms.toFixed(3) + ')'); });
      labels.forEach(function (g) { g.setAttribute('transform', 'translate(' + g.getAttribute('data-lx') + ',' + g.getAttribute('data-ly') + ') scale(' + ls.toFixed(3) + ')'); });
      wm.classList.toggle('zoomed', v.k > 1.6);
      placePop();
    }
    function zoomAt(px, py, f) { var nk = Math.max(1, Math.min(7, v.k * f)); v.x = px - (px - v.x) * (nk / v.k); v.y = py - (py - v.y) * (nk / v.k); v.k = nk; apply(); }
    function placePop() {
      if (!v.poi) { pop.hidden = true; return; }
      var g = wm.querySelector('.wm-poi[data-poi="' + cssEsc(v.poi) + '"]');
      if (!g) { pop.hidden = true; return; }
      var p = poiById(ctx, v.poi); if (!p) return;
      if (pop.getAttribute('data-for') !== v.poi) { pop.innerHTML = popHtml(ctx, p); pop.setAttribute('data-for', v.poi); }
      pop.hidden = false;
      var s = scale(), x = Number(g.getAttribute('data-x')) * v.k + v.x, y = Number(g.getAttribute('data-y')) * v.k + v.y;
      var sx = s.ox + x * s.sc, sy = s.oy + y * s.sc, sw = stage.clientWidth, pw = pop.offsetWidth, ph = pop.offsetHeight;
      if (sx < 0 || sy < 0 || sx > sw || sy > stage.clientHeight) { pop.hidden = true; return; }
      var left = Math.max(6, Math.min(sw - pw - 6, sx - pw / 2)), top = sy + 14;
      if (top + ph > stage.clientHeight - 4) top = Math.max(4, sy - ph - 14);
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    }
    function select(id) { v.poi = id; pois.forEach(function (g) { g.classList.toggle('on', g.getAttribute('data-poi') === id); }); pop.removeAttribute('data-for'); placePop(); }

    // pointer: pan / pinch / click
    var pts = {}, start = null, moved = false, pinch = null;
    svg.addEventListener('pointerdown', function (e) {
      wm.classList.add('engaged');
      if (compact && e.pointerType === 'touch') { start = { x: e.clientX, y: e.clientY, touch: true }; moved = false; return; }
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 1) { start = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y }; moved = false; }
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: v.k, vx: v.x, vy: v.y, m: toSvg((a.x + b.x) / 2, (a.y + b.y) / 2) };
      }
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
    });
    svg.addEventListener('pointermove', function (e) {
      if (start && start.touch) { if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) moved = true; return; }
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts), s = scale();
      if (ids.length >= 2 && pinch) {
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        var nk = Math.max(1, Math.min(7, pinch.k * d / pinch.d));
        v.x = pinch.m.x - (pinch.m.x - pinch.vx) * (nk / pinch.k); v.y = pinch.m.y - (pinch.m.y - pinch.vy) * (nk / pinch.k); v.k = nk; moved = true; apply();
      } else if (start) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
        if (moved) { v.x = start.vx + dx / s.sc; v.y = start.vy + dy / s.sc; wm.classList.add('dragging'); apply(); }
      }
    });
    function end(e) {
      var wasMoved = moved;
      delete pts[e.pointerId];
      if (Object.keys(pts).length < 2) pinch = null;
      if (!Object.keys(pts).length || (start && start.touch)) {
        wm.classList.remove('dragging');
        if (e.type === 'pointerup' && !wasMoved) click(e);
        start = null;
      } else {
        var rest = pts[Object.keys(pts)[0]]; start = { x: rest.x, y: rest.y, vx: v.x, vy: v.y };
      }
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', function (e) { moved = true; end(e); });
    function click(e) {
      var el = document.elementFromPoint(e.clientX, e.clientY) || e.target;
      var p = el.closest && el.closest('.wm-poi');
      if (p) { select(p.getAttribute('data-poi')); return; }
      var r = el.closest && el.closest('.wm-reg');
      if (r) { select(null); if (ctx.onRegion) ctx.onRegion(r.getAttribute('data-region'), key); return; }
      select(null);
    }
    svg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var p = e.target.closest('.wm-poi'), r = e.target.closest('.wm-reg');
      if (p) { e.preventDefault(); select(p.getAttribute('data-poi')); }
      else if (r) { e.preventDefault(); if (ctx.onRegion) ctx.onRegion(r.getAttribute('data-region'), key); }
    });
    svg.addEventListener('wheel', function (e) {
      if (compact && !e.ctrlKey && !wm.classList.contains('engaged')) return; // let the page scroll until the map is clicked
      e.preventDefault();
      var pt = toSvg(e.clientX, e.clientY);
      zoomAt(pt.x, pt.y, e.deltaY < 0 ? 1.18 : 1 / 1.18);
    }, { passive: false });
    // hover tooltip (desktop): reuse title via aria-label
    wm.addEventListener('click', function (e) {
      var z = e.target.closest('[data-wm-zoom]');
      if (z) { var m = z.getAttribute('data-wm-zoom'); if (m === 'reset') { v.x = 0; v.y = 0; v.k = 1; apply(); } else zoomCenter(m === 'in' ? 1.35 : 1 / 1.35); return; }
      if (e.target.closest('[data-wm-close]')) { select(null); return; }
      if (e.target.closest('[data-wm-toggle-layers]')) { var lp = wm.querySelector('.wm-layers-pop'); if (lp) { lp.hidden = !lp.hidden; v.layersOpen = !lp.hidden; } return; }
      var l = e.target.closest('[data-wm-layer]');
      if (l) { var L = getLayers(ctx); L[l.getAttribute('data-wm-layer')] = !L[l.getAttribute('data-wm-layer')]; ctx.store.setSetting('mapLayers', L); return; }
      var all = e.target.closest('[data-wm-all]');
      if (all) { var on = all.getAttribute('data-wm-all') === '1', L2 = {}; Object.keys(DEFAULT_LAYERS).forEach(function (k) { L2[k] = on; }); ctx.store.setSetting('mapLayers', L2); }
    });
    function zoomCenter(f) {
      var cx = (VW / 2 - v.x) / v.k, cy = (VH / 2 - v.y) / v.k; // world point at view centre
      var nk = Math.max(1, Math.min(7, v.k * f));
      v.x = VW / 2 - cx * nk; v.y = VH / 2 - cy * nk; v.k = nk; apply();
    }
    if (v.layersOpen) { var lpop = wm.querySelector('.wm-layers-pop'); if (lpop) lpop.hidden = false; }
    wm._focusRegion = function (id) {
      var b = bbox(id), k = Math.max(1, Math.min(4, Math.min(VW / (b.w + 80), VH / (b.h + 80))));
      v.k = k; v.x = VW / 2 - b.cx * k; v.y = VH / 2 - b.cy * k; apply();
    };
    wm.addEventListener('mouseleave', function () { wm.classList.remove('engaged'); });
    wm._placePop = placePop;
    apply();
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', function () {
    document.querySelectorAll('.wm[data-wm]').forEach(function (wm) { if (wm._placePop) wm._placePop(); });
  });
  function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }
  function focusRegion(scope, id) { scope.querySelectorAll('.wm[data-wm]').forEach(function (wm) { if (wm._focusRegion) wm._focusRegion(id); }); }

  root.HK = root.HK || {};
  root.HK.WorldMap = { html: html, hydrate: hydrate, focusRegion: focusRegion, allPois: allPois, positions: positions, SHAPES: SHAPES, DEFAULT_LAYERS: DEFAULT_LAYERS, getLayers: getLayers, VIEW: VIEW };
})(typeof window !== 'undefined' ? window : globalThis);
