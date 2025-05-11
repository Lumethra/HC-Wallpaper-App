/**
 * Utility for API configuration and environment detection
 */

/**
 * Get the base API URL based on environment
 */
export function getApiBaseUrl(): string {
    // In browser/Electron: detect environment
    if (typeof window !== 'undefined') {
        if (window.location.protocol === 'file:') {
            // In Electron production, use Vercel
            return 'https://hc-wallpaper-app.vercel.app';
        }
        // In development, use relative URL
        return '';
    }

    // Server-side: empty for relative URLs
    return '';
}

/**
 * Get the API endpoint for wallpapers
 */
export function getWallpaperApiUrl(deviceType: string): string {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/wallpapers?deviceType=${deviceType}`;
}

/**
 * Convert relative paths to absolute when needed
 */
export function getWallpaperImageUrl(path: string): string {
    // If already absolute, return as-is
    if (path.startsWith('http')) {
        return path;
    }

    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${path}`;
}