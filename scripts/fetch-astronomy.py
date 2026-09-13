import urllib.request, json, io, tarfile, hashlib, base64
from pathlib import Path
root = Path(__file__).resolve().parents[1]
meta = json.load(urllib.request.urlopen('https://registry.npmjs.org/astronomy-engine/2.1.19'))
blob = urllib.request.urlopen(meta['dist']['tarball']).read()
assert 'sha512-'+base64.b64encode(hashlib.sha512(blob).digest()).decode() == meta['dist']['integrity']
with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as archive:
    for source, target in [('package/esm/astronomy.js','astronomy.mjs')]:
        (root/'lib'/target).write_bytes(archive.extractfile(source).read())
source=(root/'lib'/'astronomy.mjs').read_text(encoding='utf-8')
(root/'lib'/'astronomy-LICENSE.txt').write_text(source[:source.index('*/')+2],encoding='utf-8')
print('Astronomy Engine 2.1.19 integrity verified')
