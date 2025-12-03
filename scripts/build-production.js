const { execSync } = require('child_process');
const path = require('path');

console.log('Starting production build...');

try {
    // Execute the actual production build command
    // This aligns with "build:production": "cross-env NODE_ENV=production vite build && node scripts/esbuild.config.js production"
    execSync('npm run build:production', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    console.log('Production build completed successfully.');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}
