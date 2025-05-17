const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// === ICU ERROR FIX - MUST BE BEFORE APP INITIALIZATION ===
// Add this right at the top, before any app methods are called
app.commandLine.appendSwitch('no-icu-data-error-log');
app.commandLine.appendSwitch('lang', 'en-US');

// Function to set up ICU data paths
function setupICUData() {
    log('Setting up ICU data paths');

    // Only needed for packaged app
    if (app.isPackaged) {
        // Paths discovered by your PowerShell command
        const possibleIcuPaths = [
            path.join(process.resourcesPath, 'icudtl.dat'),
            path.join(__dirname, '..', '..', 'icudtl.dat'),
            path.join(app.getAppPath(), '..', 'icudtl.dat'),
            path.join(process.execPath, '..', 'icudtl.dat'),
            // Paths from your PowerShell search
            'D:\\coding\\github\\HackClub\\HC-Wallpaper-App\\app\\dist\\win-unpacked\\resources\\icudtl.dat',
            'D:\\coding\\github\\HackClub\\HC-Wallpaper-App\\app\\dist\\win-unpacked\\icudtl.dat',
            'D:\\coding\\github\\HackClub\\HC-Wallpaper-App\\app\\node_modules\\electron\\dist\\icudtl.dat'
        ];

        // Try each path until one works
        for (const icuPath of possibleIcuPaths) {
            try {
                if (fs.existsSync(icuPath)) {
                    log(`Found ICU data at: ${icuPath}`);
                    app.commandLine.appendSwitch('icu-data-file', icuPath);
                    break;
                }
            } catch (err) {
                log(`Error checking ICU path ${icuPath}: ${err.message}`);
            }
        }

        // Also check for wallpaper binary
        const binPath = getWallpaperBinaryPath();
        if (binPath) {
            log(`Wallpaper binary found at: ${binPath}`);
            // Set an environment variable that the wallpaper package can use
            process.env.WALLPAPER_BINARY = binPath;
        } else {
            log('WARNING: Wallpaper binary not found!');
        }
    }
}

// Replace electron-is-dev with direct check
const isDev = !app.isPackaged;
const { getWallpaper, setWallpaper } = require('wallpaper');

// Add this to help with debugging
function log(message) {
    try {
        const logDir = path.join(os.homedir(), '.hc-wallpaper-app-logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, 'app.log');
        fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`);
    } catch (e) {
        // Silent fail for logging errors
    }
}

// Add this function after the log function, before createWindow
function getWallpaperBinaryPath() {
    // Check different possible locations for the wallpaper binary
    const possiblePaths = [
        // In resources folder (from extraResources in electron-builder.json)
        path.join(process.resourcesPath, 'windows-wallpaper.exe'),

        // In packaged app (unpacked from asar)
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),

        // In development
        path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),

        // In app directory
        path.join(app.getAppPath(), 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),

        // In direct parent of executable
        path.join(path.dirname(process.execPath), 'windows-wallpaper.exe'),

        // In process directory
        path.join(process.cwd(), 'windows-wallpaper.exe')
    ];

    // Log locations we're checking
    log(`Checking wallpaper binary in ${possiblePaths.length} locations`);

    for (const binPath of possiblePaths) {
        try {
            log(`Checking: ${binPath}`);
            if (fs.existsSync(binPath)) {
                log(`Found wallpaper binary at: ${binPath}`);

                // Test file permissions
                try {
                    fs.accessSync(binPath, fs.constants.X_OK);
                    log(`Binary is executable: ${binPath}`);
                } catch (e) {
                    log(`Binary exists but is not executable: ${binPath}`);
                    try {
                        // On Windows, try to make it executable
                        const { execSync } = require('child_process');
                        execSync(`icacls "${binPath}" /grant Everyone:RX`);
                        log(`Fixed permissions for: ${binPath}`);
                    } catch (e) {
                        log(`Failed to fix permissions: ${e.message}`);
                    }
                }

                return binPath;
            }
        } catch (err) {
            log(`Error checking binary path ${binPath}: ${err.message}`);
        }
    }

    log('⚠️ Wallpaper binary not found in any expected locations!');
    return null;
}

let mainWindow;

function createWindow() {
    log('Creating main window');

    try {
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            show: false // Don't show until loaded
        });

        // Show window when ready to avoid blank window
        mainWindow.once('ready-to-show', () => {
            log('Window ready to show');
            mainWindow.show();
        });

        // Handle errors
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            log(`Failed to load: ${errorCode} - ${errorDescription}`);

            // Try to load a fallback HTML file if main fails
            if (!isDev) {
                const fallbackPath = path.join(__dirname, 'fallback.html');
                if (fs.existsSync(fallbackPath)) {
                    log(`Loading fallback: ${fallbackPath}`);
                    mainWindow.loadFile(fallbackPath);
                }
            }
        });

        let startUrl;
        if (isDev) {
            startUrl = 'http://localhost:3000';
            log(`Loading dev URL: ${startUrl}`);
        } else {
            // Try multiple potential paths for production
            const potentialPaths = [
                path.join(__dirname, '../out/index.html'),
                path.join(__dirname, '../../out/index.html'),
                path.join(app.getAppPath(), 'out/index.html'),
                path.join(process.resourcesPath, 'app.asar/out/index.html')
            ];

            // Find the first path that exists
            startUrl = null;
            for (const htmlPath of potentialPaths) {
                if (fs.existsSync(htmlPath)) {
                    startUrl = `file://${htmlPath}`;
                    log(`Found HTML at: ${htmlPath}`);
                    break;
                } else {
                    log(`HTML not found at: ${htmlPath}`);
                }
            }

            if (!startUrl) {
                // No HTML found - use a default or fallback
                log('No HTML found, using fallback');
                const fallbackPath = path.join(__dirname, 'fallback.html');
                if (fs.existsSync(fallbackPath)) {
                    startUrl = `file://${fallbackPath}`;
                } else {
                    // Create a minimal fallback HTML
                    const tempFallback = path.join(app.getPath('temp'), 'fallback.html');
                    fs.writeFileSync(tempFallback, `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>Error</title>
                        </head>
                        <body>
                            <h1>Failed to load application</h1>
                            <p>The application could not find the required HTML files.</p>
                        </body>
                        </html>
                    `);
                    startUrl = `file://${tempFallback}`;
                }
            }
        }

        log(`Loading URL: ${startUrl}`);
        mainWindow.loadURL(startUrl);

        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    } catch (err) {
        log(`Error creating window: ${err}`);
        app.quit();
    }
}

