-- Welcome System: Better first impression than Brookhaven
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage.Modules.Config)

-- Welcome message with smooth camera
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		
		-- Wait for character to load
		wait(0.5)
		
		-- Welcome message
		local welcomeMsg = Instance.new("Message")
		welcomeMsg.Text = "🍕 Welcome to BloxVille! Press TAB for menu"
		welcomeMsg.Parent = player
		
		wait(3)
		welcomeMsg:Destroy()
		
		-- Give starter cash if new player
		local leaderstats = player:FindFirstChild("leaderstats")
		if leaderstats then
			local cash = leaderstats:FindFirstChild("Cash")
			if cash and cash.Value == 0 then
				cash.Value = Config.Economy.StartingCash
				
				local hint = Instance.new("Hint")
				hint.Text = "You received $" .. Config.Economy.StartingCash .. " starter cash!"
				hint.Parent = player
				wait(4)
				hint:Destroy()
			end
		end
	end)
end)

print("✅ WelcomeSystem loaded")
