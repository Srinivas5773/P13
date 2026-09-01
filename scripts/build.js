/**
 * Brick Breaker Deluxe - Build & Asset Verification Script
 */
const fs = require('fs');
const path = require('path');

console.log('Building Brick Breaker Deluxe assets...');

const requiredFiles = [
  'index.html',
  'css/style.css',
  'js/game.js',
  'js/audio.js',
  'js/ball.js',
  'js/bricks.js',
  'js/paddle.js',
  'js/particles.js',
  'js/powerups.js',
  'js/storage.js',
  'js/ui.js',
  'js/levels.js',
  'js/data/levels_dataset_1.js',
  'js/data/levels_dataset_2.js',
  'js/data/brick_patterns_dataset.js',
  'js/data/achievements_data.js',
  'js/data/arcade_campaign_maps.js'
];

let missing = 0;
requiredFiles.forEach(file => {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) {
    console.error(`Missing required asset: ${file}`);
    missing++;
  }
});

if (missing === 0) {
  console.log('Build completed successfully. All assets verified.');
  process.exit(0);
} else {
  console.error(`Build failed with ${missing} missing assets.`);
  process.exit(1);
}
