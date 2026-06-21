--[[
    UI Manager - Main HUD Controller
    Perfectly aligned, professional UI
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local UIManager = {}
UIManager.Elements = {}

-- Create Main HUD
function UIManager.CreateHUD()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "MainHUD"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.IgnoreGuiInset = true
    
    -- Top Left Container (Cash, Level, XP)
    local topLeft = Instance.new("Frame")
    topLeft.Name = "TopLeft"
    topLeft.Size = UDim2.new(0, 320, 0, 130)
    topLeft.Position = UDim2.new(0, 15, 0, 15)
    topLeft.BackgroundTransparency = 1
    topLeft.Parent = screenGui
    
    -- Cash Display
    local cashFrame = Instance.new("Frame")
    cashFrame.Name = "CashFrame"
    cashFrame.Size = UDim2.new(1, 0, 0, 45)
    cashFrame.Position = UDim2.new(0, 0, 0, 0)
    cashFrame.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
    cashFrame.BorderSizePixel = 0
    cashFrame.Parent = topLeft
    
    local cashCorner = Instance.new("UICorner")
    cashCorner.CornerRadius = UDim.new(0, 10)
    cashCorner.Parent = cashFrame
    
    local cashStroke = Instance.new("UIStroke")
    cashStroke.Color = Color3.fromRGB(85, 255, 127)
    cashStroke.Thickness = 2
    cashStroke.Parent = cashFrame
    
    local cashIcon = Instance.new("ImageLabel")
    cashIcon.Size = UDim2.new(0, 30, 0, 30)
    cashIcon.Position = UDim2.new(0, 10, 0.5, -15)
    cashIcon.BackgroundTransparency = 1
    cashIcon.Image = "rbxassetid://6031097225" -- Dollar icon
    cashIcon.ImageColor3 = Color3.fromRGB(85, 255, 127)
    cashIcon.Parent = cashFrame
    
    local cashLabel = Instance.new("TextLabel")
    cashLabel.Name = "CashLabel"
    cashLabel.Size = UDim2.new(1, -50, 1, 0)
    cashLabel.Position = UDim2.new(0, 45, 0, 0)
    cashLabel.BackgroundTransparency = 1
    cashLabel.Text = "$500"
    cashLabel.TextSize = 26
    cashLabel.Font = Enum.Font.GothamBold
    cashLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    cashLabel.TextXAlignment = Enum.TextXAlignment.Left
    cashLabel.TextYAlignment = Enum.TextYAlignment.Center
    cashLabel.Parent = cashFrame
    
    -- Level Display
    local levelFrame = Instance.new("Frame")
    levelFrame.Name = "LevelFrame"
    levelFrame.Size = UDim2.new(1, 0, 0, 35)
    levelFrame.Position = UDim2.new(0, 0, 0, 52)
    levelFrame.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
    levelFrame.BorderSizePixel = 0
    levelFrame.Parent = topLeft
    
    local levelCorner = Instance.new("UICorner")
    levelCorner.CornerRadius = UDim.new(0, 10)
    levelCorner.Parent = levelFrame
    
    local levelStroke = Instance.new("UIStroke")
    levelStroke.Color = Color3.fromRGB(255, 215, 0)
    levelStroke.Thickness = 2
    levelStroke.Parent = levelFrame
    
    local levelIcon = Instance.new("TextLabel")
    levelIcon.Size = UDim2.new(0, 30, 1, 0)
    levelIcon.Position = UDim2.new(0, 10, 0, 0)
    levelIcon.BackgroundTransparency = 1
    levelIcon.Text = "⭐"
    levelIcon.TextSize = 20
    levelIcon.Font = Enum.Font.GothamBold
    levelIcon.TextColor3 = Color3.fromRGB(255, 215, 0)
    levelIcon.TextYAlignment = Enum.TextYAlignment.Center
    levelIcon.Parent = levelFrame
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "LevelLabel"
    levelLabel.Size = UDim2.new(1, -50, 1, 0)
    levelLabel.Position = UDim2.new(0, 45, 0, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level 1"
    levelLabel.TextSize = 20
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelLabel.TextXAlignment = Enum.TextXAlignment.Left
    levelLabel.TextYAlignment = Enum.TextYAlignment.Center
    levelLabel.Parent = levelFrame
    
    -- XP Bar Container
    local xpContainer = Instance.new("Frame")
    xpContainer.Name = "XPContainer"
    xpContainer.Size = UDim2.new(1, 0, 0, 35)
    xpContainer.Position = UDim2.new(0, 0, 0, 94)
    xpContainer.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
    xpContainer.BorderSizePixel = 0
    xpContainer.Parent = topLeft
    
    local xpContainerCorner = Instance.new("UICorner")
    xpContainerCorner.CornerRadius = UDim.new(0, 10)
    xpContainerCorner.Parent = xpContainer
    
    local xpContainerStroke = Instance.new("UIStroke")
    xpContainerStroke.Color = Color3.fromRGB(138, 43, 226)
    xpContainerStroke.Thickness = 2
    xpContainerStroke.Parent = xpContainer
    
    -- XP Bar Background
    local xpFrame = Instance.new("Frame")
    xpFrame.Name = "XPFrame"
    xpFrame.Size = UDim2.new(1, -20, 0, 18)
    xpFrame.Position = UDim2.new(0, 10, 0.5, -9)
    xpFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    xpFrame.BorderSizePixel = 0
    xpFrame.Parent = xpContainer
    
    local xpFrameCorner = Instance.new("UICorner")
    xpFrameCorner.CornerRadius = UDim.new(0, 9)
    xpFrameCorner.Parent = xpFrame
    
    -- XP Bar Fill
    local xpBar = Instance.new("Frame")
    xpBar.Name = "XPBar"
    xpBar.Size = UDim2.new(0, 0, 1, 0)
    xpBar.BackgroundColor3 = Color3.fromRGB(138, 43, 226)
    xpBar.BorderSizePixel = 0
    xpBar.Parent = xpFrame
    
    local xpBarCorner = Instance.new("UICorner")
    xpBarCorner.CornerRadius = UDim.new(0, 9)
    xpBarCorner.Parent = xpBar
    
    -- XP Text
    local xpText = Instance.new("TextLabel")
    xpText.Name = "XPText"
    xpText.Size = UDim2.new(1, 0, 1, 0)
    xpText.BackgroundTransparency = 1
    xpText.Text = "0 / 100 XP"
    xpText.TextSize = 14
    xpText.Font = Enum.Font.GothamBold
    xpText.TextColor3 = Color3.fromRGB(255, 255, 255)
    xpText.TextStrokeTransparency = 0.5
    xpText.ZIndex = 2
    xpText.Parent = xpFrame
    
    -- Right Side Menu Buttons
    local menuButtons = Instance.new("Frame")
    menuButtons.Name = "MenuButtons"
    menuButtons.Size = UDim2.new(0, 70, 0, 400)
    menuButtons.Position = UDim2.new(1, -85, 0.5, -200)
    menuButtons.BackgroundTransparency = 1
    menuButtons.Parent = screenGui
    
    local buttonLayout = Instance.new("UIListLayout")
    buttonLayout.SortOrder = Enum.SortOrder.LayoutOrder
    buttonLayout.Padding = UDim.new(0, 12)
    buttonLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    buttonLayout.Parent = menuButtons
    
    -- Button data
    local buttons = {
        {Name = "Jobs", Icon = "💼", Color = Color3.fromRGB(85, 170, 255), Key = "J"},
        {Name = "Houses", Icon = "🏠", Color = Color3.fromRGB(255, 140, 0), Key = "H"},
        {Name = "Vehicles", Icon = "🚗", Color = Color3.fromRGB(255, 85, 85), Key = "V"},
        {Name = "Shop", Icon = "🛒", Color = Color3.fromRGB(85, 255, 127), Key = "B"},
        {Name = "Settings", Icon = "⚙️", Color = Color3.fromRGB(150, 150, 150), Key = "ESC"}
    }
    
    for i, btnData in ipairs(buttons) do
        local btnContainer = Instance.new("Frame")
        btnContainer.Name = btnData.Name .. "Container"
        btnContainer.Size = UDim2.new(1, 0, 0, 70)
        btnContainer.BackgroundTransparency = 1
        btnContainer.Parent = menuButtons
        
        local btn = Instance.new("TextButton")
        btn.Name = btnData.Name .. "Button"
        btn.Size = UDim2.new(1, 0, 1, 0)
        btn.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
        btn.BorderSizePixel = 0
        btn.Text = ""
        btn.AutoButtonColor = false
        btn.Parent = btnContainer
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 12)
        btnCorner.Parent = btn
        
        local btnStroke = Instance.new("UIStroke")
        btnStroke.Color = btnData.Color
        btnStroke.Thickness = 2
        btnStroke.Parent = btn
        
        local icon = Instance.new("TextLabel")
        icon.Size = UDim2.new(1, 0, 0, 35)
        icon.Position = UDim2.new(0, 0, 0, 8)
        icon.BackgroundTransparency = 1
        icon.Text = btnData.Icon
        icon.TextSize = 28
        icon.Font = Enum.Font.GothamBold
        icon.TextColor3 = btnData.Color
        icon.Parent = btn
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 0, 20)
        label.Position = UDim2.new(0, 0, 1, -25)
        label.BackgroundTransparency = 1
        label.Text = btnData.Name
        label.TextSize = 12
        label.Font = Enum.Font.GothamBold
        label.TextColor3 = Color3.fromRGB(255, 255, 255)
        label.Parent = btn
        
        -- Hover effect
        btn.MouseEnter:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.2), {
                BackgroundColor3 = Color3.fromRGB(45, 45, 45)
            }):Play()
            TweenService:Create(btnStroke, TweenInfo.new(0.2), {
                Thickness = 3
            }):Play()
        end)
        
        btn.MouseLeave:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.2), {
                BackgroundColor3 = Color3.fromRGB(35, 35, 35)
            }):Play()
            TweenService:Create(btnStroke, TweenInfo.new(0.2), {
                Thickness = 2
            }):Play()
        end)
        
        -- Click handler
        btn.MouseButton1Click:Connect(function()
            if btnData.Name == "Jobs" then
                -- Open jobs menu
            elseif btnData.Name == "Vehicles" then
                -- Open vehicles menu
            elseif btnData.Name == "Shop" then
                -- Open shop
            end
        end)
    end
    
    -- Top Right Leaderboard
    local leaderboard = Instance.new("Frame")
    leaderboard.Name = "Leaderboard"
    leaderboard.Size = UDim2.new(0, 280, 0, 120)
    leaderboard.Position = UDim2.new(1, -295, 0, 15)
    leaderboard.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
    leaderboard.BorderSizePixel = 0
    leaderboard.Parent = screenGui
    
    local leaderCorner = Instance.new("UICorner")
    leaderCorner.CornerRadius = UDim.new(0, 10)
    leaderCorner.Parent = leaderboard
    
    local leaderStroke = Instance.new("UIStroke")
    leaderStroke.Color = Color3.fromRGB(255, 255, 255)
    leaderStroke.Thickness = 2
    leaderStroke.Transparency = 0.8
    leaderStroke.Parent = leaderboard
    
    -- Leaderboard Header
    local leaderHeader = Instance.new("Frame")
    leaderHeader.Size = UDim2.new(1, 0, 0, 35)
    leaderHeader.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
    leaderHeader.BorderSizePixel = 0
    leaderHeader.Parent = leaderboard
    
    local leaderHeaderCorner = Instance.new("UICorner")
    leaderHeaderCorner.CornerRadius = UDim.new(0, 10)
    leaderHeaderCorner.Parent = leaderHeader
    
    local headerLabels = {"People", "Level", "Rebirths", "Cash"}
    local headerPositions = {0.05, 0.35, 0.6, 0.8}
    
    for i, label in ipairs(headerLabels) do
        local headerLabel = Instance.new("TextLabel")
        headerLabel.Size = UDim2.new(0.2, 0, 1, 0)
        headerLabel.Position = UDim2.new(headerPositions[i], 0, 0, 0)
        headerLabel.BackgroundTransparency = 1
        headerLabel.Text = label
        headerLabel.TextSize = 12
        headerLabel.Font = Enum.Font.GothamBold
        headerLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
        headerLabel.TextXAlignment = Enum.TextXAlignment.Center
        headerLabel.Parent = leaderHeader
    end
    
    -- Player row
    local playerRow = Instance.new("Frame")
    playerRow.Size = UDim2.new(1, -10, 0, 30)
    playerRow.Position = UDim2.new(0, 5, 0, 45)
    playerRow.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    playerRow.BorderSizePixel = 0
    playerRow.Parent = leaderboard
    
    local rowCorner = Instance.new("UICorner")
    rowCorner.CornerRadius = UDim.new(0, 8)
    rowCorner.Parent = playerRow
    
    -- Player icon
    local playerIcon = Instance.new("TextLabel")
    playerIcon.Size = UDim2.new(0, 25, 0, 25)
    playerIcon.Position = UDim2.new(0.02, 0, 0.5, -12.5)
    playerIcon.BackgroundTransparency = 1
    playerIcon.Text = "👤"
    playerIcon.TextSize = 18
    playerIcon.Parent = playerRow
    
    -- Player name
    local playerNameLabel = Instance.new("TextLabel")
    playerNameLabel.Size = UDim2.new(0.25, 0, 1, 0)
    playerNameLabel.Position = UDim2.new(0.12, 0, 0, 0)
    playerNameLabel.BackgroundTransparency = 1
    playerNameLabel.Text = player.Name
    playerNameLabel.TextSize = 13
    playerNameLabel.Font = Enum.Font.GothamBold
    playerNameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    playerNameLabel.TextXAlignment = Enum.TextXAlignment.Left
    playerNameLabel.TextTruncate = Enum.TextTruncate.AtEnd
    playerNameLabel.Parent = playerRow
    
    -- Stats
    local statsData = {"1", "0", "500"}
    local statsPositions = {0.42, 0.65, 0.85}
    
    for i, stat in ipairs(statsData) do
        local statLabel = Instance.new("TextLabel")
        statLabel.Size = UDim2.new(0.15, 0, 1, 0)
        statLabel.Position = UDim2.new(statsPositions[i], 0, 0, 0)
        statLabel.BackgroundTransparency = 1
        statLabel.Text = stat
        statLabel.TextSize = 13
        statLabel.Font = Enum.Font.Gotham
        statLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
        statLabel.TextXAlignment = Enum.TextXAlignment.Center
        statLabel.Parent = playerRow
    end
    
    screenGui.Parent = playerGui
    UIManager.Elements.HUD = screenGui
    
    return screenGui
