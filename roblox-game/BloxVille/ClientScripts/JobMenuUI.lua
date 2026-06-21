--[[
    Job Menu UI
    Shows available jobs and allows players to start them
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local Config = require(ReplicatedStorage:WaitForChild("Modules"):WaitForChild("Config"))

local JobMenuUI = {}
local menuOpen = false

function JobMenuUI.CreateMenu()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "JobMenu"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.Enabled = false
    
    -- Background overlay
    local overlay = Instance.new("Frame")
    overlay.Name = "Overlay"
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    overlay.BackgroundTransparency = 0.5
    overlay.BorderSizePixel = 0
    overlay.Parent = screenGui
    
    -- Main frame
    local mainFrame = Instance.new("Frame")
    mainFrame.Name = "MainFrame"
    mainFrame.Size = UDim2.new(0, 600, 0, 500)
    mainFrame.Position = UDim2.new(0.5, -300, 0.5, -250)
    mainFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    local mainCorner = Instance.new("UICorner")
    mainCorner.CornerRadius = UDim.new(0, 12)
    mainCorner.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, -40, 0, 50)
    title.Position = UDim2.new(0, 20, 0, 20)
    title.BackgroundTransparency = 1
    title.Text = "💼 Available Jobs"
    title.TextSize = 28
    title.Font = Enum.Font.GothamBold
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = mainFrame
    
    -- Close button
    local closeBtn = Instance.new("TextButton")
    closeBtn.Name = "CloseButton"
    closeBtn.Size = UDim2.new(0, 40, 0, 40)
    closeBtn.Position = UDim2.new(1, -60, 0, 20)
    closeBtn.BackgroundColor3 = Color3.fromRGB(255, 60, 60)
    closeBtn.BorderSizePixel = 0
    closeBtn.Text = "✕"
    closeBtn.TextSize = 24
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeBtn.Parent = mainFrame
    
    local closeCorner = Instance.new("UICorner")
    closeCorner.CornerRadius = UDim.new(0, 8)
    closeCorner.Parent = closeBtn
    
    closeBtn.MouseButton1Click:Connect(function()
        JobMenuUI.Toggle()
    end)
    
    -- Scroll frame for jobs
    local scrollFrame = Instance.new("ScrollingFrame")
    scrollFrame.Name = "JobList"
    scrollFrame.Size = UDim2.new(1, -40, 1, -100)
    scrollFrame.Position = UDim2.new(0, 20, 0, 80)
    scrollFrame.BackgroundTransparency = 1
    scrollFrame.BorderSizePixel = 0
    scrollFrame.ScrollBarThickness = 8
    scrollFrame.Parent = mainFrame
    
    local listLayout = Instance.new("UIListLayout")
    listLayout.SortOrder = Enum.SortOrder.LayoutOrder
    listLayout.Padding = UDim.new(0, 10)
    listLayout.Parent = scrollFrame
    
    -- Create job cards
    local ySize = 0
    for jobName, jobData in pairs(Config.Jobs) do
        local jobCard = Instance.new("Frame")
        jobCard.Name = jobName
        jobCard.Size = UDim2.new(1, -10, 0, 100)
        jobCard.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
        jobCard.BorderSizePixel = 0
        jobCard.Parent = scrollFrame
        
        local cardCorner = Instance.new("UICorner")
        cardCorner.CornerRadius = UDim.new(0, 8)
        cardCorner.Parent = jobCard
        
        -- Job name
        local jobNameLabel = Instance.new("TextLabel")
        jobNameLabel.Size = UDim2.new(1, -120, 0, 30)
        jobNameLabel.Position = UDim2.new(0, 15, 0, 10)
        jobNameLabel.BackgroundTransparency = 1
        jobNameLabel.Text = jobData.Name
        jobNameLabel.TextSize = 20
        jobNameLabel.Font = Enum.Font.GothamBold
        jobNameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
        jobNameLabel.TextXAlignment = Enum.TextXAlignment.Left
        jobNameLabel.Parent = jobCard
        
        -- Pay info
        local payLabel = Instance.new("TextLabel")
        payLabel.Size = UDim2.new(0.5, -20, 0, 20)
        payLabel.Position = UDim2.new(0, 15, 0, 45)
        payLabel.BackgroundTransparency = 1
        payLabel.Text = "💵 $" .. tostring(jobData.PayPerTask) .. " per task"
        payLabel.TextSize = 16
        payLabel.Font = Enum.Font.Gotham
        payLabel.TextColor3 = Color3.fromRGB(85, 255, 127)
        payLabel.TextXAlignment = Enum.TextXAlignment.Left
        payLabel.Parent = jobCard
        
        -- XP info
        local xpLabel = Instance.new("TextLabel")
        xpLabel.Size = UDim2.new(0.5, -20, 0, 20)
        xpLabel.Position = UDim2.new(0, 15, 0, 70)
        xpLabel.BackgroundTransparency = 1
        xpLabel.Text = "⭐ " .. tostring(jobData.XPPerTask) .. " XP per task"
        xpLabel.TextSize = 16
        xpLabel.Font = Enum.Font.Gotham
        xpLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
        xpLabel.TextXAlignment = Enum.TextXAlignment.Left
        xpLabel.Parent = jobCard
        
        -- Unlock level
        local unlockLabel = Instance.new("TextLabel")
        unlockLabel.Size = UDim2.new(0, 100, 0, 20)
        unlockLabel.Position = UDim2.new(1, -110, 0, 10)
        unlockLabel.BackgroundTransparency = 1
        unlockLabel.Text = "Level " .. tostring(jobData.UnlockLevel)
        unlockLabel.TextSize = 14
        unlockLabel.Font = Enum.Font.Gotham
        unlockLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
        unlockLabel.TextXAlignment = Enum.TextXAlignment.Right
        unlockLabel.Parent = jobCard
        
        -- Start button
        local startBtn = Instance.new("TextButton")
        startBtn.Name = "StartButton"
        startBtn.Size = UDim2.new(0, 100, 0, 35)
        startBtn.Position = UDim2.new(1, -110, 1, -45)
        startBtn.BackgroundColor3 = Color3.fromRGB(85, 255, 127)
        startBtn.BorderSizePixel = 0
        startBtn.Text = "START"
        startBtn.TextSize = 16
        startBtn.Font = Enum.Font.GothamBold
        startBtn.TextColor3 = Color3.fromRGB(0, 0, 0)
        startBtn.AutoButtonColor = false
        startBtn.Parent = jobCard
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 6)
        btnCorner.Parent = startBtn
        
        -- Button hover
        startBtn.MouseEnter:Connect(function()
            TweenService:Create(startBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(100, 255, 140)}):Play()
        end)
        startBtn.MouseLeave:Connect(function()
            TweenService:Create(startBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(85, 255, 127)}):Play()
        end)
        
        -- Start job on click
        startBtn.MouseButton1Click:Connect(function()
            local startJobEvent = ReplicatedStorage:WaitForChild("Events"):FindFirstChild("StartJob")
            if startJobEvent then
                startJobEvent:FireServer(jobName)
                JobMenuUI.Toggle()
            end
        end)
        
        ySize = ySize + 110
    end
    
    scrollFrame.CanvasSize = UDim2.new(0, 0, 0, ySize)
    
    screenGui.Parent = playerGui
    return screenGui
end

function JobMenuUI.Toggle()
    local menu = playerGui:FindFirstChild("JobMenu")
    if not menu then
        menu = JobMenuUI.CreateMenu()
    end
    
    menuOpen = not menuOpen
    menu.Enabled = menuOpen
    
    if menuOpen and _G.SoundManager then
        _G.SoundManager.PlaySound("MenuOpen")
    end
end

-- Listen for J key
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.J then
        JobMenuUI.Toggle()
    end
end)

return JobMenuUI
