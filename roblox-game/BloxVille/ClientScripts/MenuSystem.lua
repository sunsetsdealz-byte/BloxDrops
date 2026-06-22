-- Menu System: Better UI than Brookhaven
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local menuOpen = false

-- Create main menu
local function createMenu()
	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "MenuSystem"
	screenGui.ResetOnSpawn = false
	screenGui.IgnoreGuiInset = true
	screenGui.DisplayOrder = 10
	
	-- Background blur
	local blur = Instance.new("Frame")
	blur.Name = "Blur"
	blur.Size = UDim2.new(1, 0, 1, 0)
	blur.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
	blur.BackgroundTransparency = 0.5
	blur.BorderSizePixel = 0
	blur.Visible = false
	blur.Parent = screenGui
	
	-- Menu container
	local menu = Instance.new("Frame")
	menu.Name = "Menu"
	menu.Size = UDim2.new(0, 600, 0, 400)
	menu.Position = UDim2.new(0.5, 0, 0.5, 0)
	menu.AnchorPoint = Vector2.new(0.5, 0.5)
	menu.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
	menu.BorderSizePixel = 0
	menu.Visible = false
	menu.Parent = screenGui
	
	local menuCorner = Instance.new("UICorner")
	menuCorner.CornerRadius = UDim.new(0, 16)
	menuCorner.Parent = menu
	
	-- Title
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, 0, 0, 60)
	title.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
	title.BorderSizePixel = 0
	title.Text = "🍕 BloxVille Menu"
	title.TextColor3 = Color3.fromRGB(255, 255, 255)
	title.TextSize = 28
	title.Font = Enum.Font.GothamBold
	title.Parent = menu
	
	local titleCorner = Instance.new("UICorner")
	titleCorner.CornerRadius = UDim.new(0, 16)
	titleCorner.Parent = title
	
	-- Close button
	local closeBtn = Instance.new("TextButton")
	closeBtn.Size = UDim2.new(0, 40, 0, 40)
	closeBtn.Position = UDim2.new(1, -50, 0, 10)
	closeBtn.BackgroundColor3 = Color3.fromRGB(255, 70, 70)
	closeBtn.Text = "✕"
	closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	closeBtn.TextSize = 24
	closeBtn.Font = Enum.Font.GothamBold
	closeBtn.Parent = menu
	
	local closeBtnCorner = Instance.new("UICorner")
	closeBtnCorner.CornerRadius = UDim.new(0, 8)
	closeBtnCorner.Parent = closeBtn
	
	-- Button container
	local buttonContainer = Instance.new("Frame")
	buttonContainer.Size = UDim2.new(1, -40, 1, -100)
	buttonContainer.Position = UDim2.new(0, 20, 0, 80)
	buttonContainer.BackgroundTransparency = 1
	buttonContainer.Parent = menu
	
	local buttonLayout = Instance.new("UIGridLayout")
	buttonLayout.CellSize = UDim2.new(0, 170, 0, 80)
	buttonLayout.CellPadding = UDim2.new(0, 15, 0, 15)
	buttonLayout.SortOrder = Enum.SortOrder.LayoutOrder
	buttonLayout.Parent = buttonContainer
	
	-- Menu buttons
	local buttons = {
		{Icon = "🚗", Text = "Vehicles", Color = Color3.fromRGB(70, 130, 255)},
		{Icon = "🏠", Text = "Houses", Color = Color3.fromRGB(255, 180, 70)},
		{Icon = "💼", Text = "Jobs", Color = Color3.fromRGB(120, 255, 120)},
		{Icon = "🛒", Text = "Shop", Color = Color3.fromRGB(255, 120, 255)},
		{Icon = "👥", Text = "Friends", Color = Color3.fromRGB(255, 220, 100)},
		{Icon = "⚙️", Text = "Settings", Color = Color3.fromRGB(150, 150, 150)},
	}
	
	for i, btnData in ipairs(buttons) do
		local btn = Instance.new("TextButton")
		btn.Name = btnData.Text
		btn.BackgroundColor3 = btnData.Color
		btn.BorderSizePixel = 0
		btn.Text = ""
		btn.LayoutOrder = i
		btn.Parent = buttonContainer
		
		local btnCorner = Instance.new("UICorner")
		btnCorner.CornerRadius = UDim.new(0, 12)
		btnCorner.Parent = btn
		
		local icon = Instance.new("TextLabel")
		icon.Size = UDim2.new(1, 0, 0.5, 0)
		icon.Position = UDim2.new(0, 0, 0, 5)
		icon.BackgroundTransparency = 1
		icon.Text = btnData.Icon
		icon.TextSize = 32
		icon.Font = Enum.Font.GothamBold
		icon.Parent = btn
		
		local label = Instance.new("TextLabel")
		label.Size = UDim2.new(1, 0, 0.4, 0)
		label.Position = UDim2.new(0, 0, 0.6, 0)
		label.BackgroundTransparency = 1
		label.Text = btnData.Text
		label.TextColor3 = Color3.fromRGB(255, 255, 255)
		label.TextSize = 16
		label.Font = Enum.Font.GothamBold
		label.Parent = btn
		
		-- Button hover effect
		btn.MouseEnter:Connect(function()
			TweenService:Create(btn, TweenInfo.new(0.2), {Size = UDim2.new(0, 180, 0, 85)}):Play()
		end)
		
		btn.MouseLeave:Connect(function()
			TweenService:Create(btn, TweenInfo.new(0.2), {Size = UDim2.new(0, 170, 0, 80)}):Play()
		end)
		
		btn.MouseButton1Click:Connect(function()
			print("Clicked:", btnData.Text)
			-- TODO: Open specific menus
		end)
	end
	
	-- Close button function
	closeBtn.MouseButton1Click:Connect(function()
		blur.Visible = false
		menu.Visible = false
		menuOpen = false
	end)
	
	screenGui.Parent = playerGui
	
	return {blur = blur, menu = menu}
end

-- Toggle menu
local function toggleMenu()
	local menuSystem = playerGui:FindFirstChild("MenuSystem")
	if not menuSystem then return end
	
	local blur = menuSystem.Blur
	local menu = menuSystem.Menu
	
	menuOpen = not menuOpen
	blur.Visible = menuOpen
	menu.Visible = menuOpen
	
	if menuOpen then
		menu.Position = UDim2.new(0.5, 0, -0.5, 0)
		TweenService:Create(menu, TweenInfo.new(0.3, Enum.EasingStyle.Back), {
			Position = UDim2.new(0.5, 0, 0.5, 0)
		}):Play()
	end
end

-- Initialize
local menuUI = createMenu()

-- TAB key to open menu
UserInputService.InputBegan:Connect(function(input, gameProcessed)
	if gameProcessed then return end
	
	if input.KeyCode == Enum.KeyCode.Tab then
		toggleMenu()
	end
end)

print("✅ MenuSystem loaded - Press TAB to open")
