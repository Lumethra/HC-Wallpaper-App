const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Get platform-specific information
const platform = process.platform;
console.log(`Building for platform: ${platform}`);

console.log('Generating remote wallpaper catalog...');
try {
    require('./generate-remote-wallpapers');
    console.log('✓ Remote wallpaper catalog generated');
} catch (err) {
    console.error('Error generating remote wallpaper catalog:', err);
}

// Copy resources and fix paths
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

        // Skip directories
        if (fs.statSync(srcPath).isDirectory()) continue;

        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied electron/${file}`);
    }

    console.log('✓ Copied electron directory');

    // Create a fallback HTML file
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

    // Copy platform-specific wallpaper binaries if needed
    copyPlatformSpecificFiles(outElectronDir);

} catch (err) {
    console.error('Error copying electron directory:', err);
}

// Fix HTML paths
console.log('Fixing HTML paths for Electron...');
try {
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');

    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');

        // Fix path references to be relative
        html = html.replace(/"\/(_next\/static\/|images\/|favicon\.ico)/g, '"$1');

        // Add base href
        html = html.replace('<head>', '<head>\n    <base href="./">');

        fs.writeFileSync(indexPath, html);
        console.log('✓ Fixed HTML paths successfully');
    } else {
        console.error(`Index file not found at: ${indexPath}`);
    }
} catch (err) {
    console.error('Error fixing HTML paths:', err);
}

// Function to copy platform-specific files
function copyPlatformSpecificFiles(outDir) {
    // Check if we're building for a specific target platform
    const targetPlatform = process.env.TARGET_PLATFORM || platform;
    console.log(`Preparing platform-specific files for: ${targetPlatform}`);

    try {
        // Copy wallpaper binaries based on platform
        if (targetPlatform === 'win32') {
            // Copy Windows wallpaper binary
            const winBinary = path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe');
            if (fs.existsSync(winBinary)) {
                const destBinary = path.join(outDir, 'windows-wallpaper.exe');
                fs.copyFileSync(winBinary, destBinary);
                console.log('✓ Copied Windows wallpaper binary');
            } else {
                console.error('Windows wallpaper binary not found!');
            }
        } else if (targetPlatform === 'darwin') {
            // Mac doesn't need a binary, it uses applescript
            console.log('✓ Mac uses applescript for wallpaper, no binary needed');
        } else if (targetPlatform === 'linux') {
            // Linux has different methods depending on desktop environment
            console.log('✓ Linux uses various methods for wallpaper, no binary needed');
        }
    } catch (err) {
        console.error('Error copying platform-specific files:', err);
    }
}

// Ensure the electron-builder.json config is correct
function updateElectronBuilderConfig() {
    try {
        const configPath = path.join(__dirname, '..', 'electron-builder.json');
        if (!fs.existsSync(configPath)) {
            console.error('electron-builder.json not found!');
            return;
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Make sure asarUnpack includes wallpaper module
        if (!config.asarUnpack || !config.asarUnpack.includes('node_modules/wallpaper/**/*')) {
            config.asarUnpack = config.asarUnpack || [];
            if (!config.asarUnpack.includes('node_modules/wallpaper/**/*')) {
                config.asarUnpack.push('node_modules/wallpaper/**/*');
            }
            console.log('✓ Added wallpaper module to asarUnpack');
        }

        // Make sure extraResources includes the wallpaper binary
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
            console.log('✓ Added wallpaper binary to extraResources');
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log('✓ Updated electron-builder.json');
    } catch (err) {
        console.error('Error updating electron-builder config:', err);
    }
}

// Run this function to ensure config is correct
updateElectronBuilderConfig();

// Determine build command based on arguments
function getBuildCommand() {
    // Check if a specific platform was requested
    const targetPlatform = process.env.TARGET_PLATFORM;
    let buildCommand = 'electron-builder --config electron-builder.json';

    if (targetPlatform) {
        switch (targetPlatform) {
            case 'win32':
                // Only create portable executable, no installer
                buildCommand += ' --win portable';
                break;
            case 'darwin':
                // Only create DMG, no installer
                buildCommand += ' --mac dmg';
                break;
            case 'linux':
                // Only create AppImage, no deb/rpm installers
                buildCommand += ' --linux AppImage';
                break;
            case 'all':
                // Modify to only create portable versions for all platforms
                buildCommand += ' --win portable --mac dmg --linux AppImage';
                break;
            default:
                console.log(`Unknown target platform: ${targetPlatform}, using current platform`);
        }
    } else {
        // For default platform, specify portable/no-installer options
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

// Run electron-builder with the appropriate command
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