-- Main UI: Clean HUD better than Brookhaven
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Create main HUD
local function createHUD()
	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "MainHUD"
	screenGui.ResetOnSpawn = false
	screenGui.IgnoreGuiInset = true
	
	-- Cash display (top right)
	local cashFrame = Instance.new("Frame")
	cashFrame.Name = "CashFrame"
	cashFrame.Size = UDim2.new(0, 200, 0, 60)
	cashFrame.Position = UDim2.new(1, -220, 0, 20)
	cashFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	cashFrame.BackgroundTransparency = 0.3
	cashFrame.BorderSizePixel = 0
	cashFrame.Parent = screenGui
	
	local cashCorner = Instance.new("UICorner")
	cashCorner.CornerRadius = UDim.new(0, 12)
	cashCorner.Parent = cashFrame
	
	local cashIcon = Instance.new("TextLabel")
	cashIcon.Size = UDim2.new(0, 40, 1, 0)
	cashIcon.Position = UDim2.new(0, 10, 0, 0)
	cashIcon.BackgroundTransparency = 1
	cashIcon.Text = "💵"
	cashIcon.TextSize = 28
	cashIcon.Font = Enum.Font.GothamBold
	cashIcon.Parent = cashFrame
	
	local cashLabel = Instance.new("TextLabel")
	cashLabel.Name = "CashLabel"
	cashLabel.Size = UDim2.new(1, -60, 1, 0)
	cashLabel.Position = UDim2.new(0, 50, 0, 0)
	cashLabel.BackgroundTransparency = 1
	cashLabel.Text = "$0"
	cashLabel.TextColor3 = Color3.fromRGB(85, 255, 127)
	cashLabel.TextSize = 24
	cashLabel.Font = Enum.Font.GothamBold
	cashLabel.TextXAlignment = Enum.TextXAlignment.Left
	cashLabel.Parent = cashFrame
	
	-- Level display (below cash)
	local levelFrame = Instance.new("Frame")
	levelFrame.Name = "LevelFrame"
	levelFrame.Size = UDim2.new(0, 200, 0, 50)
	levelFrame.Position = UDim2.new(1, -220, 0, 90)
	levelFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	levelFrame.BackgroundTransparency = 0.3
	levelFrame.BorderSizePixel = 0
	levelFrame.Parent = screenGui
	
	local levelCorner = Instance.new("UICorner")
	levelCorner.CornerRadius = UDim.new(0, 12)
	levelCorner.Parent = levelFrame
	
	local levelLabel = Instance.new("TextLabel")
	levelLabel.Name = "LevelLabel"
	levelLabel.Size = UDim2.new(1, -20, 0, 25)
	levelLabel.Position = UDim2.new(0, 10, 0, 5)
	levelLabel.BackgroundTransparency = 1
	levelLabel.Text = "⭐ Level 1"
	levelLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
	levelLabel.TextSize = 18
	levelLabel.Font = Enum.Font.GothamBold
	levelLabel.TextXAlignment = Enum.TextXAlignment.Left
	levelLabel.Parent = levelFrame
	
	-- XP bar
	local xpBarBg = Instance.new("Frame")
	xpBarBg.Name = "XPBarBg"
	xpBarBg.Size = UDim2.new(1, -20, 0, 8)
	xpBarBg.Position = UDim2.new(0, 10, 1, -15)
	xpBarBg.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
	xpBarBg.BorderSizePixel = 0
	xpBarBg.Parent = levelFrame
	
	local xpBarCorner = Instance.new("UICorner")
	xpBarCorner.CornerRadius = UDim.new(0, 4)
	xpBarCorner.Parent = xpBarBg
	
	local xpBar = Instance.new("Frame")
	xpBar.Name = "XPBar"
	xpBar.Size = UDim2.new(0, 0, 1, 0)
	xpBar.BackgroundColor3 = Color3.fromRGB(85, 255, 127)
	xpBar.BorderSizePixel = 0
	xpBar.Parent = xpBarBg
	
	local xpBarFillCorner = Instance.new("UICorner")
	xpBarFillCorner.CornerRadius = UDim.new(0, 4)
	xpBarFillCorner.Parent = xpBar
	
	-- Job indicator (top left)
	local jobFrame = Instance.new("Frame")
	jobFrame.Name = "JobFrame"
	jobFrame.Size = UDim2.new(0, 220, 0, 60)
	jobFrame.Position = UDim2.new(0, 20, 0, 20)
	jobFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	jobFrame.BackgroundTransparency = 0.3
	jobFrame.BorderSizePixel = 0
	jobFrame.Visible = false -- Hidden until job starts
	jobFrame.Parent = screenGui
	
	local jobCorner = Instance.new("UICorner")
	jobCorner.CornerRadius = UDim.new(0, 12)
	jobCorner.Parent = jobFrame
	
	local jobLabel = Instance.new("TextLabel")
	jobLabel.Name = "JobLabel"
	jobLabel.Size = UDim2.new(1, -20, 0.5, 0)
	jobLabel.Position = UDim2.new(0, 10, 0, 5)
	jobLabel.BackgroundTransparency = 1
	jobLabel.Text = "🍕 Pizza Delivery"
	jobLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
	jobLabel.TextSize = 18
	jobLabel.Font = Enum.Font.GothamBold
	jobLabel.TextXAlignment = Enum.TextXAlignment.Left
	jobLabel.Parent = jobFrame
	
	local jobStatus = Instance.new("TextLabel")
	jobStatus.Name = "JobStatus"
	jobStatus.Size = UDim2.new(1, -20, 0.5, -5)
	jobStatus.Position = UDim2.new(0, 10, 0.5, 0)
	jobStatus.BackgroundTransparency = 1
	jobStatus.Text = "Deliver to: 123 Main St"
	jobStatus.TextColor3 = Color3.fromRGB(200, 200, 200)
	jobStatus.TextSize = 14
	jobStatus.Font = Enum.Font.Gotham
	jobStatus.TextXAlignment = Enum.TextXAlignment.Left
	jobStatus.Parent = jobFrame
	
	screenGui.Parent = playerGui
	
	return screenGui
