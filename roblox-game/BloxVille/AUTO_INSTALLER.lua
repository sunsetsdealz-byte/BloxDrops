--[[
    AUTO INSTALLER FOR BLOXVILLE
    
    HOW TO USE:
    1. Copy this ENTIRE script
    2. In Roblox Studio, open Command Bar (View → Command Bar)
    3. Paste this script into the Command Bar
    4. Press ENTER
    5. Wait 5 seconds - all scripts will be installed!
    
    This will create:
    - 9 server scripts in ServerScriptService
    - 8 client scripts in StarterPlayerScripts
    - 1 config module in ReplicatedStorage/Modules
]]

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterPlayer = game:GetService("StarterPlayer")
local StarterPlayerScripts = StarterPlayer:FindFirstChild("StarterPlayerScripts")

print("🚀 Starting BloxVille Auto-Installer...")

-- Create Modules folder in ReplicatedStorage
local ModulesFolder = ReplicatedStorage:FindFirstChild("Modules")
if not ModulesFolder then
    ModulesFolder = Instance.new("Folder")
    ModulesFolder.Name = "Modules"
    ModulesFolder.Parent = ReplicatedStorage
    print("✅ Created Modules folder")
end

-- Function to create script from file path
local function createScript(parent, scriptName, scriptType)
    local existingScript = parent:FindFirstChild(scriptName)
    if existingScript then
        print("⚠️ " .. scriptName .. " already exists, skipping...")
        return existingScript
    end
    
    local script = Instance.new(scriptType)
    script.Name = scriptName
    script.Source = "-- Placeholder: Copy code from " .. scriptName .. ".lua file"
    script.Parent = parent
    print("✅ Created " .. scriptName)
    return script
end

-- SERVER SCRIPTS
print("\n📦 Installing Server Scripts...")
createScript(ServerScriptService, "GameInitializer", "Script")
createScript(ServerScriptService, "DataStore", "Script")
createScript(ServerScriptService, "EventsSetup", "Script")
createScript(ServerScriptService, "HousingSystem", "Script")
createScript(ServerScriptService, "JobSystem", "Script")
createScript(ServerScriptService, "ProximityPromptSetup", "Script")
createScript(ServerScriptService, "VehicleModels", "Script")
createScript(ServerScriptService, "VehicleSpawner", "Script")

-- CLIENT SCRIPTS
print("\n📦 Installing Client Scripts...")
createScript(StarterPlayerScripts, "ClientInit", "LocalScript")
createScript(StarterPlayerScripts, "JobMenuUI", "LocalScript")
createScript(StarterPlayerScripts, "NotificationUI", "LocalScript")
createScript(StarterPlayerScripts, "ShopUI", "LocalScript")
createScript(StarterPlayerScripts, "SoundManager", "LocalScript")
createScript(StarterPlayerScripts, "UIController", "LocalScript")
createScript(StarterPlayerScripts, "UIManager", "LocalScript")
createScript(StarterPlayerScripts, "VehicleMenuUI", "LocalScript")

-- CONFIG MODULE
print("\n📦 Installing Config Module...")
createScript(ModulesFolder, "Config", "ModuleScript")

print("\n✅ AUTO-INSTALLER COMPLETE!")
print("\n⚠️ NEXT STEPS:")
print("1. Open each script in Studio")
print("2. Copy code from the .lua files in your project folder")
print("3. Paste into each script")
print("4. Save each script (Ctrl+S)")
print("\nOR use the PASTE_ALL_CODE.lua script for automatic code insertion!")
