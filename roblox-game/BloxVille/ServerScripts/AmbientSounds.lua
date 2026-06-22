-- Ambient Sounds: City atmosphere (Brookhaven lacks this)
local SoundService = game:GetService("SoundService")

-- Create ambient sound groups
local function setupAmbientSounds()
	-- City ambience
	local cityAmbience = Instance.new("Sound")
	cityAmbience.Name = "CityAmbience"
	cityAmbience.SoundId = "rbxassetid://1845756489" -- City sounds
	cityAmbience.Volume = 0.15
	cityAmbience.Looped = true
	cityAmbience.Parent = SoundService
	cityAmbience:Play()
	
	-- Background music (chill vibes) - DISABLED
	--[[
	local bgMusic = Instance.new("Sound")
	bgMusic.Name = "BackgroundMusic"
	bgMusic.SoundId = "rbxassetid://1837849285" -- Chill music
	bgMusic.Volume = 0.1
	bgMusic.Looped = true
	bgMusic.Parent = SoundService
	bgMusic:Play()
	--]]
	
	-- Night crickets (plays at night)
	local nightSounds = Instance.new("Sound")
	nightSounds.Name = "NightSounds"
	nightSounds.SoundId = "rbxassetid://413641131" -- Cricket sounds
	nightSounds.Volume = 0.12
	nightSounds.Looped = true
	nightSounds.Parent = SoundService
	
	-- Control day/night sounds
	spawn(function()
		while true do
			local lighting = game:GetService("Lighting")
			local clockTime = lighting.ClockTime
			
			-- Night time (6 PM to 6 AM)
			if clockTime >= 18 or clockTime <= 6 then
				if not nightSounds.IsPlaying then
					nightSounds:Play()
				end
				cityAmbience.Volume = 0.08 -- Quieter at night
			else
				if nightSounds.IsPlaying then
					nightSounds:Stop()
				end
				cityAmbience.Volume = 0.15 -- Normal during day
			end
			
			wait(30)
		end
	end)
end

-- Initialize
setupAmbientSounds()

print("✅ AmbientSounds loaded")
