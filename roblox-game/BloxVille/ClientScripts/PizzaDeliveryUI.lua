--[[
    Pizza Delivery Minigame UI
    Shows timer, destination, and earnings
]]

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local PizzaDelivery = {}
local activeDelivery = false

function PizzaDelivery.StartDelivery(destination, timeLimit, reward)
    if activeDelivery then return end
    activeDelivery = true
    
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "PizzaDelivery"
    screenGui.ResetOnSpawn = false
    screenGui.DisplayOrder = 50
    
    -- Delivery panel
    local panel = Instance.new("Frame")
    panel.Size = UDim2.new(0, 350, 0, 200)
    panel.Position = UDim2.new(0.5, -175, 0, -220)
    panel.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    panel.BorderSizePixel = 0
    panel.Parent = screenGui
    
    local panelCorner = Instance.new("UICorner")
    panelCorner.CornerRadius = UDim.new(0, 12)
    panelCorner.Parent = panel
    
    -- Header
    local header = Instance.new("Frame")
    header.Size = UDim2.new(1, 0, 0, 50)
    header.BackgroundColor3 = Color3.fromRGB(255, 100, 50)
    header.BorderSizePixel = 0
    header.Parent = panel
    
    local headerCorner = Instance.new("UICorner")
    headerCorner.CornerRadius = UDim.new(0, 12)
    headerCorner.Parent = header
    
    local headerFix = Instance.new("Frame")
    headerFix.Size = UDim2.new(1, 0, 0, 12)
    headerFix.Position = UDim2.new(0, 0, 1, -12)
    headerFix.BackgroundColor3 = Color3.fromRGB(255, 100, 50)
    headerFix.BorderSizePixel = 0
    headerFix.Parent = header
    
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 1, 0)
    title.BackgroundTransparency = 1
    title.Text = "🍕 PIZZA DELIVERY"
    title.TextSize = 24
    title.Font = Enum.Font.GothamBold
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Parent = header
    
    -- Destination
    local destLabel = Instance.new("TextLabel")
    destLabel.Size = UDim2.new(1, -20, 0, 40)
    destLabel.Position = UDim2.new(0, 10, 0, 60)
    destLabel.BackgroundTransparency = 1
    destLabel.Text = "📍 Destination: " .. destination
    destLabel.TextSize = 18
    destLabel.Font = Enum.Font.Gotham
    destLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
    destLabel.TextXAlignment = Enum.TextXAlignment.Left
    destLabel.Parent = panel
    
    -- Timer
    local timerLabel = Instance.new("TextLabel")
    timerLabel.Name = "Timer"
    timerLabel.Size = UDim2.new(1, -20, 0, 50)
    timerLabel.Position = UDim2.new(0, 10, 0, 100)
    timerLabel.BackgroundTransparency = 1
    timerLabel.Text = "⏱️ " .. timeLimit .. "s"
    timerLabel.TextSize = 32
    timerLabel.Font = Enum.Font.GothamBold
    timerLabel.TextColor3 = Color3.fromRGB(204, 255, 0)
    timerLabel.Parent = panel
    
    -- Reward
    local rewardLabel = Instance.new("TextLabel")
    rewardLabel.Size = UDim2.new(1, -20, 0, 30)
    rewardLabel.Position = UDim2.new(0, 10, 1, -40)
    rewardLabel.BackgroundTransparency = 1
    rewardLabel.Text = "💰 Reward: $" .. reward
    rewardLabel.TextSize = 18
    rewardLabel.Font = Enum.Font.GothamBold
    rewardLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    rewardLabel.Parent = panel
    
    screenGui.Parent = playerGui
    
    -- Slide in animation
    TweenService:Create(panel, TweenInfo.new(0.5, Enum.EasingStyle.Back), {
        Position = UDim2.new(0.5, -175, 0, 20)
    }):Play()
    
    -- Timer countdown
    local timeLeft = timeLimit
    local timerConnection
    timerConnection = game:GetService("RunService").Heartbeat:Connect(function(dt)
        timeLeft = timeLeft - dt
        timerLabel.Text = "⏱️ " .. math.ceil(timeLeft) .. "s"
        
        -- Change color when running out of time
        if timeLeft <= 10 then
            timerLabel.TextColor3 = Color3.fromRGB(255, 50, 50)
        end
        
        if timeLeft <= 0 then
            timerConnection:Disconnect()
            PizzaDelivery.FailDelivery(screenGui)
        end
    end)
    
    -- Store for external completion
    PizzaDelivery.CurrentDelivery = {
        gui = screenGui,
        timer = timerConnection,
        reward = reward
    }
end

function PizzaDelivery.CompleteDelivery()
    if not activeDelivery or not PizzaDelivery.CurrentDelivery then return end
    
    local delivery = PizzaDelivery.CurrentDelivery
    delivery.timer:Disconnect()
    
    local panel = delivery.gui.Frame
    
    -- Success animation
    local success = Instance.new("TextLabel")
    success.Size = UDim2.new(1, 0, 1, 0)
    success.BackgroundTransparency = 1
    success.Text = "✅ DELIVERED!\n+$" .. delivery.reward
    success.TextSize = 28
    success.Font = Enum.Font.GothamBold
    success.TextColor3 = Color3.fromRGB(100, 255, 100)
    success.TextTransparency = 1
    success.Parent = panel
    
    TweenService:Create(success, TweenInfo.new(0.3), {TextTransparency = 0}):Play()
    
    task.wait(2)
    TweenService:Create(panel, TweenInfo.new(0.3), {
        Position = UDim2.new(0.5, -175, 0, -220)
    }):Play()
    
    task.wait(0.3)
    delivery.gui:Destroy()
    
    activeDelivery = false
    PizzaDelivery.CurrentDelivery = nil
end

function PizzaDelivery.FailDelivery(gui)
    local panel = gui.Frame
    
    -- Fail animation
    local fail = Instance.new("TextLabel")
    fail.Size = UDim2.new(1, 0, 1, 0)
    fail.BackgroundTransparency = 1
    fail.Text = "❌ TOO LATE!\nPizza got cold"
    fail.TextSize = 24
    fail.Font = Enum.Font.GothamBold
    fail.TextColor3 = Color3.fromRGB(255, 50, 50)
    fail.TextTransparency = 1
    fail.Parent = panel
    
    TweenService:Create(fail, TweenInfo.new(0.3), {TextTransparency = 0}):Play()
    
    task.wait(2)
    TweenService:Create(panel, TweenInfo.new(0.3), {
        Position = UDim2.new(0.5, -175, 0, -220)
    }):Play()
    
    task.wait(0.3)
    gui:Destroy()
    
    activeDelivery = false
    PizzaDelivery.CurrentDelivery = nil
end

return PizzaDelivery
