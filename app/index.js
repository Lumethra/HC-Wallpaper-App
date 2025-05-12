const path = require('path');
const electronPath = path.join(__dirname, 'electron', 'main.js');

try {
    require(electronPath);
} catch (error) {
    console.error('Error loading main process file:', error);
    try {
        require(path.join(__dirname, 'out', 'electron', 'main.js'));
    } catch (innerError) {
        console.error('Failed to load backup location:', innerError);
    }
}