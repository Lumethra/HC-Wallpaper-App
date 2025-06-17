const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Use environment variable if set, otherwise use current platform
const platform = process.env.PLATFORM === 'current' ? process.platform : process.env.PLATFORM || process.platform;
console.log(`Building for platform: ${platform}`);

// Convert icons properly
console.log('Converting application icons...');
try {
    execSync('node scripts/convert-icons.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    console.log('✓ Application icons converted successfully');
} catch (err) {
    console.error('Error converting application icons:', err);
}

console.log('Generating remote wallpaper catalog...');
try {
    require('./generate-remote-wallpapers');
    console.log('✓ Remote wallpaper catalog generated');
} catch (err) {
    console.error('Error generating remote wallpaper catalog:', err);
}

// Copy files to output directory
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
    const electronDir = path.join(__dirname, '..', 'electron');
    const outElectronDir = path.join(__dirname, '..', 'out', 'electron');

    if (!fs.existsSync(outElectronDir)) {
        fs.mkdirSync(outElectronDir, { recursive: true });
    }

    fs.readdirSync(electronDir).forEach(file => {
        const src = path.join(electronDir, file);
        const dest = path.join(outElectronDir, file);

        if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest);
            console.log(`✓ Copied electron/${file}`);
        }
    });

    console.log('✓ Copied electron directory');
} catch (err) {
    console.error('Error copying electron directory:', err);
}

// Create fallback HTML
console.log('Creating fallback HTML...');
try {
    const fallbackPath = path.join(__dirname, '..', 'out', 'fallback.html');
    fs.writeFileSync(fallbackPath, `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Loading HC Wallpaper App</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    background-color: #f5f5f5;
                    color: #333;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    text-align: center;
                }
                h1 {
                    margin-bottom: 10px;
                }
                p {
                    margin: 5px 0;
                }
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top: 4px solid #333;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 20px 0;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @media (prefers-color-scheme: dark) {
                    body {
                        background-color: #1a1a1a;
                        color: #f5f5f5;
                    }
                    .spinner {
                        border-color: rgba(255, 255, 255, 0.1);
                        border-top-color: #f5f5f5;
                    }
                }
            </style>
        </head>
        <body>
            <h1>HC Wallpaper App</h1>
            <p>Loading application...</p>
            <div class="spinner"></div>
            <p>If the application doesn't load within a few moments,<br>please restart the application.</p>
        </body>
        </html>
    `);
    console.log('✓ Created fallback HTML');
} catch (err) {
    console.error('Error creating fallback HTML:', err);
}

// Copy platform-specific files
const outDir = path.join(__dirname, '..', 'out');
copyPlatformSpecificFiles(outDir);

// Fix HTML paths for Electron
console.log('Fixing HTML paths for Electron...');
try {
    const htmlFiles = [
        path.join(outDir, 'index.html'),
        path.join(outDir, '404.html'),
    ];

    htmlFiles.forEach(htmlPath => {
        if (fs.existsSync(htmlPath)) {
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // Fix paths
            htmlContent = htmlContent
                .replace(/"\/_next\//g, '"./next/')
                .replace(/"\/_next\//g, '"./next/')
                .replace(/href="\//g, 'href="./')
                .replace(/src="\//g, 'src="./');

            fs.writeFileSync(htmlPath, htmlContent);
        }
    });

    console.log('✓ Fixed HTML paths successfully');
} catch (err) {
    console.error('Error fixing HTML paths:', err);
}

// Update electron-builder config
updateElectronBuilderConfig();

// Build with Electron
console.log('Running electron-builder...');
const buildCommand = getBuildCommand();
console.log(`Executing: ${buildCommand}`);

try {
    execSync(buildCommand, { stdio: 'inherit' });
} catch (err) {
    console.error('Error running electron-builder:', err);
    process.exit(1);
}

// Helper functions
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

function getBuildCommand() {
    let buildCommand = 'electron-builder --config electron-builder.json';

    if (platform === 'win32') {
        // Check for build type to allow building just one format
        if (process.env.WIN_BUILD_TYPE === 'installer') {
            buildCommand += ' --win nsis';
        } else if (process.env.WIN_BUILD_TYPE === 'portable') {
            buildCommand += ' --win portable';
        } else {
            // Build both by default
            buildCommand += ' --win';
        }
    } else if (platform === 'darwin') {
        buildCommand += ' --mac dmg';

        const arch = process.env.ARCH || os.arch();
        if (arch === 'arm64') {
            buildCommand += ' --arm64';
        } else if (arch === 'x64' || process.env.ARCH === 'x64') {
            buildCommand += ' --x64';
        }
    } else if (platform === 'linux') {
        buildCommand += ' --linux';

        // Handle platform architecture
        const arch = process.env.ARCH || os.arch();
        if (arch === 'arm64') {
            buildCommand += ' --arm64';
        } else if (arch === 'armv7l') {
            buildCommand += ' --armv7l';
        } else if (arch === 'x64' || process.env.ARCH === 'x64') {
            buildCommand += ' --x64'; // Explicitly add x64 flag
        }
    }

    // Always add --publish=never to avoid accidental publishing
    buildCommand += ' --publish=never';

    return buildCommand;
}

// Final output
console.log('Build complete! Output directory contents:');
try {
    const distDir = path.join(__dirname, '..', 'dist');
    const files = fs.readdirSync(distDir);
    console.log(`Found ${files.length} files in dist directory:`);
    files.forEach(file => {
        console.log(`- ${file}`);
    });
} catch (err) {
    console.error('Error listing dist directory:', err);
}