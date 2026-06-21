--[[
    PBR MATERIAL LIBRARY
    High-quality materials for photorealistic rendering
    Place in ReplicatedStorage as ModuleScript
]]

local Materials = {}

-- CONCRETE (Sidewalks, buildings)
Materials.Concrete = {
    Material = Enum.Material.Concrete,
    Color = Color3.fromRGB(180, 180, 180),
    Reflectance = 0.1,
    TextureID = "rbxassetid://9438410548", -- 4K concrete
    StudsPerTileU = 8,
    StudsPerTileV = 8
}

-- ASPHALT (Roads)
Materials.Asphalt = {
    Material = Enum.Material.Asphalt,
    Color = Color3.fromRGB(60, 60, 65),
    Reflectance = 0.05,
    TextureID = "rbxassetid://9438410304",
    StudsPerTileU = 10,
    StudsPerTileV = 10
}

-- GLASS (Windows)
Materials.Glass = {
    Material = Enum.Material.Glass,
    Color = Color3.fromRGB(200, 220, 255),
    Transparency = 0.7,
    Reflectance = 0.6
}

-- METAL (Buildings, vehicles)
Materials.Metal = {
    Material = Enum.Material.Metal,
    Color = Color3.fromRGB(160, 160, 165),
    Reflectance = 0.5,
    TextureID = "rbxassetid://9438410912"
}

-- BRICK (Buildings)
Materials.Brick = {
    Material = Enum.Material.Brick,
    Color = Color3.fromRGB(140, 90, 70),
    Reflectance = 0.05,
    TextureID = "rbxassetid://9438410684",
    StudsPerTileU = 4,
    StudsPerTileV = 4
}

-- WOOD (Doors, furniture)
Materials.Wood = {
    Material = Enum.Material.Wood,
    Color = Color3.fromRGB(120, 80, 50),
    Reflectance = 0.1,
    TextureID = "rbxassetid://9438411216"
}

-- GRASS (Terrain)
Materials.Grass = {
    Material = Enum.Material.Grass,
    Color = Color3.fromRGB(100, 140, 80),
    TextureID = "rbxassetid://9438411504",
    StudsPerTileU = 6,
    StudsPerTileV = 6
}

-- Apply material to part
function Materials.Apply(part, materialType)
    local mat = Materials[materialType]
    if not mat then return end
    
    part.Material = mat.Material
    part.Color = mat.Color
    if mat.Reflectance then part.Reflectance = mat.Reflectance end
    if mat.Transparency then part.Transparency = mat.Transparency end
    
    -- Apply PBR textures if available
    if mat.TextureID then
        local surface = part:FindFirstChildOfClass("SurfaceAppearance") or Instance.new("SurfaceAppearance", part)
        surface.ColorMap = mat.TextureID
        surface.MetalnessMap = mat.TextureID
        surface.NormalMap = mat.TextureID
        surface.RoughnessMap = mat.TextureID
        surface.TexturePack = "rbxasset://textures/SurfaceImages/Default.xml"
    end
end

return Materials
