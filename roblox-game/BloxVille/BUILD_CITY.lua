--[[
    CITY BUILDER - Photorealistic Buildings
    Run in Studio Command Bar to generate city
]]

local Materials = require(game.ReplicatedStorage.PBR_MATERIAL_LIBRARY)

-- BUILDING GENERATOR
local function createBuilding(position, width, height, depth, buildingType)
    local building = Instance.new("Model")
    building.Name = buildingType .. "Building"
    
    -- Main structure
    local base = Instance.new("Part")
    base.Size = Vector3.new(width, height, depth)
    base.Position = position
    base.Anchored = true
    base.Parent = building
    
    if buildingType == "Modern" then
        Materials.Apply(base, "Concrete")
    elseif buildingType == "Brick" then
        Materials.Apply(base, "Brick")
    else
        Materials.Apply(base, "Metal")
    end
    
    -- Windows (grid pattern)
    local windowRows = math.floor(height / 8)
    local windowCols = math.floor(width / 6)
    
    for row = 1, windowRows do
        for col = 1, windowCols do
            local window = Instance.new("Part")
            window.Size = Vector3.new(4, 6, 0.5)
            window.Position = base.Position + Vector3.new(
                (col - windowCols/2) * 6,
                (row - windowRows/2) * 8,
                depth/2 + 0.3
            )
            window.Anchored = true
            Materials.Apply(window, "Glass")
            window.Parent = building
        end
    end
    
    building.Parent = workspace
    return building
end

-- STREET GENERATOR
local function createStreet(startPos, endPos, width)
    local length = (endPos - startPos).Magnitude
    local direction = (endPos - startPos).Unit
    
    local road = Instance.new("Part")
    road.Size = Vector3.new(width, 0.5, length)
    road.Position = startPos + direction * (length/2)
    road.CFrame = CFrame.lookAt(road.Position, road.Position + direction)
    road.Anchored = true
    Materials.Apply(road, "Asphalt")
    road.Parent = workspace
    
    -- Sidewalks
    for side = -1, 1, 2 do
        local sidewalk = Instance.new("Part")
        sidewalk.Size = Vector3.new(4, 0.6, length)
        sidewalk.Position = road.Position + Vector3.new(side * (width/2 + 2), 0.05, 0)
        sidewalk.CFrame = road.CFrame
        sidewalk.Anchored = true
        Materials.Apply(sidewalk, "Concrete")
        sidewalk.Parent = workspace
    end
    
    return road
end

-- LAMP POST
local function createLampPost(position)
    local post = Instance.new("Part")
    post.Size = Vector3.new(0.5, 12, 0.5)
    post.Position = position + Vector3.new(0, 6, 0)
    post.Anchored = true
    Materials.Apply(post, "Metal")
    post.Parent = workspace
    
    local light = Instance.new("Part")
    light.Size = Vector3.new(1.5, 1.5, 1.5)
    light.Position = position + Vector3.new(0, 12, 0)
    light.Shape = Enum.PartType.Ball
    light.Anchored = true
    light.Material = Enum.Material.Neon
    light.Color = Color3.fromRGB(255, 240, 200)
    light.Parent = workspace
    
    local pointLight = Instance.new("PointLight", light)
    pointLight.Brightness = 2
    pointLight.Range = 40
    pointLight.Color = Color3.fromRGB(255, 240, 200)
    pointLight.Shadows = true
end

-- BUILD CITY GRID
print("Building photorealistic city...")

-- Main streets (grid)
for x = -200, 200, 80 do
    createStreet(Vector3.new(x, 0, -200), Vector3.new(x, 0, 200), 20)
end

for z = -200, 200, 80 do
    createStreet(Vector3.new(-200, 0, z), Vector3.new(200, 0, z), 20)
end

-- Buildings
local buildingTypes = {"Modern", "Brick", "Metal"}
for x = -180, 180, 80 do
    for z = -180, 180, 80 do
        local bType = buildingTypes[math.random(#buildingTypes)]
        local height = math.random(30, 80)
        createBuilding(Vector3.new(x, height/2, z), 40, height, 40, bType)
    end
end

-- Street lamps
for x = -200, 200, 40 do
    for z = -200, 200, 80 do
        createLampPost(Vector3.new(x, 0, z))
    end
end

print("✓ City built - " .. #workspace:GetChildren() .. " objects")
