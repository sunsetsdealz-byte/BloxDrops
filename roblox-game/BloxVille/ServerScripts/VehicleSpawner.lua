--[[
    Vehicle Spawner
    Manages vehicle spawning and ownership
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local DataStore = require(script.Parent.DataStore)
local Config = require(ReplicatedStorage.Modules.Config)

local VehicleSpawner = {}
local SpawnedVehicles = {}

-- Spawn vehicle
function VehicleSpawner.SpawnVehicle(player, vehicleType)
    local profile = DataStore.GetProfile(player)
    if not profile then return false, "Data not loaded" end
    
    local vehicleConfig = Config.Vehicles[vehicleType]
    if not vehicleConfig then return false, "Invalid vehicle" end
    
    -- Check ownership
    if not table.find(profile.Data.Vehicles, vehicleType) then
        return false, "You don't own this vehicle"
    end
    
    -- Check VIP requirement
    if vehicleConfig.VIPOnly and not profile.Data.VIP then
        return false, "VIP required"
    end
    
    -- Despawn existing vehicle
    if SpawnedVehicles[player.UserId] then
        SpawnedVehicles[player.UserId]:Destroy()
    end
    
    -- Create vehicle (basic model)
    local vehicle = Instance.new("Model")
    vehicle.Name = vehicleType
    
    local body = Instance.new("Part")
    body.Name = "Body"
    body.Size = Vector3.new(6, 3, 12)
    body.BrickColor = BrickColor.Random()
    body.Material = Enum.Material.SmoothPlastic
    body.Parent = vehicle
    
    -- Add VehicleSeat
    local seat = Instance.new("VehicleSeat")
    seat.Size = Vector3.new(2, 1, 2)
    seat.Position = body.Position + Vector3.new(0, 2, -2)
    seat.MaxSpeed = vehicleConfig.Speed
    seat.Torque = 10000
    seat.TurnSpeed = 5
    seat.Parent = vehicle
    
    -- Add wheels (basic)
    for i = 1, 4 do
        local wheel = Instance.new("Part")
        wheel.Name = "Wheel" .. i
        wheel.Shape = Enum.PartType.Cylinder
        wheel.Size = Vector3.new(1, 2, 2)
        wheel.BrickColor = BrickColor.new("Really black")
        wheel.Material = Enum.Material.Rubber
        
        local xOffset = (i % 2 == 0) and 3 or -3
        local zOffset = (i <= 2) and 4 or -4
        wheel.Position = body.Position + Vector3.new(xOffset, -1.5, zOffset)
        wheel.Orientation = Vector3.new(0, 0, 90)
        wheel.Parent = vehicle
        
        -- Weld to body
        local weld = Instance.new("WeldConstraint")
        weld.Part0 = body
        weld.Part1 = wheel
        weld.Parent = wheel
    end
    
    vehicle.PrimaryPart = body
    
    -- Spawn location
    if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
        local spawnPos = player.Character.HumanoidRootPart.Position + Vector3.new(0, 5, 10)
        vehicle:SetPrimaryPartCFrame(CFrame.new(spawnPos))
    end
    
    vehicle.Parent = workspace
    SpawnedVehicles[player.UserId] = vehicle
    
    return true, "Vehicle spawned!"
end

-- Buy vehicle
function VehicleSpawner.BuyVehicle(player, vehicleType)
    local profile = DataStore.GetProfile(player)
    if not profile then return false, "Data not loaded" end
    
    local vehicleConfig = Config.Vehicles[vehicleType]
    if not vehicleConfig then return false, "Invalid vehicle" end
    
    -- Check if already owned
    if table.find(profile.Data.Vehicles, vehicleType) then
        return false, "Already own this vehicle"
    end
    
    -- Check VIP requirement
    if vehicleConfig.VIPOnly and not profile.Data.VIP then
        return false, "VIP required"
    end
    
    -- Check cash
    if profile.Data.Cash < vehicleConfig.Price then
        return false, "Not enough cash"
    end
    
    -- Purchase
    local success = DataStore.RemoveCash(player, vehicleConfig.Price)
    if not success then return false, "Transaction failed" end
    
    table.insert(profile.Data.Vehicles, vehicleType)
    
    return true, "Vehicle purchased!"
end

-- Despawn vehicle
function VehicleSpawner.DespawnVehicle(player)
    if SpawnedVehicles[player.UserId] then
        SpawnedVehicles[player.UserId]:Destroy()
        SpawnedVehicles[player.UserId] = nil
        return true
    end
    return false
end

-- Cleanup on leave
game.Players.PlayerRemoving:Connect(function(player)
    VehicleSpawner.DespawnVehicle(player)
end)

-- Setup remote events
local events = ReplicatedStorage:WaitForChild("Events")

events.SpawnVehicle.OnServerEvent:Connect(function(player, vehicleType)
    local success, message = VehicleSpawner.SpawnVehicle(player, vehicleType)
    events.SpawnVehicleResponse:FireClient(player, success, message)
end)

events.BuyVehicle.OnServerEvent:Connect(function(player, vehicleType)
    local success, message = VehicleSpawner.BuyVehicle(player, vehicleType)
    events.BuyVehicleResponse:FireClient(player, success, message)
end)

events.DespawnVehicle.OnServerEvent:Connect(function(player)
    VehicleSpawner.DespawnVehicle(player)
end)

return VehicleSpawner
