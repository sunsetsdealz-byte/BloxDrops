--[[
    Vehicle Models Generator
    Creates vehicle models programmatically
]]

local VehicleModels = {}

function VehicleModels.CreateBike()
    local bike = Instance.new("Model")
    bike.Name = "Bike"
    
    -- Frame
    local frame = Instance.new("Part")
    frame.Name = "Frame"
    frame.Size = Vector3.new(1, 1, 4)
    frame.BrickColor = BrickColor.new("Really red")
    frame.Material = Enum.Material.Metal
    frame.Parent = bike
    
    -- Seat
    local seat = Instance.new("VehicleSeat")
    seat.Name = "Seat"
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = frame.Position + Vector3.new(0, 1, 0)
    seat.BrickColor = BrickColor.new("Black")
    seat.MaxSpeed = 30
    seat.Torque = 50
    seat.TurnSpeed = 5
    seat.Parent = bike
    
    -- Front wheel
    local frontWheel = Instance.new("Part")
    frontWheel.Name = "FrontWheel"
    frontWheel.Size = Vector3.new(0.5, 2, 2)
    frontWheel.Position = frame.Position + Vector3.new(0, -0.5, 2)
    frontWheel.Shape = Enum.PartType.Cylinder
    frontWheel.BrickColor = BrickColor.new("Black")
    frontWheel.Material = Enum.Material.Rubber
    frontWheel.Orientation = Vector3.new(0, 0, 90)
    frontWheel.Parent = bike
    
    -- Back wheel
    local backWheel = Instance.new("Part")
    backWheel.Name = "BackWheel"
    backWheel.Size = Vector3.new(0.5, 2, 2)
    backWheel.Position = frame.Position + Vector3.new(0, -0.5, -2)
    backWheel.Shape = Enum.PartType.Cylinder
    backWheel.BrickColor = BrickColor.new("Black")
    backWheel.Material = Enum.Material.Rubber
    backWheel.Orientation = Vector3.new(0, 0, 90)
    backWheel.Parent = bike
    
    -- Weld all parts
    for _, part in ipairs(bike:GetChildren()) do
        if part:IsA("BasePart") and part ~= frame then
            local weld = Instance.new("WeldConstraint")
            weld.Part0 = frame
            weld.Part1 = part
            weld.Parent = frame
        end
    end
    
    bike.PrimaryPart = frame
    return bike
end

function VehicleModels.CreateSedan()
    local sedan = Instance.new("Model")
    sedan.Name = "Sedan"
    
    -- Body
    local body = Instance.new("Part")
    body.Name = "Body"
    body.Size = Vector3.new(6, 3, 12)
    body.BrickColor = BrickColor.new("Bright blue")
    body.Material = Enum.Material.SmoothPlastic
    body.Parent = sedan
    
    -- Roof
    local roof = Instance.new("Part")
    roof.Name = "Roof"
    roof.Size = Vector3.new(5, 2, 6)
    roof.Position = body.Position + Vector3.new(0, 2.5, -1)
    roof.BrickColor = BrickColor.new("Bright blue")
    roof.Material = Enum.Material.SmoothPlastic
    roof.Parent = sedan
    
    -- Hood (wedge)
    local hood = Instance.new("WedgePart")
    hood.Name = "Hood"
    hood.Size = Vector3.new(6, 1, 3)
    hood.Position = body.Position + Vector3.new(0, 1.5, 5)
    hood.Orientation = Vector3.new(0, 180, 0)
    hood.BrickColor = BrickColor.new("Bright blue")
    hood.Material = Enum.Material.SmoothPlastic
    hood.Parent = sedan
    
    -- Seat
    local seat = Instance.new("VehicleSeat")
    seat.Name = "Seat"
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = body.Position + Vector3.new(-1, 2, 0)
    seat.BrickColor = BrickColor.new("Black")
    seat.Transparency = 1
    seat.MaxSpeed = 50
    seat.Torque = 100
    seat.TurnSpeed = 5
    seat.Parent = sedan
    
    -- Wheels
    local wheelPositions = {
        {-3.5, -2, 3},   -- Front Left
        {3.5, -2, 3},    -- Front Right
        {-3.5, -2, -3},  -- Back Left
        {3.5, -2, -3}    -- Back Right
    }
    
    for i, pos in ipairs(wheelPositions) do
        local wheel = Instance.new("Part")
        wheel.Name = "Wheel" .. i
        wheel.Size = Vector3.new(1, 2, 2)
        wheel.Position = body.Position + Vector3.new(pos[1], pos[2], pos[3])
        wheel.Shape = Enum.PartType.Cylinder
        wheel.BrickColor = BrickColor.new("Black")
        wheel.Material = Enum.Material.Rubber
        wheel.Orientation = Vector3.new(0, 0, 90)
        wheel.Parent = sedan
    end
    
    -- Weld everything
    for _, part in ipairs(sedan:GetChildren()) do
        if part:IsA("BasePart") and part ~= body then
            local weld = Instance.new("WeldConstraint")
            weld.Part0 = body
            weld.Part1 = part
            weld.Parent = body
        end
    end
    
    sedan.PrimaryPart = body
    return sedan
