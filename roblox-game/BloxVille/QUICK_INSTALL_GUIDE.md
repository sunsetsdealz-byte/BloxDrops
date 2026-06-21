# 🚀 QUICK INSTALL GUIDE - Step by Step

## ⚡ **The Problem:**
You can't drag .lua files directly into Roblox Studio.

## ✅ **The Solution:**
Create scripts in Studio, then copy/paste the code.

---

## 📝 **STEP-BY-STEP INSTRUCTIONS**

### **⏱️ Time: 10-15 minutes for all 18 files**

---

## 🔷 **PART 1: SERVER SCRIPTS (9 files)**

### **Example: Installing GameInitializer.lua**

**Step 1:** In Roblox Studio Explorer:
- Right-click **ServerScriptService**
- Click **Insert Object**
- Select **Script** (NOT LocalScript or ModuleScript)
- A new script appears called "Script"

**Step 2:** Rename it:
- Click on the new "Script"
- Press **F2** (or click again)
- Type: **GameInitializer**
- Press **Enter**

**Step 3:** Open the code file on your computer:
- Open File Explorer
- Go to: `C:\bloxdrops\roblox-game\BloxVille\ServerScripts\`
- Right-click **GameInitializer.lua**
- Click **Open with** → **Notepad**

**Step 4:** Copy the code:
- In Notepad: Press **Ctrl + A** (select all)
- Press **Ctrl + C** (copy)

**Step 5:** Paste into Studio:
- Back in Roblox Studio
- Double-click the **GameInitializer** script
- The code editor opens
- Press **Ctrl + A** (select all default code)
- Press **Ctrl + V** (paste your code)
- Press **Ctrl + S** (save)
- Close the script tab

**Step 6:** Verify:
- The script icon should turn from red to white
- No errors in Output (F9)

---

### **Now Repeat for the Other 8 Server Scripts:**

| # | Script Name | File Location |
|---|-------------|---------------|
| 1 | GameInitializer | ServerScripts\GameInitializer.lua |
| 2 | DataStore | ServerScripts\DataStore.lua |
| 3 | EventsSetup | ServerScripts\EventsSetup.lua |
| 4 | HousingSystem | ServerScripts\HousingSystem.lua |
| 5 | JobSystem | ServerScripts\JobSystem.lua |
| 6 | MapBuilder | ServerScripts\MapBuilder.lua |
| 7 | ProximityPromptSetup | ServerScripts\ProximityPromptSetup.lua |
| 8 | VehicleModels | ServerScripts\VehicleModels.lua |
| 9 | VehicleSpawner | ServerScripts\VehicleSpawner.lua |

**For each one:**
1. Right-click ServerScriptService → Insert Object → Script
2. Rename it
3. Open the .lua file in Notepad
4. Copy all (Ctrl+A, Ctrl+C)
5. Paste into Studio (Ctrl+V)
6. Save (Ctrl+S)

---

## 🔷 **PART 2: CLIENT SCRIPTS (8 files)**

**Same process, but in StarterPlayerScripts!**

**Step 1:** Find StarterPlayerScripts:
- In Explorer, expand **StarterPlayer**
- Click on **StarterPlayerScripts**

**Step 2:** Create LocalScript (NOT Script!):
- Right-click **StarterPlayerScripts**
- Insert Object → **LocalScript** ⚠️ (Important: LocalScript, not Script!)
- Rename to **ClientInit**

**Step 3-6:** Same as before:
- Open `ClientScripts\ClientInit.lua` in Notepad
- Copy all code (Ctrl+A, Ctrl+C)
- Paste into Studio LocalScript (Ctrl+V)
- Save (Ctrl+S)

---

### **Repeat for All 8 Client Scripts:**

| # | LocalScript Name | File Location |
|---|------------------|---------------|
| 1 | ClientInit | ClientScripts\ClientInit.lua |
| 2 | JobMenuUI | ClientScripts\JobMenuUI.lua |
| 3 | NotificationUI | ClientScripts\NotificationUI.lua |
| 4 | ShopUI | ClientScripts\ShopUI.lua |
| 5 | SoundManager | ClientScripts\SoundManager.lua |
| 6 | UIController | ClientScripts\UIController.lua |
| 7 | UIManager | ClientScripts\UIManager.lua |
| 8 | VehicleMenuUI | ClientScripts\VehicleMenuUI.lua |

**For each one:**
1. Right-click StarterPlayerScripts → Insert Object → **LocalScript**
2. Rename it
3. Open the .lua file in Notepad
4. Copy all (Ctrl+A, Ctrl+C)
5. Paste into Studio (Ctrl+V)
6. Save (Ctrl+S)

---

## 🔷 **PART 3: CONFIG MODULE (1 file)**

**⚠️ This one is different - it's a ModuleScript!**

**Step 1:** Create Modules folder:
- In Explorer, find **ReplicatedStorage**
- Right-click ReplicatedStorage
- Insert Object → **Folder**
- Rename to **Modules** (exactly, case-sensitive!)

**Step 2:** Create ModuleScript:
- Right-click the **Modules** folder
- Insert Object → **ModuleScript** ⚠️ (Important: ModuleScript!)
- Rename to **Config**

**Step 3:** Copy code:
- Open `Modules\Config.lua` in Notepad
- Copy all (Ctrl+A, Ctrl+C)
- Paste into Studio ModuleScript (Ctrl+V)
- Save (Ctrl+S)

---

## ✅ **VERIFICATION CHECKLIST**

After installing all 18 files, verify:

```
📦 ReplicatedStorage
└── 📂 Modules
    └── 📄 Config (ModuleScript) ✅

