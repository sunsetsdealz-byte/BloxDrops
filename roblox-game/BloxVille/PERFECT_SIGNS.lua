--[[
    PERFECT READABLE SIGNS
    High contrast, professional design
]]

-- Clean everything
for _, building in pairs(workspace:GetChildren()) do
    if building:IsA("Model") then
        for _, child in pairs(building:GetChildren()) do
            if child.Name:find("Sign") or child.Name == "SignHolder" then
                child:Destroy()
            end
        end
    end
end

wait(0.5)

local buildings = {
    {name = "Pizza Shop", text = "🍕 PIZZA SHOP", color = Color3.fromRGB(220, 50, 50)},
    {name = "Store", text = "🏪 STORE", color = Color3.fromRGB(50, 120, 220)},
    {name = "Garage", text = "🔧 GARAGE", color = Color3.fromRGB(220, 140, 50)},
    {name = "Hospital", text = "🏥 HOSPITAL", color = Color3.fromRGB(255, 255, 255)},
    {name = "Airport", text = "✈️ AIRPORT", color = Color3.fromRGB(100, 180, 255)},
    {name = "Office Tower", text = "🏢 OFFICE", color = Color3.fromRGB(80, 80, 80)}
}

for _, data in ipairs(buildings) do
    local building = workspace:FindFirstChild(data.name)
    if building then
        local base = building:FindFirstChild("Base")
        if base then
            
            -- Dark background panel
            local bgPanel = Instance.new("Part")
            bgPanel.Name = "SignBG"
            bgPanel.Size = Vector3.new(base.Size.X * 0.85, 7, 0.4)
            bgPanel.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 3.5, base.Size.Z/2 + 0.5)
            bgPanel.Anchored = true
            bgPanel.Material = Enum.Material.SmoothPlastic
            bgPanel.Color = Color3.fromRGB(20, 20, 20)
            bgPanel.Parent = building
            
            -- Colored sign plate
            local signPlate = Instance.new("Part")
            signPlate.Name = "SignPlate"
            signPlate.Size = Vector3.new(base.Size.X * 0.8, 6, 0.3)
            signPlate.CFrame = base.CFrame * CFrame.new(0, base.Size.Y/2 - 3.5, base.Size.Z/2 + 0.9)
            signPlate.Anchored = true
            signPlate.Material = Enum.Material.Neon
            signPlate.Color = data.color
            signPlate.Parent = building
            
            -- Text with HIGH CONTRAST
            local billboard = Instance.new("BillboardGui")
            billboard.Name = "SignText"
            billboard.Size = UDim2.new(10, 0, 2.5, 0)
            billboard.StudsOffset = Vector3.new(0, 0, 0.2)
            billboard.AlwaysOnTop = false
            billboard.MaxDistance = 200
            billboard.LightInfluence = 0
            billboard.Brightness = 1.5
            billboard.Adornee = signPlate
            billboard.Parent = signPlate
            
            -- White background for text
            local textBg = Instance.new("Frame")
            textBg.Size = UDim2.new(0.95, 0, 0.8, 0)
            textBg.Position = UDim2.new(0.025, 0, 0.1, 0)
            textBg.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
            textBg.BorderSizePixel = 0
            textBg.Parent = billboard
            
            -- Black text on white background
            local textLabel = Instance.new("TextLabel")
            textLabel.Size = UDim2.new(1, 0, 1, 0)
            textLabel.BackgroundTransparency = 1
            textLabel.Text = data.text
            textLabel.TextScaled = true
            textLabel.Font = Enum.Font.GothamBlack
            textLabel.TextColor3 = Color3.fromRGB(0, 0, 0)
            textLabel.Parent = textBg
            
            -- Border glow
            local uiStroke = Instance.new("UIStroke")
            uiStroke.Color = Color3.fromRGB(0, 0, 0)
            uiStroke.Thickness = 3
            uiStroke.Parent = textBg
            
            print("✅ Perfect sign for " .. data.name)
        end
    end
end

print("✅ All signs are now PERFECT and readable!")
