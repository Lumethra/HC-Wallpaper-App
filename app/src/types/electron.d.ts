export interface WallpaperAPIResponse {
    success: boolean;
    path?: string;
    error?: string;
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
        }
    }
}

export { };