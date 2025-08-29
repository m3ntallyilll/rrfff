#!/usr/bin/env python3
"""
Setup script for Bark TTS environment
"""
import subprocess
import sys
import os

def install_packages():
    packages = [
        'numpy',
        'scipy', 
        'torch',
        'torchaudio',
        'transformers',
        'huggingface-hub',
        'encodec',
        'tokenizers',
        'tqdm',
        'funcy'
    ]
    
    for package in packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package, '--user'])
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            
def test_imports():
    try:
        print("Testing imports...")
        import numpy as np
        print("✅ numpy")
        
        import scipy
        print("✅ scipy")
        
        import torch
        print("✅ torch")
        
        import transformers
        print("✅ transformers")
        
        # Test Bark
        sys.path.insert(0, './bark')
        from bark import generate_audio, SAMPLE_RATE
        print("✅ Bark imports successfully!")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

if __name__ == "__main__":
    print("🐶 Setting up Bark TTS environment...")
    
    # First try to test existing imports
    if test_imports():
        print("✅ Bark environment ready!")
        sys.exit(0)
    
    print("Installing packages...")
    install_packages()
    
    # Test again
    if test_imports():
        print("✅ Bark environment ready!")
    else:
        print("❌ Setup failed - some dependencies missing")
        sys.exit(1)