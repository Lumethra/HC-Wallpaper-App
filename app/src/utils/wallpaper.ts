// Complete utility functions for wallpaper operations

export interface WallpaperResult {
    success: boolean;
    message: string;
    path?: string;
}

/**
 * Gets the current wallpaper path
 */
export async function getCurrentWallpaper(): Promise<string> {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.wallpaperAPI) {
        try {
            const result = await window.wallpaperAPI.getCurrentWallpaper();
            if (result.success) {
                return result.path || '';
            } else {
                console.error('Error getting wallpaper:', result.error);
                return '';
            }
        } catch (error) {
            console.error('Error getting wallpaper:', error);
            return '';
        }
    }

    // Fallback for web browser
    return '';
}

/**
 * Sets a new wallpaper from a file path
 */
export async function setWallpaper(imagePath: string): Promise<WallpaperResult> {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.wallpaperAPI) {
        try {
            const result = await window.wallpaperAPI.setWallpaper(imagePath);
            return {
                success: result.success,
                message: result.success ? 'Wallpaper set successfully!' : (result.error || 'Failed to set wallpaper'),
                path: imagePath
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, message };
        }
    }

    return {
        success: false,
        message: 'Setting wallpaper is only available in the desktop app'
    };
}

/**
 * Uploads and sets a new wallpaper from a File object
 */
export async function uploadAndSetWallpaper(file: File): Promise<WallpaperResult> {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.wallpaperAPI) {
        try {
            // Convert file to array buffer for IPC transfer
            const arrayBuffer = await file.arrayBuffer();

            // First save the file
            const saveResult = await window.wallpaperAPI.saveWallpaperImage({
                buffer: arrayBuffer,
                name: file.name,
            });

            if (!saveResult.success) {
                return {
                    success: false,
                    message: saveResult.error || 'Failed to save image'
                };
            }

            // Then set it as wallpaper
            const setResult = await window.wallpaperAPI.setWallpaper(saveResult.path!);

            return {
                success: setResult.success,
                message: setResult.success ? 'Wallpaper set successfully!' : (setResult.error || 'Failed to set wallpaper'),
                path: saveResult.path
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, message };
        }
    }

    return {
        success: false,
        message: 'This feature requires the desktop app'
    };
}