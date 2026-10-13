/*
 * Hollow Knight Companion — SAVE WATCH
 * Finds user1.dat…user4.dat in a folder the player chose, and tells whether the file on the PC is newer
 * than what was last imported. Nothing is uploaded; files are only read.
 *  - Chrome / Edge: the File System Access API remembers the folder (handle kept in IndexedDB).
 *  - Firefox / Safari / phones: no such API, so the folder is chosen with <input webkitdirectory> each visit.
 * The pure helpers (slotName, pickSlots, compare) also run in Node for the tests.
 */
(function (root) {
  'use strict';
  var DB = 'hk-companion-savewatch', STORE = 'kv', META = 'hk-companion-savewatch-meta';
  var SLOT_RE = /^user([1-4])\.dat$/i;

  function slotName(name) { var m = SLOT_RE.exec(name || ''); return m ? 'user' + m[1] + '.dat' : null; }
  /** {name, modified, file}[] from any list of File objects, keeping only real save slots, newest first within a slot. */
  function pickSlots(files) {
    var best = {};
    Array.prototype.slice.call(files || []).forEach(function (f) {
      var n = slotName(f.name); if (!n) return;
      if (!best[n] || f.lastModified > best[n].modified) best[n] = { name: n, slot: Number(n.charAt(4)), modified: f.lastModified, size: f.size, file: f };
    });
    return Object.keys(best).sort().map(function (k) { return best[k]; });
  }
  /** Is the file newer than what we last imported (or dismissed)? */
  function compare(meta, slot) {
    meta = meta || {};
    if (!slot) return 'none';
    var imp = meta.imported;
    if (imp && imp.name === slot.name && imp.modified === slot.modified) return 'imported';
    if (meta.dismissed && meta.dismissed.name === slot.name && meta.dismissed.modified === slot.modified) return 'dismissed';
    return 'new';
  }

  /* ---------------- persisted meta (small, localStorage) ---------------- */
  function getMeta() { try { return JSON.parse(root.localStorage.getItem(META) || '{}') || {}; } catch (e) { return {}; } }
  function setMeta(m) { try { root.localStorage.setItem(META, JSON.stringify(m)); } catch (e) { /* private mode */ } }
  function patchMeta(p) { var m = getMeta(); Object.keys(p).forEach(function (k) { m[k] = p[k]; }); setMeta(m); return m; }

  /* ---------------- IndexedDB (directory handle) ---------------- */
  function idb() {
    return new Promise(function (res, rej) {
      var r = root.indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function kv(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(STORE, mode), req = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { res(req && req.result); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  var handle = null;
  function supported() { return typeof root.showDirectoryPicker === 'function' && !!root.indexedDB; }

  function load() {
    if (!supported()) return Promise.resolve(null);
    return kv('readonly', function (s) { return s.get('dir'); }).then(function (h) { handle = h || null; return handle; }).catch(function () { return null; });
  }
  /** Must run inside a click. Opens the folder picker and remembers the choice. */
  function link() {
    return root.showDirectoryPicker({ id: 'hk-save', mode: 'read' }).then(function (h) {
      handle = h;
      return kv('readwrite', function (s) { return s.put(h, 'dir'); }).then(function () { return h; });
    });
  }
  function unlink() { handle = null; patchMeta({ imported: null, dismissed: null, slot: null }); return kv('readwrite', function (s) { return s.delete('dir'); }).catch(function () {}); }
  function folderName() { return handle ? handle.name : ''; }
  function permission() {
    if (!handle) return Promise.resolve('none');
    return handle.queryPermission({ mode: 'read' }).catch(function () { return 'prompt'; });
  }
  /** Must run inside a click when permission is 'prompt'. */
  function requestAccess() { return handle.requestPermission({ mode: 'read' }); }
  /** Read the slots from the remembered folder (permission already granted). */
  function scan() {
    var out = [];
    return (async function () {
      for await (var entry of handle.values()) {
        if (entry.kind !== 'file' || !slotName(entry.name)) continue;
        var f = await entry.getFile();
        out.push(f);
      }
      return pickSlots(out);
    })();
  }

  var api = { slotName: slotName, pickSlots: pickSlots, compare: compare, getMeta: getMeta, patchMeta: patchMeta,
    supported: supported, load: load, link: link, unlink: unlink, folderName: folderName, permission: permission, requestAccess: requestAccess, scan: scan,
    hasHandle: function () { return !!handle; } };
  root.HK = root.HK || {};
  root.HK.SaveWatch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
