const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');
const pngToIco = require('png-to-ico');

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'icons', 'formatted-icons');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Source image
const sourceImage = path.join(__dirname, '..', 'public', 'icons', 'Abhay-App-Icon.jpg');

async function generateIcons() {
    console.log('Starting icon conversion...');

    if (!fs.existsSync(sourceImage)) {
        console.error(`Source image not found: ${sourceImage}`);
        return;
    }

    try {
        // Load the image with better settings for quality
        const image = sharp(sourceImage, {
            failOnError: true,
            density: 300 // Higher density for better quality
        });

        // Generate PNG icons in multiple sizes for ICO creation
        const sizes = [16, 24, 32, 48, 64, 128, 256];
        const pngPaths = [];

        // First create all the PNG files
        for (const size of sizes) {
            const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
            await image
                .clone()
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
                })
                .png()
                .toFile(outputPath);

            console.log(`Created ${size}x${size} PNG`);
            pngPaths.push(outputPath);
        }

        // For large icons like 512x512
        const largeOutputPath = path.join(outputDir, 'icon-512x512.png');
        await image
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(largeOutputPath);
        console.log('Created 512x512 PNG');

        // Create ICO file using the PNG files - IMPORTANT: use the png-to-ico library properly
        console.log('Creating ICO file...');
        const icoBuffer = await pngToIco(pngPaths);
        fs.writeFileSync(path.join(outputDir, 'Abhay-App-Icon.ico'), icoBuffer);
        console.log('Created ICO file successfully');

        // Copy the 512x512 PNG for Linux
        fs.copyFileSync(
            largeOutputPath,
            path.join(outputDir, 'Abhay-App-Icon.png')
        );
        console.log('Created Linux PNG icon');

        // For macOS - just use the high-res PNG as a placeholder
        // For a proper macOS app, you'd need to create a real .icns file using specialized tools
        fs.copyFileSync(
            largeOutputPath,
            path.join(outputDir, 'Abhay-App-Icon.icns')
        );
        console.log('Created macOS icon placeholder (for proper macOS builds, convert to .icns format)');

        // Also, update main.js to point to a valid PNG
        const mainJsPath = path.join(__dirname, '..', 'electron', 'main.js');
        if (fs.existsSync(mainJsPath)) {
            let mainJs = fs.readFileSync(mainJsPath, 'utf8');
            if (mainJs.includes('icon: path.join(__dirname')) {
                mainJs = mainJs.replace(
                    /icon: path\.join\(__dirname, '[^']*'\)/,
                    `icon: path.join(__dirname, '../public/icons/formatted-icons/icon-256x256.png')`
                );
                fs.writeFileSync(mainJsPath, mainJs);
                console.log('Updated main.js to use PNG icon for development');
            }
        }

        console.log('\nIcon conversion complete!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();