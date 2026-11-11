"""Independently check composed source poses against recorded original sprite blits."""
from pathlib import Path
from functools import lru_cache
import gzip,json
from PIL import Image,ImageChops
root=Path(__file__).resolve().parents[1]
base=root/'web/dist/assets/fishing'
original=root.parent/'johnycastaway/web/dist/assets'
trace=json.loads((root/'artifacts/fishing-trace.json').read_text())
source=json.loads((base/'source.json').read_text())
assets=json.loads((original/'original.json').read_text())
pixels=gzip.decompress((original/'pixels.bin.gz').read_bytes())
@lru_cache(None)
def decode(bank,index,flags):
    p=assets['images'][bank][index];raw=pixels[p['offset']:p['offset']+p['w']*p['h']]
    pal=assets['palette'];im=Image.frombytes('RGBA',(p['w'],p['h']),bytes(c for v in raw for c in ((*pal[v*3:v*3+3],255) if v else (0,0,0,0))))
    if flags&1:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    if flags&2:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return im
def clipped_sprite(im,x,y,clip):
    out=Image.new('RGBA',(640,480));out.alpha_composite(im,(x,y))
    cl,ct,cr,cb=clip;cl=max(0,cl);ct=max(0,ct);cr=min(640,cr);cb=min(480,cb)
    result=Image.new('RGBA',out.size);result.paste(out.crop((cl,ct,cr,cb)),(cl,ct));return result
sheets=[Image.open(base/g['source']) for g in source['groups']]
for n,(frame,f) in enumerate(zip(trace['frames'],source['frames'])):
    expected=Image.new('RGBA',(640,480))
    for op in frame['ops']:
        if op['type']!='sprite' or op['bank']=='TRUNK.BMP' or (op['bank']=='MJFISH1.BMP' and op['index'] in [24,25,26]):continue
        expected.alpha_composite(clipped_sprite(decode(op['bank'],op['index'],op['flags']),op['x'],op['y'],op['clip']))
    if 'pose' in f:
        p=source['poses'][f['pose']['id']];im=sheets[p['group']].crop((p['sx'],p['sy'],p['sx']+p['w'],p['sy']+p['h']))
        actual=clipped_sprite(im,f['pose']['x'],f['pose']['y'],f['pose']['clip'] or [0,0,640,480])
    else:
        op=f['walk'];actual=clipped_sprite(decode(op['bank'],op['index'],op['flags']),op['x'],op['y'],op['clip'])
    assert expected.tobytes()==actual.tobytes(),f'Original source mismatch at presentation {n}'
print(f'{len(source["frames"])} source presentations match the original sprite operations exactly')
