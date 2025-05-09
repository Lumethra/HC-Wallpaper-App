"use client";

import { useState, useEffect } from 'react';
import { Wallpaper } from '@/app/api/wallpapers/route';

export default function WallpaperGallery() {
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWallpapers() {
            try {
                const response = await fetch('/api/wallpapers');

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setWallpapers(data.wallpapers || []);
            } catch (err) {
                console.error("Failed to fetch wallpapers:", err);
                setError("Failed to load wallpapers");
            } finally {
                setLoading(false);
            }
        }

        fetchWallpapers();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading wallpapers...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (wallpapers.length === 0) {
        return <div className="p-8 text-center">No wallpapers found.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {wallpapers.map(wallpaper => (
                <div key={wallpaper.id} className="border rounded-lg overflow-hidden shadow-md">
                    <div className="relative h-48">
                        <img
                            src={wallpaper.path}
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
                            onClick={() => {
                                // We'll use your existing wallpaper utility here
                                if (typeof window !== 'undefined' && window.wallpaperAPI) {
                                    window.wallpaperAPI.setWallpaper(wallpaper.path)
                                        .then(result => {
                                            if (result.success) {
                                                alert('Wallpaper set successfully!');
                                            } else {
                                                alert(`Failed to set wallpaper: ${result.error}`);
                                            }
                                        })
                                        .catch(err => {
                                            alert('Error setting wallpaper');
                                            console.error(err);
                                        });
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
    );
}