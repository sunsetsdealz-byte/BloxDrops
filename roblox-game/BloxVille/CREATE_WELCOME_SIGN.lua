--[[
    CREATE WELCOME TO BLOXVILLE SIGN
    
    Creates a large cyan neon sign that says "WELCOME TO BLOXVILLE"
    Players will see this when they spawn
    
    Run in Command Bar
]]

-- Delete old sign if exists
local oldSign = workspace:FindFirstChild("WelcomeSign")
if oldSign then oldSign:Destroy() end

-- Create sign model
local signModel = Instance.new("Model")
signModel.Name = "WelcomeSign"

-- Main sign background (cyan glow)
local signBoard = Instance.new("Part")
signBoard.Name = "SignBoard"
signBoard.Size = Vector3.new(40, 20, 1)  -- Large billboard
signBoard.Position = Vector3.new(0, 10, -30)  -- In front of spawn
signBoard.Anchored = true
signBoard.CanCollide = false
signBoard.Material = Enum.Material.Neon
signBoard.Color = Color3.fromRGB(0, 255, 255)  -- Cyan
signBoard.Transparency = 0.1
signBoard.Parent = signModel

-- Add text using SurfaceGui
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.AlwaysOnTop = false
surfaceGui.LightInfluence = 0
surfaceGui.Parent = signBoard

-- "WELCOME TO" text
local welcomeText = Instance.new("TextLabel")
welcomeText.Size = UDim2.new(1, 0, 0.4, 0)
welcomeText.Position = UDim2.new(0, 0, 0.15, 0)
welcomeText.BackgroundTransparency = 1
welcomeText.Text = "WELCOME TO"
welcomeText.TextSize = 120
welcomeText.Font = Enum.Font.GothamBold
welcomeText.TextColor3 = Color3.fromRGB(255, 255, 255)
welcomeText.TextStrokeTransparency = 0
welcomeText.TextStrokeColor3 = Color3.fromRGB(0, 200, 200)
welcomeText.Parent = surfaceGui

-- "BLOXVILLE" text (bigger)
local bloxvilleText = Instance.new("TextLabel")
bloxvilleText.Size = UDim2.new(1, 0, 0.5, 0)
bloxvilleText.Position = UDim2.new(0, 0, 0.45, 0)
bloxvilleText.BackgroundTransparency = 1
bloxvilleText.Text = "BLOXVILLE"
bloxvilleText.TextSize = 150
bloxvilleText.Font = Enum.Font.GothamBold
bloxvilleText.TextColor3 = Color3.fromRGB(255, 255, 255)
bloxvilleText.TextStrokeTransparency = 0
bloxvilleText.TextStrokeColor3 = Color3.fromRGB(0, 200, 200)
bloxvilleText.Parent = surfaceGui

-- Add glow effect with PointLight
local light = Instance.new("PointLight")
light.Brightness = 5
light.Range = 50
light.Color = Color3.fromRGB(0, 255, 255)
light.Parent = signBoard

-- Pulsing animation
local TweenService = game:GetService("TweenService")
local pulseInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
local pulseTween = TweenService:Create(signBoard, pulseInfo, {Transparency = 0.3})
pulseTween:Play()

local lightTween = TweenService:Create(light, pulseInfo, {Brightness = 8})
lightTween:Play()

signModel.Parent = workspace

print("✅ WELCOME TO BLOXVILLE sign created!")
print("📍 Position:", signBoard.Position)
print("💡 Cyan neon with pulsing glow effect")
print("⚙️ To adjust position, change line 20")
