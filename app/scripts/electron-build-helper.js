const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('Generating remote wallpaper catalog...');
try {
    require('./generate-remote-wallpapers');
    console.log('✓ Remote wallpaper catalog generated');
} catch (err) {
    console.error('Error generating remote wallpaper catalog:', err);
}

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

console.log('Copying electron directory to out directory...');
try {
    const outElectronDir = path.join(__dirname, '..', 'out', 'electron');
    if (!fs.existsSync(outElectronDir)) {
        fs.mkdirSync(outElectronDir, { recursive: true });
    }

    const electronDir = path.join(__dirname, '..', 'electron');
    const electronFiles = fs.readdirSync(electronDir);

    for (const file of electronFiles) {
        const srcPath = path.join(electronDir, file);
        const destPath = path.join(outElectronDir, file);

        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied electron/${file}`);
    }

    console.log('✓ Copied electron directory');
} catch (err) {
    console.error('Error copying electron directory:', err);
}

console.log('Running electron-builder for current platform...');
try {
    const platform = process.platform;
    let buildCommand;

    switch (platform) {
        case 'win32':
            buildCommand = 'electron-builder --win portable --config.npmRebuild=false --config.win.signAndEditExecutable=false';
            break;
        case 'darwin':
            buildCommand = 'electron-builder --mac dmg';
            break;
        case 'linux':
            buildCommand = 'electron-builder --linux AppImage';
            break;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Building for ${platform}...`);
    execSync(buildCommand, { stdio: 'inherit' });
    console.log('✓ Electron build completed');
} catch (err) {
    console.error('Error running electron-builder:', err);
    process.exit(1);
}

const installerDir = path.join(__dirname, '..', 'installer');
if (!fs.existsSync(installerDir)) {
    fs.mkdirSync(installerDir, { recursive: true });
    console.log('✓ Created installer directory');
}

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
            if (/HC Wallpaper App.*\.(exe|dmg)$/i.test(file) ||
                /hc-wallpaper-app.*\.(AppImage|deb)$/i.test(file)) {
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