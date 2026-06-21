--[[
    Events Setup
    Creates all RemoteEvents and RemoteFunctions for client-server communication
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local EventsSetup = {}

function EventsSetup.Initialize()
    -- Create Events folder
    local eventsFolder = ReplicatedStorage:FindFirstChild("Events")
    if not eventsFolder then
        eventsFolder = Instance.new("Folder")
        eventsFolder.Name = "Events"
        eventsFolder.Parent = ReplicatedStorage
    end
    
    -- List of events to create
    local events = {
        "UpdateUI",           -- Update client UI
        "PlaySound",          -- Play sound on client
        "StartJob",           -- Start a job
        "CompleteJob",        -- Complete a job
        "SpawnVehicle",       -- Spawn a vehicle
        "DespawnVehicle",     -- Despawn a vehicle
        "PurchaseVehicle",    -- Buy a vehicle
        "PurchaseHouse",      -- Buy a house
        "PurchaseFurniture",  -- Buy furniture
    }
    
    -- Create RemoteEvents
    for _, eventName in ipairs(events) do
        if not eventsFolder:FindFirstChild(eventName) then
            local remoteEvent = Instance.new("RemoteEvent")
            remoteEvent.Name = eventName
            remoteEvent.Parent = eventsFolder
            print("Created event:", eventName)
        end
    end
    
    -- Create RemoteFunctions
    local functions = {
        "GetPlayerData",      -- Get player data
        "GetVehicleList",     -- Get owned vehicles
        "GetHouseData",       -- Get house info
    }
    
    for _, funcName in ipairs(functions) do
        if not eventsFolder:FindFirstChild(funcName) then
            local remoteFunction = Instance.new("RemoteFunction")
            remoteFunction.Name = funcName
            remoteFunction.Parent = eventsFolder
            print("Created function:", funcName)
        end
    end
    
    print("✅ All events and functions created!")
end

-- Auto-initialize
EventsSetup.Initialize()

return EventsSetup
