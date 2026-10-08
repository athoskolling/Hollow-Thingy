/*
 * Hollow Knight Companion — APP / UI
 * Renders every view from HK.DATA + state through the engine.
 */
(function () {
  'use strict';
  var DATA = HK.DATA;
  var store = HK.State.createStore(DATA);
  var E = HK.createEngine(DATA, store.get);
  var byId = E.byId;
  var view = document.getElementById('view');
  var expanded = {};             // expanded item rows (UI only)
  var ui = { filter: 'all', query: '', trackerTab: 'geo', pendingImport: null, panelRegion: null, regionTab: 'overview', panelAll: false };
  var music = null;               // region soundtrack player (audio.js)
  var sync = null;                // optional sync between devices (sync.js)

  /* ============================== helpers ============================== */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function regionName(id) { var r = E.regionById[id]; return r ? r.name : id; }
  function st() { return store.get(); }
  var TYPE_LABEL = { ability: 'Movement', spell: 'Spell', nail: 'Nail upgrade', nailart: 'Nail Art', mask: 'Mask Shard', vessel: 'Vessel Fragment',
    charm: 'Charm', notch: 'Charm Notch', ore: 'Pale Ore', key: 'Key', boss: 'Boss', warrior: 'Warrior Dream', dreamboss: 'Dream Boss',
    dreamer: 'Dreamer', dream: 'Dream Nail', colosseum: 'Trial', grimm: 'Grimm Troupe', godhome: 'Godhome', ending: 'Ending', root: 'Whispering Root',
    item: 'Item', npc: 'NPC / Quest', access: 'Access', derived: 'Auto' };
  function pctLabel(it) {
    if (it.completion) return '+' + it.completion + '%';
    if (it.contrib) return it.type === 'mask' ? '¼%' : it.type === 'vessel' ? '⅓%' : 'nail';
    return '';
  }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3600);
    setTimeout(function () { t.remove(); }, 4200);
  }
  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function chip(id, opts) {
    var it = byId[id]; if (!it) return '';
    var done = E.isDone(id), implied = !done && E.isImplied(id);
    return '<button class="chip ' + (done ? 'ok' : implied ? 'implied' : 'no') + '" data-action="open-item" data-id="' + id + '" title="' + esc(TYPE_LABEL[it.type]) + ' · ' + esc(regionName(it.region)) + '">' +
      (done ? '✓' : implied ? '≈' : '✗') + ' ' + esc(it.name) + '</button>';
  }
  function missingHtml(groups) {
    return groups.map(function (g) {
      var inner = g.ids.map(function (x) { return chip(x); }).join(g.mode === 'any' ? '<span class="or">or</span>' : ' ');
      return '<div class="req-group">' + (g.mode === 'any' ? '<span class="tag">one of</span>' : '') + (g.region ? '<span class="tag">region access</span>' : '') + inner + '</div>';
    }).join('');
  }
  function reqHtml(it) {
    var parts = [];
    if (it.req.length) parts.push(it.req.map(function (r) { return chip(r); }).join(' '));
    if (it.any.length) parts.push('<span class="tag">one of</span>' + it.any.map(function (r) { return chip(r); }).join('<span class="or">or</span>'));
    var reg = E.regionById[it.region];
    if (reg && ((reg.req && reg.req.length) || (reg.any && reg.any.length))) {
      var ra = [];
      (reg.req || []).forEach(function (r) { if (r !== it.id) ra.push(chip(r)); });
      if (reg.any && reg.any.length && reg.any.indexOf(it.id) < 0) ra.push('<span class="tag">one of</span>' + reg.any.map(function (r) { return chip(r); }).join('<span class="or">or</span>'));
      if (ra.length) parts.push('<span class="tag">region access</span>' + ra.join(' '));
    }
    if (it.soft) {
      var s = [];
      if (it.soft.essence) s.push('<span class="soft ' + (st().resources.essence >= it.soft.essence ? 'ok' : 'no') + '">' + fmt(it.soft.essence) + ' Essence (you: ' + fmt(st().resources.essence) + ')</span>');
      if (it.soft.grubs) s.push('<span class="soft ' + (st().resources.grubs >= it.soft.grubs ? 'ok' : 'no') + '">' + it.soft.grubs + ' Grubs (you: ' + st().resources.grubs + ')</span>');
      if (it.soft.charms) s.push('<span class="soft ' + (E.charmCount() >= it.soft.charms ? 'ok' : 'no') + '">' + it.soft.charms + ' Charms (you: ' + E.charmCount() + ')</span>');
      if (it.soft.keyHeld) s.push('<span class="soft ' + (E.keys().held >= 1 ? 'ok' : 'no') + '">a Simple Key in hand (you: ' + E.keys().held + ')</span>');
      parts.push(s.join(' '));
    }
    return parts.length ? parts.join('<br>') : '<span class="muted">None</span>';
  }
  function completionText(it) {
    if (it.beyond) return 'Beyond 112% — does not count.';
    if (it.completion) return '+' + it.completion + '% of 112%' + (it.derived ? ' (automatic)' : '');
    if (it.type === 'mask') return 'Indirect: every 4 Mask Shards = +1% (Ancient Mask).';
    if (it.type === 'vessel') return 'Indirect: every 3 Vessel Fragments = +1% (Soul Vessel).';
    if (it.type === 'ore') return 'Indirect: Pale Ore is needed for the Nail upgrades (4%).';
    if (it.id === 'grimmchild' || it.id === 'carefree-melody') return 'Counts via the shared charm slot (+1%) — see "Grimmchild or Carefree Melody".';
    if (it.id === 'nightmare-king-grimm' || it.id === 'banishment') return 'Counts via "Nightmare King Grimm or Banishment" (+1%).';
    if (it.id === 'white-fragment-queen' || it.id === 'white-fragment-king') return 'Needed for Kingsoul (+1%), which only counts when complete.';
    return 'Does not count for 112%.';
  }

  /* ============================== item rows ============================== */
  function voidHeartBanner(compact) {
    if (E.isVoidHeartLocked()) {
      return '<div class="banner danger vh' + (compact ? ' compact' : '') + '"><strong>🔒 VOID HEART — NÃO PEGUE AINDA</strong><span>«Faça primeiro o ending “The Hollow Knight”.»</span>' +
        (E.voidHeartViolation() ? '<em>⚠ Void Heart is marked as obtained before the ending — the first ending may be lost.</em>' : '') + '</div>';
    }
    return '<div class="banner safe vh' + (compact ? ' compact' : '') + '"><strong>🔓 VOID HEART — AGORA É SEGURO</strong><span>“The Hollow Knight” ending recorded.</span></div>';
  }
  function itemRow(it, opts) {
    opts = opts || {};
    var done = E.isDone(it.id), implied = !done && E.isImplied(it.id);
    var miss = E.missing(it), soft = E.softIssues(it);
    var cls = ['item', 'type-' + it.type];
    if (done) cls.push('done'); if (implied) cls.push('implied');
    if (it.derived) cls.push('derived'); if (it.optional) cls.push('optional'); if (it.beyond) cls.push('beyond');
    if (!done && miss.length) cls.push('blocked');
    if (expanded[it.id]) cls.push('open');
    var badge = '';
    if (it.voidHeart && E.isVoidHeartLocked()) badge = '<span class="badge danger">🔒 NOT YET</span>';
    else if (done && miss.length && !it.derived) badge = '<span class="badge warn" title="Requirement not recorded">⚠</span>';
    else if (implied) badge = '<span class="badge">implied</span>';
    else if (!done && miss.length) badge = '<span class="badge muted">locked</span>';
    else if (!done && soft.length) badge = '<span class="badge muted">needs ' + esc(soft[0].label) + '</span>';
    if (it.optional && !it.beyond) badge += '<span class="badge opt">optional</span>';
    if (it.beyond) badge += '<span class="badge beyond">beyond 112%</span>';
    var input = it.derived
      ? '<span class="auto-chk ' + (done ? 'on' : '') + '" title="Calculated automatically">' + (done ? '✓' : '○') + '</span>'
      : '<input type="checkbox" class="chk" data-action="toggle" data-id="' + it.id + '"' + (done ? ' checked' : '') + ' aria-label="Mark ' + esc(it.name) + '">';
    return '<div class="' + cls.join(' ') + '" id="item-' + it.id + '" data-id="' + it.id + '">' +
      '<div class="item-head">' + input +
        '<button class="item-title" data-action="expand" data-id="' + it.id + '" aria-expanded="' + !!expanded[it.id] + '">' +
          '<span class="nm">' + esc(it.name) + '</span>' +
          '<span class="meta">' + esc(TYPE_LABEL[it.type] || it.type) + (opts.showRegion ? ' · ' + esc(regionName(it.region)) : '') + '</span>' +
          badge + (pctLabel(it) ? '<span class="pct">' + pctLabel(it) + '</span>' : '') + '<span class="chev">›</span>' +
        '</button></div>' +
      '<div class="item-body"><div class="item-body-inner">' + (expanded[it.id] ? itemDetail(it) : '') + '</div></div></div>';
  }
  function itemDetail(it) {
    var done = E.isDone(it.id), miss = E.missing(it, { noRegion: true });
    var s = st(), h = '';
    if (it.voidHeart) h += voidHeartBanner(true);
    if (done && miss.length && !it.derived) h += '<div class="banner warn compact">⚠️ Seu save indica que talvez algum requisito anterior não tenha sido registrado.' + missingHtml(miss) + '<button class="btn small" data-action="mark-prereqs" data-id="' + it.id + '">Mark these as done</button></div>';
    if (it.excludes && it.excludes.some(E.isDone)) h += '<div class="banner warn compact">Mutually exclusive with: ' + it.excludes.map(function (x) { return chip(x); }).join(' ') + '</div>';
    h += '<dl class="facts' + (s.settings.spoilers && !done ? ' spoiler' : '') + '">';
    h += '<dt>📍 Location</dt><dd><a href="#/region/' + it.region + '">' + esc(regionName(it.region)) + '</a>' + (it.loc ? ' — <span class="sp">' + esc(it.loc) + '</span>' : '') + '</dd>';
    if (it.fn || it.reward) h += '<dt>🎯 Function</dt><dd>' + esc(it.fn || '') + (it.reward ? (it.fn ? '<br>' : '') + 'Reward: ' + esc(it.reward) : '') + '</dd>';
    h += '<dt>🔑 Requirements</dt><dd>' + reqHtml(it) + '</dd>';
    if (it.how) h += '<dt>🧭 How to get</dt><dd class="sp">' + esc(it.how) + (it.tip ? '<br><em>Tip: ' + esc(it.tip) + '</em>' : '') + '</dd>';
    var unlocks = (it.unlocks || []).concat(DATA.ITEMS.filter(function (x) { return x.req.indexOf(it.id) >= 0 && (it.unlocks || []).indexOf(x.id) < 0; }).map(function (x) { return x.id; }));
    if (unlocks.length) h += '<dt>🔓 Unlocks</dt><dd>' + unlocks.slice(0, 14).map(function (u) { return chip(u); }).join(' ') + '</dd>';
    h += '<dt>📈 112%</dt><dd>' + completionText(it) + '</dd>';
    if (it.cost && (it.cost.geo || it.cost.ore)) h += '<dt>💰 Cost</dt><dd>' + (it.cost.geo ? fmt(it.cost.geo) + ' Geo' : '') + (it.cost.ore ? ' + ' + it.cost.ore + ' Pale Ore' : '') + (it.cost.geo ? ' <span class="muted">(you have ' + fmt(s.resources.geo) + ')</span>' : '') + '</dd>';
    if (it.essence) h += '<dt>✧ Essence</dt><dd>' + it.essence + '</dd>';
    if (it.notches) h += '<dt>✦ Notches</dt><dd>' + '◆'.repeat(it.notches) + ' (' + it.notches + ')</dd>';
    if (it.wiki) h += '<dt>🔗 Wiki</dt><dd><a href="' + it.wiki + '" target="_blank" rel="noopener">' + esc(it.wiki.replace('https://', '')) + ' ↗</a></dd>';
    h += '</dl>';
    if (!it.derived) {
      h += '<div class="item-actions">' +
        '<button class="btn small" data-action="pin" data-id="' + it.id + '">' + (s.pinned === it.id ? '📌 Unpin' : '📌 Pin as objective') + '</button>' +
        '<button class="btn small ghost" data-action="set-region" data-id="' + it.region + '">I am in ' + esc(regionName(it.region)) + '</button>' +
        '</div>' +
        '<label class="note-label">Notes<textarea data-action="note" data-id="' + it.id + '" rows="2" placeholder="Your notes…">' + esc(s.notes[it.id] || '') + '</textarea></label>';
    }
    return h;
  }
  function itemList(items, opts) {
    if (!items.length) return '<p class="muted empty">Nothing here.</p>';
    return '<div class="items' + (st().settings.compact ? ' compact' : '') + '">' + items.map(function (i) { return itemRow(i, opts); }).join('') + '</div>';
  }

  /* ============================== stats strip ============================== */
  function ring(value, max, label, sub) {
    var r = 46, c = 2 * Math.PI * r, p = Math.min(1, value / max);
    return '<div class="ring"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="' + r + '" class="ring-bg"/><circle cx="55" cy="55" r="' + r + '" class="ring-fg" stroke-dasharray="' + (c * p) + ' ' + c + '"/></svg>' +
      '<div class="ring-text"><b>' + value + '</b><span>/ ' + max + (label === 'Completion' ? '%' : '') + '</span></div><div class="ring-label">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  }
  function statsStrip() {
    var c = E.completion(), cl = E.checklist(), sh = E.shards(), v = E.vessels(), o = E.ore(), s = st();
    return '<div class="stats">' +
      ring(c.value, 112, 'Completion', 'official %') + ring(cl.done, cl.total, 'Checklist', 'everything in the guide') +
      '<div class="mini-stats">' +
        mini('◈', 'Masks', sh.masks + ' <small>(' + sh.shards + '/16 shards)</small>', '#/trackers/masks') +
        mini('◉', 'Soul Vessels', v.vessels + '/3 <small>(' + v.fragments + '/9)</small>', '#/trackers/masks') +
        mini('⚔', 'Nail', E.NAIL_NAMES[E.nailLevel()], '#/trackers/nail') +
        mini('⬢', 'Pale Ore', o.collected + '/6 <small>(' + o.held + ' held)</small>', '#/trackers/nail') +
        mini('✦', 'Charms', E.charmCount() + '/40 <small>· ' + E.notches() + ' notches</small>', '#/trackers/charms') +
        mini('✧', 'Essence', fmt(s.resources.essence) + '/2400', '#/trackers/essence') +
        mini('◆', 'Geo', fmt(s.resources.geo), '#/trackers/geo') +
        mini('◌', 'Grubs', s.resources.grubs + '/46', '#/trackers/essence') +
      '</div></div>';
  }
  function mini(icon, label, value, href) { return '<a class="mini" href="' + href + '"><span class="mi">' + icon + '</span><span class="ml">' + label + '</span><span class="mv">' + value + '</span></a>'; }
  function resourceEditors() {
    var r = st().resources;
    return '<div class="res-editors">' +
      resInput('geo', 'Geo', r.geo, 0) + resInput('essence', 'Essence', r.essence, 0) + resInput('grubs', 'Grubs', r.grubs, 46) + '</div>';
  }
  function resInput(key, label, val, max) {
    return '<label class="res"><span>' + label + '</span><div class="stepper"><button class="icon-btn" data-action="res-step" data-key="' + key + '" data-step="-1" aria-label="Decrease ' + label + '">−</button>' +
      '<input type="number" inputmode="numeric" min="0"' + (max ? ' max="' + max + '"' : '') + ' value="' + val + '" data-action="res" data-key="' + key + '" aria-label="' + label + '">' +
      '<button class="icon-btn" data-action="res-step" data-key="' + key + '" data-step="1" aria-label="Increase ' + label + '">+</button></div></label>';
  }
  function regionSelect() {
    return '<label class="region-select">📍 <span>I AM CURRENTLY IN:</span><select data-action="region">' +
      DATA.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === st().currentRegion ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') + '</select></label>';
  }
  function warningsBox() {
    var w = E.inconsistencies();
    if (!w.length) return '';
    var list = w.slice(0, 6).map(function (x) {
      if (x.item) return '<li>' + chip(x.item.id) + ' needs ' + missingHtml(x.missing) + '</li>';
      return '<li>' + esc(x.text) + '</li>';
    }).join('');
    return '<div class="banner warn"><strong>⚠️ Seu save indica que talvez algum requisito anterior não tenha sido registrado.</strong><ul class="warn-list">' + list + '</ul>' +
      (w.length > 6 ? '<span class="muted">+' + (w.length - 6) + ' more</span>' : '') +
      '<button class="btn small" data-action="mark-all-implied">Mark all implied prerequisites as done</button></div>';
  }

  /* ============================== VIEWS ============================== */
  var views = {};

  /* ------------------------------ dashboard helpers ------------------------------ */
  var IC = HK.Icons;
  function ico(name, cls) { return IC.svg(name, cls); }
  function typeIco(it) { return '<span class="ti t-' + it.type + '">' + ico(IC.forType(it.type)) + '</span>'; }
  function bar(pct) { return '<div class="bar"><span style="width:' + Math.max(0, Math.min(100, pct)) + '%"></span></div>'; }
  function regionArt(r, W, H) { return HK.Art.scene(r.theme, W || 600, H || 150); }
  /** compact checklist row used by panels (checkbox · icon · name · % · open) */
  function rrow(it, opts) {
    opts = opts || {};
    var done = E.isDone(it.id), implied = !done && E.isImplied(it.id), miss = !done && E.missing(it).length;
    var input = it.derived ? '<span class="auto-chk ' + (done ? 'on' : '') + '">' + (done ? '✓' : '○') + '</span>'
      : '<input type="checkbox" class="chk" data-action="toggle" data-id="' + it.id + '"' + (done ? ' checked' : '') + ' aria-label="Mark ' + esc(it.name) + '">';
    var sub = opts.sub || (TYPE_LABEL[it.type] || it.type) + (opts.showRegion ? ' · ' + regionName(it.region) : '');
    var badge = it.voidHeart && E.isVoidHeartLocked() ? '<span class="badge danger">🔒</span>' : implied ? '<span class="badge">implied</span>' : miss ? '<span class="badge muted">locked</span>' : '';
    return '<div class="rrow' + (done ? ' done' : '') + (it.optional ? ' optional' : '') + '"' + (opts.id ? ' id="item-' + it.id + '"' : '') + ' data-id="' + it.id + '">' + input + typeIco(it) +
      '<button class="rr-main" data-action="open-item" data-id="' + it.id + '"><b>' + esc(it.name) + '</b><small>' + esc(sub) + '</small></button>' + badge +
      (pctLabel(it) ? '<span class="pct">' + pctLabel(it) + '</span>' : '') +
      '<button class="icon-btn rr-go" data-action="open-item" data-id="' + it.id + '" aria-label="Details: ' + esc(it.name) + '">' + ico('chevron') + '</button></div>';
  }
  function poiRow(p, focus) {
    var T = HK.POI.TYPES[p.type];
    return '<div class="rrow poi">' + '<span class="ti" style="--pc:' + T.color + '">' + ico(p.type === 'boss' ? 'skull' : p.type) + '</span>' +
      '<div class="rr-main static"><b>' + esc(p.name) + '</b><small>' + esc(T.one + (p.sub ? ' · ' + p.sub : '') + (p.cost ? ' · ' + p.cost + ' Geo' : '') + (p.note ? ' — ' + p.note : '')) + '</small></div>' +
      (p.item && byId[p.item] ? '<button class="icon-btn rr-go" data-action="open-item" data-id="' + p.item + '" aria-label="Details">' + ico('chevron') + '</button>' : '') + '</div>';
  }
  function routeList(n) {
    var out = [], seen = {};
    E.stageStatus().forEach(function (x) {
      if (out.length >= n || x.status === 'complete' || x.stage.id === 's-beyond') return;
      var g = (x.goals || []).filter(function (i) { return !E.isDone(i.id) && !E.isImplied(i.id) && !(i.voidHeart && E.isVoidHeartLocked()); })[0];
      if (!g || seen[g.id]) return; seen[g.id] = 1; out.push(g);
    });
    return out;
  }
  function shortRegion(id) { return regionName(id).replace(" & King's Pass", '').replace(' & Colosseum', ''); }
  function noticeBox() {
    var w = E.inconsistencies();
    if (!w.length) return '';
    var list = w.slice(0, 6).map(function (x) { return x.item ? '<li>' + chip(x.item.id) + ' needs ' + missingHtml(x.missing) + '</li>' : '<li>' + esc(x.text) + '</li>'; }).join('');
    return '<div class="notice warn"><span>⚠️ Seu save indica que talvez algum requisito anterior não tenha sido registrado.</span>' +
      '<details><summary>' + w.length + ' item' + (w.length > 1 ? 's' : '') + '</summary><ul class="warn-list">' + list + '</ul></details>' +
      '<button class="btn small" data-action="mark-all-implied">Mark all implied prerequisites as done</button></div>';
  }
  views.dashboard = function () {
    var s = st(), nxt = E.nextObjective(), h = '', c = E.completion(), cl = E.checklist(), cur = s.currentRegion;
    h += '<div class="now">';
    h += '<p class="greet">Welcome back, little Knight.</p>';
    // alerts (only when relevant)
    h += voidHeartBanner(true);
    if (E.isDone('black-egg')) h += '<div class="banner gold compact"><strong>🔓 BLACK EGG OPEN</strong>' + (E.isDone('ending-thk') ? '<span>All three Dreamers are sealed away.</span>' : '<span>⚠️ FAÇA O FINAL BÁSICO ANTES DO VOID HEART.</span>') + '</div>';
    h += noticeBox();
    // the one thing to do now
    h += '<section class="card objective" id="objective">';
    if (!nxt) {
      h += '<p class="eyebrow">Next objective</p><h2 class="obj-name">Nothing left on the route 🎉</h2><p class="muted">See <a href="#/trackers/godhome">Beyond 112%</a>.</p>';
    } else {
      var it = nxt.item, away = it.region !== cur;
      h += '<p class="eyebrow">' + ico('target') + ' Next objective' + (nxt.pinned ? ' · 📌 pinned' : '') + '</p>';
      h += '<h2 class="obj-name">' + esc(it.name) + ' <span class="pct">' + pctLabel(it) + '</span></h2>';
      h += '<p class="obj-type">' + esc(TYPE_LABEL[it.type]) + ' · ' + (away ? 'head to <b>' + esc(shortRegion(it.region)) + '</b>' : 'here in <b>' + esc(shortRegion(it.region)) + '</b>') + '</p>';
      var reqs = it.req.length || it.any.length || E.missingRegionAccess(it.region).length || it.soft;
      if (reqs) h += '<div class="req-list">' + objReqList(it) + '</div>';
      if (nxt.missing.length) h += '<p class="small neg">Blocked — missing: ' + missingHtml(nxt.missing) + '</p>';
      if (it.loc || it.how) h += '<details class="obj-how' + (s.settings.spoilers ? ' spoiler' : '') + '"><summary>Where & how</summary><p class="sp">' + esc(it.loc || '') + '</p><p class="sp muted">' + esc(it.how || '') + '</p>' +
        (E.recommendedGeo(nxt) ? '<p class="small">Recommended Geo: <b class="gold">' + fmt(E.recommendedGeo(nxt)) + '</b> <span class="muted">(you have ' + fmt(s.resources.geo) + ')</span></p>' : '') + '</details>';
      h += '<div class="obj-actions"><button class="btn btn-primary" data-action="toggle" data-id="' + it.id + '">✓ Mark done</button>' +
        '<button class="btn ghost" data-action="open-item" data-id="' + it.id + '">Details</button>' +
        '<button class="btn ghost" data-action="pin" data-id="' + it.id + '">' + (s.pinned === it.id ? 'Unpin' : 'Pin') + '</button></div>';
    }
    h += '</section>';
    // three numbers
    h += '<div class="kpis"><a class="kpi" href="#/audit"><span>Completion</span><b>' + c.value + '<small>/112%</small></b>' + bar(c.value / 112 * 100) + '</a>' +
      '<a class="kpi" href="#/checklist"><span>Checklist</span><b>' + cl.done + '<small>/' + cl.total + '</small></b>' + bar(cl.done / cl.total * 100) + '</a>' +
      '<a class="kpi" href="#/trackers/geo"><span>Geo</span><b>' + fmt(s.resources.geo) + '</b><small class="muted">' + (E.nextNail() ? 'next nail ' + fmt(E.nextNail().geo) : 'nail maxed') + '</small></a></div>';
    // here + up next
    var here = E.whileHere(cur, nxt && nxt.item.id, 5);
    h += '<div class="duo">';
    h += '<section class="card"><div class="card-title"><h3>' + ico('pin') + ' In ' + esc(shortRegion(cur)) + '</h3>' +
      '<label class="change-region">Change ' + ico('arrow') + '<select data-action="region" aria-label="Current region">' + DATA.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (r.id === cur ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') + '</select></label></div>' +
      (here.length ? '<div class="rp-list">' + here.map(function (i) { return rrow(i, { id: true }); }).join('') + '</div>' : '<p class="muted">Nothing accessible left here — time to move on.</p>') +
      '<a class="link-more" href="#/region/' + cur + '">Everything in ' + esc(shortRegion(cur)) + ' →</a></section>';
    var up = routeList(4);
    h += '<section class="card"><div class="card-title"><h3>' + ico('route') + ' Up next</h3><a class="link-more" href="#/roadmap">Roadmap →</a></div>' +
      (up.length ? '<ol class="upnext">' + up.map(function (g, i) { return '<li' + (i === 0 ? ' class="now"' : '') + '><button data-action="open-item" data-id="' + g.id + '"><b>' + esc(g.name) + '</b><small>' + esc(shortRegion(g.region)) + '</small></button></li>'; }).join('') + '</ol>' : '<p class="muted">The main route is complete.</p>') + '</section>';
    h += '</div>';
    // regions at a glance
    h += '<section class="card"><div class="card-title"><h3>' + ico('compass') + ' Regions</h3><a class="link-more" href="#/regions">All →</a></div><div class="rg-list">';
    DATA.REGIONS.forEach(function (r) {
      var p = E.regionProgress(r.id), isCur = r.id === cur;
      var stt = isCur ? 'current' : p.complete ? 'complete' : p.accessible ? 'accessible' : 'locked';
      h += '<a class="rg-row st-' + stt + '" href="#/region/' + r.id + '"><span class="rg-dot" aria-hidden="true"></span><span class="rg-name">' + esc(shortRegion(r.id)) + '</span>' +
        '<span class="rg-bar">' + bar(p.pct) + '</span><span class="rg-num">' + p.mainDone + '/' + p.main + '</span></a>';
    });
    h += '</div></section>';
    h += '</div>';
    return h;
  };
  function objReqList(it) {
    var rows = [];
    it.req.forEach(function (r) { rows.push(chip(r)); });
    if (it.any.length) rows.push('<span class="tag">one of</span> ' + it.any.map(function (r) { return chip(r); }).join('<span class="or">or</span>'));
    E.missingRegionAccess(it.region).forEach(function (g) { rows.push('<span class="tag">region</span> ' + g.ids.map(function (x) { return chip(x); }).join(g.mode === 'any' ? '<span class="or">or</span>' : ' ')); });
    E.softIssues(it).forEach(function (si) { rows.push('<span class="soft no">✗ ' + esc(si.label) + ' (you: ' + si.have + ')</span>'); });
    if (it.soft && !E.softIssues(it).length) rows.push('<span class="soft ok">✓ numeric requirement met</span>');
    return rows.length ? rows.join(' ') : '<span class="chip ok">✓ No requirements</span>';
  }
  function nailStatusLine() {
    var nn = E.nextNail(), o = E.ore();
    if (!nn) return '<p class="pos small">⚔ Pure Nail forged.</p>';
    return '<p class="small nail-line">⚔ Next: <b>' + nn.to + '</b> — ' + fmt(nn.geo) + ' Geo' + (nn.ore ? ' + ' + nn.ore + ' Pale Ore' : '') + ' · ' +
      (nn.ready ? '<span class="pos">✓ You can afford it now — visit the Nailsmith!</span>' : '<span class="muted">missing ' + (nn.geoMissing ? fmt(nn.geoMissing) + ' Geo' : '') + (nn.geoMissing && nn.oreMissing ? ' + ' : '') + (nn.oreMissing ? nn.oreMissing + ' Pale Ore' : '') + '</span>') +
      ' <span class="muted">(ore held ' + o.held + ')</span></p>';
  }
  function stageStrip() {
    return '<ol class="stage-strip">' + E.stageStatus().map(function (x) {
      var icon = x.status === 'complete' ? '✓' : x.status === 'current' ? '→' : '○';
      return '<li class="st-' + x.status + (x.stage.id === 's-beyond' ? ' beyond' : '') + '" title="' + esc(x.stage.title) + '"><span>' + icon + '</span><em>' + esc(x.stage.title.split(' — ')[0]) + '</em></li>';
    }).join('') + '</ol>';
  }

  views.roadmap = function () {
    var h = '<header class="page-head"><h1>Roadmap</h1><p class="lead">Recommended order — never mandatory. It adapts to anything you do out of order.</p></header>';
    h += voidHeartBanner(true);
    h += '<ol class="timeline">';
    E.stageStatus().forEach(function (x, idx) {
      if (x.stage.id === 's-beyond') h += '</ol><h2 class="beyond-title">BEYOND 112%</h2><ol class="timeline beyond">';
      var goals = x.stage.id === 's-cleanup' ? [] : x.stage.id === 's-beyond' ? DATA.ITEMS.filter(function (i) { return i.stage === 's-beyond'; }) : x.goals;
      h += '<li class="tl st-' + x.status + '"><div class="tl-dot">' + (x.status === 'complete' ? '✓' : x.status === 'current' ? '→' : '○') + '</div><div class="tl-body">' +
        '<h3>' + esc(x.stage.title) + ' <span class="muted small">' + (x.total ? x.done + '/' + x.total : '') + '</span></h3>';
      if (x.stage.id === 's-cleanup') {
        var b = E.completionBreakdown();
        h += '<p class="muted small">Masks ' + b['Mask Shards'].got + '/4 · Vessels ' + b['Vessel Fragments'].got + '/3 · Nail ' + b['Nail Upgrades'].got + '/4 · Nail Arts ' + b['Nail Arts'].got + '/3 · Charms ' + b['Charms (base)'].got + '/36 · Warrior Dreams ' + b['Warrior Dreams'].got + '/7 · Bosses ' + b['Bosses'].got + '/14</p>' +
          '<a class="btn small" href="#/checklist">Open checklist</a>';
      } else if (x.stage.id === 's-112') {
        h += '<p>' + E.completion().value + ' / 112%</p>';
      } else {
        h += '<div class="chips">' + goals.map(function (g) { return chip(g.id); }).join(' ') + '</div>';
      }
      if (x.stage.id === 's-kingsoul') h += voidHeartBanner(true);
      h += '</div></li>';
    });
    h += '</ol>';
    return h;
  };
  views.regions = function () {
    var h = '<header class="page-head"><h1>Regions</h1><p class="lead">✓ COMPLETE · → CURRENT · ○ FUTURE — optional items never block a region.</p></header>' + regionSelect();
    h += '<div class="region-grid">' + DATA.REGIONS.map(function (r) {
      var p = E.regionProgress(r.id), status = E.regionStatus(r.id);
      var goal = E.regionItems(r.id).filter(function (i) { return !i.derived && !i.optional && !i.beyond && !E.isDone(i.id) && !(i.voidHeart && E.isVoidHeartLocked()); })
        .sort(function (a, b) { return (b.goal ? 1 : 0) - (a.goal ? 1 : 0) || (E.stageIndex[a.stage] || 0) - (E.stageIndex[b.stage] || 0); })[0];
      return '<a class="region-card theme-' + r.theme + ' st-' + status + '" href="#/region/' + r.id + '">' +
        '<div class="rc-top"><span class="rc-status">' + (status === 'complete' ? '✓ COMPLETE' : status === 'current' ? '→ CURRENT' : '○ FUTURE') + '</span>' + (p.accessible ? '' : '<span class="badge muted">access needed</span>') + '</div>' +
        '<h3>' + esc(r.name) + '</h3><div class="bar"><span style="width:' + p.pct + '%"></span></div>' +
        '<div class="rc-meta">' + p.mainDone + '/' + p.main + ' main · ' + p.allDone + '/' + p.all + ' total</div>' +
        (goal ? '<div class="rc-goal">Next: ' + esc(goal.name) + '</div>' : '<div class="rc-goal pos">Main route done</div>') + '</a>';
    }).join('') + '</div>';
    return h;
  };
  var REGION_GROUPS = [
    ['Skills & Spells', function (i) { return ['ability', 'spell', 'dream', 'nailart', 'nail'].indexOf(i.type) >= 0 && i.type !== 'derived'; }],
    ['Bosses', function (i) { return i.type === 'boss' && i.tags.indexOf('grimm') < 0; }],
    ['Warrior Dreams & Dream Bosses', function (i) { return i.type === 'warrior' || i.type === 'dreamboss'; }],
    ['Dreamers & Endings', function (i) { return i.type === 'dreamer' || i.type === 'ending' || i.id === 'black-egg'; }],
    ['Charms & Notches', function (i) { return (i.type === 'charm' || i.type === 'notch') && i.tags.indexOf('grimm') < 0 || i.id === 'white-fragment-queen' || i.id === 'white-fragment-king'; }],
    ['Mask Shards', function (i) { return i.type === 'mask'; }],
    ['Vessel Fragments', function (i) { return i.type === 'vessel'; }],
    ['Pale Ore', function (i) { return i.type === 'ore'; }],
    ['Keys & Access', function (i) { return i.type === 'key' || i.type === 'access' || (i.type === 'item' && i.tags.indexOf('key') >= 0); }],
    ['Grimm Troupe', function (i) { return i.tags.indexOf('grimm') >= 0 && i.type !== 'derived'; }],
    ['Whispering Roots (Essence)', function (i) { return i.type === 'root'; }],
    ['NPCs, Quests & Items', function (i) { return i.type === 'npc' || (i.type === 'item' && i.tags.indexOf('key') < 0 && i.id.indexOf('white-fragment') < 0); }],
    ['Godhome', function (i) { return i.type === 'godhome' || (i.region === 'godhome' && i.type === 'boss'); }],
    ['Trials', function (i) { return i.type === 'colosseum'; }],
    ['Automatic', function (i) { return i.type === 'derived' && i.region !== 'dirtmouth'; }]
  ];
  views.region = function (id) {
    var r = E.regionById[id]; if (!r) return views.regions();
    document.body.setAttribute('data-theme', r.theme);
    var p = E.regionProgress(id), status = E.regionStatus(id), items = E.regionItems(id);
    var h = '<header class="page-head region-head theme-' + r.theme + '">' + '<div class="rh-art">' + regionArt(r, 1000, 220) + '</div>' + '<a href="#/regions" class="back">← Regions</a><h1>' + esc(r.name) + '</h1>' +
      '<div class="bar big"><span style="width:' + p.pct + '%"></span></div><p class="muted">' + (status === 'complete' ? '✓ Complete · ' : status === 'current' ? 'Current · ' : '') + p.mainDone + '/' + p.main + ' main route · ' + p.allDone + '/' + p.all + ' everything</p>' +
      '<p class="access small">' + esc(r.access) + '</p>';
    var acc = E.missingRegionAccess(id);
    if (acc.length) h += '<div class="banner warn compact">Access requirements not recorded: ' + missingHtml(acc) + '</div>';
    if (st().currentRegion !== id) h += '<button class="btn small" data-action="set-region" data-id="' + id + '">📍 I am here</button>';
    h += '</header>';
    var main = items.filter(function (i) { return !i.derived && !i.optional && !i.beyond && !E.isDone(i.id) && !E.isImplied(i.id) && !(i.voidHeart && E.isVoidHeartLocked()); })
      .sort(function (a, b) { return (b.goal ? 1 : 0) - (a.goal ? 1 : 0) || (E.stageIndex[a.stage] || 0) - (E.stageIndex[b.stage] || 0) || (b.prio || 0) - (a.prio || 0); })[0];
    var here = E.whileHere(id, main && main.id);
    var todo = (main ? [main] : []).concat(here.slice(0, 7));
    if (todo.length) h += '<section class="card"><h3>To do here</h3>' + itemList(todo) + '</section>';
    if (id === 'the-abyss' || id === 'queens-gardens' || id === 'white-palace') h += voidHeartBanner(true);
    if (id === 'forgotten-crossroads' || id === 'dirtmouth') h += '<div class="banner"><strong>◌ Grubs: ' + st().resources.grubs + '/46</strong><span>Grubfather rewards: 5 → Mask Shard · 10 → Grubsong · 31 → Pale Ore · 46 → Grubberfly\'s Elegy. Per-grub locations: <a href="https://hollowknight.wiki/w/Grubs" target="_blank" rel="noopener">Wiki ↗</a></span></div>';
    var used = {};
    REGION_GROUPS.forEach(function (g) {
      var list = items.filter(function (i) { return !used[i.id] && g[1](i); });
      list.forEach(function (i) { used[i.id] = true; });
      if (!list.length) return;
      var d = list.filter(function (i) { return E.isDone(i.id); }).length;
      h += '<details class="card group"><summary><h3>' + g[0] + '</h3><span class="muted small">' + d + '/' + list.length + '</span></summary>' + itemList(list) + '</details>';
    });
    var rest = items.filter(function (i) { return !used[i.id] && !(i.type === 'derived'); });
    if (rest.length) h += '<details class="card group"><summary><h3>Other</h3><span class="muted small">' + rest.length + '</span></summary>' + itemList(rest) + '</details>';
    h += poiCard(id);
    return h;
  };


  /* ------------------------------ points of interest ------------------------------ */
  function poiCard(id) {
    var list = HK.POI.LIST.filter(function (p) { return p.region === id; });
    if (!list.length) return '';
    var order = ['stag', 'bench', 'tram', 'vendor', 'npc', 'spring', 'cornifer', 'cocoon', 'landmark', 'boss'];
    var h = '<details class="card group"><summary><h3>Benches, stations & NPCs</h3><span class="muted small">' + list.length + '</span></summary>';
    order.forEach(function (t) {
      var l = list.filter(function (p) { return p.type === t; });
      if (!l.length) return;
      h += '<h4>' + esc(HK.POI.TYPES[t].label) + ' <span class="muted">' + l.length + '</span></h4><div class="rp-list">' + l.map(poiRow).join('') + '</div>';
    });
    return h + '</details>';
  }

  /* ------------------------------ soundtrack page ------------------------------ */
  views.soundtrack = function () {
    var cur = music ? music.state() : {};
    var h = '<header class="page-head"><h1>Soundtrack</h1><p class="lead">Christopher Larkin\'s official soundtrack, region by region — streamed by Spotify.</p></header>';
    h += '<section class="card"><p class="small">The player switches track when your current region changes (or when you open a region, with <b>follow</b> ' + ico('follow') + ' on). ' +
      'Full tracks play when you\'re <b>logged into Spotify</b> in this browser — otherwise Spotify plays 30-second previews. ' +
      '<a href="' + HK.Music.ALBUM + '" target="_blank" rel="noopener">Full album on Spotify ↗</a></p></section>';
    h += '<section class="card"><div class="tracks">';
    DATA.REGIONS.forEach(function (r) {
      var t = HK.Music.track(r.id), on = cur.region === r.id;
      h += '<div class="track' + (on ? ' playing' : '') + '"><div class="tr-meta"><b>' + esc(shortRegion(r.id)) + '</b><small>♫ ' + esc(t.title) + (t.note ? ' — ' + esc(t.note) : '') + '</small></div>' +
        '<div class="tr-act"><button class="btn tiny" data-action="music-play" data-id="' + r.id + '">' + ico('play') + ' Play</button>' +
        '<a class="btn tiny ghost" href="' + t.url + '" target="_blank" rel="noopener">Spotify ↗</a></div></div>';
    });
    h += '</div></section>';
    return h;
  };

  /* ------------------------------ settings ------------------------------ */
  views.settings = function () {
    var h = '<header class="page-head"><h1>Tools & Settings</h1></header>';
    h += '<section class="card"><h3>Settings</h3><div class="settings">' +
      setting('spoilers', 'Spoiler protection (blur locations & instructions until hovered/tapped)') +
      setting('compact', 'Compact lists') + setting('hideOptional', 'Hide optional items in the checklist') + setting('hideDone', 'Hide completed items in the checklist') + '</div></section>';
    h += '<section class="card"><h3>Tools</h3><div class="btn-row">' +
      '<button class="btn" data-action="open-editor">' + ico('edit') + ' Update my save</button>' +
      '<a class="btn" href="#/save">' + ico('save') + ' Import save / backup</a>' +
      '<a class="btn" href="#/soundtrack">' + ico('note') + ' Soundtrack</a>' +
      '<a class="btn" href="#/audit">' + ico('chart') + ' 112% audit</a></div></section>';
    h += '<section class="card"><h3>About</h3><p class="small muted">Fan-made companion. Data from hollowknight.wiki (CC BY-SA). No official art or music is included. Not affiliated with Team Cherry.</p></section>';
    return h;
  };

  var FILTERS = [['all', 'All'], ['112', '112%'], ['progression', 'Progression'], ['skill', 'Skills'], ['spell', 'Spells'], ['boss', 'Bosses'], ['charm', 'Charms'],
    ['mask', 'Masks'], ['vessel', 'Vessels'], ['ore', 'Pale Ore'], ['key', 'Keys'], ['dream', 'Dream'], ['optional', 'Optional']];
  function matchFilter(i, f) {
    if (f === 'all') return true;
    if (f === '112') return i.completion > 0 || i.contrib;
    if (f === 'optional') return !!i.optional || !!i.beyond;
    if (f === 'skill') return ['ability', 'nailart'].indexOf(i.type) >= 0 || i.tags.indexOf('skill') >= 0;
    if (f === 'spell') return i.type === 'spell';
    if (f === 'boss') return ['boss', 'warrior', 'dreamboss', 'colosseum'].indexOf(i.type) >= 0 || (i.type === 'godhome' && i.id.indexOf('pantheon') === 0);
    if (f === 'charm') return i.type === 'charm' || i.type === 'notch';
    if (f === 'dream') return i.tags.indexOf('dream') >= 0 || i.type === 'dreamer';
    return i.tags.indexOf(f) >= 0 || i.type === f;
  }
  function matchQuery(i, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return (i.name + ' ' + regionName(i.region) + ' ' + (TYPE_LABEL[i.type] || '') + ' ' + (i.loc || '') + ' ' + (i.how || '')).toLowerCase().indexOf(q) >= 0;
  }
  views.checklist = function () {
    var s = st();
    var items = DATA.ITEMS.filter(function (i) {
      return matchFilter(i, ui.filter) && matchQuery(i, ui.query) && !(s.settings.hideDone && E.isDone(i.id)) && !(s.settings.hideOptional && (i.optional || i.beyond));
    });
    var h = '<header class="page-head"><h1>Checklist</h1><p class="lead">Everything in the guide. Completion (official %) and checklist (everything) are separate metrics.</p></header>';
    h += '<div class="filter-bar"><input type="search" class="search-local" placeholder="Filter list…" value="' + esc(ui.query) + '" data-action="local-search" aria-label="Filter checklist">' +
      '<div class="chips filters">' + FILTERS.map(function (f) { return '<button class="fchip' + (ui.filter === f[0] ? ' on' : '') + '" data-action="filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      '<label class="toggle"><input type="checkbox" data-action="setting" data-key="hideDone"' + (s.settings.hideDone ? ' checked' : '') + '> Hide done</label>' +
      '<label class="toggle"><input type="checkbox" data-action="setting" data-key="hideOptional"' + (s.settings.hideOptional ? ' checked' : '') + '> Hide optional</label>' +
      '<label class="toggle"><input type="checkbox" data-action="setting" data-key="compact"' + (s.settings.compact ? ' checked' : '') + '> Compact</label></div>';
    var done = items.filter(function (i) { return E.isDone(i.id); }).length;
    h += '<p class="muted">' + done + ' / ' + items.length + ' shown items done</p>';
    DATA.REGIONS.forEach(function (r) {
      var list = items.filter(function (i) { return i.region === r.id; });
      if (!list.length) return;
      h += '<section class="card"><h3><a href="#/region/' + r.id + '">' + esc(r.name) + '</a> <span class="muted small">' + list.filter(function (i) { return E.isDone(i.id); }).length + '/' + list.length + '</span></h3>' + itemList(list) + '</section>';
    });
    return h;
  };

  /* ------------------------------ trackers ------------------------------ */
  function trackerTabs(active) {
    var tabs = [['geo', 'Geo'], ['abilities', 'Movement & Spells'], ['keys', 'Keys'], ['nail', 'Nail & Ore'], ['masks', 'Masks & Vessels'], ['charms', 'Charms'], ['nailarts', 'Nail Arts'], ['essence', 'Essence'],
      ['bosses', 'Bosses'], ['endings', 'Dreamers & Endings'], ['grimm', 'Grimm Troupe'], ['colosseum', 'Colosseum'], ['godhome', 'Godhome']];
    return '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<a role="tab" class="tab' + (t[0] === active ? ' on' : '') + '" href="#/trackers/' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</div>';
  }
  function itemsWhere(fn) { return DATA.ITEMS.filter(fn); }
  var trackers = {};
  trackers.geo = function () {
    var s = st(), exp = E.upcomingExpenses();
    var mandatory = exp.filter(function (i) { return !i.optional; }), total = mandatory.reduce(function (a, i) { return a + i.cost.geo; }, 0);
    var h = '<section class="card"><h3>💰 Geo</h3>' + resourceEditors() +
      '<p>Remaining Geo needed for non-optional purchases: <b>' + fmt(total) + '</b> <span class="muted">(you have ' + fmt(s.resources.geo) + (total > s.resources.geo ? ', missing ' + fmt(total - s.resources.geo) : '') + ')</span></p>' + nailStatusLine() + '</section>';
    h += '<section class="card"><h3>Next expenses</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Where</th><th>Geo</th><th>Status</th></tr></thead><tbody>' +
      exp.map(function (i) {
        var ok = s.resources.geo >= i.cost.geo, av = E.isAvailable(i);
        return '<tr class="' + (i.optional ? 'opt' : '') + '"><td>' + chip(i.id) + (i.optional ? ' <span class="badge opt">optional</span>' : '') + '</td><td>' + esc(regionName(i.region)) + '</td><td class="num">' + fmt(i.cost.geo) + (i.cost.ore ? ' + ' + i.cost.ore + ' ore' : '') +
          '</td><td>' + (!av ? '<span class="muted">locked</span>' : ok ? '<span class="pos">affordable</span>' : '<span class="neg">−' + fmt(i.cost.geo - s.resources.geo) + '</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    h += '<section class="card"><h3>Geo farms (no glitches)</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Phase</th><th>Farm</th><th>Where</th><th>Requirements</th><th>Difficulty</th><th>Return</th><th>Bench</th></tr></thead><tbody>' +
      DATA.FARMS.map(function (f) { return '<tr><td>' + f.phase + '</td><td><a href="' + f.wiki + '" target="_blank" rel="noopener">' + esc(f.name) + ' ↗</a></td><td>' + esc(f.where) + '</td><td>' + esc(f.req) + '</td><td>' + f.difficulty + '</td><td>' + esc(f.ret) + '</td><td>' + esc(f.bench) + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="muted small">Returns marked “verified” come from the wiki. Other farms are qualitative estimates — Geo per enemy varies.</p></section>';
    return h;
  };
  trackers.abilities = function () {
    var mv = ['mothwing-cloak', 'mantis-claw', 'crystal-heart', 'monarch-wings', 'ismas-tear', 'shade-cloak', 'kings-brand', 'lumafly-lantern'];
    var sp = ['vengeful-spirit', 'shade-soul', 'desolate-dive', 'descending-dark', 'howling-wraiths', 'abyss-shriek'];
    return '<section class="card"><h3>Movement <span class="muted small">' + mv.filter(E.isDone).length + '/' + mv.length + '</span></h3>' + itemList(mv.map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>' +
      '<section class="card"><h3>Spells <span class="muted small">' + sp.filter(E.isDone).length + '/6</span></h3>' + itemList(sp.map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>' +
      '<section class="card"><h3>Dream Nail</h3>' + itemList(['dream-nail', 'awoken-dream-nail'].map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>';
  };
  trackers.keys = function () {
    var k = E.keys();
    var h = '<section class="card"><h3>🗝 Simple Keys</h3><p>Obtained <b>' + k.got + '/4</b> · Used <b>' + k.used + '/4</b> · In hand <b>' + k.held + '</b></p>' +
      (k.inconsistent ? '<div class="banner warn compact">More keys used than obtained — a key may not have been recorded.</div>' : '') +
      '<h4>Where to get them</h4>' + itemList(k.obtained, { showRegion: true }) + '<h4>Where to use them (4 locks, 4 keys)</h4>' + itemList(k.uses, { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Other keys & access items</h3>' + itemList(itemsWhere(function (i) { return (i.type === 'key' && !i.keyObtain && !i.keyUse) || i.id === 'kings-brand' || i.id === 'lumafly-lantern' || i.id === 'access-city' || i.id === 'all-stag-stations'; }), { showRegion: true }) + '</section>';
    return h;
  };
  trackers.nail = function () {
    var lvl = E.nailLevel(), o = E.ore(), nn = E.nextNail();
    var chain = E.NAIL_NAMES.map(function (n, idx) {
      var it = byId['nail-' + idx];
      return '<li class="' + (idx <= lvl ? 'on' : '') + '"><b>' + n + '</b>' + (it ? '<span>' + fmt(it.cost.geo) + ' Geo' + (it.cost.ore ? ' + ' + it.cost.ore + ' ore' : '') + '</span>' : '<span>start</span>') + '</li>';
    }).join('<li class="arrow">→</li>');
    var h = '<section class="card"><h3>⚔ Nail</h3><ol class="nail-chain">' + chain + '</ol>' + nailStatusLine() +
      (o.inconsistent ? '<div class="banner warn compact">Nail upgrades use ' + o.spent + ' Pale Ore but only ' + o.collected + ' are checked.</div>' : '') +
      itemList(itemsWhere(function (i) { return i.type === 'nail'; })) + '</section>';
    h += '<section class="card"><h3>⬢ Pale Ore <span class="muted">' + o.collected + '/6 · held ' + o.held + ' · spent ' + o.spent + '</span></h3>' +
      itemList(itemsWhere(function (i) { return i.type === 'ore'; }), { showRegion: true }) + '</section>';
    return h;
  };
  trackers.masks = function () {
    var sh = E.shards(), v = E.vessels();
    var masks = ''; for (var i = 0; i < 9; i++) masks += '<span class="mask-ico ' + (i < sh.masks ? 'on' : '') + '"></span>';
    var vs = ''; for (i = 0; i < 3; i++) vs += '<span class="vessel-ico ' + (i < v.vessels ? 'on' : '') + '"></span>';
    var h = '<section class="card"><h3>◈ Mask Shards <span class="muted">' + sh.shards + '/16 · every 4 → +1 Mask</span></h3><div class="icons">' + masks + '</div>' +
      '<p class="muted">' + sh.masks + ' masks · next mask in ' + (sh.shards >= 16 ? '—' : (4 - sh.partial) + ' shard(s)') + '</p>' +
      itemList(itemsWhere(function (i) { return i.type === 'mask' || /^mask-upgrade/.test(i.id); }), { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>◉ Vessel Fragments <span class="muted">' + v.fragments + '/9 · every 3 → +1 Soul Vessel</span></h3><div class="icons">' + vs + '</div>' +
      itemList(itemsWhere(function (i) { return i.type === 'vessel' || /^vessel-upgrade/.test(i.id); }), { showRegion: true }) + '</section>';
    return h;
  };
  trackers.charms = function () {
    var count = E.charmCount();
    var thresholds = [5, 10, 18, 25].map(function (n, idx) { return '<span class="soft ' + (count >= n ? 'ok' : 'no') + '">Salubra #' + (idx + 1) + ': ' + n + ' charms</span>'; }).join(' ');
    var h = '<section class="card"><h3>✦ Charms <span class="muted">' + count + '/40 owned · ' + E.notches() + '/11 notches</span></h3><p>' + thresholds + '</p>' +
      '<p class="muted small">Kingsoul only counts when both White Fragments are collected. Fragile charms do not count while Divine holds them. Grimmchild and Carefree Melody share one slot.</p>' +
      itemList(itemsWhere(function (i) { return i.type === 'charm' && !i.voidHeart; }).sort(function (a, b) { return (a.charmNum || 99) - (b.charmNum || 99); }), { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Charm Notches <span class="muted">3 + ' + (E.notches() - 3) + '/8</span></h3>' + itemList(itemsWhere(function (i) { return i.type === 'notch'; }), { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Void Heart</h3>' + voidHeartBanner(true) + itemList([byId['white-fragment-queen'], byId['white-fragment-king'], byId['void-heart']], { showRegion: true }) + '</section>';
    return h;
  };
  trackers.nailarts = function () {
    return '<section class="card"><h3>⟡ Nail Arts <span class="muted">' + ['great-slash', 'dash-slash', 'cyclone-slash'].filter(E.isDone).length + '/3</span></h3>' +
      itemList(['great-slash', 'dash-slash', 'cyclone-slash', 'nailmasters-glory'].map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>';
  };
  trackers.essence = function () {
    var e = st().resources.essence;
    var bar = '<div class="ess-bar"><span style="width:' + Math.min(100, e / 2400 * 100) + '%"></span>' + DATA.SEER_MILESTONES.map(function (m) {
      return '<i class="ms ' + (e >= m.essence ? 'on' : '') + '" style="left:' + (m.essence / 2400 * 100) + '%" title="' + m.essence + ' — ' + esc(m.reward) + '"></i>';
    }).join('') + '</div>';
    var h = '<section class="card"><h3>✧ Essence <span class="muted">' + fmt(e) + ' / 2400</span></h3>' + resourceEditors() + bar +
      '<ul class="milestones">' + DATA.SEER_MILESTONES.map(function (m) {
        var it = byId[m.id], claimed = E.isDone(m.id);
        return '<li class="' + (claimed ? 'claimed' : e >= m.essence ? 'ready' : '') + '"><b>' + m.essence + '</b> → ' + esc(m.reward) + ' ' +
          (claimed ? '<span class="pos">✓ claimed</span>' : e >= m.essence ? '<span class="gold">ready — visit the Seer!</span>' : '<span class="muted">' + (m.essence - e) + ' to go</span>') +
          ' <input type="checkbox" class="chk" data-action="toggle" data-id="' + it.id + '"' + (claimed ? ' checked' : '') + ' aria-label="Claimed ' + esc(m.reward) + '"></li>';
      }).join('') + '</ul><p class="muted small">Essence spent on Dreamgate warps (1 each) lowers your total — edit the number manually any time. One-time sources add up to 3208.</p></section>';
    var sum = function (list) { return list.reduce(function (a, i) { return a + (E.isDone(i.id) ? i.essence : 0); }, 0) + '/' + list.reduce(function (a, i) { return a + i.essence; }, 0); };
    var wd = itemsWhere(function (i) { return i.type === 'warrior'; }), dbs = itemsWhere(function (i) { return i.type === 'dreamboss'; }), roots = itemsWhere(function (i) { return i.type === 'root'; });
    h += '<section class="card"><h3>Warrior Dreams <span class="muted">' + sum(wd) + ' Essence</span></h3>' + itemList(wd, { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Dream Bosses <span class="muted">' + sum(dbs) + ' Essence</span></h3>' + itemList(dbs, { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Whispering Roots <span class="muted">' + sum(roots) + ' Essence</span></h3>' + itemList(roots, { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Dream Nail</h3>' + itemList(['dream-nail', 'awoken-dream-nail', 'seer-ascension'].map(function (x) { return byId[x]; })) + '</section>';
    h += '<section class="card"><h3>◌ Grubs</h3>' + resInput('grubs', 'Grubs rescued', st().resources.grubs, 46) +
      '<p class="muted small">Grubfather: 5 → Mask Shard · 10 → Grubsong · 31 → Pale Ore · 46 → Grubberfly\'s Elegy (plus Geo/Rancid Eggs/relics in between). <a href="https://hollowknight.wiki/w/Grubs" target="_blank" rel="noopener">All grub locations ↗</a></p></section>';
    return h;
  };
  trackers.bosses = function () {
    var groups = [
      ['Main bosses (14%)', function (i) { return i.type === 'boss' && i.completion && i.id !== 'troupe-master-grimm'; }],
      ['Warrior Dreams (7%)', function (i) { return i.type === 'warrior'; }],
      ['Dream Bosses', function (i) { return i.type === 'dreamboss'; }],
      ['Grimm Troupe', function (i) { return i.type === 'boss' && i.tags.indexOf('grimm') >= 0; }],
      ['Colosseum (3%)', function (i) { return i.type === 'colosseum'; }],
      ['Godhome', function (i) { return i.type === 'godhome' && i.id.indexOf('pantheon') === 0 || i.id === 'absolute-radiance'; }],
      ['Optional bosses', function (i) { return i.type === 'boss' && !i.completion && i.tags.indexOf('grimm') < 0 && i.region !== 'godhome'; }]
    ];
    return groups.map(function (g) { var list = itemsWhere(g[1]); return '<section class="card"><h3>' + g[0] + ' <span class="muted small">' + list.filter(function (i) { return E.isDone(i.id); }).length + '/' + list.length + '</span></h3>' + itemList(list, { showRegion: true }) + '</section>'; }).join('');
  };
  trackers.endings = function () {
    var dreamers = ['herrah', 'lurien', 'monomon'];
    var h = '<section class="card"><h3>◐ Dreamers <span class="muted">' + dreamers.filter(E.isDone).length + '/3</span></h3>' + itemList(dreamers.map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>';
    if (E.isDone('black-egg')) h += '<div class="banner gold"><strong>🔓 BLACK EGG OPEN</strong>' + (E.isDone('ending-thk') ? '' : '<span>⚠️ FAÇA O FINAL BÁSICO ANTES DO VOID HEART.</span>') + '</div>';
    h += voidHeartBanner();
    h += '<section class="card"><h3>Endings</h3>' + itemList(['ending-thk', 'ending-sealed-siblings', 'ending-dream-no-more'].map(function (x) { return byId[x]; })) + '</section>';
    h += '<section class="card"><h3>Godhome endings — Beyond 112%</h3>' + itemList(['ending-embrace-void', 'ending-delicate-flower'].map(function (x) { return byId[x]; })) + '</section>';
    return h;
  };
  trackers.grimm = function () {
    var order = ['nightmare-lantern', 'grimmchild', 'flame-novice-greenpath', 'flame-novice-peak', 'flame-novice-city', 'flames-novice-done', 'flame-master-kings-pass', 'flame-master-resting', 'flame-master-edge',
      'troupe-master-grimm', 'notch-grimm', 'flame-nightmare-core', 'flame-nightmare-waterways', 'flame-nightmare-hive', 'brumm', 'nightmare-king-grimm', 'banishment', 'carefree-melody', 'grimmchild-slot', 'grimmchild-ritual'];
    var b = E.completionBreakdown()['The Grimm Troupe'];
    var h = '<section class="card"><h3>🔥 Grimm Troupe <span class="muted">' + b.got + '/6% for 112%</span></h3>' +
      '<p class="muted small">Counts for 112%: Dreamshield, Sprintmaster, Weaversong, Grimmchild <i>or</i> Carefree Melody, Troupe Master Grimm, Nightmare King Grimm <i>or</i> Banishment. ' +
      'Nightmare King Grimm and Banishment are mutually exclusive. Banishing locks any Fragile charm you have not made Unbreakable.</p>' +
      itemList(order.map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Grimm Troupe charms</h3>' + itemList(['dreamshield', 'sprintmaster', 'weaversong'].map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>';
    h += '<section class="card"><h3>Divine — Unbreakable charms (optional)</h3>' + itemList(['unbreakable-heart', 'unbreakable-greed', 'unbreakable-strength'].map(function (x) { return byId[x]; })) + '</section>';
    return h;
  };
  trackers.colosseum = function () {
    return '<section class="card"><h3>⚑ Colosseum of Fools</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Trial</th><th>Fee</th><th>First-clear reward</th><th>112%</th></tr></thead><tbody>' +
      ['trial-warrior', 'trial-conqueror', 'trial-fool'].map(function (x) { var i = byId[x]; return '<tr><td>' + chip(x) + '</td><td class="num">' + fmt(i.cost.geo) + '</td><td>' + esc(i.reward) + '</td><td>+1%</td></tr>'; }).join('') +
      '</tbody></table></div>' + itemList(['trial-warrior', 'trial-conqueror', 'trial-fool', 'notch-colosseum', 'ore-colosseum', 'pale-lurker', 'key-lurker'].map(function (x) { return byId[x]; })) + '</section>';
  };
  trackers.godhome = function () {
    var h = '<section class="card"><h3>☼ Godhome — for 112%</h3>' + itemList(['use-key-godseeker', 'godtuner', 'pantheon-master', 'pantheon-artist', 'pantheon-sage', 'pantheon-knight'].map(function (x) { return byId[x]; }), { showRegion: true }) + '</section>';
    h += '<section class="card beyond-card"><h3>BEYOND 112% <span class="muted small">not required</span></h3>' + itemList(['pantheon-hallownest', 'absolute-radiance', 'ending-embrace-void', 'ending-delicate-flower'].map(function (x) { return byId[x]; })) + '</section>';
    return h;
  };
  views.trackers = function (tab) {
    tab = trackers[tab] ? tab : 'geo';
    return '<header class="page-head"><h1>Trackers</h1></header>' + trackerTabs(tab) + trackers[tab]();
  };

  /* ------------------------------ save & audit ------------------------------ */
  function syncStatusHtml() {
    if (!sync || !sync.connected()) return '<span class="sync-pill off">Not connected — progress only on this device</span>';
    var x = sync.status(), cls = { ok: 'ok', busy: 'busy', pending: 'busy', error: 'err' }[x.state] || 'busy';
    return '<span class="sync-pill ' + cls + '">' + (x.state === 'error' ? '⚠ ' : x.state === 'ok' ? '✓ ' : '⟳ ') + esc(x.msg || 'Connected') + '</span>' +
      (x.at ? ' <small class="muted">last sync ' + new Date(x.at).toLocaleString() + '</small>' : '');
  }
  function syncCard() {
    var on = sync && sync.connected();
    var h = '<section class="card sync-card"><h3>' + ico('loop') + ' Sync between devices</h3>';
    h += '<p>See the <b>same progress</b> on your computer, phone and notebook. The site keeps a copy in a <b>private Gist</b> on your own GitHub account — no other server involved.</p>';
    h += '<p id="syncStatus">' + syncStatusHtml() + '</p>';
    if (on) {
      h += '<div class="btn-row"><button class="btn btn-primary" data-action="sync-now">' + ico('loop') + ' Sync now</button><button class="btn ghost" data-action="sync-off">Disconnect this device</button></div>' +
        '<p class="muted small">Syncs automatically when you open the site, when you come back to the tab, and a few seconds after every change. If two devices changed, the most recent save wins.</p>';
    } else {
      h += '<ol class="small sync-steps"><li>On GitHub: <a href="https://github.com/settings/tokens/new?scopes=gist&description=Hollow%20Knight%20Companion" target="_blank" rel="noopener">Settings → Developer settings → Tokens (classic) → Generate new token ↗</a>. Tick <b>only “gist”</b>, choose an expiration and generate.</li>' +
        '<li>Copy the token (starts with <code>ghp_</code>) and paste it below.</li><li>Do the same on every device (the same token works everywhere).</li></ol>' +
        '<div class="sync-form"><input id="syncToken" type="password" autocomplete="off" placeholder="ghp_…" aria-label="GitHub token with gist permission"><button class="btn btn-primary" data-action="sync-connect">Connect</button></div>' +
        '<p class="muted small">The token is stored only in this browser and only allows reading/writing your Gists. You can revoke it on GitHub any time.</p>';
    }
    return h + '</section>';
  }
  views.save = function () {
    var s = st();
    var h = '<header class="page-head"><h1>Save & Backup</h1><p class="lead">Everything is saved automatically in this browser (localStorage). Last change: ' + new Date(s.updatedAt).toLocaleString() + '</p></header>';
    h += syncCard();
    h += '<section class="card"><h3>⚙ Update my save</h3><p>Quick editor for abilities, spells, Dream Nail, nail, resources and progress — the same data as the checklist.</p><button class="btn btn-primary" data-action="open-editor">⚙ UPDATE MY SAVE</button></section>';
    h += '<section class="card"><h3>📂 Import Hollow Knight save (PC)</h3>' +
      '<p>Choose your <code>user1.dat</code>…<code>user4.dat</code> file. It is decoded <b>locally in your browser</b> (nothing is uploaded) and you will see a preview before anything changes.</p>' +
      '<ul class="small muted"><li>Windows: <code>%USERPROFILE%\\AppData\\LocalLow\\Team Cherry\\Hollow Knight\\</code></li><li>macOS: <code>~/Library/Application Support/unity.Team Cherry.Hollow Knight/</code></li><li>Linux: <code>~/.config/unity3d/Team Cherry/Hollow Knight/</code></li></ul>' +
      '<label class="btn file-btn">📂 IMPORT HOLLOW KNIGHT SAVE<input type="file" accept=".dat,.bak1,.json,.txt" data-action="import-hk" hidden></label>' +
      '<p class="muted small">Beta: field mapping follows the open-source tools bloodorca/hollow and hollow-knight-completion-check. Unknown fields are left untouched. Work on a copy if in doubt — the file is only read.</p></section>';
    h += '<section class="card"><h3>Backup</h3><div class="btn-row"><button class="btn" data-action="export">⬇ EXPORT PROGRESS → JSON</button>' +
      '<label class="btn file-btn">⬆ IMPORT PROGRESS ← JSON<input type="file" accept=".json,application/json" data-action="import-json" hidden></label>' +
      '<button class="btn danger" data-action="reset">⟲ Reset progress</button></div><p class="muted small">Backups are versioned (<code>"version": ' + HK.State.VERSION + '</code>).</p></section>';
    h += '<section class="card"><h3>Settings</h3><div class="settings">' +
      setting('spoilers', 'Spoiler protection (blur locations & instructions until hovered/tapped)') +
      setting('compact', 'Compact lists') + setting('hideOptional', 'Hide optional items in the checklist') + setting('hideDone', 'Hide completed items in the checklist') + '</div></section>';
    return h;
  };
  function setting(key, label) { return '<label class="toggle"><input type="checkbox" data-action="setting" data-key="' + key + '"' + (st().settings[key] ? ' checked' : '') + '> ' + label + '</label>'; }
  function runAudit() {
    var rows = [], total = 0, errors = [], ids = {};
    DATA.ITEMS.forEach(function (i) { if (ids[i.id]) errors.push('Duplicate ' + i.id); ids[i.id] = 1; });
    DATA.ITEMS.forEach(function (i) { i.req.concat(i.any).forEach(function (r) { if (!ids[r]) errors.push('Unknown ref ' + r + ' in ' + i.id); }); });
    var cat = {};
    DATA.ITEMS.forEach(function (i) { if (i.completion) { var c = DATA.auditCategory(i); cat[c] = (cat[c] || 0) + i.completion; total += i.completion; } });
    Object.keys(DATA.OFFICIAL_BREAKDOWN).forEach(function (k) { rows.push({ k: k, exp: DATA.OFFICIAL_BREAKDOWN[k], got: cat[k] || 0 }); if ((cat[k] || 0) !== DATA.OFFICIAL_BREAKDOWN[k]) errors.push(k + ' mismatch'); });
    if (total !== 112) errors.push('Total ' + total);
    return { rows: rows, total: total, errors: errors };
  }
  views.audit = function () {
    var a = runAudit(), b = E.completionBreakdown();
    var h = '<header class="page-head"><h1>112% Audit</h1><p class="lead">The database is checked every time the page loads: the official contributions must sum to exactly 112.</p></header>';
    h += '<div class="banner ' + (a.errors.length ? 'danger' : 'safe') + '"><strong>' + (a.errors.length ? '✗ AUDIT FAILED' : '✓ AUDIT PASSED') + ' — database total = ' + a.total + '%</strong>' + (a.errors.length ? '<span>' + esc(a.errors.join('; ')) + '</span>' : '<span>Matches the wiki breakdown (base 100% + Grimm Troupe 6 + Lifeblood 1 + Godmaster 5).</span>') + '</div>';
    h += '<section class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>Category</th><th>Official (wiki)</th><th>Database</th><th>Your progress</th></tr></thead><tbody>' +
      a.rows.map(function (r) { return '<tr><td>' + r.k + '</td><td class="num">' + r.exp + '%</td><td class="num ' + (r.exp === r.got ? 'pos' : 'neg') + '">' + r.got + '%</td><td class="num">' + (b[r.k] ? b[r.k].got : 0) + '%</td></tr>'; }).join('') +
      '<tr class="total"><td>Total</td><td class="num">112%</td><td class="num">' + a.total + '%</td><td class="num">' + E.completion().value + '%</td></tr></tbody></table></div>' +
      '<p class="muted small">Source: <a href="https://hollowknight.wiki/w/Completion_(Hollow_Knight)" target="_blank" rel="noopener">hollowknight.wiki — Completion (Hollow Knight) ↗</a>. Pantheon of Hallownest is not part of 112%.</p></section>';
    return h;
  };

  /* ============================== MODALS ============================== */
  var modal = document.getElementById('modal'), modalBody = document.getElementById('modalBody'), modalTitle = document.getElementById('modalTitle');
  var lastFocus = null, modalKind = null;
  function openModal(title, html, kind) {
    lastFocus = document.activeElement; modalKind = kind || null;
    modalTitle.textContent = title; modalBody.innerHTML = html; modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () { var f = modal.querySelector('button, input, select, a'); if (f) f.focus(); }, 30);
  }
  function closeModal() { modal.hidden = true; modalKind = null; modalBody.innerHTML = ''; document.body.classList.remove('modal-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function refreshModal() {
    if (modal.hidden) return;
    if (modalKind && modalKind.indexOf('item:') === 0) { var id = modalKind.slice(5); modalBody.innerHTML = itemModalHtml(byId[id]); }
    if (modalKind === 'editor') { var sc = modalBody.scrollTop; modalBody.innerHTML = editorHtml(); modalBody.scrollTop = sc; }
  }
  function itemModalHtml(it) { expanded[it.id] = true; return '<div class="items">' + itemRow(it, { showRegion: true }) + '</div>'; }
  function openItem(id) { var it = byId[id]; if (!it) return; openModal(it.name, itemModalHtml(it), 'item:' + id); }

  function editorHtml() {
    var s = st(), h = '';
    function tg(id) { var it = byId[id]; return '<label class="ed-toggle' + (E.isDone(id) ? ' on' : '') + '"><input type="checkbox" data-action="toggle" data-id="' + id + '"' + (E.isDone(id) ? ' checked' : '') + '><span>' + esc(it.name) + '</span>' + (it.completion ? '<small>+' + it.completion + '%</small>' : '') + '</label>'; }
    function group(title, ids) { return '<fieldset class="ed-group"><legend>' + title + '</legend><div class="ed-grid">' + ids.map(tg).join('') + '</div></fieldset>'; }
    function spellSel(label, a, b, names) {
      var v = E.isDone(b) ? 2 : E.isDone(a) ? 1 : 0;
      return '<label class="ed-select"><span>' + label + '</span><select data-action="spell" data-a="' + a + '" data-b="' + b + '">' + ['None', names[0], names[1]].map(function (n, i) { return '<option value="' + i + '"' + (i === v ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>';
    }
    h += '<p class="muted small">Single source of truth: anything changed here also changes the checklist, regions and dashboard (and vice-versa). Requirements never block you.</p>';
    h += group('Movement', ['mothwing-cloak', 'mantis-claw', 'crystal-heart', 'monarch-wings', 'ismas-tear', 'shade-cloak', 'kings-brand', 'lumafly-lantern']);
    h += '<fieldset class="ed-group"><legend>Spells</legend><div class="ed-grid">' +
      spellSel('Vengeful Spirit → Shade Soul', 'vengeful-spirit', 'shade-soul', ['Vengeful Spirit', 'Shade Soul']) +
      spellSel('Desolate Dive → Descending Dark', 'desolate-dive', 'descending-dark', ['Desolate Dive', 'Descending Dark']) +
      spellSel('Howling Wraiths → Abyss Shriek', 'howling-wraiths', 'abyss-shriek', ['Howling Wraiths', 'Abyss Shriek']) + '</div></fieldset>';
    h += '<fieldset class="ed-group"><legend>Dream</legend><div class="ed-grid">' + tg('dream-nail') + tg('awoken-dream-nail') + tg('seer-ascension') + '</div>' + resInput('essence', 'Essence', s.resources.essence, 0) + '</fieldset>';
    var lvl = E.nailLevel();
    h += '<fieldset class="ed-group"><legend>Nail</legend><label class="ed-select"><span>Current nail</span><select data-action="nail">' + E.NAIL_NAMES.map(function (n, i) { return '<option value="' + i + '"' + (i === lvl ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' + nailStatusLine() + '</fieldset>';
    h += '<fieldset class="ed-group"><legend>Resources</legend>' + resourceEditors() + '</fieldset>';
    h += group('Pale Ore (' + E.ore().collected + '/6)', itemsWhere(function (i) { return i.type === 'ore'; }).map(function (i) { return i.id; }));
    h += group('Mask Shards (' + E.shards().shards + '/16)', itemsWhere(function (i) { return i.type === 'mask'; }).map(function (i) { return i.id; }));
    h += group('Vessel Fragments (' + E.vessels().fragments + '/9)', itemsWhere(function (i) { return i.type === 'vessel'; }).map(function (i) { return i.id; }));
    h += group('Simple Keys', itemsWhere(function (i) { return i.keyObtain || i.keyUse; }).map(function (i) { return i.id; }));
    h += group('Keys & items', ['shopkeepers-key', 'elegant-key', 'love-key', 'tram-pass', 'city-crest', 'access-city', 'all-stag-stations']);
    h += group('Charms (' + E.charmCount() + '/40)', itemsWhere(function (i) { return i.type === 'charm'; }).sort(function (a, b) { return (a.charmNum || 99) - (b.charmNum || 99); }).map(function (i) { return i.id; }));
    h += group('Charm Notches', itemsWhere(function (i) { return i.type === 'notch'; }).map(function (i) { return i.id; }));
    h += group('Nail Arts', ['great-slash', 'dash-slash', 'cyclone-slash']);
    h += group('Bosses', itemsWhere(function (i) { return i.type === 'boss' && i.tags.indexOf('grimm') < 0 && i.region !== 'godhome'; }).map(function (i) { return i.id; }));
    h += group('Warrior Dreams & Dream Bosses', itemsWhere(function (i) { return i.type === 'warrior' || i.type === 'dreamboss'; }).map(function (i) { return i.id; }));
    h += group('Dreamers', ['herrah', 'lurien', 'monomon']);
    h += group('Grimm Troupe', ['nightmare-lantern', 'grimmchild', 'troupe-master-grimm', 'nightmare-king-grimm', 'banishment', 'carefree-melody']);
    h += group('Colosseum', ['trial-warrior', 'trial-conqueror', 'trial-fool']);
    h += group('Endings', ['ending-thk', 'ending-sealed-siblings', 'ending-dream-no-more']);
    h += group('Godhome', ['use-key-godseeker', 'godtuner', 'pantheon-master', 'pantheon-artist', 'pantheon-sage', 'pantheon-knight', 'pantheon-hallownest']);
    h += '<div class="ed-foot"><span>Completion <b>' + E.completion().value + '/112%</b></span><button class="btn btn-primary" data-action="close-modal">Done</button></div>';
    return h;
  }
  function openEditor() { openModal('⚙ Update my save', editorHtml(), 'editor'); }

  function importPreviewHtml(res, fileName) {
    var s = res.summary, h = '<div class="save-detected"><h3>SAVE DETECTED</h3><p class="muted small">' + esc(fileName) + (s.version ? ' · game v' + esc(s.version) : '') + (s.playTimeHours !== null ? ' · ' + s.playTimeHours + ' h' : '') + (s.completionPercentage !== null ? ' · in-game ' + s.completionPercentage + '%' : '') + '</p><ul class="detected">';
    function yn(b, t) { return '<li class="' + (b ? 'pos' : 'neg') + '">' + (b ? '✓ ' : '✗ ') + esc(t) + '</li>'; }
    ['crystal-heart', 'monarch-wings', 'ismas-tear', 'shade-cloak', 'kings-brand', 'dream-nail'].forEach(function (id) { if (id in res.detected) h += yn(res.detected[id], byId[id].name); });
    if (s.essence !== null) h += '<li>' + fmt(s.essence) + ' Essence</li>';
    if (s.geo !== null) h += '<li>' + fmt(s.geo) + ' Geo</li>';
    if (s.nailLevel !== null) h += '<li>' + E.NAIL_NAMES[Math.min(4, s.nailLevel)] + '</li>';
    h += '<li>' + s.charms + ' Charms</li>';
    if (s.shards !== null) h += '<li>' + s.shards + ' Mask Shards · ' + s.vesselFragments + ' Vessel Fragments</li>';
    if (s.grubs !== null) h += '<li>' + s.grubs + ' Grubs</li>';
    h += yn(s.dreamers.herrah, 'Herrah') + yn(s.dreamers.lurien, 'Lurien') + yn(s.dreamers.monomon, 'Monomon') + '</ul>';
    if (s.steelSoul) h += '<p class="banner warn compact">Steel Soul save.</p>';
    res.notes.forEach(function (n) { h += '<div class="banner warn compact">' + esc(n) + '</div>'; });
    h += '<h4>Changes to apply (' + res.changes.length + ')</h4>';
    if (!res.changes.length) h += '<p class="muted">Your companion already matches this save.</p>';
    else h += '<p class="muted small">Untick anything you do not want to import.</p><div class="change-list">' + res.changes.map(function (c, idx) {
      return '<label class="change"><input type="checkbox" checked data-change="' + idx + '"><span class="' + (c.to ? 'pos' : 'neg') + '">' + (c.to ? '+ ' : '− ') + esc(c.name) + '</span><small>' + esc(TYPE_LABEL[c.type] || '') + (c.completion ? ' · ' + c.completion + '%' : '') + '</small></label>';
    }).join('') + '</div>';
    h += '<label class="toggle"><input type="checkbox" id="impRes" checked> Also import Geo / Essence / Grubs</label>';
    h += '<p class="muted small">' + res.unknown.length + ' entries could not be read from this save (older game version or unmapped) and stay as they are.</p>';
    h += '<div class="btn-row"><button class="btn btn-primary" data-action="apply-import">APPLY TO ROADMAP</button><button class="btn ghost" data-action="close-modal">Cancel</button></div></div>';
    return h;
  }

  /* ============================== SEARCH ============================== */
  var searchInput = document.getElementById('globalSearch'), searchBox = document.getElementById('searchResults');
  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) { searchBox.hidden = true; return; }
    var regs = DATA.REGIONS.filter(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 4);
    var items = DATA.ITEMS.filter(function (i) { return matchQuery(i, q); })
      .sort(function (a, b) { return (a.name.toLowerCase().indexOf(q) === 0 ? 0 : 1) - (b.name.toLowerCase().indexOf(q) === 0 ? 0 : 1) || a.name.length - b.name.length; }).slice(0, 12);
    var h = regs.map(function (r) { return '<a class="sr" role="option" href="#/region/' + r.id + '">📍 <b>' + esc(r.name) + '</b><small>Region</small></a>'; }).join('');
    h += items.map(function (i) { return '<button class="sr" role="option" data-action="open-item" data-id="' + i.id + '">' + (E.isDone(i.id) ? '✓' : '○') + ' <b>' + esc(i.name) + '</b><small>' + esc(TYPE_LABEL[i.type]) + ' · ' + esc(regionName(i.region)) + '</small></button>'; }).join('');
    searchBox.innerHTML = h || '<div class="sr muted">No results</div>';
    searchBox.hidden = false;
  }
  searchInput.addEventListener('input', function () { runSearch(searchInput.value); });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { searchInput.value = ''; searchBox.hidden = true; }
    if (e.key === 'Enter') { var f = searchBox.querySelector('.sr[data-action], a.sr'); if (f) f.click(); }
    if (e.key === 'ArrowDown') { var g = searchBox.querySelector('.sr'); if (g) { e.preventDefault(); g.focus(); } }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search-wrap')) searchBox.hidden = true; });
  searchBox.addEventListener('click', function () { setTimeout(function () { searchBox.hidden = true; searchInput.value = ''; }, 0); });

  /* ============================== ROUTER ============================== */
  function route() {
    var hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    var parts = hash.split('/');
    var name = parts[0], arg = parts[1];
    var html;
    document.body.setAttribute('data-theme', (E.regionById[st().currentRegion] || {}).theme || 'crossroads');
    if (name === 'region') html = views.region(arg);
    else if (name === 'trackers') html = views.trackers(arg);
    else if (views[name]) html = views[name]();
    else html = views.dashboard();
    view.innerHTML = html;
    if (music) music.setContext(name === 'region' && E.regionById[arg] ? arg : st().currentRegion);
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var nv = a.getAttribute('data-nav');
      var on = nv === hash || (name === 'region' && nv === 'regions') || (name === 'trackers' && nv === 'trackers') || (name === 'audit' && nv === 'settings');
      a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    return { name: name, arg: arg };
  }
  var lastRoute = null;
  function render(keepScroll) {
    var y = window.scrollY;
    lastRoute = route();
    if (keepScroll) window.scrollTo(0, y);
    refreshModal();
  }
  window.addEventListener('hashchange', function () { closeNav(); render(false); window.scrollTo(0, 0); view.focus({ preventScroll: true }); });
  store.subscribe(function (s, reason) { render(true); });

  /* ============================== EVENTS ============================== */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]'); if (!t) return;
    var a = t.getAttribute('data-action'), id = t.getAttribute('data-id');
    if (t.tagName === 'INPUT' && (t.type === 'checkbox' || t.type === 'number' || t.type === 'file')) return; // handled on change
    switch (a) {
      case 'toggle': {
        var was = E.isDone(id), it = byId[id];
        if (!was && it.voidHeart && E.isVoidHeartLocked() && !confirm('🔒 VOID HEART — NÃO PEGUE AINDA\n\nYou have not recorded the ending “The Hollow Knight”. Mark the Void Heart anyway?')) return;
        store.toggle(id);
        if (!was) toast('✓ ' + it.name + (it.completion ? ' (+' + it.completion + '%)' : ''), 'ok');
        break;
      }
      case 'expand': expanded[id] = !expanded[id]; var row = t.closest('.item');
        if (row) { row.classList.toggle('open', !!expanded[id]); t.setAttribute('aria-expanded', !!expanded[id]); row.querySelector('.item-body-inner').innerHTML = expanded[id] ? itemDetail(byId[id]) : ''; }
        break;
      case 'open-item': e.preventDefault(); openItem(id); break;
      case 'close-modal': closeModal(); break;
      case 'pin': store.setPinned(st().pinned === id ? null : id); break;
      case 'set-region': store.setRegion(id); toast('📍 ' + regionName(id)); break;
      case 'mark-prereqs': {
        var map = {}; E.missing(byId[id], { noRegion: true }).forEach(function (g) { if (g.mode === 'all') g.ids.forEach(function (x) { map[x] = true; }); });
        store.setChecks(map, 'prereqs'); break;
      }
      case 'mark-all-implied': {
        var imp = E.impliedSet(), m2 = {}; Object.keys(imp).forEach(function (x) { if (!byId[x].derived && !E.isDone(x)) m2[x] = true; });
        store.setChecks(m2, 'prereqs'); toast('Marked ' + Object.keys(m2).length + ' prerequisites as done', 'ok'); break;
      }
      case 'filter': ui.filter = t.getAttribute('data-f'); render(true); break;
      case 'res-step': {
        var key = t.getAttribute('data-key'), step = Number(t.getAttribute('data-step'));
        var mult = key === 'geo' ? 50 : key === 'essence' ? 10 : 1;
        store.setResource(key, st().resources[key] + step * mult); break;
      }
      case 'open-editor': openEditor(); break;
      case 'export': download('hollow-knight-companion-' + new Date().toISOString().slice(0, 10) + '.json', store.exportJSON()); toast('Progress exported', 'ok'); break;
      case 'reset':
        if (confirm('Reset ALL progress? This cannot be undone (export a backup first).') && confirm('Are you sure? Everything returns to the initial state.')) { store.reset(); toast('Progress reset'); }
        break;
      case 'apply-import': applyImport(); break;
      case 'sync-connect': { var tk = document.getElementById('syncToken'); if (sync && tk) { sync.connect(tk.value).then(function (r) { render(true); if (r !== 'error') toast('🔗 Sync connected', 'ok'); }); } break; }
      case 'sync-now': if (sync) sync.sync().then(function () { render(true); }); break;
      case 'sync-off': if (sync && confirm('Stop syncing on this device? Your progress stays here and in your GitHub Gist.')) { sync.disconnect(); render(true); } break;
      case 'music-play': if (music) { music.play(id); setTimeout(function () { render(true); }, 200); } break;
      case 'player-toggle': document.body.classList.toggle('player-open'); break;
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, a = t.getAttribute('data-action'); if (!a) return;
    var id = t.getAttribute('data-id');
    if (a === 'toggle') {
      var it = byId[id];
      if (t.checked && it.voidHeart && E.isVoidHeartLocked() && !confirm('🔒 VOID HEART — NÃO PEGUE AINDA\n\nYou have not recorded the ending “The Hollow Knight”. Mark the Void Heart anyway?')) { t.checked = false; return; }
      if (t.checked && it.excludes && it.excludes.some(E.isDone)) toast('⚠ ' + it.name + ' is mutually exclusive with something already marked.', 'warn');
      store.setCheck(id, t.checked);
      if (t.checked) toast('✓ ' + it.name + (it.completion ? ' (+' + it.completion + '%)' : ''), 'ok');
    }
    if (a === 'res') store.setResource(t.getAttribute('data-key'), t.value);
    if (a === 'region') { store.setRegion(t.value); }
    if (a === 'setting') store.setSetting(t.getAttribute('data-key'), t.checked);
    if (a === 'note') store.setNote(id, t.value);
    if (a === 'spell') { var v = Number(t.value); var m = {}; m[t.getAttribute('data-a')] = v >= 1; m[t.getAttribute('data-b')] = v >= 2; store.setChecks(m, 'spell'); }
    if (a === 'nail') { var lv = Number(t.value), mm = {}; for (var n = 1; n <= 4; n++) mm['nail-' + n] = n <= lv; store.setChecks(mm, 'nail'); }
    if (a === 'import-json') readFile(t, 'text', function (txt) {
      try { store.importJSON(txt); toast('Progress imported ✓', 'ok'); } catch (err) { toast('Import failed: ' + err.message, 'warn'); alert('Import failed: ' + err.message); }
    });
    if (a === 'import-hk') readFile(t, 'buffer', function (buf, file) {
      try {
        var save = HK.SaveImporter.decode(buf);
        var res = HK.SaveImporter.analyze(save, DATA, st().checks);
        ui.pendingImport = res;
        openModal('📂 Import Hollow Knight save', importPreviewHtml(res, file.name), 'import');
      } catch (err) { console.error(err); alert('Could not read this save: ' + err.message); }
    });
  });
  document.addEventListener('input', function (e) {
    if (e.target.getAttribute('data-action') === 'local-search') {
      ui.query = e.target.value; var pos = e.target.selectionStart; render(true);
      var s2 = view.querySelector('.search-local'); if (s2) { s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (x) { /* noop */ } }
    }
  });
  function readFile(input, mode, cb) {
    var f = input.files && input.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { cb(r.result, f); input.value = ''; };
    r.onerror = function () { alert('Could not read the file.'); };
    if (mode === 'text') r.readAsText(f); else r.readAsArrayBuffer(f);
  }
  function applyImport() {
    var res = ui.pendingImport; if (!res) return;
    var map = {};
    modalBody.querySelectorAll('[data-change]').forEach(function (cb) { if (cb.checked) { var c = res.changes[Number(cb.getAttribute('data-change'))]; map[c.id] = c.to; } });
    var withRes = document.getElementById('impRes') && document.getElementById('impRes').checked;
    store.setChecks(map, 'import-hk');
    if (withRes) {
      if (res.summary.geo !== null) store.setResource('geo', res.summary.geo);
      if (res.summary.essence !== null) store.setResource('essence', res.summary.essence);
      if (res.summary.grubs !== null) store.setResource('grubs', res.summary.grubs);
    }
    ui.pendingImport = null; closeModal(); toast('Save applied to the roadmap ✓', 'ok');
  }
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); searchInput.focus(); }
  });

  /* mobile nav */
  var sidebar = document.getElementById('sidebar'), scrim = document.getElementById('scrim'), menuBtn = document.getElementById('menuBtn');
  function closeNav() { document.body.classList.remove('nav-open'); scrim.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () { var o = !document.body.classList.contains('nav-open'); document.body.classList.toggle('nav-open', o); scrim.hidden = !o; menuBtn.setAttribute('aria-expanded', String(o)); });
  scrim.addEventListener('click', closeNav);
  sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  /* spoilers: tap to reveal */
  document.addEventListener('click', function (e) { var sp = e.target.closest('.spoiler .sp'); if (sp) sp.classList.add('revealed'); });

  /* ============================== PARTICLES ============================== */
  function particles() {
    var c = document.getElementById('particles'), ctx = c.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var dots = [], w, h, raf;
    function size() { w = c.width = window.innerWidth * devicePixelRatio; h = c.height = window.innerHeight * devicePixelRatio; c.style.width = window.innerWidth + 'px'; c.style.height = window.innerHeight + 'px'; }
    function make() { dots = []; var n = Math.min(70, Math.floor(window.innerWidth / 22)); for (var i = 0; i < n; i++) dots.push({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.6 + 0.4) * devicePixelRatio, vy: -(Math.random() * 0.25 + 0.05) * devicePixelRatio, vx: (Math.random() - 0.5) * 0.15 * devicePixelRatio, a: Math.random() * 0.5 + 0.15, p: Math.random() * 6.28 }); }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      var col = getComputedStyle(document.body).getPropertyValue('--particle').trim() || '200,225,255';
      dots.forEach(function (d) {
        d.y += d.vy; d.x += d.vx; d.p += 0.015;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        var a = d.a * (0.6 + 0.4 * Math.sin(d.p));
        ctx.beginPath(); ctx.fillStyle = 'rgba(' + col + ',' + a + ')'; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(' + col + ',0.8)';
        ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      });
      raf = requestAnimationFrame(frame);
    }
    function start() { cancelAnimationFrame(raf); size(); make(); if (!reduce.matches) frame(); else ctx.clearRect(0, 0, w, h); }
    window.addEventListener('resize', start);
    if (reduce.addEventListener) reduce.addEventListener('change', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else if (!reduce.matches) frame(); });
    start();
  }

  /* ============================== BOOT ============================== */
  document.querySelectorAll('i.ni[data-icon]').forEach(function (n) { n.outerHTML = HK.Icons.svg(n.getAttribute('data-icon'), n.className); });
  music = HK.Music.init(store, document.getElementById('music'), document.getElementById('ambience'), toast);
  sync = HK.Sync.init(store);
  sync.onChange(function () { var el = document.getElementById('syncStatus'); if (el) el.innerHTML = syncStatusHtml(); });
  var audit = runAudit();
  if (audit.errors.length) console.error('[HK] 112% audit FAILED', audit.errors); else console.info('[HK] 112% audit passed — total', audit.total);
  particles();
  render(false);
  // expose for debugging/tests
  window.HKApp = { store: store, engine: E, render: render, runAudit: runAudit, openItem: openItem, music: music, ui: ui, sync: function () { return sync; } };
})();
