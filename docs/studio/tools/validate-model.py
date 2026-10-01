"""Check model integrity and that the actual original image survives the 3D export."""
import io
import json
import struct
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[3]
studio = root / 'docs/studio'
source = root / 'assets/pin-shot-vsl.jpeg'
assert source.read_bytes() == (studio / 'vsl-source.jpeg').read_bytes(), 'Source JPEG changed'
raw = (studio / 'models/pin-shot-vsl.glb').read_bytes()
assert struct.unpack_from('<III', raw) == (0x46546C67, 2, len(raw)), 'Invalid GLB header'
json_length = struct.unpack_from('<I', raw, 12)[0]
doc = json.loads(raw[20:20 + json_length])
binary = raw[28 + json_length:]
assert len(doc['images']) == 1
view = doc['bufferViews'][doc['images'][0]['bufferView']]
start = view.get('byteOffset', 0)
embedded = Image.open(io.BytesIO(binary[start:start + view['byteLength']])).convert('RGB')
# GLTFExporter flips the image to account for glTF's texture coordinate convention.
embedded = embedded.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
original = Image.open(source).convert('RGB')
assert embedded.size == original.size
assert ImageChops.difference(embedded, original).getbbox() is None, 'Original texture pixels changed'
assert all('KHR_materials_unlit' in m.get('extensions', {}) for m in doc['materials'])

def accessor(index):
    a = doc['accessors'][index]
    v = doc['bufferViews'][a['bufferView']]
    assert a['componentType'] == 5126
    width = {'VEC2': 2, 'VEC3': 3}[a['type']]
    stride = v.get('byteStride', width * 4)
    offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [struct.unpack_from('<' + 'f' * width, binary, offset + i * stride) for i in range(a['count'])]

front_count = 0
for node in doc['nodes']:
    if node.get('name') != 'Exact source-image front':
        continue
    attrs = doc['meshes'][node['mesh']]['primitives'][0]['attributes']
    positions, uvs = accessor(attrs['POSITION']), accessor(attrs['TEXCOORD_0'])
    for (x, y, z), (u, v) in zip(positions, uvs):
        assert abs(u - (x * 250 + 411.5) / 823) < 1e-6
        assert abs(v - y * 250 / 1024) < 1e-6
    assert max(p[2] for p in positions) > .5, 'The bottle must have actual depth'
    front_count += 1
assert front_count == 2
print(f'PASS: {len(doc["meshes"])} meshes; original photo pixels unchanged; front UV projection matches source; full 3D depth; valid {len(raw):,}-byte GLB.')
