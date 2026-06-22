--[[
    Map Builder
    Auto-generates the city map on server start
]]

local MapBuilder = {}

-- Create spawn area
function MapBuilder.CreateSpawnArea()
    local spawn = Instance.new("Model")
    spawn.Name = "SpawnArea"
    
    -- Main platform
    local platform = Instance.new("Part")
    platform.Name = "SpawnPlatform"
    platform.Size = Vector3.new(200, 2, 200)
    platform.Position = Vector3.new(0, 1, 0)
    platform.Anchored = true
    platform.Material = Enum.Material.Concrete
    platform.BrickColor = BrickColor.new("Dark stone grey")
    platform.Parent = spawn
    
    -- Spawn locations (grid)
    for x = -80, 80, 40 do
        for z = -80, 80, 40 do
            local spawnLoc = Instance.new("SpawnLocation")
            spawnLoc.Size = Vector3.new(6, 1, 6)
            spawnLoc.Position = Vector3.new(x, 3, z)
            spawnLoc.Anchored = true
            spawnLoc.Transparency = 0.5
            spawnLoc.BrickColor = BrickColor.new("Bright green")
            spawnLoc.CanCollide = false
            spawnLoc.Duration = 0
            spawnLoc.Parent = spawn
        end
    end
    
    -- Welcome sign
    local sign = Instance.new("Part")
    sign.Size = Vector3.new(30, 15, 2)
    sign.Position = Vector3.new(0, 10, -90)
    sign.Anchored = true
    sign.Material = Enum.Material.Neon
    sign.BrickColor = BrickColor.new("Cyan")
    sign.Parent = spawn
    
    local signText = Instance.new("SurfaceGui")
    signText.Parent = sign
    
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "WELCOME TO BLOXVILLE"
    label.TextScaled = true
    label.Font = Enum.Font.GothamBlack
    label.TextColor3 = Color3.fromRGB(255, 255, 255)
    label.Parent = signText
    
    spawn.Parent = workspace
    return spawn
end

