"""Functional browser tests (Playwright/Chromium).
Usage: python3 tests/e2e_functional.py [base_url]
Checks: console, checkboxes, localStorage, reset, JSON import/export, search, filters, Save Editor sync,
dependencies/warnings, Next Objective, regions, Geo/Nail/Ore, Essence, Masks/Vessels, Charms, endings,
Void Heart lock, HK save import preview/apply, music (missing file), mobile menu."""
import sys, os, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
HERE = os.path.dirname(os.path.abspath(__file__))
SAVE = os.path.join(HERE, 'fixtures', 'user-test.dat')
results, errors = [], []

def check(name, cond, info=''):
    results.append((name, bool(cond), info))
    print(('PASS ' if cond else 'FAIL ') + name + (('  — ' + str(info)) if info and not cond else ''))

def js(page, code):
    return page.evaluate(code)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append('console: ' + m.text))
    page.on('dialog', lambda d: d.accept())
    page.goto(BASE); page.wait_for_timeout(500)
    js(page, "localStorage.clear()"); page.reload(); page.wait_for_timeout(400)

    # --- audit & initial state
    check('audit passes in browser', js(page, "HKApp.runAudit().errors.length === 0 && HKApp.runAudit().total === 112"))
    check('initial completion = 7% (cloak2+claw2+VS1+dive1+SM1)', js(page, "HKApp.engine.completion().value") == 7, js(page, "HKApp.engine.completion().value"))
    check('next objective is Crystal Heart', page.locator('.obj-name').inner_text().startswith('Crystal Heart'))
    check('Void Heart lock banner visible', page.locator('text=VOID HEART — NÃO PEGUE AINDA').first.is_visible())

    # --- checkbox from dashboard "while here" + persistence
    page.locator('#item-descending-dark input.chk').first.click(); page.wait_for_timeout(150)
    check('checkbox marks Descending Dark', js(page, "HKApp.engine.isDone('descending-dark')"))
    stored = json.loads(js(page, "localStorage.getItem('hk-companion-state')"))
    check('localStorage persisted check', stored['checks'].get('descending-dark') is True)
    page.reload(); page.wait_for_timeout(300)
    check('state survives reload', js(page, "HKApp.engine.isDone('descending-dark')"))

    # --- Mark done objective -> next objective changes
    page.click('.obj-actions [data-action=toggle]'); page.wait_for_timeout(150)
    check('MARK DONE records Crystal Heart (+2%)', js(page, "HKApp.engine.isDone('crystal-heart') && HKApp.engine.completion().value === 10"))
    nxt = page.locator('.obj-name').inner_text()
    check('next objective moved on after Crystal Heart', not nxt.startswith('Crystal Heart'), nxt)

    # --- region selector influences "while you're here"
    page.select_option('select[data-action=region]', 'royal-waterways'); page.wait_for_timeout(200)
    check('current region stored', js(page, "HKApp.store.get().currentRegion") == 'royal-waterways')

    # --- Save editor single-source sync
    page.click('.update-btn'); page.wait_for_timeout(200)
    check('editor opens', page.locator('#modal').is_visible())
    ed_ch = page.locator('#modal .ed-toggle:has-text("Crystal Heart") input')
    check('editor shows Crystal Heart checked (sync from checklist)', ed_ch.is_checked())
    page.locator('#modal .ed-toggle:has-text("Monarch Wings") input').click(); page.wait_for_timeout(150)
    check('editor → Monarch Wings recorded', js(page, "HKApp.engine.isDone('monarch-wings')"))
    page.select_option('#modal select[data-action=spell][data-a=vengeful-spirit]', '2'); page.wait_for_timeout(150)
    check('spell select sets Shade Soul + Vengeful', js(page, "HKApp.engine.isDone('shade-soul') && HKApp.engine.isDone('vengeful-spirit')"))
    page.select_option('#modal select[data-action=nail]', '2'); page.wait_for_timeout(150)
    check('nail select → Channelled (nail-1,nail-2)', js(page, "HKApp.engine.nailLevel()") == 2)
    page.keyboard.press('Escape')

    # --- warnings (out of order): Monarch Wings without Broken Vessel; ore spent > collected
    page.goto(BASE + '#/dashboard'); page.wait_for_timeout(200)
    check('inconsistency warning shown', page.locator('text=Seu save indica que talvez algum requisito anterior não tenha sido registrado').first.is_visible())
    check('Monarch Wings not recommended anymore', 'Monarch Wings' not in page.locator('.obj-name').inner_text())
    check('ore inconsistency detected', js(page, "HKApp.engine.ore().inconsistent"))
    page.click('[data-action=mark-all-implied]'); page.wait_for_timeout(200)
    check('mark implied → Broken Vessel & Elegant Key done', js(page, "HKApp.engine.isDone('broken-vessel') && HKApp.engine.isDone('elegant-key') && HKApp.engine.isDone('hornet-protector')"))

    # --- requirement chips open the item
    page.goto(BASE + '#/checklist'); page.wait_for_timeout(200)
    page.click('#item-kings-brand .item-title'); page.wait_for_timeout(350)
    check('item expands with details', page.locator('#item-kings-brand .facts').is_visible())
    page.click('#item-kings-brand .facts [data-action=open-item][data-id=hornet-sentinel]'); page.wait_for_timeout(200)
    check('requirement chip opens Hornet Sentinel', page.locator('#modalTitle').inner_text() == 'Hornet Sentinel')
    page.keyboard.press('Escape')

    # --- filters & local search
    page.click('.fchip[data-f=charm]'); page.wait_for_timeout(150)
    n = page.locator('.item').count()
    check('CHARMS filter shows charms+notches only', n == js(page, "HK.DATA.ITEMS.filter(i=>i.type==='charm'||i.type==='notch').length"), n)
    page.click('.fchip[data-f="112"]'); page.wait_for_timeout(100)
    page.fill('.search-local', 'mask'); page.wait_for_timeout(200)
    check('local search filters', page.locator('.item').count() >= 16)
    page.click('.fchip[data-f=all]'); page.fill('.search-local', '')

    # --- global search
    page.fill('#globalSearch', 'shade cloak'); page.wait_for_timeout(150)
    check('global search shows result', page.locator('#searchResults .sr:has-text("Shade Cloak")').count() >= 1)
    page.locator('#searchResults .sr:has-text("Shade Cloak")').first.click(); page.wait_for_timeout(200)
    check('search result opens item', page.locator('#modalTitle').inner_text() == 'Shade Cloak')
    page.keyboard.press('Escape')

    # --- regions
    page.goto(BASE + '#/regions'); page.wait_for_timeout(200)
    check('18 region cards', page.locator('.region-card').count() == 18)
    page.goto(BASE + '#/region/crystal-peak'); page.wait_for_timeout(200)
    check('region page has categories', page.locator('.card h3').count() >= 4)
    check('crystal theme applied', js(page, "document.body.dataset.theme") == 'crystal')

    # --- geo / nail readiness
    js(page, "HKApp.store.setResource('geo', 2500)")
    js(page, "HKApp.store.setChecks({'ore-crystal-peak':true,'ore-basin':true,'ore-seer':true})")
    nn = js(page, "HKApp.engine.nextNail()")
    check('next nail is Coiled, ready with 2500 Geo + held ore', nn['to'] == 'Coiled Nail' and nn['ready'], nn)
    page.goto(BASE + '#/trackers/nail'); page.wait_for_timeout(150)
    check('nail tracker says affordable', page.locator('text=You can afford it now').first.is_visible())
    page.goto(BASE + '#/trackers/geo'); page.wait_for_timeout(150)
    check('geo tracker lists expenses & farms', page.locator('.tbl').count() == 2)

    # --- essence & seer
    page.goto(BASE + '#/trackers/essence'); page.wait_for_timeout(150)
    page.fill('input[data-action=res][data-key=essence]', '1850'); page.locator('input[data-action=res][data-key=essence]').dispatch_event('change'); page.wait_for_timeout(200)
    check('essence edited', js(page, "HKApp.store.get().resources.essence") == 1850)
    check('1800 milestone marked ready', page.locator('.milestones li.ready:has-text("Awoken Dream Nail")').count() == 1)

    # --- masks / vessels derived %
    js(page, "HKApp.store.setChecks({'mask-sly-1':true,'mask-sly-2':true,'mask-mawlek':true,'mask-grubfather':true,'vessel-sly-1':true,'vessel-greenpath':true,'vessel-kings-station':true})")
    check('4 shards → Ancient Mask #1 (+1%) and 3 frags → Soul Vessel #1', js(page, "HKApp.engine.isDone('mask-upgrade-1') && HKApp.engine.isDone('vessel-upgrade-1') && HKApp.engine.shards().masks === 6"))

    # --- charms: kingsoul counts only with both fragments; grimm slot rule
    c0 = js(page, "HKApp.engine.completion().value")
    js(page, "HKApp.store.setChecks({'carefree-melody':true})")
    check('Carefree Melody gives the shared Grimm slot 1%', js(page, "HKApp.engine.completion().value") == c0 + 1)
    js(page, "HKApp.store.setChecks({'grimmchild':true})")
    check('Grimmchild + Carefree does not double count', js(page, "HKApp.engine.completion().value") == c0 + 1)
    check('Grimmchild+Carefree flagged inconsistent', any('Carefree' in (w.get('text') or '') for w in js(page, "HKApp.engine.inconsistencies().filter(w=>w.text)")))
    js(page, "HKApp.store.setChecks({'grimmchild':false,'carefree-melody':false})")

    # --- endings & void heart
    js(page, "HKApp.store.setChecks({'herrah':true,'lurien':true,'monomon':true})")
    page.goto(BASE + '#/dashboard'); page.wait_for_timeout(200)
    check('BLACK EGG OPEN banner', page.locator('text=BLACK EGG OPEN').first.is_visible())
    check('Do-basic-ending warning', page.locator('text=FAÇA O FINAL BÁSICO ANTES DO VOID HEART').first.is_visible())
    check('engine never recommends Void Heart while locked', js(page, "HKApp.engine.candidatePool ? true : true") and js(page, "(function(){var o=HKApp.engine.nextObjective();return !o || o.item.id!=='void-heart'})()"))
    js(page, "HKApp.store.setChecks({'ending-thk':true})")
    page.goto(BASE + '#/trackers/endings'); page.wait_for_timeout(150)
    check('Void Heart SAFE banner after THK', page.locator('text=VOID HEART — AGORA É SEGURO').first.is_visible())

    # --- export / import JSON
    page.goto(BASE + '#/save'); page.wait_for_timeout(150)
    with page.expect_download() as dl:
        page.click('[data-action=export]')
    path = dl.value.path()
    data = json.load(open(path))
    check('export has version 1 + app id', data.get('version') == 1 and data.get('app') == 'hollow-knight-companion')
    before = js(page, "HKApp.engine.completion().value")
    page.click('[data-action=reset]'); page.wait_for_timeout(250)
    check('reset returns to initial 7%', js(page, "HKApp.engine.completion().value") == 7)
    page.set_input_files('input[data-action=import-json]', path); page.wait_for_timeout(400)
    check('import JSON restores progress', js(page, "HKApp.engine.completion().value") == before, (before, js(page, "HKApp.engine.completion().value")))
    bad = os.path.join(os.path.dirname(path), 'bad.json'); open(bad, 'w').write('{"version": 99}')
    page.set_input_files('input[data-action=import-json]', bad); page.wait_for_timeout(300)
    check('bad JSON rejected, progress intact', js(page, "HKApp.engine.completion().value") == before)

    # --- real save import (synthetic fixture)
    page.click('[data-action=reset]'); page.wait_for_timeout(200)
    page.set_input_files('input[data-action=import-hk]', SAVE); page.wait_for_timeout(500)
    check('SAVE DETECTED preview shown', page.locator('text=SAVE DETECTED').is_visible())
    check('preview lists 1437 Essence & Herrah', page.locator('#modal li:has-text("1,437 Essence")').count() == 1 and page.locator('#modal li.pos:has-text("Herrah")').count() == 1)
    check('nothing applied before confirmation', not js(page, "HKApp.engine.isDone('monarch-wings')"))
    page.locator('#modal label.change:has-text("Grubsong") input').click()
    page.click('[data-action=apply-import]'); page.wait_for_timeout(300)
    check('apply imports Monarch Wings + Coiled Nail + 1437 Essence', js(page, "HKApp.engine.isDone('monarch-wings') && HKApp.engine.nailLevel()===3 && HKApp.store.get().resources.essence===1437"))
    check('unticked change (Grubsong) not applied', not js(page, "HKApp.engine.isDone('grubsong')"))

    # --- music: missing file handled
    page.click('[data-music=toggle]'); page.wait_for_timeout(700)
    check('missing music handled gracefully', 'Add your music' in page.locator('#music').inner_text() or 'Playing' in page.locator('#music').inner_text())
    page.fill('#music input[data-music=volume]', '0.2'); page.locator('#music input[data-music=volume]').dispatch_event('input')
    check('volume saved', abs(js(page, "HKApp.store.get().music.volume") - 0.2) < 1e-6)

    # --- V2: interactive map, region panel, per-region soundtrack
    check('music uses the original region ambience', js(page, "HKApp.music.state().source") == 'gen')
    page.goto(BASE + '#/map'); page.wait_for_timeout(400)
    check('map draws 18 regions', page.locator('.wm-reg').count() == 18)
    nb = page.locator('.wm-poi.t-bench').count()
    check('map shows 48 bench markers (+2 trams)', nb == 48, nb)
    check('map shows 11 stag stations', page.locator('.wm-poi.t-stag').count() == 11)
    check('map shows vendors and bosses', page.locator('.wm-poi.t-vendor').count() >= 15 and page.locator('.wm-poi.t-boss').count() >= 40)
    page.click('.wm-layers-inline [data-wm-layer=bench]'); page.wait_for_timeout(250)
    check('layer toggle hides benches', page.locator('.wm-poi.t-bench').count() == 0)
    page.click('.wm-layers-inline [data-wm-layer=bench]'); page.wait_for_timeout(250)
    page.locator('.wm-reg[data-region=deepnest] .rf').first.click(position={'x': 4, 'y': 4}); page.wait_for_timeout(300)
    check('region click opens side panel', 'DEEPNEST' in page.locator('.map-side .rp-title').inner_text().upper())
    check('music follows the selected region', js(page, "HKApp.music.state().region") == 'deepnest')
    page.locator('.wm-poi[data-poi="item:nosk"]').click(); page.wait_for_timeout(250)
    check('marker popover shows boss', 'Nosk' in page.locator('.wm-pop').inner_text())
    page.fill('[data-wm-search]', 'lemm'); page.wait_for_timeout(200)
    page.locator('.wm-results button').first.click(); page.wait_for_timeout(300)
    check('map search zooms to a marker', 'Lemm' in page.locator('.wm-pop').inner_text())
    page.click('[data-wm-found]'); page.wait_for_timeout(300)
    check('mark a vendor as found (persisted)', js(page, "HKApp.store.get().settings.poiFound['city-of-tears|Relic Seeker Lemm']") is True)
    img = os.path.join(HERE, 'fixtures', 'test-map.png')
    if not os.path.exists(img):
        from PIL import Image, ImageDraw
        im = Image.new('RGB', (1000, 820), (10, 12, 20)); d = ImageDraw.Draw(im)
        for i in range(0, 1000, 50): d.line([(i, 0), (i, 820)], fill=(60, 70, 90))
        im.save(img)
    page.set_input_files('.img-card input[data-action=map-img-file]', img); page.wait_for_timeout(800)
    check('own map image shown under the map', page.locator('.wm-bgimg').count() == 1 and page.locator('.wm.has-bg').count() == 1)
    page.fill('input[data-action=map-img][data-key=opacity]', '0.5'); page.locator('input[data-action=map-img][data-key=opacity]').dispatch_event('change'); page.wait_for_timeout(300)
    check('image alignment saved', abs(js(page, "HKApp.store.get().settings.mapImage.opacity") - 0.5) < 1e-6)
    page.reload(); page.wait_for_timeout(900)
    check('map image survives reload (IndexedDB)', page.locator('.wm-bgimg').count() == 1)
    page.click('[data-action=map-img-clear]'); page.wait_for_timeout(500)
    check('map image removed', page.locator('.wm-bgimg').count() == 0)
    # calibrated detailed map (synthetic image with the 4712x3500 proportions) + art
    cal = os.path.join(HERE, 'fixtures', 'test-calibrated.png'); art = os.path.join(HERE, 'fixtures', 'test-art.png')
    if not os.path.exists(cal):
        from PIL import Image
        Image.new('RGB', (1178, 875), (5, 5, 10)).save(cal); Image.new('RGB', (600, 600), (30, 30, 60)).save(art)
    page.set_input_files('.img-card input[data-action=map-img-file]', cal); page.wait_for_timeout(900)
    check('calibrated image switches to Detailed mode', js(page, "HK.WorldMap.mode({store: HKApp.store})") == 'image' and page.locator('.wm.img .wm-detail').count() == 1)
    check('detailed: grubs layer from the calibrated layout', page.locator('.wm[data-wm=full] .wm-poi.t-grub').count() == 42)
    page.click('.wm-bar [data-wm-preset=stations]'); page.wait_for_timeout(400)
    check('preset Stations shows only stag + tram', page.locator('.wm[data-wm=full] .wm-poi').count() == page.locator('.wm[data-wm=full] .wm-poi.t-stag, .wm[data-wm=full] .wm-poi.t-tram').count() > 0)
    page.click('.wm-bar [data-wm-preset=none]'); page.wait_for_timeout(400)
    check('preset Image only hides markers', page.locator('.wm[data-wm=full] .wm-poi').count() == 0)
    page.click('.wm-bar [data-wm-preset=all]'); page.wait_for_timeout(300)
    page.click('[data-wm-base=drawn]'); page.wait_for_timeout(400)
    check('Clean switch returns to the drawn map', js(page, "HK.WorldMap.mode({store: HKApp.store})") == 'drawn' and page.locator('.wm-detail').count() == 0)
    page.set_input_files('input[data-action=art-img-file]', art); page.wait_for_timeout(700)
    check('art image used as page background', js(page, "document.body.classList.contains('art-bg')"))
    page.click('[data-action=map-img-clear][data-id=art]'); page.wait_for_timeout(400)
    page.click('[data-action=map-img-clear][data-id=bg]'); page.wait_for_timeout(400)
    page.goto(BASE + '#/dashboard'); page.wait_for_timeout(300)
    page.click('.rp-tab[data-id=bosses]'); page.wait_for_timeout(200)
    check('region panel bosses tab', page.locator('.rpanel .rrow').count() >= 1)
    page.goto(BASE + '#/soundtrack'); page.wait_for_timeout(300)
    check('soundtrack lists 18 regions + fallback', page.locator('.track').count() == 19)
    wav = os.path.join(HERE, 'fixtures', 'tone.wav')
    if not os.path.exists(wav):
        import wave, struct, math
        w = wave.open(wav, 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000)
        w.writeframes(b''.join(struct.pack('<h', int(3000 * math.sin(i / 8000 * 2 * math.pi * 440))) for i in range(8000))); w.close()
    page.set_input_files('input[data-action=music-file][data-id=greenpath]', wav); page.wait_for_timeout(600)
    check('own file stored for a region', 'tone.wav' in page.locator('.track:has-text("Greenpath")').inner_text())
    page.click('[data-action=music-preview][data-id=greenpath]'); page.wait_for_timeout(900)
    check('region plays your own file', js(page, "HKApp.music.state().source") == 'file', js(page, "HKApp.music.state()"))

    # --- mobile menu
    m = b.new_context(viewport={'width': 390, 'height': 844}).new_page()
    m.on('pageerror', lambda e: errors.append('mobile pageerror: ' + str(e)))
    m.goto(BASE); m.wait_for_timeout(300)
    check('mobile: sidebar hidden initially', m.evaluate("document.getElementById('sidebar').getBoundingClientRect().right <= 0"))
    m.click('#menuBtn'); m.wait_for_timeout(800)
    check('mobile: menu opens', m.evaluate("document.getElementById('sidebar').getBoundingClientRect().left >= -1"))
    m.click('#sidebar a[data-nav=regions]'); m.wait_for_timeout(400)
    check('mobile: nav closes after selection', not m.evaluate("document.body.classList.contains('nav-open')"))
    check('mobile: no horizontal overflow', m.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), m.evaluate("document.documentElement.scrollWidth"))
    b.close()

print('\n--- console/page errors ---')
print('\n'.join(errors) if errors else 'none')
fails = [r for r in results if not r[1]]
print(f'\n{len(results) - len(fails)}/{len(results)} checks passed')
sys.exit(1 if fails or errors else 0)
