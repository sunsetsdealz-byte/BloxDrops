--[[
    Housing System
    Manages house ownership, building, and furniture placement
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local DataStore = require(script.Parent.DataStore)
local Config = require(ReplicatedStorage.Modules.Config)

local HousingSystem = {}
local ActiveHouses = {}

-- Create player's house plot
function HousingSystem.CreateHousePlot(player, houseType)
    local profile = DataStore.GetProfile(player)
    if not profile then return end
    
    local houseConfig = Config.Houses[houseType]
    if not houseConfig then return end
    
    -- Find spawn location
    local plotsFolder = workspace:FindFirstChild("HousePlots")
    if not plotsFolder then
        plotsFolder = Instance.new("Folder")
        plotsFolder.Name = "HousePlots"
        plotsFolder.Parent = workspace
    end
    
    -- Create plot
    local plot = Instance.new("Model")
    plot.Name = player.Name .. "_House"
    
    -- Base platform
    local base = Instance.new("Part")
    base.Name = "Base"
    base.Size = houseConfig.PlotSize
    base.Anchored = true
    base.BrickColor = BrickColor.new("Bright green")
    base.Material = Enum.Material.Grass
    base.Position = HousingSystem.GetNextPlotPosition()
    base.Parent = plot
    
    -- Invisible walls
    local walls = Instance.new("Model")
    walls.Name = "Walls"
    walls.Parent = plot
    
    for i = 1, 4 do
        local wall = Instance.new("Part")
        wall.Name = "Wall" .. i
        wall.Size = Vector3.new(2, 20, houseConfig.PlotSize.Z)
        wall.Anchored = true
        wall.Transparency = 0.8
        wall.CanCollide = true
        wall.BrickColor = BrickColor.new("Really red")
        wall.Parent = walls
    end
    
    -- Spawn point
    local spawn = Instance.new("SpawnLocation")
    spawn.Name = "SpawnPoint"
    spawn.Size = Vector3.new(6, 1, 6)
    spawn.Anchored = true
    spawn.Transparency = 1
    spawn.CanCollide = false
    spawn.Position = base.Position + Vector3.new(0, base.Size.Y/2 + 3, 0)
    spawn.Parent = plot
    
    plot.Parent = plotsFolder
    ActiveHouses[player.UserId] = plot
    
    return plot
end

-- Get next available plot position
function HousingSystem.GetNextPlotPosition()
    local plotsFolder = workspace:FindFirstChild("HousePlots")
    if not plotsFolder then
        return Vector3.new(0, 5, 0)
    end
    
    local count = #plotsFolder:GetChildren()
    local spacing = 100
    local row = math.floor(count / 10)
    local col = count % 10
    
    return Vector3.new(col * spacing, 5, row * spacing)
end

-- Buy house
function HousingSystem.BuyHouse(player, houseType)
    local profile = DataStore.GetProfile(player)
    if not profile then return false, "Data not loaded" end
    
    local houseConfig = Config.Houses[houseType]
    if not houseConfig then return false, "Invalid house type" end
    
    -- Check if already owned
    if table.find(profile.Data.Houses, houseType) then
        return false, "Already own this house"
    end
    
    -- Check cash
    if profile.Data.Cash < houseConfig.Price then
        return false, "Not enough cash"
    end
    
    -- Purchase
    local success = DataStore.RemoveCash(player, houseConfig.Price)
    if not success then return false, "Transaction failed" end
    
    table.insert(profile.Data.Houses, houseType)
    profile.Data.CurrentHouse = houseType
    
    -- Create plot
    HousingSystem.CreateHousePlot(player, houseType)
    
    return true, "House purchased!"
end

-- Place furniture
function HousingSystem.PlaceFurniture(player, furnitureId, position, rotation)
    local profile = DataStore.GetProfile(player)
    if not profile then return false end
    
    local plot = ActiveHouses[player.UserId]
    if not plot then return false end
    
    local houseConfig = Config.Houses[profile.Data.CurrentHouse]
    local currentFurniture = #profile.Data.Furniture
    
    if currentFurniture >= houseConfig.MaxFurniture then
        return false, "Max furniture limit reached"
    end
    
    -- Create furniture (placeholder)
    local furniture = Instance.new("Part")
    furniture.Name = furnitureId
    furniture.Size = Vector3.new(4, 4, 4)
    furniture.Position = position
    furniture.Orientation = rotation
    furniture.Anchored = true
    furniture.BrickColor = BrickColor.Random()
    furniture.Parent = plot
    
    -- Save to data
    table.insert(profile.Data.Furniture, {
        Id = furnitureId,
        Position = position,
        Rotation = rotation
    })
    
    return true
end

-- Teleport to house
function HousingSystem.TeleportToHouse(player, targetPlayer)
    local plot = ActiveHouses[targetPlayer.UserId]
    if not plot then return false end
    
    local spawn = plot:FindFirstChild("SpawnPoint")
    if spawn and player.Character then
        player.Character:SetPrimaryPartCFrame(spawn.CFrame + Vector3.new(0, 3, 0))
        return true
    end
    
    return false
end

-- Setup remote events
local events = ReplicatedStorage:WaitForChild("Events")

events.BuyHouse.OnServerEvent:Connect(function(player, houseType)
    local success, message = HousingSystem.BuyHouse(player, houseType)
    events.BuyHouseResponse:FireClient(player, success, message)
end)

events.PlaceFurniture.OnServerEvent:Connect(function(player, furnitureId, position, rotation)
    local success, message = HousingSystem.PlaceFurniture(player, furnitureId, position, rotation)
    events.PlaceFurnitureResponse:FireClient(player, success, message)
end)

events.TeleportToHouse.OnServerEvent:Connect(function(player, targetPlayer)
    HousingSystem.TeleportToHouse(player, targetPlayer)
end)

return HousingSystem
