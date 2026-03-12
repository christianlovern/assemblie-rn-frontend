/**
 * Generates an Android adaptive icon foreground with safe-zone padding.
 * Android masks the foreground and only guarantees the center ~66% is visible.
 * This script scales your logo to 66% and centers it on a 1024x1024 transparent
 * canvas so it won't be cropped on device.
 *
 * Run: node scripts/generate-android-icon.js
 * Then: npx expo prebuild --clean  (or EAS build) to regenerate Android resources.
 */

const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const inputPath = path.join(projectRoot, 'assets', 'Icon_Primary.png');
const outputPath = path.join(projectRoot, 'assets', 'Icon_Android_Foreground.png');

const OUTPUT_SIZE = 1024;
const SAFE_ZONE_RATIO = 0.66; // Android safe zone ~66% of canvas
const LOGO_SIZE = Math.round(OUTPUT_SIZE * SAFE_ZONE_RATIO);
const PADDING = Math.round((OUTPUT_SIZE - LOGO_SIZE) / 2);

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('This script requires "sharp". Install it with:');
    console.error('  npm install --save-dev sharp');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error('Input icon not found:', inputPath);
    process.exit(1);
  }

  try {
    const resizedLogo = await sharp(inputPath)
      .resize(LOGO_SIZE, LOGO_SIZE)
      .png()
      .toBuffer();

    const transparentBase = await sharp({
      create: {
        width: OUTPUT_SIZE,
        height: OUTPUT_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    await sharp(transparentBase)
      .composite([{ input: resizedLogo, left: PADDING, top: PADDING }])
      .png()
      .toFile(outputPath);

    console.log('Generated:', outputPath);
    console.log('Logo size in canvas:', LOGO_SIZE + 'x' + LOGO_SIZE, '(66% of', OUTPUT_SIZE + ')');
    console.log('Next: run "npx expo prebuild --clean" then rebuild your Android app.');
  } catch (err) {
    console.error('Error generating icon:', err.message);
    process.exit(1);
  }
}

main();
