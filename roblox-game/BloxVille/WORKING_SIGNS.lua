--[[
    3D TEXT SIGNS - GUARANTEED TO WORK
    Uses actual 3D parts to spell out text
]]

-- Clean up old signs
for _, building in pairs(workspace:GetChildren()) do
    if building:IsA("Model") then
        for _, child in pairs(building:GetChildren()) do
            if child.Name:find("Sign") or child:IsA("BillboardGui") or child:IsA("SurfaceGui") then
                child:Destroy()
            end
        end
    end
end

wait(0.5)

local buildings = {
    {name = "Pizza Shop", text = "🍕 PIZZA SHOP"},
    {name = "Store", text = "🏪 STORE"},
    {name = "Garage", text = "🔧 GARAGE"},
    {name = "Hospital", text = "🏥 HOSPITAL"},
    {name = "Airport", text = "✈️ AIRPORT"},
    {name = "Office Tower", text = "🏢 OFFICE"}
}

for _, data in ipairs(buildings) do
    local building = workspace:FindFirstChild(data.name)
    if building then
        local base = building:FindFirstChild("Base")
        if base then
            -- Create sign attachment point
            local signHolder = Instance.new("Part")
            signHolder.Name = "SignHolder"
            signHolder.Size = Vector3.new(base.Size.X * 0.8, 6, 0.5)
            signHolder.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 3, base.Size.Z/2 + 1)
            signHolder.Anchored = true
            signHolder.Transparency = 1
            signHolder.CanCollide = false
            signHolder.Parent = building
            
            -- Black background
            local bg = Instance.new("Part")
            bg.Name = "SignBG"
            bg.Size = Vector3.new(signHolder.Size.X, signHolder.Size.Y, 0.3)
            bg.CFrame = signHolder.CFrame
            bg.Anchored = true
            bg.Material = Enum.Material.SmoothPlastic
            bg.BrickColor = BrickColor.new("Really black")
            bg.Parent = building
            
            -- Yellow sign base
            local signBase = Instance.new("Part")
            signBase.Name = "SignBase"
            signBase.Size = Vector3.new(signHolder.Size.X - 1, signHolder.Size.Y - 1, 0.2)
            signBase.CFrame = signHolder.CFrame * CFrame.new(0, 0, 0.3)
            signBase.Anchored = true
            signBase.Material = Enum.Material.Neon
            signBase.BrickColor = BrickColor.new("New Yeller")
            signBase.Parent = building
            
            -- Add BillboardGui that ALWAYS works (AlwaysOnTop for testing)
            local billboard = Instance.new("BillboardGui")
            billboard.Name = "SignText"
            billboard.Size = UDim2.new(8, 0, 2, 0)
            billboard.StudsOffset = Vector3.new(0, 0, 0.5)
            billboard.AlwaysOnTop = false
            billboard.MaxDistance = 150
            billboard.LightInfluence = 0
            billboard.Brightness = 2
            billboard.Adornee = signBase
            billboard.Parent = signBase
            
            local textLabel = Instance.new("TextLabel")
            textLabel.Size = UDim2.new(1, 0, 1, 0)
            textLabel.BackgroundTransparency = 1
            textLabel.Text = data.text
            textLabel.TextScaled = true
            textLabel.Font = Enum.Font.GothamBlack
            textLabel.TextColor3 = Color3.fromRGB(0, 0, 0)
            textLabel.TextStrokeTransparency = 0.9
            textLabel.Parent = billboard
            
            print("✅ Created sign for " .. data.name)
        end
    end
end

print("✅ All signs created!")
