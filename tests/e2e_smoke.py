"""Quick browser smoke test: loads the page, collects console errors, takes screenshots."""
import sys, os
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else '.'
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [('desktop', {'width': 1440, 'height': 1000}), ('mobile', {'width': 390, 'height': 844})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1)
        page = ctx.new_page()
        page.on('console', lambda m: m.type in ('error', 'warning') and errors.append(f'{name} console {m.type}: {m.text}'))
        page.on('pageerror', lambda e: errors.append(f'{name} pageerror: {e}'))
        page.goto(URL)
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(OUT, f'{name}-dashboard.png'), full_page=True)
        for route in ['roadmap', 'regions', 'region/crystal-peak', 'checklist', 'trackers/essence', 'trackers/nail', 'save', 'audit']:
            page.goto(URL + '#/' + route); page.wait_for_timeout(250)
            page.screenshot(path=os.path.join(OUT, f'{name}-{route.replace("/", "_")}.png'), full_page=(name == 'desktop'))
        ctx.close()
    b.close()
print('\n'.join(errors) if errors else 'NO CONSOLE ERRORS')
