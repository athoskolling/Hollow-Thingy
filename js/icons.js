/*
 * Hollow Knight Companion — ICONS
 * Original line icons (24×24, stroke = currentColor). Drawn for this project; no game assets.
 */
(function (root) {
  'use strict';
  var P = {
    dashboard: 'M4 11 12 4l8 7M6 9.5V20h4.5v-5h3v5H18V9.5',
    map: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20',
    compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
    route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V11a3 3 0 0 1 3-3h4M18 9v4a3 3 0 0 1-3 3h-4',
    checklist: 'M9 6h11M9 12h11M9 18h11M4 5.5l1.2 1.2L7 4.8M4 11.5l1.2 1.2L7 10.8M4 17.5l1.2 1.2L7 16.8',
    save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
    geo: 'M12 3l7 4.5v9L12 21l-7-4.5v-9zM12 3v18M5 7.5l14 9M19 7.5l-14 9',
    charm: 'M12 3l2.4 5.6L20 9.5l-4.3 3.8 1.3 5.7L12 16l-5 3 1.3-5.7L4 9.5l5.6-.9z',
    wing: 'M4 18c2-6 6-10 15-13-2 4-4 6-7 7 2 0 4-.5 6-1.5-2 3.5-5 6-9 7.5 1.5-1 2.5-2 3-3.5C9 16 6.5 17.5 4 18z',
    nail: 'M5 19 16 8M14 6l4-2-2 4M7 15l2 2M4 20l2-2',
    mask: 'M7 4c-1.5 3-1 3-2.5 6C3.5 13 6 20 12 20s8.5-7 7.5-10C18 7 18.5 7 17 4c-1 2-3 3-5 3S8 6 7 4zM9.5 12.5v2M14.5 12.5v2',
    key: 'M8 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM11 11l9 0M17 11v3M20 11v2',
    essence: 'M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10zM12 11c1 1.3 1.8 2.3 1.8 3.4a1.8 1.8 0 0 1-3.6 0c0-1.1.8-2.1 1.8-3.4z',
    skull: 'M5 11a7 7 0 0 1 14 0v3l-2 1.5V19H7v-3.5L5 14zM9 12.5h.01M15 12.5h.01M5 7 3 3l4 2M19 7l2-4-4 2M10.5 19v-2M13.5 19v-2',
    ending: 'M12 4a8 8 0 1 0 6.5 12.7A6.5 6.5 0 0 1 12 4z',
    flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .1 1.6.8 2.6 2 3-.5-2.8 0-5.6.5-8z',
    flag: 'M5 21V4M5 4h11l-2 3.5L16 11H5',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1',
    chart: 'M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.2 2.5 1.2 2.5-2.3 1.6-.6 2.7-2.7-.6L12 21.5l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6L6 13 4.8 10.5l2.3-1.6.6-2.7 2.7.6z',
    note: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 20 20',
    play: 'M8 5v14l11-7z',
    pause: 'M8 5v14M16 5v14',
    prev: 'M18 6v12L9 12zM6 6v12',
    next: 'M6 6v12l9-6zM18 6v12',
    volume: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
    mute: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9.5l5 5M21 9.5l-5 5',
    loop: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
    follow: 'M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
    pin: 'M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
    chevron: 'M9 5l7 7-7 7',
    arrow: 'M4 12h15M14 7l5 5-5 5',
    lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 1v4M12 19v4M1 12h4M19 12h4',
    layers: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
    trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
    bench: 'M3 11h18M5 11V8h14v3M5 11v7M19 11v7M7 15h10',
    stag: 'M12 20v-6M8 14h8l-1.5-3h-5zM9.5 11 6 4M7.5 7.5 5 6.5M14.5 11 18 4M16.5 7.5 19 6.5',
    vendor: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2M10 13h4',
    npc: 'M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c.5-4 3.3-6 7-6s6.5 2 7 6',
    spring: 'M4 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5M4 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5M9 11c-1-1.5 1-2.5 0-4M13 11c-1-1.5 1-2.5 0-4M17 11c-1-1.5 1-2.5 0-4',
    tram: 'M6 5h12v10H6zM6 11h12M8 19l-2 2M16 19l2 2M9 15v4h6v-4M4 3h16',
    cornifer: 'M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6zM6 4a2 2 0 0 0-2 2v1h2M9 9h7M9 13h7M9 17h4',
    cocoon: 'M12 3c3 3 4 6 4 9.5a4 4 0 0 1-8 0C8 9 9 6 12 3zM8.5 15c-2 0-3.5 1-3.5 3a3 3 0 0 0 5.5 1.5M15.5 15c2 0 3.5 1 3.5 3a3 3 0 0 1-5.5 1.5',
    landmark: 'M4 20h16M6 20V10M18 20V10M10 20v-6h4v6M3 10l9-6 9 6z',
    root: 'M12 21v-8M12 13c-3 0-6-2-6-6 3 0 5 1.5 6 4 1-2.5 3-4 6-4 0 4-3 6-6 6zM12 17l-4 3M12 17l4 3',
    item: 'M12 3l6 9-6 9-6-9z',
    crystal: 'M12 2l4 6-4 14-4-14zM8 8h8M6 10l-3 3 4 6M18 10l3 3-4 6',
    spell: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7c2.5 2 3 5 1.5 7.5S8.5 15 8 12.5',
    ore: 'M5 15l3-7 6-3 5 4 1 6-6 4-6-1zM8 8l3 5 3-8M11 13l9 2M11 13l-2 6',
    vessel: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM8 15c1.5 1.5 6.5 1.5 8 0',
    notch: 'M12 3l9 9-9 9-9-9zM12 8l4 4-4 4-4-4z',
    dream: 'M12 3c-3 4-3 6-1 9-3-1-5-1-7 1 3 0 5 2 6 5 1-3 4-5 7-5-2-2-4-2-6-1 2-3 2-5 1-9z',
    grub: 'M8 10a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0zM10 12h.01M14 12h.01M10 16c1 .8 3 .8 4 0',
    egg: 'M12 3c4 0 6.5 6 6.5 10a6.5 6.5 0 0 1-13 0C5.5 9 8 3 12 3z',
    trial: 'M5 4l14 16M19 4 5 20M4 7l3-3M17 4l3 3M4 17l3 3M17 20l3-3',
    shuffle: 'M3 7h4l10 10h4M17 21l4-4-4-4M3 17h4l3-3M14 10l3-3h4M17 3l4 4-4 4',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    close: 'M6 6l12 12M18 6 6 18',
    menu: 'M4 7h16M4 12h16M4 17h16',
    quill: 'M20 4C12 5 7 10 5 19l2-1c1-3 3-5 6-6-1 0-2 0-3 .5C12 9 16 7 20 4z'
  };
  var FILLED = { play: 1 };
  function svg(name, cls) {
    var d = P[name] || P.item;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + d + '"' +
      (FILLED[name] ? ' fill="currentColor" stroke="none"' : ' fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"') + '/></svg>';
  }
  /* item type → icon */
  var TYPE_ICON = { ability: 'wing', spell: 'spell', nail: 'nail', nailart: 'trial', mask: 'mask', vessel: 'vessel', charm: 'charm', notch: 'notch',
    ore: 'ore', key: 'key', boss: 'skull', warrior: 'skull', dreamboss: 'skull', dreamer: 'dream', dream: 'dream', colosseum: 'flag', grimm: 'flame',
    godhome: 'sun', ending: 'ending', root: 'root', item: 'egg', npc: 'npc', access: 'landmark', derived: 'check' };
  root.HK = root.HK || {};
  root.HK.Icons = { PATHS: P, svg: svg, TYPE_ICON: TYPE_ICON, forType: function (t) { return TYPE_ICON[t] || 'item'; } };
})(typeof window !== 'undefined' ? window : globalThis);
