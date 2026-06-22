-- NPC System: Living city (Brookhaven doesn't have this)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local PathfindingService = game:GetService("PathfindingService")

local NPCs = {}

-- NPC Templates
local NPC_TYPES = {
	{Name = "Pizza Delivery Guy", Shirt = 607702162, Pants = 607702538, Hat = 1365767},
	{Name = "Business Woman", Shirt = 398635838, Pants = 398636037, Hat = 0},
	{Name = "Tourist", Shirt = 144076759, Pants = 144076759, Hat = 15730710},
	{Name = "Police Officer", Shirt = 133072229, Pants = 133071983, Hat = 48474294},
}

-- Spawn locations (will walk around map)
local SPAWN_POINTS = {
	Vector3.new(0, 5, 0),
	Vector3.new(50, 5, 50),
	Vector3.new(-50, 5, 50),
	Vector3.new(50, 5, -50),
	Vector3.new(-50, 5, -50),
}

-- Create an NPC
local function createNPC(npcData, position)
	local npc = Instance.new("Model")
	npc.Name = npcData.Name
	
	-- Humanoid
	local humanoid = Instance.new("Humanoid")
	humanoid.Parent = npc
	humanoid.WalkSpeed = 12
	
	-- Body parts (simplified)
	local head = Instance.new("Part")
	head.Name = "Head"
	head.Size = Vector3.new(2, 1, 1)
	head.BrickColor = BrickColor.new("Light orange")
	head.TopSurface = Enum.SurfaceType.Smooth
	head.BottomSurface = Enum.SurfaceType.Smooth
	head.Parent = npc
	
	local face = Instance.new("Decal")
	face.Texture = "rbxasset://textures/face.png"
	face.Parent = head
	
	local torso = Instance.new("Part")
	torso.Name = "Torso"
	torso.Size = Vector3.new(2, 2, 1)
	torso.BrickColor = BrickColor.new("Bright blue")
	torso.TopSurface = Enum.SurfaceType.Smooth
	torso.BottomSurface = Enum.SurfaceType.Smooth
	torso.Parent = npc
	
	-- Neck
	local neck = Instance.new("Motor6D")
	neck.Name = "Neck"
	neck.Part0 = torso
	neck.Part1 = head
	neck.C0 = CFrame.new(0, 1, 0)
	neck.C1 = CFrame.new(0, -0.5, 0)
	neck.Parent = torso
	
	-- Root part
	local rootPart = Instance.new("Part")
	rootPart.Name = "HumanoidRootPart"
	rootPart.Size = Vector3.new(2, 2, 1)
	rootPart.Transparency = 1
	rootPart.CanCollide = false
	rootPart.Parent = npc
	
	local rootJoint = Instance.new("Motor6D")
	rootJoint.Name = "RootJoint"
	rootJoint.Part0 = rootPart
	rootJoint.Part1 = torso
	rootJoint.Parent = rootPart
	
	-- Legs
	local leftLeg = Instance.new("Part")
	leftLeg.Name = "Left Leg"
	leftLeg.Size = Vector3.new(1, 2, 1)
	leftLeg.BrickColor = BrickColor.new("Bright blue")
	leftLeg.Parent = npc
	
	local leftHip = Instance.new("Motor6D")
	leftHip.Name = "Left Hip"
	leftHip.Part0 = torso
	leftHip.Part1 = leftLeg
	leftHip.C0 = CFrame.new(-0.5, -1, 0)
	leftHip.C1 = CFrame.new(0, 1, 0)
	leftHip.Parent = torso
	
	local rightLeg = Instance.new("Part")
	rightLeg.Name = "Right Leg"
	rightLeg.Size = Vector3.new(1, 2, 1)
	rightLeg.BrickColor = BrickColor.new("Bright blue")
	rightLeg.Parent = npc
	
	local rightHip = Instance.new("Motor6D")
	rightHip.Name = "Right Hip"
	rightHip.Part0 = torso
	rightHip.Part1 = rightLeg
	rightHip.C0 = CFrame.new(0.5, -1, 0)
	rightHip.C1 = CFrame.new(0, 1, 0)
	rightHip.Parent = torso
	
	-- Arms
	local leftArm = Instance.new("Part")
	leftArm.Name = "Left Arm"
	leftArm.Size = Vector3.new(1, 2, 1)
	leftArm.BrickColor = BrickColor.new("Light orange")
	leftArm.Parent = npc
	
	local leftShoulder = Instance.new("Motor6D")
	leftShoulder.Name = "Left Shoulder"
	leftShoulder.Part0 = torso
	leftShoulder.Part1 = leftArm
	leftShoulder.C0 = CFrame.new(-1, 0.5, 0)
	leftShoulder.C1 = CFrame.new(0, 0.5, 0)
	leftShoulder.Parent = torso
	
	local rightArm = Instance.new("Part")
	rightArm.Name = "Right Arm"
	rightArm.Size = Vector3.new(1, 2, 1)
	rightArm.BrickColor = BrickColor.new("Light orange")
	rightArm.Parent = npc
	
	local rightShoulder = Instance.new("Motor6D")
	rightShoulder.Name = "Right Shoulder"
	rightShoulder.Part0 = torso
	rightShoulder.Part1 = rightArm
	rightShoulder.C0 = CFrame.new(1, 0.5, 0)
	rightShoulder.C1 = CFrame.new(0, 0.5, 0)
	rightShoulder.Parent = torso
	
	-- Apply clothing
	if npcData.Shirt > 0 then
		local shirt = Instance.new("Shirt")
		shirt.ShirtTemplate = "rbxassetid://" .. npcData.Shirt
		shirt.Parent = npc
	end
	
	if npcData.Pants > 0 then
		local pants = Instance.new("Pants")
		pants.PantsTemplate = "rbxassetid://" .. npcData.Pants
		pants.Parent = npc
	end
	
	-- Position
	npc:MoveTo(position)
	npc.Parent = workspace
	
	return npc
end

-- Make NPC walk around
local function makeNPCWander(npc)
	spawn(function()
		while npc and npc.Parent do
			local randomTarget = SPAWN_POINTS[math.random(1, #SPAWN_POINTS)]
			local humanoid = npc:FindFirstChild("Humanoid")
			
			if humanoid then
				humanoid:MoveTo(randomTarget)
				humanoid.MoveToFinished:Wait()
				wait(math.random(3, 8)) -- Rest between walks
			else
				break
			end
		end
	end)
end

-- Spawn NPCs
local function spawnNPCs()
	for i = 1, 5 do -- Spawn 5 NPCs
		local npcType = NPC_TYPES[math.random(1, #NPC_TYPES)]
		local spawnPos = SPAWN_POINTS[math.random(1, #SPAWN_POINTS)]
		
		local npc = createNPC(npcType, spawnPos)
		table.insert(NPCs, npc)
		makeNPCWander(npc)
		
		wait(1)
	end
end

-- Initialize
wait(5) -- Wait for map to load
spawnNPCs()

print("✅ NPCSystem loaded - " .. #NPCs .. " NPCs spawned")
