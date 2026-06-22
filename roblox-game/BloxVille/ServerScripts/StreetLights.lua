-- Street Lights: Auto turn on at night (polish feature)
local Lighting = game:GetService("Lighting")

local streetLights = {}

-- Create street light
local function createStreetLight(position)
	local light = Instance.new("Model")
	light.Name = "StreetLight"
	
	-- Pole
	local pole = Instance.new("Part")
	pole.Name = "Pole"
	pole.Size = Vector3.new(0.5, 8, 0.5)
	pole.Position = position
	pole.Anchored = true
	pole.Material = Enum.Material.Metal
	pole.BrickColor = BrickColor.new("Dark stone grey")
	pole.Parent = light
	
	-- Light fixture
	local fixture = Instance.new("Part")
	fixture.Name = "Fixture"
	fixture.Size = Vector3.new(1.5, 0.5, 1.5)
	fixture.Position = position + Vector3.new(0, 4.5, 0)
	fixture.Anchored = true
	fixture.Material = Enum.Material.Glass
	fixture.BrickColor = BrickColor.new("White")
	fixture.Transparency = 0.3
	fixture.Parent = light
	
	-- Point light
	local pointLight = Instance.new("PointLight")
	pointLight.Name = "Light"
	pointLight.Brightness = 2
	pointLight.Range = 30
	pointLight.Color = Color3.fromRGB(255, 220, 180) -- Warm white
	pointLight.Enabled = false -- Start off
	pointLight.Parent = fixture
	
	-- Glow effect
	local spotlight = Instance.new("SpotLight")
	spotlight.Brightness = 1.5
	spotlight.Range = 25
	spotlight.Angle = 90
	spotlight.Face = Enum.NormalId.Bottom
	spotlight.Color = Color3.fromRGB(255, 220, 180)
	spotlight.Enabled = false
	spotlight.Parent = fixture
	
	light.Parent = workspace
	table.insert(streetLights, {fixture = fixture, pointLight = pointLight, spotlight = spotlight})
	
	return light
end

-- Place street lights along roads
local function placeStreetLights()
	-- Main road lights
	for i = -100, 100, 20 do
		createStreetLight(Vector3.new(i, 0.5, 15))
		createStreetLight(Vector3.new(i, 0.5, -15))
	end
	
	-- Cross roads
	for i = -100, 100, 20 do
		createStreetLight(Vector3.new(15, 0.5, i))
		createStreetLight(Vector3.new(-15, 0.5, i))
	end
end

-- Control lights based on time
local function manageLights()
	while true do
		local clockTime = Lighting.ClockTime
		local shouldBeOn = clockTime >= 18 or clockTime <= 6
		
		for _, lightData in pairs(streetLights) do
			lightData.pointLight.Enabled = shouldBeOn
			lightData.spotlight.Enabled = shouldBeOn
			
			if shouldBeOn then
				lightData.fixture.Material = Enum.Material.Neon
			else
				lightData.fixture.Material = Enum.Material.Glass
			end
		end
		
		wait(30) -- Check every 30 seconds
	end
end

-- Initialize
wait(3) -- Wait for map
placeStreetLights()
spawn(manageLights)

print("✅ StreetLights loaded - " .. #streetLights .. " lights placed")
