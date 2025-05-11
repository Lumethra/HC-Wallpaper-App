import { readdir, stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'error';

export interface Wallpaper {
    id: string;
    name: string;
    path: string;
    size: number;
    addedAt: number;
    format: string;
    deviceType: 'mobile' | 'desktop';
}

export async function GET(request: Request) {
    try {
        // Get device type from query parameter or user-agent
        const { searchParams } = new URL(request.url);
        let deviceType = searchParams.get('deviceType') as 'mobile' | 'desktop' | null;

        // If not explicitly specified, try to detect from user-agent
        if (!deviceType) {
            const userAgent = request.headers.get('user-agent') || '';
            deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
                ? 'mobile'
                : 'desktop';
        }

        // Path to wallpapers directory based on device type
        const wallpapersDir = path.join(
            process.cwd(),
            'public',
            'wallpapers',
            deviceType
        );

        // Rest of your existing code remains the same
        let files;
        try {
            files = await readdir(wallpapersDir);
        } catch (err) {
            // Fallback code
            console.warn(`Directory for ${deviceType} not found, using default wallpapers`);
            const defaultDir = path.join(process.cwd(), 'public', 'wallpapers');
            files = await readdir(defaultDir);
        }

        // Filter for image files
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        // Get metadata for each file
        const wallpapersPromises = imageFiles.map(async (file) => {
            // Use the appropriate directory path for stat operations
            const dirPath = path.join(
                process.cwd(),
                'public',
                'wallpapers',
                deviceType
            );

            const filePath = path.join(dirPath, file);
            let fileStats;

            try {
                fileStats = await stat(filePath);
            } catch (err) {
                // If file doesn't exist in device-specific folder, try default
                const defaultFilePath = path.join(
                    process.cwd(),
                    'public',
                    'wallpapers',
                    file
                );
                fileStats = await stat(defaultFilePath);
            }

            const ext = path.extname(file);
            const nameWithoutExt = path.basename(file, ext);

            // Create a nice display name from filename
            const displayName = nameWithoutExt
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            // Get base URL for Electron production mode
            const baseUrl = process.env.ELECTRON === 'true' ? 'https://hc-wallpaper-app.vercel.app' : '';

            return {
                id: nameWithoutExt,
                name: displayName,
                // Use absolute paths for Electron production
                path: `${baseUrl}/wallpapers/${deviceType}/${file}`,
                size: fileStats.size,
                addedAt: fileStats.birthtimeMs,
                format: ext.replace('.', ''),
                deviceType
            };
        });

        const wallpapers = await Promise.all(wallpapersPromises);
        wallpapers.sort((a, b) => b.addedAt - a.addedAt);

        return NextResponse.json({
            wallpapers,
            deviceType
        });
    } catch (error) {
        console.error('Error listing wallpapers:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve wallpapers' },
            { status: 500 }
        );
    }
}