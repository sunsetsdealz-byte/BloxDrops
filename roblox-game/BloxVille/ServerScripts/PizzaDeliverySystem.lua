--[[
    Pizza Delivery System
    Main gameplay mechanic - deliver pizzas for money
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local PizzaSystem = {}

-- Delivery locations
local DeliveryLocations = {
    {name = "Red House", position = Vector3.new(-50, 5, 50)},
    {name = "Blue House", position = Vector3.new(50, 5, 50)},
    {name = "Store", position = Vector3.new(0, 5, 100)},
    {name = "Hospital", position = Vector3.new(-100, 5, 0)},
    {name = "Office", position = Vector3.new(100, 5, -50)}
}

-- Active deliveries
local ActiveDeliveries = {}

-- Start delivery
function PizzaSystem.StartDelivery(player)
    if ActiveDeliveries[player.UserId] then
        return false, "You already have an active delivery!"
    end
    
    -- Pick random location
    local location = DeliveryLocations[math.random(1, #DeliveryLocations)]
    local timeLimit = 60 -- 60 seconds
    local reward = math.random(30, 60) -- $30-60
    
    -- Create delivery marker
    local marker = Instance.new("Part")
    marker.Name = "DeliveryMarker"
    marker.Size = Vector3.new(8, 0.5, 8)
    marker.Position = location.position
    marker.Anchored = true
    marker.CanCollide = false
    marker.Material = Enum.Material.Neon
    marker.Color = Color3.fromRGB(255, 200, 0)
    marker.Transparency = 0.3
    marker.Parent = workspace
    
    -- Add cylinder above
    local cylinder = Instance.new("Part")
    cylinder.Shape = Enum.PartType.Cylinder
    cylinder.Size = Vector3.new(20, 8, 8)
    cylinder.Position = location.position + Vector3.new(0, 10, 0)
    cylinder.Orientation = Vector3.new(0, 0, 90)
    cylinder.Anchored = true
    cylinder.CanCollide = false
    cylinder.Material = Enum.Material.Neon
    cylinder.Color = Color3.fromRGB(255, 200, 0)
    cylinder.Transparency = 0.7
    cylinder.Parent = workspace
    
    -- Store delivery data
    ActiveDeliveries[player.UserId] = {
        location = location,
        marker = marker,
        cylinder = cylinder,
        timeLimit = timeLimit,
        reward = reward,
        startTime = tick()
    }
    
    -- Send to client
    local startEvent = ReplicatedStorage:FindFirstChild("StartPizzaDelivery")
    if startEvent then
        startEvent:FireClient(player, location.name, timeLimit, reward)
    end
    
    -- Check for completion
    task.spawn(function()
        while ActiveDeliveries[player.UserId] do
            task.wait(0.5)
            
            if player.Character then
                local hrp = player.Character:FindFirstChild("HumanoidRootPart")
                if hrp then
                    local distance = (hrp.Position - location.position).Magnitude
                    
                    if distance < 10 then
                        PizzaSystem.CompleteDelivery(player)
                        break
                    end
                end
            end
            
            -- Check timeout
            local elapsed = tick() - ActiveDeliveries[player.UserId].startTime
            if elapsed >= timeLimit then
                PizzaSystem.FailDelivery(player)
                break
            end
        end
    end)
    
    return true
end

-- Complete delivery
function PizzaSystem.CompleteDelivery(player)
    local delivery = ActiveDeliveries[player.UserId]
    if not delivery then return end
    
    -- Clean up markers
    delivery.marker:Destroy()
    delivery.cylinder:Destroy()
    
    -- Award cash
    local DataStore = require(script.Parent:FindFirstChild("DataStore"))
    if DataStore then
        DataStore.AddCash(player, delivery.reward)
    end
    
    -- Notify client
    local completeEvent = ReplicatedStorage:FindFirstChild("CompletePizzaDelivery")
    if completeEvent then
        completeEvent:FireClient(player)
    end
    
    ActiveDeliveries[player.UserId] = nil
end

-- Fail delivery
function PizzaSystem.FailDelivery(player)
    local delivery = ActiveDeliveries[player.UserId]
    if not delivery then return end
    
    -- Clean up
    delivery.marker:Destroy()
    delivery.cylinder:Destroy()
    
    -- Notify client
    local failEvent = ReplicatedStorage:FindFirstChild("FailPizzaDelivery")
    if failEvent then
        failEvent:FireClient(player)
    end
    
    ActiveDeliveries[player.UserId] = nil
end

-- Setup remote events
local startEvent = Instance.new("RemoteEvent")
startEvent.Name = "StartPizzaDelivery"
startEvent.Parent = ReplicatedStorage

local completeEvent = Instance.new("RemoteEvent")
completeEvent.Name = "CompletePizzaDelivery"
completeEvent.Parent = ReplicatedStorage

local failEvent = Instance.new("RemoteEvent")
failEvent.Name = "FailPizzaDelivery"
failEvent.Parent = ReplicatedStorage

local requestEvent = Instance.new("RemoteEvent")
requestEvent.Name = "RequestPizzaDelivery"
requestEvent.Parent = ReplicatedStorage

-- Handle delivery requests
requestEvent.OnServerEvent:Connect(function(player)
    PizzaSystem.StartDelivery(player)
end)

-- Cleanup on player leave
Players.PlayerRemoving:Connect(function(player)
    if ActiveDeliveries[player.UserId] then
        local delivery = ActiveDeliveries[player.UserId]
        delivery.marker:Destroy()
        delivery.cylinder:Destroy()
        ActiveDeliveries[player.UserId] = nil
    end
end)

return PizzaSystem
