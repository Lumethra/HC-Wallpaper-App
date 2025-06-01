import WallpaperGallery from '@/components/WallpaperGallery';
import Navbar from '@/components/Navbar';

export default function Gallery() {
    return (
        <main>
            <Navbar />
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
        </main>
    );
}