--[[
    COMPLETE SPAWN SETUP
    
    Creates:
    1. WELCOME TO BLOXVILLE cyan sign
    2. Spawn point in front of it
    3. All players spawn facing the sign
    
    ONE SCRIPT - Run in Command Bar
]]

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

-- POSITIONS
local SIGN_POSITION = Vector3.new(0, 10, -30)
local SPAWN_POSITION = Vector3.new(0, 4.5, -50)

-- ===== CREATE WELCOME SIGN =====
local oldSign = workspace:FindFirstChild("WelcomeSign")
if oldSign then oldSign:Destroy() end

local signModel = Instance.new("Model")
signModel.Name = "WelcomeSign"

-- Cyan neon sign board
local signBoard = Instance.new("Part")
signBoard.Name = "SignBoard"
signBoard.Size = Vector3.new(40, 20, 1)
signBoard.Position = SIGN_POSITION
signBoard.Anchored = true
signBoard.CanCollide = false
signBoard.Material = Enum.Material.Neon
signBoard.Color = Color3.fromRGB(0, 255, 255)
signBoard.Transparency = 0.1
signBoard.Parent = signModel

-- Text display
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.AlwaysOnTop = false
surfaceGui.LightInfluence = 0
surfaceGui.Parent = signBoard

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

-- Glow effect
local light = Instance.new("PointLight")
light.Brightness = 5
light.Range = 50
light.Color = Color3.fromRGB(0, 255, 255)
light.Parent = signBoard

-- Pulsing animation
local pulseInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
TweenService:Create(signBoard, pulseInfo, {Transparency = 0.3}):Play()
TweenService:Create(light, pulseInfo, {Brightness = 8}):Play()

signModel.Parent = workspace

-- ===== CREATE SPAWN POINT =====
for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("SpawnLocation") then
        obj:Destroy()
    end
end

local spawnPart = Instance.new("SpawnLocation")
spawnPart.Name = "MainSpawn"
spawnPart.Size = Vector3.new(10, 1, 10)
spawnPart.Position = SPAWN_POSITION
spawnPart.Anchored = true
spawnPart.CanCollide = true
spawnPart.Transparency = 0.5
spawnPart.BrickColor = BrickColor.new("Bright green")
spawnPart.Duration = 0
spawnPart.Neutral = false
spawnPart.Parent = workspace

-- ===== FORCE SPAWN & FACE SIGN =====
local function spawnPlayer(character)
    local hrp = character:WaitForChild("HumanoidRootPart", 5)
    if hrp then
        task.wait(0.2)
        -- Position player and make them face the sign
        local lookAt = SIGN_POSITION
        local spawnPos = SPAWN_POSITION + Vector3.new(0, 3, 0)
        hrp.CFrame = CFrame.new(spawnPos, Vector3.new(lookAt.X, spawnPos.Y, lookAt.Z))
    end
end

for _, player in ipairs(Players:GetPlayers()) do
    if player.Character then
        spawnPlayer(player.Character)
    end
    player.CharacterAdded:Connect(spawnPlayer)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(spawnPlayer)
end)

print("✅ COMPLETE SETUP DONE!")
print("📍 Sign at:", SIGN_POSITION)
print("📍 Spawn at:", SPAWN_POSITION)
print("💡 Players spawn facing the cyan WELCOME sign")
