const fs = require('fs');
const path = require('path');
const https = require('https');

async function fetchWallpapers() {
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

            result[deviceType] = data;
        } catch (error) {
            result[deviceType] = {
                wallpapers: [],
                deviceType
            };
        }
    }

    const outputDir = path.join(process.cwd(), 'public');
    const outputPath = path.join(outputDir, 'remote-wallpapers.json');

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
}

fetchWallpapers().catch(() => {
    process.exit(1);
});