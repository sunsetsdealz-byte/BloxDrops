--[[
    GET SPAWN POSITION TOOL
    
    This will automatically find where you want players to spawn
    
    INSTRUCTIONS:
    1. Move your character to EXACTLY where you want players to spawn
    2. Face the direction you want them to look
    3. Run this script in Command Bar
    4. It will print the coordinates - send them to me
]]

local player = game.Players.LocalPlayer
if player and player.Character then
    local hrp = player.Character:FindFirstChild("HumanoidRootPart")
    if hrp then
        local pos = hrp.Position
        local cf = hrp.CFrame
        
        print("=== SPAWN COORDINATES ===")
        print("Position:", pos)
        print("X:", pos.X)
        print("Y:", pos.Y) 
        print("Z:", pos.Z)
        print("Orientation:", hrp.Orientation)
        print("========================")
        print("COPY THIS LINE:")
        print(string.format("Vector3.new(%.2f, %.2f, %.2f)", pos.X, pos.Y, pos.Z))
    else
        print("❌ Character not found - make sure you're in game")
    end
else
    print("❌ Run this while playing the game, not in edit mode")
end
