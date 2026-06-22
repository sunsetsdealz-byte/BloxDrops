--[[
    BloxVille Configuration
    Adjust all game settings here
]]

local Config = {}

-- Game Info
Config.GameName = "BloxVille"
Config.Version = "1.0.0"
Config.MaxPlayers = 50

-- Economy (Better than Brookhaven - actual progression)
Config.Economy = {
    StartingCash = 500,
    DailyCashBonus = 100,
    VIPCashMultiplier = 2,
    MaxCash = 10000000,
    TipEnabled = true,
    TipAmount = 10
}

-- Housing
Config.Houses = {
    Starter = {
        Price = 0,
        MaxFurniture = 20,
        PlotSize = Vector3.new(30, 20, 30)
    },
    Modern = {
        Price = 5000,
        MaxFurniture = 50,
        PlotSize = Vector3.new(50, 25, 50)
    },
    Mansion = {
        Price = 25000,
        MaxFurniture = 150,
        PlotSize = Vector3.new(80, 30, 80)
    },
    Penthouse = {
        Price = 100000,
        MaxFurniture = 300,
        PlotSize = Vector3.new(100, 40, 100)
    }
}

-- Jobs
Config.Jobs = {
    PizzaDelivery = {
        Name = "Pizza Delivery",
        PayPerTask = 50,
        XPPerTask = 10,
        UnlockLevel = 0
    },
    Cashier = {
        Name = "Store Cashier",
        PayPerTask = 75,
        XPPerTask = 15,
        UnlockLevel = 5
    },
    Mechanic = {
        Name = "Mechanic",
        PayPerTask = 150,
        XPPerTask = 25,
        UnlockLevel = 10
    },
    Doctor = {
        Name = "Doctor",
        PayPerTask = 300,
        XPPerTask = 50,
        UnlockLevel = 20
    },
    Pilot = {
        Name = "Pilot",
        PayPerTask = 500,
        XPPerTask = 100,
        UnlockLevel = 35
    },
    CEO = {
        Name = "CEO",
        PayPerTask = 1000,
        XPPerTask = 200,
        UnlockLevel = 50
    }
}

-- Vehicles
Config.Vehicles = {
    Bike = {
        Price = 100,
        Speed = 30,
        VIPOnly = false
    },
    Sedan = {
        Price = 2000,
        Speed = 50,
        VIPOnly = false
    },
    SportsCar = {
        Price = 15000,
        Speed = 80,
        VIPOnly = false
    },
    Lambo = {
        Price = 50000,
        Speed = 100,
        VIPOnly = false
    },
    Helicopter = {
        Price = 100000,
        Speed = 120,
        VIPOnly = true
    }
}

-- Pets
Config.Pets = {
    Dog = {
        Price = 500,
        Ability = "FindSecrets",
        Rarity = "Common"
    },
    Cat = {
        Price = 500,
        Ability = "LuckBoost",
        Rarity = "Common"
    },
    Parrot = {
        Price = 2000,
        Ability = "CashBoost",
        Rarity = "Rare"
    },
    Dragon = {
        Price = 50000,
        Ability = "XPBoost",
        Rarity = "Legendary"
    }
}

-- Gamepasses
Config.Gamepasses = {
    VIP = 000000, -- Replace with actual gamepass ID
    ExtraPlot = 000000,
    FastVehicle = 000000
}

-- Developer Products
Config.Products = {
    Cash100 = 000000,  -- $100 for 99 Robux
    Cash500 = 000000,  -- $500 for 299 Robux
    Cash2500 = 000000, -- $2500 for 999 Robux
}

-- Rebirth
Config.RebirthCost = 100000
Config.RebirthMultiplier = 1.5

-- Events
Config.Events = {
    Weekend2xCash = true,
    HolidayBonus = true,
    RandomDrops = true
}

-- Admin Users (Add your Roblox User IDs)
Config.Admins = {
    -- 123456789, -- Example
}

-- Anti-Exploit
Config.MaxCashPerMinute = 10000
Config.KickForExploit = true

return Config
