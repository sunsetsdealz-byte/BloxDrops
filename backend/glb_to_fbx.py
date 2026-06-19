"""Headless Blender script: convert input GLB → FBX.

Invoked via:
    blender --background --python glb_to_fbx.py -- <input.glb> <output.fbx>

The script clears the default scene, imports the GLB, then exports as FBX
using the embedded-textures + binary settings most compatible with Roblox
Studio's Import 3D + Open Cloud Assets API.
"""
import sys
import bpy

# argv after "--" is our args
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = []

if len(argv) < 2:
    print("[glb_to_fbx] usage: blender -b -P glb_to_fbx.py -- input.glb output.fbx", flush=True)
    sys.exit(1)

input_path = argv[0]
output_path = argv[1]

# Wipe default scene (camera, light, cube)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Also remove any orphan data blocks for a totally clean slate
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.textures, bpy.data.images, bpy.data.armatures):
    for item in list(block):
        block.remove(item)

# Import GLB
print(f"[glb_to_fbx] importing {input_path}", flush=True)
bpy.ops.import_scene.gltf(filepath=input_path)

# Apply a uniform scale of 0.01 to match Roblox stud system
# Roblox 1 stud = 0.28 meters; fal.ai Tripo outputs ~1m models. Scaling 0.01
# lands the model in the ~3-30 stud range which is appropriate for accessories.
for obj in bpy.context.scene.objects:
    if obj.type in ("MESH", "ARMATURE", "EMPTY"):
        obj.scale = (0.01, 0.01, 0.01)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Export FBX with Roblox-friendly settings
print(f"[glb_to_fbx] exporting {output_path}", flush=True)
bpy.ops.export_scene.fbx(
    filepath=output_path,
    use_selection=False,
    apply_unit_scale=True,
    apply_scale_options="FBX_SCALE_ALL",
    path_mode="COPY",
    embed_textures=True,
    bake_anim=False,  # accessories don't carry animations
    add_leaf_bones=False,
    object_types={"MESH", "ARMATURE", "EMPTY"},
    mesh_smooth_type="FACE",
    use_mesh_modifiers=True,
    axis_forward="-Z",
    axis_up="Y",
)
print(f"[glb_to_fbx] done", flush=True)