// Create a simple fallback HTML file
function createFallbackHTML() {
    try {
        const fallbackPath = path.join(__dirname, 'fallback.html');
        if (!fs.existsSync(fallbackPath)) {
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
            log('Created fallback HTML');
        }
    } catch (err) {
        log(`Error creating fallback HTML: ${err}`);
    }
}

// Fix paths in HTML file
function fixHtmlPaths() {
    try {
        const outDir = path.join(__dirname, '../out');
        if (fs.existsSync(outDir)) {
            const indexPath = path.join(outDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                let html = fs.readFileSync(indexPath, 'utf8');

                // Fix paths to be relative rather than absolute
                html = html.replace(/href="\//g, 'href="');
                html = html.replace(/src="\//g, 'src="');

                // Add base tag if missing
                if (html.indexOf('<base') === -1) {
                    html = html.replace('<head>', '<head>\n<base href="./">');
                }

                fs.writeFileSync(indexPath, html);
                log('Fixed HTML paths');
            }
        }
    } catch (err) {
        log(`Error fixing HTML paths: ${err}`);
    }
}

// Add this function near setupICUData
function extractWallpaperBinary() {
    if (process.platform !== 'win32') return; // Only needed on Windows

    log('Setting up wallpaper binary');

    // Get the binary path
    const binPath = getWallpaperBinaryPath();

    if (!binPath) {
        // If binary not found, try to extract it from the package
        try {
            log('Trying to extract wallpaper binary');

            // Try multiple potential source paths
            const sourcePaths = [
                path.join(process.resourcesPath, 'windows-wallpaper.exe'),
                path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
                path.join(app.getAppPath(), 'node_modules', 'wallpaper', 'windows-wallpaper.exe')
            ];

            let sourcePath;
            for (const potentialPath of sourcePaths) {
                if (fs.existsSync(potentialPath)) {
                    sourcePath = potentialPath;
                    log(`Found source binary at: ${sourcePath}`);
                    break;
                }
            }

            if (sourcePath) {
                // Create destination in a location that persists between runs
                const destDir = path.join(app.getPath('userData'), 'bin');
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }

                const destPath = path.join(destDir, 'windows-wallpaper.exe');
                fs.copyFileSync(sourcePath, destPath);

                // Make it executable (important!)
                try {
                    const { execSync } = require('child_process');
                    execSync(`icacls "${destPath}" /grant Everyone:RX`);
                } catch (e) {
                    log(`Failed to set permissions: ${e.message}`);
                }

                log(`Extracted wallpaper binary to: ${destPath}`);

                // Set environment variable for wallpaper module
                process.env.WALLPAPER_BINARY = destPath;
                return;
            } else {
                log('ERROR: Could not find source binary in ANY location');

                // Last-ditch effort: Create our own wallpaper setter
                createEmergencyWallpaperSetter();
            }
        } catch (err) {
            log(`Error extracting wallpaper binary: ${err.message}`);
            createEmergencyWallpaperSetter();
        }
    } else {
        // Set environment variable for wallpaper module
        process.env.WALLPAPER_BINARY = binPath;
    }
}

// Add this fallback function
function createEmergencyWallpaperSetter() {
    if (process.platform !== 'win32') return;

    log('Creating emergency wallpaper setter');

    try {
        // Create a PowerShell script to set wallpaper
        const psScriptDir = path.join(app.getPath('userData'), 'bin');
        if (!fs.existsSync(psScriptDir)) {
            fs.mkdirSync(psScriptDir, { recursive: true });
        }

        const psScriptPath = path.join(psScriptDir, 'set-wallpaper.ps1');

        // PowerShell script content to set wallpaper using .NET
        const psScript = `
param([string]$imagePath)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using Microsoft.Win32;

public class Wallpaper {
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);

    public static void SetWallpaper(string path) {
        SystemParametersInfo(20, 0, path, 0x01 | 0x02);
    }
}
"@

[Wallpaper]::SetWallpaper($imagePath)
`;

        fs.writeFileSync(psScriptPath, psScript);
        log(`Created emergency PowerShell wallpaper script at: ${psScriptPath}`);

        // Set a flag to use this method
        global.useEmergencyWallpaperSetter = true;
        global.emergencyWallpaperScript = psScriptPath;
    } catch (err) {
        log(`Failed to create emergency wallpaper setter: ${err.message}`);
    }
}

// Then update your save-and-set-wallpaper handler to use this function
ipcMain.handle('save-and-set-wallpaper', async (_, wallpaper) => {
    try {
        const wallpaperDir = path.join(os.homedir(), '.wallpaper-app', 'wallpapers');
        if (!fs.existsSync(wallpaperDir)) {
            fs.mkdirSync(wallpaperDir, { recursive: true });
        }

        const matches = wallpaper.dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid data URL format');
        }

        const safeName = wallpaper.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const fileName = `${safeName}-${Date.now()}.${wallpaper.format || 'jpg'}`;
        const filePath = path.join(wallpaperDir, fileName);

        const imageData = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(filePath, imageData);

        try {
            // Use the safe wrapper function
            await safeSetWallpaper(filePath);
        } catch (error) {
            let platformMessage = '';
            if (process.platform === 'linux') {
                platformMessage = 'On some Linux distros, you may need to install a supported desktop environment.';
            } else if (process.platform === 'win32') {
                platformMessage = 'Make sure you have proper permissions to change the wallpaper.';
            }

            return {
                success: false,
                error: `Failed to set wallpaper: ${error.message}. ${platformMessage}`
            };
        }

        return { success: true, filePath };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

ipcMain.handle('get-wallpaper', async () => {
    try {
        const currentWallpaper = await getWallpaper();
        return { success: true, path: currentWallpaper };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

ipcMain.handle('set-wallpaper', async (_, imagePath) => {
    try {
        if (imagePath.startsWith('http')) {
            const response = await fetch(imagePath);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const buffer = Buffer.from(await response.arrayBuffer());

            const wallpaperDir = path.join(os.homedir(), '.wallpaper-app');
            if (!fs.existsSync(wallpaperDir)) {
                fs.mkdirSync(wallpaperDir, { recursive: true });
            }

            const fileName = path.basename(new URL(imagePath).pathname);
            const localPath = path.join(wallpaperDir, fileName);

            fs.writeFileSync(localPath, buffer);

            await setWallpaper(localPath);
        } else {
            await setWallpaper(imagePath);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

ipcMain.handle('save-wallpaper-image', async (_, imageData) => {
    try {
        const wallpaperDir = path.join(os.homedir(), '.wallpaper-app');
        if (!fs.existsSync(wallpaperDir)) {
            fs.mkdirSync(wallpaperDir, { recursive: true });
        }

        const imagePath = path.join(wallpaperDir, imageData.name);
        fs.writeFileSync(imagePath, Buffer.from(imageData.buffer));

        return {
            success: true,
            path: imagePath
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

// Add this function near setupICUData
function extractWallpaperBinary() {
    if (process.platform !== 'win32') return; // Only needed on Windows

    log('Setting up wallpaper binary');

    // Get the binary path
    const binPath = getWallpaperBinaryPath();

    if (!binPath) {
        // If binary not found, try to extract it from the package
        try {
            log('Trying to extract wallpaper binary');

            // Try multiple potential source paths
            const sourcePaths = [
                path.join(process.resourcesPath, 'windows-wallpaper.exe'),
                path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
                path.join(app.getAppPath(), 'node_modules', 'wallpaper', 'windows-wallpaper.exe')
            ];

            let sourcePath;
            for (const potentialPath of sourcePaths) {
                if (fs.existsSync(potentialPath)) {
                    sourcePath = potentialPath;
                    log(`Found source binary at: ${sourcePath}`);
                    break;
                }
            }

            if (sourcePath) {
                // Create destination in a location that persists between runs
                const destDir = path.join(app.getPath('userData'), 'bin');
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }

                const destPath = path.join(destDir, 'windows-wallpaper.exe');
                fs.copyFileSync(sourcePath, destPath);

                // Make it executable (important!)
                try {
                    const { execSync } = require('child_process');
                    execSync(`icacls "${destPath}" /grant Everyone:RX`);
                } catch (e) {
                    log(`Failed to set permissions: ${e.message}`);
                }

                log(`Extracted wallpaper binary to: ${destPath}`);

                // Set environment variable for wallpaper module
                process.env.WALLPAPER_BINARY = destPath;
                return;
            } else {
                log('ERROR: Could not find source binary in ANY location');

                // Last-ditch effort: Create our own wallpaper setter
                createEmergencyWallpaperSetter();
            }
        } catch (err) {
            log(`Error extracting wallpaper binary: ${err.message}`);
            createEmergencyWallpaperSetter();
        }
    } else {
        // Set environment variable for wallpaper module
        process.env.WALLPAPER_BINARY = binPath;
    }
}

// Add this fallback function
function createEmergencyWallpaperSetter() {
    if (process.platform !== 'win32') return;

    log('Creating emergency wallpaper setter');

    try {
        // Create a PowerShell script to set wallpaper
        const psScriptDir = path.join(app.getPath('userData'), 'bin');
        if (!fs.existsSync(psScriptDir)) {
            fs.mkdirSync(psScriptDir, { recursive: true });
        }

        const psScriptPath = path.join(psScriptDir, 'set-wallpaper.ps1');

        // PowerShell script content to set wallpaper using .NET
        const psScript = `
param([string]$imagePath)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using Microsoft.Win32;

public class Wallpaper {
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);

    public static void SetWallpaper(string path) {
        SystemParametersInfo(20, 0, path, 0x01 | 0x02);
    }
}
"@

[Wallpaper]::SetWallpaper($imagePath)
`;

        fs.writeFileSync(psScriptPath, psScript);
        log(`Created emergency PowerShell wallpaper script at: ${psScriptPath}`);

        // Set a flag to use this method
        global.useEmergencyWallpaperSetter = true;
        global.emergencyWallpaperScript = psScriptPath;
    } catch (err) {
        log(`Failed to create emergency wallpaper setter: ${err.message}`);
    }
}

// Modify safeSetWallpaper to use emergency setter if needed
async function safeSetWallpaper(filePath) {
    log(`Attempting to set wallpaper: ${filePath}`);

    // If emergency setter is available, use it first
    if (global.useEmergencyWallpaperSetter && process.platform === 'win32') {
        try {
            log('Using emergency PowerShell wallpaper setter');
            const { execFile } = require('child_process');

            return new Promise((resolve, reject) => {
                execFile('powershell', ['-ExecutionPolicy', 'Bypass', '-File', global.emergencyWallpaperScript, filePath], (error) => {
                    if (error) {
                        log(`Error executing PowerShell setter: ${error}`);
                        // Continue to other methods
                    } else {
                        log('Successfully set wallpaper with PowerShell');
                        return resolve(true);
                    }

                    // Continue with other methods
                    tryOtherWallpaperMethods(filePath).then(resolve).catch(reject);
                });
            });
        } catch (err) {
            log(`Error with emergency setter: ${err}`);
            return tryOtherWallpaperMethods(filePath);
        }
    }

    return tryOtherWallpaperMethods(filePath);
}

async function tryOtherWallpaperMethods(filePath) {
    try {
        // If WALLPAPER_BINARY is set, use it directly
        if (process.env.WALLPAPER_BINARY && process.platform === 'win32') {
            log(`Using custom binary at ${process.env.WALLPAPER_BINARY}`);
            const { execFile } = require('child_process');

            return new Promise((resolve, reject) => {
                execFile(process.env.WALLPAPER_BINARY, [filePath], (error) => {
                    if (error) {
                        log(`Error executing wallpaper binary: ${error}`);
                        reject(error);
                    } else {
                        log('Successfully set wallpaper with binary');
                        resolve(true);
                    }
                });
            });
        }

        // Try with the standard wallpaper module
        log('Trying standard wallpaper module');
        await setWallpaper(filePath);
        log('Successfully set wallpaper using module');
        return true;
    } catch (err) {
        log(`Error with standard wallpaper module: ${err}`);
        throw new Error(`Wallpaper binary not found. ${err.message}`);
    }
}

// Wait for app ready event
app.whenReady().then(() => {
    log('App is ready');
    setupICUData();
    extractWallpaperBinary(); // Add this line
    createFallbackHTML();
    fixHtmlPaths();
    createWindow();
});

app.on('window-all-closed', () => {
    log('All windows closed');
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});