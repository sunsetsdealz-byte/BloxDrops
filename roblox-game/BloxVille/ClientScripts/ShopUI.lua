--[[
    Shop UI
    Purchase vehicles, houses, and gamepasses
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local Config = require(ReplicatedStorage:WaitForChild("Modules"):WaitForChild("Config"))

local ShopUI = {}
local menuOpen = false
local currentTab = "Vehicles"

function ShopUI.CreateMenu()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "ShopMenu"
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
    mainFrame.Name = "MainFrame"
    mainFrame.Size = UDim2.new(0, 800, 0, 600)
    mainFrame.Position = UDim2.new(0.5, -400, 0.5, -300)
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
    title.Text = "🛒 Shop"
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
        ShopUI.Toggle()
    end)
    
    -- Tabs
    local tabFrame = Instance.new("Frame")
    tabFrame.Name = "Tabs"
    tabFrame.Size = UDim2.new(1, -40, 0, 50)
    tabFrame.Position = UDim2.new(0, 20, 0, 80)
    tabFrame.BackgroundTransparency = 1
    tabFrame.Parent = mainFrame
    
    local tabLayout = Instance.new("UIListLayout")
    tabLayout.FillDirection = Enum.FillDirection.Horizontal
    tabLayout.SortOrder = Enum.SortOrder.LayoutOrder
    tabLayout.Padding = UDim.new(0, 10)
    tabLayout.Parent = tabFrame
    
    local tabs = {"Vehicles", "Houses", "Gamepasses"}
    
    for _, tabName in ipairs(tabs) do
        local tabBtn = Instance.new("TextButton")
        tabBtn.Name = tabName .. "Tab"
        tabBtn.Size = UDim2.new(0, 150, 1, 0)
        tabBtn.BackgroundColor3 = (tabName == currentTab) and Color3.fromRGB(85, 170, 255) or Color3.fromRGB(40, 40, 40)
        tabBtn.BorderSizePixel = 0
        tabBtn.Text = tabName
        tabBtn.TextSize = 18
        tabBtn.Font = Enum.Font.GothamBold
        tabBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
        tabBtn.AutoButtonColor = false
        tabBtn.Parent = tabFrame
        
        local tabCorner = Instance.new("UICorner")
        tabCorner.CornerRadius = UDim.new(0, 8)
        tabCorner.Parent = tabBtn
        
        tabBtn.MouseButton1Click:Connect(function()
            currentTab = tabName
            ShopUI.RefreshContent()
        end)
    end
    
    -- Content area
    local contentFrame = Instance.new("ScrollingFrame")
    contentFrame.Name = "Content"
    contentFrame.Size = UDim2.new(1, -40, 1, -160)
    contentFrame.Position = UDim2.new(0, 20, 0, 140)
    contentFrame.BackgroundTransparency = 1
    contentFrame.BorderSizePixel = 0
    contentFrame.ScrollBarThickness = 8
    contentFrame.Parent = mainFrame
    
    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellSize = UDim2.new(0, 230, 0, 200)
    gridLayout.CellPadding = UDim2.new(0, 15, 0, 15)
    gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
    gridLayout.Parent = contentFrame
    
    screenGui.Parent = playerGui
    ShopUI.RefreshContent()
    return screenGui
end

function ShopUI.RefreshContent()
    local menu = playerGui:FindFirstChild("ShopMenu")
    if not menu then return end
    
    local contentFrame = menu.MainFrame.Content
    contentFrame:ClearAllChildren()
    
    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellSize = UDim2.new(0, 230, 0, 200)
    gridLayout.CellPadding = UDim2.new(0, 15, 0, 15)
    gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
    gridLayout.Parent = contentFrame
    
    -- Update tab colors
    for _, tab in ipairs(menu.MainFrame.Tabs:GetChildren()) do
        if tab:IsA("TextButton") then
            local isActive = tab.Name == currentTab .. "Tab"
            tab.BackgroundColor3 = isActive and Color3.fromRGB(85, 170, 255) or Color3.fromRGB(40, 40, 40)
        end
    end
    
    -- Load content based on current tab
    if currentTab == "Vehicles" then
        ShopUI.LoadVehicles(contentFrame)
    elseif currentTab == "Houses" then
        ShopUI.LoadHouses(contentFrame)
    elseif currentTab == "Gamepasses" then
        ShopUI.LoadGamepasses(contentFrame)
    end
end

function ShopUI.LoadVehicles(parent)
    for vehicleName, vehicleData in pairs(Config.Vehicles) do
        local card = ShopUI.CreateItemCard(
            vehicleName,
            "🚗",
            "$" .. tostring(vehicleData.Speed),
            "Speed: " .. tostring(vehicleData.Speed),
            function()
                local buyEvent = ReplicatedStorage:WaitForChild("Events"):FindFirstChild("PurchaseVehicle")
                if buyEvent then
                    buyEvent:FireServer(vehicleName)
                end
            end
        )
        card.Parent = parent
    end
end

function ShopUI.LoadHouses(parent)
    for houseName, houseData in pairs(Config.Houses) do
        local card = ShopUI.CreateItemCard(
            houseName,
            "🏠",
            "$" .. tostring(houseData.Price),
            "Max Furniture: " .. tostring(houseData.MaxFurniture),
            function()
                local buyEvent = ReplicatedStorage:WaitForChild("Events"):FindFirstChild("PurchaseHouse")
                if buyEvent then
                    buyEvent:FireServer(houseName)
                end
            end
        )
        card.Parent = parent
    end
end

function ShopUI.LoadGamepasses(parent)
    local gamepasses = {
        {Name = "VIP Pass", Icon = "👑", Price = "99 R$", ID = Config.Gamepasses.VIP},
        {Name = "Extra Plot", Icon = "🏗️", Price = "149 R$", ID = Config.Gamepasses.ExtraPlot},
        {Name = "Fast Vehicle", Icon = "⚡", Price = "199 R$", ID = Config.Gamepasses.FastVehicle},
    }
    
    for _, gp in ipairs(gamepasses) do
        local card = ShopUI.CreateItemCard(
            gp.Name,
            gp.Icon,
            gp.Price,
            "Premium Feature",
            function()
                MarketplaceService:PromptGamePassPurchase(player, gp.ID)
            end
        )
        card.Parent = parent
    end
end

function ShopUI.CreateItemCard(name, icon, price, description, onPurchase)
    local card = Instance.new("Frame")
    card.Name = name
    card.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    card.BorderSizePixel = 0
    
    local cardCorner = Instance.new("UICorner")
    cardCorner.CornerRadius = UDim.new(0, 8)
    cardCorner.Parent = card
    
    -- Icon
    local iconLabel = Instance.new("TextLabel")
    iconLabel.Size = UDim2.new(1, 0, 0, 80)
    iconLabel.Position = UDim2.new(0, 0, 0, 10)
    iconLabel.BackgroundTransparency = 1
    iconLabel.Text = icon
    iconLabel.TextSize = 50
    iconLabel.Font = Enum.Font.GothamBold
    iconLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    iconLabel.Parent = card
    
    -- Name
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, -10, 0, 25)
    nameLabel.Position = UDim2.new(0, 5, 0, 90)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = name
    nameLabel.TextSize = 18
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.Parent = card
    
    -- Description
    local descLabel = Instance.new("TextLabel")
    descLabel.Size = UDim2.new(1, -10, 0, 20)
    descLabel.Position = UDim2.new(0, 5, 0, 115)
    descLabel.BackgroundTransparency = 1
    descLabel.Text = description
    descLabel.TextSize = 14
    descLabel.Font = Enum.Font.Gotham
    descLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    descLabel.Parent = card
    
    -- Buy button
    local buyBtn = Instance.new("TextButton")
    buyBtn.Size = UDim2.new(1, -20, 0, 35)
    buyBtn.Position = UDim2.new(0, 10, 1, -45)
    buyBtn.BackgroundColor3 = Color3.fromRGB(85, 255, 127)
    buyBtn.BorderSizePixel = 0
    buyBtn.Text = "BUY - " .. price
    buyBtn.TextSize = 16
    buyBtn.Font = Enum.Font.GothamBold
    buyBtn.TextColor3 = Color3.fromRGB(0, 0, 0)
    buyBtn.AutoButtonColor = false
    buyBtn.Parent = card
    
    local btnCorner = Instance.new("UICorner")
    btnCorner.CornerRadius = UDim.new(0, 6)
    btnCorner.Parent = buyBtn
    
    buyBtn.MouseEnter:Connect(function()
        TweenService:Create(buyBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(100, 255, 140)}):Play()
    end)
    buyBtn.MouseLeave:Connect(function()
        TweenService:Create(buyBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(85, 255, 127)}):Play()
    end)
    
    buyBtn.MouseButton1Click:Connect(function()
        onPurchase()
        if _G.SoundManager then
            _G.SoundManager.PlaySound("Purchase")
        end
    end)
    
    return card
end

function ShopUI.Toggle()
    local menu = playerGui:FindFirstChild("ShopMenu")
    if not menu then
        menu = ShopUI.CreateMenu()
    end
    
    menuOpen = not menuOpen
    menu.Enabled = menuOpen
    
    if menuOpen and _G.SoundManager then
        _G.SoundManager.PlaySound("MenuOpen")
    end
end

-- Listen for B key
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.B then
        ShopUI.Toggle()
    end
end)

return ShopUI
