--[[
    Team Selection UI
    Shown on first spawn - choose your role
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local TeamSelection = {}

function TeamSelection.Show()
    -- Create screen
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "TeamSelection"
    screenGui.ResetOnSpawn = false
    screenGui.DisplayOrder = 100
    
    -- Dark overlay
    local overlay = Instance.new("Frame")
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    overlay.BackgroundTransparency = 0.3
    overlay.BorderSizePixel = 0
    overlay.Parent = screenGui
    
    -- Main frame
    local mainFrame = Instance.new("Frame")
    mainFrame.Name = "MainFrame"
    mainFrame.Size = UDim2.new(0, 900, 0, 600)
    mainFrame.Position = UDim2.new(0.5, -450, 0.5, -300)
    mainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    local mainCorner = Instance.new("UICorner")
    mainCorner.CornerRadius = UDim.new(0, 16)
    mainCorner.Parent = mainFrame
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 80)
    title.Position = UDim2.new(0, 0, 0, 30)
    title.BackgroundTransparency = 1
    title.Text = "🍕 WELCOME TO BLOXVILLE"
    title.TextSize = 42
    title.Font = Enum.Font.GothamBold
    title.TextColor3 = Color3.fromRGB(204, 255, 0)
    title.Parent = mainFrame
    
    -- Subtitle
    local subtitle = Instance.new("TextLabel")
    subtitle.Size = UDim2.new(1, 0, 0, 40)
    subtitle.Position = UDim2.new(0, 0, 0, 100)
    subtitle.BackgroundTransparency = 1
    subtitle.Text = "Choose Your Role"
    subtitle.TextSize = 20
    subtitle.Font = Enum.Font.Gotham
    subtitle.TextColor3 = Color3.fromRGB(200, 200, 200)
    subtitle.Parent = mainFrame
    
    -- Team cards container
    local cardsFrame = Instance.new("Frame")
    cardsFrame.Size = UDim2.new(1, -80, 0, 350)
    cardsFrame.Position = UDim2.new(0, 40, 0, 160)
    cardsFrame.BackgroundTransparency = 1
    cardsFrame.Parent = mainFrame
    
    local cardsLayout = Instance.new("UIListLayout")
    cardsLayout.FillDirection = Enum.FillDirection.Horizontal
    cardsLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    cardsLayout.SortOrder = Enum.SortOrder.LayoutOrder
    cardsLayout.Padding = UDim.new(0, 20)
    cardsLayout.Parent = cardsFrame
    
    -- Team data
    local teams = {
        {
            name = "Pizza Delivery",
            icon = "🍕",
            desc = "Deliver pizzas and earn tips",
            color = Color3.fromRGB(255, 100, 50),
            salary = "$50/delivery"
        },
        {
            name = "Store Clerk",
            icon = "🛒",
            desc = "Work at the shop and help customers",
            color = Color3.fromRGB(100, 150, 255),
            salary = "$30/hour"
        },
        {
            name = "Civilian",
            icon = "👤",
            desc = "Explore, buy houses, and roleplay",
            color = Color3.fromRGB(150, 150, 150),
            salary = "None"
        }
    }
    
    -- Create team cards
    for i, team in ipairs(teams) do
        local card = Instance.new("TextButton")
        card.Name = team.name
        card.Size = UDim2.new(0, 250, 1, 0)
        card.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
        card.BorderSizePixel = 0
        card.AutoButtonColor = false
        card.Text = ""
        card.Parent = cardsFrame
        
        local cardCorner = Instance.new("UICorner")
        cardCorner.CornerRadius = UDim.new(0, 12)
        cardCorner.Parent = card
        
        -- Hover effect
        card.MouseEnter:Connect(function()
            TweenService:Create(card, TweenInfo.new(0.2), {
                BackgroundColor3 = Color3.fromRGB(40, 40, 40)
            }):Play()
        end)
        
        card.MouseLeave:Connect(function()
            TweenService:Create(card, TweenInfo.new(0.2), {
                BackgroundColor3 = Color3.fromRGB(30, 30, 30)
            }):Play()
        end)
        
        -- Icon
        local icon = Instance.new("TextLabel")
        icon.Size = UDim2.new(1, 0, 0, 100)
        icon.Position = UDim2.new(0, 0, 0, 30)
        icon.BackgroundTransparency = 1
        icon.Text = team.icon
        icon.TextSize = 64
        icon.Parent = card
        
        -- Team name
        local nameLabel = Instance.new("TextLabel")
        nameLabel.Size = UDim2.new(1, -20, 0, 40)
        nameLabel.Position = UDim2.new(0, 10, 0, 130)
        nameLabel.BackgroundTransparency = 1
        nameLabel.Text = team.name
        nameLabel.TextSize = 24
        nameLabel.Font = Enum.Font.GothamBold
        nameLabel.TextColor3 = team.color
        nameLabel.Parent = card
        
        -- Description
        local desc = Instance.new("TextLabel")
        desc.Size = UDim2.new(1, -20, 0, 60)
        desc.Position = UDim2.new(0, 10, 0, 180)
        desc.BackgroundTransparency = 1
        desc.Text = team.desc
        desc.TextSize = 16
        desc.Font = Enum.Font.Gotham
        desc.TextColor3 = Color3.fromRGB(180, 180, 180)
        desc.TextWrapped = true
        desc.Parent = card
        
        -- Salary
        local salary = Instance.new("TextLabel")
        salary.Size = UDim2.new(1, -20, 0, 30)
        salary.Position = UDim2.new(0, 10, 1, -50)
        salary.BackgroundTransparency = 1
        salary.Text = "💰 " .. team.salary
        salary.TextSize = 18
        salary.Font = Enum.Font.GothamBold
        salary.TextColor3 = Color3.fromRGB(204, 255, 0)
        salary.Parent = card
        
        -- Click handler
        card.MouseButton1Click:Connect(function()
            -- Send to server
            local remoteEvent = ReplicatedStorage:FindFirstChild("SelectTeam")
            if remoteEvent then
                remoteEvent:FireServer(team.name)
            end
            
            -- Close UI
            screenGui:Destroy()
            
            -- Show welcome message
            local StarterGui = game:GetService("StarterGui")
            StarterGui:SetCore("ChatMakeSystemMessage", {
                Text = "Welcome to BloxVille! You are now a " .. team.name,
                Color = team.color,
                Font = Enum.Font.GothamBold,
                FontSize = Enum.FontSize.Size18
            })
        end)
    end
    
    -- Skip button
    local skipBtn = Instance.new("TextButton")
    skipBtn.Size = UDim2.new(0, 200, 0, 50)
    skipBtn.Position = UDim2.new(0.5, -100, 1, -70)
    skipBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
    skipBtn.BorderSizePixel = 0
    skipBtn.Text = "Skip (Civilian)"
    skipBtn.TextSize = 18
    skipBtn.Font = Enum.Font.GothamBold
    skipBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    skipBtn.Parent = mainFrame
    
    local skipCorner = Instance.new("UICorner")
    skipCorner.CornerRadius = UDim.new(0, 8)
    skipCorner.Parent = skipBtn
    
    skipBtn.MouseButton1Click:Connect(function()
        screenGui:Destroy()
    end)
    
    screenGui.Parent = playerGui
    
    -- Fade in animation
    mainFrame.Position = UDim2.new(0.5, -450, 0.5, -400)
    TweenService:Create(mainFrame, TweenInfo.new(0.5, Enum.EasingStyle.Back), {
        Position = UDim2.new(0.5, -450, 0.5, -300)
    }):Play()
end

-- Auto-show on join
task.wait(1)
TeamSelection.Show()

return TeamSelection
