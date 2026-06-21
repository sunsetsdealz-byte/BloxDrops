--[[
    Professional UI Manager - Perfectly Aligned HUD
]]

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local UIManager = {}
UIManager.Elements = {}

function UIManager.CreateHUD()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "MainHUD"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.IgnoreGuiInset = true
    
    -- Top Bar Container (Cash, Level, XP)
    local topBar = Instance.new("Frame")
    topBar.Name = "TopBar"
    topBar.Size = UDim2.new(0, 360, 0, 72)
    topBar.Position = UDim2.new(0, 20, 0, 20)
    topBar.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
    topBar.BorderSizePixel = 0
    topBar.Parent = screenGui
    
    local topBarCorner = Instance.new("UICorner")
    topBarCorner.CornerRadius = UDim.new(0, 12)
    topBarCorner.Parent = topBar
    
    local topBarStroke = Instance.new("UIStroke")
    topBarStroke.Color = Color3.fromRGB(255, 255, 255)
    topBarStroke.Transparency = 0.9
    topBarStroke.Thickness = 1
    topBarStroke.Parent = topBar
    
    -- Cash Section
    local cashContainer = Instance.new("Frame")
    cashContainer.Size = UDim2.new(0, 110, 1, -16)
    cashContainer.Position = UDim2.new(0, 8, 0, 8)
    cashContainer.BackgroundTransparency = 1
    cashContainer.Parent = topBar
    
    local cashIcon = Instance.new("ImageLabel")
    cashIcon.Size = UDim2.new(0, 24, 0, 24)
    cashIcon.Position = UDim2.new(0, 8, 0, 8)
    cashIcon.BackgroundTransparency = 1
    cashIcon.Image = "rbxassetid://6031097225"
    cashIcon.ImageColor3 = Color3.fromRGB(85, 255, 127)
    cashIcon.Parent = cashContainer
    
    local cashLabel = Instance.new("TextLabel")
    cashLabel.Name = "CashLabel"
    cashLabel.Size = UDim2.new(1, -40, 1, 0)
    cashLabel.Position = UDim2.new(0, 40, 0, 0)
    cashLabel.BackgroundTransparency = 1
    cashLabel.Text = "$500"
    cashLabel.TextSize = 20
    cashLabel.Font = Enum.Font.GothamBold
    cashLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    cashLabel.TextXAlignment = Enum.TextXAlignment.Left
    cashLabel.Parent = cashContainer
    
    -- Divider 1
    local divider1 = Instance.new("Frame")
    divider1.Size = UDim2.new(0, 1, 1, -24)
    divider1.Position = UDim2.new(0, 126, 0, 12)
    divider1.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    divider1.BackgroundTransparency = 0.9
    divider1.BorderSizePixel = 0
    divider1.Parent = topBar
    
    -- Level Section
    local levelContainer = Instance.new("Frame")
    levelContainer.Size = UDim2.new(0, 80, 1, -16)
    levelContainer.Position = UDim2.new(0, 135, 0, 8)
    levelContainer.BackgroundTransparency = 1
    levelContainer.Parent = topBar
    
    local levelIcon = Instance.new("TextLabel")
    levelIcon.Size = UDim2.new(0, 24, 0, 24)
    levelIcon.Position = UDim2.new(0, 8, 0, 8)
    levelIcon.BackgroundTransparency = 1
    levelIcon.Text = "⭐"
    levelIcon.TextSize = 18
    levelIcon.Font = Enum.Font.GothamBold
    levelIcon.TextColor3 = Color3.fromRGB(255, 215, 0)
    levelIcon.Parent = levelContainer
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "LevelLabel"
    levelLabel.Size = UDim2.new(1, -40, 1, 0)
    levelLabel.Position = UDim2.new(0, 40, 0, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "1"
    levelLabel.TextSize = 18
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelLabel.TextXAlignment = Enum.TextXAlignment.Left
    levelLabel.Parent = levelContainer
    
    -- Divider 2
    local divider2 = Instance.new("Frame")
    divider2.Size = UDim2.new(0, 1, 1, -24)
    divider2.Position = UDim2.new(0, 223, 0, 12)
    divider2.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    divider2.BackgroundTransparency = 0.9
    divider2.BorderSizePixel = 0
    divider2.Parent = topBar
    
    -- XP Section
    local xpContainer = Instance.new("Frame")
    xpContainer.Size = UDim2.new(0, 120, 1, -16)
    xpContainer.Position = UDim2.new(0, 232, 0, 8)
    xpContainer.BackgroundTransparency = 1
    xpContainer.Parent = topBar
    
    local xpBg = Instance.new("Frame")
    xpBg.Size = UDim2.new(1, -16, 0, 24)
    xpBg.Position = UDim2.new(0, 8, 0.5, -12)
    xpBg.BackgroundColor3 = Color3.fromRGB(9, 9, 11)
    xpBg.BorderSizePixel = 0
    xpBg.Parent = xpContainer
    
    local xpBgCorner = Instance.new("UICorner")
    xpBgCorner.CornerRadius = UDim.new(0, 12)
    xpBgCorner.Parent = xpBg
    
    local xpBar = Instance.new("Frame")
    xpBar.Name = "XPBar"
    xpBar.Size = UDim2.new(0, 0, 1, 0)
    xpBar.BackgroundColor3 = Color3.fromRGB(204, 255, 0)
    xpBar.BorderSizePixel = 0
    xpBar.Parent = xpBg
    
    local xpBarCorner = Instance.new("UICorner")
    xpBarCorner.CornerRadius = UDim.new(0, 12)
    xpBarCorner.Parent = xpBar
    
    local xpText = Instance.new("TextLabel")
    xpText.Name = "XPText"
    xpText.Size = UDim2.new(1, 0, 1, 0)
    xpText.BackgroundTransparency = 1
    xpText.Text = "0/100 XP"
    xpText.TextSize = 12
    xpText.Font = Enum.Font.GothamBold
    xpText.TextColor3 = Color3.fromRGB(255, 255, 255)
    xpText.ZIndex = 2
    xpText.Parent = xpBg
    
    -- Right Side Menu Buttons
    local rightMenu = Instance.new("Frame")
    rightMenu.Name = "RightMenu"
    rightMenu.Size = UDim2.new(0, 72, 0, 400)
    rightMenu.Position = UDim2.new(1, -92, 0.5, -200)
    rightMenu.BackgroundTransparency = 1
    rightMenu.Parent = screenGui
    
    local menuButtons = {
        {Name = "Jobs", Icon = "💼", Color = Color3.fromRGB(255, 140, 0)},
        {Name = "Houses", Icon = "🏠", Color = Color3.fromRGB(100, 149, 237)},
        {Name = "Vehicles", Icon = "🚗", Color = Color3.fromRGB(220, 20, 60)},
        {Name = "Shop", Icon = "🛒", Color = Color3.fromRGB(50, 205, 50)},
        {Name = "Settings", Icon = "⚙️", Color = Color3.fromRGB(128, 128, 128)}
    }
    
    for i, btn in ipairs(menuButtons) do
        local button = Instance.new("TextButton")
        button.Name = btn.Name
        button.Size = UDim2.new(1, 0, 0, 64)
        button.Position = UDim2.new(0, 0, 0, (i-1) * 72)
        button.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
        button.BorderSizePixel = 0
        button.AutoButtonColor = false
        button.Text = ""
        button.Parent = rightMenu
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 12)
        btnCorner.Parent = button
        
        local btnStroke = Instance.new("UIStroke")
        btnStroke.Color = Color3.fromRGB(255, 255, 255)
        btnStroke.Transparency = 0.9
        btnStroke.Thickness = 1
        btnStroke.Parent = button
        
        local icon = Instance.new("TextLabel")
        icon.Size = UDim2.new(1, 0, 0, 32)
        icon.Position = UDim2.new(0, 0, 0, 8)
        icon.BackgroundTransparency = 1
        icon.Text = btn.Icon
        icon.TextSize = 28
        icon.Font = Enum.Font.GothamBold
        icon.Parent = button
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 0, 16)
        label.Position = UDim2.new(0, 0, 1, -22)
        label.BackgroundTransparency = 1
        label.Text = btn.Name
        label.TextSize = 11
        label.Font = Enum.Font.GothamBold
        label.TextColor3 = Color3.fromRGB(200, 200, 200)
        label.Parent = button
        
        button.MouseEnter:Connect(function()
            TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(27, 27, 30)}):Play()
            TweenService:Create(btnStroke, TweenInfo.new(0.2), {Transparency = 0.7}):Play()
        end)
        
        button.MouseLeave:Connect(function()
            TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(18, 18, 20)}):Play()
            TweenService:Create(btnStroke, TweenInfo.new(0.2), {Transparency = 0.9}):Play()
        end)
        
        UIManager.Elements[btn.Name.."Button"] = button
    end
    
    screenGui.Parent = playerGui
    UIManager.Elements.CashLabel = cashLabel
    UIManager.Elements.LevelLabel = levelLabel
    UIManager.Elements.XPBar = xpBar
    UIManager.Elements.XPText = xpText
    
    return screenGui
end

function UIManager.UpdateCash(amount)
    if UIManager.Elements.CashLabel then
        UIManager.Elements.CashLabel.Text = "$"..tostring(amount)
    end
end

function UIManager.UpdateLevel(level)
    if UIManager.Elements.LevelLabel then
        UIManager.Elements.LevelLabel.Text = tostring(level)
    end
end

function UIManager.UpdateXP(current, max)
    if UIManager.Elements.XPBar and UIManager.Elements.XPText then
        local percent = math.clamp(current / max, 0, 1)
        TweenService:Create(UIManager.Elements.XPBar, TweenInfo.new(0.3), {
            Size = UDim2.new(percent, 0, 1, 0)
        }):Play()
        UIManager.Elements.XPText.Text = current.."/"..max.." XP"
    end
end

return UIManager
