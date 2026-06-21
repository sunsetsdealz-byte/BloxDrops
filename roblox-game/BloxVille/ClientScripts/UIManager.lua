--[[
    Professional UI Manager - Perfectly Aligned
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
    
    -- Top Left Stats
    local statsFrame = Instance.new("Frame")
    statsFrame.Name = "Stats"
    statsFrame.Size = UDim2.new(0, 300, 0, 140)
    statsFrame.Position = UDim2.new(0, 16, 0, 16)
    statsFrame.BackgroundTransparency = 1
    statsFrame.Parent = screenGui
    
    -- Cash
    local cashBg = Instance.new("Frame")
    cashBg.Size = UDim2.new(1, 0, 0, 42)
    cashBg.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
    cashBg.BorderSizePixel = 0
    cashBg.Parent = statsFrame
    
    local cashCorner = Instance.new("UICorner")
    cashCorner.CornerRadius = UDim.new(0, 10)
    cashCorner.Parent = cashBg
    
    local cashStroke = Instance.new("UIStroke")
    cashStroke.Color = Color3.fromRGB(85, 255, 127)
    cashStroke.Transparency = 0.7
    cashStroke.Thickness = 2
    cashStroke.Parent = cashBg
    
    local cashIcon = Instance.new("ImageLabel")
    cashIcon.Size = UDim2.new(0, 24, 0, 24)
    cashIcon.Position = UDim2.new(0, 12, 0.5, -12)
    cashIcon.BackgroundTransparency = 1
    cashIcon.Image = "rbxassetid://6031097225"
    cashIcon.ImageColor3 = Color3.fromRGB(85, 255, 127)
    cashIcon.Parent = cashBg
    
    local cashLabel = Instance.new("TextLabel")
    cashLabel.Name = "CashLabel"
    cashLabel.Size = UDim2.new(1, -48, 1, 0)
    cashLabel.Position = UDim2.new(0, 44, 0, 0)
    cashLabel.BackgroundTransparency = 1
    cashLabel.Text = "$500"
    cashLabel.TextSize = 22
    cashLabel.Font = Enum.Font.GothamBold
    cashLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    cashLabel.TextXAlignment = Enum.TextXAlignment.Left
    cashLabel.Parent = cashBg
    
    -- Level
    local levelBg = Instance.new("Frame")
    levelBg.Size = UDim2.new(1, 0, 0, 42)
    levelBg.Position = UDim2.new(0, 0, 0, 49)
    levelBg.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
    levelBg.BorderSizePixel = 0
    levelBg.Parent = statsFrame
    
    local levelCorner = Instance.new("UICorner")
    levelCorner.CornerRadius = UDim.new(0, 10)
    levelCorner.Parent = levelBg
    
    local levelStroke = Instance.new("UIStroke")
    levelStroke.Color = Color3.fromRGB(255, 215, 0)
    levelStroke.Transparency = 0.7
    levelStroke.Thickness = 2
    levelStroke.Parent = levelBg
    
    local levelIcon = Instance.new("TextLabel")
    levelIcon.Size = UDim2.new(0, 24, 0, 24)
    levelIcon.Position = UDim2.new(0, 12, 0.5, -12)
    levelIcon.BackgroundTransparency = 1
    levelIcon.Text = "⭐"
    levelIcon.TextSize = 20
    levelIcon.Font = Enum.Font.GothamBold
    levelIcon.TextColor3 = Color3.fromRGB(255, 215, 0)
    levelIcon.Parent = levelBg
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "LevelLabel"
    levelLabel.Size = UDim2.new(1, -48, 1, 0)
    levelLabel.Position = UDim2.new(0, 44, 0, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level 1"
    levelLabel.TextSize = 18
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelLabel.TextXAlignment = Enum.TextXAlignment.Left
    levelLabel.Parent = levelBg
    
    -- XP Bar
    local xpBg = Instance.new("Frame")
    xpBg.Size = UDim2.new(1, 0, 0, 42)
    xpBg.Position = UDim2.new(0, 0, 0, 98)
    xpBg.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
    xpBg.BorderSizePixel = 0
    xpBg.Parent = statsFrame
    
    local xpCorner = Instance.new("UICorner")
    xpCorner.CornerRadius = UDim.new(0, 10)
    xpCorner.Parent = xpBg
    
    local xpStroke = Instance.new("UIStroke")
    xpStroke.Color = Color3.fromRGB(204, 255, 0)
    xpStroke.Transparency = 0.7
    xpStroke.Thickness = 2
    xpStroke.Parent = xpBg
    
    local xpBarBg = Instance.new("Frame")
    xpBarBg.Size = UDim2.new(1, -24, 0, 20)
    xpBarBg.Position = UDim2.new(0, 12, 0.5, -10)
    xpBarBg.BackgroundColor3 = Color3.fromRGB(9, 9, 11)
    xpBarBg.BorderSizePixel = 0
    xpBarBg.Parent = xpBg
    
    local xpBarBgCorner = Instance.new("UICorner")
    xpBarBgCorner.CornerRadius = UDim.new(0, 10)
    xpBarBgCorner.Parent = xpBarBg
    
    local xpBar = Instance.new("Frame")
    xpBar.Name = "XPBar"
    xpBar.Size = UDim2.new(0, 0, 1, 0)
    xpBar.BackgroundColor3 = Color3.fromRGB(204, 255, 0)
    xpBar.BorderSizePixel = 0
    xpBar.Parent = xpBarBg
    
    local xpBarCorner = Instance.new("UICorner")
    xpBarCorner.CornerRadius = UDim.new(0, 10)
    xpBarCorner.Parent = xpBar
    
    local xpText = Instance.new("TextLabel")
    xpText.Name = "XPText"
    xpText.Size = UDim2.new(1, 0, 1, 0)
    xpText.BackgroundTransparency = 1
    xpText.Text = "0/100 XP"
    xpText.TextSize = 13
    xpText.Font = Enum.Font.GothamBold
    xpText.TextColor3 = Color3.fromRGB(255, 255, 255)
    xpText.ZIndex = 2
    xpText.Parent = xpBarBg
    
    -- Right Menu
    local rightMenu = Instance.new("Frame")
    rightMenu.Name = "RightMenu"
    rightMenu.Size = UDim2.new(0, 80, 0, 420)
    rightMenu.Position = UDim2.new(1, -96, 0.5, -210)
    rightMenu.BackgroundTransparency = 1
    rightMenu.Parent = screenGui
    
    local buttons = {
        {Name = "Jobs", Icon = "💼"},
        {Name = "Houses", Icon = "🏠"},
        {Name = "Vehicles", Icon = "🚗"},
        {Name = "Shop", Icon = "🛒"},
        {Name = "Settings", Icon = "⚙️"}
    }
    
    for i, btn in ipairs(buttons) do
        local button = Instance.new("TextButton")
        button.Name = btn.Name
        button.Size = UDim2.new(1, 0, 0, 72)
        button.Position = UDim2.new(0, 0, 0, (i-1) * 80)
        button.BackgroundColor3 = Color3.fromRGB(18, 18, 20)
        button.BorderSizePixel = 0
        button.AutoButtonColor = false
        button.Text = ""
        button.Parent = rightMenu
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 12)
        btnCorner.Parent = button
        
        local btnStroke = Instance.new("UIStroke")
        btnStroke.Color = Color3.fromRGB(100, 100, 120)
        btnStroke.Transparency = 0.5
        btnStroke.Thickness = 2
        btnStroke.Parent = button
        
        local icon = Instance.new("TextLabel")
        icon.Size = UDim2.new(1, 0, 0, 32)
        icon.Position = UDim2.new(0, 0, 0, 12)
        icon.BackgroundTransparency = 1
        icon.Text = btn.Icon
        icon.TextSize = 28
        icon.Font = Enum.Font.GothamBold
        icon.Parent = button
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 0, 16)
        label.Position = UDim2.new(0, 0, 1, -24)
        label.BackgroundTransparency = 1
        label.Text = btn.Name
        label.TextSize = 12
        label.Font = Enum.Font.GothamBold
        label.TextColor3 = Color3.fromRGB(180, 180, 180)
        label.Parent = button
        
        button.MouseEnter:Connect(function()
            TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(27, 27, 30)}):Play()
            TweenService:Create(btnStroke, TweenInfo.new(0.2), {Transparency = 0.7}):Play()
        end)
        
        button.MouseLeave:Connect(function()
            TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(18, 18, 20)}):Play()
            TweenService:Create(btnStroke, TweenInfo.new(0.2), {Transparency = 0.88}):Play()
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
        UIManager.Elements.LevelLabel.Text = "Level "..tostring(level)
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
