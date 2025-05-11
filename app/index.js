// Use a path resolution that works in both dev and production
const path = require('path');
const electronPath = path.join(__dirname, 'electron', 'main.js');

try {
    require(electronPath);
} catch (error) {
    console.error('Error loading main process file:', error);
    // Try backup location for packaged app
    try {
        require(path.join(__dirname, 'out', 'electron', 'main.js'));
    } catch (innerError) {
        console.error('Failed to load backup location:', innerError);
    }
}