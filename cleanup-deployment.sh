#!/bin/bash
# Deployment cleanup script
# Removes large files and directories that shouldn't be included in deployment

echo "🧹 Cleaning up for deployment..."

# Remove ML model directories
echo "Removing ML model directories..."
rm -rf ARTalk/ MuseTalk/ bark/

# Remove Python cache and libraries
echo "Removing Python cache and libraries..."
rm -rf .pythonlibs/ .cache/ .uv/ __pycache__/
find . -name "*.pyc" -delete
find . -name "*.pyo" -delete
find . -name "*.pyd" -delete

# Remove temporary files
echo "Removing temporary files..."
rm -rf temp_audio/ tmp/
rm -f *.wav *.mp3 *.mp4
rm -f temp_audio.wav

# Remove development files
echo "Removing development files..."
rm -f test_*.py test_*.js setup_*.py install_*.py optimize_*.py generate_*.py
rm -f emergency_*.ts final_*.js
rm -f battle_rap_training_data.json battle_rap_training_data.jsonl

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf dist/ build/ .tmp/ .vite/ .next/

# Remove additional large files and directories
echo "Removing additional large files..."
rm -rf .git/ .github/ .vscode/ .idea/
rm -rf notebooks/ docs/ documentation/
rm -rf coverage/ test-results/ playwright-report/

# Remove source maps and development assets
echo "Removing source maps and development assets..."
find . -name "*.map" -delete
find . -name "*.d.ts" -delete 2>/dev/null || true

# Remove TypeScript cache and config
echo "Removing TypeScript build cache..."
rm -f tsconfig.tsbuildinfo *.tsbuildinfo

# Remove logs
echo "Removing log files..."
rm -f *.log

# Clean node_modules and reinstall production only
echo "Cleaning node_modules..."
rm -rf node_modules/

# Use production package.json if it exists
if [ -f "package.prod.json" ]; then
  echo "Using production package.json..."
  mv package.json package.dev.json
  mv package.prod.json package.json
  echo "Installing production dependencies..."
  npm ci --only=production --no-audit --no-fund
  # Keep both files for reference
  mv package.json package.prod.json
  mv package.dev.json package.json
else
  echo "Installing production dependencies..."
  npm ci --only=production --no-audit --no-fund
fi

echo "✅ Deployment cleanup complete!"
echo "📊 Current project size:"
du -sh .