end

function VehicleModels.CreateSportsCar()
    local sports = Instance.new("Model")
    sports.Name = "SportsCar"
    
    -- Body (lower and sleeker)
    local body = Instance.new("Part")
    body.Name = "Body"
    body.Size = Vector3.new(6, 2, 12)
    body.BrickColor = BrickColor.new("Really red")
    body.Material = Enum.Material.Neon
    body.Parent = sports
    
    -- Roof (smaller)
    local roof = Instance.new("Part")
    roof.Name = "Roof"
    roof.Size = Vector3.new(5, 1.5, 5)
    roof.Position = body.Position + Vector3.new(0, 1.75, 0)
    roof.BrickColor = BrickColor.new("Black")
    roof.Material = Enum.Material.Glass
    roof.Transparency = 0.5
    roof.Parent = sports
    
    -- Spoiler
    local spoiler = Instance.new("Part")
    spoiler.Name = "Spoiler"
    spoiler.Size = Vector3.new(6, 0.5, 2)
    spoiler.Position = body.Position + Vector3.new(0, 2, -6)
    spoiler.BrickColor = BrickColor.new("Really red")
    spoiler.Material = Enum.Material.Neon
    spoiler.Parent = sports
    
    -- Seat
    local seat = Instance.new("VehicleSeat")
    seat.Name = "Seat"
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = body.Position + Vector3.new(0, 1.5, 0)
    seat.BrickColor = BrickColor.new("Black")
    seat.Transparency = 1
    seat.MaxSpeed = 80
    seat.Torque = 150
    seat.TurnSpeed = 7
    seat.Parent = sports
    
    -- Wheels (lower profile)
    local wheelPositions = {
        {-3.5, -1.5, 4},
        {3.5, -1.5, 4},
        {-3.5, -1.5, -4},
        {3.5, -1.5, -4}
    }
    
    for i, pos in ipairs(wheelPositions) do
        local wheel = Instance.new("Part")
        wheel.Name = "Wheel" .. i
        wheel.Size = Vector3.new(1, 2.5, 2.5)
        wheel.Position = body.Position + Vector3.new(pos[1], pos[2], pos[3])
        wheel.Shape = Enum.PartType.Cylinder
        wheel.BrickColor = BrickColor.new("Black")
        wheel.Material = Enum.Material.Rubber
        wheel.Orientation = Vector3.new(0, 0, 90)
        wheel.Parent = sports
    end
    
    -- Weld
    for _, part in ipairs(sports:GetChildren()) do
        if part:IsA("BasePart") and part ~= body then
            local weld = Instance.new("WeldConstraint")
            weld.Part0 = body
            weld.Part1 = part
            weld.Parent = body
        end
    end
    
    sports.PrimaryPart = body
    return sports
end

