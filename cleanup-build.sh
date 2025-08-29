#!/bin/bash

echo "🧹 Cleaning build artifacts and temporary files..."

# Remove build directories
echo "Removing build directories..."
rm -rf dist/
rm -rf build/
rm -rf .next/
rm -rf .cache/
rm -rf .parcel-cache/

# Remove node_modules to force clean install
echo "Removing node_modules for clean install..."
rm -rf node_modules/

# Remove package-lock for clean dependency resolution
echo "Removing package-lock.json for clean dependency resolution..."
rm -f package-lock.json

# Remove TypeScript build info
echo "Removing TypeScript build info..."
rm -f *.tsbuildinfo
rm -f tsconfig.tsbuildinfo

# Remove log files
echo "Removing log files..."
rm -f *.log
rm -rf logs/

# Remove temporary files
echo "Removing temporary files..."
rm -f *.tmp
rm -f *.temp

# Remove coverage reports
echo "Removing test coverage..."
rm -rf coverage/
rm -f *.lcov

# Remove large development-only directories if they exist
echo "Removing large development-only directories..."
if [ -d "ARTalk" ] && [ "$KEEP_ARTALK" != "true" ]; then
    echo "Removing ARTalk directory (set KEEP_ARTALK=true to preserve)..."
    rm -rf ARTalk/
fi

if [ -d "bark" ] && [ "$KEEP_BARK" != "true" ]; then
    echo "Removing bark directory (set KEEP_BARK=true to preserve)..."
    rm -rf bark/
fi

if [ -d "MuseTalk" ] && [ "$KEEP_MUSETALK" != "true" ]; then
    echo "Removing MuseTalk directory (set KEEP_MUSETALK=true to preserve)..."
    rm -rf MuseTalk/
fi

# Remove attached assets if not needed in production
if [ -d "attached_assets" ] && [ "$KEEP_ASSETS" != "true" ]; then
    echo "Removing attached_assets directory (set KEEP_ASSETS=true to preserve)..."
    rm -rf attached_assets/
fi

echo "✅ Build cleanup completed!"
echo ""
echo "💡 Tips for deployment:"
echo "  - Use 'npm ci --production' instead of 'npm install' for production builds"
echo "  - Set NODE_ENV=production to exclude dev dependencies"
echo "  - Use multi-stage Docker builds to minimize final image size"
echo ""
echo "🔧 Environment variables to preserve directories:"
echo "  - KEEP_ARTALK=true   (preserves ARTalk directory)"
echo "  - KEEP_BARK=true     (preserves bark directory)"
echo "  - KEEP_MUSETALK=true (preserves MuseTalk directory)"
echo "  - KEEP_ASSETS=true   (preserves attached_assets directory)"