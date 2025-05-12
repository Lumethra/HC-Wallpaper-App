"use client";

import { useState, useEffect } from 'react';
import { Wallpaper } from '@/app/api/wallpapers/route';
import { getWallpaperImageUrl } from '@/utils/api-config';

export default function WallpaperGallery() {
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

    useEffect(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent);

        setDeviceType(isMobile ? 'mobile' : 'desktop');
    }, []);

    useEffect(() => {
        async function fetchWallpapers() {
            setLoading(true);
            try {
                let data;

                const isElectronProduction =
                    typeof window !== 'undefined' &&
                    window.location.protocol === 'file:';

                if (isElectronProduction) {
                    try {
                        const vercelResponse = await fetch(
                            `https://hc-wallpaper-app.vercel.app/api/wallpapers?deviceType=${deviceType}`
                        );

                        if (vercelResponse.ok) {
                            data = await vercelResponse.json();
                        } else {
                            const staticResponse = await fetch('/remote-wallpapers.json');
                            if (staticResponse.ok) {
                                data = await staticResponse.json();
                            } else {
                                throw new Error('Failed to fetch wallpapers from static data');
                            }
                        }
                    } catch (err) {
                        throw err;
                    }
                } else {
                    const response = await fetch(`/api/wallpapers?deviceType=${deviceType}`);

                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }

                    data = await response.json();
                }

                let wallpaperData = [];
                if (data && data[deviceType]?.wallpapers) {
                    wallpaperData = data[deviceType].wallpapers;
                } else if (data && data.wallpapers) {
                    wallpaperData = data.wallpapers;
                }

                wallpaperData.sort((a: Wallpaper, b: Wallpaper) => a.name.localeCompare(b.name));
                setWallpapers(wallpaperData);
            } catch (err) {
                setError("Failed to load wallpapers");
            } finally {
                setLoading(false);
            }
        }

        fetchWallpapers();
    }, [deviceType]);

    if (loading) {
        return <div className="p-8 text-center">Loading wallpapers...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (wallpapers.length === 0) {
        return <div className="p-8 text-center">No wallpapers found for {deviceType} devices.</div>;
    }

    // Mobile wallpapers
    if (deviceType === 'mobile') {
        return (
            <div>
                <div className="mb-4 text-sm text-gray-600">
                    Mobile Wallpapers
                </div>
                <div className="flex flex-wrap px-2">
                    {wallpapers.map(wallpaper => (
                        <div
                            key={wallpaper.id}
                            className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 p-1.5 relative"
                        >
                            <div className="border rounded-lg overflow-hidden shadow-md h-full relative">
                                <div className="w-full aspect-[9/16] overflow-hidden">
                                    <img
                                        src={getWallpaperImageUrl(wallpaper.path)}
                                        alt={wallpaper.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-2 text-white">
                                    <h3 className="font-medium text-sm truncate">{wallpaper.name}</h3>
                                    <p className="text-xs text-gray-300">
                                        {(wallpaper.size / (1024 * 1024)).toFixed(1)} MB
                                    </p>

                                    <div className="flex gap-2 mt-2">
                                        <a
                                            href={getWallpaperImageUrl(wallpaper.path)}
                                            download
                                            className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-center hover:bg-blue-600 text-xs"
                                        >
                                            Download
                                        </a>
                                        <button
                                            className="flex-1 px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs"
                                            onClick={() => {
                                                alert('To set as wallpaper: download the image, then use your device settings to set it as wallpaper.');
                                            }}
                                        >
                                            Info
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 border-t">
                    <p className="mb-2 text-sm">For testing: Switch device type</p>
                    <div className="flex space-x-2">
                        <button
                            className={`px-3 py-1 rounded ${deviceType === ('desktop' as string) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                            onClick={() => setDeviceType('desktop')}
                        >
                            Desktop
                        </button>
                        <button
                            className={`px-3 py-1 rounded ${deviceType === ('mobile' as string) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                            onClick={() => setDeviceType('mobile')}
                        >
                            Mobile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop wallpapers
    return (
        <div>
            <div className="mb-4 text-sm text-gray-600">
                Showing wallpapers for {deviceType} devices
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {wallpapers.map(wallpaper => (
                    <div key={wallpaper.id} className="border rounded-lg overflow-hidden shadow-md">
                        <div className="relative h-48">
                            <img
                                src={getWallpaperImageUrl(wallpaper.path)}
                                alt={wallpaper.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-medium">{wallpaper.name}</h3>
                            <p className="text-sm text-gray-500">
                                {(wallpaper.size / (1024 * 1024)).toFixed(2)} MB • {wallpaper.format}
                            </p>
                            <button
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                                onClick={async () => {
                                    if (typeof window !== 'undefined' && window.wallpaperAPI) {
                                        try {
                                            const response = await fetch(getWallpaperImageUrl(wallpaper.path));
                                            if (!response.ok) {
                                                throw new Error(`Failed to fetch image: ${response.status}`);
                                            }

                                            const blob = await response.blob();

                                            const reader = new FileReader();
                                            reader.readAsDataURL(blob);

                                            reader.onloadend = async () => {
                                                const base64data = reader.result as string;

                                                try {
                                                    const result = await window.wallpaperAPI.saveAndSetWallpaper({
                                                        name: wallpaper.name,
                                                        dataUrl: base64data,
                                                        format: wallpaper.format
                                                    });

                                                    if (result.success) {
                                                        alert('Wallpaper set successfully!');
                                                    } else {
                                                        alert(`Failed to set wallpaper: ${result.error}`);
                                                    }
                                                } catch (err) {
                                                    alert('Error saving or setting wallpaper');
                                                }
                                            };
                                        } catch (err) {
                                            alert(`Error downloading wallpaper: ${err instanceof Error ? err.message : 'Unknown error'}`);
                                        }
                                    } else {
                                        alert('This feature is only available in the desktop app');
                                    }
                                }}
                            >
                                Set as Wallpaper
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 border-t">
                <p className="mb-2 text-sm">For testing: Switch device type</p>
                <div className="flex space-x-2">
                    <button
                        className={`px-3 py-1 rounded ${deviceType === ('desktop' as string) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setDeviceType('desktop')}
                    >
                        Desktop
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${deviceType === ('mobile' as string) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setDeviceType('mobile')}
                    >
                        Mobile
                    </button>
                </div>
            </div>
        </div>
    );
}