function VehicleModels.CreateLambo()
    local lambo = Instance.new("Model")
    lambo.Name = "Lambo"
    
    -- Body (very low and wide)
    local body = Instance.new("Part")
    body.Name = "Body"
    body.Size = Vector3.new(7, 1.5, 13)
    body.BrickColor = BrickColor.new("New Yeller")
    body.Material = Enum.Material.Neon
    body.Parent = lambo
    
    -- Roof (tiny)
    local roof = Instance.new("Part")
    roof.Name = "Roof"
    roof.Size = Vector3.new(6, 1, 4)
    roof.Position = body.Position + Vector3.new(0, 1.25, 0)
    roof.BrickColor = BrickColor.new("Black")
    roof.Material = Enum.Material.Glass
    roof.Transparency = 0.7
    roof.Parent = lambo
    
    -- Spoiler (aggressive)
    local spoiler = Instance.new("Part")
    spoiler.Name = "Spoiler"
    spoiler.Size = Vector3.new(7, 0.5, 2.5)
    spoiler.Position = body.Position + Vector3.new(0, 2.5, -6.5)
    spoiler.BrickColor = BrickColor.new("New Yeller")
    spoiler.Material = Enum.Material.Neon
    spoiler.Parent = lambo
    
    -- Seat
    local seat = Instance.new("VehicleSeat")
    seat.Name = "Seat"
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = body.Position + Vector3.new(0, 1.25, 0)
    seat.BrickColor = BrickColor.new("Black")
    seat.Transparency = 1
    seat.MaxSpeed = 100
    seat.Torque = 200
    seat.TurnSpeed = 8
    seat.Parent = lambo
    
    -- Wheels (wide stance)
    local wheelPositions = {
        {-4, -1.25, 5},
        {4, -1.25, 5},
        {-4, -1.25, -5},
        {4, -1.25, -5}
    }
    
    for i, pos in ipairs(wheelPositions) do
        local wheel = Instance.new("Part")
        wheel.Name = "Wheel" .. i
        wheel.Size = Vector3.new(1.5, 3, 3)
        wheel.Position = body.Position + Vector3.new(pos[1], pos[2], pos[3])
        wheel.Shape = Enum.PartType.Cylinder
        wheel.BrickColor = BrickColor.new("Black")
        wheel.Material = Enum.Material.Rubber
        wheel.Orientation = Vector3.new(0, 0, 90)
        wheel.Parent = lambo
    end
    
    -- Weld
    for _, part in ipairs(lambo:GetChildren()) do
        if part:IsA("BasePart") and part ~= body then
            local weld = Instance.new("WeldConstraint")
            weld.Part0 = body
            weld.Part1 = part
            weld.Parent = body
        end
    end
    
    lambo.PrimaryPart = body
    return lambo
end

