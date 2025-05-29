import WallpaperGallery from '@/components/WallpaperGallery';
import WallpaperUploader from '@/components/WallpaperUploader';
import CurrentWallpaper from '@/components/CurrentWallpaper';
import RotateWallpaper from '@/components/RotateWallpaper';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        HC Wallpaper App
      </h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Wallpapers</h2>
        <WallpaperGallery />
      </div>

      <div className='mb-8'>
        <h2 className='text-2xl font-semibold mb-4'>Rotate wallpapers</h2>
        <RotateWallpaper />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WallpaperUploader />
        <CurrentWallpaper />
      </div>
    </main>
  );
}