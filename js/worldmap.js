/*
 * Hollow Knight Companion — INTERACTIVE WORLD MAP
 * Renders the ORIGINAL rooms-and-corridors redrawing in mapgeo.js (not the official map).
 * Markers: benches, stag stations, vendors, bosses, roots, springs, trams, Cornifer, cocoons,
 * landmarks and (optionally) checklist items still missing. Exact spots are approximate.
 *
 * Pan: drag · Zoom: wheel / pinch / buttons · Click a region to select it · Click a marker for info.
 */
(function (root) {
  'use strict';
  var G = root.HK.MapGeo, VW = G.W, VH = G.H, SHAPES = G.ROOMS, MAXK = 10;
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
  function labelPos(id) { var l = G.LABELS[id]; if (l) return { x: l[0], y: l[1] }; var b = bbox(id); return { x: b.cx, y: b.cy }; }
  function akey(p) { return p.fromItem ? p.id : p.region + '|' + p.name; }
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
  function insideRegion(rid, x, y, m) {
    return SHAPES[rid].some(function (q) { return x >= q[0] + m && x <= q[0] + q[2] - m && y >= q[1] + m && y <= q[1] + q[3] - m; });
  }
  function positions(DATA, POI) {
    if (POSCACHE) return POSCACHE;
    POSCACHE = {};
    var pois = allPois(DATA, POI), GA = 2.39996;
    Object.keys(SHAPES).forEach(function (rid) {
      var list = pois.filter(function (p) { return p.region === rid; })
        .sort(function (a, b) { return ORDER.indexOf(a.type) - ORDER.indexOf(b.type); });
      if (!list.length) return;
      var used = [], perAnchor = {}, rest = [];
      var lp = labelPos(rid), reg = DATA.REGIONS.filter(function (r) { return r.id === rid; })[0] || { name: rid };
      var lw = shortName(reg.name).length * 11 + 22;
      function onLabel(x, y) { return Math.abs(x - lp.x) < lw && y > lp.y - 34 && y < lp.y + 34; }
      // 1) markers with a known sub-area: spiral around the anchor, staying inside the region's rooms
      list.forEach(function (p) {
        var an = G.AT[akey(p)], A = an && G.SUB[an];
        if (!A) { rest.push(p); return; }
        var n = perAnchor[an] = (perAnchor[an] || 0), pt = null;
        for (var i = n; i < n + 400; i++) {
          var r = i === 0 ? 0 : 15 + 9 * Math.sqrt(i), ang = i * GA;
          var x = A[0] + Math.cos(ang) * r, y = A[1] + Math.sin(ang) * r * 0.8;
          if (!insideRegion(rid, x, y, 7) || onLabel(x, y)) continue;
          if (used.some(function (u) { return (u[0] - x) * (u[0] - x) + (u[1] - y) * (u[1] - y) < 23 * 23; })) continue;
          pt = [x, y]; perAnchor[an] = i + 1; break;
        }
        if (!pt) { rest.push(p); return; }
        used.push(pt);
        POSCACHE[p.id] = { x: Math.round(pt[0]), y: Math.round(pt[1]) };
      });
      // 2) the rest: farthest-point sampling inside the rooms
      if (!rest.length) return;
      var cands = [], sp = 22, rnd = seeded(rid);
      while (sp >= 8) {
        cands = [];
        SHAPES[rid].forEach(function (q) {
          for (var x = q[0] + 10; x <= q[0] + q[2] - 10; x += sp) for (var y = q[1] + 10; y <= q[1] + q[3] - 10; y += sp) {
            if (onLabel(x, y)) continue;
            cands.push([x + (rnd() - 0.5) * 6, y + (rnd() - 0.5) * 6]);
          }
        });
        if (cands.length >= (rest.length + used.length) * 1.3) break;
        sp -= 3;
      }
      rest.forEach(function (p, i) {
        var best = null, bestD = -1;
        cands.forEach(function (c) {
          if (c.used) return;
          var d = Infinity;
          used.forEach(function (o) { var dx = c[0] - o[0], dy = c[1] - o[1]; d = Math.min(d, dx * dx + dy * dy); });
          if (d > bestD) { bestD = d; best = c; }
        });
        if (!best) best = [lp.x + (i % 6) * 14 - 35, lp.y + 30 + Math.floor(i / 6) * 14]; else best.used = true;
        used.push(best);
        POSCACHE[p.id] = { x: Math.round(best[0]), y: Math.round(best[1]) };
      });
    });
    return POSCACHE;
  }
  function found(ctx) { return (ctx.store.get().settings || {}).poiFound || {}; }
  function isFound(ctx, p) { return p.item ? ctx.E.isDone(p.item) : !!found(ctx)[p.id]; }

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
    var bg = MapImage.url(), bo = MapImage.opts(ctx);
    if (bg) h += '<image class="wm-bgimg" href="' + bg + '" x="' + bo.x + '" y="' + bo.y + '" width="' + (bo.w * bo.sx) + '" height="' + bo.h + '" opacity="' + bo.opacity + '" preserveAspectRatio="none" pointer-events="none"/>';
    // dream realm frame
    h += '<g class="wm-dream" pointer-events="none"><rect x="1325" y="1478" width="590" height="140" rx="20"/><text x="1620" y="1468">DREAM REALM</text></g>';
    // regions
    DATA.REGIONS.forEach(function (r) {
      if (!SHAPES[r.id]) return;
      var st = stat[r.id], col = COLORS[r.theme] || '#9fb3d6', rects = SHAPES[r.id];
      var cls = 'wm-reg st-' + st.status + (DREAM[r.id] ? ' dream' : '') + (sel === r.id ? ' sel' : '');
      h += '<g class="' + cls + '" data-region="' + r.id + '" style="--c:' + col + '" tabindex="0" role="button" aria-label="' + esc(r.name) + ' — ' + st.status + ', ' + st.p.mainDone + ' of ' + st.p.main + ' main items">';
      rects.forEach(function (q) { h += '<rect class="ro" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" rx="7"/>'; });
      rects.forEach(function (q) { h += '<rect class="rf" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" rx="7"/>'; });
      rects.forEach(function (q) { h += '<rect class="rh" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '" rx="7"/>'; });
      var lp = labelPos(r.id);
      h += '<g class="wm-label" data-lx="' + lp.x + '" data-ly="' + lp.y + '" transform="translate(' + lp.x + ',' + lp.y + ')">' +
        '<text class="ln" y="0">' + esc(shortName(r.name)) + '</text>' +
        '<text class="lp" y="22">' + (st.status === 'locked' ? '🔒 ' : st.status === 'complete' ? '✓ ' : '') + st.p.mainDone + '/' + st.p.main + '</text></g>';
      h += '</g>';
    });
    // sub-area labels (visible when zoomed in)
    h += '<g class="wm-subs" pointer-events="none">';
    Object.keys(G.SUB).forEach(function (k) { var a = G.SUB[k]; if (a[2]) h += '<text class="wm-sub" data-lx="' + a[0] + '" data-ly="' + (a[1] - 16) + '" x="' + a[0] + '" y="' + (a[1] - 16) + '">' + esc(a[2]) + '</text>'; });
    h += '</g>';
    // markers
    var pois = allPois(DATA, POI), hideFound = !!(s.settings || {}).mapHideFound, q0 = (VIEW[key] && VIEW[key].q || '').toLowerCase();
    h += '<g class="wm-pois">';
    pois.forEach(function (p) {
      if (!layers[p.type]) return;
      var done = isFound(ctx, p);
      if (p.type === 'item' && done) return; // "items left" only
      if (hideFound && done) return;
      var hit = q0 && (p.name + ' ' + p.note).toLowerCase().indexOf(q0) >= 0;
      if (p.item === 'void-heart' && E.isVoidHeartLocked()) { /* keep marker, warning in popover */ }
      var q = pos[p.id]; if (!q) return;
      var t = root.HK.POI.TYPES[p.type];
      h += '<g class="wm-poi t-' + p.type + (done ? ' done' : '') + (hit ? ' hit' : '') + (q0 && !hit ? ' dim' : '') + (VIEW[key] && VIEW[key].poi === p.id ? ' on' : '') + '" data-poi="' + esc(p.id) + '" data-x="' + q.x + '" data-y="' + q.y + '" transform="translate(' + q.x + ',' + q.y + ')" style="--pc:' + t.color + '" tabindex="0" role="button" aria-label="' + esc(t.one + ': ' + p.name) + '">' +
        '<circle r="13"/><use href="#wm-i-' + TYPE_SYMBOL[p.type] + '" x="-9" y="-9" width="18" height="18"/>' +
        (done ? '<circle class="dk" cx="10" cy="-10" r="5.5"/>' : '') + '</g>';
    });
    h += '</g>';
    // compass (original ornament)
    h += '<g class="wm-compass" transform="translate(1950,1240)" pointer-events="none"><circle r="34"/><path d="M0-44 7 0 0 44-7 0z"/><path d="M-44 0 0 6 44 0 0-6z" opacity=".5"/><text y="-50">N</text></g>';
    h += '</g></svg>';
    return h;
  }
  function getLayers(ctx) {
    var l = (ctx.store.get().settings || {}).mapLayers;
    var out = {}; Object.keys(DEFAULT_LAYERS).forEach(function (k) { out[k] = l && typeof l[k] === 'boolean' ? l[k] : DEFAULT_LAYERS[k]; });
    return out;
  }
  function layerCounts(ctx) {
    var c = {}, f = {}, E = ctx.E;
    allPois(ctx.DATA, root.HK.POI).forEach(function (p) {
      if (p.type === 'item' && p.item && E.isDone(p.item)) return;
      c[p.type] = (c[p.type] || 0) + 1;
      if (p.type !== 'item' && isFound(ctx, p)) f[p.type] = (f[p.type] || 0) + 1;
    });
    c.found = f;
    return c;
  }
  function layerChips(ctx, compact) {
    var L = getLayers(ctx), T = root.HK.POI.TYPES, c = layerCounts(ctx), I = root.HK.Icons;
    return ORDER.map(function (k) {
      return '<button type="button" class="wm-layer' + (L[k] ? ' on' : '') + '" data-wm-layer="' + k + '" aria-pressed="' + !!L[k] + '" style="--pc:' + T[k].color + '">' +
        I.svg(TYPE_SYMBOL[k] === 'skull' ? 'skull' : TYPE_SYMBOL[k]) + '<span>' + esc(T[k].label) + '</span><b>' + (k === 'item' ? (c[k] || 0) : (c.found[k] || 0) + '/' + (c[k] || 0)) + '</b></button>';
    }).join('');
  }
  function legend() {
    return '<div class="wm-legend"><span><i class="lg complete"></i>Completed</span><span><i class="lg current"></i>Current</span><span><i class="lg accessible">✦</i>Accessible</span><span><i class="lg locked"></i>Locked</span></div>';
  }
  /** Markup for a map container. key: unique per page ('dash' | 'full'). */
  function html(ctx, key, opts) {
    opts = opts || {};
    var I = root.HK.Icons;
    var v = VIEW[key] || {}, st = ctx.store.get().settings || {};
    var mo = MapImage.opts(ctx);
    var h = '<div class="wm' + (opts.compact ? ' compact' : ' full') + (v.fs ? ' wm-fs' : '') + (MapImage.url() ? ' has-bg' + (mo.rooms ? '' : ' no-rooms') : '') + '" data-wm="' + key + '">';
    h += '<div class="wm-stage">' + svgMarkup(ctx, key) +
      '<div class="wm-search"><input type="search" placeholder="Search the map…" value="' + esc(v.q || '') + '" data-wm-search aria-label="Search markers on the map"><div class="wm-results" hidden></div></div>' +
      '<div class="wm-zoom"><button type="button" class="icon-btn" data-wm-zoom="in" aria-label="Zoom in">' + I.svg('plus') + '</button>' +
      '<button type="button" class="icon-btn" data-wm-zoom="out" aria-label="Zoom out">' + I.svg('minus') + '</button>' +
      '<button type="button" class="icon-btn" data-wm-zoom="reset" aria-label="Reset view">' + I.svg('target') + '</button>' +
      '<button type="button" class="icon-btn" data-wm-fs aria-label="Full screen">' + I.svg('expand') + '</button>' +
      (opts.compact ? '<button type="button" class="icon-btn" data-wm-toggle-layers aria-label="Map layers">' + I.svg('layers') + '</button>' : '') + '</div>' +
      '<div class="wm-pop" hidden></div>' +
      (opts.compact ? '<div class="wm-layers-pop" hidden><div class="wm-layers">' + layerChips(ctx, true) + '</div></div>' : '') +
      '</div>';
    if (!opts.compact) h += '<div class="wm-layers">' + layerChips(ctx) + '<button type="button" class="wm-layer all" data-wm-all="1">All</button><button type="button" class="wm-layer all" data-wm-all="0">None</button>' +
      '<label class="wm-layer all"><input type="checkbox" data-wm-hidefound' + (st.mapHideFound ? ' checked' : '') + '> Hide found</label></div>';
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
    if (!it) h += '<div class="wm-pop-actions"><button type="button" class="btn tiny' + (isFound(ctx, p) ? ' found' : '') + '" data-wm-found="' + esc(p.id) + '">' + (isFound(ctx, p) ? '✓ Found' : 'Mark as found') + '</button></div>';
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
    var pois = Array.prototype.slice.call(wm.querySelectorAll('.wm-poi')), labels = Array.prototype.slice.call(wm.querySelectorAll('.wm-label')), subs = Array.prototype.slice.call(wm.querySelectorAll('.wm-sub'));
    function scale() { var r = svg.getBoundingClientRect(); var sc = Math.min(r.width / VW, r.height / VH) || 1; return { r: r, sc: sc, ox: (r.width - VW * sc) / 2, oy: (r.height - VH * sc) / 2 }; }
    function toSvg(cx, cy) { var s = scale(); return { x: (cx - s.r.left - s.ox) / s.sc, y: (cy - s.r.top - s.oy) / s.sc }; }
    function clamp() {
      v.k = Math.max(1, Math.min(MAXK, v.k));
      var minX = VW - VW * v.k, minY = VH - VH * v.k;
      v.x = Math.min(0, Math.max(minX, v.x)); v.y = Math.min(0, Math.max(minY, v.y));
    }
    function apply() {
      clamp();
      world.setAttribute('transform', 'translate(' + v.x.toFixed(2) + ',' + v.y.toFixed(2) + ') scale(' + v.k.toFixed(3) + ')');
      var ms = 1 / Math.pow(v.k, 0.5) * (compact && v.k < 1.6 ? 0.8 : 1), ls = 1 / Math.pow(v.k, compact ? 0.8 : 0.55);
      pois.forEach(function (g) { g.setAttribute('transform', 'translate(' + g.getAttribute('data-x') + ',' + g.getAttribute('data-y') + ') scale(' + ms.toFixed(3) + ')'); });
      labels.forEach(function (g) { g.setAttribute('transform', 'translate(' + g.getAttribute('data-lx') + ',' + g.getAttribute('data-ly') + ') scale(' + ls.toFixed(3) + ')'); });
      var ss = 1 / Math.pow(v.k, 0.75);
      subs.forEach(function (t) { t.setAttribute('transform', 'translate(' + t.getAttribute('data-lx') + ',' + t.getAttribute('data-ly') + ') scale(' + ss.toFixed(3) + ') translate(' + (-t.getAttribute('data-lx')) + ',' + (-t.getAttribute('data-ly')) + ')'); });
      wm.classList.toggle('zoomed', v.k > 1.6);
      wm.classList.toggle('zoomed2', v.k > 2.6);
      placePop();
    }
    function zoomAt(px, py, f) { var nk = Math.max(1, Math.min(MAXK, v.k * f)); v.x = px - (px - v.x) * (nk / v.k); v.y = py - (py - v.y) * (nk / v.k); v.k = nk; apply(); }
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
        var nk = Math.max(1, Math.min(MAXK, pinch.k * d / pinch.d));
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
      var fb = e.target.closest('[data-wm-found]');
      if (fb) { var fm = Object.assign({}, found(ctx)), fid = fb.getAttribute('data-wm-found'); if (fm[fid]) delete fm[fid]; else fm[fid] = true; pop.removeAttribute('data-for'); ctx.store.setSetting('poiFound', fm); return; }
      if (e.target.closest('[data-wm-fs]')) { v.fs = !v.fs; wm.classList.toggle('wm-fs', v.fs); document.body.classList.toggle('map-fs', v.fs); apply(); return; }
      var sr = e.target.closest('[data-wm-goto]');
      if (sr) { focusPoint(sr.getAttribute('data-wm-goto')); wm.querySelector('.wm-results').hidden = true; return; }
      if (e.target.closest('[data-wm-toggle-layers]')) { var lp = wm.querySelector('.wm-layers-pop'); if (lp) { lp.hidden = !lp.hidden; v.layersOpen = !lp.hidden; } return; }
      var l = e.target.closest('[data-wm-layer]');
      if (l) { var L = getLayers(ctx); L[l.getAttribute('data-wm-layer')] = !L[l.getAttribute('data-wm-layer')]; ctx.store.setSetting('mapLayers', L); return; }
      var all = e.target.closest('[data-wm-all]');
      if (all) { var on = all.getAttribute('data-wm-all') === '1', L2 = {}; Object.keys(DEFAULT_LAYERS).forEach(function (k) { L2[k] = on; }); ctx.store.setSetting('mapLayers', L2); }
    });
    function focusPoint(id) {
      var q = positions(ctx.DATA, root.HK.POI)[id]; if (!q) return;
      var g = wm.querySelector('.wm-poi[data-poi="' + cssEsc(id) + '"]');
      if (!g) { // its layer is hidden: switch it on first
        var p = poiById(ctx, id); if (!p) return;
        var L = getLayers(ctx); L[p.type] = true; v.poi = id; v.k = Math.max(v.k, 4); v.x = VW / 2 - q.x * v.k; v.y = VH / 2 - q.y * v.k;
        ctx.store.setSetting('mapLayers', L); return;
      }
      v.k = Math.max(v.k, 4); v.x = VW / 2 - q.x * v.k; v.y = VH / 2 - q.y * v.k; apply(); select(id);
    }
    wm._focusPoint = focusPoint;
    var sIn = wm.querySelector('[data-wm-search]'), sRes = wm.querySelector('.wm-results');
    function runSearch() {
      var q = sIn.value.trim().toLowerCase(); v.q = q;
      pois.forEach(function (g) { var p = poiById(ctx, g.getAttribute('data-poi')); var hit = q && p && (p.name + ' ' + p.note).toLowerCase().indexOf(q) >= 0; g.classList.toggle('hit', !!hit); g.classList.toggle('dim', !!q && !hit); });
      if (q.length < 2) { sRes.hidden = true; return; }
      var T = root.HK.POI.TYPES, list = allPois(ctx.DATA, root.HK.POI).filter(function (p) { return (p.name + ' ' + p.note).toLowerCase().indexOf(q) >= 0 && !(p.type === 'item' && isFound(ctx, p)); }).slice(0, 10);
      sRes.innerHTML = list.length ? list.map(function (p) { return '<button type="button" data-wm-goto="' + esc(p.id) + '"><b>' + esc(p.name) + '</b><small>' + esc(T[p.type].one + ' · ' + (ctx.E.regionById[p.region] || {}).name) + '</small></button>'; }).join('') : '<div class="muted">No match</div>';
      sRes.hidden = false;
    }
    sIn.addEventListener('input', runSearch);
    sIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = sRes.querySelector('[data-wm-goto]'); if (f) f.click(); } if (e.key === 'Escape') { sIn.value = ''; runSearch(); } });
    var hf = wm.querySelector('[data-wm-hidefound]');
    if (hf) hf.addEventListener('change', function () { ctx.store.setSetting('mapHideFound', hf.checked); });
    if (v.fs) document.body.classList.add('map-fs');
    function zoomCenter(f) {
      var cx = (VW / 2 - v.x) / v.k, cy = (VH / 2 - v.y) / v.k; // world point at view centre
      var nk = Math.max(1, Math.min(MAXK, v.k * f));
      v.x = VW / 2 - cx * nk; v.y = VH / 2 - cy * nk; v.k = nk; apply();
    }
    if (v.layersOpen) { var lpop = wm.querySelector('.wm-layers-pop'); if (lpop) lpop.hidden = false; }
    wm._focusRegion = function (id) {
      var b = bbox(id), k = Math.max(1, Math.min(5, Math.min(VW / (b.w + 120), VH / (b.h + 120))));
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
  function focusPoi(scope, id) { scope.querySelectorAll('.wm[data-wm]').forEach(function (wm) { if (wm._focusPoint) wm._focusPoint(id); }); }
  function focusRegion(scope, id) { scope.querySelectorAll('.wm[data-wm]').forEach(function (wm) { if (wm._focusRegion) wm._focusRegion(id); }); }

  /* ----------------------------- your own map image ----------------------------- */
  // An image YOU load stays in this browser (IndexedDB). Nothing is uploaded or published.
  var MapImage = (function () {
    var url = null, nat = null, DB = 'hk-companion-map';
    function db(mode, fn) {
      return new Promise(function (res, rej) {
        if (!root.indexedDB) { rej(new Error('IndexedDB not available')); return; }
        var rq = root.indexedDB.open(DB, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('img'); };
        rq.onerror = function () { rej(rq.error); };
        rq.onsuccess = function () { var d = rq.result, tx = d.transaction('img', mode), r = fn(tx.objectStore('img')); tx.oncomplete = function () { d.close(); res(r && r.result); }; tx.onerror = function () { d.close(); rej(tx.error); }; };
      });
    }
    function use(blob) {
      return new Promise(function (res) {
        if (url) { try { URL.revokeObjectURL(url); } catch (e) { /* noop */ } }
        url = blob ? URL.createObjectURL(blob) : null; nat = null;
        if (!url) { res(); return; }
        var im = new Image(); im.onload = function () { nat = { w: im.naturalWidth, h: im.naturalHeight }; res(); }; im.onerror = function () { res(); }; im.src = url;
      });
    }
    return {
      load: function () { return db('readonly', function (st) { return st.get('bg'); }).then(function (rec) { return use(rec && rec.blob); }, function () { /* no db */ }); },
      set: function (file) { return db('readwrite', function (st) { st.put({ name: file.name, blob: file }, 'bg'); }).then(function () { return use(file); }); },
      clear: function () { return db('readwrite', function (st) { st.delete('bg'); }).then(function () { return use(null); }); },
      url: function () { return url; },
      natural: function () { return nat; },
      opts: function (ctx) {
        var o = ((ctx.store.get().settings || {}).mapImage) || {};
        var w = VW * (o.scale || 1), h = nat ? w * nat.h / nat.w : VH;
        return { x: o.x || 0, y: o.y || 0, w: w, h: h, sx: o.stretch || 1, opacity: o.opacity == null ? 0.9 : o.opacity, rooms: o.rooms !== false, scale: o.scale || 1, stretch: o.stretch || 1 };
      }
    };
  })();

  root.HK = root.HK || {};
  root.HK.WorldMap = { MapImage: MapImage, html: html, focusPoi: focusPoi, isFound: isFound, hydrate: hydrate, focusRegion: focusRegion, allPois: allPois, positions: positions, SHAPES: SHAPES, DEFAULT_LAYERS: DEFAULT_LAYERS, getLayers: getLayers, VIEW: VIEW };
})(typeof window !== 'undefined' ? window : globalThis);
