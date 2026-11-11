"""Measure selected, untouched generated sheets; write runtime registration metadata."""
from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'web/dist/assets/fishing'
source=json.loads((BASE/'source.json').read_text())
groups=[]; poses=[]
for group in source['groups']:
    name=f"restored-{group['id']:02}.png"
    im=Image.open(BASE/name).convert('RGBA')
    original=Image.open(BASE/group['source'])
    groups.append({'id':group['id'],'file':name,'size':list(im.size),'sha256':hashlib.sha256((BASE/name).read_bytes()).hexdigest()})
    for local,i in enumerate(group['indices']):
        p=source['poses'][i]
        # Sheet 13 retained the empty bottom area but moved its second row upward.
        rowHeight=400 if group['id']==13 else im.height/3
        cx=round((local%2)*im.width/2);cy=round((local//2)*rowHeight)
        cell=im.crop((cx,cy,round((local%2+1)*im.width/2),round((local//2+1)*rowHeight)))
        bounds=cell.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
        raw=original.crop((p['sx'],p['sy'],p['sx']+p['w'],p['sy']+p['h']))
        sb=raw.getchannel('A').getbbox()
        assert bounds and sb,(group['id'],i)
        sx=(bounds[2]-bounds[0])/(sb[2]-sb[0]);sy=(bounds[3]-bounds[1])/(sb[3]-sb[1])
        # Register the complete drawing to its original box, never individual limbs.
        poses.append({'id':i,'crop':[cx+bounds[0]-sb[0]*sx,cy+bounds[1]-sb[1]*sy,p['w']*sx,p['h']*sy]})
water=Image.open(BASE/'restored-water.png');original=Image.open(BASE/'source-water.png');waterCrops=[]
for n,(w,h) in enumerate([(40,9),(48,14),(56,17)]):
    y=round(n*water.height/3)
    gb=water.crop((0,y,water.width,round((n+1)*water.height/3))).getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
    sb=original.crop((n*64,0,n*64+w,h)).getchannel('A').getbbox()
    sx=(gb[2]-gb[0])/(sb[2]-sb[0]);sy=(gb[3]-gb[1])/(sb[3]-sb[1])
    waterCrops.append([gb[0]-sb[0]*sx,y+gb[1]-sb[1]*sy,w*sx,h*sy])
waterMeta={'file':'restored-water.png','sha256':hashlib.sha256((BASE/'restored-water.png').read_bytes()).hexdigest(),'crops':waterCrops}
(BASE/'restored.json').write_text(json.dumps({'mode':'built-in imagegen','groups':groups,'poses':poses,'water':waterMeta},indent=2)+'\n')
print(f'Registered {len(poses)} complete poses in {len(groups)} untouched sheets')
