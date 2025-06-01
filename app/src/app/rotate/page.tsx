import RotateWallpaper from '@/components/RotateWallpaper';
import Navbar from '@/components/Navbar';

export default function Rotate() {
    return (
        <main>
            <Navbar />
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
        </main>
    );
}