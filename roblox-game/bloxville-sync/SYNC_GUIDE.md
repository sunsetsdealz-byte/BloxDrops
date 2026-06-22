# BloxVille Rojo Sync Guide 🚀

## What's Being Synced

This Rojo project syncs all the BloxVille game scripts to Roblox Studio, including:

### ✅ Client Scripts (StarterPlayerScripts)
- **SoundManager.lua** - Background music system (lofi beats)
- **WelcomeScreen.lua** - Black banner welcome screen with game features
- **HUD.lua** - Player interface
- **UIController.lua** - Menu system
- **MainUI.lua** - Main game UI
- **MenuSystem.lua** - Interactive menus
- **NotificationUI.lua** - Notification system
- **JobMenuUI.lua** - Job selection interface
- **ShopUI.lua** - Shop system
- **TeamSelectionUI.lua** - Team picker
- **VehicleMenuUI.lua** - Vehicle spawning
- **PizzaDeliveryUI.lua** - Pizza delivery interface
- **ClientInit.lua** - Client initialization

### ✅ Server Scripts (ServerScriptService)
- **GameInitializer.lua** - Main game setup
- **MapBuilder.lua** - City generation
- **JobSystem.lua** - Job management
- **VehicleSpawner.lua** - Vehicle system
- **VehicleModels.lua** - Vehicle definitions
- **PizzaDeliverySystem.lua** - Pizza delivery logic
- **HousingSystem.lua** - House ownership
- **DataStore.lua** - Player data persistence
- **EventsSetup.lua** - Remote events
- **SpawnManager.lua** - Player spawning
- **NPCSystem.lua** - NPC management
- **LightingSetup.lua** - Lighting configuration
- **StreetLights.lua** - Street light system
- **AmbientSounds.lua** - Ambient audio
- **ProximityPromptSetup.lua** - Interaction prompts
- **WelcomeSystem.lua** - Welcome screen trigger

### ✅ Shared Modules (ReplicatedStorage)
- **Config.lua** - Game configuration
- **NeonPizzaSign.lua** - Pizza shop sign

### ✅ Game Settings
- Enhanced lighting (ShadowMap technology)
- Ambient reverb for city atmosphere
- Optimized brightness and shadows
- Proper filtering enabled

## How to Sync

### Step 1: Start the Rojo Server
```bash
cd C:\bloxdrops\roblox-game\bloxville-sync
rojo serve
```

You should see:
```
Rojo server listening on port 34872
```

### Step 2: Open Roblox Studio
1. Open Roblox Studio
2. Open your BloxVille place (or create a new one)

### Step 3: Connect Rojo Plugin
1. Look for the **Rojo** plugin in the toolbar
2. Click **Connect**
3. You should see "Connected to Rojo" message

### Step 4: Sync Your Scripts
1. Click **Sync In** in the Rojo plugin
2. All scripts will be synced to your game!

## What You'll See After Syncing

### In StarterPlayer > StarterPlayerScripts > BloxVille:
- All client scripts including the background music and welcome screen

### In ServerScriptService > BloxVille:
- All server scripts for game logic

### In ReplicatedStorage > Modules:
- Shared configuration and modules

### In ReplicatedStorage > Events:
- Folder for remote events (scripts will create the events)

## Testing the Features

### Background Music
1. Join the game in Studio (press Play)
2. You should hear lofi background music automatically
3. Music loops continuously

### Welcome Screen
1. Join the game
2. A black semi-transparent overlay appears
3. Shows "🍕 BLOXVILLE" with green accent
4. Lists game features
5. Click "START PLAYING" to dismiss

### Other Features
- Pizza shop with neon sign
- Job system
- Vehicle spawning
- House ownership
- Delivery missions

## Troubleshooting

### Scripts not appearing?
- Make sure Rojo server is running (`rojo serve`)
- Check that you clicked "Connect" in the Rojo plugin
- Try clicking "Sync In" again

### Music not playing?
- Check SoundService in Explorer
- Look for "BackgroundMusic" sound
- Make sure it's not muted
- Check volume is set to 0.3

### Welcome screen not showing?
- Make sure WelcomeScreen.lua is in StarterPlayerScripts
- Check for errors in Output window
- Try rejoining the game

### Connection refused?
- Make sure `rojo serve` is running in the terminal
- Check firewall isn't blocking port 34872
- Try restarting the Rojo server

## Making Changes

### To modify scripts:
1. Edit files in `C:\bloxdrops\roblox-game\BloxVille\`
2. Changes sync automatically to Studio
3. No need to copy/paste manually!

### To change background music:
1. Open `ClientScripts/SoundManager.lua`
2. Change the `BackgroundMusic` sound ID
3. Save and it syncs automatically

### To modify welcome screen:
1. Open `ClientScripts/WelcomeScreen.lua`
2. Edit text, colors, or layout
3. Save and test in Studio

## Important Notes

⚠️ **Keep Rojo Server Running**: Don't close the terminal while working
⚠️ **Studio Changes**: Changes made in Studio won't sync back to files
⚠️ **Remote Events**: Scripts create events at runtime, not in project file
⚠️ **Asset IDs**: Replace sound IDs with your own uploaded audio

## File Structure
```
bloxville-sync/
├── default.project.json    # Rojo configuration
├── SYNC_GUIDE.md           # This file
└── ../BloxVille/           # Source files
    ├── ClientScripts/      # Client-side scripts
    ├── ServerScripts/      # Server-side scripts
    └── Modules/            # Shared modules
```

## Next Steps

1. ✅ Start Rojo server
2. ✅ Connect in Studio
3. ✅ Sync scripts
4. ✅ Test the game
5. ✅ Customize to your liking
6. ✅ Publish your game!

Happy developing! 🎮
