--[[
    Job System
    Handles all job mechanics and progression
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStore = require(script.Parent.DataStore)
local Config = require(ReplicatedStorage.Modules.Config)

local JobSystem = {}
local ActiveJobs = {}

-- Start job
function JobSystem.StartJob(player, jobName)
    local profile = DataStore.GetProfile(player)
    if not profile then return false, "Data not loaded" end
    
    local jobConfig = Config.Jobs[jobName]
    if not jobConfig then return false, "Invalid job" end
    
    -- Check level requirement
    if profile.Data.Level < jobConfig.UnlockLevel then
        return false, "Level " .. jobConfig.UnlockLevel .. " required"
    end
    
    -- Check if already working
    if ActiveJobs[player.UserId] then
        return false, "Already working a job"
    end
    
    ActiveJobs[player.UserId] = {
        Job = jobName,
        TasksCompleted = 0,
        StartTime = tick()
    }
    
    return true, "Job started!"
end

-- Complete job task
function JobSystem.CompleteTask(player)
    local activeJob = ActiveJobs[player.UserId]
    if not activeJob then return false, "No active job" end
    
    local profile = DataStore.GetProfile(player)
    if not profile then return false end
    
    local jobConfig = Config.Jobs[activeJob.Job]
    
    -- Add cash and XP
    local cashAdded
    local success, amount = DataStore.AddCash(player, jobConfig.PayPerTask)
    if success then cashAdded = amount end
    
    local leveledUp = DataStore.AddXP(player, jobConfig.XPPerTask)
    
    -- Update stats
    if not profile.Data.JobStats[activeJob.Job] then
        profile.Data.JobStats[activeJob.Job] = {
            TasksCompleted = 0,
            TotalEarned = 0
        }
    end
    
    profile.Data.JobStats[activeJob.Job].TasksCompleted += 1
    profile.Data.JobStats[activeJob.Job].TotalEarned += (cashAdded or jobConfig.PayPerTask)
    profile.Data.Stats.JobsCompleted += 1
    
    activeJob.TasksCompleted += 1
    
    return true, {
        Cash = cashAdded or jobConfig.PayPerTask,
        XP = jobConfig.XPPerTask,
        LeveledUp = leveledUp,
        TasksCompleted = activeJob.TasksCompleted
    }
end

-- End job
function JobSystem.EndJob(player)
    local activeJob = ActiveJobs[player.UserId]
    if not activeJob then return false end
    
    local duration = tick() - activeJob.StartTime
    local profile = DataStore.GetProfile(player)
    
    if profile then
        profile.Data.Stats.PlayTime += duration
    end
    
    ActiveJobs[player.UserId] = nil
    return true, activeJob.TasksCompleted
end

-- Get job stats
function JobSystem.GetJobStats(player, jobName)
    local profile = DataStore.GetProfile(player)
    if not profile then return nil end
    
    return profile.Data.JobStats[jobName] or {
        TasksCompleted = 0,
        TotalEarned = 0
    }
end

-- Setup remote events
local events = ReplicatedStorage:WaitForChild("Events")

events.StartJob.OnServerEvent:Connect(function(player, jobName)
    local success, message = JobSystem.StartJob(player, jobName)
    events.StartJobResponse:FireClient(player, success, message)
end)

events.CompleteTask.OnServerEvent:Connect(function(player)
    local success, data = JobSystem.CompleteTask(player)
    events.CompleteTaskResponse:FireClient(player, success, data)
end)

events.EndJob.OnServerEvent:Connect(function(player)
    local success, tasksCompleted = JobSystem.EndJob(player)
    events.EndJobResponse:FireClient(player, success, tasksCompleted)
end)

events.GetJobStats.OnServerEvent:Connect(function(player, jobName)
    local stats = JobSystem.GetJobStats(player, jobName)
    events.GetJobStatsResponse:FireClient(player, stats)
end)

return JobSystem
