--[[
    Spawn Manager
    Makes all players spawn at the pizza shop location
]]

local Players = game:GetService("Players")

-- CUSTOMIZE SPAWN LOCATION HERE
-- Position: exact location from your game
local SPAWN_POSITION = Vector3.new(0.88, 4.86, -110.53)
local SPAWN_ORIENTATION = Vector3.new(0, -9.31, 0) -- Facing direction from your game

-- Create spawn location part (invisible)
local spawnPart = Instance.new("SpawnLocation")
spawnPart.Name = "PizzaShopSpawn"
spawnPart.Size = Vector3.new(10, 1, 10)
spawnPart.Position = SPAWN_POSITION
spawnPart.Anchored = true
spawnPart.CanCollide = false
spawnPart.Transparency = 1
spawnPart.Duration = 0
spawnPart.Parent = workspace

-- Handle player spawning
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local humanoidRootPart = character:WaitForChild("HumanoidRootPart")
        
        -- Teleport to spawn position
        task.wait(0.1)
        humanoidRootPart.CFrame = CFrame.new(SPAWN_POSITION) * CFrame.Angles(
            math.rad(SPAWN_ORIENTATION.X),
            math.rad(SPAWN_ORIENTATION.Y),
            math.rad(SPAWN_ORIENTATION.Z)
        )
    end)
end)

print("✅ Pizza Shop spawn location set at:", SPAWN_POSITION)
