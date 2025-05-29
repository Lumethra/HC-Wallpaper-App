'use client';

import { useState, useEffect, useRef } from 'react';
import { getWallpaperApiUrl, getWallpaperImageUrl } from '@/utils/api-config';

type Wallpaper = {
    id: string;
    name: string;
    path: string;
    format: string;
}

export default function RotateWallpaper() {
    const [isRotating, setIsRotating] = useState(false);
    const [switchingInterval, setSwitchingInterval] = useState(30);
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
    const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([]);
    const [wallpaperSettingStatus, setWallpaperSettingStatus] = useState("");
    const timer = useRef<number | null>(null);
    const lastWallpaperId = useRef<string | null>(null);

    useEffect(() => {
        let isActive = true;

        async function getStuff() {
            const res = await fetch(getWallpaperApiUrl('desktop'))
            if (!res.ok) {
                console.error("Server said no, you don't have access, sorry, here is what he said btw:", res.status);
                return;
            }

            const data = await res.json();
            if (data.desktop?.wallpapers) {
                isActive && setWallpapers(data.desktop.wallpapers);
            } else if (data.wallpapers) {
                isActive && setWallpapers(data.wallpapers);
            } else {
                console.error("wtf is this format, hmmm, but here you go:", data);
            }
        }

        getStuff();

        const saved = localStorage.getItem('wallpaperRotation');
        if (saved) {
            const settings = JSON.parse(saved);
            isActive && setSwitchingInterval(settings.interval || 30);

            if (settings.selectedWallpapers && Array.isArray(settings.selectedWallpapers)) {
                isActive && setSelectedWallpapers(settings.selectedWallpapers);
            }
        }

        return () => {
            isActive = false;
            if (timer.current) {
                clearInterval(timer.current);
            }
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('wallpaperRotation', JSON.stringify({
            isRotating,
            switchingInterval,
            selectedWallpapers
        }));
    }, [isRotating, switchingInterval, selectedWallpapers]);

    // isn'T a type always a string, VS Code? anyways, be quiet and don't complain
    function toggleSelection(id: string) {
        setSelectedWallpapers(current => {
            return current.includes(id)
                ? current.filter(wallpaperId => wallpaperId !== id)
                : [...current, id];
        });
    }

    function changeWallpaper() {
        if (!selectedWallpapers.length || !window.wallpaperAPI) return;

        if (selectedWallpapers.length === 1) {
            const wallpaper = wallpapers.find(w => w.id === selectedWallpapers[0]);
            if (wallpaper) setWallpaper(wallpaper);
            return;
        }

        let availableIds = [...selectedWallpapers];

        if (lastWallpaperId.current && availableIds.length > 1) {
            availableIds = availableIds.filter(id => id !== lastWallpaperId.current);
        }

        const idx = Math.floor(Math.random() * availableIds.length);
        const selectedId = availableIds[idx];
        const wallpaper = wallpapers.find(w => w.id === selectedId);

        if (!wallpaper) return;

        lastWallpaperId.current = wallpaper.id;

        setWallpaper(wallpaper);
    }

    function setWallpaper(wallpaper: Wallpaper) {
        fetch(getWallpaperImageUrl(wallpaper.path))
            .then(response => {
                if (!response.ok) throw new Error("The download failed, why you let this happen? Why you blocked it or stopped it? The artists need a promotion, they need ur download");
                return response.blob();
            })
            .then(bobTheBlob => {
                const reader = new FileReader();

                reader.onloadend = () => {
                    window.wallpaperAPI.saveAndSetWallpaper({
                        name: wallpaper.name,
                        // why do we always need to make this a string? isn't it a string, I hate the problems check in VS Code, it is working, so why yapping. 
                        dataUrl: typeof reader.result === 'string' ? reader.result : '',
                        format: wallpaper.format
                    }).then(result => {
                        setWallpaperSettingStatus(result.success
                            ? `Current wallpaper: ${wallpaper.name}`
                            : `What did you do, but anyways, congrats to breaking the code, the wallpaper failed to set`
                        );
                    });
                };

                reader.readAsDataURL(bobTheBlob);
            });
    }

    function startWallpaperChange(mins = switchingInterval) {
        if (selectedWallpapers.length < 2) {
            setWallpaperSettingStatus('You want to rotate through 1 wallpaper? Are you crazy? Am I a duplicating machine?? No, so SELECT AT LEAST 2');
            return;
        }

        if (timer.current) {
            clearInterval(timer.current);
        }

        changeWallpaper();

        timer.current = window.setInterval(changeWallpaper, mins * 60 * 1000) as unknown as number;

        setIsRotating(true);
        setWallpaperSettingStatus(`Changing ur wallpaper every ${mins} minutes, you now can sit back and relax, I'll handle this.`);
    }

    function stopChanging() {
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }

        setIsRotating(false);
        setWallpaperSettingStatus('No rotation for me anymore, I am now jobless, you monster. :(');
    }

    function gimmeAll() {
        let ids = [];
        for (let i = 0; i < wallpapers.length; i++) {
            const w = wallpapers[i];
            ids.push(w.id);
        }
        setSelectedWallpapers(ids);
    }

    function clearEm() {
        setSelectedWallpapers([]);
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4">Wallpaper Rotation</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Rotates every {switchingInterval} minutes <img src="/custom-emoji/roomba-cat.gif" alt="blobhaj_party" className="inline w-5 h-5 ml-1 align-text-bottom" />
                </label>
                <input
                    type="range"
                    min="1"
                    max="120"
                    value={switchingInterval}
                    onChange={(sliderThing) => setSwitchingInterval(Number(sliderThing.target.value))}
                    disabled={isRotating}
                    className="w-full"
                />
                <div className="flex justify-between text-xs mt-1">
                    <span>1m</span>
                    <span>60m</span>
                    <span>120m</span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">
                        Select wallpapers ({selectedWallpapers.length})
                    </label>
                    <div className="flex space-x-2">
                        <button
                            onClick={gimmeAll}
                            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700"
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearEm}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded border">
                    {wallpapers.map((wallpaper) => (
                        <div
                            key={wallpaper.id}
                            className={`relative cursor-pointer rounded overflow-hidden ${selectedWallpapers.includes(wallpaper.id) ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => toggleSelection(wallpaper.id)}
                        >
                            <img
                                src={getWallpaperImageUrl(wallpaper.path)}
                                alt={wallpaper.name}
                                className="w-full aspect-video object-cover"
                            />
                            {selectedWallpapers.includes(wallpaper.id) && (
                                <div className="absolute top-1 right-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3 text-white"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center">
                {isRotating ? (
                    <button
                        onClick={stopChanging}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Stop Rotation
                    </button>
                ) : (
                    <button
                        onClick={() => startWallpaperChange()}
                        disabled={selectedWallpapers.length < 2}
                        className={`px-4 py-2 text-white rounded ${selectedWallpapers.length < 2
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        Start Rotation
                    </button>
                )}
            </div>

            {wallpaperSettingStatus && (
                <div className="mt-4 p-2 rounded text-sm text-center bg-blue-100 text-blue-700 border border-blue-200">
                    {wallpaperSettingStatus}
                </div>
            )}
        </div>
    );
}