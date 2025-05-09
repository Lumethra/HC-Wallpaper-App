import { readdir, stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export interface Wallpaper {
    id: string;
    name: string;
    path: string;
    size: number;
    addedAt: number;
    format: string;
}

export async function GET() {
    try {
        // Path to wallpapers directory
        const wallpapersDir = path.join(process.cwd(), 'public', 'wallpapers');

        // Read directory contents
        const files = await readdir(wallpapersDir);

        // Filter for image files
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        // Get metadata for each file
        const wallpapersPromises = imageFiles.map(async (file) => {
            const filePath = path.join(wallpapersDir, file);
            const fileStats = await stat(filePath);

            const ext = path.extname(file);
            const nameWithoutExt = path.basename(file, ext);

            // Create a nice display name from filename
            const displayName = nameWithoutExt
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            return {
                id: nameWithoutExt,
                name: displayName,
                path: `/wallpapers/${file}`,
                size: fileStats.size,
                addedAt: fileStats.birthtimeMs,
                format: ext.replace('.', '')
            };
        });

        const wallpapers = await Promise.all(wallpapersPromises);
        wallpapers.sort((a, b) => b.addedAt - a.addedAt);

        return NextResponse.json({ wallpapers });
    } catch (error) {
        console.error('Error listing wallpapers:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve wallpapers' },
            { status: 500 }
        );
    }
}