import struct
import json

with open('frontend/public/models/heart.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    chunk_data = f.read(chunk_len)
    gltf = json.loads(chunk_data.decode('utf-8'))
    
print('GLTF version:', gltf.get('asset'))
nodes = gltf.get('nodes', [])
meshes = gltf.get('meshes', [])
materials = gltf.get('materials', [])
print(f'Total nodes: {len(nodes)}')
print(f'Total meshes: {len(meshes)}')
print(f'Total materials: {len(materials)}')

print("\n--- ALL NODES ---")
for i, node in enumerate(nodes):
    print(f"Node {i}: name='{node.get('name')}', mesh_idx={node.get('mesh')}, children={node.get('children')}")

print("\n--- ALL MESHES ---")
for i, m in enumerate(meshes):
    print(f"Mesh {i}: name='{m.get('name')}', primitives={len(m.get('primitives', []))}")

print("\n--- ALL MATERIALS ---")
for i, mat in enumerate(materials):
    print(f"Material {i}: name='{mat.get('name')}'")
