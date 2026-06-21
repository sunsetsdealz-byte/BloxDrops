--[[
    Proximity Prompts Setup
    Creates interactive prompts for jobs and locations
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

-- Wait for Config
local Config = require(ReplicatedStorage:WaitForChild("Modules"):WaitForChild("Config"))
local JobSystem = require(ServerScriptService:WaitForChild("JobSystem"))

local ProximityPromptSetup = {}

function ProximityPromptSetup.CreateJobPrompt(location, jobName)
    local prompt = Instance.new("ProximityPrompt")
    prompt.Name = "JobPrompt"
    prompt.ActionText = "Start Job"
    prompt.ObjectText = jobName
    prompt.MaxActivationDistance = 10
    prompt.HoldDuration = 1
    prompt.KeyboardKeyCode = Enum.KeyCode.E
    prompt.Parent = location
    
    prompt.Triggered:Connect(function(player)
        -- Start the job
        JobSystem.StartJob(player, jobName)
    end)
    
    return prompt
end

function ProximityPromptSetup.SetupAllPrompts()
    local map = workspace:WaitForChild("Map", 10)
    if not map then
        warn("Map not found! Run MapBuilder first.")
        return
    end
    
    -- Find job locations and add prompts
    for jobName, jobData in pairs(Config.Jobs) do
        local locationName = jobName .. "Location"
        local location = map:FindFirstChild(locationName)
        
        if location then
            ProximityPromptSetup.CreateJobPrompt(location, jobData.Name)
            print("Created prompt for:", jobData.Name)
        end
    end
end

-- Auto-setup when map loads
if workspace:FindFirstChild("Map") then
    ProximityPromptSetup.SetupAllPrompts()
else
    workspace.ChildAdded:Connect(function(child)
        if child.Name == "Map" then
            task.wait(1) -- Give map time to fully load
            ProximityPromptSetup.SetupAllPrompts()
        end
    end)
end

return ProximityPromptSetup
