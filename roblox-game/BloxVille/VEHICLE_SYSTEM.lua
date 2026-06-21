--[[
    PHOTOREALISTIC VEHICLE SYSTEM
    Place in ServerScriptService
]]

local Materials = require(game.ReplicatedStorage.PBR_MATERIAL_LIBRARY)
local VehicleSeats = {}

-- CREATE CAR MODEL
local function createCar(position, carType)
    local car = Instance.new("Model")
    car.Name = carType .. "Car"
    
    -- Body
    local body = Instance.new("Part")
    body.Size = Vector3.new(6, 3, 12)
    body.Position = position
    body.Anchored = false
    body.Material = Enum.Material.SmoothPlastic
    body.Color = Color3.fromRGB(math.random(50,255), math.random(50,255), math.random(50,255))
    body.Reflectance = 0.6
    body.Parent = car
    
    -- PBR paint
    local surface = Instance.new("SurfaceAppearance", body)
    surface.MetalnessMap = "rbxassetid://9438410912"
    surface.RoughnessMap = "rbxassetid://9438410912"
    
    -- Windows
    for _, pos in pairs({
        Vector3.new(0, 1.5, 3),  -- Windshield
        Vector3.new(0, 1.5, -3), -- Rear
        Vector3.new(2.5, 1.5, 0), -- Right
        Vector3.new(-2.5, 1.5, 0) -- Left
    }) do
        local window = Instance.new("Part")
        window.Size = Vector3.new(0.2, 2, 4)
        window.Position = body.Position + pos
        window.Anchored = false
        Materials.Apply(window, "Glass")
        window.Parent = car
        
        local weld = Instance.new("WeldConstraint")
        weld.Part0 = body
        weld.Part1 = window
        weld.Parent = body
    end
    
    -- Wheels
    for x = -2.5, 2.5, 5 do
        for z = -4, 4, 8 do
            local wheel = Instance.new("Part")
            wheel.Size = Vector3.new(2, 2, 2)
            wheel.Position = body.Position + Vector3.new(x, -1.5, z)
            wheel.Shape = Enum.PartType.Cylinder
            wheel.Orientation = Vector3.new(0, 0, 90)
            wheel.Material = Enum.Material.Rubber
            wheel.Color = Color3.fromRGB(40, 40, 40)
            wheel.Parent = car
            
            local hinge = Instance.new("HingeConstraint")
            local att0 = Instance.new("Attachment", body)
            local att1 = Instance.new("Attachment", wheel)
            att0.Position = Vector3.new(x, -1.5, z)
            att1.Position = Vector3.new(0, 0, 0)
            hinge.Attachment0 = att0
            hinge.Attachment1 = att1
            hinge.Parent = body
        end
    end
    
    -- Driver Seat
    local seat = Instance.new("VehicleSeat")
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = body.Position + Vector3.new(-1, 0, 2)
    seat.Material = Enum.Material.Fabric
    seat.Color = Color3.fromRGB(60, 60, 60)
    seat.MaxSpeed = 50
    seat.Torque = 100
    seat.TurnSpeed = 5
    seat.Parent = car
    
    local weld = Instance.new("WeldConstraint")
    weld.Part0 = body
    weld.Part1 = seat
    weld.Parent = body
    
    -- Headlights
    for x = -2, 2, 4 do
        local light = Instance.new("Part")
        light.Size = Vector3.new(1, 0.5, 0.5)
        light.Position = body.Position + Vector3.new(x, 0, 6)
        light.Material = Enum.Material.Neon
        light.Color = Color3.fromRGB(255, 255, 200)
        light.Parent = car
        
        local spotlight = Instance.new("SpotLight", light)
        spotlight.Brightness = 5
        spotlight.Range = 60
        spotlight.Angle = 45
        spotlight.Face = Enum.NormalId.Front
        spotlight.Shadows = true
        
        local weld = Instance.new("WeldConstraint")
        weld.Part0 = body
        weld.Part1 = light
        weld.Parent = body
    end
    
    car.Parent = workspace
    car.PrimaryPart = body
    return car
end

-- SPAWN CARS
local spawnPoints = {
    Vector3.new(-100, 2, -100),
    Vector3.new(100, 2, -100),
    Vector3.new(-100, 2, 100),
    Vector3.new(100, 2, 100),
    Vector3.new(0, 2, 0)
}

for i, pos in ipairs(spawnPoints) do
    createCar(pos, "Sedan")
end

print("✓ Photorealistic vehicles spawned")
