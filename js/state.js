/*
 * Hollow Knight Companion — STATE MANAGER
 * Single source of truth for everything the user records.
 * Persists to localStorage automatically; exportable/importable as versioned JSON.
 */
(function (root) {
  'use strict';
  var STORAGE_KEY = 'hk-companion-state';
  var VERSION = 1;

  function defaultState(DATA) {
    return {
      version: VERSION,
      checks: {},
      resources: { geo: 0, essence: 0, grubs: 0 },
      currentRegion: 'dirtmouth',
      settings: { spoilers: false, compact: false, hideOptional: false, hideDone: false },
      music: { volume: 0.4, muted: false, loop: true },
      notes: {},
      pinned: null,
      recent: [],
      updatedAt: new Date().toISOString()
    };
  }

  function clampInt(v, min, max) {
    v = parseInt(v, 10);
    if (isNaN(v)) v = 0;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  }

  /** Validate / migrate an arbitrary object into a state object. Throws on invalid input. */
  function normalize(obj, DATA) {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid progress file: not an object.');
    if (obj.app && obj.app !== 'hollow-knight-companion') throw new Error('This JSON is not a Hollow Knight Companion backup.');
    var v = obj.version;
    if (v === undefined) throw new Error('Missing "version" field.');
    if (typeof v !== 'number' || v > VERSION) throw new Error('Unsupported version: ' + v + ' (this app supports up to ' + VERSION + ').');
    // future migrations: if (v < 2) { ... }
    var base = defaultState(DATA);
    var known = {};
    DATA.ITEMS.forEach(function (i) { known[i.id] = true; });
    var checks = {};
    var src = obj.checks || {};
    Object.keys(src).forEach(function (k) { if (known[k] && src[k] === true) checks[k] = true; });
    var res = obj.resources || {};
    var st = {
      version: VERSION,
      checks: checks,
      resources: {
        geo: clampInt(res.geo, 0, 9999999),
        essence: clampInt(res.essence, 0, 99999),
        grubs: clampInt(res.grubs, 0, DATA.GRUBS_TOTAL)
      },
      currentRegion: DATA.REGIONS.some(function (r) { return r.id === obj.currentRegion; }) ? obj.currentRegion : base.currentRegion,
      settings: Object.assign({}, base.settings, obj.settings || {}),
      music: Object.assign({}, base.music, obj.music || {}),
      notes: typeof obj.notes === 'object' && obj.notes ? obj.notes : {},
      pinned: known[obj.pinned] ? obj.pinned : null,
      recent: Array.isArray(obj.recent) ? obj.recent.filter(function (r) { return r && known[r.id]; }).slice(0, 12) : [],
      updatedAt: obj.updatedAt || new Date().toISOString()
    };
    st.music.volume = Math.max(0, Math.min(1, Number(st.music.volume) || 0));
    return st;
  }

  function createStore(DATA, storage) {
    storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    var listeners = [];
    var state;
    var byId = {};
    DATA.ITEMS.forEach(function (i) { byId[i.id] = i; });

    function load() {
      try {
        var raw = storage && storage.getItem(STORAGE_KEY);
        state = raw ? normalize(JSON.parse(raw), DATA) : defaultState(DATA);
      } catch (e) {
        console.warn('[HK] Could not read saved state, starting fresh:', e.message);
        state = defaultState(DATA);
      }
    }
    function persist() {
      state.updatedAt = new Date().toISOString();
      try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch (e) { console.warn('[HK] localStorage unavailable:', e.message); }
    }
    function emit(reason) { persist(); listeners.forEach(function (fn) { try { fn(state, reason); } catch (e) { console.error(e); } }); }

    function pushRecent(id) {
      state.recent = state.recent.filter(function (r) { return r.id !== id; });
      state.recent.unshift({ id: id, at: Date.now() });
      state.recent = state.recent.slice(0, 12);
    }

    load();

    var api = {
      VERSION: VERSION,
      get: function () { return state; },
      isChecked: function (id) { return state.checks[id] === true; },
      /** Set a single check. Never refuses based on requirements. */
      setCheck: function (id, value, opts) {
        var it = byId[id];
        if (!it || it.derived) return false;
        value = !!value;
        if (!!state.checks[id] === value) return false;
        if (value) { state.checks[id] = true; pushRecent(id); }
        else { delete state.checks[id]; state.recent = state.recent.filter(function (r) { return r.id !== id; }); }
        if (!(opts && opts.silent)) emit('check');
        return true;
      },
      toggle: function (id) { return api.setCheck(id, !state.checks[id]); },
      /** Batch update: {id: bool}. */
      setChecks: function (map, reason) {
        var changed = false;
        Object.keys(map).forEach(function (id) { if (api.setCheck(id, map[id], { silent: true })) changed = true; });
        if (changed) emit(reason || 'batch');
        return changed;
      },
      setResource: function (key, value) {
        if (!(key in state.resources)) return;
        var max = key === 'grubs' ? DATA.GRUBS_TOTAL : 9999999;
        state.resources[key] = clampInt(value, 0, max);
        emit('resource');
      },
      setRegion: function (id) { if (DATA.REGIONS.some(function (r) { return r.id === id; })) { state.currentRegion = id; emit('region'); } },
      setSetting: function (key, value) { state.settings[key] = value; emit('settings'); },
      setMusic: function (patch) { Object.assign(state.music, patch); persist(); },
      setNote: function (id, text) { if (text) state.notes[id] = String(text).slice(0, 2000); else delete state.notes[id]; persist(); },
      setPinned: function (id) { state.pinned = id || null; emit('pin'); },
      subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
      exportJSON: function () {
        return JSON.stringify(Object.assign({ app: 'hollow-knight-companion', exportedAt: new Date().toISOString() }, state), null, 2);
      },
      importJSON: function (text) {
        var obj = typeof text === 'string' ? JSON.parse(text) : text;
        state = normalize(obj, DATA);
        emit('import');
        return state;
      },
      reset: function () { state = defaultState(DATA); emit('reset'); return state; },
      STORAGE_KEY: STORAGE_KEY
    };
    return api;
  }

  root.HK = root.HK || {};
  root.HK.State = { createStore: createStore, normalize: normalize, defaultState: defaultState, VERSION: VERSION, STORAGE_KEY: STORAGE_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HK.State;
})(typeof window !== 'undefined' ? window : globalThis);
