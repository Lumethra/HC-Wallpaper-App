const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate remote wallpaper catalog
console.log('Generating remote wallpaper catalog...');
try {
    require('./generate-remote-wallpapers');
    console.log('✓ Remote wallpaper catalog generated');
} catch (err) {
    console.error('Error generating remote wallpaper catalog:', err);
}

// Copy index.js to out directory
console.log('Copying index.js to out directory...');
try {
    fs.copyFileSync(
        path.join(__dirname, '..', 'index.js'),
        path.join(__dirname, '..', 'out', 'index.js')
    );
    console.log('✓ Copied index.js');
} catch (err) {
    console.error('Error copying index.js:', err);
    process.exit(1);
}

// Run electron-builder
console.log('Running electron-builder...');
try {
    execSync('electron-builder', { stdio: 'inherit' });
    console.log('✓ Electron build completed');
} catch (err) {
    console.error('Error running electron-builder:', err);
    process.exit(1);
}

// Create installer directory if it doesn't exist
const installerDir = path.join(__dirname, '..', 'installer');
if (!fs.existsSync(installerDir)) {
    fs.mkdirSync(installerDir, { recursive: true });
    console.log('✓ Created installer directory');
}

// Find and copy installer files
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found');
    process.exit(1);
}

console.log('Copying installer files to installer directory...');

function findInstallerFiles(dir, filesList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findInstallerFiles(filePath, filesList);
        } else {
            // Match installer file extensions
            if (/\.(exe|dmg|AppImage|deb|rpm)$/i.test(file)) {
                filesList.push(filePath);
            }
        }
    }

    return filesList;
}

const installerFiles = findInstallerFiles(distDir);

if (installerFiles.length === 0) {
    console.log('No installer files found');
} else {
    for (const filePath of installerFiles) {
        const fileName = path.basename(filePath);
        const destPath = path.join(installerDir, fileName);

        try {
            fs.copyFileSync(filePath, destPath);
            console.log(`✓ Copied ${fileName} to installer directory`);
        } catch (err) {
            console.error(`Error copying ${fileName}:`, err);
        }
    }

    console.log(`✓ Successfully copied ${installerFiles.length} installer files`);
}

console.log('Build process completed!');