/*
 * Hollow Knight Companion — AMBIENT MUSIC PLAYER
 * Plays YOUR OWN file at assets/audio/ambience.mp3 (not included — no official soundtrack is redistributed).
 * Browsers block autoplay, so playback only starts after a user click.
 */
(function (root) {
  'use strict';
  function init(store, mount, audio, toast) {
    var m = store.get().music;
    var available = null; // unknown until we try
    audio.loop = !!m.loop;
    audio.volume = m.volume;
    audio.muted = !!m.muted;

    function render() {
      var playing = !audio.paused;
      mount.innerHTML =
        '<button class="music-wake' + (playing ? ' is-playing' : '') + '" data-music="toggle" aria-label="' + (playing ? 'Pause music' : 'Play music') + '">' +
          (playing ? '❚❚ <span>Playing</span>' : (available === false ? '♫ <span>Add your music</span>' : '♫ <span>Click to awaken Hallownest</span>')) +
        '</button>' +
        '<div class="music-controls">' +
          '<button class="icon-btn" data-music="mute" aria-label="' + (audio.muted ? 'Unmute' : 'Mute') + '">' + (audio.muted ? '🔇' : '🔊') + '</button>' +
          '<input type="range" min="0" max="1" step="0.05" value="' + audio.volume + '" data-music="volume" aria-label="Volume">' +
          '<button class="icon-btn' + (audio.loop ? ' on' : '') + '" data-music="loop" aria-label="Loop" aria-pressed="' + audio.loop + '">⟲</button>' +
        '</div>';
    }
    function play() {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {
        available = false; render();
        toast('No music file found. Put your own file at assets/audio/ambience.mp3 (see README).', 'warn');
      });
    }
    audio.addEventListener('play', function () { available = true; render(); });
    audio.addEventListener('pause', render);
    audio.addEventListener('error', function () { available = false; render(); });

    mount.addEventListener('click', function (e) {
      var b = e.target.closest('[data-music]'); if (!b) return;
      var a = b.getAttribute('data-music');
      if (a === 'toggle') { if (audio.paused) play(); else audio.pause(); }
      if (a === 'mute') { audio.muted = !audio.muted; store.setMusic({ muted: audio.muted }); render(); }
      if (a === 'loop') { audio.loop = !audio.loop; store.setMusic({ loop: audio.loop }); render(); }
    });
    mount.addEventListener('input', function (e) {
      if (e.target.getAttribute('data-music') === 'volume') {
        audio.volume = Number(e.target.value); store.setMusic({ volume: audio.volume });
        if (audio.muted && audio.volume > 0) { audio.muted = false; store.setMusic({ muted: false }); }
      }
    });
    render();
    return { play: play, render: render };
  }
  root.HK = root.HK || {};
  root.HK.Music = { init: init };
})(typeof window !== 'undefined' ? window : globalThis);
