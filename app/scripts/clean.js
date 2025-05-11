const fs = require('fs');
const path = require('path');

const dirsToClean = ['out', 'dist', 'installer', '.next'];

for (const dir of dirsToClean) {
    const dirPath = path.join(__dirname, '..', dir);

    if (fs.existsSync(dirPath)) {
        console.log(`Cleaning ${dir} directory...`);

        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`✓ Removed ${dir}`);
        } catch (err) {
            console.error(`Error removing ${dir}:`, err);
        }
    }
}

console.log('Clean completed!');