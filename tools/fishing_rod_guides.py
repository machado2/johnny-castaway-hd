"""Extract the original carried rod's alpha as contour guides, never as artwork."""
from pathlib import Path
import gzip
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT.parent / 'johnycastaway/web/dist/assets'
metadata = (ORIGINAL / 'original.json').read_bytes()
compressed = (ORIGINAL / 'pixels.bin.gz').read_bytes()
data = json.loads(metadata)
pixels = gzip.decompress(compressed)
guides = {}
for index in (22, 23):
    frame = data['images']['MJFISH1.BMP'][index]
    raw = pixels[frame['offset']:frame['offset'] + frame['w'] * frame['h']]
    runs = []
    for y in range(frame['h']):
        x = 0
        while x < frame['w']:
            if not raw[y * frame['w'] + x]:
                x += 1
                continue
            start = x
            while x < frame['w'] and raw[y * frame['w'] + x]:
                x += 1
            runs.append([y, start, x - start])
    guides[str(index)] = {'w': frame['w'], 'h': frame['h'], 'runs': runs}
output = {
    'bank': 'MJFISH1.BMP',
    'sourceHashes': {
        'original.json': hashlib.sha256(metadata).hexdigest(),
        'pixels.bin.gz': hashlib.sha256(compressed).hexdigest(),
    },
    'guides': guides,
}
(ROOT / 'web/dist/assets/fishing/rod-guides.json').write_text(
    json.dumps(output, separators=(',', ':')) + '\n', encoding='utf8')
print({index: len(guide['runs']) for index, guide in guides.items()})
