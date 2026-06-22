--[[
    MOVE SPAWN TO WELCOME SIGN
    
    This moves the spawn from where it is now (green platform)
    to in front of the cyan "WELCOME TO BLOXVILLE" sign
    
    Run in Command Bar
]]

local Players = game:GetService("Players")

-- Position in front of the cyan sign (from your first screenshot)
-- Adjust Z value to get closer/further from sign
local SPAWN_POSITION = Vector3.new(0, 4.5, -50)  -- Centered, in front of sign

-- Delete old spawn
for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("SpawnLocation") then
        obj:Destroy()
    end
end

-- Create new spawn in front of sign
local newSpawn = Instance.new("SpawnLocation")
newSpawn.Name = "WelcomeSignSpawn"
newSpawn.Size = Vector3.new(10, 1, 10)
newSpawn.Position = SPAWN_POSITION
newSpawn.Anchored = true
newSpawn.CanCollide = true
newSpawn.Transparency = 0.5  -- Semi-transparent so you can see it
newSpawn.BrickColor = BrickColor.new("Bright green")
newSpawn.Duration = 0
newSpawn.Neutral = false
newSpawn.Parent = workspace

print("✅ Spawn moved to:", SPAWN_POSITION)
print("📍 Should be in front of cyan WELCOME sign")

-- Force all players to spawn there
local function forceSpawn(character)
    local hrp = character:WaitForChild("HumanoidRootPart", 5)
    if hrp then
        task.wait(0.2)
        hrp.CFrame = CFrame.new(SPAWN_POSITION + Vector3.new(0, 3, 0))
    end
end

for _, player in ipairs(Players:GetPlayers()) do
    if player.Character then
        forceSpawn(player.Character)
    end
    player.CharacterAdded:Connect(forceSpawn)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(forceSpawn)
end)

print("🟢 Green spawn platform moved - check if it's in the right spot")
print("⚙️ If too close/far from sign, change Z value in line 13")