-- Create job building
function MapBuilder.CreateJobBuilding(name, position, color, size)
    local building = Instance.new("Model")
    building.Name = name
    
    -- Make buildings BIGGER
    local buildingSize = size or Vector3.new(60, 45, 60)
    
    -- Base
    local base = Instance.new("Part")
    base.Name = "Base"
    base.Size = buildingSize
    base.Position = position
    base.Anchored = true
    base.Material = Enum.Material.Brick
    base.BrickColor = BrickColor.new(color or "Bright blue")
    base.Parent = building
    
    -- Roof
    local roof = Instance.new("Part")
    roof.Name = "Roof"
    roof.Size = Vector3.new(base.Size.X + 4, 2, base.Size.Z + 4)
    roof.Position = position + Vector3.new(0, base.Size.Y/2 + 1, 0)
    roof.Anchored = true
    roof.Material = Enum.Material.Slate
    roof.BrickColor = BrickColor.new("Really black")
    roof.Parent = building
    
    -- Door
    local door = Instance.new("Part")
    door.Name = "Door"
    door.Size = Vector3.new(8, 12, 1)
    door.Position = position + Vector3.new(0, -base.Size.Y/2 + 6, base.Size.Z/2)
    door.Anchored = true
    door.Material = Enum.Material.Wood
    door.BrickColor = BrickColor.new("Brown")
    door.Parent = building
    
    -- Get building info
    local displayName = name:upper()
    local signColor = Color3.fromRGB(255, 200, 0)
    if name:lower():find("pizza") then
        displayName = "🍕 PIZZA"
        signColor = Color3.fromRGB(220, 50, 50)
    elseif name:lower():find("hospital") then
        displayName = "🏥 HOSPITAL"
        signColor = Color3.fromRGB(255, 255, 255)
    elseif name:lower():find("store") then
        displayName = "🏪 STORE"
        signColor = Color3.fromRGB(50, 120, 220)
    elseif name:lower():find("garage") then
        displayName = "🔧 GARAGE"
        signColor = Color3.fromRGB(220, 140, 50)
    elseif name:lower():find("airport") then
        displayName = "✈️ AIRPORT"
        signColor = Color3.fromRGB(100, 180, 255)
    elseif name:lower():find("office") then
        displayName = "🏢 OFFICE"
        signColor = Color3.fromRGB(100, 100, 100)
    end
    
    -- BIGGER realistic sign (metal frame)
    local signFrame = Instance.new("Part")
    signFrame.Name = "SignFrame"
    signFrame.Size = Vector3.new(base.Size.X * 0.85, 10, 1)
    signFrame.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 5, base.Size.Z/2 + 0.6)
    signFrame.Anchored = true
    signFrame.Material = Enum.Material.Metal
    signFrame.Color = Color3.fromRGB(40, 40, 40)
    signFrame.Parent = building
    
    -- LED sign panel (realistic)
    local sign = Instance.new("Part")
    sign.Name = "Sign"
    sign.Size = Vector3.new(base.Size.X * 0.8, 8, 0.5)
    sign.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 5, base.Size.Z/2 + 1.1)
    sign.Anchored = true
    sign.Material = Enum.Material.Neon
    sign.Color = signColor
    sign.Parent = building
    
    -- White text background part
    local textBg = Instance.new("Part")
    textBg.Name = "TextBG"
    textBg.Size = Vector3.new(base.Size.X * 0.75, 7, 0.4)
    textBg.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 5, base.Size.Z/2 + 1.4)
    textBg.Anchored = true
    textBg.Material = Enum.Material.SmoothPlastic
    textBg.Color = Color3.fromRGB(255, 255, 255)
    textBg.Parent = building
    
    -- Text on white background
    local textGui = Instance.new("SurfaceGui")
    textGui.Face = Enum.NormalId.Front
    textGui.AlwaysOnTop = false
    textGui.LightInfluence = 0
    textGui.Parent = textBg
    
    local textLabel = Instance.new("TextLabel")
    textLabel.Size = UDim2.new(1, 0, 1, 0)
    textLabel.BackgroundTransparency = 1
    textLabel.Text = displayName
    textLabel.TextScaled = true
    textLabel.Font = Enum.Font.GothamBlack
    textLabel.TextColor3 = Color3.fromRGB(0, 0, 0)
    textLabel.Parent = textGui
    
    -- Interaction point
    local interaction = Instance.new("Part")
    interaction.Name = "Interaction"
    interaction.Size = Vector3.new(6, 6, 6)
    interaction.Position = position + Vector3.new(0, -base.Size.Y/2 + 3, base.Size.Z/2 + 8)
    interaction.Anchored = true
    interaction.Transparency = 0.7
    interaction.BrickColor = BrickColor.new("Lime green")
    interaction.Material = Enum.Material.Neon
    interaction.CanCollide = false
    interaction.Parent = building
    
    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Work at " .. name
    prompt.ObjectText = name
    prompt.MaxActivationDistance = 10
    prompt.Parent = interaction
    
    building.Parent = workspace
    return building
end

-- Create roads
function MapBuilder.CreateRoads()
    local roads = Instance.new("Model")
    roads.Name = "Roads"
    
    -- Main street (horizontal)
    local mainStreet = Instance.new("Part")
    mainStreet.Name = "MainStreet"
    mainStreet.Size = Vector3.new(500, 0.5, 30)
    mainStreet.Position = Vector3.new(0, 0.5, 0)
    mainStreet.Anchored = true
    mainStreet.Material = Enum.Material.Asphalt
    mainStreet.BrickColor = BrickColor.new("Really black")
    mainStreet.Parent = roads
    
    -- Side streets
    for i = -200, 200, 100 do
        local sideStreet = Instance.new("Part")
        sideStreet.Size = Vector3.new(30, 0.5, 400)
        sideStreet.Position = Vector3.new(i, 0.5, 0)
        sideStreet.Anchored = true
        sideStreet.Material = Enum.Material.Asphalt
        sideStreet.BrickColor = BrickColor.new("Really black")
        sideStreet.Parent = roads
    end
    
    roads.Parent = workspace
    return roads
