--[[
    UI Manager - Main HUD Controller
    Creates and manages all player UI
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
    
    -- Top Left Container
    local topLeft = Instance.new("Frame")
    topLeft.Name = "TopLeft"
    topLeft.Size = UDim2.new(0, 300, 0, 150)
    topLeft.Position = UDim2.new(0, 20, 0, 20)
    topLeft.BackgroundTransparency = 1
    topLeft.Parent = screenGui
    
    -- Cash Display
    local cashFrame = Instance.new("Frame")
    cashFrame.Name = "CashFrame"
    cashFrame.Size = UDim2.new(1, 0, 0, 40)
    cashFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    cashFrame.BorderSizePixel = 0
    cashFrame.Parent = topLeft
    
    local cashCorner = Instance.new("UICorner")
    cashCorner.CornerRadius = UDim.new(0, 8)
    cashCorner.Parent = cashFrame
    
    local cashIcon = Instance.new("TextLabel")
    cashIcon.Size = UDim2.new(0, 30, 1, 0)
    cashIcon.BackgroundTransparency = 1
    cashIcon.Text = "💵"
    cashIcon.TextSize = 20
    cashIcon.Font = Enum.Font.GothamBold
    cashIcon.TextColor3 = Color3.fromRGB(85, 255, 127)
    cashIcon.Parent = cashFrame
    
    local cashLabel = Instance.new("TextLabel")
    cashLabel.Name = "CashLabel"
    cashLabel.Size = UDim2.new(1, -35, 1, 0)
    cashLabel.Position = UDim2.new(0, 35, 0, 0)
    cashLabel.BackgroundTransparency = 1
    cashLabel.Text = "$0"
    cashLabel.TextSize = 24
    cashLabel.Font = Enum.Font.GothamBold
    cashLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    cashLabel.TextXAlignment = Enum.TextXAlignment.Left
    cashLabel.Parent = cashFrame
    
    -- Level Display
    local levelFrame = Instance.new("Frame")
    levelFrame.Name = "LevelFrame"
    levelFrame.Size = UDim2.new(1, 0, 0, 40)
    levelFrame.Position = UDim2.new(0, 0, 0, 50)
    levelFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    levelFrame.BorderSizePixel = 0
    levelFrame.Parent = topLeft
    
    local levelCorner = Instance.new("UICorner")
    levelCorner.CornerRadius = UDim.new(0, 8)
    levelCorner.Parent = levelFrame
    
    local levelIcon = Instance.new("TextLabel")
    levelIcon.Size = UDim2.new(0, 30, 1, 0)
    levelIcon.BackgroundTransparency = 1
    levelIcon.Text = "⭐"
    levelIcon.TextSize = 20
    levelIcon.Font = Enum.Font.GothamBold
    levelIcon.TextColor3 = Color3.fromRGB(255, 215, 0)
    levelIcon.Parent = levelFrame
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "LevelLabel"
    levelLabel.Size = UDim2.new(1, -35, 1, 0)
    levelLabel.Position = UDim2.new(0, 35, 0, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level 1"
    levelLabel.TextSize = 20
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelLabel.TextXAlignment = Enum.TextXAlignment.Left
    levelLabel.Parent = levelFrame
    
    -- XP Bar
    local xpFrame = Instance.new("Frame")
    xpFrame.Name = "XPFrame"
    xpFrame.Size = UDim2.new(1, 0, 0, 20)
    xpFrame.Position = UDim2.new(0, 0, 0, 100)
    xpFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    xpFrame.BorderSizePixel = 0
    xpFrame.Parent = topLeft
    
    local xpCorner = Instance.new("UICorner")
    xpCorner.CornerRadius = UDim.new(0, 10)
    xpCorner.Parent = xpFrame
    
    local xpBar = Instance.new("Frame")
    xpBar.Name = "XPBar"
    xpBar.Size = UDim2.new(0, 0, 1, 0)
    xpBar.BackgroundColor3 = Color3.fromRGB(138, 43, 226)
    xpBar.BorderSizePixel = 0
    xpBar.Parent = xpFrame
    
    local xpBarCorner = Instance.new("UICorner")
    xpBarCorner.CornerRadius = UDim.new(0, 10)
    xpBarCorner.Parent = xpBar
    
    local xpText = Instance.new("TextLabel")
    xpText.Name = "XPText"
    xpText.Size = UDim2.new(1, 0, 1, 0)
    xpText.BackgroundTransparency = 1
    xpText.Text = "0 / 100 XP"
    xpText.TextSize = 14
    xpText.Font = Enum.Font.Gotham
    xpText.TextColor3 = Color3.fromRGB(255, 255, 255)
    xpText.Parent = xpFrame
    
    -- Job Status (bottom center)
    local jobStatus = Instance.new("Frame")
    jobStatus.Name = "JobStatus"
    jobStatus.Size = UDim2.new(0, 300, 0, 50)
    jobStatus.Position = UDim2.new(0.5, -150, 1, -70)
    jobStatus.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    jobStatus.BorderSizePixel = 0
    jobStatus.Visible = false
    jobStatus.Parent = screenGui
    
    local jobCorner = Instance.new("UICorner")
    jobCorner.CornerRadius = UDim.new(0, 8)
    jobCorner.Parent = jobStatus
    
    local jobText = Instance.new("TextLabel")
    jobText.Name = "JobText"
    jobText.Size = UDim2.new(1, -20, 1, 0)
    jobText.Position = UDim2.new(0, 10, 0, 0)
    jobText.BackgroundTransparency = 1
    jobText.Text = "Working: Pizza Delivery"
    jobText.TextSize = 18
    jobText.Font = Enum.Font.GothamBold
    jobText.TextColor3 = Color3.fromRGB(85, 255, 127)
    jobText.Parent = jobStatus
    
    -- Menu Buttons (right side)
    local menuButtons = Instance.new("Frame")
    menuButtons.Name = "MenuButtons"
    menuButtons.Size = UDim2.new(0, 60, 0, 300)
    menuButtons.Position = UDim2.new(1, -80, 0.5, -150)
    menuButtons.BackgroundTransparency = 1
    menuButtons.Parent = screenGui
    
    local buttonLayout = Instance.new("UIListLayout")
    buttonLayout.SortOrder = Enum.SortOrder.LayoutOrder
    buttonLayout.Padding = UDim.new(0, 10)
    buttonLayout.Parent = menuButtons
    
    -- Create menu buttons
    local buttons = {
        {Name = "Jobs", Icon = "💼", Key = "J"},
        {Name = "Vehicles", Icon = "🚗", Key = "V"},
        {Name = "Shop", Icon = "🛒", Key = "B"},
        {Name = "Settings", Icon = "⚙️", Key = "ESC"}
    }
    
    for i, btnData in ipairs(buttons) do
        local btn = Instance.new("TextButton")
        btn.Name = btnData.Name .. "Button"
        btn.Size = UDim2.new(1, 0, 0, 60)
        btn.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
        btn.BorderSizePixel = 0
        btn.Text = btnData.Icon
        btn.TextSize = 30
        btn.Font = Enum.Font.GothamBold
        btn.TextColor3 = Color3.fromRGB(255, 255, 255)
        btn.AutoButtonColor = false
        btn.Parent = menuButtons
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 8)
        btnCorner.Parent = btn
        
        -- Hover effect
        btn.MouseEnter:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(60, 60, 60)}):Play()
        end)
        btn.MouseLeave:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(40, 40, 40)}):Play()
        end)
    end
    
    screenGui.Parent = playerGui
    UIManager.Elements.HUD = screenGui
    
    return screenGui
