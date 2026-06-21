# PHOTOREALISTIC 4K SETUP GUIDE

## STEP 1: Lighting Setup
1. Open Roblox Studio
2. Create new Script in **ServerScriptService**
3. Copy contents of `PHOTOREALISTIC_SETUP.lua`
4. Run game - lighting will auto-configure

## STEP 2: Material Library
1. Create ModuleScript in **ReplicatedStorage**
2. Name it `PBR_MATERIAL_LIBRARY`
3. Copy contents of `PBR_MATERIAL_LIBRARY.lua`

## STEP 3: Build City
1. Open Command Bar (View → Command Bar)
2. Copy entire `BUILD_CITY.lua` script
3. Paste and press Enter
4. City will generate with photorealistic materials

## STEP 4: Graphics Settings (Client)
1. Create LocalScript in **StarterPlayer → StarterPlayerScripts**
2. Add this code:
```lua
local UserSettings = UserSettings()
local GameSettings = UserSettings.GameSettings
GameSettings.SavedQualityLevel = Enum.SavedQualitySetting.Automatic
```

## STEP 5: Performance Optimization
- Enable **StreamingEnabled** in Workspace
- Set **StreamingMinRadius** = 128
- Set **StreamingTargetRadius** = 512

## REQUIRED SETTINGS
- Lighting.Technology = **Future** (required for PBR)
- Workspace.GlobalShadows = **true**
- Player graphics level = **10** (automatic)

## FEATURES INCLUDED
✓ Future lighting engine (PBR support)
✓ 4K skybox with HDR
✓ Volumetric atmosphere
✓ Dynamic shadows
✓ Bloom & sun rays
✓ Depth of field
✓ Color correction
✓ PBR materials (glass, metal, concrete, brick)
✓ Procedural city generation
✓ Street lighting system

## PERFORMANCE NOTES
- Targets 60 FPS on high-end PCs
- Auto-adjusts for lower-end devices
- Uses LOD (Level of Detail) streaming
- Shadows may impact mobile performance

## TESTING
1. Set Graphics Quality to **10** in Studio
2. Enable **Lighting Technology: Future**
3. Test in daytime (14:00) and night (22:00)
4. Verify reflections on glass/metal surfaces

Your game now has **photorealistic 4K visuals** ready for players!
