const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const isDev = require('electron-is-dev');
const { getWallpaper, setWallpaper } = require('wallpaper');

let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../out/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle getting current wallpaper
ipcMain.handle('get-wallpaper', async () => {
    try {
        const currentWallpaper = await getWallpaper();
        return { success: true, path: currentWallpaper };
    } catch (error) {
        console.error('Error getting wallpaper:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

// Handle setting wallpaper
ipcMain.handle('set-wallpaper', async (_, imagePath) => {
    try {
        // Check if this is a remote URL (from Vercel)
        if (imagePath.startsWith('http')) {
            // We need to download the file first
            const response = await fetch(imagePath);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const buffer = Buffer.from(await response.arrayBuffer());

            // Save to temporary location
            const wallpaperDir = path.join(os.homedir(), '.wallpaper-app');
            if (!fs.existsSync(wallpaperDir)) {
                fs.mkdirSync(wallpaperDir, { recursive: true });
            }

            // Extract filename from URL
            const fileName = path.basename(new URL(imagePath).pathname);
            const localPath = path.join(wallpaperDir, fileName);

            // Save the downloaded file
            fs.writeFileSync(localPath, buffer);

            // Now set this local file as wallpaper
            await setWallpaper(localPath);
        } else {
            // It's already a local path, just set it
            await setWallpaper(imagePath);
        }

        return { success: true };
    } catch (error) {
        console.error('Error setting wallpaper:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

// Save image from input
ipcMain.handle('save-wallpaper-image', async (_, imageData) => {
    try {
        // Create directory if it doesn't exist
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
        console.error('Error saving image:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});

// Handle saving and setting wallpaper
ipcMain.handle('save-and-set-wallpaper', async (_, wallpaper) => {
    try {
        // Create directory for wallpapers if it doesn't exist
        const wallpaperDir = path.join(os.homedir(), '.wallpaper-app', 'wallpapers');
        if (!fs.existsSync(wallpaperDir)) {
            fs.mkdirSync(wallpaperDir, { recursive: true });
        }

        // Handle data URL
        const matches = wallpaper.dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid data URL format');
        }

        // Create a file name (sanitize the name)
        const safeName = wallpaper.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const fileName = `${safeName}-${Date.now()}.${wallpaper.format || 'jpg'}`;
        const filePath = path.join(wallpaperDir, fileName);

        // Save the image file
        const imageData = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(filePath, imageData);

        // Set as wallpaper
        await setWallpaper(filePath);

        return { success: true, filePath };
    } catch (error) {
        console.error('Error saving or setting wallpaper:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
});