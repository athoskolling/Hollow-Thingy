/*
 * Hollow Knight Companion — ENGINE
 * dependency engine · completion calculator · region progress · next-objective engine
 * Pure functions over (DATA, state). No DOM here (testable in Node).
 */
(function (root) {
  'use strict';

  function createEngine(DATA, getState) {
    var byId = {};
    DATA.ITEMS.forEach(function (i) { byId[i.id] = i; });
    var stageIndex = {};
    DATA.STAGES.forEach(function (s, idx) { stageIndex[s.id] = idx; });
    var regionById = {};
    DATA.REGIONS.forEach(function (r) { regionById[r.id] = r; });

    function S() { return getState(); }

    /* ---------------- dependency engine ---------------- */
    function evalRule(rule) {
      if (!rule) return false;
      if (rule.allOf) return rule.allOf.every(isDone);
      if (rule.anyOf) return rule.anyOf.some(isDone);
      if (rule.countOf) return rule.countOf.filter(isDone).length >= rule.atLeast;
      return false;
    }
    function isDone(id) {
      var it = byId[id];
      if (!it) return false;
      if (it.derived) return evalRule(it.rule);
      return S().checks[id] === true;
    }
    /** Missing hard requirements of an item (+ region access). Returns array of {ids, mode} groups. */
    function missing(item, opts) {
      var out = [];
      item.req.forEach(function (r) { if (!isDone(r)) out.push({ mode: 'all', ids: [r] }); });
      if (item.any.length && !item.any.some(isDone)) out.push({ mode: 'any', ids: item.any.slice() });
      if (!(opts && opts.noRegion)) {
        var reg = regionById[item.region];
        if (reg) {
          (reg.req || []).forEach(function (r) { if (r !== item.id && !isDone(r) && item.req.indexOf(r) < 0) out.push({ mode: 'all', ids: [r], region: true }); });
          if (reg.any && reg.any.length && reg.any.indexOf(item.id) < 0 && !reg.any.some(isDone)) out.push({ mode: 'any', ids: reg.any.slice(), region: true });
        }
      }
      return out;
    }
    function isAvailable(item) { return missing(item).length === 0; }
    /** Numeric (soft) conditions not met yet — warnings only. */
    function softIssues(item) {
      var s = S(), out = [];
      if (!item.soft) return out;
      if (item.soft.essence && s.resources.essence < item.soft.essence) out.push({ key: 'essence', need: item.soft.essence, have: s.resources.essence, label: item.soft.essence + ' Essence' });
      if (item.soft.grubs && s.resources.grubs < item.soft.grubs) out.push({ key: 'grubs', need: item.soft.grubs, have: s.resources.grubs, label: item.soft.grubs + ' Grubs' });
      if (item.soft.keyHeld) { var k = keys(); if (k.held < 1) out.push({ key: 'keys', need: 1, have: k.held, label: 'a Simple Key in hand' }); }
      if (item.soft.charms) { var c = charmCount(); if (c < item.soft.charms) out.push({ key: 'charms', need: item.soft.charms, have: c, label: item.soft.charms + ' Charms' }); }
      return out;
    }
    function isVoidHeartLocked() { return !isDone('ending-thk'); }

    /** Items that must already be done because a checked item hard-requires them (transitively). */
    function impliedSet() {
      var out = {};
      function walk(id) {
        var it = byId[id]; if (!it) return;
        it.req.forEach(function (r) { if (!out[r]) { out[r] = true; walk(r); } });
      }
      DATA.ITEMS.forEach(function (i) { if (!i.derived && isDone(i.id)) walk(i.id); });
      return out;
    }
    function isImplied(id) { return !isDone(id) && !!impliedSet()[id]; }
    function doneOrImplied(id, imp) { return isDone(id) || !!(imp || impliedSet())[id]; }

    /* ---------------- completion calculator ---------------- */
    function completion() {
      var total = 0, max = 0;
      DATA.ITEMS.forEach(function (it) { if (it.completion) { max += it.completion; if (isDone(it.id)) total += it.completion; } });
      return { value: total, max: max };
    }
    function completionBreakdown() {
      var out = {};
      Object.keys(DATA.OFFICIAL_BREAKDOWN).forEach(function (k) { out[k] = { got: 0, max: 0 }; });
      DATA.ITEMS.forEach(function (it) {
        if (!it.completion) return;
        var c = DATA.auditCategory(it);
        if (!out[c]) out[c] = { got: 0, max: 0 };
        out[c].max += it.completion;
        if (isDone(it.id)) out[c].got += it.completion;
      });
      return out;
    }
    function checklistItems() { return DATA.ITEMS.filter(function (i) { return !i.derived; }); }
    function checklist() {
      var items = checklistItems();
      return { done: items.filter(function (i) { return isDone(i.id); }).length, total: items.length };
    }

    /* ---------------- counters ---------------- */
    function countDone(pred) { return DATA.ITEMS.filter(function (i) { return pred(i) && isDone(i.id); }).length; }
    function charmCount() {
      var slots = {};
      DATA.ITEMS.forEach(function (i) {
        if (i.type === 'charm' && i.charmNum && isDone(i.id)) slots[i.charmNum] = true;
      });
      return Object.keys(slots).length;
    }
    function shards() { var n = countDone(function (i) { return i.type === 'mask'; }); return { shards: n, masks: 5 + Math.floor(n / 4), partial: n % 4, total: 16 }; }
    function vessels() { var n = countDone(function (i) { return i.type === 'vessel'; }); return { fragments: n, vessels: Math.floor(n / 3), partial: n % 3, total: 9 }; }
    function notches() { return 3 + countDone(function (i) { return i.type === 'notch'; }); }
    function nailLevel() { var l = 0; for (var n = 1; n <= 4; n++) if (isDone('nail-' + n)) l = n; return l; }
    function ore() {
      var collected = countDone(function (i) { return i.type === 'ore'; });
      var spent = 0;
      [1, 2, 3, 4].forEach(function (n) { if (isDone('nail-' + n)) spent += byId['nail-' + n].cost.ore; });
      return { collected: collected, spent: spent, held: Math.max(0, collected - spent), total: 6, inconsistent: spent > collected };
    }
    var NAIL_NAMES = ['Old Nail', 'Sharpened Nail', 'Channelled Nail', 'Coiled Nail', 'Pure Nail'];
    function nextNail() {
      var lvl = nailLevel();
      if (lvl >= 4) return null;
      var it = byId['nail-' + (lvl + 1)], o = ore(), geo = S().resources.geo;
      return { item: it, from: NAIL_NAMES[lvl], to: NAIL_NAMES[lvl + 1], geo: it.cost.geo, ore: it.cost.ore,
        geoMissing: Math.max(0, it.cost.geo - geo), oreMissing: Math.max(0, it.cost.ore - o.held),
        ready: geo >= it.cost.geo && o.held >= it.cost.ore };
    }
    function keys() {
      var obtained = DATA.ITEMS.filter(function (i) { return i.keyObtain; });
      var uses = DATA.ITEMS.filter(function (i) { return i.keyUse; });
      var got = obtained.filter(function (i) { return isDone(i.id); }).length;
      var used = uses.filter(function (i) { return isDone(i.id); }).length;
      return { obtained: obtained, uses: uses, got: got, used: used, held: got - used, inconsistent: used > got };
    }

    /* ---------------- region progress ---------------- */
    function regionItems(regionId) { return DATA.ITEMS.filter(function (i) { return i.region === regionId; }); }
    function isMain(i) { return !i.optional && !i.beyond && !i.derived && !i.voidHeartException; }
    function regionProgress(regionId) {
      var items = regionItems(regionId).filter(function (i) { return !i.derived; });
      var main = items.filter(isMain);
      var mainDone = main.filter(function (i) { return isDone(i.id); }).length;
      var all = items.filter(function (i) { return isDone(i.id); }).length;
      var accessible = missingRegionAccess(regionId).length === 0;
      return { main: main.length, mainDone: mainDone, all: items.length, allDone: all,
        pct: main.length ? Math.round(mainDone / main.length * 100) : 100, complete: main.length > 0 && mainDone === main.length, accessible: accessible };
    }
    function missingRegionAccess(regionId) {
      var reg = regionById[regionId], out = [];
      if (!reg) return out;
      (reg.req || []).forEach(function (r) { if (!isDone(r)) out.push({ mode: 'all', ids: [r] }); });
      if (reg.any && reg.any.length && !reg.any.some(isDone)) out.push({ mode: 'any', ids: reg.any.slice() });
      return out;
    }
    function regionStatus(regionId) {
      var p = regionProgress(regionId);
      if (p.complete) return 'complete';
      var nxt = nextObjective();
      if (regionId === S().currentRegion || (nxt && nxt.item.region === regionId)) return 'current';
      return 'future';
    }

    /* ---------------- next-objective engine ---------------- */
    function candidatePool(includeOptional) {
      var all112 = completion().value >= 112;
      var imp = impliedSet();
      return DATA.ITEMS.filter(function (i) {
        if (i.derived || isDone(i.id) || imp[i.id]) return false;
        if (i.voidHeart && isVoidHeartLocked()) return false;          // never recommend Void Heart before THK
        if (i.excludes && i.excludes.some(isDone)) return false;        // mutually exclusive choice already made
        if (i.beyond && !all112) return false;
        if (!includeOptional && i.optional) return false;
        if (i.type === 'npc' && i.optional) return false;
        return true;
      });
    }
    function earliestOpenStage() {
      var idx = DATA.STAGES.length, imp = impliedSet();
      DATA.ITEMS.forEach(function (i) {
        if (i.goal && !i.derived && !i.optional && !i.beyond && !doneOrImplied(i.id, imp) && !(i.voidHeart && isVoidHeartLocked())) {
          if (i.excludes && i.excludes.some(isDone)) return;
          var s = stageIndex[i.stage]; if (s !== undefined && s < idx) idx = s;
        }
      });
      return idx;
    }
    function score(i, ctx) {
      var st = stageIndex[i.stage] !== undefined ? stageIndex[i.stage] : stageIndex['s-cleanup'];
      // side content of stages already passed is postponed to the current stage (after its goals)
      if (!i.goal && st < ctx.minStage) st = ctx.minStage;
      var sc = st * 100;
      if (!i.goal) sc += 45;                       // goals of a stage before its side content
      sc -= (i.prio || 0) * 3;                     // importance
      if (i.completion) sc -= i.completion * 4;    // counts for 112%
      if (i.contrib) sc -= 2;
      if (i.region === ctx.current && st <= ctx.minStage + 2) sc -= 70;   // you are already here: reduce backtracking
      if (softIssues(i).length) sc += 400;         // numeric condition (Essence/Grubs/Charms) not reached yet
      if (i.cost && i.cost.geo && i.cost.geo > ctx.geo) sc += 120;        // can't afford yet
      return sc;
    }
    function nextObjective() {
      var s = S();
      var ctx = { current: s.currentRegion, minStage: earliestOpenStage(), geo: s.resources.geo };
      if (s.pinned && byId[s.pinned] && !isDone(s.pinned)) {
        return build(byId[s.pinned], true);
      }
      var pool = candidatePool(false).filter(isAvailable);
      if (!pool.length) pool = candidatePool(true).filter(isAvailable);
      if (!pool.length) {
        var blocked = candidatePool(false);
        if (!blocked.length) return null;
        blocked.sort(function (a, b) { return score(a, ctx) - score(b, ctx); });
        return build(blocked[0], false);
      }
      pool.sort(function (a, b) { return score(a, ctx) - score(b, ctx) || a.name.localeCompare(b.name); });
      return build(pool[0], false);
    }
    function build(item, pinned) {
      return { item: item, pinned: pinned, region: regionById[item.region], missing: missing(item), soft: softIssues(item),
        stage: DATA.STAGES[stageIndex[item.stage]] || null };
    }
    /** Useful things available in a region (incl. optional), excluding a given id. */
    function whileHere(regionId, excludeId, limit) {
      var s = S();
      var ctx = { current: regionId, minStage: earliestOpenStage(), geo: s.resources.geo };
      var imp = impliedSet();
      var list = DATA.ITEMS.filter(function (i) {
        return i.region === regionId && !i.derived && !isDone(i.id) && !imp[i.id] && i.id !== excludeId && !i.beyond &&
          !(i.voidHeart && isVoidHeartLocked()) && !(i.excludes && i.excludes.some(isDone)) && isAvailable(i);
      });
      list.sort(function (a, b) {
        var oa = a.optional ? 1 : 0, ob = b.optional ? 1 : 0;
        return oa - ob || score(a, ctx) - score(b, ctx);
      });
      return limit ? list.slice(0, limit) : list;
    }
    function readyToCollect(limit) {
      var geo = S().resources.geo;
      var list = candidatePool(true).filter(function (i) {
        return isAvailable(i) && softIssues(i).length === 0 && (!i.cost || !i.cost.geo || i.cost.geo <= geo) &&
          (i.soft || (i.cost && i.cost.geo) || i.type === 'nail');
      });
      return limit ? list.slice(0, limit) : list;
    }
    function blockedObjectives(limit) {
      var list = candidatePool(false).filter(function (i) { return i.goal && !isAvailable(i); });
      list.sort(function (a, b) { return (stageIndex[a.stage] || 0) - (stageIndex[b.stage] || 0); });
      return limit ? list.slice(0, limit) : list;
    }
    /** Geo needed for the objective + purchases available in its region. */
    function recommendedGeo(obj) {
      if (!obj) return 0;
      var sum = (obj.item.cost && obj.item.cost.geo) || 0;
      whileHere(obj.item.region, obj.item.id).forEach(function (i) { if (!i.optional && i.cost && i.cost.geo) sum += i.cost.geo; });
      var nn = nextNail();
      if (nn && obj.item.region === 'city-of-tears') sum += nn.geo;
      return sum;
    }
    /** Upcoming Geo expenses (not done, not optional/beyond). */
    function upcomingExpenses() {
      var list = DATA.ITEMS.filter(function (i) { return i.cost && i.cost.geo && !isDone(i.id) && !i.beyond && !(i.excludes && i.excludes.some(isDone)); });
      list.sort(function (a, b) { return (stageIndex[a.stage] || 0) - (stageIndex[b.stage] || 0) || a.cost.geo - b.cost.geo; });
      return list;
    }

    /* ---------------- stages / roadmap ---------------- */
    function stageStatus() {
      var nxt = nextObjective();
      var firstOpen = null, imp = impliedSet();
      return DATA.STAGES.map(function (st, idx) {
        var goals = DATA.ITEMS.filter(function (i) { return i.stage === st.id && i.goal && !i.optional; });
        var done = goals.filter(function (i) { return doneOrImplied(i.id, imp) || (i.excludes && i.excludes.some(isDone)); }).length;
        var complete = goals.length > 0 ? done === goals.length : false;
        if (st.id === 's-112') complete = completion().value >= 112;
        if (st.id === 's-cleanup') {
          var main = DATA.ITEMS.filter(function (i) { return i.stage === 's-cleanup' && !i.optional && !i.derived && !i.beyond; });
          goals = main; done = main.filter(function (i) { return doneOrImplied(i.id, imp); }).length; complete = done === main.length;
        }
        var status = complete ? 'complete' : 'future';
        if (!complete && firstOpen === null && st.id !== 's-beyond') { firstOpen = idx; status = 'current'; }
        if (nxt && nxt.item.stage === st.id && !complete) status = 'current';
        return { stage: st, goals: goals, done: done, total: goals.length, status: status };
      });
    }

    /* ---------------- warnings ---------------- */
    function inconsistencies() {
      var out = [];
      DATA.ITEMS.forEach(function (i) {
        if (i.derived || !isDone(i.id)) return;
        var m = missing(i, { noRegion: true });
        if (m.length) out.push({ item: i, missing: m });
      });
      var o = ore(); if (o.inconsistent) out.push({ special: 'ore', text: 'Nail upgrades use ' + o.spent + ' Pale Ore but only ' + o.collected + ' are checked.' });
      var k = keys(); if (k.inconsistent) out.push({ special: 'keys', text: 'More Simple Keys used (' + k.used + ') than obtained (' + k.got + ').' });
      if (isDone('nightmare-king-grimm') && isDone('banishment')) out.push({ special: 'grimm', text: 'Nightmare King Grimm and Banishment are mutually exclusive in a single save.' });
      if (isDone('grimmchild') && isDone('carefree-melody')) out.push({ special: 'grimm2', text: 'Grimmchild and Carefree Melody cannot both be owned.' });
      return out;
    }
    function voidHeartViolation() { return isDone('void-heart') && !isDone('ending-thk'); }

    return {
      byId: byId, isDone: isDone, missing: missing, isAvailable: isAvailable, softIssues: softIssues,
      completion: completion, completionBreakdown: completionBreakdown, checklist: checklist,
      charmCount: charmCount, shards: shards, vessels: vessels, notches: notches, nailLevel: nailLevel, NAIL_NAMES: NAIL_NAMES,
      ore: ore, nextNail: nextNail, keys: keys,
      regionItems: regionItems, regionProgress: regionProgress, regionStatus: regionStatus, missingRegionAccess: missingRegionAccess,
      nextObjective: nextObjective, whileHere: whileHere, readyToCollect: readyToCollect, blockedObjectives: blockedObjectives,
      recommendedGeo: recommendedGeo, upcomingExpenses: upcomingExpenses, stageStatus: stageStatus,
      inconsistencies: inconsistencies, impliedSet: impliedSet, isImplied: isImplied, isVoidHeartLocked: isVoidHeartLocked, voidHeartViolation: voidHeartViolation,
      isMain: isMain, stageIndex: stageIndex, regionById: regionById
    };
  }

  root.HK = root.HK || {};
  root.HK.createEngine = createEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = { createEngine: createEngine };
})(typeof window !== 'undefined' ? window : globalThis);
