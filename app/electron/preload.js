const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wallpaperAPI', {
    getCurrentWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
    setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),
    saveWallpaperImage: (imageData) => ipcRenderer.invoke('save-wallpaper-image', imageData),
    saveAndSetWallpaper: (wallpaper) => ipcRenderer.invoke('save-and-set-wallpaper', wallpaper)
});