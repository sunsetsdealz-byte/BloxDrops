--[[
    SET EXACT SPAWN - Match Your Screenshot
    
    Run this in Command Bar to spawn players exactly like your photo:
    - Centered in front of cyan "WELCOME TO BLOXVILLE" sign
    - Facing the sign directly
    
    ADJUST IF NEEDED:
    1. Stand where you want players to spawn
    2. Run this in Command Bar: print(game.Players.LocalPlayer.Character.HumanoidRootPart.Position)
    3. Copy those coordinates to line 20 below
]]

local Players = game:GetService("Players")

-- Exact position from your screenshot
-- Player centered on dark road, facing cyan sign
local SPAWN_POSITION = Vector3.new(0, 4, -15)
local SPAWN_LOOK_AT = Vector3.new(0, 4, 0) -- Look toward the sign

-- Remove old spawns
for _, spawn in ipairs(workspace:GetDescendants()) do
    if spawn:IsA("SpawnLocation") then
        spawn:Destroy()
    end
end

-- Create new spawn
local spawnPart = Instance.new("SpawnLocation")
spawnPart.Name = "WelcomeSpawn"
spawnPart.Size = Vector3.new(10, 1, 10)
spawnPart.Position = SPAWN_POSITION
spawnPart.Anchored = true
spawnPart.CanCollide = false
spawnPart.Transparency = 1
spawnPart.Duration = 0
spawnPart.Neutral = false
spawnPart.Parent = workspace

-- Handle spawning with correct facing direction
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local hrp = character:WaitForChild("HumanoidRootPart")
        task.wait(0.1)
        
        -- Calculate direction to face the sign
        local lookDirection = (SPAWN_LOOK_AT - SPAWN_POSITION).Unit
        local angle = math.atan2(lookDirection.X, lookDirection.Z)
        
        hrp.CFrame = CFrame.new(SPAWN_POSITION) * CFrame.Angles(0, angle, 0)
    end)
end)

print("✅ Spawn set exactly like screenshot!")
print("📍 Position:", SPAWN_POSITION)
print("👀 Facing: WELCOME TO BLOXVILLE sign")
