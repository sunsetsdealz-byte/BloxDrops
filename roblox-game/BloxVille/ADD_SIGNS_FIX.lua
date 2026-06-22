--[[
    ADD SIGNS TO EXISTING BUILDINGS
    Run this in Command Bar to add signs to all job buildings
]]

local buildings = {
    {name = "Pizza Shop", icon = "🍕"},
    {name = "Store", icon = "🏪"},
    {name = "Garage", icon = "🔧"},
    {name = "Hospital", icon = "🏥"},
    {name = "Airport", icon = "✈️"},
    {name = "Office Tower", icon = "🏢"}
}

for _, buildingData in ipairs(buildings) do
    local building = workspace:FindFirstChild(buildingData.name)
    if building then
        local base = building:FindFirstChild("Base")
        if base then
            -- Remove old sign if exists
            local oldSign = building:FindFirstChild("Sign")
            if oldSign then oldSign:Destroy() end
            
            -- Create new sign
            local sign = Instance.new("Part")
            sign.Name = "Sign"
            sign.Size = Vector3.new(base.Size.X * 0.8, 10, 1)
            sign.Position = base.Position + Vector3.new(0, base.Size.Y/2 - 5, base.Size.Z/2 + 0.6)
            sign.Anchored = true
            sign.Material = Enum.Material.Neon
            sign.BrickColor = BrickColor.new("New Yeller")
            sign.Parent = building
            
            -- Add text (BillboardGui instead of SurfaceGui for better visibility)
            local signGui = Instance.new("BillboardGui")
            signGui.Size = UDim2.new(0, 200, 0, 50)
            signGui.StudsOffset = Vector3.new(0, 0, 0)
            signGui.AlwaysOnTop = false
            signGui.Parent = sign
            
            local signLabel = Instance.new("TextLabel")
            signLabel.Size = UDim2.new(1, 0, 1, 0)
            signLabel.BackgroundTransparency = 1
            signLabel.Text = buildingData.icon .. " " .. buildingData.name:upper()
            signLabel.TextScaled = true
            signLabel.Font = Enum.Font.GothamBlack
            signLabel.TextColor3 = Color3.fromRGB(0, 0, 0)
            signLabel.TextStrokeTransparency = 0.5
            signLabel.TextStrokeColor3 = Color3.fromRGB(255, 255, 255)
            signLabel.Parent = signGui
            
            print("✅ Added sign to " .. buildingData.name)
        end
    end
end

print("✅ All signs added!")
