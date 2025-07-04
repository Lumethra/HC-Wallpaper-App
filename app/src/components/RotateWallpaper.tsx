'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getWallpaperApiUrl, getWallpaperImageUrl } from '@/utils/api-config';
import { ROOMBA_CAT_GIF } from '@/assets/roomba-cat-gif';
import NotificationOverlay from './NotificationOverlay';

type Wallpaper = {
    id: string;
    name: string;
    path: string;
    size: number;
    format: string;
    displayName?: string;
    artist?: string;
    addedAt: number;
};

export default function RotateWallpaper() {
    const [isRotating, setIsRotating] = useState(false);
    const [switchingInterval, setSwitchingInterval] = useState(30);
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
    const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([]);
    const [wallpaperSettingStatus, setWallpaperSettingStatus] = useState("");
    const [visibleCount, setVisibleCount] = useState(20);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const timer = useRef<number | null>(null);
    const lastWallpaperId = useRef<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationProps, setNotificationProps] = useState({
        title: '',
        message: '',
        type: 'success' as 'success' | 'error' | 'warning',
        buttonText: 'Great!',
        showDownloadButton: false,
        downloadPath: ''
    });

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

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showNotification]);

    const loadMoreWallpapers = useCallback(() => {
        if (visibleCount < wallpapers.length && !isLoadingMore) {
            setIsLoadingMore(true);
            setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 20, wallpapers.length));
                setIsLoadingMore(false);
            }, 100);
        }
    }, [visibleCount, wallpapers.length, isLoadingMore]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    loadMoreWallpapers();
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loadMoreWallpapers, isLoadingMore]);

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
                if (!response.ok) {
                    setNotificationProps({
                        title: 'Download Failed',
                        message: "The wallpaper download failed. Please check your internet connection.",
                        type: 'error',
                        buttonText: 'Okay',
                        showDownloadButton: false,
                        downloadPath: ''
                    });
                    setShowNotification(true);
                    throw new Error("The download failed, why you let this happen? Why you blocked it or stopped it? The artists need a promotion, they need ur download");
                }
                return response.blob();
            })
            .then(bobTheBlob => {
                const reader = new FileReader();

                reader.onloadend = () => {
                    window.wallpaperAPI.saveAndSetWallpaper({
                        name: wallpaper.name,
                        dataUrl: typeof reader.result === 'string' ? reader.result : '',
                        format: wallpaper.format
                    }).then(result => {
                        if (result.success) {
                            setNotificationProps({
                                title: 'Wallpaper Set',
                                message: `Current wallpaper: ${wallpaper.name}`,
                                type: 'success',
                                buttonText: 'Great!',
                                showDownloadButton: false,
                                downloadPath: ''
                            });
                            setShowNotification(true);
                        } else {
                            setNotificationProps({
                                title: 'Failed to Set Wallpaper',
                                message: result.error || "What did you do, but anyways, congrats to breaking the code, the wallpaper failed to set",
                                type: 'error',
                                buttonText: 'Okay',
                                showDownloadButton: true,
                                downloadPath: getWallpaperImageUrl(wallpaper.path)
                            });
                            setShowNotification(true);
                        }
                    });
                };

                reader.readAsDataURL(bobTheBlob);
            })
            .catch(error => {
                console.error("Error setting wallpaper:", error);
            });
    }

    function startWallpaperChange(mins = switchingInterval) {
        if (selectedWallpapers.length < 2) {
            setNotificationProps({
                title: 'Cannot Start Rotation',
                message: 'You want to rotate through 1 wallpaper? Are you crazy? Am I a duplicating machine?? No, so SELECT AT LEAST 2',
                type: 'warning',
                buttonText: 'Okay',
                showDownloadButton: false,
                downloadPath: ''
            });
            setShowNotification(true);
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

        setNotificationProps({
            title: 'Rotation Started',
            message: `Changing your wallpaper every ${mins} minutes. You can sit back and relax now!`,
            type: 'success',
            buttonText: 'Great!',
            showDownloadButton: false,
            downloadPath: ''
        });
        setShowNotification(true);
    }

    function stopChanging() {
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }

        setIsRotating(false);
        setWallpaperSettingStatus('No rotation for me anymore, I am now jobless, you monster. :(');

        setNotificationProps({
            title: 'Rotation Stopped',
            message: 'No rotation for me anymore, I am now jobless, you monster. :(',
            type: 'warning',
            buttonText: 'Sorry!',
            showDownloadButton: false,
            downloadPath: ''
        });
        setShowNotification(true);
    }

    function gimmeAll() {
        setSelectedWallpapers(wallpapers.map(w => w.id));
    }

    function clearEm() {
        setSelectedWallpapers([]);
    }

    const visibleWallpapers = wallpapers.slice(0, visibleCount);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <span>Rotates every {switchingInterval} minutes </span>
                    <img
                        src={ROOMBA_CAT_GIF}
                        alt="roomba cat"
                        className="inline w-5 h-5 ml-1 align-text-bottom"
                    />
                </label>
                <input
                    type="range"
                    min="1"
                    max="120"
                    value={switchingInterval}
                    onChange={(sliderThing) => setSwitchingInterval(Number(sliderThing.target.value))}
                    disabled={isRotating}
                    className="w-full accent-green-500 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
                <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                    <span>1m</span>
                    <span>60m</span>
                    <span>120m</span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select wallpapers ({selectedWallpapers.length})
                    </label>
                    <div className="flex space-x-2">
                        <button
                            onClick={gimmeAll}
                            className="text-xs px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
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
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 custom-scrollbar">
                    {visibleWallpapers.map((wallpaper, index) => (
                        <div
                            key={wallpaper.id}
                            className={`relative cursor-pointer rounded overflow-hidden transition-all duration-200 hover:scale-105 ${selectedWallpapers.includes(wallpaper.id) ? 'ring-2 ring-green-500' : ''}`}
                            onClick={() => toggleSelection(wallpaper.id)}
                        >
                            <img
                                src={getWallpaperImageUrl(wallpaper.path)}
                                alt={wallpaper.name}
                                className="w-full aspect-video object-cover"
                                loading="lazy"
                                decoding="async"
                                style={{
                                    contentVisibility: 'auto',
                                    containIntrinsicSize: '100px 56px',
                                    willChange: index < 10 ? 'transform' : 'auto'
                                }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.error-placeholder')) {
                                        const errorDiv = document.createElement('div');
                                        errorDiv.className = 'error-placeholder flex items-center justify-center h-full text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700';
                                        errorDiv.textContent = 'Failed to load';
                                        parent.appendChild(errorDiv);
                                    }
                                }}
                            />
                            {selectedWallpapers.includes(wallpaper.id) && (
                                <div className="absolute top-1 right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
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

                    {visibleCount < wallpapers.length && (
                        <div
                            ref={(el) => {
                                if (el && observerRef.current) {
                                    observerRef.current.observe(el);
                                }
                            }}
                            className="col-span-full flex items-center justify-center p-4"
                        >
                            {isLoadingMore ? (
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                                    Loading more wallpapers...
                                </div>
                            ) : (
                                <button
                                    onClick={loadMoreWallpapers}
                                    className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700"
                                >
                                    Load More ({wallpapers.length - visibleCount} remaining)
                                </button>
                            )}
                        </div>
                    )}
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
                            : 'bg-green-500 hover:bg-green-600'
                            }`}
                    >
                        Start Rotation
                    </button>
                )}
            </div>

            {/* Notification overlay */}
            <NotificationOverlay
                show={showNotification}
                onClose={() => setShowNotification(false)}
                title={notificationProps.title}
                message={notificationProps.message}
                type={notificationProps.type}
                buttonText={notificationProps.buttonText}
                showDownloadButton={notificationProps.showDownloadButton}
                downloadPath={notificationProps.downloadPath}
            />
        </div>
    );
}