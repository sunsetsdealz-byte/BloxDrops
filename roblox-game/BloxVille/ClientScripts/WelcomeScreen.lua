--[[
    Welcome Screen
    Shows game rules and features on first join
]]

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local WelcomeScreen = {}

function WelcomeScreen.Show()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "WelcomeScreen"
    screenGui.ResetOnSpawn = false
    screenGui.DisplayOrder = 99
    
    -- Background
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, 0, 1, 0)
    bg.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    bg.BackgroundTransparency = 0.5
    bg.BorderSizePixel = 0
    bg.Parent = screenGui
    
    -- Main panel
    local panel = Instance.new("Frame")
    panel.Size = UDim2.new(0, 700, 0, 500)
    panel.Position = UDim2.new(0.5, -350, 0.5, -250)
    panel.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    panel.BorderSizePixel = 0
    panel.Parent = screenGui
    
    local panelCorner = Instance.new("UICorner")
    panelCorner.CornerRadius = UDim.new(0, 20)
    panelCorner.Parent = panel
    
    -- Logo/Title
    local logo = Instance.new("TextLabel")
    logo.Size = UDim2.new(1, 0, 0, 100)
    logo.Position = UDim2.new(0, 0, 0, 20)
    logo.BackgroundTransparency = 1
    logo.Text = "🍕 BLOXVILLE"
    logo.TextSize = 56
    logo.Font = Enum.Font.GothamBold
    logo.TextColor3 = Color3.fromRGB(204, 255, 0)
    logo.Parent = panel
    
    -- Subtitle
    local tagline = Instance.new("TextLabel")
    tagline.Size = UDim2.new(1, 0, 0, 30)
    tagline.Position = UDim2.new(0, 0, 0, 110)
    tagline.BackgroundTransparency = 1
    tagline.Text = "Better Than Brookhaven - With Jobs & Purpose"
    tagline.TextSize = 18
    tagline.Font = Enum.Font.GothamBold
    tagline.TextColor3 = Color3.fromRGB(150, 150, 150)
    tagline.Parent = panel
    
    -- Features list
    local features = {
        "🍕 Work at the Pizza Shop and earn money",
        "🏠 Buy houses and customize them",
        "🚗 Unlock vehicles as you progress",
        "💼 Choose from multiple jobs",
        "⭐ Compete for Employee of the Week",
        "🎮 Roleplay with friends"
    }
    
    local yPos = 160
    for _, feature in ipairs(features) do
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, -80, 0, 35)
        label.Position = UDim2.new(0, 40, 0, yPos)
        label.BackgroundTransparency = 1
        label.Text = feature
        label.TextSize = 18
        label.Font = Enum.Font.Gotham
        label.TextColor3 = Color3.fromRGB(220, 220, 220)
        label.TextXAlignment = Enum.TextXAlignment.Left
        label.Parent = panel
        
        yPos = yPos + 40
    end
    
    -- Play button
    local playBtn = Instance.new("TextButton")
    playBtn.Size = UDim2.new(0, 300, 0, 60)
    playBtn.Position = UDim2.new(0.5, -150, 1, -90)
    playBtn.BackgroundColor3 = Color3.fromRGB(204, 255, 0)
    playBtn.BorderSizePixel = 0
    playBtn.Text = "START PLAYING"
    playBtn.TextSize = 24
    playBtn.Font = Enum.Font.GothamBold
    playBtn.TextColor3 = Color3.fromRGB(0, 0, 0)
    playBtn.AutoButtonColor = false
    playBtn.Parent = panel
    
    local playCorner = Instance.new("UICorner")
    playCorner.CornerRadius = UDim.new(0, 12)
    playCorner.Parent = playBtn
    
    -- Hover effect
    playBtn.MouseEnter:Connect(function()
        TweenService:Create(playBtn, TweenInfo.new(0.2), {
            BackgroundColor3 = Color3.fromRGB(180, 220, 0)
        }):Play()
    end)
    
    playBtn.MouseLeave:Connect(function()
        TweenService:Create(playBtn, TweenInfo.new(0.2), {
            BackgroundColor3 = Color3.fromRGB(204, 255, 0)
        }):Play()
    end)
    
    playBtn.MouseButton1Click:Connect(function()
        -- Fade out
        TweenService:Create(bg, TweenInfo.new(0.5), {BackgroundTransparency = 1}):Play()
        TweenService:Create(panel, TweenInfo.new(0.5), {
            Position = UDim2.new(0.5, -350, 0.5, -350)
        }):Play()
        
        task.wait(0.5)
        screenGui:Destroy()
    end)
    
    screenGui.Parent = playerGui
    
    -- Entrance animation
    panel.Position = UDim2.new(0.5, -350, -0.5, 0)
    bg.BackgroundTransparency = 1
    
    TweenService:Create(bg, TweenInfo.new(0.5), {BackgroundTransparency = 0.5}):Play()
    TweenService:Create(panel, TweenInfo.new(0.8, Enum.EasingStyle.Back), {
        Position = UDim2.new(0.5, -350, 0.5, -250)
    }):Play()
end

-- Show on join
task.wait(0.5)
WelcomeScreen.Show()

return WelcomeScreen
