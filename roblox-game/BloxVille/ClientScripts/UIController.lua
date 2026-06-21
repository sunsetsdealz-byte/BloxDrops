--[[
    UI Controller
    Manages all client-side UI interactions
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local UIController = {}

-- Create main UI
function UIController.CreateMainUI()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "BloxVilleUI"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    -- Top bar
    local topBar = Instance.new("Frame")
    topBar.Name = "TopBar"
    topBar.Size = UDim2.new(1, 0, 0, 60)
    topBar.Position = UDim2.new(0, 0, 0, 0)
    topBar.BackgroundColor3 = Color3.fromRGB(20, 20, 25)
    topBar.BorderSizePixel = 0
    topBar.Parent = screenGui
    
    -- Cash display
    local cashLabel = Instance.new("TextLabel")
    cashLabel.Name = "Cash"
    cashLabel.Size = UDim2.new(0, 200, 1, 0)
    cashLabel.Position = UDim2.new(0, 20, 0, 0)
    cashLabel.BackgroundTransparency = 1
    cashLabel.Text = "$0"
    cashLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    cashLabel.TextSize = 24
    cashLabel.Font = Enum.Font.GothamBold
    cashLabel.TextXAlignment = Enum.TextXAlignment.Left
    cashLabel.Parent = topBar
    
    -- Level display
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "Level"
    levelLabel.Size = UDim2.new(0, 150, 1, 0)
    levelLabel.Position = UDim2.new(0, 240, 0, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level 1"
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 100)
    levelLabel.TextSize = 20
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.TextXAlignment = Enum.TextXAlignment.Left
    levelLabel.Parent = topBar
    
    -- Menu buttons container
    local menuButtons = Instance.new("Frame")
    menuButtons.Name = "MenuButtons"
    menuButtons.Size = UDim2.new(0, 80, 0, 400)
    menuButtons.Position = UDim2.new(1, -100, 0.5, -200)
    menuButtons.BackgroundTransparency = 1
    menuButtons.Parent = screenGui
    
    -- Create menu buttons
    local buttons = {"Jobs", "Houses", "Vehicles", "Shop", "Settings"}
    for i, btnName in ipairs(buttons) do
        local btn = Instance.new("TextButton")
        btn.Name = btnName
        btn.Size = UDim2.new(1, 0, 0, 70)
        btn.Position = UDim2.new(0, 0, 0, (i-1) * 80)
        btn.BackgroundColor3 = Color3.fromRGB(30, 30, 35)
        btn.BorderSizePixel = 0
        btn.Text = btnName
        btn.TextColor3 = Color3.white
        btn.TextSize = 16
        btn.Font = Enum.Font.GothamBold
        btn.Parent = menuButtons
        
        -- Round corners
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, 12)
        corner.Parent = btn
        
        -- Click handler
        btn.MouseButton1Click:Connect(function()
            UIController.OpenMenu(btnName)
        end)
    end
    
    screenGui.Parent = playerGui
    
    -- Update cash/level
    UIController.UpdateStats()
end

-- Update stats display
function UIController.UpdateStats()
    local ui = playerGui:FindFirstChild("BloxVilleUI")
    if not ui then return end
    
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats then
        local cash = leaderstats:FindFirstChild("Cash")
        local level = leaderstats:FindFirstChild("Level")
        
        if cash then
            ui.TopBar.Cash.Text = "$" .. tostring(cash.Value):reverse():gsub("(%d%d%d)", "%1,"):reverse():gsub("^,", "")
        end
        
        if level then
            ui.TopBar.Level.Text = "Level " .. level.Value
        end
    end
end

-- Open menu
function UIController.OpenMenu(menuName)
    print("Opening menu:", menuName)
    
    if menuName == "Jobs" then
        UIController.OpenJobsMenu()
    elseif menuName == "Houses" then
        UIController.OpenHousesMenu()
    elseif menuName == "Vehicles" then
        UIController.OpenVehiclesMenu()
    elseif menuName == "Shop" then
        UIController.OpenShopMenu()
    elseif menuName == "Settings" then
        UIController.OpenSettingsMenu()
    end
end

-- Jobs menu
function UIController.OpenJobsMenu()
    local Config = require(ReplicatedStorage.Modules.Config)
    
    -- Create menu frame
    local menu = Instance.new("Frame")
    menu.Name = "JobsMenu"
    menu.Size = UDim2.new(0, 600, 0, 500)
    menu.Position = UDim2.new(0.5, -300, 0.5, -250)
    menu.BackgroundColor3 = Color3.fromRGB(25, 25, 30)
    menu.BorderSizePixel = 0
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = menu
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundTransparency = 1
    title.Text = "🏢 JOBS"
    title.TextSize = 28
    title.Font = Enum.Font.GothamBold
    title.TextColor3 = Color3.white
    title.Parent = menu
    
    -- Close button
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 40, 0, 40)
    closeBtn.Position = UDim2.new(1, -50, 0, 5)
    closeBtn.BackgroundColor3 = Color3.fromRGB(255, 50, 50)
    closeBtn.Text = "X"
    closeBtn.TextSize = 20
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.TextColor3 = Color3.white
    closeBtn.Parent = menu
    
    local closecorner = Instance.new("UICorner")
    closecorner.CornerRadius = UDim.new(0, 8)
    closecorner.Parent = closeBtn
    
    closeBtn.MouseButton1Click:Connect(function()
        menu:Destroy()
    end)
    
    -- Job list
    local jobList = Instance.new("ScrollingFrame")
    jobList.Size = UDim2.new(1, -40, 1, -80)
    jobList.Position = UDim2.new(0, 20, 0, 60)
    jobList.BackgroundTransparency = 1
    jobList.BorderSizePixel = 0
    jobList.ScrollBarThickness = 8
    jobList.Parent = menu
    
    local listLayout = Instance.new("UIListLayout")
    listLayout.Padding = UDim.new(0, 10)
    listLayout.Parent = jobList
    
    -- Add jobs
    for jobName, jobData in pairs(Config.Jobs) do
        local jobFrame = Instance.new("Frame")
        jobFrame.Size = UDim2.new(1, -20, 0, 80)
        jobFrame.BackgroundColor3 = Color3.fromRGB(35, 35, 40)
        jobFrame.BorderSizePixel = 0
        
        local jobcorner = Instance.new("UICorner")
        jobcorner.CornerRadius = UDim.new(0, 12)
        jobcorner.Parent = jobFrame
        
        local jobTitle = Instance.new("TextLabel")
        jobTitle.Size = UDim2.new(0.5, 0, 0, 30)
        jobTitle.Position = UDim2.new(0, 15, 0, 10)
        jobTitle.BackgroundTransparency = 1
        jobTitle.Text = jobData.Name
        jobTitle.TextSize = 18
        jobTitle.Font = Enum.Font.GothamBold
        jobTitle.TextColor3 = Color3.white
        jobTitle.TextXAlignment = Enum.TextXAlignment.Left
        jobTitle.Parent = jobFrame
        
        local payLabel = Instance.new("TextLabel")
        payLabel.Size = UDim2.new(0.5, 0, 0, 20)
        payLabel.Position = UDim2.new(0, 15, 0, 45)
        payLabel.BackgroundTransparency = 1
        payLabel.Text = "$" .. jobData.PayPerTask .. " per task"
        payLabel.TextSize = 14
        payLabel.Font = Enum.Font.Gotham
        payLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
        payLabel.TextXAlignment = Enum.TextXAlignment.Left
        payLabel.Parent = jobFrame
        
        local startBtn = Instance.new("TextButton")
        startBtn.Size = UDim2.new(0, 120, 0, 40)
        startBtn.Position = UDim2.new(1, -135, 0.5, -20)
        startBtn.BackgroundColor3 = Color3.fromRGB(100, 200, 255)
        startBtn.Text = "START"
        startBtn.TextSize = 16
        startBtn.Font = Enum.Font.GothamBold
        startBtn.TextColor3 = Color3.white
        startBtn.Parent = jobFrame
        
        local btncorner = Instance.new("UICorner")
        btncorner.CornerRadius = UDim.new(0, 8)
        btncorner.Parent = startBtn
        
        startBtn.MouseButton1Click:Connect(function()
            ReplicatedStorage.Events.StartJob:FireServer(jobName)
        end)
        
        jobFrame.Parent = jobList
    end
    
    menu.Parent = playerGui.BloxVilleUI
end

-- Houses menu (placeholder)
function UIController.OpenHousesMenu()
    print("Houses menu - Coming soon!")
end

-- Vehicles menu (placeholder)
function UIController.OpenVehiclesMenu()
    print("Vehicles menu - Coming soon!")
end

-- Shop menu (placeholder)
function UIController.OpenShopMenu()
    print("Shop menu - Coming soon!")
end

-- Settings menu (placeholder)
function UIController.OpenSettingsMenu()
    print("Settings menu - Coming soon!")
end

-- Initialize
UIController.CreateMainUI()

-- Update stats when they change
player:FindFirstChild("leaderstats").ChildAdded:Connect(UIController.UpdateStats)
for _, stat in pairs(player.leaderstats:GetChildren()) do
    stat.Changed:Connect(UIController.UpdateStats)
end

return UIController
