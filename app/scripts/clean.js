const fs = require('fs');
const path = require('path');

const dirsToClean = ['out', 'dist', 'installer', '.next'];
const additionalPaths = [path.join('public', 'icons', 'formatted-icons')];

// Clean main directories
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

// Clean additional paths
for (const additionalPath of additionalPaths) {
    const fullPath = path.join(__dirname, '..', additionalPath);

    if (fs.existsSync(fullPath)) {
        console.log(`Cleaning ${additionalPath}...`);

        try {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`✓ Removed ${additionalPath}`);
        } catch (err) {
            console.error(`Error removing ${additionalPath}:`, err);
        }
    }
}

console.log('Clean completed!');