📦 ServerScriptService
├── 📄 GameInitializer (Script) ✅
├── 📄 DataStore (Script) ✅
├── 📄 EventsSetup (Script) ✅
├── 📄 HousingSystem (Script) ✅
├── 📄 JobSystem (Script) ✅
├── 📄 MapBuilder (Script) ✅
├── 📄 ProximityPromptSetup (Script) ✅
├── 📄 VehicleModels (Script) ✅
└── 📄 VehicleSpawner (Script) ✅

📦 StarterPlayer
└── 📂 StarterPlayerScripts
    ├── 📄 ClientInit (LocalScript) ✅
    ├── 📄 JobMenuUI (LocalScript) ✅
    ├── 📄 NotificationUI (LocalScript) ✅
    ├── 📄 ShopUI (LocalScript) ✅
    ├── 📄 SoundManager (LocalScript) ✅
    ├── 📄 UIController (LocalScript) ✅
    ├── 📄 UIManager (LocalScript) ✅
    └── 📄 VehicleMenuUI (LocalScript) ✅
```

**Total: 18 files**
- 9 Scripts in ServerScriptService
- 8 LocalScripts in StarterPlayerScripts
- 1 ModuleScript in ReplicatedStorage/Modules

---

## 🎮 **TEST IT!**

1. Press **F5** (Play)
2. Open **Output** (View → Output or F9)
3. You should see:
   ```
   🎮 Initializing BloxVille...
   🗺️ Building map...
   📍 Setting up proximity prompts...
   ✅ All vehicle models created!
   ✅ Game initialized successfully!
   ```

4. In-game you should see:
   - HUD in top left (cash, level, XP)
   - Menu buttons on right
   - Map in Workspace

5. Test:
   - Press **J** - Job menu
   - Press **V** - Vehicle menu
   - Press **B** - Shop

---

## 🐛 **TROUBLESHOOTING**

### **"Script won't save / turns red"**
- Check for syntax errors in Output (F9)
- Make sure you copied ALL the code
- Try closing and reopening the script

### **"Nothing happens when I press Play"**
- Check Output (F9) for errors
- Make sure GameInitializer is in ServerScriptService
- Make sure Config is in ReplicatedStorage/Modules

### **"Can't find StarterPlayerScripts"**
- Expand **StarterPlayer** in Explorer
- StarterPlayerScripts should be inside it
- If missing, create it: Right-click StarterPlayer → Insert Object → StarterPlayerScripts

### **"Output shows errors"**
Common errors:
- `Config is not a valid member` = Config.lua not in correct location
- `attempt to index nil` = Missing a script
- Check you have all 18 files installed

---

## 💡 **TIPS**

### **Speed Up the Process:**
1. Keep Notepad open
2. Open all .lua files in separate Notepad windows
3. Switch between them with Alt+Tab
4. Copy/paste faster

### **Double-Check:**
- Server scripts = **Script** (not LocalScript)
- Client scripts = **LocalScript** (not Script)
- Config = **ModuleScript** (not Script)

### **If You Make a Mistake:**
- Just delete the script and start over
- No harm done!

---

## ⏱️ **TIME ESTIMATE**

- **Per file:** ~1 minute
- **18 files:** ~15-20 minutes total
- **First time:** May take 20-25 minutes
- **With practice:** Can do in 10 minutes

---

## 🎉 **ONCE DONE:**

You're ready to:
1. Test the game (F5)
2. Update Config.lua with your gamepass IDs
3. Publish to Roblox
4. Launch!

---

## 📞 **STILL STUCK?**

Common issues:
1. **Wrong script type** - Check Script vs LocalScript vs ModuleScript
2. **Wrong location** - Check the file structure above
3. **Missing code** - Make sure you copied ALL the code
4. **Typo in name** - Names must match exactly

---

## ✅ **YOU GOT THIS!**

**Yes, it's manual, but it's the only way Roblox Studio works.**

**Take your time, follow the steps, and you'll be done in 15 minutes!**

**Then your game is ready to launch! 🚀**
