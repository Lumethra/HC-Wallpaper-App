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
        <a href="https://lumethra.itch.io/hc-wallpaper-app" style="display: inline-block; padding: 10px 20px; margin: 0 10px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background-color 0.3s ease;">
            Desktop App
        </a>
        <a href="https://hc-wallpaper-app.vercel.app" style="display: inline-block; padding: 10px 20px; margin: 0 10px; background-color:     #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background-color 0.3s ease;">
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

</br>
</br>

<sup>
    A README by Neon443.
</sup>

---

<sup>
    &copy; 2025 Lumethra.
</sup>

