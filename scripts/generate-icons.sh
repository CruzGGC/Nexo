#!/bin/bash

# PWA Icon Generation Script for Nexo
# This script generates all required PWA icons from the source logo
# Requires ImageMagick (convert) to be installed

SOURCE_ICON="public/NexoBranco.png"
OUTPUT_DIR="public/icons"

# Check if source exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source icon not found at $SOURCE_ICON"
    echo "Please ensure the logo file exists."
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed."
    echo "Install with: sudo apt-get install imagemagick"
    exit 1
fi

echo "🎨 Generating PWA icons from $SOURCE_ICON..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate various sizes for PWA
SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
    echo "  📱 Creating ${size}x${size} icon..."
    convert "$SOURCE_ICON" -resize "${size}x${size}" -background "#030014" -gravity center -extent "${size}x${size}" "$OUTPUT_DIR/icon-${size}x${size}.png"
done

# Create apple-touch-icon (180x180 for iOS)
echo "  🍎 Creating Apple Touch Icon (180x180)..."
convert "$SOURCE_ICON" -resize "180x180" -background "#030014" -gravity center -extent "180x180" "$OUTPUT_DIR/apple-touch-icon.png"
cp "$OUTPUT_DIR/apple-touch-icon.png" "public/apple-touch-icon.png"

# Create favicon sizes
echo "  🔖 Creating favicon.ico..."
convert "$SOURCE_ICON" -resize "32x32" -background "#030014" -gravity center -extent "32x32" "$OUTPUT_DIR/favicon-32x32.png"
convert "$SOURCE_ICON" -resize "16x16" -background "#030014" -gravity center -extent "16x16" "$OUTPUT_DIR/favicon-16x16.png"

# Create ICO with multiple sizes for maximum browser compatibility
convert "$SOURCE_ICON" -resize "16x16" -background "#030014" -gravity center -extent "16x16" \
        \( "$SOURCE_ICON" -resize "32x32" -background "#030014" -gravity center -extent "32x32" \) \
        \( "$SOURCE_ICON" -resize "48x48" -background "#030014" -gravity center -extent "48x48" \) \
        "public/favicon.ico"

# Create shortcut icons for games
echo "  🎮 Creating shortcut icons..."
convert "$SOURCE_ICON" -resize "96x96" -background "#030014" -gravity center -extent "96x96" "$OUTPUT_DIR/crossword-shortcut.png"
convert "$SOURCE_ICON" -resize "96x96" -background "#030014" -gravity center -extent "96x96" "$OUTPUT_DIR/wordsearch-shortcut.png"
convert "$SOURCE_ICON" -resize "96x96" -background "#030014" -gravity center -extent "96x96" "$OUTPUT_DIR/leaderboard-shortcut.png"

# Create maskable icons with padding (safe zone = 80% of icon)
echo "  🎭 Creating maskable icons with safe zone..."
for size in "${SIZES[@]}"; do
    # Calculate inner size (80% of total)
    inner_size=$((size * 80 / 100))
    convert "$SOURCE_ICON" -resize "${inner_size}x${inner_size}" -background "#030014" -gravity center -extent "${size}x${size}" "$OUTPUT_DIR/maskable-icon-${size}x${size}.png"
done

echo ""
echo "✅ PWA icons generated successfully!"
echo ""
echo "Generated files:"
ls -la "$OUTPUT_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Review the generated icons in $OUTPUT_DIR"
echo "2. Consider using a professional icon design tool for production"
echo "3. Test icons on various devices and browsers"
