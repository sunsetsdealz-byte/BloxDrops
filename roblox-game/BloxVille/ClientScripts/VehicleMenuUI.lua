--[[
    Vehicle Menu UI
    Shows owned vehicles and allows spawning
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local Config = require(ReplicatedStorage:WaitForChild("Modules"):WaitForChild("Config"))

local VehicleMenuUI = {}
local menuOpen = false

function VehicleMenuUI.CreateMenu()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "VehicleMenu"
    screenGui.ResetOnSpawn = false
    screenGui.Enabled = false
    
    -- Background
    local overlay = Instance.new("Frame")
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    overlay.BackgroundTransparency = 0.5
    overlay.BorderSizePixel = 0
    overlay.Parent = screenGui
    
    -- Main frame
    local mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, 700, 0, 500)
    mainFrame.Position = UDim2.new(0.5, -350, 0.5, -250)
    mainFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    local mainCorner = Instance.new("UICorner")
    mainCorner.CornerRadius = UDim.new(0, 12)
    mainCorner.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, -40, 0, 50)
    title.Position = UDim2.new(0, 20, 0, 20)
    title.BackgroundTransparency = 1
    title.Text = "🚗 Your Garage"
    title.TextSize = 28
    title.Font = Enum.Font.GothamBold
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = mainFrame
    
    -- Close button
    local closeBtn = Instance.new("TextButton")
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
        VehicleMenuUI.Toggle()
    end)
    
    -- Grid of vehicles
    local scrollFrame = Instance.new("ScrollingFrame")
    scrollFrame.Size = UDim2.new(1, -40, 1, -100)
    scrollFrame.Position = UDim2.new(0, 20, 0, 80)
    scrollFrame.BackgroundTransparency = 1
    scrollFrame.BorderSizePixel = 0
    scrollFrame.ScrollBarThickness = 8
    scrollFrame.Parent = mainFrame
    
    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellSize = UDim2.new(0, 200, 0, 180)
    gridLayout.CellPadding = UDim2.new(0, 15, 0, 15)
    gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
    gridLayout.Parent = scrollFrame
    
    -- Create vehicle cards
    for vehicleName, vehicleData in pairs(Config.Vehicles) do
        local vehicleCard = Instance.new("Frame")
        vehicleCard.Name = vehicleName
        vehicleCard.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
        vehicleCard.BorderSizePixel = 0
        vehicleCard.Parent = scrollFrame
        
        local cardCorner = Instance.new("UICorner")
        cardCorner.CornerRadius = UDim.new(0, 8)
        cardCorner.Parent = vehicleCard
        
        -- Vehicle icon/preview
        local icon = Instance.new("TextLabel")
        icon.Size = UDim2.new(1, 0, 0, 80)
        icon.Position = UDim2.new(0, 0, 0, 10)
        icon.BackgroundTransparency = 1
        icon.Text = "🚗"
        icon.TextSize = 50
        icon.Font = Enum.Font.GothamBold
        icon.TextColor3 = Color3.fromRGB(255, 255, 255)
        icon.Parent = vehicleCard
        
        -- Vehicle name
        local nameLabel = Instance.new("TextLabel")
        nameLabel.Size = UDim2.new(1, -10, 0, 25)
        nameLabel.Position = UDim2.new(0, 5, 0, 90)
        nameLabel.BackgroundTransparency = 1
        nameLabel.Text = vehicleName
        nameLabel.TextSize = 18
        nameLabel.Font = Enum.Font.GothamBold
        nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
        nameLabel.Parent = vehicleCard
        
        -- Speed stat
        local speedLabel = Instance.new("TextLabel")
        speedLabel.Size = UDim2.new(1, -10, 0, 20)
        speedLabel.Position = UDim2.new(0, 5, 0, 115)
        speedLabel.BackgroundTransparency = 1
        speedLabel.Text = "⚡ Speed: " .. tostring(vehicleData.Speed)
        speedLabel.TextSize = 14
        speedLabel.Font = Enum.Font.Gotham
        speedLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
        speedLabel.Parent = vehicleCard
        
        -- Spawn button
        local spawnBtn = Instance.new("TextButton")
        spawnBtn.Size = UDim2.new(1, -20, 0, 30)
        spawnBtn.Position = UDim2.new(0, 10, 1, -40)
        spawnBtn.BackgroundColor3 = Color3.fromRGB(85, 170, 255)
        spawnBtn.BorderSizePixel = 0
        spawnBtn.Text = "SPAWN"
        spawnBtn.TextSize = 16
        spawnBtn.Font = Enum.Font.GothamBold
        spawnBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
        spawnBtn.AutoButtonColor = false
        spawnBtn.Parent = vehicleCard
        
        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 6)
        btnCorner.Parent = spawnBtn
        
        -- Button effects
        spawnBtn.MouseEnter:Connect(function()
            TweenService:Create(spawnBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(100, 185, 255)}):Play()
        end)
        spawnBtn.MouseLeave:Connect(function()
            TweenService:Create(spawnBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(85, 170, 255)}):Play()
        end)
        
        -- Spawn vehicle
        spawnBtn.MouseButton1Click:Connect(function()
            local spawnEvent = ReplicatedStorage:WaitForChild("Events"):FindFirstChild("SpawnVehicle")
            if spawnEvent then
                spawnEvent:FireServer(vehicleName)
                VehicleMenuUI.Toggle()
                if _G.SoundManager then
                    _G.SoundManager.PlaySound("VehicleSpawn")
                end
            end
        end)
    end
    
    screenGui.Parent = playerGui
    return screenGui
end

function VehicleMenuUI.Toggle()
    local menu = playerGui:FindFirstChild("VehicleMenu")
    if not menu then
        menu = VehicleMenuUI.CreateMenu()
    end
    
    menuOpen = not menuOpen
    menu.Enabled = menuOpen
    
    if menuOpen and _G.SoundManager then
        _G.SoundManager.PlaySound("MenuOpen")
    end
end

-- Listen for V key
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.V then
        VehicleMenuUI.Toggle()
    end
end)

return VehicleMenuUI
