const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wallpaperAPI', {
    getCurrentWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
    setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),
    saveWallpaperImage: (imageData) => ipcRenderer.invoke('save-wallpaper-image', imageData),
    saveAndSetWallpaper: (wallpaper) => ipcRenderer.invoke('save-and-set-wallpaper', wallpaper),
    getWallpaperAsBase64: (imagePath) => ipcRenderer.invoke('get-wallpaper-as-base64', imagePath)
});

ipcRenderer.on('wallpaper-update', () => {
    window.dispatchEvent(new Event('wallpaper-changed'));
});