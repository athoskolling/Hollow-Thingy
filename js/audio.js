/*
 * Hollow Knight Companion — REGION SOUNDTRACK
 * ---------------------------------------------------------------
 * Every region has its own ambience. Where each track comes from (first match wins):
 *   1. a file YOU loaded for that region on the Soundtrack page (kept in this browser's IndexedDB);
 *   2. a file you loaded as "All regions";
 *   3. assets/audio/regions/<region-id>.mp3 next to the site (your own local copy; git-ignored);
 *   4. assets/audio/ambience.mp3 (your own local copy; git-ignored);
 *   5. an ORIGINAL ambience generated live in the browser (Web Audio) — a different
 *      scale, tempo, timbre and texture per region (rain in the City, wind on the cliffs, drips in the
 *      Waterways…). Nothing from the official soundtrack is included, downloaded or redistributed.
 * Browsers block autoplay: playback only starts after a click.
 */
(function (root) {
  'use strict';

  /* ============================== region profiles ============================== */
  var SC = {
    aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
    major: [0, 2, 4, 5, 7, 9, 11], harmonic: [0, 2, 3, 5, 7, 8, 11], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10], whole: [0, 2, 4, 6, 8, 10], locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  // root = MIDI note · step = seconds per step · chord = steps per chord · prog = scale degrees
  var PROFILES = {
    'dirtmouth':            { mood: 'Lonely town, cold wind', root: 50, scale: SC.aeolian, step: 0.9, chord: 8, prog: [0, 5, 3, 4], pad: ['triangle', 0.05, 900], bell: ['sine', 0.11, 2, 3.2, 0.42], drone: 0.03, noise: ['wind', 0.025] },
    'forgotten-crossroads': { mood: 'Old roads, quiet drips', root: 48, scale: SC.dorian, step: 0.8, chord: 8, prog: [0, 3, 6, 4], pad: ['triangle', 0.05, 1000], bell: ['sine', 0.1, 2, 2.8, 0.45], drone: 0.035, extra: 'drip' },
    'greenpath':            { mood: 'Lush moss, light and alive', root: 55, scale: SC.lydian, step: 0.45, chord: 16, prog: [0, 4, 1, 5], pad: ['sine', 0.045, 1400], bell: ['triangle', 0.08, 2, 1.6, 0.6], drone: 0.02, noise: ['water', 0.015] },
    'fungal-wastes':        { mood: 'Bubbling spores', root: 45, scale: SC.phrygian, step: 0.5, chord: 12, prog: [0, 1, 3, 1], pad: ['sawtooth', 0.018, 650], bell: ['triangle', 0.09, 1, 1.1, 0.5], drone: 0.04, extra: 'bubble' },
    'city-of-tears':        { mood: 'Endless rain on blue spires', root: 52, scale: SC.harmonic, step: 0.75, chord: 8, prog: [0, 5, 3, 4], pad: ['triangle', 0.06, 1200], bell: ['sine', 0.1, 2, 3.6, 0.5], drone: 0.03, noise: ['rain', 0.05] },
    'crystal-peak':         { mood: 'Glittering crystal, mining echoes', root: 54, scale: SC.lydian, step: 0.32, chord: 16, prog: [0, 1, 4, 3], pad: ['sine', 0.045, 1800], bell: ['sine', 0.07, 3, 1.8, 0.62], drone: 0.02, extra: 'shimmer' },
    'resting-grounds':      { mood: 'Dreaming graves, soft choir', root: 46, scale: SC.aeolian, step: 1.0, chord: 8, prog: [0, 3, 5, 4], pad: ['sawtooth', 0.02, 700], bell: ['sine', 0.09, 2, 4, 0.33], drone: 0.03, choir: true },
    'royal-waterways':      { mood: 'Flowing sewers, echoing drops', root: 50, scale: SC.dorian, step: 0.7, chord: 8, prog: [0, 6, 3, 4], pad: ['triangle', 0.045, 800], bell: ['sine', 0.08, 2, 2.6, 0.4], drone: 0.035, noise: ['water', 0.04], extra: 'drip' },
    'fog-canyon':           { mood: 'Hazy jelly lights', root: 60, scale: SC.whole, step: 0.6, chord: 12, prog: [0, 1, 2, 1], pad: ['sine', 0.05, 1300], bell: ['sine', 0.07, 1, 3, 0.45], drone: 0.02, wobble: true, extra: 'shimmer' },
    'ancient-basin':        { mood: 'Deep, ancient and still', root: 47, scale: SC.phrygian, step: 1.1, chord: 8, prog: [0, 1, 0, 6], pad: ['triangle', 0.045, 600], bell: ['sine', 0.08, 2, 4, 0.3], drone: 0.06 },
    'kingdoms-edge':        { mood: 'Falling ash, a howling edge', root: 52, scale: SC.aeolian, step: 0.85, chord: 8, prog: [0, 6, 5, 4], pad: ['triangle', 0.045, 900], bell: ['sine', 0.08, 2, 3.4, 0.38], drone: 0.03, noise: ['wind', 0.05] },
    'deepnest':             { mood: 'Dark tunnels, skittering', root: 37, scale: SC.phrygian, step: 0.7, chord: 8, prog: [0, 1, 0, 1], pad: ['sawtooth', 0.02, 450], bell: ['sine', 0.07, 2, 2.2, 0.3], drone: 0.06, extra: 'click' },
    'the-hive':             { mood: 'Golden honey, a constant hum', root: 57, scale: SC.penta, step: 0.4, chord: 16, prog: [0, 3, 1, 4], pad: ['triangle', 0.04, 1100], bell: ['triangle', 0.07, 2, 1.2, 0.55], drone: 0.02, noise: ['buzz', 0.02] },
    'howling-cliffs':       { mood: 'Open sky, strong wind', root: 43, scale: SC.aeolian, step: 1.1, chord: 8, prog: [0, 3, 4, 3], pad: ['sine', 0.05, 900], bell: ['sine', 0.08, 2, 3.6, 0.3], drone: 0.03, noise: ['wind', 0.07] },
    'queens-gardens':       { mood: 'Overgrown and graceful', root: 53, scale: SC.dorian, step: 0.42, chord: 16, prog: [0, 3, 4, 6], pad: ['sine', 0.045, 1300], bell: ['triangle', 0.08, 2, 1.5, 0.55], drone: 0.02, noise: ['water', 0.012] },
    'the-abyss':            { mood: 'Void. Almost nothing.', root: 36, scale: SC.locrian, step: 1.6, chord: 6, prog: [0, 1], pad: ['sine', 0.04, 300], bell: ['sine', 0.06, 1, 5, 0.18], drone: 0.08, noise: ['deep', 0.05] },
    'white-palace':         { mood: 'A pale music box', root: 64, scale: SC.major, step: 0.28, chord: 16, prog: [0, 5, 3, 4], pad: ['sine', 0.035, 2000], bell: ['triangle', 0.07, 2, 1.0, 0.0], drone: 0.015, arp: true },
    'godhome':              { mood: 'Golden, radiant halls', root: 50, scale: SC.lydian, step: 0.7, chord: 8, prog: [0, 4, 5, 1], pad: ['sawtooth', 0.02, 1500], bell: ['sine', 0.09, 2, 3, 0.45], drone: 0.03, choir: true, extra: 'shimmer' }
  };

  /* ============================== generative engine ============================== */
  function Gen() {
    var ac = null, master, comp, verb, verbIn, noiseBuf, voice = null, timer = null, vol = 0.4;
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function impulse(sec, decay) {
      var len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
      for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
      return b;
    }
    function ensure() {
      if (ac) return ac;
      var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
      try { ac = new C(); } catch (e) { return null; }
      master = ac.createGain(); master.gain.value = vol;
      comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      master.connect(comp); comp.connect(ac.destination);
      verb = ac.createConvolver(); verb.buffer = impulse(3.8, 2.4);
      verbIn = ac.createGain(); verbIn.gain.value = 1; verbIn.connect(verb); verb.connect(master);
      var len = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      var nd = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
      return ac;
    }
    function scaleNote(p, deg, oct) {
      var n = p.scale.length, o = Math.floor(deg / n); deg = ((deg % n) + n) % n;
      return p.root + p.scale[deg] + 12 * (o + (oct || 0));
    }
    function env(g, t, a, peak, d, rel) {
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
      if (d) g.gain.setTargetAtTime(0.0001, t + a + d, rel || 0.6);
    }
    function makeVoice(id) {
      var p = PROFILES[id] || PROFILES['forgotten-crossroads'];
      var v = { id: id, p: p, bus: ac.createGain(), send: ac.createGain(), step: 0, next: ac.currentTime + 0.1, pads: [], persist: [], motif: [], rnd: rng(id) };
      v.bus.gain.value = 0.0001; v.bus.connect(master); v.bus.connect(v.send); v.send.gain.value = 0.55; v.send.connect(verbIn);
      for (var i = 0; i < 6; i++) v.motif.push(Math.floor(v.rnd() * p.scale.length * 1.6));
      // drone
      if (p.drone) {
        [0, 7].forEach(function (iv, k) {
          var o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
          o.type = 'sine'; o.frequency.value = mtof(p.root - 12 + iv); f.type = 'lowpass'; f.frequency.value = 400;
          g.gain.value = p.drone * (k ? 0.45 : 1); o.connect(f); f.connect(g); g.connect(v.bus); o.start(); v.persist.push(o);
          var l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 0.05 + k * 0.03; lg.gain.value = p.drone * 0.5; l.connect(lg); lg.connect(g.gain); l.start(); v.persist.push(l);
        });
      }
      // noise textures
      if (p.noise) addNoise(v, p.noise[0], p.noise[1]);
      return v;
    }
    function addNoise(v, kind, level) {
      if (kind === 'buzz') {
        var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
        o.type = 'sawtooth'; o.frequency.value = 110; f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = level;
        l.frequency.value = 23; lg.gain.value = level * 0.6; l.connect(lg); lg.connect(g.gain);
        o.connect(f); f.connect(g); g.connect(v.bus); o.start(); l.start(); v.persist.push(o, l); return;
      }
      var src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      var flt = ac.createBiquadFilter(), gg = ac.createGain(); gg.gain.value = level;
      if (kind === 'rain') { flt.type = 'highpass'; flt.frequency.value = 1400; var f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 7000; src.connect(flt); flt.connect(f2); f2.connect(gg); }
      else if (kind === 'wind') {
        flt.type = 'bandpass'; flt.Q.value = 1.4; flt.frequency.value = 500; src.connect(flt); flt.connect(gg);
        var lf = ac.createOscillator(), lfg = ac.createGain(); lf.frequency.value = 0.07; lfg.gain.value = 320; lf.connect(lfg); lfg.connect(flt.frequency); lf.start(); v.persist.push(lf);
        var la = ac.createOscillator(), lag = ac.createGain(); la.frequency.value = 0.11; lag.gain.value = level * 0.6; la.connect(lag); lag.connect(gg.gain); la.start(); v.persist.push(la);
      }
      else if (kind === 'water') { flt.type = 'lowpass'; flt.frequency.value = 650; src.connect(flt); flt.connect(gg);
        var lw = ac.createOscillator(), lwg = ac.createGain(); lw.frequency.value = 0.3; lwg.gain.value = level * 0.5; lw.connect(lwg); lwg.connect(gg.gain); lw.start(); v.persist.push(lw); }
      else { flt.type = 'lowpass'; flt.frequency.value = 140; src.connect(flt); flt.connect(gg); }
      gg.connect(v.bus); src.start(); v.persist.push(src);
    }
    function rng(seed) { var h = 7; for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return function () { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return (h % 100000) / 100000; }; }
    function pad(v, t, deg) {
      var p = v.p, dur = p.step * p.chord;
      v.pads.forEach(function (n) { try { n.g.gain.cancelScheduledValues(t); n.g.gain.setTargetAtTime(0.0001, t, 1.2); n.o.stop(t + 6); } catch (e) { /* noop */ } });
      v.pads = [];
      [0, 2, 4].forEach(function (iv, k) {
        var m = scaleNote(p, deg + iv, k === 0 ? -1 : 0);
        [0, 6].forEach(function (cents) {
          var o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
          o.type = p.pad[0]; o.frequency.value = mtof(m); o.detune.value = cents + (p.wobble ? 0 : 0);
          if (p.wobble) { var w = ac.createOscillator(), wg = ac.createGain(); w.frequency.value = 0.4 + k * 0.1; wg.gain.value = 14; w.connect(wg); wg.connect(o.detune); w.start(t); w.stop(t + dur + 7); }
          f.type = 'lowpass'; f.frequency.value = p.pad[2];
          o.connect(f); f.connect(g);
          if (p.choir) { var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 820; bp.Q.value = 4; g.connect(bp); var cg = ac.createGain(); cg.gain.value = 2.2; bp.connect(cg); cg.connect(v.bus); }
          g.connect(v.bus);
          env(g, t, 2.4, p.pad[1] / 2, 0); o.start(t); o.stop(t + dur + 8);
          v.pads.push({ o: o, g: g });
        });
      });
    }
    function bell(v, t, m, gainMul) {
      var p = v.p, b = p.bell, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.type = b[0]; o.frequency.value = mtof(m); o2.type = 'sine'; o2.frequency.value = mtof(m) * 2.76;
      g2.gain.value = 0.18; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(v.bus);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(b[1] * (gainMul || 1), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + b[3]);
      o.start(t); o2.start(t); o.stop(t + b[3] + 0.1); o2.stop(t + b[3] + 0.1);
    }
    function drip(v, t, hi) {
      var o = ac.createOscillator(), g = ac.createGain(), f0 = hi ? 2400 : 1500;
      o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.4, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(v.bus); o.start(t); o.stop(t + 0.15);
    }
    function click(v, t) {
      var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = 2000 + v.rnd() * 2500; f.Q.value = 6;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      s.connect(f); f.connect(g); g.connect(v.bus); s.start(t, v.rnd()); s.stop(t + 0.05);
    }
    function stepVoice(v, t) {
      var p = v.p, r = v.rnd;
      if (v.step % p.chord === 0) pad(v, t, p.prog[Math.floor(v.step / p.chord) % p.prog.length]);
      var chordDeg = p.prog[Math.floor(v.step / p.chord) % p.prog.length];
      if (p.arp) {
        var seq = [0, 2, 4, 7, 4, 2], d = chordDeg + seq[v.step % seq.length];
        bell(v, t, scaleNote(p, d, p.bell[2]), v.step % 4 === 0 ? 1.1 : 0.75);
      } else if (r() < p.bell[4]) {
        var mot = v.motif[(v.step + Math.floor(v.step / 16)) % v.motif.length];
        if (r() < 0.25) mot += Math.floor(r() * 3) - 1;
        bell(v, t + (r() < 0.2 ? p.step / 2 : 0), scaleNote(p, mot, p.bell[2]), 0.7 + r() * 0.4);
      }
      if (p.extra === 'drip' && r() < 0.18) drip(v, t + r() * p.step, r() < 0.4);
      if (p.extra === 'bubble' && r() < 0.35) { drip(v, t + r() * p.step * 0.5, false); if (r() < 0.5) drip(v, t + p.step * 0.6, false); }
      if (p.extra === 'shimmer' && r() < 0.3) bell(v, t + r() * p.step, scaleNote(p, Math.floor(r() * 7), 3), 0.35);
      if (p.extra === 'click' && r() < 0.25) { var n = 2 + Math.floor(r() * 4); for (var i = 0; i < n; i++) click(v, t + i * 0.045 + r() * 0.02); }
      if (p.noise && p.noise[0] === 'rain' && r() < 0.4) drip(v, t + r() * p.step, true);
      v.step++;
    }
    function tick() {
      if (!ac || !voice) return;
      while (voice.next < ac.currentTime + 0.6) { stepVoice(voice, voice.next); voice.next += voice.p.step; }
    }
    function stopVoice(v, fade) {
      if (!v) return;
      var t = ac.currentTime;
      v.bus.gain.cancelScheduledValues(t); v.bus.gain.setTargetAtTime(0.0001, t, fade / 4);
      setTimeout(function () { v.persist.concat(v.pads.map(function (x) { return x.o; })).forEach(function (n) { try { n.stop(); } catch (e) { /* noop */ } }); try { v.bus.disconnect(); v.send.disconnect(); } catch (e) { /* noop */ } }, fade * 1000 + 200);
    }
    return {
      supported: function () { return !!(root.AudioContext || root.webkitAudioContext); },
      unlock: function () { var a = ensure(); if (a && a.state === 'suspended') a.resume(); return !!a; },
      start: function (id) {
        if (!ensure()) return false;
        if (ac.state === 'suspended') ac.resume();
        if (voice && voice.id === id) return true;
        stopVoice(voice, 3);
        voice = makeVoice(id);
        voice.bus.gain.setTargetAtTime(1, ac.currentTime, 1.2);
        if (!timer) timer = setInterval(tick, 150);
        tick();
        return true;
      },
      stop: function () { if (voice) { stopVoice(voice, 0.8); voice = null; } if (timer) { clearInterval(timer); timer = null; } },
      setVolume: function (x, muted) { vol = muted ? 0 : x; if (master) master.gain.setTargetAtTime(Math.max(0.0001, vol), ac.currentTime, 0.1); },
      running: function () { return !!voice; },
      current: function () { return voice && voice.id; }
    };
  }

  /* ============================== IndexedDB (your files) ============================== */
  var DB_NAME = 'hk-companion-audio', STORE = 'tracks';
  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) { reject(new Error('IndexedDB not available')); return; }
      var rq;
      try { rq = root.indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
      rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE); };
      rq.onerror = function () { reject(rq.error); };
      rq.onsuccess = function () {
        var db = rq.result, tx = db.transaction(STORE, mode), st = tx.objectStore(STORE), out = fn(st);
        tx.oncomplete = function () { db.close(); resolve(out && out.result !== undefined ? out.result : out); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      };
    });
  }
  var Files = {
    all: function () {
      return new Promise(function (resolve) {
        var map = {};
        idb('readonly', function (st) {
          var c = st.openCursor();
          c.onsuccess = function () { var cur = c.result; if (cur) { map[cur.key] = cur.value; cur.continue(); } };
          return null;
        }).then(function () { resolve(map); }, function () { resolve(map); });
      });
    },
    put: function (key, file) { return idb('readwrite', function (st) { st.put({ name: file.name, type: file.type, size: file.size, blob: file }, key); return null; }); },
    del: function (key) { return idb('readwrite', function (st) { st.delete(key); return null; }); }
  };

  /* ============================== player ============================== */
  function init(store, mount, audio, toast, opts) {
    opts = opts || {};
    var I = root.HK.Icons, DATA = root.HK.DATA;
    var gen = Gen();
    var m = store.get().music;
    var userFiles = {}, userUrls = {}, missing = {};
    var st = { playing: false, source: null, region: null, label: '', startedAt: 0, error: null };
    var ctxRegion = store.get().currentRegion;
    audio.loop = !!m.loop; audio.volume = m.volume; audio.muted = !!m.muted;
    gen.setVolume(m.volume, m.muted);

    function regionName(id) { var r = DATA.REGIONS.filter(function (x) { return x.id === id; })[0]; return r ? r.name.replace(" & King's Pass", '').replace(' & Colosseum', '') : id; }
    function music() { return store.get().music; }
    function follow() { return music().follow !== false; }
    function targetRegion() { return follow() ? ctxRegion : (music().region || ctxRegion); }
    function refreshUrls() {
      Object.keys(userUrls).forEach(function (k) { try { URL.revokeObjectURL(userUrls[k]); } catch (e) { /* noop */ } });
      userUrls = {};
      Object.keys(userFiles).forEach(function (k) { if (userFiles[k] && userFiles[k].blob) userUrls[k] = URL.createObjectURL(userFiles[k].blob); });
    }
    function candidates(region) {
      var c = [];
      if (userUrls[region]) c.push({ url: userUrls[region], label: 'Your file · ' + userFiles[region].name, kind: 'user' });
      if (userUrls.__all) c.push({ url: userUrls.__all, label: 'Your file · ' + userFiles.__all.name, kind: 'user' });
      if (music().localFiles !== false) {
        c.push({ url: 'assets/audio/regions/' + region + '.mp3', label: 'Local file · regions/' + region + '.mp3', kind: 'local' });
        c.push({ url: 'assets/audio/ambience.mp3', label: 'Local file · ambience.mp3', kind: 'local' });
      }
      return c.filter(function (x) { return !missing[x.url]; });
    }
    function fadeAudio(to, ms, cb) {
      var from = audio.volume, t0 = performance.now();
      (function stepF() { var k = Math.min(1, (performance.now() - t0) / ms); audio.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(stepF); else if (cb) cb(); })();
    }
    var attempt = 0;
    function playRegion(region) {
      var my = ++attempt;
      st.region = region; st.error = null;
      var list = candidates(region);
      (function tryNext(i) {
        if (my !== attempt) return;
        if (i >= list.length) {
          audio.pause();
          if (gen.start(region)) { st.playing = true; st.source = 'gen'; st.label = 'Original ambience · ' + (PROFILES[region] || {}).mood; st.startedAt = Date.now(); }
          else { st.playing = false; st.error = 'nosupport'; toast('This browser cannot generate audio. Load your own file on the Soundtrack page.', 'warn'); }
          render(); return;
        }
        var c = list[i];
        gen.stop();
        var settled = false;
        var onErr = function () { if (settled) return; settled = true; cleanup(); if (c.kind === 'local') missing[c.url] = true; tryNext(i + 1); };
        var onOk = function () { if (settled) return; settled = true; cleanup(); st.playing = true; st.source = 'file'; st.label = c.label; st.startedAt = Date.now(); audio.volume = 0; fadeAudio(music().volume, 900); render(); };
        function cleanup() { audio.removeEventListener('error', onErr); audio.removeEventListener('playing', onOk); }
        audio.addEventListener('error', onErr); audio.addEventListener('playing', onOk);
        if (audio.getAttribute('src') !== c.url) { audio.src = c.url; }
        audio.loop = !!music().loop;
        var pr = audio.play();
        if (pr && pr.catch) pr.catch(function (err) { if (settled) return; if (err && err.name === 'NotAllowedError') { settled = true; cleanup(); st.playing = false; render(); } else if (err && err.name === 'AbortError') { /* superseded */ } else onErr(); });
      })(0);
    }
    function play() { gen.unlock(); playRegion(targetRegion()); render(); }
    function pause() { attempt++; audio.pause(); gen.stop(); st.playing = false; render(); }
    function setContext(regionId) {
      if (!regionId) return;
      ctxRegion = regionId;
      if (follow() && st.playing && st.region !== regionId) {
        if (st.source === 'file') fadeAudio(0, 600, function () { playRegion(regionId); }); else playRegion(regionId);
      } else render();
    }
    function cycle(dir) {
      var ids = DATA.REGIONS.map(function (r) { return r.id; });
      var cur = st.region || targetRegion(), idx = ids.indexOf(cur), nxt = ids[(idx + dir + ids.length) % ids.length];
      store.setMusic({ follow: false, region: nxt });
      if (st.playing) playRegion(nxt); else { st.region = nxt; render(); }
    }
    function fmtTime(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function progress() {
      if (st.source === 'file' && audio.duration && isFinite(audio.duration)) return { pos: audio.currentTime, dur: audio.duration };
      if (st.playing) return { pos: (Date.now() - st.startedAt) / 1000, dur: 0 };
      return { pos: 0, dur: 0 };
    }
    function render() {
      var mm = music(), region = st.region || targetRegion(), pr = progress(), theme = (DATA.REGIONS.filter(function (r) { return r.id === region; })[0] || {}).theme || 'crossroads';
      var sub = st.playing ? 'Playing · ' + st.label : (st.error === 'nosupport' ? 'Add your music' : 'Paused · click ▶ to awaken Hallownest');
      mount.setAttribute('data-theme', theme);
      mount.innerHTML =
        '<div class="pl-top"><div class="pl-art theme-' + theme + '" aria-hidden="true">' + I.svg('note') + (st.playing ? '<span class="pl-eq"><i></i><i></i><i></i></span>' : '') + '</div>' +
          '<div class="pl-meta"><b class="pl-title">' + regionName(region) + '</b><span class="pl-sub" aria-live="polite">' + sub.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></div>' +
          '<a class="icon-btn pl-lib" href="#/soundtrack" title="Soundtrack — your tracks per region" aria-label="Soundtrack settings">' + I.svg('list') + '</a></div>' +
        '<div class="pl-bar"><input type="range" min="0" max="' + (pr.dur || 1) + '" step="0.1" value="' + (pr.dur ? pr.pos : 0) + '" data-music="seek" aria-label="Position"' + (pr.dur ? '' : ' disabled') + '>' +
          '<span class="pl-time">' + fmtTime(pr.pos) + (pr.dur ? ' / ' + fmtTime(pr.dur) : (st.playing ? ' · live' : '')) + '</span></div>' +
        '<div class="pl-ctrl">' +
          '<button class="icon-btn' + (follow() ? ' on' : '') + '" data-music="follow" aria-pressed="' + follow() + '" title="Follow the region on screen" aria-label="Follow region">' + I.svg('follow') + '</button>' +
          '<button class="icon-btn" data-music="prev" aria-label="Previous region track">' + I.svg('prev') + '</button>' +
          '<button class="pl-play music-wake' + (st.playing ? ' is-playing' : '') + '" data-music="toggle" aria-label="' + (st.playing ? 'Pause music' : 'Play music') + '">' + I.svg(st.playing ? 'pause' : 'play') + '</button>' +
          '<button class="icon-btn" data-music="next" aria-label="Next region track">' + I.svg('next') + '</button>' +
          '<button class="icon-btn' + (mm.loop ? ' on' : '') + '" data-music="loop" aria-label="Loop" aria-pressed="' + !!mm.loop + '">' + I.svg('loop') + '</button>' +
        '</div>' +
        '<div class="pl-vol"><button class="icon-btn" data-music="mute" aria-label="' + (mm.muted ? 'Unmute' : 'Mute') + '">' + I.svg(mm.muted ? 'mute' : 'volume') + '</button>' +
          '<input type="range" min="0" max="1" step="0.05" value="' + mm.volume + '" data-music="volume" aria-label="Volume"></div>';
    }
    mount.addEventListener('click', function (e) {
      var b = e.target.closest('[data-music]'); if (!b || b.tagName === 'INPUT') return;
      var a = b.getAttribute('data-music');
      if (a === 'toggle') { if (st.playing) pause(); else play(); }
      if (a === 'mute') { var mu = !music().muted; audio.muted = mu; store.setMusic({ muted: mu }); gen.setVolume(music().volume, mu); render(); }
      if (a === 'loop') { audio.loop = !music().loop; store.setMusic({ loop: audio.loop }); render(); }
      if (a === 'follow') { var f = !follow(); store.setMusic({ follow: f }); if (f) setContext(ctxRegion); render(); }
      if (a === 'prev') cycle(-1);
      if (a === 'next') cycle(1);
    });
    mount.addEventListener('input', function (e) {
      var a = e.target.getAttribute('data-music');
      if (a === 'volume') {
        var vv = Number(e.target.value); audio.volume = vv; store.setMusic({ volume: vv });
        if (music().muted && vv > 0) { audio.muted = false; store.setMusic({ muted: false }); }
        gen.setVolume(vv, music().muted);
      }
      if (a === 'seek' && st.source === 'file') audio.currentTime = Number(e.target.value);
    });
    setInterval(function () {
      if (!st.playing) return;
      var t = mount.querySelector('.pl-time'), sk = mount.querySelector('[data-music=seek]'), pr = progress();
      if (t) t.textContent = fmtTime(pr.pos) + (pr.dur ? ' / ' + fmtTime(pr.dur) : ' · live');
      if (sk && pr.dur && document.activeElement !== sk) { sk.max = pr.dur; sk.value = pr.pos; sk.disabled = false; }
    }, 1000);
    audio.addEventListener('ended', function () { if (!audio.loop) { st.playing = false; render(); } });

    // load your files from IndexedDB
    var ready = Files.all().then(function (map) { userFiles = map; refreshUrls(); render(); return map; });
    render();

    var api = {
      play: play, pause: pause, render: render, setContext: setContext, ready: ready,
      PROFILES: PROFILES,
      state: function () { return { playing: st.playing, source: st.source, region: st.region, label: st.label }; },
      files: function () { return userFiles; },
      preview: function (region) { store.setMusic({ follow: false, region: region }); gen.unlock(); playRegion(region); },
      setFile: function (key, file) {
        return Files.put(key, file).then(function () { return Files.all(); }).then(function (map) {
          userFiles = map; refreshUrls(); if (st.playing && (key === st.region || key === '__all')) playRegion(st.region); render(); return map;
        });
      },
      removeFile: function (key) {
        return Files.del(key).then(function () { return Files.all(); }).then(function (map) {
          userFiles = map; refreshUrls(); if (st.playing && st.source === 'file') playRegion(st.region); render(); return map;
        });
      }
    };
    return api;
  }

  root.HK = root.HK || {};
  root.HK.Music = { init: init, PROFILES: PROFILES };
})(typeof window !== 'undefined' ? window : globalThis);
