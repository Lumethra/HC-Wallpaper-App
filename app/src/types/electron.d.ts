export interface WallpaperAPIResponse {
    success: boolean;
    path?: string;
    error?: string;
    filePath?: string;
    dataUrl?: string;
}

declare global {
    interface Window {
        wallpaperAPI: {
            getCurrentWallpaper: () => Promise<WallpaperAPIResponse>;
            setWallpaper: (imagePath: string) => Promise<WallpaperAPIResponse>;
            saveWallpaperImage: (imageData: {
                buffer: ArrayBuffer;
                name: string;
            }) => Promise<WallpaperAPIResponse>;
            saveAndSetWallpaper: (wallpaper: {
                name: string;
                dataUrl: string;
                format?: string;
            }) => Promise<WallpaperAPIResponse>;
            getWallpaperAsBase64: (imagePath: string) => Promise<WallpaperAPIResponse>;
        }
    }
}

export { };