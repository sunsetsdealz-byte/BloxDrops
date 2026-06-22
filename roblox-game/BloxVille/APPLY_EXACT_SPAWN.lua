--[[
    EXACT SPAWN FROM YOUR COORDINATES
    Vector3.new(0.88, 4.86, -110.53)
    
    Run in Command Bar
]]

local Players = game:GetService("Players")

local SPAWN_POSITION = Vector3.new(0.88, 4.86, -110.53)
local SPAWN_ROTATION = -9.31

-- Remove old spawns
for _, spawn in ipairs(workspace:GetDescendants()) do
    if spawn:IsA("SpawnLocation") then
        spawn:Destroy()
    end
end

-- Create spawn at exact position
local spawnPart = Instance.new("SpawnLocation")
spawnPart.Name = "ExactSpawn"
spawnPart.Size = Vector3.new(10, 1, 10)
spawnPart.Position = SPAWN_POSITION
spawnPart.Anchored = true
spawnPart.CanCollide = false
spawnPart.Transparency = 1
spawnPart.Duration = 0
spawnPart.Neutral = false
spawnPart.Parent = workspace

-- Teleport players to exact spot
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local hrp = character:WaitForChild("HumanoidRootPart")
        task.wait(0.1)
        hrp.CFrame = CFrame.new(SPAWN_POSITION) * CFrame.Angles(0, math.rad(SPAWN_ROTATION), 0)
    end)
end)

print("✅ Spawn set to YOUR EXACT POSITION!")
print("📍", SPAWN_POSITION)
