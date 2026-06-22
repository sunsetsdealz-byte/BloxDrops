# 🍕 BloxVille - Rojo Sync Project

## Quick Start (3 Steps!)

### 1️⃣ Start Rojo Server
**Option A:** Double-click `START_ROJO.bat`

**Option B:** Run in terminal:
```bash
cd C:\bloxdrops\roblox-game\bloxville-sync
rojo serve
```

You should see: `Rojo server listening on port 34872`

### 2️⃣ Connect in Roblox Studio
1. Open Roblox Studio
2. Open your place or create a new one
3. Find the **Rojo** plugin in the toolbar
4. Click **Connect**
5. Click **Sync In**

### 3️⃣ Test Your Game!
Press **Play** in Studio and you'll see:
- ✅ Background music playing (lofi beats)
- ✅ Black welcome banner with game info
- ✅ All game systems ready to go!

---

## What's Included

### 🎵 Background Music System
- Lofi beats play automatically on loop
- Volume set to 0.3 (30%)
- Managed by `SoundManager.lua`
- Sound ID: `rbxassetid://1843404009`

### 🎨 Welcome Screen (Black Banner)
- Semi-transparent black overlay
- Neon green "BLOXVILLE" logo
- Feature list with emojis
- "START PLAYING" button
- Smooth animations
- Defined in `WelcomeScreen.lua`

### 🏙️ Complete City System
- Pizza shop with neon sign
- Job system (Pizza Delivery, etc.)
- Vehicle spawning
- House ownership
- NPC system
- Street lights
- Day/night cycle

### 🎮 Full UI System
- HUD with money/level
- Job menus
- Shop interface
- Vehicle spawner
- Notification system
- Team selection

---

## File Structure

```
bloxville-sync/
├── START_ROJO.bat              # Quick start script
├── README.md                   # This file
├── SYNC_GUIDE.md              # Detailed sync guide
├── default.project.json        # Rojo configuration
│
└── ../BloxVille/              # Source files (auto-synced)
    ├── ClientScripts/
    │   ├── SoundManager.lua        # 🎵 Background music
    │   ├── WelcomeScreen.lua       # 🎨 Black banner
    │   ├── HUD.lua
    │   ├── UIController.lua
    │   ├── MainUI.lua
    │   ├── MenuSystem.lua
    │   ├── NotificationUI.lua
    │   ├── JobMenuUI.lua
    │   ├── ShopUI.lua
    │   ├── TeamSelectionUI.lua
    │   ├── VehicleMenuUI.lua
    │   ├── PizzaDeliveryUI.lua
    │   └── ClientInit.lua
    │
    ├── ServerScripts/
    │   ├── GameInitializer.lua
    │   ├── MapBuilder.lua
    │   ├── JobSystem.lua
    │   ├── VehicleSpawner.lua
    │   ├── VehicleModels.lua
    │   ├── PizzaDeliverySystem.lua
    │   ├── HousingSystem.lua
    │   ├── DataStore.lua
    │   ├── EventsSetup.lua
    │   ├── SpawnManager.lua
    │   ├── NPCSystem.lua
    │   ├── LightingSetup.lua
    │   ├── StreetLights.lua
    │   ├── AmbientSounds.lua
    │   ├── ProximityPromptSetup.lua
    │   └── WelcomeSystem.lua
    │
    └── Modules/
        ├── Config.lua
        └── NeonPizzaSign.lua
```

---

## Customization

### Change Background Music
1. Open `../BloxVille/ClientScripts/SoundManager.lua`
2. Find line: `BackgroundMusic = "rbxassetid://1843404009"`
3. Replace with your sound ID
4. Save (auto-syncs to Studio!)

### Modify Welcome Screen
1. Open `../BloxVille/ClientScripts/WelcomeScreen.lua`
2. Edit:
   - Title text (line ~48)
   - Subtitle (line ~59)
   - Features list (lines ~69-76)
   - Colors (search for `Color3.fromRGB`)
3. Save and test in Studio!

### Adjust Music Volume
In `SoundManager.lua`, change:
```lua
local volume = (name == "BackgroundMusic") and 0.3 or 0.5
```
Change `0.3` to your preferred volume (0.0 to 1.0)

---

## How Rojo Works

### The Magic ✨
1. You edit files in `BloxVille/` folder
2. Rojo detects the changes
3. Changes sync to Studio instantly
4. No copy/paste needed!

### What Syncs Where
- `ClientScripts/` → StarterPlayer > StarterPlayerScripts > BloxVille
- `ServerScripts/` → ServerScriptService > BloxVille  
- `Modules/` → ReplicatedStorage > Modules

### Live Development
- Edit code in VS Code (or any editor)
- See changes in Studio immediately
- Use version control (Git)
- Collaborate with team

---

## Troubleshooting

### ❌ Rojo plugin not found
Run in terminal:
```bash
rojo plugin install
```
Then restart Roblox Studio

### ❌ Connection refused
- Make sure `rojo serve` is running
- Check the terminal shows "listening on port 34872"
- Try restarting the server

### ❌ Scripts not appearing
- Click "Sync In" in the Rojo plugin
- Check Output window for errors
- Verify file paths in `default.project.json`

### ❌ Music not playing
- Check SoundService in Explorer
- Look for "BackgroundMusic" sound
- Verify sound ID is valid
- Check volume isn't 0

### ❌ Welcome screen not showing
- Check Output for errors
- Verify WelcomeScreen.lua is in StarterPlayerScripts
- Try rejoining the game (press Stop then Play)

---

## Features Breakdown

### 🎵 Sound System
- Background music (lofi beats)
- UI click sounds
- Job completion sounds
- Vehicle engine sounds
- Notification sounds
- Level up fanfare

### 🎨 UI Elements
- **Welcome Screen**: First-time player experience
- **HUD**: Money, level, job status
- **Job Menu**: Select and manage jobs
- **Shop**: Buy items and upgrades
- **Vehicle Menu**: Spawn and manage vehicles
- **Notifications**: Toast-style alerts

### 🏙️ Game Systems
- **Jobs**: Pizza delivery, more coming
- **Economy**: Earn and spend money
- **Vehicles**: Unlock and drive cars
- **Housing**: Buy and customize homes
- **Progression**: Level up system
- **NPCs**: Interactive characters

---

## Next Steps

### For Development
1. ✅ Keep Rojo server running
2. ✅ Edit files in your favorite code editor
3. ✅ Test changes in Studio
4. ✅ Commit to Git
5. ✅ Collaborate with team

### For Publishing
1. Build final place: `rojo build -o BloxVille.rbxl`
2. Upload to Roblox
3. Configure game settings
4. Add thumbnails and description
5. Publish!

### For Customization
1. Change colors in UI scripts
2. Add new jobs in JobSystem.lua
3. Create new vehicles in VehicleModels.lua
4. Add sounds in SoundManager.lua
5. Expand the city in MapBuilder.lua

---

## Resources

- **Rojo Docs**: https://rojo.space/docs/
- **Rojo GitHub**: https://github.com/rojo-rbx/rojo
- **Roblox DevHub**: https://create.roblox.com/docs
- **Discord**: Join Roblox OSS Discord for support

---

## Credits

**BloxVille** - A city roleplay game with actual purpose!
- Better than Brookhaven (with jobs!)
- Pizza delivery system
- Vehicle progression
- House ownership
- Full economy

Made with ❤️ using Rojo

---

## Support

Having issues? Check:
1. `SYNC_GUIDE.md` - Detailed sync instructions
2. Output window in Studio - Error messages
3. Rojo server terminal - Connection status
4. File paths in `default.project.json`

**Happy developing!** 🚀🍕
