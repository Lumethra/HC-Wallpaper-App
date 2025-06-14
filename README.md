# HC-Wallpaper-App

<div align="center">
    <br/>
    <p>
        <img src="https://github.com/Lumethra/HC-Wallpaper-App/blob/main/app/public/icons/Abhay-App-Icon.jpg?raw=true" title="logo" alt="logo" width="100" />
    </p>
    <p>
        a wallpaper social platform for hack clubbers
        <br/>
        <a href="https://github.com/Lumethra">
            made by Lumethra
        </a>
    </p>
    <p>
        <a href="https://lumethra.itch.io/hc-wallpaper-app" style="
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s ease;
            margin-right: 10px;
        " onmouseover="this.style.backgroundColor='#45a049'" onmouseout="this.style.backgroundColor='#4CAF50'">
            Desktop App
        </a>
        <a href="https://hc-wallpaper-app.vercel.app" style="
            display: inline-block;
            background-color: #007BFF;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s ease;
        " onmouseover="this.style.backgroundColor='#0056b3'" onmouseout="this.style.backgroundColor='#007BFF'">
            Web App
        </a>
    </p>
    <br/>
</div>

HC-Wallpaper-App is a social platform for sharing wallpapers with the Hack Club community.

<!--
## Compiling

### Prerequisites
- Nodejs 20+
- git

### macOS
```zsh
git clone https://github.com/Lumethra/HC-Wallpaper-App
cd HC-Wallpaper-App/app
mkdir -p ./build
cat > ./build/entitlements.mac.plist << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
  </dict>
</plist>
EOL
npm ci
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build
open dist
```

### Linux
```zsh
git clone https://github.com/Lumethra/HC-Wallpaper-App
cd HC-Wallpaper-App/app
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libglib2.0-dev rpm
npm ci
npm run electron:build
```

### Windows
```zsh
git clone https://github.com/Lumethra/HC-Wallpaper-App
cd HC-Wallpaper-App/app
npm ci
npm run electron:build
```
-->

<sup>
    A ReadMe by Neon443
</sup>
---

<sup>
    &copy; 2025 Lumethra.
</sup>

