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
    check('Save page: account sign-in is the main option, Gist is tucked away', page.locator('.account-card').count() == 1 and page.locator('details.card.group #syncToken').count() == 1)
    page.evaluate("document.querySelector('details.card.group').open = true")
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

    # --- Spotify account (PKCE + Web Playback SDK), all Spotify endpoints mocked
    sp_calls = []
    SDK = "window.Spotify={Player:function(o){var L={};this.addListener=function(e,f){L[e]=f};this.connect=function(){setTimeout(function(){L.ready&&L.ready({device_id:'dev1'})},30)};this.togglePlay=function(){window.__tog=(window.__tog||0)+1;L.player_state_changed&&L.player_state_changed({paused:!!(window.__tog%2)})};this.setVolume=function(v){window.__vol=v};this.activateElement=function(){};this.disconnect=function(){};window.__fire=function(e,d){L[e]&&L[e](d)};}};setTimeout(function(){window.onSpotifyWebPlaybackSDKReady&&window.onSpotifyWebPlaybackSDKReady()},0);"
    ctx.route('https://sdk.scdn.co/spotify-player.js', lambda r: r.fulfill(content_type='application/javascript', body=SDK))
    def authorize(r):
        from urllib.parse import urlparse, parse_qs
        q = parse_qs(urlparse(r.request.url).query)
        sp_calls.append(('authorize', q['code_challenge_method'][0], q['client_id'][0], q['scope'][0], q['redirect_uri'][0]))
        r.fulfill(status=302, headers={'Location': q['redirect_uri'][0] + '?code=thecode&state=' + q['state'][0]})
    ctx.route('https://accounts.spotify.com/authorize*', authorize)
    def token(r):
        sp_calls.append(('token', r.request.post_data))
        r.fulfill(content_type='application/json', body=json.dumps({'access_token': 'AT', 'refresh_token': 'RT', 'expires_in': 3600}))
    ctx.route('https://accounts.spotify.com/api/token', token)
    def spapi(r):
        sp_calls.append(('api', r.request.method, r.request.url, r.request.post_data, r.request.headers.get('authorization')))
        r.fulfill(status=204, body='')
    ctx.route('https://api.spotify.com/**', spapi)
    page.goto(BASE + '#/soundtrack'); page.wait_for_timeout(300)
    check('Spotify: connect card with the exact Redirect URI to register', page.locator('.sp-card .sp-uri').inner_text() == BASE.split('#')[0] and page.locator('#spClientId').count() == 1, page.locator('.sp-uri').inner_text())
    page.fill('#spClientId', 'nope'); page.click('[data-action=spotify-connect]'); page.wait_for_timeout(200)
    check('Spotify: invalid Client ID is rejected without leaving the page', not sp_calls and '#/soundtrack' in page.url)
    CID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
    page.fill('#spClientId', CID); page.click('[data-action=spotify-connect]'); page.wait_for_timeout(1500)
    au = [c for c in sp_calls if c[0] == 'authorize']
    check('Spotify: PKCE (S256) authorize with the streaming scopes, no client secret', au and au[0][1] == 'S256' and au[0][2] == CID and 'streaming' in au[0][3] and 'user-modify-playback-state' in au[0][3])
    tk = [c for c in sp_calls if c[0] == 'token']
    check('Spotify: code exchanged with code_verifier (no secret)', tk and 'code_verifier=' in tk[0][1] and 'client_secret' not in tk[0][1])
    check('Spotify: back on #/soundtrack, query cleaned, connected + SDK ready', '?code' not in page.url and '#/soundtrack' in page.url and js(page, "HKApp.music.state().spotify") == 'ready', js(page, "HKApp.music.state().spotify"))
    check('Spotify: tokens kept out of the progress state/export', 'AT' not in js(page, "HKApp.store.exportJSON()") and 'RT' not in js(page, "HKApp.store.exportJSON()"))
    page.click('[data-action=music-play][data-id=greenpath]'); page.wait_for_timeout(500)
    pl = [c for c in sp_calls if c[0] == 'api' and c[1] == 'PUT' and '/me/player/play' in c[2]]
    check('Spotify: Play starts the FULL region track on the web device', pl and 'spotify:track:6fyI2QGPzUiqRHnuYD7oOp' in pl[-1][3] and 'device_id=dev1' in pl[-1][2] and pl[-1][4] == 'Bearer AT', pl[-1:] )
    check('Spotify: track loops (repeat=track)', any('/me/player/repeat?state=track' in c[2] for c in sp_calls if c[0] == 'api'))
    check('Spotify: own controls shown, embed hidden', page.locator('#music.sdk-on .pl-toggle').count() == 1 and not page.locator('#music .pl-embed').is_visible())
    js(page, "HKApp.music.setContext('dirtmouth')"); js(page, "HK.__f=1")
    page.evaluate("window.__fire('player_state_changed',{paused:false})"); page.wait_for_timeout(100)
    n0 = len([c for c in sp_calls if c[0] == 'api' and '/me/player/play' in c[2]])
    page.evaluate("HKApp.store.setMusic({follow:true}); HKApp.music.setContext('city-of-tears')"); page.wait_for_timeout(500)
    pl = [c for c in sp_calls if c[0] == 'api' and '/me/player/play' in c[2]]
    check('Spotify: changing region while playing switches to that region’s track', len(pl) == n0 + 1 and '0nD62ke95NJvAI8chsRjRg' in pl[-1][3], pl[-1:])
    page.reload(); page.wait_for_timeout(800)
    check('Spotify: connection survives reload (refresh token)', js(page, "HKApp.music.spotify().connected") and js(page, "HKApp.music.state().spotify") == 'ready')
    page.goto(BASE + '#/soundtrack'); page.wait_for_timeout(300)
    page.click('[data-action=spotify-disconnect]'); page.wait_for_timeout(300)
    check('Spotify: disconnect clears tokens', js(page, "localStorage.getItem('hk-companion-spotify')") is None or 'RT' not in js(page, "localStorage.getItem('hk-companion-spotify')"))
    check('Spotify: back to the embedded player', js(page, "HKApp.music.state().spotify") == 'off' and page.locator('#spClientId').count() == 1)

    # --- Account login + live cloud sync (Firebase SDK mocked)
    FB_APP = "export function initializeApp(c){window.__fbcfg=c;return {c}}"
    FB_AUTH = ("const cbs=[];let cur=null;const auth={currentUser:null};window.__auth={set(u){cur=u;auth.currentUser=u;cbs.forEach(f=>f(u))}};"
      "export function getAuth(){return auth}export function onAuthStateChanged(a,cb){cbs.push(cb);setTimeout(()=>cb(cur),0);return()=>{}}"
      "export class GoogleAuthProvider{constructor(){this.id='google'}}export class GithubAuthProvider{constructor(){this.id='github'}}"
      "export async function signInWithPopup(a,p){window.__popup=p.id;const u={uid:'u1',email:'athos@example.com',displayName:'Athos'};window.__auth.set(u);return{user:u}}"
      "export async function sendSignInLinkToEmail(a,e,s){window.__sent={email:e,s:s}}"
      "export function isSignInWithEmailLink(a,u){return /oobCode=/.test(u)}"
      "export async function signInWithEmailLink(a,e,u){const x={uid:'u1',email:e,displayName:null};window.__auth.set(x);return{user:x}}"
      "export async function signOut(){window.__auth.set(null)}")
    FB_FS = ("const data=window.__fsdata=window.__fsdata||{};const ls=[];window.__writes=0;"
      "function snap(r){const d=data[r.path];return{exists:()=>!!d,data:()=>d,metadata:{hasPendingWrites:false}}}"
      "function fire(p){ls.forEach(l=>l.r.path===p&&l.cb(snap(l.r)))}window.__remote=(p,d)=>{data[p]=d;fire(p)};"
      "export function getFirestore(){return{}}export function doc(db,...p){return{path:p.join('/')}}"
      "export function onSnapshot(r,cb){ls.push({r,cb});setTimeout(()=>cb(snap(r)),20);return()=>{}}"
      "export async function getDoc(r){return snap(r)}"
      "export async function setDoc(r,d){window.__writes++;data[r.path]=JSON.parse(JSON.stringify(d));setTimeout(()=>fire(r.path),10)}"
      "export async function deleteDoc(r){delete data[r.path];setTimeout(()=>fire(r.path),10)}")
    FBCFG = "{apiKey:'AIzaTest',authDomain:'t.firebaseapp.com',projectId:'t',appId:'1:2:web:3'}"
    def fb_device(seed_remote=None, preload_cfg=True, local_checks=None):
        c = b.new_context(viewport={'width': 1366, 'height': 900})
        for name, src in (('firebase-app.js', FB_APP), ('firebase-auth.js', FB_AUTH), ('firebase-firestore.js', FB_FS)):
            c.route('https://www.gstatic.com/firebasejs/*/' + name, (lambda body: (lambda r: r.fulfill(content_type='text/javascript', headers={'access-control-allow-origin': '*'}, body=body)))(src))
        c.route('https://open.spotify.com/**', lambda r: r.abort()); c.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        init = ''
        if seed_remote: init += "window.__fsdata={'users/u1':%s};" % json.dumps(seed_remote)
        if preload_cfg: init += "if(!localStorage.getItem('hk-companion-firebase'))localStorage.setItem('hk-companion-firebase',JSON.stringify(%s));" % FBCFG
        if local_checks: init += "if(!localStorage.getItem('hk-companion-state'))localStorage.setItem('hk-companion-state',JSON.stringify({version:1,checks:%s,resources:{geo:120,essence:0,grubs:0},updatedAt:new Date().toISOString()}));" % json.dumps({k: True for k in local_checks})
        if init: c.add_init_script(init)
        pg = c.new_page(); pg.on('pageerror', lambda e: errors.append('fb pageerror: ' + str(e))); pg.on('dialog', lambda d: d.accept())
        return c, pg
    # device 1: configure from the UI, sign in, progress is pushed
    c1, d1 = fb_device(preload_cfg=False)
    d1.goto(BASE + '#/save'); d1.wait_for_timeout(400)
    check('Account: without a Firebase config the card explains setup and accepts a pasted config', d1.locator('#fbConfig').count() == 1)
    d1.fill('#fbConfig', "const firebaseConfig = { apiKey: 'AIzaTest', authDomain: 't.firebaseapp.com', projectId: 't', appId: '1:2:web:3' };"); d1.click('[data-action=cloud-config]'); d1.wait_for_timeout(600)
    check('Account: sign-in options Google, GitHub and e-mail link', d1.locator('[data-action=cloud-in]').count() == 2 and d1.locator('#cloudEmail').count() == 1)
    d1.click('[data-action=cloud-in][data-id=google]'); d1.wait_for_timeout(700)
    check('Account: Google sign-in works; empty device + empty cloud writes nothing', d1.evaluate("HKApp.cloud.user().email") == 'athos@example.com' and d1.evaluate("window.__writes") == 0)
    d1.evaluate("HKApp.store.setCheck('mantis-claw', true)"); d1.wait_for_timeout(3000)
    remote1 = d1.evaluate("window.__fsdata['users/u1']")
    check('Account: a change is pushed to the account within seconds', remote1 and 'mantis-claw' in json.loads(remote1['state'])['checks'] and remote1['v'] == 1, remote1)
    check('Account: card shows signed-in state', 'athos@example.com' in d1.locator('.account-card').inner_text() and d1.locator('[data-action=cloud-out]').count() == 1)
    # device 2: brand-new, empty — must PULL, never overwrite
    c2, d2 = fb_device(seed_remote=remote1)
    d2.goto(BASE + '#/save'); d2.wait_for_timeout(500)
    d2.click('[data-action=cloud-in][data-id=github]'); d2.wait_for_timeout(900)
    check('Account: a new empty device pulls the account progress (GitHub login)', d2.evaluate("window.__popup") == 'github' and d2.evaluate("HKApp.engine.isDone('mantis-claw')"))
    check('Account: ...and never overwrites the cloud copy', d2.evaluate("window.__writes") == 0)
    # live update from another device
    r = json.loads(remote1['state']); r['checks']['crystal-heart'] = True; r['updatedAt'] = '2099-01-01T00:00:00.000Z'
    d2.evaluate("window.__remote('users/u1', {state: %s, updatedAt: '2099-01-01T00:00:00.000Z', v: 1})" % json.dumps(json.dumps(r))); d2.wait_for_timeout(500)
    check('Account: live update from another device is applied without reloading', d2.evaluate("HKApp.engine.isDone('crystal-heart')"))
    # conflict on first link
    c3, d3 = fb_device(seed_remote=remote1, local_checks=['kings-brand'])
    d3.goto(BASE + '#/save'); d3.wait_for_timeout(500)
    d3.click('[data-action=cloud-in][data-id=google]'); d3.wait_for_timeout(900)
    check('Account: both sides have different progress → asks what to keep, nothing overwritten yet', d3.locator('[data-action=cloud-resolve]').count() == 3 and d3.evaluate("window.__writes") == 0)
    d3.click('[data-action=cloud-resolve][data-id=merge]'); d3.wait_for_timeout(900)
    mg = json.loads(d3.evaluate("window.__fsdata['users/u1'].state"))['checks']
    check('Account: merge keeps both sides’ progress locally and in the cloud', d3.evaluate("HKApp.engine.isDone('kings-brand') && HKApp.engine.isDone('mantis-claw')") and 'kings-brand' in mg and 'mantis-claw' in mg, mg)
    # e-mail link
    c4, d4 = fb_device()
    d4.goto(BASE + '#/save'); d4.wait_for_timeout(500)
    d4.fill('#cloudEmail', 'not-an-email'); d4.click('[data-action=cloud-email]'); d4.wait_for_timeout(300)
    check('Account: invalid e-mail is rejected', d4.evaluate("window.__sent") is None and 'look right' in d4.locator('.account-card').inner_text())
    d4.fill('#cloudEmail', 'athos@example.com'); d4.click('[data-action=cloud-email]'); d4.wait_for_timeout(500)
    sent = d4.evaluate("window.__sent")
    check('Account: e-mail sign-in link requested for this site address', sent and sent['email'] == 'athos@example.com' and sent['s']['handleCodeInApp'] is True and sent['s']['url'] == BASE.split('#')[0], sent)
    d4.goto(BASE + '?oobCode=abc&mode=signIn&apiKey=k#/save'); d4.wait_for_timeout(1000)
    check('Account: opening the link signs in and cleans the address bar', d4.evaluate("HKApp.cloud.user() && HKApp.cloud.user().email") == 'athos@example.com' and 'oobCode' not in d4.url, d4.url)
    d4.click('[data-action=cloud-out]'); d4.wait_for_timeout(400)
    check('Account: sign out returns to the sign-in options', d4.locator('[data-action=cloud-in]').count() == 2)
    for cx in (c1, c2, c3, c4): cx.close()

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
