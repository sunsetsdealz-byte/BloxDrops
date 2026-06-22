# 🍕 Neon Pizza Sign

Animated neon pizza slice sign for your Roblox pizza shop.

## Features
- **Realistic neon glow** with pulsing animation
- **Pepperoni details** that glow sequentially
- **Cheese drip effect** with smooth animation
- **Flickering effect** for authentic neon look
- **Ambient lighting** that illuminates surroundings

## Installation

### Quick Install (3 steps):

1. **Add Module to ReplicatedStorage:**
   - Copy `Modules/NeonPizzaSign.lua`
   - Paste in `ReplicatedStorage > Modules`

2. **Run Installer:**
   - Copy `INSTALL_PIZZA_SIGN.lua`
   - Paste in Command Bar (View > Command Bar)
   - Press Enter

3. **Position the sign:**
   - Edit line 23 in installer: `Vector3.new(X, Y, Z)`
   - Or drag the sign in workspace after creation

### Manual Creation:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local NeonPizzaSign = require(ReplicatedStorage.Modules.NeonPizzaSign)

-- Create at specific position
local sign = NeonPizzaSign.Create(Vector3.new(0, 20, 0))
sign.Parent = workspace

-- OR attach to building
local pizzaShop = workspace.PizzaShop
local sign = NeonPizzaSign.AttachToBuilding(pizzaShop, 15)
```

## Customization

Edit `NeonPizzaSign.lua` to customize:

- **Size:** Change `pizzaBase.Size` (line 20)
- **Colors:** Modify `Color3.fromRGB()` values
- **Animation speed:** Adjust `TweenInfo.new()` duration values
- **Glow intensity:** Change `light.Brightness` (line 143)

## Animation Effects

1. **Pulsing Glow** - Main pizza body pulses every 2 seconds
2. **Sequential Pepperoni** - Each pepperoni glows in sequence (0.3s delay)
3. **Cheese Drip** - Smooth dripping animation (3s cycle)
4. **Random Flicker** - Authentic neon flicker every 5-15 seconds

## Performance

- Uses TweenService for smooth animations
- Minimal script overhead
- All parts anchored and non-collidable
- Optimized for multiple signs

## Tips

- Place 15-20 studs above your pizza shop entrance
- Works great as storefront signage
- Visible from far distances due to neon material
- Adjust `light.Range` for bigger/smaller glow radius

Enjoy your neon pizza sign! 🍕✨