end

-- Create vehicle spawn zones
function MapBuilder.CreateVehicleZones()
    local zones = Instance.new("Model")
    zones.Name = "VehicleZones"
    
    local positions = {
        Vector3.new(-150, 1, -150),
        Vector3.new(150, 1, -150),
        Vector3.new(-150, 1, 150),
        Vector3.new(150, 1, 150)
    }
    
    for i, pos in ipairs(positions) do
        local zone = Instance.new("Part")
        zone.Name = "VehicleSpawn" .. i
        zone.Size = Vector3.new(20, 0.5, 20)
        zone.Position = pos
        zone.Anchored = true
        zone.Transparency = 0.5
        zone.BrickColor = BrickColor.new("Bright blue")
        zone.Material = Enum.Material.Neon
        zone.CanCollide = false
        zone.Parent = zones
        
        -- Sign
        local sign = Instance.new("Part")
        sign.Size = Vector3.new(15, 10, 1)
        sign.Position = pos + Vector3.new(0, 6, -12)
        sign.Anchored = true
        sign.Material = Enum.Material.Neon
        sign.BrickColor = BrickColor.new("Cyan")
        sign.Parent = zones
        
        local gui = Instance.new("SurfaceGui")
        gui.Parent = sign
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = "🚗 VEHICLE SPAWN"
        label.TextScaled = true
        label.Font = Enum.Font.GothamBlack
        label.TextColor3 = Color3.fromRGB(255, 255, 255)
        label.Parent = gui
    end
    
    zones.Parent = workspace
    return zones
end

-- Build entire map
function MapBuilder.BuildMap()
    print("🏗️ Building BloxVille map...")
    
    -- Clear old map (keep lighting, camera, etc)
    for _, obj in pairs(workspace:GetChildren()) do
        if obj:IsA("Model") or (obj:IsA("Part") and obj.Name ~= "Baseplate") then
            obj:Destroy()
        end
    end
    
    -- Create baseplate if missing
    if not workspace:FindFirstChild("Baseplate") then
        local baseplate = Instance.new("Part")
        baseplate.Name = "Baseplate"
        baseplate.Size = Vector3.new(2048, 10, 2048)
        baseplate.Position = Vector3.new(0, -5, 0)
        baseplate.Anchored = true
        baseplate.Material = Enum.Material.Grass
        baseplate.BrickColor = BrickColor.new("Bright green")
        baseplate.Locked = true
        baseplate.Parent = workspace
    end
    
    -- Build components
    MapBuilder.CreateSpawnArea()
    MapBuilder.CreateRoads()
    
    -- Job buildings
    MapBuilder.CreateJobBuilding("Pizza Shop", Vector3.new(-100, 15, -100), "Bright red", Vector3.new(40, 30, 40))
    MapBuilder.CreateJobBuilding("Store", Vector3.new(100, 15, -100), "Bright blue", Vector3.new(50, 30, 50))
    MapBuilder.CreateJobBuilding("Garage", Vector3.new(-100, 15, 100), "Dark orange", Vector3.new(60, 25, 60))
    MapBuilder.CreateJobBuilding("Hospital", Vector3.new(100, 20, 100), "Institutional white", Vector3.new(70, 40, 70))
    MapBuilder.CreateJobBuilding("Airport", Vector3.new(0, 15, 200), "Light blue", Vector3.new(100, 30, 80))
    MapBuilder.CreateJobBuilding("Office Tower", Vector3.new(0, 40, -200), "Dark stone grey", Vector3.new(60, 80, 60))
    
    MapBuilder.CreateVehicleZones()
    
    -- Lighting
    local lighting = game:GetService("Lighting")
    lighting.Ambient = Color3.fromRGB(100, 100, 100)
    lighting.Brightness = 2
    lighting.OutdoorAmbient = Color3.fromRGB(150, 150, 150)
    lighting.ClockTime = 14
    
    print("✅ BloxVille map built successfully!")
end

-- Auto-build on server start
MapBuilder.BuildMap()

return MapBuilder
