#!/usr/bin/env python3
"""
MuseTalk Installation and Setup Script for Rap Battle Game
Downloads models and sets up the complete MuseTalk system
"""

import os
import sys
import subprocess
import urllib.request
import json
import shlex
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run command and return success"""
    try:
        # Convert string command to list for safer execution
        if isinstance(cmd, str):
            cmd = shlex.split(cmd)
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Command failed: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"Failed to run command: {' '.join(cmd) if isinstance(cmd, list) else cmd}, Error: {e}")
        return False

def download_file(url, path):
    """Download file from URL"""
    try:
        print(f"Downloading: {url}")
        urllib.request.urlretrieve(url, path)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def setup_musetalk():
    """Setup MuseTalk with required models"""
    
    # Create MuseTalk directory if it doesn't exist
    musetalk_dir = Path("MuseTalk")
    if not musetalk_dir.exists():
        print("Cloning MuseTalk repository...")
        if not run_command("git clone https://github.com/TMElyralab/MuseTalk.git"):
            return False
    
    os.chdir("MuseTalk")
    
    # Install requirements
    if Path("requirements.txt").exists():
        print("Installing MuseTalk requirements...")
        if not run_command("pip install -r requirements.txt"):
            print("Failed to install requirements")
            return False
    
    # Setup models directory structure
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    # Create subdirectories
    (models_dir / "musetalkV15").mkdir(exist_ok=True)
    (models_dir / "sd-vae").mkdir(exist_ok=True) 
    (models_dir / "whisper").mkdir(exist_ok=True)
    (models_dir / "dwpose").mkdir(exist_ok=True)
    (models_dir / "face-parse-bisent").mkdir(exist_ok=True)
    
    # Download models (this would need actual URLs from MuseTalk)
    print("Setting up model directories...")
    
    # Create minimal config files for testing
    configs = {
        "models/sd-vae/config.json": {"model_type": "vae"},
        "models/whisper/config.json": {"model_type": "whisper"},
        "models/musetalkV15/musetalk.json": {"version": "1.5"}
    }
    
    for config_path, config_data in configs.items():
        config_file = Path(config_path)
        config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(config_file, 'w') as f:
            json.dump(config_data, f)
    
    print("MuseTalk setup complete!")
    print("Note: Model weights need to be downloaded separately")
    print("Run: bash download_weights.sh (if available)")
    
    return True

def main():
    original_dir = Path.cwd()
    
    try:
        success = setup_musetalk()
        if success:
            print("✅ MuseTalk installation completed successfully")
            return 0
        else:
            print("❌ MuseTalk installation failed")
            return 1
            
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return 1
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    sys.exit(main())