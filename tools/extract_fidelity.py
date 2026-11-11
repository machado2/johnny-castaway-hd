"""Extract reference pixels and coordinates from our original resource decoder.

This copies decoded source pixels; it does not redraw or edit generated artwork.
"""
from pathlib import Path
import gzip,json,hashlib
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'johnycastaway/web/dist/assets'
OUT=ROOT/'web/dist/assets/fidelity'
REF=ROOT/'art/references'
OUT.mkdir(parents=True,exist_ok=True);REF.mkdir(parents=True,exist_ok=True)
data=json.loads((SOURCE/'original.json').read_text())
story=json.loads((SOURCE/'story.json').read_text())
pixels=gzip.decompress((SOURCE/'pixels.bin.gz').read_bytes())
palette=data['palette']

def frame(bank,index,transparent=True):
    f=data['images'][bank][index]
    raw=pixels[f['offset']:f['offset']+f['w']*f['h']]
    rgba=bytes(v for p in raw for v in ((0,0,0,0) if p==0 and transparent else (*palette[p*3:p*3+3],255)))
    return Image.frombytes('RGBA',(f['w'],f['h']),rgba)

def enlarged_reference(image,filename,box=(1536,1024),factor=4):
    # Reproduce integer blocks directly from decoded bytes as an editing target.
    w,h=box;x=(w-image.width*factor)//2;y=(h-image.height*factor)//2
    result=Image.new('RGBA',box)
    src=image.load();dst=result.load()
    for sy in range(image.height):
        for sx in range(image.width):
            for yy in range(factor):
                for xx in range(factor):dst[x+sx*factor+xx,y+sy*factor+yy]=src[sx,sy]
    result.save(REF/filename)
    return {'file':filename,'canvas':[w,h],'box':[x,y,image.width*factor,image.height*factor],'factor':factor}

island=frame('BACKGRND.BMP',0)
island.alpha_composite(frame('BACKGRND.BMP',14),(397-289,279-279))
island.save(OUT/'source-island.png')
palm=Image.new('RGBA',(152,171))
palm.alpha_composite(frame('BACKGRND.BMP',13),(443-366,148-122))
palm.alpha_composite(frame('BACKGRND.BMP',12),(0,0))
palm.save(OUT/'source-palm.png')
ocean=frame('OCEAN00.SCR',0,False);ocean.save(OUT/'source-ocean.png')

refs={'island':enlarged_reference(island,'island-target.png',factor=5),
      'palm':enlarged_reference(palm,'palm-target.png',factor=5)}
ocean.save(REF/'ocean-target.png')
refs['ocean']={'file':'ocean-target.png','canvas':[640,480],'box':[0,0,640,480],'factor':1}

# Equal 96x96 logical cells retain original frame margins; no bounding-box centering.
walk=Image.new('RGBA',(96*6,96*6))
frames=[]
for i in range(36):
    im=frame('JOHNWALK.BMP',i);x=(i%6)*96+24;y=(i//6)*96+10
    walk.alpha_composite(im,(x,y))
    frames.append({'index':i,'x':x,'y':y,'w':im.width,'h':im.height})
walk.save(OUT/'source-walk.png')
# Eight lateral poses in two small four-pose sheets at a useful editing scale.
for group,indices in [('walk-a',[1,2,3,4]),('walk-b',[5,6,7,8]),('turn-a',[0,9,10,12]),('turn-b',[15,16,17,18]),('turn-c',[11,19,22,23]),('turn-d',[20,21,24,25]),('turn-e',[26,27,28,29])]:
    sheet=Image.new('RGBA',(192,192))
    for cell,i in enumerate(indices):sheet.alpha_composite(frame('JOHNWALK.BMP',i),((cell%2)*96+24,(cell//2)*96+10))
    refs[group]=enlarged_reference(sheet,group+'-target.png',box=(1536,1536),factor=8)
    refs[group]['indices']=indices

manifest={'sourceHashes':data['sources'],'references':refs,'walkFrames':frames,
          'island':{'x':289,'y':279,'w':280,'h':52},'palm':{'x':366,'y':122,'w':152,'h':171},
          'walks':story['walks'],'standing':story['standing_walk_by_position'],'turning':story['turning_walk_by_position'],
          'sourceFiles':{}}
for file in OUT.glob('source-*.png'):manifest['sourceFiles'][file.name]=hashlib.sha256(file.read_bytes()).hexdigest()
(OUT/'source.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8',newline='\n')
print('Extracted original island, palm, ocean and 36 Johnny poses with source coordinates.')
