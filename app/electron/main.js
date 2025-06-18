const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

app.commandLine.appendSwitch('no-icu-data-error-log');
app.commandLine.appendSwitch('lang', 'en-US');

function setupICUData() {
    if (app.isPackaged) {
        const possibleIcuPaths = [
            path.join(process.resourcesPath, 'icudtl.dat'),
            path.join(__dirname, '..', '..', 'icudtl.dat'),
            path.join(app.getAppPath(), '..', 'icudtl.dat'),
            path.join(process.execPath, '..', 'icudtl.dat'),
            'D:\\coding\\github\\HackClub\\HC-Wallpaper-App\\app\\dist\\win-unpacked\\resources\\icudtl.dat',
            'D:\\coding\\github\\HackClub\\HC-Wallpaper-App\\app\\dist\\win-unpacked\\icudtl.dat',
            'D:\\coding\\github\\HackClub\\HC-Wallpaper-App\\app\\node_modules\\electron\\dist\\icudtl.dat'
        ];

        for (const icuPath of possibleIcuPaths) {
            try {
                if (fs.existsSync(icuPath)) {
                    app.commandLine.appendSwitch('icu-data-file', icuPath);
                    break;
                }
            } catch (err) { }
        }

        const binPath = getWallpaperBinaryPath();
        if (binPath) {
            process.env.WALLPAPER_BINARY = binPath;
        }
    }
}

const isDev = !app.isPackaged;
const { getWallpaper, setWallpaper } = require('wallpaper');

function getWallpaperBinaryPath() {
    const possiblePaths = [
        path.join(process.resourcesPath, 'windows-wallpaper.exe'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
        path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
        path.join(app.getAppPath(), 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
        path.join(path.dirname(process.execPath), 'windows-wallpaper.exe'),
        path.join(process.cwd(), 'windows-wallpaper.exe')
    ];

    for (const binPath of possiblePaths) {
        try {
            if (fs.existsSync(binPath)) {
                try {
                    fs.accessSync(binPath, fs.constants.X_OK);
                } catch (e) {
                    try {
                        const { execSync } = require('child_process');
                        execSync(`icacls "${binPath}" /grant Everyone:RX`);
                    } catch (e) { }
                }
                return binPath;
            }
        } catch (err) { }
    }
    return null;
}

let mainWindow;

function createWindow() {
    try {
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, '../public/icons/formatted-icons/icon-256x256.png'),
            show: false
        });

        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });

        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            if (!isDev) {
                const fallbackPath = path.join(__dirname, 'fallback.html');
                if (fs.existsSync(fallbackPath)) {
                    mainWindow.loadFile(fallbackPath);
                }
            }
        });

        let startUrl;
        if (isDev) {
            startUrl = 'http://localhost:3000';
        } else {
            const potentialPaths = [
                path.join(__dirname, '../out/index.html'),
                path.join(__dirname, '../../out/index.html'),
                path.join(app.getAppPath(), 'out/index.html'),
                path.join(process.resourcesPath, 'app.asar/out/index.html')
            ];

            startUrl = null;
            for (const htmlPath of potentialPaths) {
                if (fs.existsSync(htmlPath)) {
                    startUrl = `file://${htmlPath}`;
                    break;
                }
            }

            if (!startUrl) {
                const fallbackPath = path.join(__dirname, 'fallback.html');
                if (fs.existsSync(fallbackPath)) {
                    startUrl = `file://${fallbackPath}`;
                } else {
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

        mainWindow.loadURL(startUrl);

        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    } catch (err) {
        app.quit();
    }
}

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
        }
    } catch (err) { }
}

