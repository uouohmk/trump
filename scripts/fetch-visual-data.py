from pathlib import Path
import urllib.request,urllib.parse,json,re,html,time
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'public/assets'
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'StarlightConsultation/1.0 (educational constellation and public-domain tarot assets)'})
    for attempt in range(4):
        try:return urllib.request.urlopen(req,timeout=40).read()
        except urllib.error.HTTPError as error:
            if error.code!=429 or attempt==3:raise
            time.sleep(10*(attempt+1))
ids=['Ari','Tau','Gem','Cnc','Leo','Vir','Lib','Sco','Sgr','Cap','Aqr','Psc']
data=json.loads(get('https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json'))
lines={f['id']:f['geometry']['coordinates'] for f in data['features'] if f['id'] in ids}
assert len(lines)==12
(ASSETS/'zodiac-lines.json').write_text(json.dumps(lines,separators=(',',':')),encoding='utf-8')
(ASSETS/'d3-celestial-LICENSE.txt').write_bytes(get('https://raw.githubusercontent.com/ofrohn/d3-celestial/master/LICENSE'))
print('Constellation lines: 12',flush=True)
page=get('https://en.wikipedia.org/wiki/Rider%E2%80%93Waite_Tarot').decode()
names=sorted(set(urllib.parse.unquote(x) for x in re.findall(r'RWS_Tarot_\d\d_[^"/<>]+?\.jpg',page)))
print(names,flush=True)
(ASSETS/'tarot').mkdir(exist_ok=True)
manifest=[]
for name in names:
    number=int(name.split('_')[2])
    if number>21:continue
    filepage='https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(name)
    source=get(filepage).decode()
    assert 'public domain' in source.lower(), name
    match=re.search(r'class="fullImageLink"[^>]*>\s*<a href="([^"]+)"',source)
    if not match:raise RuntimeError('No original image link: '+name)
    url=html.unescape(match.group(1));out=ASSETS/'tarot'/f'{number:02}.jpg'
    if not out.exists():out.write_bytes(get(url))
    manifest.append({'index':number,'file':f'{number:02}.jpg','source':filepage,'image':url,'artist':'Pamela Colman Smith','license':'Public domain, original Rider-Waite-Smith artwork'})
    print('Tarot',number,flush=True)
    time.sleep(2)
assert len(manifest)==22, len(manifest)
(ASSETS/'tarot/sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
