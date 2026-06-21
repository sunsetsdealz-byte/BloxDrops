--[[
    DYNAMIC WEATHER SYSTEM
    Rain, fog, day/night cycle with photorealistic effects
    Place in ServerScriptService
]]

local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

local WeatherSystem = {}
WeatherSystem.CurrentWeather = "Clear"

-- DAY/NIGHT CYCLE
local function startDayNightCycle()
    spawn(function()
        while true do
            -- Sunrise (6:00 to 8:00)
            local sunrise = TweenService:Create(Lighting, TweenInfo.new(120), {
                ClockTime = 8,
                Brightness = 2.5,
                OutdoorAmbient = Color3.fromRGB(255, 200, 150)
            })
            sunrise:Play()
            wait(120)
            
            -- Day (8:00 to 18:00)
            local day = TweenService:Create(Lighting, TweenInfo.new(600), {
                ClockTime = 18,
                Brightness = 3,
                OutdoorAmbient = Color3.fromRGB(128, 128, 128)
            })
            day:Play()
            wait(600)
            
            -- Sunset (18:00 to 20:00)
            local sunset = TweenService:Create(Lighting, TweenInfo.new(120), {
                ClockTime = 20,
                Brightness = 1.5,
                OutdoorAmbient = Color3.fromRGB(255, 140, 80)
            })
            sunset:Play()
            wait(120)
            
            -- Night (20:00 to 6:00)
            local night = TweenService:Create(Lighting, TweenInfo.new(600), {
                ClockTime = 6,
                Brightness = 0.5,
                OutdoorAmbient = Color3.fromRGB(30, 30, 50)
            })
            night:Play()
            wait(600)
        end
    end)
end

-- RAIN EFFECT
function WeatherSystem.StartRain()
    WeatherSystem.CurrentWeather = "Rain"
    
    -- Darken sky
    local atmos = Lighting:FindFirstChildOfClass("Atmosphere")
    if atmos then
        atmos.Density = 0.5
        atmos.Haze = 3
    end
    
    -- Fog
    Lighting.FogEnd = 300
    Lighting.FogColor = Color3.fromRGB(150, 150, 150)
    
    -- Rain particles
    local rainEmitter = Instance.new("ParticleEmitter")
    rainEmitter.Name = "Rain"
    rainEmitter.Texture = "rbxasset://textures/particles/smoke_main.dds"
    rainEmitter.Color = ColorSequence.new(Color3.fromRGB(200, 220, 255))
    rainEmitter.Size = NumberSequence.new(0.3)
    rainEmitter.Transparency = NumberSequence.new(0.5)
    rainEmitter.Lifetime = NumberRange.new(1, 2)
    rainEmitter.Rate = 500
    rainEmitter.Speed = NumberRange.new(50, 60)
    rainEmitter.SpreadAngle = Vector2.new(10, 10)
    rainEmitter.VelocityInheritance = 0
    rainEmitter.EmissionDirection = Enum.NormalId.Bottom
    
    -- Attach to camera
    local Players = game:GetService("Players")
    for _, player in pairs(Players:GetPlayers()) do
        if player.Character and player.Character:FindFirstChild("Head") then
            local rain = rainEmitter:Clone()
            rain.Parent = player.Character.Head
        end
    end
    
    print("🌧️ Rain started")
end

-- CLEAR WEATHER
function WeatherSystem.StopRain()
    WeatherSystem.CurrentWeather = "Clear"
    
    local atmos = Lighting:FindFirstChildOfClass("Atmosphere")
    if atmos then
        atmos.Density = 0.395
        atmos.Haze = 1.8
    end
    
    Lighting.FogEnd = 10000
    
    -- Remove rain
    for _, player in pairs(game.Players:GetPlayers()) do
        if player.Character then
            local rain = player.Character:FindFirstChild("Head"):FindFirstChild("Rain")
            if rain then rain:Destroy() end
        end
    end
    
    print("☀️ Clear weather")
end

-- RANDOM WEATHER CHANGES
spawn(function()
    while true do
        wait(math.random(300, 600)) -- 5-10 minutes
        if math.random() > 0.5 then
            WeatherSystem.StartRain()
            wait(math.random(60, 180)) -- Rain for 1-3 min
            WeatherSystem.StopRain()
        end
    end
end)

-- Start systems
startDayNightCycle()
print("✓ Weather system active")

return WeatherSystem
