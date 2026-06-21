--[[
    Notification UI
    Shows notifications to the player
]]

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local NotificationUI = {}
local notificationQueue = {}
local isShowing = false

function NotificationUI.CreateContainer()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "Notifications"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    local container = Instance.new("Frame")
    container.Name = "Container"
    container.Size = UDim2.new(0, 400, 0, 600)
    container.Position = UDim2.new(1, -420, 0, 20)
    container.BackgroundTransparency = 1
    container.Parent = screenGui
    
    local listLayout = Instance.new("UIListLayout")
    listLayout.SortOrder = Enum.SortOrder.LayoutOrder
    listLayout.Padding = UDim.new(0, 10)
    listLayout.VerticalAlignment = Enum.VerticalAlignment.Top
    listLayout.Parent = container
    
    screenGui.Parent = playerGui
    return screenGui
end

function NotificationUI.Show(title, message, notifType)
    notifType = notifType or "info" -- info, success, error, warning
    
    local container = playerGui:FindFirstChild("Notifications")
    if not container then
        container = NotificationUI.CreateContainer()
    end
    container = container.Container
    
    -- Create notification
    local notif = Instance.new("Frame")
    notif.Name = "Notification"
    notif.Size = UDim2.new(1, 0, 0, 0)
    notif.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    notif.BorderSizePixel = 0
    notif.ClipsDescendants = true
    notif.Parent = container
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = notif
    
    -- Color bar based on type
    local colorBar = Instance.new("Frame")
    colorBar.Name = "ColorBar"
    colorBar.Size = UDim2.new(0, 5, 1, 0)
    colorBar.BorderSizePixel = 0
    colorBar.Parent = notif
    
    if notifType == "success" then
        colorBar.BackgroundColor3 = Color3.fromRGB(85, 255, 127)
    elseif notifType == "error" then
        colorBar.BackgroundColor3 = Color3.fromRGB(255, 60, 60)
    elseif notifType == "warning" then
        colorBar.BackgroundColor3 = Color3.fromRGB(255, 215, 0)
    else
        colorBar.BackgroundColor3 = Color3.fromRGB(85, 170, 255)
    end
    
    -- Icon
    local icon = Instance.new("TextLabel")
    icon.Size = UDim2.new(0, 40, 1, 0)
    icon.Position = UDim2.new(0, 10, 0, 0)
    icon.BackgroundTransparency = 1
    icon.TextSize = 24
    icon.Font = Enum.Font.GothamBold
    icon.TextColor3 = colorBar.BackgroundColor3
    icon.Parent = notif
    
    if notifType == "success" then
        icon.Text = "✓"
    elseif notifType == "error" then
        icon.Text = "✕"
    elseif notifType == "warning" then
        icon.Text = "⚠"
    else
        icon.Text = "ℹ"
    end
    
    -- Title
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Name = "Title"
    titleLabel.Size = UDim2.new(1, -60, 0, 25)
    titleLabel.Position = UDim2.new(0, 50, 0, 5)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = title
    titleLabel.TextSize = 16
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.TextTruncate = Enum.TextTruncate.AtEnd
    titleLabel.Parent = notif
    
    -- Message
    local messageLabel = Instance.new("TextLabel")
    messageLabel.Name = "Message"
    messageLabel.Size = UDim2.new(1, -60, 0, 35)
    messageLabel.Position = UDim2.new(0, 50, 0, 25)
    messageLabel.BackgroundTransparency = 1
    messageLabel.Text = message
    messageLabel.TextSize = 14
    messageLabel.Font = Enum.Font.Gotham
    messageLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    messageLabel.TextXAlignment = Enum.TextXAlignment.Left
    messageLabel.TextYAlignment = Enum.TextYAlignment.Top
    messageLabel.TextWrapped = true
    messageLabel.Parent = notif
    
    -- Animate in
    local targetHeight = 70
    TweenService:Create(notif, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Size = UDim2.new(1, 0, 0, targetHeight)
    }):Play()
    
    -- Play sound
    if _G.SoundManager then
        if notifType == "success" then
            _G.SoundManager.PlaySound("Success")
        elseif notifType == "error" then
            _G.SoundManager.PlaySound("Error")
        end
    end
    
    -- Auto-dismiss after 5 seconds
    task.delay(5, function()
        if notif and notif.Parent then
            local tweenOut = TweenService:Create(notif, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.In), {
                Size = UDim2.new(1, 0, 0, 0)
            })
            tweenOut:Play()
            tweenOut.Completed:Connect(function()
                notif:Destroy()
            end)
        end
    end)
end

-- Listen for server notifications
local eventsFolder = ReplicatedStorage:WaitForChild("Events", 10)
if eventsFolder then
    local notifyEvent = eventsFolder:FindFirstChild("Notify")
    if not notifyEvent then
        notifyEvent = Instance.new("RemoteEvent")
        notifyEvent.Name = "Notify"
        notifyEvent.Parent = eventsFolder
    end
    
    notifyEvent.OnClientEvent:Connect(function(title, message, notifType)
        NotificationUI.Show(title, message, notifType)
    end)
end

-- Export globally
_G.Notify = NotificationUI.Show

return NotificationUI
