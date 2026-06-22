# 1-Click Hat Equip System

## Setup Steps:

### 1. Add Hat Model to Studio
1. Open Roblox Studio → BloxVille place
2. Toolbox → My Models → Insert your "High-fidelity Roblox-ready 3D UGC hat"
3. Put the hat model in **ReplicatedStorage**
4. Rename it to **"BlueHoodHat"**

### 2. Insert Scripts
1. **ServerScriptService** → Insert new Script → Copy `ServerScripts/HatSystem.lua`
2. **StarterPlayer → StarterPlayerScripts** → Insert new LocalScript → Copy `ClientScripts/HatButton.lua`

### 3. Test
- Play game
- Click "🎩 Equip Blue Hood" button (top-right corner)
- Hat appears on your character

## How It Works:
- Button in top-right corner
- 1 click = instant hat equip
- Works only in your game
- Persists until player resets/leaves
