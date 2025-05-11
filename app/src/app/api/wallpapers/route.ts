import { readdir, stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

// This setting allows Next.js to export the route statically
export const dynamic = 'force-static';

export interface Wallpaper {
    id: string;
    name: string;
    path: string;
    size: number;
    addedAt: number;
    format: string;
    deviceType: 'mobile' | 'desktop';
}

// Remove request parameter since it's not compatible with static export
export async function GET() {
    try {
        // Pre-generate data for both device types for static export
        const results: Record<string, any> = {};

        for (const deviceType of ['desktop', 'mobile']) {
            const wallpapersDir = path.join(
                process.cwd(),
                'public',
                'wallpapers',
                deviceType
            );

            let files;
            try {
                files = await readdir(wallpapersDir);
            } catch (err) {
                console.warn(`Directory for ${deviceType} not found, using default wallpapers`);
                const defaultDir = path.join(process.cwd(), 'public', 'wallpapers');
                files = await readdir(defaultDir);
            }

            // Filter for image files
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
            });

            // Process files and get metadata
            const wallpapersPromises = imageFiles.map(async (file) => {
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

                const displayName = nameWithoutExt
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                const baseUrl = process.env.ELECTRON === 'true' ? 'https://hc-wallpaper-app.vercel.app' : '';

                return {
                    id: nameWithoutExt,
                    name: displayName,
                    path: `${baseUrl}/wallpapers/${deviceType}/${file}`,
                    size: fileStats.size,
                    addedAt: fileStats.birthtimeMs,
                    format: ext.replace('.', ''),
                    deviceType
                };
            });

            const wallpapers = await Promise.all(wallpapersPromises);
            wallpapers.sort((a, b) => b.addedAt - a.addedAt);

            results[deviceType] = {
                wallpapers,
                deviceType
            };
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error listing wallpapers:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve wallpapers' },
            { status: 500 }
        );
    }
}