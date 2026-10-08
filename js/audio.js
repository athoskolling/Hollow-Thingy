/*
 * Hollow Knight Companion — REGION SOUNDTRACK (official, via Spotify)
 * ---------------------------------------------------------------
 * Each region plays its track from Christopher Larkin's official Hollow Knight soundtrack,
 * streamed by Spotify's own embedded player (nothing is downloaded or hosted here).
 * Two modes:
 *  - Embed (default): full tracks only if you're logged into Spotify in this browser, otherwise previews.
 *  - Connected account (optional, Premium): Spotify Web Playback SDK + PKCE login — plays the FULL track
 *    in this tab. No backend and no client secret: you register your own free Spotify app and paste its
 *    Client ID; tokens stay in this browser's localStorage and are never synced or exported.
 *
 * Region → track follows hollowknight.wiki "Soundtrack (Hollow Knight)" (where each track plays).
 * Track IDs checked on open.spotify.com.
 */
(function (root) {
  'use strict';
  var ALBUM = 'https://open.spotify.com/album/4XgGOMRY7H4hl6OQi5wb2Z';
  var T = {
    enter: ['Enter Hallownest', '7tajvm3L4vnNsOyMBf3yq3'], dirtmouth: ['Dirtmouth', '4gCnaT6NKQmR3hqEeHp30t'], crossroads: ['Crossroads', '2fwLXYI6N8l4tOY4ntSiUZ'],
    greenpath: ['Greenpath', '6fyI2QGPzUiqRHnuYD7oOp'], fungal: ['Fungal Wastes', '372ottv1RRZdzqAkywYMpA'], city: ['City of Tears', '0nD62ke95NJvAI8chsRjRg'],
    peak: ['Crystal Peak', '0OP7uPeLlDjPuPOkl4LcNu'], resting: ['Resting Grounds', '3QaFRJIXefCIaKk99rReFC'], dung: ['Dung Defender', '5JWnXDqHFgGJZFIZ3PZh8G'],
    gardens: ['Queen\'s Gardens', '1lJySpoTdGHcTV4OTaluls'], vessel: ['Broken Vessel', '7Epsqwic0O9yfbf0ll0z9w'], edge: ['Kingdom\'s Edge', '1IhyTWxNJZAwB7IL28HSux'],
    nosk: ['Nosk', '77vkOcahVHbBpF4tdjerSW'], palace: ['White Palace', '1aIcb5s4idJeItJV4vaVtW'], godhome: ['Godhome', '4AlK8tRaBaehJ8eQiEqe8l'],
    hive: ['Hive Knight', '6WoKAnQUVf9YawsvCO6tEO']
  };
  // [track, note]
  var REGION = {
    'dirtmouth': [T.dirtmouth], 'forgotten-crossroads': [T.crossroads], 'greenpath': [T.greenpath],
    'fog-canyon': [T.greenpath, 'In game, Fog Canyon uses the Greenpath theme.'],
    'fungal-wastes': [T.fungal], 'city-of-tears': [T.city], 'crystal-peak': [T.peak], 'resting-grounds': [T.resting],
    'royal-waterways': [T.dung, 'The Waterways ambience isn\'t on the album — Dung Defender lives here.'],
    'ancient-basin': [T.crossroads, 'In game, the Basin uses the Crossroads theme.'],
    'kingdoms-edge': [T.edge], 'deepnest': [T.nosk, 'In game, Deepnest\'s ambience is the Nosk theme.'],
    'the-hive': [T.hive, 'The Hive\'s ambience isn\'t on an album — this is its boss theme.'],
    'howling-cliffs': [T.enter, 'The Cliffs have no track of their own.'],
    'queens-gardens': [T.gardens], 'the-abyss': [T.vessel, 'In game, the Abyss uses the Broken Vessel theme.'],
    'white-palace': [T.palace], 'godhome': [T.godhome]
  };
  function track(region) { var r = REGION[region] || [T.enter]; return { title: r[0][0], id: r[0][1], uri: 'spotify:track:' + r[0][1], url: 'https://open.spotify.com/track/' + r[0][1], note: r[1] || '' }; }

  function init(store, mount, _audio, toast) {
    var I = root.HK.Icons, DATA = root.HK.DATA;
    var ctrl = null, apiState = 'loading', loaded = null, playing = false, ctxRegion = store.get().currentRegion;
    function music() { return store.get().music || {}; }
    function follow() { return music().follow !== false; }
    function region() { return follow() ? ctxRegion : (music().region || ctxRegion); }
    function regionName(id) { var r = DATA.REGIONS.filter(function (x) { return x.id === id; })[0]; return r ? r.name.replace(" & King's Pass", '').replace(' & Colosseum', '') : id; }

    mount.innerHTML =
      '<div class="pl-head"><span class="pl-ico" aria-hidden="true">' + I.svg('note') + '</span><div class="pl-meta"><b class="pl-title"></b><span class="pl-sub"></span></div>' +
        '<button class="icon-btn pl-follow" data-music="follow" title="Follow the region on screen" aria-label="Follow region">' + I.svg('follow') + '</button>' +
        '<button class="icon-btn pl-close" data-music="close" aria-label="Close player">' + I.svg('close') + '</button></div>' +
      '<div class="pl-sdk"><button class="btn small pl-toggle" data-music="toggle" aria-label="Play or pause">' + I.svg('play') + '</button>' +
        '<input class="pl-vol" type="range" min="0" max="1" step="0.05" aria-label="Volume"><span class="pl-sdk-msg muted small">Full track · your Spotify account</span></div>' +
      '<div class="pl-embed"><div id="spotifyEmbed"></div><a class="pl-fallback" target="_blank" rel="noopener"></a></div>' +
      '<button class="pl-connect link-btn small" data-music="connect-go">♫ Connect Spotify for full tracks →</button>';
    var titleEl = mount.querySelector('.pl-title'), subEl = mount.querySelector('.pl-sub'), fb = mount.querySelector('.pl-fallback');

    /* ---------- optional: connected Spotify account (Web Playback SDK, PKCE) ---------- */
    var LS = 'hk-companion-spotify', PK = 'hk-companion-spotify-pkce';
    var SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';
    function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
    function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* noop */ } }
    var sp = lsGet(LS) || {};
    var sdk = { status: sp.refresh ? 'connecting' : 'off', player: null, device: null, msg: '', uri: null, loading: false };
    var changeCb = null;
    function redirectUri() { return location.origin + location.pathname; }
    function useSdk() { return sdk.status === 'ready'; }
    function notify() { render(); if (changeCb) try { changeCb(); } catch (e) { /* noop */ } }
    function rand(n) { var a = new Uint8Array(n), c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', o = ''; crypto.getRandomValues(a); for (var i = 0; i < n; i++) o += c[a[i] % 62]; return o; }
    function b64url(buf) { var b = ''; new Uint8Array(buf).forEach(function (x) { b += String.fromCharCode(x); }); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
    function form(o) { return Object.keys(o).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&'); }
    function tokenCall(body) {
      return fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error_description || j.error || ('HTTP ' + r.status)); return j; }); });
    }
    function saveTokens(j) {
      sp = { clientId: sp.clientId, access: j.access_token, refresh: j.refresh_token || sp.refresh, exp: Date.now() + (j.expires_in || 3600) * 1000 };
      lsSet(LS, sp);
    }
    function getToken() {
      if (sp.access && Date.now() < (sp.exp || 0) - 60000) return Promise.resolve(sp.access);
      if (!sp.refresh) return Promise.reject(new Error('not connected'));
      return tokenCall({ grant_type: 'refresh_token', refresh_token: sp.refresh, client_id: sp.clientId }).then(function (j) { saveTokens(j); return sp.access; });
    }
    function api(method, path, body) {
      return getToken().then(function (tok) {
        return fetch('https://api.spotify.com/v1' + path, { method: method, headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      }).then(function (r) { if (!r.ok && r.status !== 204) throw new Error('Spotify API ' + r.status); return r; });
    }
    function sdkPlay(uri) {
      if (!useSdk()) return;
      sdk.uri = uri;
      api('PUT', '/me/player/play?device_id=' + encodeURIComponent(sdk.device), { uris: [uri] })
        .then(function () { if (music().loop !== false) return api('PUT', '/me/player/repeat?state=track&device_id=' + encodeURIComponent(sdk.device)).catch(function () { /* noop */ }); })
        .catch(function (e) { sdk.msg = 'Could not start playback: ' + e.message; notify(); });
    }
    function startSdk() {
      if (sdk.loading || !sp.refresh) return; sdk.loading = true;
      root.onSpotifyWebPlaybackSDKReady = function () {
        var P = new root.Spotify.Player({ name: 'Hallownest Companion', volume: music().volume == null ? 0.4 : music().volume, getOAuthToken: function (cb) { getToken().then(cb, function () { /* noop */ }); } });
        sdk.player = P;
        P.addListener('ready', function (e) { sdk.device = e.device_id; sdk.status = 'ready'; sdk.msg = ''; try { if (ctrl && ctrl.pause) ctrl.pause(); } catch (x) { /* noop */ } notify(); });
        P.addListener('not_ready', function () { sdk.status = 'connecting'; notify(); });
        P.addListener('player_state_changed', function (st) { var p = !!(st && !st.paused); if (p !== playing) { playing = p; notify(); } });
        P.addListener('initialization_error', function () { sdk.status = 'error'; sdk.msg = 'This browser can\'t run Spotify\'s full player (common on phones). Using the embedded player instead.'; notify(); });
        P.addListener('account_error', function () { sdk.status = 'error'; sdk.msg = 'Full-track playback needs Spotify Premium. Using the embedded player instead.'; notify(); });
        P.addListener('authentication_error', function () { sdk.status = 'error'; sdk.msg = 'Spotify login expired — reconnect below.'; notify(); });
        P.addListener('playback_error', function (e) { sdk.msg = 'Playback error: ' + ((e && e.message) || 'unknown'); notify(); });
        P.connect();
      };
      var sc = document.createElement('script'); sc.src = 'https://sdk.scdn.co/spotify-player.js'; sc.async = true;
      sc.onerror = function () { sdk.status = 'error'; sdk.msg = 'Could not load Spotify\'s player script.'; notify(); };
      document.head.appendChild(sc);
    }
    function connect(clientId) {
      clientId = String(clientId || '').trim();
      if (!/^[0-9a-f]{32}$/i.test(clientId)) return 'The Client ID is 32 letters/numbers (copy it from your app in the Spotify dashboard).';
      if (!(root.crypto && root.crypto.subtle)) return 'This page must be opened over https to log in to Spotify.';
      var verifier = rand(64), state = rand(16);
      lsSet(PK, { v: verifier, state: state, clientId: clientId });
      root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(function (h) {
        location.href = 'https://accounts.spotify.com/authorize?' + form({ response_type: 'code', client_id: clientId, scope: SCOPES, redirect_uri: redirectUri(), state: state, code_challenge_method: 'S256', code_challenge: b64url(h) });
      });
      return '';
    }
    function disconnect() {
      try { if (sdk.player) sdk.player.disconnect(); } catch (e) { /* noop */ }
      sp = { clientId: sp.clientId }; lsSet(LS, sp); sdk.player = null; sdk.device = null; sdk.status = 'off'; sdk.msg = ''; sdk.uri = null; sdk.loading = false; playing = false; notify();
    }
    (function handleRedirect() {
      var q = new URLSearchParams(location.search); if (!q.has('code') && !q.has('error')) return;
      var pk = lsGet(PK); if (!pk || pk.state !== q.get('state')) return;
      lsSet(PK, null);
      var code = q.get('code'), err = q.get('error');
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* noop */ }
      root.location.hash = '#/soundtrack';
      if (err || !code) { sdk.status = 'error'; sdk.msg = 'Spotify login was cancelled (' + (err || 'no code') + ').'; return; }
      sp = { clientId: pk.clientId }; sdk.status = 'connecting';
      tokenCall({ grant_type: 'authorization_code', code: code, redirect_uri: redirectUri(), client_id: pk.clientId, code_verifier: pk.v })
        .then(function (j) { saveTokens(j); if (toast) toast('Spotify connected'); startSdk(); notify(); })
        .catch(function (e) { sdk.status = 'error'; sdk.msg = 'Spotify login failed: ' + e.message + '. Check that the Redirect URI in your Spotify app matches exactly.'; notify(); });
    })();

    function render() {
      var r = region(), t = track(r);
      mount.classList.toggle('sdk-on', useSdk());
      mount.classList.toggle('sdk-off', sdk.status === 'off');
      var tg = mount.querySelector('.pl-toggle'); if (tg) tg.innerHTML = I.svg(playing ? 'pause' : 'play');
      var vol = mount.querySelector('.pl-vol'); if (vol && document.activeElement !== vol) vol.value = music().volume == null ? 0.4 : music().volume;
      titleEl.textContent = regionName(r);
      subEl.textContent = '♫ ' + t.title + (playing ? ' · playing' : '');
      subEl.title = t.note;
      mount.querySelector('.pl-follow').classList.toggle('on', follow());
      mount.querySelector('.pl-follow').setAttribute('aria-pressed', String(follow()));
      mount.setAttribute('data-uri', t.uri);
      mount.classList.toggle('no-api', apiState === 'failed');
      fb.href = t.url; fb.textContent = 'Open “' + t.title + '” on Spotify ↗';
    }
    function load() {
      var t = track(region());
      render();
      if (useSdk()) { if (playing && sdk.uri !== t.uri) sdkPlay(t.uri); return; }
      if (!ctrl || loaded === t.uri) return;
      var wasPlaying = playing;
      loaded = t.uri;
      try { ctrl.loadUri(t.uri); if (wasPlaying) setTimeout(function () { try { ctrl.play(); } catch (e) { /* noop */ } }, 600); } catch (e) { /* noop */ }
    }
    // Spotify iFrame API
    var prev = root.onSpotifyIframeApiReady;
    root.onSpotifyIframeApiReady = function (IFrameAPI) {
      if (prev) try { prev(IFrameAPI); } catch (e) { /* noop */ }
      var t = track(region());
      IFrameAPI.createController(document.getElementById('spotifyEmbed'), { uri: t.uri, width: '100%', height: 80 }, function (c) {
        ctrl = c; loaded = t.uri; apiState = 'ready';
        c.addListener('playback_update', function (e) { var p = !!(e && e.data && !e.data.isPaused); if (p !== playing) { playing = p; render(); } });
        render();
      });
    };
    var s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
    s.onerror = function () { apiState = 'failed'; render(); };
    document.head.appendChild(s);
    setTimeout(function () { if (apiState === 'loading') { apiState = 'failed'; render(); } }, 12000);

    mount.addEventListener('click', function (e) {
      var b = e.target.closest('[data-music]'); if (!b) return;
      var a = b.getAttribute('data-music');
      if (a === 'follow') { store.setMusic({ follow: !follow(), region: region() }); load(); }
      if (a === 'close') document.body.classList.remove('player-open');
      if (a === 'connect-go') { location.hash = '#/soundtrack'; document.body.classList.remove('player-open'); }
      if (a === 'toggle' && useSdk()) {
        var t = track(region());
        try { sdk.player.activateElement(); } catch (x) { /* noop */ }
        if (sdk.uri !== t.uri) sdkPlay(t.uri); else sdk.player.togglePlay();
      }
    });
    mount.addEventListener('input', function (e) { if (e.target.classList.contains('pl-vol')) { var v = Number(e.target.value); store.setMusic({ volume: v }); if (sdk.player) try { sdk.player.setVolume(v); } catch (x) { /* noop */ } } });
    if (sp.refresh) startSdk();
    render();

    return {
      setContext: function (r) { if (!r) return; ctxRegion = r; if (follow()) load(); else render(); },
      play: function (r) {
        store.setMusic({ follow: false, region: r }); document.body.classList.add('player-open');
        if (useSdk()) { try { sdk.player.activateElement(); } catch (x) { /* noop */ } render(); sdkPlay(track(r).uri); return; }
        load(); if (ctrl) setTimeout(function () { try { ctrl.play(); } catch (e) { /* noop */ } }, 500);
      },
      state: function () { var t = track(region()); return { region: region(), track: t.title, uri: t.uri, playing: playing, api: apiState, spotify: sdk.status }; },
      spotify: function () { return { status: sdk.status, msg: sdk.msg, connected: !!sp.refresh, clientId: sp.clientId || '', redirectUri: redirectUri() }; },
      connect: connect, disconnect: disconnect, onChange: function (fn) { changeCb = fn; },
      render: render,
      track: track, REGION: REGION, ALBUM: ALBUM
    };
  }
  root.HK = root.HK || {};
  root.HK.Music = { init: init, track: track, ALBUM: ALBUM };
})(typeof window !== 'undefined' ? window : globalThis);
