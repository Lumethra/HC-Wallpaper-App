export function getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
        if (window.location.protocol === 'file:') {
            return 'https://hc-wallpaper-app.vercel.app';
        }
        return '';
    }

    return '';
}

export function getWallpaperApiUrl(deviceType: string): string {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/wallpapers?deviceType=${deviceType}`;
}

export function getWallpaperImageUrl(path: string): string {
    if (path.startsWith('http')) {
        return path;
    }

    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${path}`;
}