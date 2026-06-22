# Rojo Setup Complete! 🎉

## What's Installed

✅ **Rust** (v1.96.0) - Programming language and compiler
✅ **Cargo** - Rust package manager
✅ **Visual Studio Build Tools** - Required for compiling Rust packages on Windows
✅ **Rojo** (v7.6.1) - Roblox project management tool
✅ **Rojo Plugin** - Installed in Roblox Studio

## How to Use Rojo with Roblox Studio

### 1. Start a Rojo Server

In your project directory, run:
```bash
rojo serve
```

This will start a server (usually on port 34872) that syncs your files with Roblox Studio.

### 2. Connect from Roblox Studio

1. Open Roblox Studio
2. Open any place or create a new one
3. Look for the **Rojo** plugin in your toolbar
4. Click **Connect** in the Rojo plugin
5. Your code will now sync automatically!

### 3. Project Structure

A typical Rojo project looks like this:
```
your-project/
├── default.project.json  # Rojo configuration file
├── src/
│   ├── server/          # ServerScriptService scripts
│   ├── client/          # StarterPlayer scripts
│   └── shared/          # ReplicatedStorage scripts
└── README.md
```

## Common Commands

### Create a new project
```bash
rojo init my-project
```

### Start the sync server
```bash
cd my-project
rojo serve
```

### Build a Roblox place file
```bash
rojo build -o output.rbxl
```

### Build a Roblox model file
```bash
rojo build -o output.rbxm
```

### Install/Update the plugin
```bash
rojo plugin install
```

## Test Project

A test project has been created at:
`C:\bloxdrops\test-project`

You can test Rojo by:
1. Opening a command prompt
2. Running: `cd C:\bloxdrops\test-project`
3. Running: `rojo serve`
4. Opening Roblox Studio and connecting via the Rojo plugin

## Troubleshooting

### Plugin not showing in Studio?
- Restart Roblox Studio
- Check that the plugin is in: `%LOCALAPPDATA%\Roblox\Plugins\`
- Run `rojo plugin install` again

### "Connection refused" error?
- Make sure `rojo serve` is running
- Check that the port (default 34872) isn't blocked by a firewall
- Try specifying a different port: `rojo serve --port 34873`

### Changes not syncing?
- Check the Rojo server console for errors
- Make sure you're connected in the Rojo plugin
- Try disconnecting and reconnecting

## Additional Resources

- Official Docs: https://rojo.space/docs/
- GitHub: https://github.com/rojo-rbx/rojo
- Discord: Join the Roblox OSS Discord for support

## Next Steps

1. Navigate to your project: `cd C:\bloxdrops\test-project`
2. Start the server: `rojo serve`
3. Open Roblox Studio and click "Connect" in the Rojo plugin
4. Start coding! Changes to files in `src/` will sync automatically

Happy developing! 🚀
