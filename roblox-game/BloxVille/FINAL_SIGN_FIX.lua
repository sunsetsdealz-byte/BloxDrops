--[[
    FINAL SIGN FIX - Uses simple text parts that ALWAYS work
    Paste this into AddSigns script and run
]]

-- Delete old signs first
for _, building in pairs(workspace:GetChildren()) do
    if building:IsA("Model") then
        local oldSign = building:FindFirstChild("Sign")
        if oldSign then oldSign:Destroy() end
        local oldBg = building:FindFirstChild("SignBackground")
        if oldBg then oldBg:Destroy() end
        
        -- Remove BillboardGuis
        for _, child in pairs(building:GetDescendants()) do
            if child:IsA("BillboardGui") then
                child:Destroy()
            end
        end
    end
end

local buildings = {
    {name = "Pizza Shop", icon = "PIZZA", emoji = "🍕"},
    {name = "Store", icon = "STORE", emoji = "🏪"},
    {name = "Garage", icon = "GARAGE", emoji = "🔧"},
    {name = "Hospital", icon = "HOSPITAL", emoji = "🏥"},
    {name = "Airport", icon = "AIRPORT", emoji = "✈️"},
    {name = "Office Tower", icon = "OFFICE", emoji = "🏢"}
}

for _, buildingData in ipairs(buildings) do
    local building = workspace:FindFirstChild(buildingData.name)
    if building then
        local base = building:FindFirstChild("Base")
        if base then
            -- Black background panel
            local signBg = Instance.new("Part")
            signBg.Name = "SignBackground"
            signBg.Size = Vector3.new(base.Size.X * 0.85, 6, 0.3)
            signBg.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 3, base.Size.Z/2 + 0.5)
            signBg.Anchored = true
            signBg.Material = Enum.Material.SmoothPlastic
            signBg.BrickColor = BrickColor.new("Really black")
            signBg.Parent = building
            
            -- Yellow neon sign
            local sign = Instance.new("Part")
            sign.Name = "Sign"
            sign.Size = Vector3.new(base.Size.X * 0.8, 5, 0.2)
            sign.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 3, base.Size.Z/2 + 0.8)
            sign.Anchored = true
            sign.Material = Enum.Material.Neon
            sign.BrickColor = BrickColor.new("New Yeller")
            sign.Parent = building
            
            -- SurfaceGui with proper settings
            local gui = Instance.new("SurfaceGui")
            gui.Face = Enum.NormalId.Front
            gui.CanvasSize = Vector2.new(800, 200)
            gui.LightInfluence = 0
            gui.Parent = sign
            
            -- Background frame
            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(1, 0, 1, 0)
            frame.BackgroundTransparency = 1
            frame.Parent = gui
            
            -- Emoji/Icon
            local emojiLabel = Instance.new("TextLabel")
            emojiLabel.Size = UDim2.new(0.25, 0, 1, 0)
            emojiLabel.Position = UDim2.new(0, 0, 0, 0)
            emojiLabel.BackgroundTransparency = 1
            emojiLabel.Text = buildingData.emoji
            emojiLabel.TextScaled = true
            emojiLabel.Font = Enum.Font.GothamBlack
            emojiLabel.TextColor3 = Color3.fromRGB(0, 0, 0)
            emojiLabel.Parent = frame
            
            -- Building name
            local nameLabel = Instance.new("TextLabel")
            nameLabel.Size = UDim2.new(0.7, 0, 1, 0)
            nameLabel.Position = UDim2.new(0.28, 0, 0, 0)
            nameLabel.BackgroundTransparency = 1
            nameLabel.Text = buildingData.icon
            nameLabel.TextScaled = true
            nameLabel.Font = Enum.Font.GothamBlack
            nameLabel.TextColor3 = Color3.fromRGB(0, 0, 0)
            nameLabel.TextXAlignment = Enum.TextXAlignment.Left
            nameLabel.Parent = frame
            
            print("✅ Fixed sign for " .. buildingData.name)
        end
    end
end

print("✅ All signs fixed with SurfaceGui!")
