--[[
    Neon Pizza Sign Module
    Creates an animated neon pizza slice sign for the pizza shop
    Usage: local NeonPizzaSign = require(script.Parent.NeonPizzaSign)
           local sign = NeonPizzaSign.Create(position)
]]

local TweenService = game:GetService("TweenService")

local NeonPizzaSign = {}

function NeonPizzaSign.Create(position)
    local signModel = Instance.new("Model")
    signModel.Name = "NeonPizzaSign"
    
    -- Main pizza slice shape (triangle)
    local pizzaBase = Instance.new("Part")
    pizzaBase.Name = "PizzaBase"
    pizzaBase.Size = Vector3.new(6, 0.3, 8)
    pizzaBase.Position = position or Vector3.new(0, 10, 0)
    pizzaBase.Anchored = true
    pizzaBase.CanCollide = false
    pizzaBase.Material = Enum.Material.Neon
    pizzaBase.Color = Color3.fromRGB(255, 180, 50) -- Orange/yellow pizza color
    pizzaBase.Transparency = 0.1
    pizzaBase.Parent = signModel
    
    -- Create wedge for pizza slice shape
    local pizzaWedge = Instance.new("WedgePart")
    pizzaWedge.Name = "PizzaSlice"
    pizzaWedge.Size = Vector3.new(6, 8, 0.3)
    pizzaWedge.Position = pizzaBase.Position + Vector3.new(0, 0, 4)
    pizzaWedge.Orientation = Vector3.new(0, 0, 0)
    pizzaWedge.Anchored = true
    pizzaWedge.CanCollide = false
    pizzaWedge.Material = Enum.Material.Neon
    pizzaWedge.Color = Color3.fromRGB(255, 180, 50)
    pizzaWedge.Transparency = 0.1
    pizzaWedge.Parent = signModel
    
    -- White neon outline
    local function createOutline(parent, size, offset, partType)
        local outline = Instance.new(partType or "Part")
        outline.Size = size
        outline.Position = parent.Position + offset
        outline.Anchored = true
        outline.CanCollide = false
        outline.Material = Enum.Material.Neon
        outline.Color = Color3.fromRGB(255, 255, 255)
        outline.Transparency = 0
        outline.Parent = signModel
        return outline
    end
    
    -- Create white outline strips
    createOutline(pizzaBase, Vector3.new(6.3, 0.4, 0.2), Vector3.new(0, 0, -4))
    createOutline(pizzaBase, Vector3.new(0.2, 0.4, 8.3), Vector3.new(-3, 0, 0))
    createOutline(pizzaBase, Vector3.new(0.2, 0.4, 8.3), Vector3.new(3, 0, 0))
    
    -- Pepperoni circles
    local pepperoniPositions = {
        Vector3.new(0, 0.3, 0),
        Vector3.new(-1.5, 0.3, 1),
        Vector3.new(1.5, 0.3, 1),
        Vector3.new(-0.8, 0.3, 2.5),
        Vector3.new(0.8, 0.3, 2.5)
    }
    
    local pepperonis = {}
    for i, offset in ipairs(pepperoniPositions) do
        local pepperoni = Instance.new("Part")
        pepperoni.Name = "Pepperoni" .. i
        pepperoni.Shape = Enum.PartType.Cylinder
        pepperoni.Size = Vector3.new(0.3, 1.2, 1.2)
        pepperoni.Position = pizzaBase.Position + offset
        pepperoni.Orientation = Vector3.new(0, 0, 90)
        pepperoni.Anchored = true
        pepperoni.CanCollide = false
        pepperoni.Material = Enum.Material.Neon
        pepperoni.Color = Color3.fromRGB(200, 30, 30)
        pepperoni.Transparency = 0.1
        pepperoni.Parent = signModel
        
        -- Pepperoni outline
        local pepOutline = Instance.new("Part")
        pepOutline.Shape = Enum.PartType.Cylinder
        pepOutline.Size = Vector3.new(0.35, 1.4, 1.4)
        pepOutline.Position = pepperoni.Position
        pepOutline.Orientation = pepperoni.Orientation
        pepOutline.Anchored = true
        pepOutline.CanCollide = false
        pepOutline.Material = Enum.Material.Neon
        pepOutline.Color = Color3.fromRGB(255, 200, 0)
        pepOutline.Transparency = 0
        pepOutline.Parent = signModel
        
        table.insert(pepperonis, pepperoni)
    end
    
    -- Cheese drip effect
    local cheeseDrip = Instance.new("Part")
    cheeseDrip.Name = "CheeseDrip"
    cheeseDrip.Size = Vector3.new(0.8, 1.5, 0.3)
    cheeseDrip.Position = pizzaBase.Position + Vector3.new(2, -0.8, 3.5)
    cheeseDrip.Anchored = true
    cheeseDrip.CanCollide = false
    cheeseDrip.Material = Enum.Material.Neon
    cheeseDrip.Color = Color3.fromRGB(255, 230, 100)
    cheeseDrip.Transparency = 0.2
    cheeseDrip.Parent = signModel
    
    -- Animations
    local function animateGlow()
        -- Main pizza glow pulse
        local glowInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
        local glowTween = TweenService:Create(pizzaBase, glowInfo, {Transparency = 0.3})
        glowTween:Play()
        
        TweenService:Create(pizzaWedge, glowInfo, {Transparency = 0.3}):Play()
        
        -- Pepperoni sequential glow
        for i, pep in ipairs(pepperonis) do
            task.delay((i - 1) * 0.3, function()
                local pepInfo = TweenInfo.new(1.5, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut, -1, true)
                TweenService:Create(pep, pepInfo, {Transparency = 0.4}):Play()
            end)
        end
        
        -- Cheese drip animation
        local dripInfo = TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
        TweenService:Create(cheeseDrip, dripInfo, {
            Position = cheeseDrip.Position + Vector3.new(0, -0.3, 0),
            Transparency = 0.5
        }):Play()
    end
    
    local function animateFlicker()
        -- Random flicker effect for authentic neon look
        task.spawn(function()
            while signModel.Parent do
                task.wait(math.random(5, 15))
                for _, part in ipairs(signModel:GetDescendants()) do
                    if part:IsA("BasePart") then
                        local originalTrans = part.Transparency
                        part.Transparency = 1
                        task.wait(0.05)
                        part.Transparency = originalTrans
                        task.wait(0.03)
                        part.Transparency = 1
                        task.wait(0.05)
                        part.Transparency = originalTrans
                    end
                end
            end
        end)
    end
    
    -- Start animations
    animateGlow()
    animateFlicker()
    
    -- Add point light for ambient glow
    local light = Instance.new("PointLight")
    light.Brightness = 3
    light.Range = 25
    light.Color = Color3.fromRGB(255, 200, 100)
    light.Parent = pizzaBase
    
    -- Pulsing light
    local lightInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
    TweenService:Create(light, lightInfo, {Brightness = 5}):Play()
    
    return signModel
end

-- Helper function to attach sign to a building
function NeonPizzaSign.AttachToBuilding(building, heightOffset)
    local position = building.Position + Vector3.new(0, heightOffset or 15, 0)
    local sign = NeonPizzaSign.Create(position)
    sign.Parent = building
    return sign
end

return NeonPizzaSign
