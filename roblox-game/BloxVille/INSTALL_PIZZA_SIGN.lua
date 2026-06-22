--[[
    PIZZA SIGN INSTALLER
    
    HOW TO USE:
    1. Copy NeonPizzaSign.lua to ReplicatedStorage/Modules/
    2. Run this script in Command Bar or paste in ServerScriptService
    3. Sign will appear in the workspace
    
    CUSTOMIZATION:
    - Change position below to place where you want
    - Adjust size by modifying the module
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Ensure Modules folder exists
local modules = ReplicatedStorage:FindFirstChild("Modules")
if not modules then
    modules = Instance.new("Folder")
    modules.Name = "Modules"
    modules.Parent = ReplicatedStorage
end

-- Create the pizza sign
local NeonPizzaSign = require(modules:WaitForChild("NeonPizzaSign"))

-- CUSTOMIZE POSITION HERE
local signPosition = Vector3.new(0, 20, 0) -- Center of workspace, 20 studs high

-- Create and place the sign
local pizzaSign = NeonPizzaSign.Create(signPosition)
pizzaSign.Parent = workspace

print("✅ Neon Pizza Sign installed successfully!")
print("📍 Position:", signPosition)
print("💡 The sign is now animated with pulsing neon effects")

-- OPTIONAL: Attach to existing building
-- Find your pizza shop building and uncomment:
-- local pizzaShop = workspace:FindFirstChild("PizzaShop") -- Change name to your building
-- if pizzaShop then
--     local sign = NeonPizzaSign.AttachToBuilding(pizzaShop, 15)
--     print("✅ Sign attached to", pizzaShop.Name)
-- end
