--[[
    FORCE SPAWN FIX
    
    This will:
    1. Delete ALL existing spawns in your game
    2. Create ONE spawn at your exact coordinates
    3. Force every player to teleport there
    
    Run in Command Bar
]]

local Players = game:GetService("Players")

-- Your exact coordinates
local SPAWN_POSITION = Vector3.new(0.88, 4.86, -110.53)

-- STEP 1: Delete ALL spawns
print("🗑️ Removing all old spawns...")
for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("SpawnLocation") then
        print("Deleted:", obj.Name)
        obj:Destroy()
    end
end

-- STEP 2: Create new spawn (make it visible green so you can see it)
local newSpawn = Instance.new("SpawnLocation")
newSpawn.Name = "MainSpawn"
newSpawn.Size = Vector3.new(10, 1, 10)
newSpawn.Position = SPAWN_POSITION
newSpawn.Anchored = true
newSpawn.CanCollide = true
newSpawn.Transparency = 0
newSpawn.BrickColor = BrickColor.new("Bright green")
newSpawn.Duration = 0
newSpawn.Neutral = false
newSpawn.AllowTeamChangeOnTouch = false
newSpawn.Parent = workspace

print("✅ Created new spawn at:", SPAWN_POSITION)

-- STEP 3: Force teleport all players
local function forceSpawn(character)
    local hrp = character:WaitForChild("HumanoidRootPart", 5)
    if hrp then
        task.wait(0.2)
        hrp.CFrame = CFrame.new(SPAWN_POSITION + Vector3.new(0, 3, 0))
        print("✅ Teleported player to spawn")
    end
end

-- Apply to all current players
for _, player in ipairs(Players:GetPlayers()) do
    if player.Character then
        forceSpawn(player.Character)
    end
    player.CharacterAdded:Connect(forceSpawn)
end

-- Apply to new players
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(forceSpawn)
end)

print("✅ SPAWN FIXED! All players will spawn at Vector3.new(0.88, 4.86, -110.53)")
print("🟢 You should see a GREEN platform at the spawn location")
