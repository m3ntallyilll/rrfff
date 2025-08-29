#!/bin/bash
# Additional optimization script specifically for cloud deployment
set -e

echo "☁️ Optimizing for cloud deployment..."

# Remove all Python-related files and directories
echo "Removing Python dependencies..."
rm -rf .pythonlibs/ .uv/ __pycache__/ *.pyc *.pyo *.pyd
find . -name "*.py" -delete 2>/dev/null || true
rm -f pyproject.toml

# Remove all ML model files and directories
echo "Removing ML models and large binaries..."
rm -rf ARTalk/ bark/ MuseTalk/
find . -name "*.pth" -delete 2>/dev/null || true
find . -name "*.bin" -delete 2>/dev/null || true
find . -name "*.safetensors" -delete 2>/dev/null || true
find . -name "*.onnx" -delete 2>/dev/null || true

# Remove large media files
echo "Removing large media files..."
find . -size +50M -delete 2>/dev/null || true
find . -name "*.wav" -delete 2>/dev/null || true
find . -name "*.mp3" -delete 2>/dev/null || true
find . -name "*.mp4" -delete 2>/dev/null || true

# Remove development and test files
echo "Removing development files..."
rm -rf test/ tests/ __tests__/ coverage/
find . -name "*.test.*" -delete 2>/dev/null || true
find . -name "*.spec.*" -delete 2>/dev/null || true

# Remove documentation and examples
echo "Removing documentation..."
rm -rf docs/ documentation/ examples/ demo/
find . -name "README*" -delete 2>/dev/null || true
find . -name "*.md" -delete 2>/dev/null || true

# Remove build artifacts and cache
echo "Removing build artifacts..."
rm -rf .cache/ .tmp/ .vite/ dist/assets/*.map
find . -name "*.map" -delete 2>/dev/null || true

# Final cleanup - remove empty directories
echo "Removing empty directories..."
find . -type d -empty -delete 2>/dev/null || true

echo "📊 Optimized size:"
du -sh .
echo "✅ Cloud optimization complete!"