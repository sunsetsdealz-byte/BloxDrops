--[[
    Client Initializer
    Loads all client-side systems
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local player = Players.LocalPlayer

print("🎮 Initializing client for:", player.Name)

-- Wait for character
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- Load all UI systems
print("📱 Loading UI systems...")

local UIManager = require(script.Parent:WaitForChild("UIManager"))
local JobMenuUI = require(script.Parent:WaitForChild("JobMenuUI"))
local VehicleMenuUI = require(script.Parent:WaitForChild("VehicleMenuUI"))
local ShopUI = require(script.Parent:WaitForChild("ShopUI"))
local NotificationUI = require(script.Parent:WaitForChild("NotificationUI"))
local SoundManager = require(script.Parent:WaitForChild("SoundManager"))

print("✅ All UI systems loaded!")

-- Show welcome message after 2 seconds
task.wait(2)
if _G.Notify then
    _G.Notify(
        "Welcome to BloxVille!",
        "Press J for Jobs, V for Vehicles, B for Shop",
        "info"
    )
end

-- Listen for respawn
player.CharacterAdded:Connect(function(newCharacter)
    print("🔄 Character respawned")
    humanoid = newCharacter:WaitForChild("Humanoid")
end)

print("✅ Client initialized successfully!")

return {}
