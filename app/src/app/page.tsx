// Update this file at: /app/src/app/page.tsx
"use client";

import WallpaperUploader from '../components/WallpaperUploader';
import CurrentWallpaper from '../components/CurrentWallpaper';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Wallpaper Changer</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <WallpaperUploader />
          <CurrentWallpaper />
        </div>
      </div>
    </main>
  );
}