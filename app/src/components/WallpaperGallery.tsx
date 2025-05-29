"use client";

import { useState, useEffect } from 'react';
import { getWallpaperImageUrl } from '@/utils/api-config';

type Wallpaper = {
    id: string;
    name: string;
    path: string;
    format: string;
    size: number;
    displayName?: string;
    artist?: string;
}

export default function WallpaperGallery() {
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deviceType, setDeviceType] = useState('desktop');

    useEffect(() => {
        const isMobile = /iPhone|iPad|Android/.test(navigator.userAgent);
        setDeviceType(isMobile ? 'mobile' : 'desktop');
    }, []);

    // why is this needed to keep vs code quiet, it is working ;(
    type DeviceTypeSwitcherProps = {
        deviceType: string;
        setDeviceType: (type: string) => void;
    };
    // VS code, are you happy now? i just implemented urs 

    // switchi switchi !! device switchi, but it cannot change the hardware sadly 
    // VS code, you just added DeviceTypeSwitcherProps, I don't think, that is necessary, but fine, here it is
    function DeviceTypeSwitcher({ deviceType, setDeviceType }: DeviceTypeSwitcherProps) {
        return (
            <div className="mt-6 p-4 border-t">
                <p className="mb-2 text-sm">Switch wallpaper type:</p>
                <div className="flex space-x-2">
                    <button
                        className={`px-3 py-1 rounded ${deviceType === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setDeviceType('desktop')}
                    >
                        Desktop
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${deviceType === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setDeviceType('mobile')}
                    >
                        Mobile
                    </button>
                </div>
            </div>
        );
    }

    function parseWallpaperName(wallpaper: Wallpaper): Wallpaper {
        const nameWithoutExt = wallpaper.name.replace(/\.[^/.]+$/, "");

        const spaceSeparatedMatch = nameWithoutExt.match(/^(\w+)\s+(.+)$/i);

        if (spaceSeparatedMatch) {
            const artistPart = spaceSeparatedMatch[1];
            const titlePart = spaceSeparatedMatch[2];

            const formattedArtist = artistPart.charAt(0).toUpperCase() + artistPart.slice(1).toLowerCase();
            const formattedName = titlePart.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            return {
                ...wallpaper,
                displayName: formattedName,
                artist: formattedArtist
            };
        } else {
            const underscoreParts = nameWithoutExt.split('_');

            if (underscoreParts.length > 1) {
                const artistPart = underscoreParts[0];
                const titlePart = underscoreParts.slice(1).join('_');

                const formattedArtist = artistPart
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                const formattedName = titlePart
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                return {
                    ...wallpaper,
                    displayName: formattedName,
                    artist: formattedArtist
                };
            } else {
                const formattedName = nameWithoutExt
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                return {
                    ...wallpaper,
                    displayName: formattedName
                };
            }
        }
    }

    useEffect(() => {
        let isActive = true;

        async function getWallpapers() {
            setLoading(true);

            const isApp = window.location.protocol === 'file:';

            const vercelPage = isApp ? 'https://hc-wallpaper-app.vercel.app' : '';

            let response = await fetch(`${vercelPage}/api/wallpapers?deviceType=${deviceType}`).catch(error => {
                console.error("Failed to fetch:", error);
                return null;
            });

            if (!response?.ok && isApp) {
                console.log("API request failed, trying local fallback...");
                response = await fetch('/remote-wallpapers.json').catch(error => {
                    console.error("Failed to fetch fallback:", error);
                    return null;
                });
            }

            if (!response?.ok) {
                if (isActive) {
                    setError("i couldn't load the wallpapers");
                    setLoading(false);
                }
                return;
            }

            const data = await response.json();

            let items = [];
            if (data[deviceType]?.wallpapers) {
                items = data[deviceType].wallpapers;
            } else if (data.wallpapers) {
                items = data.wallpapers;
            }

            const processedItems = items.map(parseWallpaperName);

            /* why are there errors? why is it working like this? urgh, i just let it be, what vs code says should be right */
            processedItems.sort((a: { artist: string; displayName: any; name: any; }, b: { artist: string; displayName: any; name: any; }) => {
                // First i sort by artist name (if it is there, i dare you not to be there)
                const artistA = a.artist || '';
                const artistB = b.artist || '';

                if (artistA !== artistB) {
                    return artistA.localeCompare(artistB);
                }

                // Then sort by displayName as usual
                const displayNameA = a.displayName || a.name;
                const displayNameB = b.displayName || b.name;
                return displayNameA.localeCompare(displayNameB);
            });

            if (isActive) {
                setWallpapers(processedItems);
                setLoading(false);
            }
        }

        getWallpapers();

        return () => {
            isActive = false;
        };
    }, [deviceType]);

    if (loading) return <div className="p-8 text-center">Loading the wallpapers...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!wallpapers.length) return <div className="p-8 text-center">No wallpapers there, congrats, you broke the code.</div>;

    // mobile shit 
    if (deviceType === 'mobile') {
        return (
            <div>
                <div className="mb-4 text-sm text-gray-600">Mobile Wallpapers</div>
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
                                        alt={wallpaper.displayName || wallpaper.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white">
                                    <h3 className="font-medium text-sm truncate text-purple-300">
                                        {wallpaper.displayName || wallpaper.name}
                                    </h3>
                                    <p className="text-xs truncate">
                                        {wallpaper.artist && (
                                            <span className="font-medium text-teal-300">{wallpaper.artist}</span>
                                        )}
                                        {wallpaper.artist && (
                                            <span className="text-indigo-300"> • </span>
                                        )}
                                        <span className="text-amber-300">{Math.round(wallpaper.size / 1024 / 1024 * 10) / 10} MB</span>
                                        <span className="text-indigo-300"> • </span>
                                        <span className="text-pink-300">{wallpaper.format}</span>
                                    </p>

                                    <div className="flex gap-2 mt-2">
                                        <a
                                            href={getWallpaperImageUrl(wallpaper.path)}
                                            download
                                            className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-center hover:bg-blue-600 text-xs"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                { }
                <DeviceTypeSwitcher deviceType={deviceType} setDeviceType={setDeviceType} />
            </div>
        );
    }

    // desktop shit 
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
                                alt={wallpaper.displayName || wallpaper.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4 bg-gray-800">
                            <h3 className="font-medium mb-1 text-purple-300">
                                {wallpaper.displayName || wallpaper.name}
                            </h3>
                            <p className="text-sm">
                                {wallpaper.artist && (
                                    <span className="font-medium text-teal-300">{wallpaper.artist}</span>
                                )}
                                {wallpaper.artist && (
                                    <span className="text-indigo-300"> • </span>
                                )}
                                <span className="text-amber-300">{(wallpaper.size / 1048576).toFixed(2)} MB</span>
                                <span className="text-indigo-300"> • </span>
                                <span className="text-pink-300">{wallpaper.format}</span>
                            </p>
                            <button
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                                onClick={() => handleSetWallpaper(wallpaper)}
                            >
                                Set as Wallpaper
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            { }
            <DeviceTypeSwitcher deviceType={deviceType} setDeviceType={setDeviceType} />
        </div>
    );

    // stoooopp, don't scroll down, fix your own code or do something useful, this is my code, not yours!

    function handleSetWallpaper(wallpaper: Wallpaper) {
        if (!window.wallpaperAPI) {
            alert('DOWNLOAD THE DESKTOP APP!!');
            return;
        }

        const setWallpaper = async () => {
            let response;

            response = await fetch(getWallpaperImageUrl(wallpaper.path));
            if (!response.ok) {
                console.error("Failed to download wallpaper");
                alert('Network problem. Check your connection?');
                return;
            }

            const bobTheBlob = await response.blob();

            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(bobTheBlob);
            });

            const result = await window.wallpaperAPI.saveAndSetWallpaper({
                name: wallpaper.name,
                dataUrl: dataUrl,
                format: wallpaper.format
            });

            if (result.success) {
                alert('Got it! Wallpaper applied.');
            } else if (result.error && !result.error.includes('Please wait before setting')) {
                alert('Hmm, something went wrong: ' + result.error);
            }
        };

        setWallpaper();
    }
}

//fine, you reached the end