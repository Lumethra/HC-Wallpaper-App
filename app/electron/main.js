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
            icon: path.join(__dirname, '../public/icons/Abhay-App-Icon.jpg'),
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

    const binPath = getWallpaperBinaryPath();

    if (!binPath) {
        try {
            const sourcePaths = [
                path.join(process.resourcesPath, 'windows-wallpaper.exe'),
                path.join(__dirname, '..', 'node_modules', 'wallpaper', 'windows-wallpaper.exe'),
                path.join(app.getAppPath(), 'node_modules', 'wallpaper', 'windows-wallpaper.exe')
            ];

            let sourcePath;
            for (const potentialPath of sourcePaths) {
                if (fs.existsSync(potentialPath)) {
                    sourcePath = potentialPath;
                    break;
                }
            }

            if (sourcePath) {
                const destDir = path.join(app.getPath('userData'), 'bin');
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }

                const destPath = path.join(destDir, 'windows-wallpaper.exe');
                fs.copyFileSync(sourcePath, destPath);

                try {
                    const { execSync } = require('child_process');
                    execSync(`icacls "${destPath}" /grant Everyone:RX`);
                } catch (e) { }

                process.env.WALLPAPER_BINARY = destPath;
                return;
            } else {
                createEmergencyWallpaperSetter();
            }
        } catch (err) {
            createEmergencyWallpaperSetter();
        }
    } else {
        process.env.WALLPAPER_BINARY = binPath;
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

ipcMain.handle('save-and-set-wallpaper', async (_, wallpaper) => {
    try {
        const wallpaperDir = path.join(os.homedir(), '.HC-Wallpaper-App');
        if (!fs.existsSync(wallpaperDir)) {
            fs.mkdirSync(wallpaperDir, { recursive: true });
        }

        let currentWallpaper = '';
        try {
            currentWallpaper = await getWallpaper();
        } catch (err) {
            // Continue 
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
            await safeSetWallpaper(filePath);

            if (currentWallpaper &&
                currentWallpaper !== filePath) {

                const wallpaperBaseDir = path.join(os.homedir(), '.HC-Wallpaper-App');

                const normalizedCurrent = path.normalize(currentWallpaper);
                const normalizedBase = path.normalize(wallpaperBaseDir);

                if (normalizedCurrent.startsWith(normalizedBase)) {
                    try {
                        if (fs.existsSync(currentWallpaper)) {
                            fs.unlinkSync(currentWallpaper);
                        }
                    } catch (cleanupErr) {
                        // Ignore 
                    }
                }
            }
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
        let currentWallpaper = '';
        try {
            currentWallpaper = await getWallpaper();
        } catch (err) {
            // Continue
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

        await setWallpaper(localPath);

        if (currentWallpaper &&
            currentWallpaper !== localPath) {

            const wallpaperBaseDir = path.join(os.homedir(), '.HC-Wallpaper-App');

            const normalizedCurrent = path.normalize(currentWallpaper);
            const normalizedBase = path.normalize(wallpaperBaseDir);

            if (normalizedCurrent.startsWith(normalizedBase)) {
                try {
                    if (fs.existsSync(currentWallpaper)) {
                        fs.unlinkSync(currentWallpaper);
                    }
                } catch (cleanupErr) {
                    // Ignore 
                }
            }
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
        if (process.platform === 'darwin') {
            console.log('Using macOS wallpaper method with path:', filePath);

            try {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found: ${filePath}`);
                }

                const wallpaperModule = require('wallpaper');
                await wallpaperModule.set(filePath);
                console.log('Successfully set wallpaper on macOS');
            } catch (err) {
                console.error('Error in macOS wallpaper method:', err.message);
                const { execFile } = require('child_process');
                return new Promise((resolve, reject) => {
                    const script = `
                        tell application "System Events"
                            tell every desktop
                                set picture to "${filePath}"
                            end tell
                        end tell
                    `;
                    execFile('osascript', ['-e', script], (error) => {
                        if (error) {
                            console.error('AppleScript fallback error:', error);
                            reject(error);
                        } else {
                            console.log('Successfully set wallpaper using AppleScript');
                            resolve(true);
                        }
                    });
                });
            }
            return true;
        }

        if (process.env.WALLPAPER_BINARY && process.platform === 'win32') {
            const { execFile } = require('child_process');

            return new Promise((resolve, reject) => {
                execFile(process.env.WALLPAPER_BINARY, [filePath], (error) => {
                    if (error) {
                        setWallpaper(filePath).then(() => resolve(true)).catch(reject);
                    } else {
                        resolve(true);
                    }
                });
            });
        }

        await setWallpaper(filePath);
        return true;
    } catch (err) {
        console.error('Wallpaper setting error:', err);
        throw new Error(`Failed to set wallpaper: ${err.message}`);
    }
}

app.whenReady().then(() => {
    setupICUData();
    extractWallpaperBinary();
    createFallbackHTML();
    fixHtmlPaths();
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});