end

-- Update cash display
local function updateCash()
	local leaderstats = player:WaitForChild("leaderstats")
	local cash = leaderstats:WaitForChild("Cash")
	
	local hud = playerGui:WaitForChild("MainHUD")
	local cashLabel = hud.CashFrame.CashLabel
	
	cash.Changed:Connect(function(newValue)
		cashLabel.Text = "$" .. tostring(newValue)
		
		-- Animate on change
		cashLabel.TextSize = 28
		wait(0.1)
		cashLabel.TextSize = 24
	end)
	
	cashLabel.Text = "$" .. tostring(cash.Value)
end

-- Update level display
local function updateLevel()
	local leaderstats = player:WaitForChild("leaderstats")
	local level = leaderstats:WaitForChild("Level")
	local xp = leaderstats:WaitForChild("XP")
	
	local hud = playerGui:WaitForChild("MainHUD")
	local levelLabel = hud.LevelFrame.LevelLabel
	local xpBar = hud.LevelFrame.XPBarBg.XPBar
	
	local function update()
		levelLabel.Text = "⭐ Level " .. tostring(level.Value)
		
		-- XP bar (100 XP per level)
		local xpNeeded = level.Value * 100
		local progress = math.min(xp.Value / xpNeeded, 1)
		xpBar:TweenSize(UDim2.new(progress, 0, 1, 0), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.3, true)
	end
	
	level.Changed:Connect(update)
	xp.Changed:Connect(update)
	update()
end

-- Initialize
local hud = createHUD()
wait(1)
updateCash()
updateLevel()

print("✅ MainUI loaded")
