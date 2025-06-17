const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const platform = process.platform;
console.log(`Building for platform: ${platform}`);

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

    copyPlatformSpecificFiles(outElectronDir);
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

function copyPlatformSpecificFiles(outDir) {
    console.log(`Preparing platform-specific files for: ${platform}`);

    try {
        if (platform === 'win32') {
            const winBinary = path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe');
            if (fs.existsSync(winBinary)) {
                const destBinary = path.join(outDir, 'windows-wallpaper.exe');
                fs.copyFileSync(winBinary, destBinary);
                console.log('✓ Copied Windows wallpaper binary');
            } else {
                console.log('Windows wallpaper binary not found!');
            }
        } else if (platform === 'darwin') {
            console.log('✓ macOS uses AppleScript for wallpaper (no binary needed)');
        } else if (platform === 'linux') {
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

        if (platform === 'win32') {
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

// Update the getBuildCommand function to use passed arguments from workflow
function getBuildCommand() {
    // First check if we have command line arguments
    const args = process.argv.slice(2);
    if (args.length > 0) {
        return `electron-builder --config electron-builder.json ${args.join(' ')}`;
    }

    // Default behavior as fallback
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