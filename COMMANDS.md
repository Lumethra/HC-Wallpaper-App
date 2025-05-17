### Manual Next Setup

- npm install next@latest react@latest react-dom@latest

### Own Commands

- Dev
    - npm run electron:dev
- Build (run for current OS (If current OS is Windows, it is packaging for Windows,...))
    - npm run electron:build
- Clean (removes useless files (they are also .gitignore'ed))
    - npm run electron:clean

### Wallpaper Version

npm uninstall wallpaper
npm install wallpaper@6.1.0

### Scripts 

"scripts": {
  "electron:build": "cross-env ELECTRON=true next build && node scripts/electron-build-helper.js",
  "electron:build:mac": "cross-env ELECTRON=true TARGET_PLATFORM=darwin next build && node scripts/electron-build-helper.js",
  "electron:build:win": "cross-env ELECTRON=true TARGET_PLATFORM=win32 next build && node scripts/electron-build-helper.js",
  "electron:build:linux": "cross-env ELECTRON=true TARGET_PLATFORM=linux next build && node scripts/electron-build-helper.js",
  "electron:build:all": "cross-env ELECTRON=true TARGET_PLATFORM=all next build && node scripts/electron-build-helper.js"
}