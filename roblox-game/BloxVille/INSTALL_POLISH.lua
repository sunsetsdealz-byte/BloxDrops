--[[
    INSTALL ALL POLISH FEATURES
    Copy this into Studio Command Bar and press Enter
    Adds: Lighting, Weather, More Buildings, Sounds
]]

local ServerScriptService = game:GetService("ServerScriptService")

-- Create PhotorealisticSetup script
local photoScript = Instance.new("Script")
photoScript.Name = "PhotorealisticSetup"
photoScript.Parent = ServerScriptService
print("✅ Created PhotorealisticSetup - now paste code from PHOTOREALISTIC_SETUP.lua")

-- Create WeatherSystem script
local weatherScript = Instance.new("Script")
weatherScript.Name = "WeatherSystem"
weatherScript.Parent = ServerScriptService
print("✅ Created WeatherSystem - now paste code from WEATHER_SYSTEM.lua")

-- Create PBR_MATERIAL_LIBRARY in ReplicatedStorage
local Modules = game.ReplicatedStorage:FindFirstChild("Modules")
if Modules then
    local pbrModule = Instance.new("ModuleScript")
    pbrModule.Name = "PBR_MATERIAL_LIBRARY"
    pbrModule.Parent = Modules
    print("✅ Created PBR_MATERIAL_LIBRARY - now paste code from PBR_MATERIAL_LIBRARY.lua")
end

print("\n📋 NEXT STEPS:")
print("1. Double-click PhotorealisticSetup in ServerScriptService")
print("2. Paste code from PHOTOREALISTIC_SETUP.lua")
print("3. Double-click WeatherSystem")
print("4. Paste code from WEATHER_SYSTEM.lua")
print("5. Double-click PBR_MATERIAL_LIBRARY in Modules")
print("6. Paste code from PBR_MATERIAL_LIBRARY.lua")
print("7. Press F5 to test!")
