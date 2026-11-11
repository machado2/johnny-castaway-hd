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
            left, top = round(col * image.width / columns), round(row * image.height / rows)
            right, bottom = round((col+1) * image.width / columns), round((row+1) * image.height / rows)
            cell = alpha.crop((left, top, right, bottom))
            box = cell.point(lambda a: 255 if a > 160 else 0).getbbox()
            if not box:
                raise ValueError(f'Empty frame {filename}:{len(frames)}')
            x0, y0, x1, y1 = box
            # Determine a stable body anchor, excluding swinging hands and feet.
            band = (.34, .54) if kind == 'walk' else (.54, .72) if kind == 'fish' else (.92, .98)
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
            if kind == 'fish':
                tips = [(x,y) for x in range(x0,min(x0+4,x1)) for y in range(y0,y1) if pixels[x,y]>160]
                frames[-1]['rodTip'] = [round(sum(p[0] for p in tips)/len(tips)-sx,3),
                                       round(sum(p[1] for p in tips)/len(tips)-sy,3)]
    return {'file':filename, 'width':image.width, 'height':image.height, 'frames':frames,
            'sha256':hashlib.sha256((ASSETS/filename).read_bytes()).hexdigest()}


if __name__ == '__main__':
    data = {
        'version':1,
        'description':'HD visual pilot. Newly authored artwork, not original extracted sprites.',
        'assets':{
            'island':describe('island.png'),
            'palm':describe('palm.png'),
            'walk':describe('johnny-walk.png', 4, 4, 'walk'),
        }
    }
    if (ASSETS/'johnny-fish.png').exists():
        data['assets']['fish'] = describe('johnny-fish.png', 4, 2, 'fish')
    (ASSETS/'manifest.json').write_text(json.dumps(data, indent=2)+'\n', encoding='utf8')
    print({name:len(asset['frames']) for name,asset in data['assets'].items()})
