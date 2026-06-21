--[[
    DataStore Manager
    Handles all player data saving/loading with ProfileService
]]

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local ProfileService = require(ReplicatedStorage.Modules.ProfileService)
local Config = require(ReplicatedStorage.Modules.Config)

local DataStore = {}
local ProfileStore = ProfileService.GetProfileStore(
    "PlayerData_V1",
    {
        Cash = Config.StartingCash,
        Level = 1,
        XP = 0,
        Houses = {"Starter"},
        CurrentHouse = "Starter",
        Vehicles = {},
        Pets = {},
        Furniture = {},
        JobStats = {},
        Achievements = {},
        Rebirths = 0,
        VIP = false,
        Settings = {
            Music = true,
            Notifications = true
        },
        Stats = {
            PlayTime = 0,
            JobsCompleted = 0,
            MoneyEarned = 0
        }
    }
)

local Profiles = {}

-- Load player data
function DataStore.LoadProfile(player)
    local profile = ProfileStore:LoadProfileAsync("Player_" .. player.UserId)
    
    if profile then
        profile:AddUserId(player.UserId)
        profile:Reconcile()
        
        profile:ListenToRelease(function()
            Profiles[player] = nil
            player:Kick("Data session released")
        end)
        
        if player:IsDescendantOf(Players) then
            Profiles[player] = profile
            DataStore.SetupLeaderstats(player, profile)
            DataStore.CheckVIP(player, profile)
            return profile
        else
            profile:Release()
        end
    else
        player:Kick("Failed to load data. Rejoin.")
    end
end

-- Setup leaderstats
function DataStore.SetupLeaderstats(player, profile)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player
    
    local cash = Instance.new("IntValue")
    cash.Name = "Cash"
    cash.Value = profile.Data.Cash
    cash.Parent = leaderstats
    
    local level = Instance.new("IntValue")
    level.Name = "Level"
    level.Value = profile.Data.Level
    level.Parent = leaderstats
    
    local rebirths = Instance.new("IntValue")
    rebirths.Name = "Rebirths"
    rebirths.Value = profile.Data.Rebirths
    rebirths.Parent = leaderstats
end

-- Check VIP status
function DataStore.CheckVIP(player, profile)
    local MarketplaceService = game:GetService("MarketplaceService")
    local hasVIP = false
    
    pcall(function()
        hasVIP = MarketplaceService:UserOwnsGamePassAsync(player.UserId, Config.Gamepasses.VIP)
    end)
    
    profile.Data.VIP = hasVIP
end

-- Get profile
function DataStore.GetProfile(player)
    return Profiles[player]
end

-- Add cash
function DataStore.AddCash(player, amount)
    local profile = Profiles[player]
    if not profile then return false end
    
    local multiplier = profile.Data.VIP and Config.VIPCashMultiplier or 1
    local finalAmount = math.floor(amount * multiplier * (1 + profile.Data.Rebirths * 0.1))
    
    profile.Data.Cash += finalAmount
    profile.Data.Stats.MoneyEarned += finalAmount
    player.leaderstats.Cash.Value = profile.Data.Cash
    
    return true, finalAmount
end

-- Remove cash
function DataStore.RemoveCash(player, amount)
    local profile = Profiles[player]
    if not profile then return false end
    if profile.Data.Cash < amount then return false end
    
    profile.Data.Cash -= amount
    player.leaderstats.Cash.Value = profile.Data.Cash
    
    return true
end

-- Add XP
function DataStore.AddXP(player, amount)
    local profile = Profiles[player]
    if not profile then return false end
    
    profile.Data.XP += amount
    
    -- Level up check
    local xpNeeded = profile.Data.Level * 100
    if profile.Data.XP >= xpNeeded then
        profile.Data.XP -= xpNeeded
        profile.Data.Level += 1
        player.leaderstats.Level.Value = profile.Data.Level
        
        -- Notify level up
        local event = ReplicatedStorage.Events.LevelUp
        event:FireClient(player, profile.Data.Level)
        
        return true, profile.Data.Level
    end
    
    return false
end

-- Save on leave
Players.PlayerRemoving:Connect(function(player)
    local profile = Profiles[player]
    if profile then
        profile:Release()
    end
end)

-- Load on join
Players.PlayerAdded:Connect(function(player)
    DataStore.LoadProfile(player)
end)

return DataStore
