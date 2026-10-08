/*
 * Hollow Knight Companion — BACKGROUND CAROUSEL
 * Crossfades through the artworks in assets/bg/ every INTERVAL seconds (fan art / promo art — see README credits).
 */
(function () {
  'use strict';
  var INTERVAL = 20; // seconds (15–30 works well)
  var FILES = []; for (var i = 1; i <= 9; i++) FILES.push('assets/bg/bg-0' + i + '.jpg');
  function start() {
    var host = document.getElementById('backdrop'); if (!host) return;
    host.innerHTML = '<div class="bg-slide on"></div><div class="bg-slide"></div>';
    var slides = host.querySelectorAll('.bg-slide'), cur = 0, front = 0, timer = null;
    function set(el, n) { el.style.backgroundImage = 'url("' + FILES[n] + '")'; }
    function preload(n) { var im = new Image(); im.src = FILES[n]; }
    set(slides[0], 0); preload(1);
    function next() {
      cur = (cur + 1) % FILES.length;
      var back = 1 - front;
      set(slides[back], cur);
      slides[back].classList.add('on'); slides[front].classList.remove('on');
      front = back; preload((cur + 1) % FILES.length);
      host.setAttribute('data-bg', String(cur));
    }
    function run() { clearInterval(timer); timer = setInterval(next, INTERVAL * 1000); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else run(); });
    run();
    window.HKBg = { next: next, index: function () { return cur; }, interval: INTERVAL };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
