const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const platform = process.platform;

try {
    require('./generate-remote-wallpapers');
} catch (err) {
    console.error('Error generating remote wallpaper catalog:', err);
}

try {
    fs.copyFileSync(
        path.join(__dirname, '..', 'index.js'),
        path.join(__dirname, '..', 'out', 'index.js')
    );
} catch (err) {
    console.error('Error copying index.js:', err);
}

try {
    const outElectronDir = path.join(__dirname, '..', 'out', 'electron');
    if (!fs.existsSync(outElectronDir)) {
        fs.mkdirSync(outElectronDir, { recursive: true });
    }

    const electronDir = path.join(__dirname, '..', 'electron');
    const electronFiles = fs.readdirSync(electronDir);

    for (const file of electronFiles) {
        const srcPath = path.join(electronDir, file);
        const destPath = path.join(outElectronDir, file);

        if (fs.statSync(srcPath).isDirectory()) continue;

        fs.copyFileSync(srcPath, destPath);
    }

    const fallbackPath = path.join(outElectronDir, 'fallback.html');
    fs.writeFileSync(fallbackPath, `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>HC Wallpaper App</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
                h1 { color: #ec3750; }
            </style>
        </head>
        <body>
            <h1>HC Wallpaper App</h1>
            <p>There was an error loading the application.</p>
            <p>Please check the logs for more information.</p>
        </body>
        </html>
    `);

    copyPlatformSpecificFiles(outElectronDir);
} catch (err) {
    console.error('Error copying electron directory:', err);
}

try {
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');

    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        html = html.replace(/"\/(_next\/static\/|images\/|favicon\.ico)/g, '"$1');
        html = html.replace('<head>', '<head>\n    <base href="./">');
        fs.writeFileSync(indexPath, html);
    } else {
        console.error(`Index file not found at: ${indexPath}`);
    }
} catch (err) {
    console.error('Error fixing HTML paths:', err);
}

function copyPlatformSpecificFiles(outDir) {
    try {
        if (platform === 'win32') {
            const winBinary = path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe');
            if (fs.existsSync(winBinary)) {
                const destBinary = path.join(outDir, 'windows-wallpaper.exe');
                fs.copyFileSync(winBinary, destBinary);
            }
        }
    } catch (err) {
        console.error('Error copying platform-specific files:', err);
    }
}

function updateElectronBuilderConfig() {
    try {
        const configPath = path.join(__dirname, '..', 'electron-builder.json');
        if (!fs.existsSync(configPath)) {
            return;
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.asarUnpack || !config.asarUnpack.includes('node_modules/wallpaper/**/*')) {
            config.asarUnpack = config.asarUnpack || [];
            if (!config.asarUnpack.includes('node_modules/wallpaper/**/*')) {
                config.asarUnpack.push('node_modules/wallpaper/**/*');
            }
        }

        if (!config.extraResources) {
            config.extraResources = [];
        }

        let hasWallpaperBinary = false;
        for (const resource of config.extraResources) {
            if (resource.from && resource.from.includes('wallpaper')) {
                hasWallpaperBinary = true;
                break;
            }
        }

        if (!hasWallpaperBinary && platform === 'win32') {
            config.extraResources.push({
                from: "node_modules/wallpaper/windows-wallpaper.exe",
                to: "windows-wallpaper.exe"
            });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    } catch (err) {
        console.error('Error updating electron-builder config:', err);
    }
}

updateElectronBuilderConfig();

function getBuildCommand() {
    let buildCommand = 'electron-builder --config electron-builder.json';

    if (platform === 'win32') {
        buildCommand += ' --win portable';
    } else if (platform === 'darwin') {
        buildCommand += ' --mac dmg';
    } else if (platform === 'linux') {
        buildCommand += ' --linux AppImage';
    }

    return buildCommand;
}

try {
    const buildCommand = getBuildCommand();
    execSync(buildCommand, {
        stdio: 'inherit'
    });
} catch (err) {
    console.error('Error running electron-builder:', err);
    process.exit(1);
}