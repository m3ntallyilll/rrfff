#!/bin/bash
# Production build script with size optimization
set -e

echo "🚀 Starting production build with size optimization..."

# Run the standard build first
echo "Building application..."
npm run build

# Run deployment cleanup
echo "Running deployment cleanup..."
chmod +x cleanup-deployment.sh
./cleanup-deployment.sh

# Additional size optimizations
echo "Performing additional optimizations..."

# Remove source files after build (keep only dist)
echo "Removing source files..."
rm -rf client/src/
rm -rf server/ 
# Keep server/index.ts if needed for reference, but remove others
find server/ -name "*.ts" ! -name "index.ts" -delete 2>/dev/null || true

# Minimize package.json for production
echo "Optimizing package.json for production..."
if [ -f "package.prod.json" ]; then
  cp package.prod.json package.json
fi

# Final size check
echo "📊 Final production build size:"
du -sh .
echo "✅ Production build complete and optimized!"