end

-- Update HUD values
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
        xpFrame = xpFrame:FindFirstChild("XPFrame", true)
        if xpFrame then
            local xpBar = xpFrame:FindFirstChild("XPBar")
            local xpText = xpFrame:FindFirstChild("XPText")
            if xpBar and xpText then
                local percent = current / max
                TweenService:Create(xpBar, TweenInfo.new(0.5), {Size = UDim2.new(percent, 0, 1, 0)}):Play()
                xpText.Text = tostring(current) .. " / " .. tostring(max) .. " XP"
            end
        end
    end
end

function UIManager.ShowJobStatus(jobName)
    local jobStatus = UIManager.Elements.HUD and UIManager.Elements.HUD:FindFirstChild("JobStatus")
    if jobStatus then
        local jobText = jobStatus:FindFirstChild("JobText")
        if jobText then
            jobText.Text = "Working: " .. jobName
            jobStatus.Visible = true
        end
    end
end

function UIManager.HideJobStatus()
    local jobStatus = UIManager.Elements.HUD and UIManager.Elements.HUD:FindFirstChild("JobStatus")
    if jobStatus then
        jobStatus.Visible = false
    end
end

-- Initialize
UIManager.CreateHUD()

-- Listen for data updates from server
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
            elseif dataType == "JobStart" then
                UIManager.ShowJobStatus(...)
            elseif dataType == "JobEnd" then
                UIManager.HideJobStatus()
            end
        end)
    end
end

return UIManager
