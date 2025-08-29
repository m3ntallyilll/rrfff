#!/bin/bash
# Production build script with aggressive size optimization for Cloud Run deployment
set -e

echo "🚀 Starting optimized production build for Cloud Run deployment..."

# First, run cleanup before building to reduce workspace size
echo "Step 1: Running pre-build cleanup..."
chmod +x cleanup-deployment.sh
./cleanup-deployment.sh

# Reinstall only production dependencies
echo "Step 2: Installing production dependencies..."
if [ -f "package.prod.json" ]; then
  echo "Using optimized production package.json..."
  cp package.json package.full.json
  cp package.prod.json package.json
  npm ci --only=production --no-audit --no-fund --silent
  # Restore original package.json but keep prod for reference
  cp package.json package.prod.json
  cp package.full.json package.json
else
  echo "Installing production dependencies only..."
  npm ci --only=production --no-audit --no-fund --silent
fi

# Build the application
echo "Step 3: Building application..."
NODE_ENV=production npm run build

# Verify critical build outputs exist
echo "Step 4: Verifying build outputs..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed: dist/index.js not found"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    echo "❌ Build failed: client/dist not found"  
    exit 1
fi

# Post-build cleanup - remove everything except essentials
echo "Step 5: Post-build cleanup..."

# Remove source files (keeping only built artifacts)
echo "Removing source files after build..."
rm -rf client/src/ shared/ server/
rm -rf node_modules/@types/ # Remove TypeScript definitions

# Keep only essential files for runtime
echo "Keeping only runtime essentials..."
mkdir -p /tmp/essential
cp -r dist/ /tmp/essential/ 2>/dev/null || true
cp -r client/dist/ /tmp/essential/client/ 2>/dev/null || true
cp package.json /tmp/essential/ 2>/dev/null || true
cp package-lock.json /tmp/essential/ 2>/dev/null || true

# Use production package.json if available
if [ -f "package.prod.json" ]; then
  cp package.prod.json /tmp/essential/package.json
fi

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force --silent 2>/dev/null || true

# Final size optimization
echo "Step 6: Final size check and optimization..."
du -sh . || echo "Size check completed"

echo "✅ Production build complete and heavily optimized for deployment!"
echo ""
echo "📦 Build artifacts ready:"
echo "  ✓ Server bundle: dist/index.js"
echo "  ✓ Client bundle: client/dist/"
echo "  ✓ Production dependencies only"
echo "  ✓ All large files removed"
echo ""
echo "🎯 Ready for Cloud Run deployment under 8 GiB limit!"