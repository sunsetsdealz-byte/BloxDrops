--[[
    Best Graphics Settings for BloxVille
    Place in StarterPlayer > StarterPlayerScripts
]]

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")

-- Wait for player
local player = Players.LocalPlayer

-- Graphics Configuration
local function setupGraphics()
    -- Lighting Settings
    Lighting.Brightness = 2
    Lighting.Ambient = Color3.fromRGB(100, 100, 120)
    Lighting.OutdoorAmbient = Color3.fromRGB(120, 120, 140)
    Lighting.ColorShift_Top = Color3.fromRGB(255, 240, 220)
    Lighting.ColorShift_Bottom = Color3.fromRGB(180, 200, 220)
    Lighting.ClockTime = 14
    Lighting.GeographicLatitude = 41.73
    Lighting.EnvironmentDiffuseScale = 0.5
    Lighting.EnvironmentSpecularScale = 0.5
    
    -- Atmosphere
    local atmosphere = Lighting:FindFirstChildOfClass("Atmosphere")
    if not atmosphere then
        atmosphere = Instance.new("Atmosphere")
        atmosphere.Parent = Lighting
    end
    atmosphere.Density = 0.3
    atmosphere.Offset = 0.25
    atmosphere.Color = Color3.fromRGB(199, 199, 199)
    atmosphere.Decay = Color3.fromRGB(106, 112, 125)
    atmosphere.Glare = 0
    atmosphere.Haze = 0
    
    -- Bloom
    local bloom = Lighting:FindFirstChildOfClass("BloomEffect")
    if not bloom then
        bloom = Instance.new("BloomEffect")
        bloom.Parent = Lighting
    end
    bloom.Intensity = 0.4
    bloom.Size = 24
    bloom.Threshold = 2
    
    -- ColorCorrection
    local colorCorrection = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
    if not colorCorrection then
        colorCorrection = Instance.new("ColorCorrectionEffect")
        colorCorrection.Parent = Lighting
    end
    colorCorrection.Brightness = 0.02
    colorCorrection.Contrast = 0.1
    colorCorrection.Saturation = 0.1
    colorCorrection.TintColor = Color3.fromRGB(255, 255, 255)
    
    -- SunRays
    local sunRays = Lighting:FindFirstChildOfClass("SunRaysEffect")
    if not sunRays then
        sunRays = Instance.new("SunRaysEffect")
        sunRays.Parent = Lighting
    end
    sunRays.Intensity = 0.15
    sunRays.Spread = 0.4
    
    -- DepthOfField (subtle)
    local dof = Lighting:FindFirstChildOfClass("DepthOfFieldEffect")
    if not dof then
        dof = Instance.new("DepthOfFieldEffect")
        dof.Parent = Lighting
    end
    dof.FarIntensity = 0.1
    dof.FocusDistance = 50
    dof.InFocusRadius = 40
    dof.NearIntensity = 0.2
    
    -- Remove fog
    Lighting.FogEnd = 10000
    Lighting.FogStart = 0
end

-- Camera Settings
local function setupCamera()
    local camera = workspace.CurrentCamera
    if camera then
        camera.FieldOfView = 80 -- Wider FOV
    end
end

-- Apply settings
setupGraphics()
setupCamera()

print("✓ Graphics optimized")
