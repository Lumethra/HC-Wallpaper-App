const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('wallpaperAPI', {
    getCurrentWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
    setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),
    saveWallpaperImage: (imageData) => ipcRenderer.invoke('save-wallpaper-image', imageData)
});