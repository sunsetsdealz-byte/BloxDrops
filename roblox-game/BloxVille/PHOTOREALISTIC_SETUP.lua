--[[
    PHOTOREALISTIC 4K SETUP
    Install this in ServerScriptService
    Requires Future lighting technology
]]

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- LIGHTING ENGINE: Future is required for PBR
Lighting.Technology = Enum.Technology.Future

-- HIGH-END LIGHTING
Lighting.Brightness = 2.5
Lighting.Ambient = Color3.fromRGB(70, 70, 80)
Lighting.OutdoorAmbient = Color3.fromRGB(128, 128, 128)
Lighting.ColorShift_Top = Color3.fromRGB(255, 247, 230)
Lighting.ColorShift_Bottom = Color3.fromRGB(170, 180, 200)
Lighting.ClockTime = 14.5
Lighting.GeographicLatitude = 41.73
Lighting.EnvironmentDiffuseScale = 1
Lighting.EnvironmentSpecularScale = 1
Lighting.ExposureCompensation = 0.2

-- SKYBOX (4K HDR)
local sky = Lighting:FindFirstChildOfClass("Sky") or Instance.new("Sky", Lighting)
sky.SkyboxBk = "rbxassetid://8139677359"
sky.SkyboxDn = "rbxassetid://8139677253"
sky.SkyboxFt = "rbxassetid://8139677111"
sky.SkyboxLf = "rbxassetid://8139676988"
sky.SkyboxRt = "rbxassetid://8139676842"
sky.SkyboxUp = "rbxassetid://8139676647"
sky.SunAngularSize = 11
sky.MoonAngularSize = 11

-- ATMOSPHERE (Volumetric)
local atmos = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere", Lighting)
atmos.Density = 0.395
atmos.Offset = 0.5
atmos.Color = Color3.fromRGB(199, 199, 199)
atmos.Decay = Color3.fromRGB(92, 102, 119)
atmos.Glare = 0.4
atmos.Haze = 1.8

-- BLOOM (HDR glow)
local bloom = Lighting:FindFirstChildOfClass("BloomEffect") or Instance.new("BloomEffect", Lighting)
bloom.Intensity = 0.8
bloom.Size = 32
bloom.Threshold = 1.5

-- COLOR CORRECTION
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect") or Instance.new("ColorCorrectionEffect", Lighting)
cc.Brightness = 0.05
cc.Contrast = 0.15
cc.Saturation = 0.2
cc.TintColor = Color3.fromRGB(255, 252, 248)

-- SUN RAYS
local sun = Lighting:FindFirstChildOfClass("SunRaysEffect") or Instance.new("SunRaysEffect", Lighting)
sun.Intensity = 0.25
sun.Spread = 0.5

-- DEPTH OF FIELD (cinematic)
local dof = Lighting:FindFirstChildOfClass("DepthOfFieldEffect") or Instance.new("DepthOfFieldEffect", Lighting)
dof.FarIntensity = 0.15
dof.FocusDistance = 60
dof.InFocusRadius = 50
dof.NearIntensity = 0.3

-- GLOBAL SHADOWS
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = 0.2

print("✓ PHOTOREALISTIC 4K LIGHTING ACTIVE")
