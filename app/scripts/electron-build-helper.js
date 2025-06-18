const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const platform = process.platform;
const buildTarget = process.env.BUILD_TARGET;

console.log(`Building for platform: ${platform}, target: ${buildTarget || 'default'}`);

// Convert icons properly by executing the script directly
console.log('Converting application icons...');
try {
    // Execute the conversion script directly instead of requiring it
    execSync('node scripts/convert-icons.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    console.log('✓ Application icons converted successfully');
} catch (err) {
    console.error('Error converting application icons:', err);
    // Continue with the build even if icon conversion fails
}

console.log('Generating remote wallpaper catalog...');

try {
    require('./generate-remote-wallpapers');
    console.log('✓ Remote wallpaper catalog generated');
} catch (err) {
    console.error('Error generating remote wallpaper catalog:', err);
}

console.log('Copying index.js to out directory...');
try {
    fs.copyFileSync(
        path.join(__dirname, '..', 'index.js'),
        path.join(__dirname, '..', 'out', 'index.js')
    );
    console.log('✓ Copied index.js');
} catch (err) {
    console.error('Error copying index.js:', err);
}

console.log('Copying electron directory to out directory...');
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
        console.log(`✓ Copied electron/${file}`);
    }

    console.log('✓ Copied electron directory');

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

    console.log('✓ Created fallback HTML');

    // Determine which platform files to copy based on build target
    const targetPlatform = buildTarget ? buildTarget.split('-')[0] : platform;
    copyPlatformSpecificFiles(outElectronDir, targetPlatform);
} catch (err) {
    console.error('Error copying electron directory:', err);
}

console.log('Fixing HTML paths for Electron...');
try {
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');

    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        html = html.replace(/"\/(_next\/static\/|images\/|favicon\.ico)/g, '"$1');
        html = html.replace('<head>', '<head>\n    <base href="./">');
        fs.writeFileSync(indexPath, html);
        console.log('✓ Fixed HTML paths successfully');
    } else {
        console.error(`Index file not found at: ${indexPath}`);
    }
} catch (err) {
    console.error('Error fixing HTML paths:', err);
}

function copyPlatformSpecificFiles(outDir, targetPlatform) {
    console.log(`Preparing platform-specific files for: ${targetPlatform}`);

    try {
        if (targetPlatform === 'win' || targetPlatform === 'win32') {
            // Check multiple potential binary locations
            const possiblePaths = [
                path.join(__dirname, '..', 'node_modules', 'wallpaper', 'source', 'windows-wallpaper.exe'),
                path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
                path.join(__dirname, '..', 'source', 'windows-wallpaper.exe')
            ];

            let winBinary = null;
            for (const potentialPath of possiblePaths) {
                if (fs.existsSync(potentialPath)) {
                    winBinary = potentialPath;
                    console.log(`Found Windows wallpaper binary at: ${winBinary}`);
                    break;
                }
            }

            if (winBinary) {
                // Copy to multiple locations to ensure it's found
                const destBinary = path.join(outDir, 'windows-wallpaper.exe');
                fs.copyFileSync(winBinary, destBinary);
                console.log('✓ Copied Windows wallpaper binary');
            } else {
                console.log('Windows wallpaper binary not found!');
            }
        } else if (targetPlatform === 'mac' || targetPlatform === 'darwin') {
            console.log('Creating macOS AppleScript helper');
            const macScript = `
on run argv
  set filePath to item 1 of argv
  tell application "System Events"
    tell every desktop
      set picture to filePath
    end tell
  end tell
end run
            `.trim();
            fs.writeFileSync(path.join(outDir, 'set-wallpaper.scpt'), macScript);
            console.log('✓ Created macOS AppleScript helper');
        } else if (targetPlatform === 'linux') {
            console.log('✓ Linux handled by wallpaper module directly');
        }
    } catch (err) {
        console.error('Error copying platform-specific files:', err);
    }
}

function updateElectronBuilderConfig() {
    try {
        const configPath = path.join(__dirname, '..', 'electron-builder.json');
        if (!fs.existsSync(configPath)) {
            console.error('electron-builder.json not found!');
            return;
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.asarUnpack || !config.asarUnpack.includes('node_modules/wallpaper/**/*')) {
            config.asarUnpack = config.asarUnpack || [];
            if (!config.asarUnpack.includes('node_modules/wallpaper/**/*')) {
                config.asarUnpack.push('node_modules/wallpaper/**/*');
            }
            console.log('✓ Added wallpaper module to asarUnpack');
        }

        if (!config.extraResources) {
            config.extraResources = [];
        }

        // Add platform-specific configurations based on build target
        const targetPlatform = buildTarget ? buildTarget.split('-')[0] : platform;

        if (targetPlatform === 'win' || targetPlatform === 'win32') {
            let hasWallpaperBinary = false;
            for (const resource of config.extraResources) {
                if (resource.from && resource.from.includes('wallpaper')) {
                    hasWallpaperBinary = true;
                    break;
                }
            }

            if (!hasWallpaperBinary) {
                config.extraResources.push({
                    from: "node_modules/wallpaper/windows-wallpaper.exe",
                    to: "windows-wallpaper.exe",
                    filter: ["**/*"]
                });
                console.log('✓ Added Windows wallpaper binary to extraResources');
            }
        }

        let hasICUData = false;
        for (const resource of config.extraResources) {
            if (resource.from && resource.from.includes('icudtl.dat')) {
                hasICUData = true;
                break;
            }
        }

        if (!hasICUData) {
            config.extraResources.push({
                from: "node_modules/electron/dist/icudtl.dat",
                to: "icudtl.dat"
            });
            console.log('✓ Added ICU data to extraResources');
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    } catch (err) {
        console.error('Error updating electron-builder config:', err);
    }
}

updateElectronBuilderConfig();

function getBuildCommand() {
    let buildCommand = 'electron-builder --config electron-builder.json';

    // If a specific build target is provided via environment variable
    if (buildTarget) {
        // Handle specific build targets
        switch (buildTarget) {
            case 'win-portable':
                buildCommand += ' --win portable';
                break;
            case 'win-installer':
                buildCommand += ' --win nsis';
                break;
            case 'mac-x64':
                buildCommand += ' --mac dmg --x64';
                break;
            case 'mac-arm64':
                buildCommand += ' --mac dmg --arm64';
                break;
            case 'linux-x64':
                buildCommand += ' --linux AppImage --x64';
                break;
            case 'linux-arm64':
                buildCommand += ' --linux AppImage --arm64';
                break;
            case 'linux-armv7l':
                buildCommand += ' --linux AppImage --armv7l';
                break;
            default:
                console.warn(`Unknown build target: ${buildTarget}. Falling back to default build.`);
                break;
        }
    } else {
        // Default build command based on platform
        if (platform === 'win32') {
            buildCommand += ' --win portable';
        } else if (platform === 'darwin') {
            buildCommand += ' --mac dmg';
        } else if (platform === 'linux') {
            buildCommand += ' --linux AppImage';
        }
    }

    return buildCommand;
}

console.log('Running electron-builder...');

try {
    const buildCommand = getBuildCommand();
    console.log(`Executing: ${buildCommand}`);
    execSync(buildCommand, {
        stdio: 'inherit'
    });
    console.log('✓ Electron build completed');
} catch (err) {
    console.error('Error running electron-builder:', err);
    process.exit(1);
}