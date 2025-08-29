#!/bin/bash

echo "🚀 Preparing for deployment with optimized build..."

# Clean build artifacts
echo "Step 1: Cleaning build artifacts..."
bash cleanup-build.sh

# Install only production dependencies
echo "Step 2: Installing production dependencies only..."
export NODE_ENV=production
npm ci --only=production --no-optional

# Build the application
echo "Step 3: Building application..."
npm run build

# Verify critical files exist
echo "Step 4: Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed: dist/index.js not found"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Build failed: client/dist not found"
    exit 1
fi

echo "✅ Deployment preparation completed successfully!"
echo ""
echo "📊 Build size optimization summary:"
echo "  - Excluded development dependencies"
echo "  - Removed large ML model directories (ARTalk, bark, MuseTalk)"
echo "  - Cleaned build artifacts and cache files"
echo "  - Created optimized production bundle"
echo ""
echo "🎯 Ready for deployment with minimal image size!"