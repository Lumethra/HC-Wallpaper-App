const fs = require('fs');
const path = require('path');
const https = require('https');

async function fetchWallpapers() {
    console.log('Generating wallpaper catalog from Vercel deployment...');

    const deviceTypes = ['desktop', 'mobile'];
    const result = {};

    for (const deviceType of deviceTypes) {
        try {
            const url = `https://hc-wallpaper-app.vercel.app/api/wallpapers?deviceType=${deviceType}`;

            const data = await new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    });

                    res.on('error', (err) => {
                        reject(err);
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            });

            console.log(`✓ Fetched ${data.wallpapers?.length || 0} ${deviceType} wallpapers`);

            result[deviceType] = data;
        } catch (error) {
            console.error(`Error fetching ${deviceType} wallpapers:`, error.message);
            result[deviceType] = {
                wallpapers: [],
                deviceType
            };
        }
    }

    const outputDir = path.join(process.cwd(), 'public');
    const outputPath = path.join(outputDir, 'remote-wallpapers.json');

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`✓ Wallpaper catalog written to: ${outputPath}`);
}

fetchWallpapers().catch(err => {
    console.error('Failed to generate wallpaper catalog:', err);
    process.exit(1);
});