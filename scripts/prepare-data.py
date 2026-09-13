"""Generate public ephemeris data from the existing verified skill. No birth records."""
from pathlib import Path
import base64
import hashlib
import io
import json
import sys
import tarfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'skills' / 'astronomy-astrology' / 'scripts'))
import calculate

def get(url):
    with urlopen(url, timeout=30) as response:
        return response.read()

assets = ROOT / 'public' / 'assets'
assets.mkdir(parents=True, exist_ok=True)
meta = json.loads(get('https://registry.npmjs.org/korean-lunar-calendar/0.4.0'))
blob = get(meta['dist']['tarball'])
actual = 'sha512-' + base64.b64encode(hashlib.sha512(blob).digest()).decode()
assert actual == meta['dist']['integrity']
with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as archive:
    for source, output in [('package/dist/korean-lunar-calendar.mjs','korean-lunar-calendar.mjs'), ('package/LICENSE','korean-lunar-calendar-LICENSE.txt')]:
        (assets / output).write_bytes(archive.extractfile(source).read())

(assets / 'neodgm.woff2').write_bytes(get('https://github.com/neodgm/neodgm/releases/download/v1.601/neodgm.woff2'))
tree = json.loads(get('https://api.github.com/repos/neodgm/neodgm/git/trees/main?recursive=1'))
licenses = [x['path'] for x in tree.get('tree',[]) if 'license' in x['path'].lower() or 'ofl' in x['path'].lower()]
print('Font license files:', licenses, flush=True)
if not licenses:
    raise RuntimeError('Find and preserve font license before distribution')
(assets / 'neodgm-LICENSE.txt').write_bytes(get('https://raw.githubusercontent.com/neodgm/neodgm/main/' + licenses[0]))

terms = {str(year): [[name, longitude, round(moment.timestamp()*1000)]
                     for name, longitude, moment in calculate.term_times(year)]
         for year in range(1899,2052)}
payload = dict(source='Astronomy Engine 2.1.19 / astronomy-astrology calculate.py 1.0.0',
               generated_utc=calculate.datetime.now(calculate.UTC).isoformat(), terms=terms)
(assets / 'solar-terms.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',',':')), encoding='utf-8')
print('Generated', sum(map(len, terms.values())), 'solar term instants', flush=True)

fixtures=[]
for year in [1900,1956,1988,2000,2026]:
    for month in [1,2,6,9,12]:
        for hour in [0,12,23]:
            local=f'{year}-{month:02}-15T{hour:02}:30:00'
            result=calculate.saju(local,'Asia/Seoul','midnight')
            fixtures.append(dict(local=local, zone='Asia/Seoul',pillars=result['pillars']))
tests=ROOT / 'tests'
tests.mkdir(exist_ok=True)
(tests/'python-fixtures.json').write_text(json.dumps(fixtures,ensure_ascii=False),encoding='utf-8')
