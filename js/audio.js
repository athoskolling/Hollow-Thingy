/*
 * Hollow Knight Companion — REGION SOUNDTRACK (official, via Spotify)
 * ---------------------------------------------------------------
 * Each region plays its track from Christopher Larkin's official Hollow Knight soundtrack,
 * streamed by Spotify's own embedded player (nothing is downloaded or hosted here).
 * Full tracks play when you're logged into Spotify in this browser; otherwise Spotify plays previews.
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
      '<div class="pl-embed"><div id="spotifyEmbed"></div><a class="pl-fallback" target="_blank" rel="noopener"></a></div>';
    var titleEl = mount.querySelector('.pl-title'), subEl = mount.querySelector('.pl-sub'), fb = mount.querySelector('.pl-fallback');

    function render() {
      var r = region(), t = track(r);
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
    });
    render();

    return {
      setContext: function (r) { if (!r) return; ctxRegion = r; if (follow()) load(); else render(); },
      play: function (r) { store.setMusic({ follow: false, region: r }); load(); document.body.classList.add('player-open'); if (ctrl) setTimeout(function () { try { ctrl.play(); } catch (e) { /* noop */ } }, 500); },
      state: function () { var t = track(region()); return { region: region(), track: t.title, uri: t.uri, playing: playing, api: apiState }; },
      render: render,
      track: track, REGION: REGION, ALBUM: ALBUM
    };
  }
  root.HK = root.HK || {};
  root.HK.Music = { init: init, track: track, ALBUM: ALBUM };
})(typeof window !== 'undefined' ? window : globalThis);