function fixHtmlPaths() {
    try {
        const outDir = path.join(__dirname, '../out');
        if (fs.existsSync(outDir)) {
            const indexPath = path.join(outDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                let html = fs.readFileSync(indexPath, 'utf8');
                html = html.replace(/href="\//g, 'href="');
                html = html.replace(/src="\//g, 'src="');
                if (html.indexOf('<base') === -1) {
                    html = html.replace('<head>', '<head>\n<base href="./">');
                }
                fs.writeFileSync(indexPath, html);
            }
        }
    } catch (err) { }
}

function extractWallpaperBinary() {
    if (process.platform !== 'win32') return;

    try {
        // Check multiple potential locations for the binary
        const sourcePaths = [
            path.join(process.resourcesPath, 'windows-wallpaper.exe'),
            path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
            path.join(__dirname, '..', 'windows-wallpaper.exe'),
            path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
            path.join(app.getAppPath(), 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
            path.join(path.dirname(process.execPath), 'windows-wallpaper.exe'),
            path.join(process.cwd(), 'windows-wallpaper.exe'),
            path.join(__dirname, 'windows-wallpaper.exe')
        ];

        // Log all potential paths for debugging
        console.log('Checking for wallpaper binary in the following paths:');
        sourcePaths.forEach(p => console.log(`- ${p} (exists: ${fs.existsSync(p)})`));

        let sourcePath;
        for (const potentialPath of sourcePaths) {
            if (fs.existsSync(potentialPath)) {
                sourcePath = potentialPath;
                break;
            }
        }

        if (sourcePath) {
            console.log(`Found wallpaper binary at: ${sourcePath}`);
            process.env.WALLPAPER_BINARY = sourcePath;
            return;
        }

        // If no binary found, create emergency setter script
        console.log('No wallpaper binary found, creating emergency setter');
        createEmergencyWallpaperSetter();
    } catch (err) {
        console.error('Error extracting wallpaper binary:', err);
        createEmergencyWallpaperSetter();
    }
}

function createEmergencyWallpaperSetter() {
    if (process.platform !== 'win32') return;

    try {
        const psScriptDir = path.join(app.getPath('userData'), 'bin');
        if (!fs.existsSync(psScriptDir)) {
            fs.mkdirSync(psScriptDir, { recursive: true });
        }

        const psScriptPath = path.join(psScriptDir, 'set-wallpaper.ps1');

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
        global.useEmergencyWallpaperSetter = true;
        global.emergencyWallpaperScript = psScriptPath;
    } catch (err) { }
}

let lastWallpaperSetTimestamp = 0;
const WALLPAPER_SET_COOLDOWN = 500;

ipcMain.handle('save-and-set-wallpaper', async (_, wallpaper) => {
    const now = Date.now();
    if (now - lastWallpaperSetTimestamp < WALLPAPER_SET_COOLDOWN) {
        return {
            success: false,
            error: 'Please wait before setting another wallpaper'
        };
    }
    lastWallpaperSetTimestamp = now;

    const wallpaperDir = path.join(os.homedir(), '.HC-Wallpaper-App');
    if (!fs.existsSync(wallpaperDir)) {
        fs.mkdirSync(wallpaperDir, { recursive: true });
    }

    const matches = wallpaper.dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
        return {
            success: false,
            error: 'Invalid data URL format'
        };
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
        await safeSetWallpaper(filePath);

        await cleanupOldWallpapers(filePath);

        mainWindow.webContents.send('wallpaper-update');
        return { success: true, filePath };
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
        let currentWallpaper = '';
        try {
            currentWallpaper = await getWallpaper();
        } catch (err) {
            console.warn('Could not get current wallpaper:', err);
        }

        let localPath = imagePath;
        if (imagePath.startsWith('http')) {
            const response = await fetch(imagePath);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const buffer = Buffer.from(await response.arrayBuffer());

            const wallpaperDir = path.join(os.homedir(), '.HC-Wallpaper-App');
            if (!fs.existsSync(wallpaperDir)) {
                fs.mkdirSync(wallpaperDir, { recursive: true });
            }

            const fileName = path.basename(new URL(imagePath).pathname);
            localPath = path.join(wallpaperDir, fileName);

            fs.writeFileSync(localPath, buffer);
        }

        await safeSetWallpaper(localPath);

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wallpaper-update');
        }

        await cleanupOldWallpapers(localPath);

        return { success: true };
    } catch (error) {
        console.error('Error setting wallpaper:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

ipcMain.handle('save-wallpaper-image', async (_, imageData) => {
    try {
        const wallpaperDir = path.join(os.homedir(), '.HC-Wallpaper-App');
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

ipcMain.handle('get-wallpaper-as-base64', async (_, imagePath) => {
    try {
        if (!imagePath || !fs.existsSync(imagePath)) {
            return { success: false, error: 'File not found' };
        }

        const stats = fs.statSync(imagePath);
        const maxSize = 50 * 1024 * 1024;

        if (stats.size > maxSize) {
            return { success: false, error: 'File too large for preview' };
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const extension = path.extname(imagePath).toLowerCase().substring(1);
        const mimeType = getTypeFromExtension(extension);

        if (!mimeType) {
            return { success: false, error: 'Unsupported image format' };
        }

        const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        return { success: true, dataUrl };
    } catch (error) {
        console.error('Error converting image to base64:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load image'
        };
    }
});

function getTypeFromExtension(extension) {
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
    };
    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

async function safeSetWallpaper(filePath) {
    if (global.useEmergencyWallpaperSetter && process.platform === 'win32') {
        try {
            const { execFile } = require('child_process');

            return new Promise((resolve, reject) => {
                execFile('powershell', ['-ExecutionPolicy', 'Bypass', '-File', global.emergencyWallpaperScript, filePath], (error) => {
                    if (error) {
                        tryOtherWallpaperMethods(filePath).then(resolve).catch(reject);
                    } else {
                        resolve(true);
                    }
                });
            });
        } catch (err) {
            return tryOtherWallpaperMethods(filePath);
        }
    }

    return tryOtherWallpaperMethods(filePath);
}

async function tryOtherWallpaperMethods(filePath) {
    try {
        // Log additional diagnostic information
        console.log('Setting wallpaper with path:', filePath);
        console.log('Platform:', process.platform);
        console.log('WALLPAPER_BINARY path:', process.env.WALLPAPER_BINARY);

        if (process.platform === 'win32') {
            // For Windows, try multiple methods in sequence
            try {
                // First attempt - direct wallpaper module
                await setWallpaper(filePath);
                return true;
            } catch (err) {
                console.log('Standard wallpaper module failed:', err.message);

                // Second attempt - use binary if available
                if (process.env.WALLPAPER_BINARY) {
                    try {
                        const { execFile } = require('child_process');

                        await new Promise((resolve, reject) => {
                            console.log('Trying with binary:', process.env.WALLPAPER_BINARY);
                            execFile(process.env.WALLPAPER_BINARY, [filePath], (error) => {
                                if (error) {
                                    console.error('Binary execution failed:', error);
                                    reject(error);
                                } else {
                                    console.log('Binary execution succeeded');
                                    resolve();
                                }
                            });
                        });
                        return true;
                    } catch (binaryErr) {
                        console.error('Binary method failed:', binaryErr);

                        // Third attempt - PowerShell method
                        if (global.useEmergencyWallpaperSetter && global.emergencyWallpaperScript) {
                            const { execFile } = require('child_process');

                            await new Promise((resolve, reject) => {
                                console.log('Trying emergency PowerShell method');
                                execFile('powershell', ['-ExecutionPolicy', 'Bypass', '-File', global.emergencyWallpaperScript, filePath], (error) => {
                                    if (error) {
                                        console.error('PowerShell method failed:', error);
                                        reject(error);
                                    } else {
                                        console.log('PowerShell method succeeded');
                                        resolve();
                                    }
                                });
                            });
                            return true;
                        }

                        throw binaryErr;
                    }
                }
                throw err;
            }
        } else if (process.platform === 'darwin') {
            // For macOS, use AppleScript directly
            console.log('Using macOS AppleScript method');
            const { execFile } = require('child_process');
            return new Promise((resolve, reject) => {
                const escapedPath = filePath.replace(/"/g, '\\"');
                const script = `tell application "System Events" to tell every desktop to set picture to "${escapedPath}"`;

                execFile('osascript', ['-e', script], (error) => {
                    if (error) {
                        console.error('AppleScript error:', error);
                        setWallpaper(filePath).then(resolve).catch(reject);
                    } else {
                        console.log('Successfully set wallpaper using AppleScript');
                        resolve(true);
                    }
                });
            });
        } else {
            // Linux or other platforms
            await setWallpaper(filePath);
            return true;
        }
    } catch (err) {
        console.error('All wallpaper setting methods failed:', err);
        throw new Error(`Failed to set wallpaper: ${err.message}`);
    }
}

async function cleanupWallpapers() {
    try {
        let currentWallpaper = '';
        try {
            currentWallpaper = await getWallpaper();
        } catch (err) {
            console.error('Could not get current wallpaper for cleanup:', err);
        }

        const wallpaperDir = path.join(os.homedir(), '.HC-Wallpaper-App');
        if (!fs.existsSync(wallpaperDir)) {
            return;
        }

        const files = fs.readdirSync(wallpaperDir);
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);

        console.log('🧹 Periodic cleanup: removing files older than 7 days');

        for (const file of files) {
            const filePath = path.join(wallpaperDir, file);

            if (currentWallpaper && path.normalize(filePath) === path.normalize(currentWallpaper)) {
                continue;
            }

            try {
                const stats = fs.statSync(filePath);

                if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Cleaned up very old file: ${file}`);
                }
            } catch (err) {
                console.error(`❌ Error cleaning up file ${file}:`, err);
            }
        }
    } catch (err) {
        console.error('❌ Error during periodic cleanup:', err);
    }
}

async function cleanupOldWallpapers(currentWallpaperPath) {
    try {
        const wallpaperDir = path.join(os.homedir(), '.HC-Wallpaper-App');
        if (!fs.existsSync(wallpaperDir)) {
            return;
        }

        const files = fs.readdirSync(wallpaperDir);
        const normalizedCurrent = path.normalize(currentWallpaperPath);

        console.log(`🧹 Cleaning up old wallpapers, keeping: ${path.basename(currentWallpaperPath)}`);

        for (const file of files) {
            const filePath = path.join(wallpaperDir, file);
            const normalizedFile = path.normalize(filePath);

            if (normalizedFile === normalizedCurrent) {
                continue;
            }

            try {
                const stats = fs.statSync(filePath);

                const ext = path.extname(file).toLowerCase();
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

                if (stats.isFile() && imageExtensions.includes(ext)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Deleted old wallpaper: ${file}`);
                }
            } catch (err) {
                console.error(`❌ Error deleting file ${file}:`, err);
            }
        }
    } catch (err) {
        console.error('❌ Error during old wallpaper cleanup:', err);
    }
}

app.whenReady().then(() => {
    setupICUData();
    extractWallpaperBinary();
    createFallbackHTML();
    fixHtmlPaths();
    createWindow();
    cleanupWallpapers();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});