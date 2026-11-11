"""Record selected unmodified image outputs and their reference mappings."""
from pathlib import Path
import hashlib,json
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'web/dist/assets/fidelity'
source=json.loads((BASE/'source.json').read_text())
names=['island','palm','ocean','walk-a','walk-b','turn-a','turn-b','turn-c','turn-d','turn-e']
files={name:f'restored-{name}.png' for name in names}
manifest={
    'files':files,
    'restoredFrames':sorted({i for name in names for i in source['references'][name].get('indices',[])}),
    'sha256':{name:hashlib.sha256((BASE/file).read_bytes()).hexdigest() for name,file in files.items()},
    'dimensions':{name:list(Image.open(BASE/file).size) for name,file in files.items()},
}
(BASE/'restored.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'{len(files)} selected images, {len(manifest["restoredFrames"])} restored poses')
