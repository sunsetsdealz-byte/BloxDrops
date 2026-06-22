--[[
    AUTO FIX SPAWN - Uses Existing Green Spawn
    
    This finds your green spawn platform and uses its position
    Run in Command Bar
]]

local Players = game:GetService("Players")

-- Find the green spawn in your game
local existingSpawn = workspace:FindFirstChild("WelcomeSpawn") or workspace:FindFirstChild("SpawnLocation", true)

if existingSpawn then
    local SPAWN_POSITION = existingSpawn.Position + Vector3.new(0, 3, 0) -- Slightly above spawn
    
    print("✅ Found spawn at:", SPAWN_POSITION)
    
    -- Make sure it's the primary spawn
    existingSpawn.Neutral = false
    existingSpawn.Duration = 0
    
    -- Force all players to spawn here
    Players.PlayerAdded:Connect(function(player)
        player.CharacterAdded:Connect(function(character)
            local hrp = character:WaitForChild("HumanoidRootPart")
            task.wait(0.1)
            hrp.CFrame = CFrame.new(SPAWN_POSITION)
        end)
    end)
    
    print("✅ All players will spawn at green platform")
else
    print("❌ Could not find spawn - looking for all spawns...")
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("SpawnLocation") then
            print("Found spawn:", obj.Name, "at", obj.Position)
        end
    end
end
