// Create this file at: /app/src/components/CurrentWallpaper.tsx
"use client";

import { useState, useEffect } from 'react';
import { getCurrentWallpaper } from '../utils/wallpaper';

export default function CurrentWallpaper() {
    const [wallpaperPath, setWallpaperPath] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        async function fetchWallpaper() {
            try {
                setIsLoading(true);
                const path = await getCurrentWallpaper();
                setWallpaperPath(path);
                setError('');
            } catch (err) {
                setError('Failed to get current wallpaper');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWallpaper();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-center">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-6 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Current Wallpaper</h2>

            {wallpaperPath ? (
                <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 break-all">
                        {wallpaperPath}
                    </p>

                    <div className="border rounded-lg overflow-hidden">
                        {/* Note: file:// protocol won't work in browser but will in Electron */}
                        <img
                            src={`file://${wallpaperPath}`}
                            alt="Current wallpaper"
                            className="w-full h-auto"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const errorMsg = document.getElementById('img-error');
                                if (errorMsg) errorMsg.style.display = 'block';
                            }}
                        />
                        <div
                            id="img-error"
                            className="hidden p-4 text-sm text-gray-500 text-center dark:text-gray-400"
                        >
                            Preview not available in browser. Try the desktop app.
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-4 text-gray-500 text-center border rounded-lg dark:text-gray-400">
                    No wallpaper information available
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900">
                    {error}
                </div>
            )}
        </div>
    );
}