import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'client', 'src');

function walk(dir, call) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, call);
        } else {
            call(fullPath);
        }
    });
}

let modifiedCount = 0;

walk(directoryPath, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Replace template literals: `http://localhost:5001/api...` -> `${window.API_URL}...`
        content = content.replace(/`http:\/\/localhost:5001\/api([^`]*)`/g, "`${window.API_URL}$1`");
        // Replace template literals: `http://localhost:5001...` -> `${window.BASE_URL}...`
        content = content.replace(/`http:\/\/localhost:5001([^`]*)`/g, "`${window.BASE_URL}$1`");

        // Replace string concatenations or fetch: "http://localhost:5001/api..." -> window.API_URL + "..."
        content = content.replace(/['"]http:\/\/localhost:5001\/api([^'"]*)['"]/g, "window.API_URL + '$1'");
        // Replace strings: "http://localhost:5001..." -> window.BASE_URL + "..."
        content = content.replace(/['"]http:\/\/localhost:5001([^'"]*)['"]/g, "window.BASE_URL + '$1'");

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
            console.log(`Modified: ${filePath}`);
        }
    }
});

console.log(`Finished processing. ${modifiedCount} files modified.`);
