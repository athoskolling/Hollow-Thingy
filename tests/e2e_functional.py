"""Functional browser tests (Playwright/Chromium).
Usage: python3 tests/e2e_functional.py [base_url]
Checks: console, checkboxes, localStorage, reset, JSON import/export, search, filters, Save Editor sync,
dependencies/warnings, Next Objective, regions, Geo/Nail/Ore, Essence, Masks/Vessels, Charms, endings,
Void Heart lock, HK save import preview/apply, Spotify soundtrack, sync, mobile menu."""
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
    STUB = "window.__spotify=[];setTimeout(function(){window.onSpotifyIframeApiReady({createController:function(el,o,cb){var f=document.createElement('iframe');f.title='Spotify';f.dataset.uri=o.uri;el.appendChild(f);cb({loadUri:function(u){window.__spotify.push(u);f.dataset.uri=u;},play:function(){},togglePlay:function(){},addListener:function(){}});}});},0);"
    ctx.route('https://open.spotify.com/embed/iframe-api/v1', lambda r: r.fulfill(content_type='application/javascript', body=STUB))
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append('console: ' + m.text))
    page.on('dialog', lambda d: d.accept())
    page.goto(BASE); page.wait_for_timeout(500)
    js(page, "localStorage.clear()"); page.reload(); page.wait_for_timeout(400)

    # --- audit & initial state
    check('audit passes in browser', js(page, "HKApp.runAudit().errors.length === 0 && HKApp.runAudit().total === 112"))
    check('new game: initial completion = 0%', js(page, "HKApp.engine.completion().value") == 0, js(page, "HKApp.engine.completion().value"))
    check('next objective is Vengeful Spirit (start of game)', page.locator('.obj-name').inner_text().startswith('Vengeful Spirit'), page.locator('.obj-name').inner_text())
    check('starts in Dirtmouth with nothing checked', js(page, "HKApp.store.get().currentRegion") == 'dirtmouth' and js(page, "Object.keys(HKApp.store.get().checks).length") == 0)
    js(page, "HKApp.store.setChecks({'hornet-protector':true,'mothwing-cloak':true,'mantis-claw':true,'vengeful-spirit':true}); HKApp.store.setRegion('crystal-peak'); HKApp.render()"); page.wait_for_timeout(200)
    check('Void Heart lock banner visible', page.locator('text=VOID HEART — NÃO PEGUE AINDA').first.is_visible())

    # --- checkbox from dashboard "while here" + persistence
    page.goto(BASE + '#/region/crystal-peak'); page.wait_for_timeout(300)
    js(page, "document.querySelectorAll('details').forEach(d => d.open = true)")
    page.locator('#item-descending-dark input.chk').first.click(); page.wait_for_timeout(150)
    check('checkbox marks Descending Dark', js(page, "HKApp.engine.isDone('descending-dark')"))
    stored = json.loads(js(page, "localStorage.getItem('hk-companion-state')"))
    check('localStorage persisted check', stored['checks'].get('descending-dark') is True)
    page.reload(); page.wait_for_timeout(300)
    check('state survives reload', js(page, "HKApp.engine.isDone('descending-dark')"))

    # --- Mark done objective -> next objective changes
    page.goto(BASE + '#/'); page.wait_for_timeout(300)
    first = js(page, "HKApp.engine.nextObjective().item.id")
    first_name = page.locator('.obj-name').inner_text()
    page.click('.obj-actions [data-action=toggle]'); page.wait_for_timeout(150)
    check('MARK DONE records the objective (' + first + ')', js(page, "HKApp.engine.isDone(%r)" % first))
    nxt = page.locator('.obj-name').inner_text()
    check('next objective moved on after marking done', nxt != first_name, nxt)

    # --- region selector influences "while you're here"
    page.select_option('select[data-action=region]', 'royal-waterways'); page.wait_for_timeout(200)
    check('current region stored', js(page, "HKApp.store.get().currentRegion") == 'royal-waterways')

    # --- Save editor single-source sync
    page.click('.update-btn'); page.wait_for_timeout(200)
    check('editor opens', page.locator('#modal').is_visible())
    ed_ch = page.locator('#modal .ed-toggle:has-text("Mothwing Cloak") input')
    check('editor shows Mothwing Cloak checked (sync from checklist)', ed_ch.is_checked())
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

    # --- missing charms list
    page.goto(BASE + '#/trackers/charms'); page.wait_for_timeout(300)
    n_left = page.locator('.missing-charms .mc').count()
    check('missing-charms lists charms with how-to', n_left >= 30 and page.locator('.missing-charms .mc dd').count() > n_left)
    page.locator('.missing-charms .mc input.chk').first.click(); page.wait_for_timeout(200)
    check('ticking a missing charm removes it from the list', page.locator('.missing-charms .mc').count() == n_left - 1)

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
    page.click('[data-action=reset]'); page.wait_for_timeout(100)
    check('reset needs a second tap (no accidental wipe)', js(page, "HKApp.engine.completion().value") == before)
    page.click('[data-action=reset]'); page.wait_for_timeout(250)
    check('reset returns to initial 0%', js(page, "HKApp.engine.completion().value") == 0 and js(page, "Object.keys(HKApp.store.get().checks).length") == 0)
    page.set_input_files('input[data-action=import-json]', path); page.wait_for_timeout(400)
    check('import JSON restores progress', js(page, "HKApp.engine.completion().value") == before, (before, js(page, "HKApp.engine.completion().value")))
    bad = os.path.join(os.path.dirname(path), 'bad.json'); open(bad, 'w').write('{"version": 99}')
    page.set_input_files('input[data-action=import-json]', bad); page.wait_for_timeout(300)
    check('bad JSON rejected, progress intact', js(page, "HKApp.engine.completion().value") == before)

    # --- real save import (synthetic fixture)
    page.click('[data-action=reset]'); page.click('[data-action=reset]'); page.wait_for_timeout(200)
    page.set_input_files('input[data-action=import-hk]', SAVE); page.wait_for_timeout(500)
    check('SAVE DETECTED preview shown', page.locator('text=SAVE DETECTED').is_visible())
    check('preview lists 1437 Essence & Herrah', page.locator('#modal li:has-text("1,437 Essence")').count() == 1 and page.locator('#modal li.pos:has-text("Herrah")').count() == 1)
    check('nothing applied before confirmation', not js(page, "HKApp.engine.isDone('monarch-wings')"))
    page.locator('#modal label.change:has-text("Grubsong") input').click()
    page.click('[data-action=apply-import]'); page.wait_for_timeout(300)
    check('apply imports Monarch Wings + Coiled Nail + 1437 Essence', js(page, "HKApp.engine.isDone('monarch-wings') && HKApp.engine.nailLevel()===3 && HKApp.store.get().resources.essence===1437"))
    check('unticked change (Grubsong) not applied', not js(page, "HKApp.engine.isDone('grubsong')"))

    # --- music: official soundtrack via Spotify embed (API stubbed in tests)
    check('Spotify player ready with a region track', js(page, "HKApp.music.state().api") == 'ready' and page.locator('#music').get_attribute('data-uri').startswith('spotify:track:'))

    # --- V2: no world map; regions card, region panel, per-region soundtrack
    page.goto(BASE + '#/map'); page.wait_for_timeout(300)
    check('Map page: 18 regions, schematic (no official map image)', page.locator('.atl-node').count() == 18 and page.locator('.atlas img').count() == 0 and js(page, "typeof HK.WorldMap") == 'undefined')
    page.locator('.atl-node').first.click(); page.wait_for_timeout(200)
    check('Map page: clicking a region shows its details', page.locator('.atlas-detail').count() == 1)
    page.click('[data-action=map-layer][data-id=charms]'); page.wait_for_timeout(200)
    check('Map page: layers switch', page.locator('.atlas-layers .tab.on').inner_text() == 'Charms left')
    page.goto(BASE + '#/dashboard'); page.wait_for_timeout(300)
    check('regions card lists 18 regions', page.locator('.rg-row').count() == 18)
    page.click('.rg-row[href="#/region/deepnest"]'); page.wait_for_timeout(300)
    check('regions card opens the region page', 'Deepnest' in page.locator('.region-head h1').inner_text())
    page.goto(BASE + '#/region/deepnest'); page.wait_for_timeout(400)
    check('region page lists points of interest (stag, benches)', page.locator('text=Distant Village Station').count() >= 1)
    check('music follows the region on screen (Deepnest → Nosk)', js(page, "HKApp.music.state().uri") == 'spotify:track:77vkOcahVHbBpF4tdjerSW' and 'spotify:track:77vkOcahVHbBpF4tdjerSW' in js(page, "window.__spotify"))

    # --- sync between devices (GitHub Gist API mocked)
    gists = {}
    def gh(route):
        req = route.request; url = req.url; meth = req.method
        if url.endswith('/gists?per_page=100') and meth == 'GET':
            return route.fulfill(json=[{'id': k, 'files': {'hollow-knight-companion.json': {}}} for k in gists])
        if url.endswith('/gists') and meth == 'POST':
            body = json.loads(req.post_data); gid = 'g' + str(len(gists) + 1)
            gists[gid] = body['files']['hollow-knight-companion.json']['content']
            return route.fulfill(status=201, json={'id': gid})
        gid = url.rsplit('/', 1)[-1]
        if meth == 'PATCH':
            gists[gid] = json.loads(req.post_data)['files']['hollow-knight-companion.json']['content']
            return route.fulfill(json={'id': gid})
        if meth == 'GET' and gid in gists:
            return route.fulfill(json={'id': gid, 'files': {'hollow-knight-companion.json': {'content': gists[gid], 'truncated': False}}})
        return route.fulfill(status=404, json={})
    page.route('https://api.github.com/**', gh)
    page.goto(BASE + '#/save'); page.wait_for_timeout(300)
    page.fill('#syncToken', 'ghp_test'); page.click('[data-action=sync-connect]'); page.wait_for_timeout(1200)
    check('sync: first connect creates the private gist with progress', len(gists) == 1 and json.loads(list(gists.values())[0]).get('app') == 'hollow-knight-companion')
    remote = json.loads(gists['g1']); remote['checks']['crystal-heart'] = True; remote['updatedAt'] = '2099-01-01T00:00:00.000Z'; gists['g1'] = json.dumps(remote)
    page.click('[data-action=sync-now]'); page.wait_for_timeout(1200)
    check('sync: newer progress from another device is pulled', js(page, "HKApp.engine.isDone('crystal-heart')"))
    js(page, "HKApp.store.setCheck('mantis-lords', true)"); page.wait_for_timeout(3800)
    check('sync: local change is pushed automatically', json.loads(gists['g1'])['checks'].get('mantis-lords') is True)
    page.click('[data-action=sync-off]'); page.wait_for_timeout(300)
    check('sync: disconnect', not js(page, "HKApp.sync().connected()"))
    page.unroute('https://api.github.com/**')
    page.goto(BASE + '#/dashboard'); page.wait_for_timeout(300)
    page.goto(BASE + '#/soundtrack'); page.wait_for_timeout(300)
    check('soundtrack lists the 18 regions', page.locator('.track').count() == 18)
    page.click('[data-action=music-play][data-id=greenpath]'); page.wait_for_timeout(400)
    check('Play loads the region track (Greenpath)', js(page, "HKApp.music.state().uri") == 'spotify:track:6fyI2QGPzUiqRHnuYD7oOp')

    # --- Plan page: geo planner, farms, missables, later, builds, history; guide; roots; notes; profiles
    page.goto(BASE + '#/plan'); page.wait_for_timeout(300)
    check('Plan: 6 tabs', page.locator('.tabs .tab').count() == 6)
    check('Geo planner lists purchasable things with costs', page.locator('.buy').count() >= 5 and page.locator('.buy-cost').count() >= 5)
    js(page, "HKApp.store.setResource('geo', 600)"); page.wait_for_timeout(200)
    check('Geo planner reacts to the Geo you hold', 'short' in page.locator('main').inner_text().lower() or 'saving' in page.locator('main').inner_text().lower())
    page.goto(BASE + '#/plan/farm'); page.wait_for_timeout(300)
    check('Farm routes: a suggestion is highlighted and every route has a wiki link', page.locator('.farm.suggested').count() >= 1 and page.locator('.farm a[href*="hollowknight.wiki"]').count() >= 3)
    page.goto(BASE + '#/plan/missables'); page.wait_for_timeout(300)
    check('Missables: lists permanent-severity warnings with sources', page.locator('.miss').count() >= 3 and page.locator('.miss a[href*="hollowknight.wiki"]').count() >= 3)
    js(page, "HKApp.store.setPinned('banishment')"); page.goto(BASE + '#/dashboard'); page.wait_for_timeout(300)
    check('Missable alert appears on the dashboard when the next goal is risky', page.locator('.missable-banner').count() >= 1)
    js(page, "HKApp.store.setPinned(null)")
    js(page, "HKApp.openItem('banishment')"); page.wait_for_timeout(300)
    check('Item detail shows the missable warning', page.locator('#modal .missable-warn, #modal .banner.warn').count() >= 1)
    page.click('[data-action=close-modal]'); page.wait_for_timeout(200)
    page.goto(BASE + '#/plan/later'); page.wait_for_timeout(200)
    lid = js(page, "HK.DATA.ITEMS.filter(i=>!i.derived&&!i.optional&&!HKApp.engine.isDone(i.id))[0].id")
    lname = js(page, "HK.DATA.ITEMS.find(i=>i.id===%r).name" % lid)
    js(page, "HKApp.store.toggleLater(%r)" % lid); page.wait_for_timeout(300)
    check('Come back later: item appears in list and persists', lname in page.locator('main').inner_text() and lid in json.loads(js(page, "localStorage.getItem('hk-companion-state')"))['later'], (lid, lname))
    page.goto(BASE + '#/plan/builds'); page.wait_for_timeout(300)
    page.locator('.charm-grid .cg').nth(0).click(); page.locator('.charm-grid .cg').nth(1).click(); page.wait_for_timeout(200)
    check('Builds: selecting charms updates the notch meter', page.locator('.notch-meter').count() == 1 and page.locator('.charm-grid .cg.on').count() == 2)
    page.fill('#buildName', 'E2E build'); page.click('[data-action=build-save]'); page.wait_for_timeout(300)
    check('Builds: saved build persists', js(page, "HKApp.store.get().builds.some(b=>b.name==='E2E build')") and page.locator('.saved-build').count() >= 1)
    page.click('[data-action=build-clear]'); page.click('.saved-build [data-action=build-load]'); page.wait_for_timeout(200)
    check('Builds: loading restores the selection', page.locator('.charm-grid .cg.on').count() == 2)
    page.click('.saved-build [data-action=build-del]'); page.wait_for_timeout(200)
    check('Builds: delete works', page.locator('.saved-build').count() == 0)
    js(page, "HKApp.store.recordHistory('2099-01-01', 50, 100)")
    page.goto(BASE + '#/plan/history'); page.wait_for_timeout(300)
    check('History: today recorded and chart rendered', js(page, "HKApp.store.get().history.length") >= 1 and page.locator('svg.hist-svg').count() == 1)
    page.goto(BASE + '#/trackers/guide'); page.wait_for_timeout(300)
    check('Boss guide: one collapsible per boss with wiki source', page.locator('details.boss-g').count() >= 30 and page.locator('details.boss-g a[href*="hollowknight.wiki"]').count() >= 30)
    page.goto(BASE + '#/trackers/essence'); page.wait_for_timeout(300)
    check('Essence: all 15 Whispering Roots listed with where to find them', page.locator('.root-row').count() == 15)
    page.goto(BASE + '#/region/greenpath'); page.wait_for_timeout(300)
    page.fill('textarea[data-action=note][data-id="region:greenpath"]', 'voltar com Isma'); page.press('textarea[data-id="region:greenpath"]', 'Tab'); page.wait_for_timeout(300)
    page.reload(); page.wait_for_timeout(400)
    check('Region notes persist', page.locator('textarea[data-id="region:greenpath"]').input_value() == 'voltar com Isma')
    page.goto(BASE + '#/settings'); page.wait_for_timeout(300)
    done_before = js(page, "Object.keys(HKApp.store.get().checks).length")
    page.fill('#profileName', 'Steel Soul'); page.click('[data-action=profile-new]'); page.wait_for_timeout(400)
    check('Profiles: new profile starts at 0%', js(page, "HKApp.engine.completion().value") == 0 and js(page, "HKApp.store.profiles.list().length") == 2)
    page.goto(BASE + '#/settings'); page.wait_for_timeout(300)
    page.click('[data-action=profile-switch][data-id=main]'); page.wait_for_timeout(400)
    check('Profiles: switching back restores the main save', js(page, "Object.keys(HKApp.store.get().checks).length") == done_before)
    page.goto(BASE + '#/settings'); page.wait_for_timeout(300)
    d = page.locator('[data-action=profile-del]'); d.first.click(); page.wait_for_timeout(200); d.first.click(); page.wait_for_timeout(300)
    check('Profiles: two-tap delete removes it', js(page, "HKApp.store.profiles.list().length") == 1)

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
