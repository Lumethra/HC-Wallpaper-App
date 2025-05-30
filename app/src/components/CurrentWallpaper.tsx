"use client";

import { useState, useEffect, useRef } from 'react';
import { getCurrentWallpaper } from '../utils/wallpaper';

export default function CurrentWallpaper() {
    const [wallpaperPath, setWallpaperPath] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isElectron, setIsElectron] = useState(false);
    const [wallpaperBase64, setWallpaperBase64] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const lastWallpaperRef = useRef('');

    async function fetchWallpaper(forceLoading = false) {
        if (forceLoading) {
            setIsLoading(true);
        }
        setError('');

        try {
            const path = await getCurrentWallpaper();

            if (path && path !== lastWallpaperRef.current) {
                lastWallpaperRef.current = path;
                setWallpaperPath(path);
                setWallpaperBase64('');

                if (typeof window !== 'undefined' && window.wallpaperAPI?.getWallpaperAsBase64) {
                    try {
                        const response = await window.wallpaperAPI.getWallpaperAsBase64(path);
                        if (response?.success && response.dataUrl) {
                            setWallpaperBase64(response.dataUrl);
                        } else {
                            console.warn('Failed to get wallpaper as base64:', response?.error);
                        }
                    } catch (err) {
                        console.error("Failed to get wallpaper as base64:", err);
                    }
                }
            } else if (!path) {
                setWallpaperPath('');
                setWallpaperBase64('');
                lastWallpaperRef.current = '';
            }
        } catch (err) {
            console.error("Error fetching wallpaper:", err);
            setError('Failed to get current wallpaper');
        }

        setIsLoading(false);
    }

    useEffect(() => {
        setIsElectron(typeof window !== 'undefined' && !!window.wallpaperAPI);

        fetchWallpaper(true);

        if (typeof window !== 'undefined') {
            const handleWallpaperChange = () => {
                setRefreshKey(prevKey => prevKey + 1);
            };

            window.addEventListener('wallpaper-changed', handleWallpaperChange);

            const intervalId = setInterval(() => {
                fetchWallpaper(false);
            }, 30000);

            return () => {
                window.removeEventListener('wallpaper-changed', handleWallpaperChange);
                clearInterval(intervalId);
            };
        }
    }, []);

    useEffect(() => {
        if (refreshKey > 0) {
            fetchWallpaper(false);
        }
    }, [refreshKey]);

    if (isLoading && !wallpaperPath) {
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

                    <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                        {wallpaperBase64 ? (
                            <img
                                src={wallpaperBase64}
                                alt="Current wallpaper"
                                className="w-full h-auto max-h-96 object-contain"
                                onError={() => {
                                    console.error("Failed to load wallpaper image");
                                    setWallpaperBase64('');
                                }}
                                onLoad={() => {
                                    console.log("Wallpaper image loaded successfully");
                                }}
                            />
                        ) : (
                            <div className="p-8 text-sm text-gray-500 text-center dark:text-gray-400">
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                                        Loading wallpaper preview...
                                    </div>
                                ) : (
                                    `Preview not available. ${isElectron ? "Image may be inaccessible." : "Try the desktop app."}`
                                )}
                            </div>
                        )}
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