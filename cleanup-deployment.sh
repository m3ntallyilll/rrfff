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
rm -rf dist/ build/ .tmp/

# Remove logs
echo "Removing log files..."
rm -f *.log

# Clean node_modules and reinstall production only
echo "Cleaning node_modules..."
rm -rf node_modules/
echo "Installing production dependencies..."
npm ci --only=production

echo "✅ Deployment cleanup complete!"
echo "📊 Current project size:"
du -sh .