-- HatSystem.lua - Server-side hat management
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Create RemoteEvent for hat equip
local hatEvent = Instance.new("RemoteEvent")
hatEvent.Name = "EquipHat"
hatEvent.Parent = ReplicatedStorage

-- Hat asset ID (your blue hood model)
local HAT_ASSET_ID = 0 -- REPLACE WITH YOUR MODEL ASSET ID

hatEvent.OnServerEvent:Connect(function(player)
	local character = player.Character
	if not character then return end
	
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid then return end
	
	-- Remove existing hat if present
	local existingHat = character:FindFirstChild("CustomHat")
	if existingHat then
		existingHat:Destroy()
	end
	
	-- Clone hat from ReplicatedStorage or create from asset
	local hatModel = ReplicatedStorage:FindFirstChild("BlueHoodHat")
	if not hatModel then
		warn("Hat model not found in ReplicatedStorage")
		return
	end
	
	local newHat = hatModel:Clone()
	newHat.Name = "CustomHat"
	
	-- Find the main part and weld to head
	local hatPart = newHat:FindFirstChild("Handle") or newHat:FindFirstChildWhichIsA("BasePart")
	if hatPart then
		local head = character:FindFirstChild("Head")
		if head then
			hatPart.CFrame = head.CFrame
			
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = head
			weld.Part1 = hatPart
			weld.Parent = hatPart
			
			newHat.Parent = character
		end
	end
end)
