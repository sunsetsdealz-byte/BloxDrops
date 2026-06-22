--[[
    Lighting Setup - Professional Quality
    Makes the game look better than Brookhaven
]]

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Configure lighting
Lighting.Ambient = Color3.fromRGB(100, 100, 120)
Lighting.Brightness = 2
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 0)
Lighting.ColorShift_Top = Color3.fromRGB(255, 247, 237)
Lighting.EnvironmentDiffuseScale = 0.5
Lighting.EnvironmentSpecularScale = 0.5
Lighting.GlobalShadows = true
Lighting.OutdoorAmbient = Color3.fromRGB(127, 127, 127)
Lighting.ShadowSoftness = 0.2
Lighting.ClockTime = 14
Lighting.GeographicLatitude = 41.73

-- Add Atmosphere
local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = 0.3
atmosphere.Offset = 0.25
atmosphere.Color = Color3.fromRGB(199, 199, 199)
atmosphere.Decay = Color3.fromRGB(106, 112, 125)
atmosphere.Glare = 0
atmosphere.Haze = 0
atmosphere.Parent = Lighting

-- Add Bloom
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.4
bloom.Size = 24
bloom.Threshold = 2
bloom.Parent = Lighting

-- Add ColorCorrection
local colorCorrection = Instance.new("ColorCorrectionEffect")
colorCorrection.Brightness = 0.02
colorCorrection.Contrast = 0.1
colorCorrection.Saturation = 0.1
colorCorrection.TintColor = Color3.fromRGB(255, 255, 255)
colorCorrection.Parent = Lighting

-- Add SunRays
local sunRays = Instance.new("SunRaysEffect")
sunRays.Intensity = 0.1
sunRays.Spread = 0.1
sunRays.Parent = Lighting

-- Add DepthOfField (subtle)
local depthOfField = Instance.new("DepthOfFieldEffect")
depthOfField.FarIntensity = 0.1
depthOfField.FocusDistance = 50
depthOfField.InFocusRadius = 40
depthOfField.NearIntensity = 0.5
depthOfField.Parent = Lighting

-- Sky
local sky = Instance.new("Sky")
sky.SkyboxBk = "rbxassetid://401664839"
sky.SkyboxDn = "rbxassetid://401664862"
sky.SkyboxFt = "rbxassetid://401664960"
sky.SkyboxLf = "rbxassetid://401664881"
sky.SkyboxRt = "rbxassetid://401664901"
sky.SkyboxUp = "rbxassetid://401664936"
sky.Parent = Lighting

print("✅ Professional lighting setup complete")