function VehicleModels.CreateHelicopter()
    local heli = Instance.new("Model")
    heli.Name = "Helicopter"
    
    -- Body
    local body = Instance.new("Part")
    body.Name = "Body"
    body.Size = Vector3.new(6, 4, 10)
    body.BrickColor = BrickColor.new("White")
    body.Material = Enum.Material.SmoothPlastic
    body.Parent = heli
    
    -- Cockpit
    local cockpit = Instance.new("Part")
    cockpit.Name = "Cockpit"
    cockpit.Size = Vector3.new(5, 3, 4)
    cockpit.Position = body.Position + Vector3.new(0, 1, 3)
    cockpit.BrickColor = BrickColor.new("Black")
    cockpit.Material = Enum.Material.Glass
    cockpit.Transparency = 0.5
    cockpit.Parent = heli
    
    -- Tail
    local tail = Instance.new("Part")
    tail.Name = "Tail"
    tail.Size = Vector3.new(2, 2, 8)
    tail.Position = body.Position + Vector3.new(0, 1, -9)
    tail.BrickColor = BrickColor.new("White")
    tail.Material = Enum.Material.SmoothPlastic
    tail.Parent = heli
    
    -- Main rotor base
    local rotorBase = Instance.new("Part")
    rotorBase.Name = "RotorBase"
    rotorBase.Size = Vector3.new(1, 1, 1)
    rotorBase.Position = body.Position + Vector3.new(0, 3, 0)
    rotorBase.BrickColor = BrickColor.new("Dark stone grey")
    rotorBase.Material = Enum.Material.Metal
    rotorBase.Parent = heli
    
    -- Main rotor blades
    local blade1 = Instance.new("Part")
    blade1.Name = "Blade1"
    blade1.Size = Vector3.new(1, 0.2, 12)
    blade1.Position = rotorBase.Position + Vector3.new(0, 0.5, 0)
    blade1.BrickColor = BrickColor.new("Black")
    blade1.Material = Enum.Material.Metal
    blade1.Parent = heli
    
    local blade2 = Instance.new("Part")
    blade2.Name = "Blade2"
    blade2.Size = Vector3.new(12, 0.2, 1)
    blade2.Position = rotorBase.Position + Vector3.new(0, 0.5, 0)
    blade2.BrickColor = BrickColor.new("Black")
    blade2.Material = Enum.Material.Metal
    blade2.Parent = heli
    
    -- Seat
    local seat = Instance.new("VehicleSeat")
    seat.Name = "Seat"
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = body.Position + Vector3.new(0, 0, 2)
    seat.BrickColor = BrickColor.new("Black")
    seat.Transparency = 1
    seat.MaxSpeed = 120
    seat.Torque = 250
    seat.TurnSpeed = 10
    seat.Parent = heli
    
    -- Skids (landing gear)
    local skid1 = Instance.new("Part")
    skid1.Name = "Skid1"
    skid1.Size = Vector3.new(1, 0.5, 8)
    skid1.Position = body.Position + Vector3.new(-3, -2.5, 0)
    skid1.BrickColor = BrickColor.new("Dark stone grey")
    skid1.Material = Enum.Material.Metal
    skid1.Parent = heli
    
    local skid2 = Instance.new("Part")
    skid2.Name = "Skid2"
    skid2.Size = Vector3.new(1, 0.5, 8)
    skid2.Position = body.Position + Vector3.new(3, -2.5, 0)
    skid2.BrickColor = BrickColor.new("Dark stone grey")
    skid2.Material = Enum.Material.Metal
    skid2.Parent = heli
    
    -- Weld everything
    for _, part in ipairs(heli:GetChildren()) do
        if part:IsA("BasePart") and part ~= body then
            local weld = Instance.new("WeldConstraint")
            weld.Part0 = body
            weld.Part1 = part
            weld.Parent = body
        end
    end
    
    -- Add BodyVelocity for flight
    local bodyVelocity = Instance.new("BodyVelocity")
    bodyVelocity.MaxForce = Vector3.new(0, 0, 0)
    bodyVelocity.Velocity = Vector3.new(0, 0, 0)
    bodyVelocity.Parent = body
    
    heli.PrimaryPart = body
    return heli
end

-- Initialize vehicles in ReplicatedStorage
function VehicleModels.InitializeVehicles()
    local ReplicatedStorage = game:GetService("ReplicatedStorage")
    
    local vehiclesFolder = ReplicatedStorage:FindFirstChild("Vehicles")
    if not vehiclesFolder then
        vehiclesFolder = Instance.new("Folder")
        vehiclesFolder.Name = "Vehicles"
        vehiclesFolder.Parent = ReplicatedStorage
    end
    
    -- Create all vehicle models
    local bike = VehicleModels.CreateBike()
    bike.Parent = vehiclesFolder
    
    local sedan = VehicleModels.CreateSedan()
    sedan.Parent = vehiclesFolder
    
    local sports = VehicleModels.CreateSportsCar()
    sports.Parent = vehiclesFolder
    
    local lambo = VehicleModels.CreateLambo()
    lambo.Parent = vehiclesFolder
    
    local heli = VehicleModels.CreateHelicopter()
    heli.Parent = vehiclesFolder
    
    print("✅ All vehicle models created!")
end

-- Auto-initialize
VehicleModels.InitializeVehicles()

return VehicleModels
