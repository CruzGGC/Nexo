/**
 * PWA Icon Generation Script for Nexo
 * 
 * This script creates placeholder PNG icons for PWA.
 * For production, replace with properly designed icons.
 * 
 * To generate real icons from SVG:
 * 1. Use https://realfavicongenerator.net/
 * 2. Upload the SVG from public/icons/icon.svg
 * 3. Download and extract to public/icons/
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple 1x1 transparent PNG as placeholder
// In production, use proper icon generation
const createPlaceholderPNG = (size) => {
  // PNG header for a 1x1 transparent image
  // This is a minimal valid PNG that browsers will accept
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x06, // 8-bit RGBA
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
    0x0D, 0x0A, 0x2D, 0xB4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return png;
};

console.log('📱 PWA Icon Setup for Nexo\n');
console.log('Note: This creates placeholder files. For production icons:\n');
console.log('1. Visit https://realfavicongenerator.net/');
console.log('2. Upload your logo (public/NexoBranco.png)');
console.log('3. Configure colors: Background #030014, Theme #00f3ff');
console.log('4. Download and extract to public/icons/\n');

// Create info file
const infoContent = `# PWA Icons for Nexo

## Current Status
Placeholder icons are in place. Replace with properly generated icons for production.

## Icon Generation Steps

### Option 1: RealFaviconGenerator (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload your logo (NexoBranco.png or icon.svg)
3. Configure settings:
   - iOS: Background color #030014
   - Android: Theme color #00f3ff, Background #030014
   - Windows: Tile color #030014
4. Generate and download the package
5. Extract to this folder

### Option 2: PWA Asset Generator
\`\`\`bash
npm install -g pwa-asset-generator
pwa-asset-generator ./icon.svg ./icons -b "#030014" -i index.html
\`\`\`

### Option 3: Manual with ImageMagick
\`\`\`bash
sudo apt-get install imagemagick
convert icon.svg -resize 512x512 icon-512x512.png
convert icon.svg -resize 192x192 icon-192x192.png
# etc...
\`\`\`

## Required Files
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- apple-touch-icon.png (180x180)
- favicon.ico (16x16, 32x32, 48x48)

## Shortcut Icons
- crossword-shortcut.png (96x96)
- wordsearch-shortcut.png (96x96)
- leaderboard-shortcut.png (96x96)
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), infoContent);
console.log('✅ Created README.md with icon generation instructions\n');

// For now, copy the existing logo as placeholder
const sourceLogo = path.join(__dirname, '../public/NexoBranco.png');
if (fs.existsSync(sourceLogo)) {
  sizes.forEach(size => {
    const dest = path.join(iconsDir, `icon-${size}x${size}.png`);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(sourceLogo, dest);
      console.log(`📄 Created placeholder: icon-${size}x${size}.png`);
    }
  });
  
  // Apple touch icon
  const appleDest = path.join(iconsDir, 'apple-touch-icon.png');
  if (!fs.existsSync(appleDest)) {
    fs.copyFileSync(sourceLogo, appleDest);
    console.log('📄 Created placeholder: apple-touch-icon.png');
  }
  
  // Root level apple-touch-icon
  const rootApple = path.join(__dirname, '../public/apple-touch-icon.png');
  if (!fs.existsSync(rootApple)) {
    fs.copyFileSync(sourceLogo, rootApple);
    console.log('📄 Created placeholder: public/apple-touch-icon.png');
  }
  
  // Shortcut icons
  ['crossword', 'wordsearch', 'leaderboard'].forEach(name => {
    const dest = path.join(iconsDir, `${name}-shortcut.png`);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(sourceLogo, dest);
      console.log(`📄 Created placeholder: ${name}-shortcut.png`);
    }
  });
  
  console.log('\n✅ Placeholder icons created from NexoBranco.png');
  console.log('⚠️  These should be replaced with properly sized icons for production!');
} else {
  console.log('⚠️  Source logo not found at public/NexoBranco.png');
  console.log('   Please add icons manually or run this script after adding the logo.');
}

console.log('\n🎉 PWA icon setup complete!');
