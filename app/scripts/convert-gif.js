const fs = require('fs');
const path = require('path');

function convertGifToBase64() {
    const possiblePaths = [
        path.join(__dirname, '..', 'public', 'custom-emoji', 'roomba-cat.gif'),
        path.join(__dirname, '..', 'public', 'images', 'roomba-cat.gif'),
        path.join(__dirname, '..', 'public', 'roomba-cat.gif'),
        path.join(__dirname, '..', 'assets', 'roomba-cat.gif'),
    ];

    let gifPath = null;
    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            gifPath = possiblePath;
            break;
        }
    }

    if (!gifPath) {
        console.error('❌ GIF file not found in any of these locations:');
        possiblePaths.forEach(p => console.log(`   - ${p}`));
        console.log('\nPlease place roomba-cat.gif in one of these directories:');
        console.log('   - public/custom-emoji/');
        console.log('   - public/images/');
        console.log('   - public/');
        return;
    }

    const outputPath = path.join(__dirname, '..', 'src', 'assets', 'roomba-cat-gif.ts');

    const assetsDir = path.dirname(outputPath);
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    try {
        console.log(`📁 Found GIF at: ${gifPath}`);

        const gifBuffer = fs.readFileSync(gifPath);
        const base64String = gifBuffer.toString('base64');

        const tsContent = `// Auto-generated file - do not edit manually
// Run 'npm run electron:gif' to regenerate
// Source: ${path.relative(path.join(__dirname, '..'), gifPath)}

export const ROOMBA_CAT_GIF = "data:image/gif;base64,${base64String}";
`;

        fs.writeFileSync(outputPath, tsContent);
        console.log('✅ Successfully converted GIF to base64 TypeScript file');
        console.log(`📄 Output written to: ${outputPath}`);
        console.log(`📏 File size: ${(base64String.length / 1024).toFixed(2)} KB`);
        console.log(`🎯 Original GIF size: ${(gifBuffer.length / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('❌ Error converting GIF:', error);
    }
}

convertGifToBase64();