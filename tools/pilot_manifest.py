"""Inspect generated sprite alpha and write frame metadata without modifying art."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'web/dist/assets/pilot'


def describe(filename, columns=1, rows=1, kind='prop'):
    image = Image.open(ASSETS / filename).convert('RGBA')
    alpha = image.getchannel('A')
    if alpha.getextrema()[0] != 0:
        raise ValueError(f'{filename} has no fully transparent background')
    frames = []
    for row in range(rows):
        for col in range(columns):
            edges = [0,round(image.height*.56),image.height] if kind=='rig' else [round(r*image.height/rows) for r in range(rows+1)]
            left, top = round(col * image.width / columns), edges[row]
            right, bottom = round((col+1) * image.width / columns), edges[row+1]
            cell = alpha.crop((left, top, right, bottom))
            box = cell.point(lambda a: 255 if a > 160 else 0).getbbox()
            if not box:
                raise ValueError(f'Empty frame {filename}:{len(frames)}')
            x0, y0, x1, y1 = box
            # Determine the bottom attachment anchor of each isolated part.
            band = (.92, .98)
            sample_top = y0 + int((y1-y0)*band[0])
            sample_bottom = y0 + int((y1-y0)*band[1])
            points = []
            pixels = cell.load()
            for y in range(sample_top, max(sample_top+1, sample_bottom)):
                for x in range(x0, x1):
                    if pixels[x,y] > 200:
                        points.append(x)
            anchor = sum(points) / len(points) if points else (x0+x1)/2
            # Padding preserves antialiased edges and stays inside the grid cell.
            sx, sy = max(0, x0-3), max(0, y0-3)
            ex, ey = min(cell.width, x1+3), min(cell.height, y1+3)
            frames.append({'x':left+sx, 'y':top+sy, 'w':ex-sx, 'h':ey-sy,
                           'anchorX':round(anchor-sx, 3), 'anchorY':y1-sy,
                           'bodyHeight':y1-y0})
    return {'file':filename, 'width':image.width, 'height':image.height, 'frames':frames,
            'sha256':hashlib.sha256((ASSETS/filename).read_bytes()).hexdigest()}


if __name__ == '__main__':
    data = {
        'version':1,
        'description':'HD visual pilot. Newly authored artwork, not original extracted sprites.',
        'assets':{
            'island':describe('island.png'),
            'palm':describe('palm.png'),
            'rig':describe('johnny-rig.png', 3, 2, 'rig'),
        }
    }
    im=Image.open(ASSETS/'ocean.png')
    data['assets']['ocean']={'file':'ocean.png','width':im.width,'height':im.height,
                            'frames':[], 'sha256':hashlib.sha256((ASSETS/'ocean.png').read_bytes()).hexdigest()}
    (ASSETS/'manifest.json').write_text(json.dumps(data, indent=2)+'\n', encoding='utf8', newline='\n')
    print({name:len(asset['frames']) for name,asset in data['assets'].items()})
