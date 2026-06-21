--[[
    Sound Manager - Client Side
    Handles all game sounds and music
]]

local SoundService = game:GetService("SoundService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local SoundManager = {}

-- Sound IDs (Replace with actual Roblox sound asset IDs)
local SOUNDS = {
    -- UI Sounds
    ButtonClick = "rbxassetid://421058925",
    MenuOpen = "rbxassetid://1280254183",
    Purchase = "rbxassetid://138093362",
    
    -- Job Sounds
    JobStart = "rbxassetid://138093819",
    JobComplete = "rbxassetid://138093166",
    CashEarned = "rbxassetid://138093362",
    
    -- Vehicle Sounds
    VehicleSpawn = "rbxassetid://163619849",
    EnginStart = "rbxassetid://9125402735",
    
    -- Notification Sounds
    Success = "rbxassetid://6895079853",
    Error = "rbxassetid://2865227271",
    LevelUp = "rbxassetid://158309736",
    
    -- Background Music
    BackgroundMusic = "rbxassetid://1843404009",
}

-- Create sound instances
local soundInstances = {}

local function createSound(name, soundId, volume)
    local sound = Instance.new("Sound")
    sound.Name = name
    sound.SoundId = soundId
    sound.Volume = volume or 0.5
    sound.Parent = SoundService
    soundInstances[name] = sound
    return sound
end

-- Initialize all sounds
for name, id in pairs(SOUNDS) do
    local volume = (name == "BackgroundMusic") and 0.3 or 0.5
    createSound(name, id, volume)
end

-- Play background music on loop
if soundInstances.BackgroundMusic then
    soundInstances.BackgroundMusic.Looped = true
    soundInstances.BackgroundMusic:Play()
end

-- Play sound function
function SoundManager.PlaySound(soundName)
    local sound = soundInstances[soundName]
    if sound then
        sound:Play()
    else
        warn("Sound not found:", soundName)
    end
end

-- Stop sound function
function SoundManager.StopSound(soundName)
    local sound = soundInstances[soundName]
    if sound then
        sound:Stop()
    end
end

-- Set volume function
function SoundManager.SetVolume(soundName, volume)
    local sound = soundInstances[soundName]
    if sound then
        sound.Volume = volume
    end
end

-- Listen for server sound events
local eventsFolder = ReplicatedStorage:WaitForChild("Events", 10)
if eventsFolder then
    local soundEvent = eventsFolder:WaitForChild("PlaySound", 10)
    if soundEvent then
        soundEvent.OnClientEvent:Connect(function(soundName)
            SoundManager.PlaySound(soundName)
        end)
    end
end

-- Export for other scripts
_G.SoundManager = SoundManager

return SoundManager
