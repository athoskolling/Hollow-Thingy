/*
 * Hollow Knight Companion — ACCOUNT LOGIN + CLOUD SYNC (optional, Firebase)
 * ---------------------------------------------------------------
 * Sign in with Google, GitHub or an e-mail link; your Main-save progress is kept in YOUR private
 * Firestore document (users/{uid}) and updates live on every device where you're signed in.
 * Firebase's web SDK is loaded lazily from gstatic.com only when a Firebase config exists.
 * The config is public by design; access is enforced by firestore.rules (owner-only).
 *
 * Safety rules (learned the hard way — a brand-new device must never wipe the cloud copy):
 *  - a device that never changed anything has updatedAt = epoch, so it always loses to real progress;
 *  - the first time a device links to an account, if BOTH sides have different progress you choose:
 *    use cloud / use this device / merge (union of checks, max of resources);
 *  - after that, the most recent save wins.
 */
(function (root) {
  'use strict';
  var KEY = 'hk-companion-cloud', CFG_KEY = 'hk-companion-firebase', EMAIL_KEY = 'hk-companion-cloud-email';
  var SDK = 'https://www.gstatic.com/firebasejs/12.17.0/';

  /* ---------- pure helpers (unit-tested in Node) ---------- */
  function isPristine(s) {
    if (!s) return true;
    var r = s.resources || {};
    return !Object.keys(s.checks || {}).length && !(r.geo || r.essence || r.grubs) && !Object.keys(s.notes || {}).length && !(s.builds || []).length && !(s.later || []).length;
  }
  function sameProgress(a, b) {
    function k(s) { var r = s.resources || {}; return JSON.stringify([Object.keys(s.checks || {}).sort(), r.geo || 0, r.essence || 0, r.grubs || 0]); }
    return k(a) === k(b);
  }
  function merge(local, remote) {
    var out = JSON.parse(JSON.stringify(local));
    out.checks = Object.assign({}, remote.checks, local.checks);
    out.resources = {};
    ['geo', 'essence', 'grubs'].forEach(function (k) { out.resources[k] = Math.max((local.resources || {})[k] || 0, (remote.resources || {})[k] || 0); });
    out.notes = Object.assign({}, remote.notes, local.notes);
    out.later = (local.later || []).concat((remote.later || []).filter(function (x) { return (local.later || []).indexOf(x) < 0; }));
    var ids = {}; out.builds = (local.builds || []).concat(remote.builds || []).filter(function (b) { if (ids[b.id]) return false; ids[b.id] = 1; return true; });
    var days = {}; (remote.history || []).concat(local.history || []).forEach(function (h) { if (!days[h.d] || h.v >= days[h.d].v) days[h.d] = h; });
    out.history = Object.keys(days).sort().map(function (d) { return days[d]; });
    out.updatedAt = new Date().toISOString();
    return out;
  }

  var FRIENDLY = {
    'auth/popup-blocked': 'Your browser blocked the sign-in pop-up — allow pop-ups for this site and try again.',
    'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
    'auth/cancelled-popup-request': 'Sign-in window was closed before finishing.',
    'auth/unauthorized-domain': 'This site’s address isn’t in Firebase → Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'That sign-in method isn’t enabled in Firebase → Authentication → Sign-in method.',
    'auth/account-exists-with-different-credential': 'This e-mail already has an account with another sign-in method — use that one (e.g. Google).',
    'auth/invalid-email': 'That e-mail address doesn’t look right.',
    'auth/invalid-action-code': 'This sign-in link was already used or expired — request a new one.',
    'auth/expired-action-code': 'This sign-in link expired — request a new one.',
    'auth/network-request-failed': 'No connection to Firebase. Check your internet.',
    'permission-denied': 'Firestore refused access — publish the rules from firestore.rules in your Firebase project.'
  };
  function friendly(e) { var c = e && (e.code || ''); return FRIENDLY[c] || (e && e.message) || 'Something went wrong.'; }

  function readCfg() {
    var c = null;
    try { c = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { c = null; }
    if (!c || !c.apiKey) c = root.HK_FIREBASE;
    return c && c.apiKey && c.projectId && c.appId ? c : null;
  }
  function parseConfig(text) {
    // accepts the JS snippet Firebase shows ("const firebaseConfig = {...};") or plain JSON
    var m = String(text || '').match(/\{[\s\S]*\}/); if (!m) return null;
    var obj = {};
    m[0].replace(/["']?(\w+)["']?\s*:\s*["']([^"']*)["']/g, function (_, k, v) { obj[k] = v; return ''; });
    return obj.apiKey && obj.projectId && obj.appId ? obj : null;
  }

  function init(store, opts) {
    opts = opts || {};
    var lsLink = (function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } })();
    function saveLink() { try { localStorage.setItem(KEY, JSON.stringify(lsLink)); } catch (e) { /* noop */ } }
    var cfg = readCfg(), A = null, F = null, auth = null, db = null, ref = null, unsub = null;
    var timer = null, applying = false, user = null, listeners = [], pendingLink = false;
    var status = { state: cfg ? 'loading' : 'unconfigured', msg: '', at: lsLink.lastSync || null, conflict: null };

    function set(state, msg, extra) {
      status = { state: state, msg: msg || '', at: lsLink.lastSync || null, conflict: state === 'conflict' ? status.conflict : null };
      if (extra) Object.keys(extra).forEach(function (k) { status[k] = extra[k]; });
      listeners.forEach(function (f) { try { f(status); } catch (e) { /* noop */ } });
    }
    function mainOnly() { return !store.profiles || store.profiles.active() === 'main'; }
    function stamp() { lsLink.lastSync = new Date().toISOString(); saveLink(); }

    function push() {
      if (!user || !ref || !mainOnly()) return Promise.resolve();
      var local = store.get();
      return F.setDoc(ref, { state: store.exportJSON(), updatedAt: local.updatedAt, v: 1 }).then(function () {
        lsLink.uid = user.uid; lsLink.lastPushed = local.updatedAt; stamp(); set('ok', 'Saved to your account');
      }).catch(function (e) { set('error', friendly(e)); });
    }
    function pull(remote) {
      applying = true;
      try { store.importJSON(remote); } finally { applying = false; }
      lsLink.uid = user.uid; lsLink.lastPushed = store.get().updatedAt; stamp(); set('ok', 'Loaded your latest progress');
    }
    function reconcile(remote) {
      if (!user) return;
      if (!mainOnly()) { set('idle', 'Sync pauses while another save profile is active'); return; }
      if (status.state === 'conflict') return;
      var local = store.get(), first = lsLink.uid !== user.uid;
      if (first) {
        if (!remote || isPristine(remote)) { lsLink.uid = user.uid; saveLink(); if (isPristine(local)) { stamp(); set('ok', 'Signed in — nothing to sync yet'); } else push(); return; }
        if (isPristine(local)) { pull(remote); return; }
        if (sameProgress(local, remote)) { lsLink.uid = user.uid; lsLink.lastPushed = local.updatedAt; stamp(); set('ok', 'Up to date'); return; }
        set('conflict', 'This device and your account both have progress.', { conflict: { remote: remote, local: local } });
        return;
      }
      if (!remote) { push(); return; }
      var rT = Date.parse(remote.updatedAt || 0) || 0, lT = Date.parse(local.updatedAt || 0) || 0;
      if (rT > lT) pull(remote);
      else if (lT > rT && local.updatedAt !== lsLink.lastPushed) push();
      else { stamp(); set('ok', 'Up to date'); }
    }
    function onSnap(snap) {
      if (snap.metadata && snap.metadata.hasPendingWrites) return;
      var remote = null;
      if (snap.exists()) { try { remote = JSON.parse(snap.data().state); } catch (e) { remote = null; } }
      reconcile(remote);
    }
    function listen() {
      if (unsub) { unsub(); unsub = null; }
      ref = F.doc(db, 'users', user.uid);
      set('busy', 'Syncing…');
      unsub = F.onSnapshot(ref, onSnap, function (e) { set('error', friendly(e)); });
    }
    function onUser(u) {
      user = u || null;
      if (!user) { if (unsub) { unsub(); unsub = null; } ref = null; set(pendingLink ? 'needemail' : 'signedout', ''); return; }
      listen();
    }

    function load() {
      if (!cfg || A) return Promise.resolve();
      set('loading', 'Loading…');
      return Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]).then(function (m) {
        var app = m[0].initializeApp(cfg);
        A = m[1]; F = m[2]; auth = A.getAuth(app); db = F.getFirestore(app);
        pendingLink = A.isSignInWithEmailLink(auth, location.href);
        A.onAuthStateChanged(auth, onUser);
        if (pendingLink) {
          var em = null; try { em = localStorage.getItem(EMAIL_KEY); } catch (e) { /* noop */ }
          if (em) completeLink(em); else set('needemail', 'Confirm your e-mail to finish signing in.');
        }
      }).catch(function (e) { set('error', 'Could not load Firebase (' + friendly(e) + ').'); });
    }
    function cleanUrl() { try { history.replaceState(null, '', location.pathname + '#/save'); } catch (e) { /* noop */ } }
    function completeLink(email) {
      return A.signInWithEmailLink(auth, String(email || '').trim(), location.href).then(function () {
        pendingLink = false; try { localStorage.removeItem(EMAIL_KEY); } catch (e) { /* noop */ } cleanUrl();
      }).catch(function (e) { set('error', friendly(e)); });
    }

    store.subscribe(function (s, reason) {
      if (!user || applying || reason === 'import-sync' || status.state === 'conflict') return;
      if (reason === 'profile') { if (mainOnly() && ref) F.getDoc(ref).then(function (sn) { onSnap(sn); }); else set('idle', 'Sync pauses while another save profile is active'); return; }
      if (!mainOnly()) return;
      clearTimeout(timer); set('pending', 'Changes waiting to sync…');
      timer = setTimeout(push, opts.delay || 2000);
    });
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (!document.hidden && user && ref && status.state !== 'conflict') F.getDoc(ref).then(onSnap, function () { /* listener reports errors */ }); });
    if (cfg) setTimeout(load, 0);

    return {
      configured: function () { return !!cfg; },
      status: function () { return status; },
      user: function () { return user ? { uid: user.uid, email: user.email, name: user.displayName } : null; },
      onChange: function (f) { listeners.push(f); },
      setConfig: function (text) {
        var c = parseConfig(text); if (!c) return false;
        try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) { /* noop */ }
        cfg = c; load(); return true;
      },
      clearConfig: function () { try { localStorage.removeItem(CFG_KEY); } catch (e) { /* noop */ } location.reload(); },
      signIn: function (provider) {
        return load().then(function () {
          var P = provider === 'github' ? new A.GithubAuthProvider() : new A.GoogleAuthProvider();
          return A.signInWithPopup(auth, P);
        }).catch(function (e) { set('error', friendly(e)); });
      },
      sendLink: function (email) {
        email = String(email || '').trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) { set('error', FRIENDLY['auth/invalid-email']); return Promise.resolve(false); }
        return load().then(function () {
          return A.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
        }).then(function () { try { localStorage.setItem(EMAIL_KEY, email); } catch (e) { /* noop */ } set('linksent', 'We sent a sign-in link to ' + email + '. Open it on this device.'); return true; })
          .catch(function (e) { set('error', friendly(e)); return false; });
      },
      completeLink: function (email) { return load().then(function () { return completeLink(email); }); },
      signOut: function () { return A ? A.signOut(auth).then(function () { lsLink = {}; saveLink(); set('signedout', ''); }) : Promise.resolve(); },
      sync: function () { if (!user || !ref) return Promise.resolve(); set('busy', 'Syncing…'); return F.getDoc(ref).then(onSnap).catch(function (e) { set('error', friendly(e)); }); },
      resolve: function (choice) {
        var c = status.conflict; if (!c) return Promise.resolve();
        status = { state: 'busy', msg: '', at: status.at, conflict: null };
        if (choice === 'cloud') { pull(c.remote); return Promise.resolve(); }
        if (choice === 'merge') { applying = true; try { store.importJSON(merge(c.local, c.remote)); } finally { applying = false; } return push(); }
        // keep this device's progress, stamped as the newest save so every other device adopts it
        lsLink.uid = user.uid; applying = true; try { store.setSetting('spoilers', !!store.get().settings.spoilers); } finally { applying = false; }
        return push();
      },
      deleteCloud: function () { return ref ? F.deleteDoc(ref).then(function () { lsLink.lastPushed = null; saveLink(); set('ok', 'Cloud copy deleted (this device keeps its progress)'); }).catch(function (e) { set('error', friendly(e)); }) : Promise.resolve(); }
    };
  }
  root.HK = root.HK || {};
  root.HK.Cloud = { init: init, merge: merge, isPristine: isPristine, sameProgress: sameProgress, parseConfig: parseConfig, friendly: friendly };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HK.Cloud;
})(typeof window !== 'undefined' ? window : globalThis);
