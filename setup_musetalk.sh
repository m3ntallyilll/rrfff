#!/bin/bash
# MuseTalk Setup Script for Rap Battle Game
# Based on MuseTalk 1.5 installation guide

set -e

echo "🎭 Setting up MuseTalk for Rap Battle Game"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create MuseTalk directory
if [ ! -d "MuseTalk" ]; then
    echo "📦 Cloning MuseTalk repository..."
    git clone https://github.com/TMElyralab/MuseTalk.git
    cd MuseTalk
else
    echo "📦 MuseTalk directory already exists"
    cd MuseTalk
fi

# Check Python version
echo "🐍 Checking Python version..."
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' || echo "0.0")
required_version="3.8"

if [ "$(echo "$python_version $required_version" | awk '{print ($1 >= $2)}')" = "1" ]; then
    echo "✅ Python $python_version is compatible"
else
    echo "❌ Python $python_version is too old. Please install Python 3.8+ (recommended: 3.10)"
    exit 1
fi

# Create conda environment (if conda is available)
if command -v conda &> /dev/null; then
    echo "🐍 Setting up conda environment..."
    if ! conda info --envs | grep -q "MuseTalk"; then
        conda create -n MuseTalk python=3.10 -y
    fi
    echo "To activate: conda activate MuseTalk"
else
    echo "⚠️  Conda not found - using system Python"
fi

# Check for CUDA
echo "🔥 Checking CUDA availability..."
if command -v nvcc &> /dev/null; then
    cuda_version=$(nvcc --version | grep -oP 'V\K[0-9]+\.[0-9]+' || echo "unknown")
    echo "✅ CUDA $cuda_version found"
else
    echo "⚠️  CUDA not found - will use CPU (slower)"
fi

# Install PyTorch
echo "🔧 Installing PyTorch..."
if command -v nvcc &> /dev/null; then
    # CUDA available
    pip3 install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cu118
else
    # CPU only
    pip3 install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cpu
fi

# Install dependencies
echo "🔧 Installing MuseTalk dependencies..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
else
    echo "⚠️  requirements.txt not found - installing basic dependencies"
    pip3 install opencv-python diffusers mmcv-full mmdet mmpose
fi

# Install MMLab packages
echo "🔧 Installing MMLab packages..."
pip3 install --no-cache-dir -U openmim
python3 -m mim install mmengine
python3 -m mim install "mmcv==2.0.1"
python3 -m mim install "mmdet==3.1.0" 
python3 -m mim install "mmpose==1.1.0"

# Setup FFmpeg
echo "🎬 Setting up FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg already installed"
else
    echo "📥 FFmpeg not found - please install it:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/"
fi

# Download model weights
echo "🔽 Downloading MuseTalk model weights..."
if [ -f "download_weights.sh" ]; then
    chmod +x download_weights.sh
    ./download_weights.sh
else
    echo "⚠️  download_weights.sh not found"
    echo "Please download models manually from the MuseTalk repository"
fi

# Verify installation
echo "✅ Verifying MuseTalk installation..."
if [ -d "models/musetalkV15" ] && [ -f "models/musetalkV15/unet.pth" ]; then
    echo "✅ MuseTalk 1.5 models found"
else
    echo "⚠️  MuseTalk models not found - please run download_weights.sh"
fi

echo ""
echo "🎉 MuseTalk setup complete!"
echo ""
echo "Next steps:"
echo "1. If using conda: conda activate MuseTalk"
echo "2. Test the installation: python -m scripts.inference --help"
echo "3. The rap battle game will automatically detect MuseTalk availability"
echo ""
echo "🎤 Ready for epic rap battles with real-time lip sync!"