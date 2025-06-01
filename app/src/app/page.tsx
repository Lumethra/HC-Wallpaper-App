"use client";
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import WallpaperGallery from '@/components/WallpaperGallery';
import CurrentWallpaper from '@/components/CurrentWallpaper';
import WallpaperUploader from '@/components/WallpaperUploader';
import RotateWallpaper from '@/components/RotateWallpaper';

type ViewType = 'home' | 'gallery' | 'current' | 'rotate';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const renderContent = () => {
    switch (currentView) {
      case 'gallery':
        return (
          <div className="container mx-auto py-8 px-4">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">🖼️</span>
                <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
                  Wallpaper Gallery
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Explore and set wallpapers from the community collection
              </p>
            </div>
            <WallpaperGallery />
          </div>
        );

      case 'current':
        return (
          <div className="container mx-auto py-8 px-4 pb-20 md:pb-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">🖥️</span>
                <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
                  Manage Wallpapers
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                View current wallpaper and upload new ones
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <CurrentWallpaper />
              <WallpaperUploader />
            </div>
          </div>
        );

      case 'rotate':
        return (
          <div className="container mx-auto py-8 px-4 pb-20 md:pb-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">🔄</span>
                <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
                  Auto Rotation
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Set up automatic wallpaper rotation from your favorites
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <RotateWallpaper />
            </div>
          </div>
        );

      default: // home
        return (
          <div className="container mx-auto py-8 px-4 pb-20 md:pb-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-green-600 dark:text-green-400">
                  HC Wallpaper App
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get wallpapers from #background-per-day
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105 cursor-pointer"
                onClick={() => setCurrentView('gallery')}
              >
                <div className="text-green-500 text-3xl mb-3">🖼️</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Browse Gallery</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Explore and set wallpapers from the community collection
                </p>
                <span className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">
                  Open Gallery →
                </span>
              </div>

              <div
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105 cursor-pointer"
                onClick={() => setCurrentView('current')}
              >
                <div className="text-green-500 text-3xl mb-3">🖥️</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Current & Upload</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  View current wallpaper and upload new ones
                </p>
                <span className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">
                  Manage Wallpapers →
                </span>
              </div>

              <div
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105 cursor-pointer"
                onClick={() => setCurrentView('rotate')}
              >
                <div className="text-green-500 text-3xl mb-3">🔄</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Auto Rotation</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Set up automatic wallpaper rotation from your favorites
                </p>
                <span className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">
                  Setup Rotation →
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main>
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      {renderContent()}
    </main>
  );
}