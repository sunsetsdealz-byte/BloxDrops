--[[
    HUD - Main interface
    Shows cash, job, level
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local HUD = {}

function HUD.Create()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "HUD"
    screenGui.ResetOnSpawn = false
    screenGui.DisplayOrder = 10
    
    -- Top bar container
    local topBar = Instance.new("Frame")
    topBar.Name = "TopBar"
    topBar.Size = UDim2.new(1, 0, 0, 60)
    topBar.Position = UDim2.new(0, 0, 0, 0)
    topBar.BackgroundTransparency = 1
    topBar.Parent = screenGui
    
    -- Cash display (top right)
    local cashFrame = Instance.new("Frame")
    cashFrame.Size = UDim2.new(0, 200, 0, 50)
    cashFrame.Position = UDim2.new(1, -220, 0, 10)
    cashFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    cashFrame.BorderSizePixel = 0
    cashFrame.Parent = topBar
    
    local cashCorner = Instance.new("UICorner")
    cashCorner.CornerRadius = UDim.new(0, 10)
    cashCorner.Parent = cashFrame
    
    local cashIcon = Instance.new("TextLabel")
    cashIcon.Size = UDim2.new(0, 40, 1, 0)
    cashIcon.Position = UDim2.new(0, 5, 0, 0)
    cashIcon.BackgroundTransparency = 1
    cashIcon.Text = "💵"
    cashIcon.TextSize = 28
    cashIcon.Parent = cashFrame
    
    local cashLabel = Instance.new("TextLabel")
    cashLabel.Name = "CashAmount"
    cashLabel.Size = UDim2.new(1, -50, 1, 0)
    cashLabel.Position = UDim2.new(0, 45, 0, 0)
    cashLabel.BackgroundTransparency = 1
    cashLabel.Text = "$500"
    cashLabel.TextSize = 24
    cashLabel.Font = Enum.Font.GothamBold
    cashLabel.TextColor3 = Color3.fromRGB(204, 255, 0)
    cashLabel.TextXAlignment = Enum.TextXAlignment.Left
    cashLabel.Parent = cashFrame
    
    -- Level display (top left)
    local levelFrame = Instance.new("Frame")
    levelFrame.Size = UDim2.new(0, 150, 0, 50)
    levelFrame.Position = UDim2.new(0, 20, 0, 10)
    levelFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    levelFrame.BorderSizePixel = 0
    levelFrame.Parent = topBar
    
    local levelCorner = Instance.new("UICorner")
    levelCorner.CornerRadius = UDim.new(0, 10)
    levelCorner.Parent = levelFrame
    
    local levelIcon = Instance.new("TextLabel")
    levelIcon.Size = UDim2.new(0, 40, 1, 0)
    levelIcon.Position = UDim2.new(0, 5, 0, 0)
    levelIcon.BackgroundTransparency = 1
    levelIcon.Text = "⭐"
    levelIcon.TextSize = 28
    levelIcon.Parent = levelFrame
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "LevelAmount"
    levelLabel.Size = UDim2.new(1, -50, 1, 0)
    levelLabel.Position = UDim2.new(0, 45, 0, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level 1"
    levelLabel.TextSize = 22
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelLabel.TextXAlignment = Enum.TextXAlignment.Left
    levelLabel.Parent = levelFrame
    
    -- Job display (center top)
    local jobFrame = Instance.new("Frame")
    jobFrame.Name = "JobFrame"
    jobFrame.Size = UDim2.new(0, 250, 0, 50)
    jobFrame.Position = UDim2.new(0.5, -125, 0, 10)
    jobFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    jobFrame.BorderSizePixel = 0
    jobFrame.Visible = false
    jobFrame.Parent = topBar
    
    local jobCorner = Instance.new("UICorner")
    jobCorner.CornerRadius = UDim.new(0, 10)
    jobCorner.Parent = jobFrame
    
    local jobIcon = Instance.new("TextLabel")
    jobIcon.Size = UDim2.new(0, 40, 1, 0)
    jobIcon.Position = UDim2.new(0, 5, 0, 0)
    jobIcon.BackgroundTransparency = 1
    jobIcon.Text = "🍕"
    jobIcon.TextSize = 28
    jobIcon.Parent = jobFrame
    
    local jobLabel = Instance.new("TextLabel")
    jobLabel.Name = "JobName"
    jobLabel.Size = UDim2.new(1, -50, 1, 0)
    jobLabel.Position = UDim2.new(0, 45, 0, 0)
    jobLabel.BackgroundTransparency = 1
    jobLabel.Text = "Pizza Delivery"
    jobLabel.TextSize = 20
    jobLabel.Font = Enum.Font.GothamBold
    jobLabel.TextColor3 = Color3.fromRGB(255, 150, 50)
    jobLabel.TextXAlignment = Enum.TextXAlignment.Left
    jobLabel.Parent = jobFrame
    
    screenGui.Parent = playerGui
    
    -- Update cash animation
    function HUD.UpdateCash(amount)
        local label = screenGui.TopBar.CashFrame.CashAmount
        label.Text = "$" .. tostring(amount)
        
        -- Pulse effect
        local original = label.TextSize
        TweenService:Create(label, TweenInfo.new(0.2), {TextSize = original + 4}):Play()
        task.wait(0.2)
        TweenService:Create(label, TweenInfo.new(0.2), {TextSize = original}):Play()
    end
    
    -- Update level
    function HUD.UpdateLevel(level)
        screenGui.TopBar.LevelFrame.LevelAmount.Text = "Level " .. tostring(level)
    end
    
    -- Show job
    function HUD.ShowJob(jobName, icon)
        local jobFrame = screenGui.TopBar.JobFrame
        jobFrame.JobName.Text = jobName
        jobFrame.TextLabel.Text = icon or "💼"
        jobFrame.Visible = true
    end
    
    -- Hide job
    function HUD.HideJob()
        screenGui.TopBar.JobFrame.Visible = false
    end
    
    return HUD
end

-- Auto-create
HUD.Create()

return HUD
