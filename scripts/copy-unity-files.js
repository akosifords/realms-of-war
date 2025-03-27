import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from the file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'public', 'build');
const destDir = path.join(rootDir, 'dist', 'build');

// Copy additional files needed for GitHub Pages
function copySpecialFiles() {
  // Ensure firebase-config.js is copied
  if (fs.existsSync(path.join(rootDir, 'public', 'firebase-config.js'))) {
    fs.copyFileSync(
      path.join(rootDir, 'public', 'firebase-config.js'),
      path.join(rootDir, 'dist', 'firebase-config.js')
    );
    console.log('Copied firebase-config.js to dist');
  }
  
  // Add .nojekyll file to prevent GitHub Pages from using Jekyll
  // This ensures that folders starting with underscore and certain directories like "build" are not ignored
  fs.writeFileSync(path.join(rootDir, 'dist', '.nojekyll'), '');
  console.log('Created .nojekyll file in dist folder');
  
  // Create a README.md in build directory to ensure GitHub preserves it
  fs.writeFileSync(
    path.join(rootDir, 'dist', 'build', 'README.md'), 
    '# Unity WebGL Build Files\n\nThis directory contains the Unity WebGL build files for Realms of War.'
  );
  console.log('Created README.md in build folder');
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copy a directory recursively
 */
function copyDirectory(source, destination) {
  ensureDirectoryExists(destination);
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} → ${destPath}`);
    }
  }
}

// Main execution
console.log('Copying Unity build files...');
ensureDirectoryExists(destDir);
copyDirectory(sourceDir, destDir);
copySpecialFiles();
console.log('Unity build files copied successfully!'); 