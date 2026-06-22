--[[
    PIZZA SHOP SPAWN SETUP
    
    Makes all players spawn in front of the pizza shop
    
    INSTALLATION:
    1. Copy SpawnManager.lua to ServerScriptService
    2. Adjust SPAWN_POSITION in SpawnManager.lua to match your pizza shop location
    3. Done! Players will spawn there automatically
    
    FIND YOUR COORDINATES:
    - In Roblox Studio, select the pizza shop or ground in front of it
    - Look at Properties panel → Position
    - Copy those X, Y, Z values to SpawnManager.lua line 9
]]

-- Quick installer (run in Command Bar)
local ServerScriptService = game:GetService("ServerScriptService")

-- This creates the spawn at the coordinates shown in your screenshot
local SPAWN_POSITION = Vector3.new(0, 5, -20) -- Adjust based on your map

local spawnScript = Instance.new("Script")
spawnScript.Name = "SpawnManager"
spawnScript.Source = [[
local Players = game:GetService("Players")

local SPAWN_POSITION = Vector3.new(0, 5, -20)

local spawnPart = Instance.new("SpawnLocation")
spawnPart.Name = "PizzaShopSpawn"
spawnPart.Size = Vector3.new(10, 1, 10)
spawnPart.Position = SPAWN_POSITION
spawnPart.Anchored = true
spawnPart.CanCollide = false
spawnPart.Transparency = 1
spawnPart.Duration = 0
spawnPart.Parent = workspace

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local humanoidRootPart = character:WaitForChild("HumanoidRootPart")
        task.wait(0.1)
        humanoidRootPart.CFrame = CFrame.new(SPAWN_POSITION)
    end)
end)

print("✅ Pizza Shop spawn active")
]]
spawnScript.Parent = ServerScriptService

print("✅ Spawn system installed! Players will spawn at pizza shop")
print("📍 Position:", SPAWN_POSITION)
print("⚙️ To change location: Edit SpawnManager in ServerScriptService")
