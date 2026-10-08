/*
 * Hollow Knight Companion — SYNC BETWEEN DEVICES (optional)
 * ---------------------------------------------------------------
 * Your progress normally lives only in this browser (localStorage). To see the SAME progress on the
 * computer, phone and notebook, the site can keep a copy in a PRIVATE (secret) GitHub Gist in your
 * own GitHub account. No server of ours is involved: the browser talks straight to api.github.com
 * with a personal token that has ONLY the "gist" permission. The token stays in this browser.
 *
 * Rules: on open (and when you come back to the tab) it pulls; after every change it pushes (a few
 * seconds later). If both sides changed, the most recent save wins.
 */
(function (root) {
  'use strict';
  var KEY = 'hk-companion-sync', FILE = 'hollow-knight-companion.json', API = 'https://api.github.com';

  function init(store, opts) {
    opts = opts || {};
    var cfg = load(), timer = null, busy = false, listeners = [], status = { state: cfg.token ? 'idle' : 'off', msg: '', at: cfg.lastSync || null };
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* noop */ } }
    function set(state, msg) { status = { state: state, msg: msg || '', at: cfg.lastSync || null }; listeners.forEach(function (f) { try { f(status); } catch (e) { /* noop */ } }); }
    function gh(method, path, body) {
      return fetch(API + path, {
        method: method,
        headers: { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        if (r.status === 401) throw new Error('Token rejected (401). Create a new token with the “gist” permission.');
        if (r.status === 403 || r.status === 404) throw new Error('GitHub refused (' + r.status + '). Check that the token has the “gist” permission.');
        if (!r.ok) throw new Error('GitHub error ' + r.status);
        return r.status === 204 ? null : r.json();
      });
    }
    function readGist(g) {
      var f = g && g.files && g.files[FILE];
      if (!f) return Promise.resolve(null);
      if (f.truncated && f.raw_url) return fetch(f.raw_url).then(function (r) { return r.text(); }).then(function (t) { return JSON.parse(t); });
      return Promise.resolve(f.content ? JSON.parse(f.content) : null);
    }
    function findGist() {
      if (cfg.gistId) return gh('GET', '/gists/' + cfg.gistId).catch(function () { cfg.gistId = null; save(); return findGist(); });
      return gh('GET', '/gists?per_page=100').then(function (list) {
        var g = (list || []).filter(function (x) { return x.files && x.files[FILE]; })[0];
        if (!g) return null;
        cfg.gistId = g.id; save();
        return gh('GET', '/gists/' + g.id);
      });
    }
    function payload() { return store.exportJSON(); }
    function push() {
      if (!cfg.token) return Promise.resolve();
      var body = { description: 'Hollow Knight Companion — progress (synced by the site)', files: {} };
      body.files[FILE] = { content: payload() };
      var p = cfg.gistId ? gh('PATCH', '/gists/' + cfg.gistId, body) : (body.public = false, gh('POST', '/gists', body));
      return p.then(function (g) { if (g && g.id) cfg.gistId = g.id; cfg.lastSync = new Date().toISOString(); cfg.lastPushed = store.get().updatedAt; save(); set('ok', 'Saved to your GitHub'); });
    }
    /** pull the remote copy; newest wins */
    function sync() {
      if (!cfg.token) return Promise.resolve('off');
      if (busy) return Promise.resolve('busy');
      busy = true; set('busy', 'Syncing…');
      return findGist().then(readGist).then(function (remote) {
        var local = store.get();
        if (!remote) return push().then(function () { return 'pushed'; });
        var rT = Date.parse(remote.updatedAt || 0) || 0, lT = Date.parse(local.updatedAt || 0) || 0;
        if (rT > lT) {
          applying = true; store.importJSON(remote); applying = false;
          cfg.lastSync = new Date().toISOString(); cfg.lastPushed = store.get().updatedAt; save();
          set('ok', 'Loaded your latest progress'); return 'pulled';
        }
        if (lT > rT && local.updatedAt !== cfg.lastPushed) return push().then(function () { return 'pushed'; });
        cfg.lastSync = new Date().toISOString(); save(); set('ok', 'Up to date'); return 'same';
      }).catch(function (e) { set('error', e.message); return 'error'; }).then(function (r) { busy = false; return r; });
    }
    var applying = false;
    store.subscribe(function (s, reason) {
      if (!cfg.token || applying || reason === 'import-sync') return;
      clearTimeout(timer);
      set('pending', 'Changes waiting to sync…');
      timer = setTimeout(function () { if (!busy) { busy = true; push().catch(function (e) { set('error', e.message); }).then(function () { busy = false; }); } }, opts.delay || 3000);
    });
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (!document.hidden && cfg.token) sync(); });
    if (cfg.token) setTimeout(sync, 300);
    return {
      connect: function (token) {
        cfg = { token: String(token || '').trim() }; save();
        if (!cfg.token) { set('off'); return Promise.resolve('off'); }
        return sync();
      },
      disconnect: function () { cfg = {}; save(); set('off'); },
      sync: sync,
      status: function () { return status; },
      connected: function () { return !!cfg.token; },
      onChange: function (f) { listeners.push(f); }
    };
  }
  root.HK = root.HK || {};
  root.HK.Sync = { init: init, FILE: FILE };
})(typeof window !== 'undefined' ? window : globalThis);
