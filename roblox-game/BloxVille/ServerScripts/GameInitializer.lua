--[[
    Game Initializer
    Sets up the entire game on server start
]]

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

print("🎮 Initializing BloxVille...")

-- Load all modules
local Config = require(ReplicatedStorage:WaitForChild("Modules"):WaitForChild("Config"))
local DataStore = require(ServerScriptService:WaitForChild("DataStore"))
local JobSystem = require(ServerScriptService:WaitForChild("JobSystem"))
local VehicleSpawner = require(ServerScriptService:WaitForChild("VehicleSpawner"))
local HousingSystem = require(ServerScriptService:WaitForChild("HousingSystem"))
local MapBuilder = require(ServerScriptService:WaitForChild("MapBuilder"))

-- Initialize events
require(ServerScriptService:WaitForChild("EventsSetup"))

-- Initialize vehicle models
require(ServerScriptService:WaitForChild("VehicleModels"))

-- Build the map
print("🗺️ Building map...")
MapBuilder.BuildMap()

-- Setup proximity prompts
print("📍 Setting up proximity prompts...")
require(ServerScriptService:WaitForChild("ProximityPromptSetup"))

print("✅ Game initialized successfully!")

-- Player joined handler
Players.PlayerAdded:Connect(function(player)
    print("👤 Player joined:", player.Name)
    
    -- Load player data
    local data = DataStore.LoadData(player)
    
    if data then
        print("✅ Data loaded for:", player.Name)
        
        -- Update UI on client
        task.wait(2) -- Wait for client to load
        
        local updateUI = ReplicatedStorage.Events:FindFirstChild("UpdateUI")
        if updateUI then
            updateUI:FireClient(player, "Cash", data.Cash)
            updateUI:FireClient(player, "Level", data.Level)
            updateUI:FireClient(player, "XP", data.XP, data.XPNeeded)
        end
        
        -- Send welcome notification
        local notifyEvent = ReplicatedStorage.Events:FindFirstChild("Notify")
        if notifyEvent then
            notifyEvent:FireClient(player, "Welcome!", "Welcome to BloxVille! Press J for jobs, V for vehicles, B for shop.", "info")
        end
    else
        warn("❌ Failed to load data for:", player.Name)
    end
end)

-- Player leaving handler
Players.PlayerRemoving:Connect(function(player)
    print("👋 Player left:", player.Name)
    
    -- Save player data
    DataStore.SaveData(player)
    
    -- Cleanup vehicles
    VehicleSpawner.CleanupPlayerVehicles(player)
end)

-- Setup event handlers
local events = ReplicatedStorage:WaitForChild("Events")

-- Start Job
events.StartJob.OnServerEvent:Connect(function(player, jobName)
    local success = JobSystem.StartJob(player, jobName)
    
    local notifyEvent = events:FindFirstChild("Notify")
    if success then
        if notifyEvent then
            notifyEvent:FireClient(player, "Job Started!", "You started working as " .. Config.Jobs[jobName].Name, "success")
        end
        
        -- Update UI
        local updateUI = events:FindFirstChild("UpdateUI")
        if updateUI then
            updateUI:FireClient(player, "JobStart", Config.Jobs[jobName].Name)
        end
        
        -- Play sound
        local playSound = events:FindFirstChild("PlaySound")
        if playSound then
            playSound:FireClient(player, "JobStart")
        end
    else
        if notifyEvent then
            notifyEvent:FireClient(player, "Cannot Start Job", "You already have an active job or don't meet the requirements.", "error")
        end
    end
end)

-- Complete Job (auto-called by JobSystem after time)
events.CompleteJob.OnServerEvent:Connect(function(player, jobName)
    local success, cash, xp = JobSystem.CompleteJob(player, jobName)
    
    local notifyEvent = events:FindFirstChild("Notify")
    if success then
        if notifyEvent then
            notifyEvent:FireClient(player, "Job Complete!", "You earned $" .. cash .. " and " .. xp .. " XP!", "success")
        end
        
        -- Update UI
        local updateUI = events:FindFirstChild("UpdateUI")
        if updateUI then
            updateUI:FireClient(player, "JobEnd")
            updateUI:FireClient(player, "Cash", DataStore.GetPlayerData(player).Cash)
            updateUI:FireClient(player, "XP", DataStore.GetPlayerData(player).XP, DataStore.GetPlayerData(player).XPNeeded)
        end
        
        -- Play sound
        local playSound = events:FindFirstChild("PlaySound")
        if playSound then
            playSound:FireClient(player, "JobComplete")
            playSound:FireClient(player, "CashEarned")
        end
    end
end)

-- Spawn Vehicle
events.SpawnVehicle.OnServerEvent:Connect(function(player, vehicleName)
    local success, message = VehicleSpawner.SpawnVehicle(player, vehicleName)
    
    local notifyEvent = events:FindFirstChild("Notify")
    if notifyEvent then
        if success then
            notifyEvent:FireClient(player, "Vehicle Spawned!", "Your " .. vehicleName .. " is ready!", "success")
        else
            notifyEvent:FireClient(player, "Cannot Spawn Vehicle", message or "Unknown error", "error")
        end
    end
end)

-- Purchase Vehicle
events.PurchaseVehicle.OnServerEvent:Connect(function(player, vehicleName)
    local vehicleData = Config.Vehicles[vehicleName]
    if not vehicleData then return end
    
    local playerData = DataStore.GetPlayerData(player)
    if not playerData then return end
    
    if playerData.Cash >= vehicleData.Price then
        -- Deduct cash
        playerData.Cash = playerData.Cash - vehicleData.Price
        
        -- Add vehicle to owned vehicles
        if not playerData.OwnedVehicles then
            playerData.OwnedVehicles = {}
        end
        table.insert(playerData.OwnedVehicles, vehicleName)
        
        -- Save
        DataStore.SaveData(player)
        
        -- Notify
        local notifyEvent = events:FindFirstChild("Notify")
        if notifyEvent then
            notifyEvent:FireClient(player, "Purchase Successful!", "You bought a " .. vehicleName .. "!", "success")
        end
        
        -- Update UI
        local updateUI = events:FindFirstChild("UpdateUI")
        if updateUI then
            updateUI:FireClient(player, "Cash", playerData.Cash)
        end
    else
        local notifyEvent = events:FindFirstChild("Notify")
        if notifyEvent then
            notifyEvent:FireClient(player, "Not Enough Cash", "You need $" .. vehicleData.Price .. " to buy this vehicle.", "error")
        end
    end
end)

-- Purchase House
events.PurchaseHouse.OnServerEvent:Connect(function(player, houseName)
    local success = HousingSystem.PurchaseHouse(player, houseName)
    
    local notifyEvent = events:FindFirstChild("Notify")
    if notifyEvent then
        if success then
            notifyEvent:FireClient(player, "House Purchased!", "You now own a " .. houseName .. "!", "success")
        else
            notifyEvent:FireClient(player, "Cannot Purchase", "Not enough cash or you already own this house.", "error")
        end
    end
end)

print("✅ All event handlers connected!")

-- Auto-save all player data every 5 minutes
task.spawn(function()
    while true do
        task.wait(300) -- 5 minutes
        print("💾 Auto-saving all player data...")
        for _, player in ipairs(Players:GetPlayers()) do
            DataStore.SaveData(player)
        end
        print("✅ Auto-save complete!")
    end
end)

return {}
