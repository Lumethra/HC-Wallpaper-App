import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <main>
      <Navbar />
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105">
            <div className="text-green-500 text-3xl mb-3">🖼️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Browse Gallery</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Explore and set wallpapers from the community collection
            </p>
            <a
              href="/gallery"
              className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            >
              Open Gallery →
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105">
            <div className="text-green-500 text-3xl mb-3">🖥️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Current & Upload</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              View current wallpaper and upload new ones
            </p>
            <a
              href="/current"
              className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            >
              Manage Wallpapers →
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105">
            <div className="text-green-500 text-3xl mb-3">🔄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Auto Rotation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Set up automatic wallpaper rotation from your favorites
            </p>
            <a
              href="/rotate"
              className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            >
              Setup Rotation →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}