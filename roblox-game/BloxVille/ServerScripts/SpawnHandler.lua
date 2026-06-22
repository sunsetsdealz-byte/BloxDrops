--[[
    Spawn Handler
    Manages player spawning with camera effects
]]

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

-- Spawn configuration
local SPAWN_POSITION = Vector3.new(0, 5, -50)
local CAMERA_START = Vector3.new(0, 100, -100)

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local hrp = character:WaitForChild("HumanoidRootPart")
        local humanoid = character:WaitForChild("Humanoid")
        
        task.wait(0.1)
        
        -- Teleport to spawn
        hrp.CFrame = CFrame.new(SPAWN_POSITION)
        
        -- Disable controls briefly
        humanoid.WalkSpeed = 0
        
        task.wait(2) -- Wait for welcome screen
        
        -- Re-enable
        humanoid.WalkSpeed = 16
    end)
end)

print("✅ Spawn handler loaded")
