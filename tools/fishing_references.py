"""Compose decoded original poses before restoration; never cut generated art.

Every fishing pose is a complete original character/object composition. Original
procedural fishing-line pixels and water ripples stay separate scene effects.
"""
from pathlib import Path
import gzip, hashlib, json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT.parent / 'johnycastaway/web/dist/assets'
OUT = ROOT / 'web/dist/assets/fishing'
REF = ROOT / 'art/references/fishing'
OUT.mkdir(parents=True, exist_ok=True)
REF.mkdir(parents=True, exist_ok=True)
data = json.loads((ORIGINAL / 'original.json').read_text())
trace = json.loads((ROOT / 'artifacts/fishing-trace.json').read_text())
pixels = gzip.decompress((ORIGINAL / 'pixels.bin.gz').read_bytes())
palette = data['palette']

def decode(bank, index, flags=0):
    f = data['images'][bank][index]
    raw = pixels[f['offset']:f['offset'] + f['w']*f['h']]
    rgba = bytes(v for p in raw for v in ((0,0,0,0) if p == 0 else (*palette[p*3:p*3+3],255)))
    im = Image.frombytes('RGBA', (f['w'], f['h']), rgba)
    if flags & 1: im = im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    if flags & 2: im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return im

poses, images, seen, frames = [], [], {}, []
for frame in trace['frames']:
    sprites = [o for o in frame['ops'] if o['type'] == 'sprite' and o['bank'] != 'TRUNK.BMP']
    water = [o for o in sprites if o['bank'] == 'MJFISH1.BMP' and o['index'] in [24,25,26]]
    sprites = [o for o in sprites if o not in water]
    trunk = [i for i,o in enumerate(frame['ops']) if o.get('bank') == 'TRUNK.BMP']
    front = bool(trunk and trunk[-1] > max((i for i,o in enumerate(frame['ops']) if o in sprites), default=-1))
    result = {'time':frame['time'],'tick':frame['tick'],'sounds':frame['sounds'],
              'water':water,'lines':[o for o in frame['ops'] if o['type']=='pixels'],'trunkFront':front}
    if len(sprites) == 1 and sprites[0]['bank'] == 'JOHNWALK.BMP':
        result['walk'] = sprites[0]
    elif sprites:
        # Restore a whole pose; apply a shared scene occlusion only at playback.
        shared_clip = sprites[0]['clip'] if all(o['clip'] == sprites[0]['clip'] for o in sprites) else None
        x = min(o['x'] for o in sprites); y = min(o['y'] for o in sprites)
        right = max(o['x']+data['images'][o['bank']][o['index']]['w'] for o in sprites)
        bottom = max(o['y']+data['images'][o['bank']][o['index']]['h'] for o in sprites)
        im = Image.new('RGBA',(right-x,bottom-y))
        for o in sprites:
            part = decode(o['bank'],o['index'],o['flags'])
            cl,ct,cr,cb=[0,0,640,480] if shared_clip else o['clip']
            left=max(0,cl-o['x'],-o['x']);top=max(0,ct-o['y'],-o['y'])
            right=min(part.width,cr-o['x'],640-o['x']);bottom=min(part.height,cb-o['y'],480-o['y'])
            if right>left and bottom>top:
                im.alpha_composite(part.crop((left,top,right,bottom)),(o['x']-x+left,o['y']-y+top))
        digest=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()
        if digest not in seen:
            seen[digest]=len(poses); images.append(im)
            poses.append({'id':len(poses),'w':im.width,'h':im.height,'firstTime':frame['time'],
                          'sourcePixelHash':digest,'recipe':[dict(o,x=o['x']-x,y=o['y']-y) for o in sprites]})
        result['pose']={'id':seen[digest],'x':x,'y':y,'clip':shared_clip}
    frames.append(result)

groups=[]; cell=(176,136); margin=(8,8); factor=4
for start in range(0,len(poses),6):
    group=len(groups); sheet=Image.new('RGBA',(cell[0]*2,cell[1]*3))
    indices=list(range(start,min(start+6,len(poses))))
    for local,i in enumerate(indices):
        im=images[i]; assert im.width<=160 and im.height<=120, (i,im.size)
        x=(local%2)*cell[0]+margin[0]; y=(local//2)*cell[1]+margin[1]
        sheet.alpha_composite(im,(x,y));poses[i].update(group=group,sx=x,sy=y)
    source=f'source-{group:02}.png'; target=f'fish-{group:02}-target.png'
    sheet.save(OUT/source)
    sheet.resize((sheet.width*factor,sheet.height*factor),Image.Resampling.NEAREST).save(REF/target)
    groups.append({'id':group,'source':source,'target':target,'indices':indices,'canvas':list(sheet.size)})
water_sheet=Image.new('RGBA',(64*3,32))
for n,i in enumerate([24,25,26]):water_sheet.alpha_composite(decode('MJFISH1.BMP',i),(n*64,0))
water_sheet.save(OUT/'source-water.png')
output={'provenance':trace['provenance'],'duration':trace['duration'],'sounds':trace['sounds'],
        'palette':palette,'groups':groups,'poses':poses,'frames':frames,
        'sourceFiles':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.glob('source-*.png'))}}
(OUT/'source.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf8')
for filename in set(trace['sounds'].values()):
    (ROOT/'web/dist/assets'/filename).write_bytes((ORIGINAL/filename).read_bytes())
print(json.dumps({'completePoses':len(poses),'referenceSheets':len(groups),'frames':len(frames),'duration':trace['duration']}))
