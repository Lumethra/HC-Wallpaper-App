import CurrentWallpaper from '@/components/CurrentWallpaper';
import WallpaperUploader from '@/components/WallpaperUploader';
import Navbar from '@/components/Navbar';

export default function Current() {
    return (
        <main>
            <Navbar />
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
        </main>
    );
}