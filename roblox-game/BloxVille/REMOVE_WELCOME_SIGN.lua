--[[
    REMOVE WELCOME SIGN
    
    Deletes the sign and spawn setup
    Run in Command Bar
]]

-- Remove the welcome sign
local welcomeSign = workspace:FindFirstChild("WelcomeSign")
if welcomeSign then
    welcomeSign:Destroy()
    print("✅ Removed WELCOME sign")
else
    print("❌ No WelcomeSign found")
end

-- Remove the spawn point
local mainSpawn = workspace:FindFirstChild("MainSpawn")
if mainSpawn then
    mainSpawn:Destroy()
    print("✅ Removed spawn point")
end

print("✅ All removed!")
