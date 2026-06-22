--[[
    PASTE ALL CODE - COMPLETE AUTO INSTALLER
    
    ⚠️ IMPORTANT: This only works if you have a plugin or use the command bar with HttpService enabled
    
    EASIER METHOD: Use the file-by-file guide in QUICK_INSTALL_GUIDE.md
    
    This script shows you the exact code to paste for each file.
]]

-- SERVER SCRIPTS CODE PATHS
local serverScripts = {
    "GameInitializer",
    "DataStore", 
    "EventsSetup",
    "HousingSystem",
    "JobSystem",
    "ProximityPromptSetup",
    "VehicleModels",
    "VehicleSpawner"
}

-- CLIENT SCRIPTS CODE PATHS
local clientScripts = {
    "ClientInit",
    "JobMenuUI",
    "NotificationUI",
    "ShopUI",
    "SoundManager",
    "UIController",
    "UIManager",
    "VehicleMenuUI"
}

print("📋 INSTALLATION CHECKLIST:")
print("\n=== SERVER SCRIPTS (ServerScriptService) ===")
for i, name in ipairs(serverScripts) do
    print(i .. ". " .. name .. " → Copy from ServerScripts/" .. name .. ".lua")
end

print("\n=== CLIENT SCRIPTS (StarterPlayerScripts) ===")
for i, name in ipairs(clientScripts) do
    print(i .. ". " .. name .. " → Copy from ClientScripts/" .. name .. ".lua")
end

print("\n=== CONFIG MODULE (ReplicatedStorage/Modules) ===")
print("1. Config → Copy from Modules/Config.lua")

print("\n✅ Total: 18 files to install")
print("\n📖 See QUICK_INSTALL_GUIDE.md for step-by-step instructions")
