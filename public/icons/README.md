# PWA Icons for Nexo

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
```bash
npm install -g pwa-asset-generator
pwa-asset-generator ./icon.svg ./icons -b "#030014" -i index.html
```

### Option 3: Manual with ImageMagick
```bash
sudo apt-get install imagemagick
convert icon.svg -resize 512x512 icon-512x512.png
convert icon.svg -resize 192x192 icon-192x192.png
# etc...
```

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
