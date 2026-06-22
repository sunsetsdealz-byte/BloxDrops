-- HatButton.lua - 1-click hat equip button
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = Players.LocalPlayer

-- Wait for UI to load
local playerGui = player:WaitForChild("PlayerGui")

-- Create ScreenGui
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "HatEquipUI"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Create button
local button = Instance.new("TextButton")
button.Name = "EquipHatButton"
button.Size = UDim2.new(0, 200, 0, 50)
button.Position = UDim2.new(1, -220, 0, 20)
button.AnchorPoint = Vector2.new(0, 0)
button.BackgroundColor3 = Color3.fromRGB(52, 152, 219)
button.BorderSizePixel = 0
button.Font = Enum.Font.GothamBold
button.Text = "🎩 Equip Blue Hood"
button.TextColor3 = Color3.white
button.TextSize = 18
button.Parent = screenGui

-- Add rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = button

-- Button click handler
button.MouseButton1Click:Connect(function()
	local hatEvent = ReplicatedStorage:WaitForChild("EquipHat")
	hatEvent:FireServer()
	
	-- Visual feedback
	button.Text = "✓ Equipped!"
	button.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
	wait(1)
	button.Text = "🎩 Equip Blue Hood"
	button.BackgroundColor3 = Color3.fromRGB(52, 152, 219)
end)
