const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('wallpaperAPI', {
    getCurrentWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
    setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),
    saveWallpaperImage: (imageData) => ipcRenderer.invoke('save-wallpaper-image', imageData),
    // Make sure this line exists and matches your type definition
    saveAndSetWallpaper: (wallpaper) => ipcRenderer.invoke('save-and-set-wallpaper', wallpaper)
});