end

-- Update functions
function UIManager.UpdateCash(amount)
    local cashLabel = UIManager.Elements.HUD and UIManager.Elements.HUD:FindFirstChild("TopLeft", true)
    if cashLabel then
        cashLabel = cashLabel:FindFirstChild("CashFrame", true)
        if cashLabel then
            cashLabel = cashLabel:FindFirstChild("CashLabel", true)
            if cashLabel then
                cashLabel.Text = "$" .. tostring(amount)
            end
        end
    end
end

function UIManager.UpdateLevel(level)
    local levelLabel = UIManager.Elements.HUD and UIManager.Elements.HUD:FindFirstChild("TopLeft", true)
    if levelLabel then
        levelLabel = levelLabel:FindFirstChild("LevelFrame", true)
        if levelLabel then
            levelLabel = levelLabel:FindFirstChild("LevelLabel", true)
            if levelLabel then
                levelLabel.Text = "Level " .. tostring(level)
            end
        end
    end
end

function UIManager.UpdateXP(current, max)
    local xpFrame = UIManager.Elements.HUD and UIManager.Elements.HUD:FindFirstChild("TopLeft", true)
    if xpFrame then
        xpFrame = xpFrame:FindFirstChild("XPContainer", true)
        if xpFrame then
            xpFrame = xpFrame:FindFirstChild("XPFrame", true)
            if xpFrame then
                local xpBar = xpFrame:FindFirstChild("XPBar")
                local xpText = xpFrame:FindFirstChild("XPText")
                if xpBar and xpText then
                    local percent = math.clamp(current / max, 0, 1)
                    TweenService:Create(xpBar, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                        Size = UDim2.new(percent, 0, 1, 0)
                    }):Play()
                    xpText.Text = tostring(current) .. " / " .. tostring(max) .. " XP"
                end
            end
        end
    end
end

-- Initialize
UIManager.CreateHUD()

-- Listen for data updates
local eventsFolder = ReplicatedStorage:WaitForChild("Events", 10)
if eventsFolder then
    local updateUI = eventsFolder:FindFirstChild("UpdateUI")
    if updateUI then
        updateUI.OnClientEvent:Connect(function(dataType, ...)
            if dataType == "Cash" then
                UIManager.UpdateCash(...)
            elseif dataType == "Level" then
                UIManager.UpdateLevel(...)
            elseif dataType == "XP" then
                UIManager.UpdateXP(...)
            end
        end)
    end
end

return UIManager
