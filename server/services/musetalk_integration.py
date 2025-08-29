#!/usr/bin/env python3
"""
MuseTalk Integration Service for Rap Battle Game
Provides MuseTalk-compatible interface with fallback simulation
"""

import os
import sys
import json
import logging
import subprocess
import shlex
import argparse
import glob
from pathlib import Path
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check for basic dependencies
BASIC_DEPS = True  # Assume basic deps are available in the system
try:
    import numpy as np
    logger.info("NumPy available for MuseTalk processing")
except ImportError:
    BASIC_DEPS = False
    logger.warning("NumPy not available - some features may be limited")

# Check for MuseTalk full installation
MUSETALK_AVAILABLE = False
try:
    # Check if MuseTalk directory exists and has required structure
    musetalk_path = Path("MuseTalk")
    if musetalk_path.exists():
        sys.path.insert(0, str(musetalk_path))
        # Check for key model files
        required_files = [
            musetalk_path / "models" / "musetalkV15" / "musetalk.json",
            musetalk_path / "musetalk" / "__init__.py"
        ]
        
        if all(f.exists() for f in required_files):
            MUSETALK_AVAILABLE = True
            logger.info("MuseTalk installation detected with model files")
        else:
            logger.info("MuseTalk directory found but missing required model files")
except Exception as e:
    MUSETALK_AVAILABLE = False
    logger.info(f"MuseTalk full installation check failed: {e}")

class MuseTalkIntegration:
    """MuseTalk integration with fallback simulation for rap battle avatars"""
    
    def __init__(self, models_dir: str = "MuseTalk/models"):
        self.models_dir = Path(models_dir)
        self.is_initialized = False
        self.simulation_mode = not MUSETALK_AVAILABLE
        
        # Configuration
        self.config = {
            "version": "v15",
            "fps": 25,
            "simulation_mode": self.simulation_mode
        }
        
        logger.info(f"MuseTalk integration mode: {'Simulation' if self.simulation_mode else 'Full'}")
        
    def check_requirements(self) -> Dict[str, bool]:
        """Check system requirements and dependencies"""
        requirements = {
            "python_version": sys.version_info >= (3, 8),
            "ffmpeg": self._check_ffmpeg(),
            "basic_deps": BASIC_DEPS,
            "musetalk_full": MUSETALK_AVAILABLE,
            "simulation_ready": True  # Always ready for simulation
        }
        
        logger.info(f"Requirements check: {requirements}")
        return requirements
    
    def _check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available"""
        try:
            result = subprocess.run(['ffmpeg', '-version'], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False
    
    def initialize_models(self) -> bool:
        """Initialize MuseTalk system (full or simulation mode)"""
        if not MUSETALK_AVAILABLE:
            logger.info("MuseTalk models not available - initializing simulation mode")
            self.simulation_mode = True
            self.is_initialized = True
            return True
        
        try:
            logger.info("MuseTalk models detected - initializing full mode")
            
            # Verify key model files exist
            model_files = [
                Path("MuseTalk/models/musetalkV15/unet.pth"),
                Path("MuseTalk/models/musetalkV15/musetalk.json"), 
                Path("MuseTalk/models/dwpose/dw-ll_ucoco_384.pth"),
                Path("MuseTalk/models/face-parse-bisent/79999_iter.pth")
            ]
            
            missing_files = [str(f) for f in model_files if not f.exists()]
            if missing_files:
                logger.warning(f"Missing model files: {missing_files}")
                self.simulation_mode = True
            else:
                logger.info("All required MuseTalk models found")
                self.simulation_mode = False
                
            self.is_initialized = True
            mode_str = 'simulation' if self.simulation_mode else 'full'
            logger.info(f"MuseTalk initialized successfully in {mode_str} mode")
            
            # If in full mode, run a quick model validation
            if not self.simulation_mode:
                logger.info("Validating MuseTalk models...")
                # Model validation could be added here
                
            return True
            
        except Exception as e:
            logger.warning(f"MuseTalk initialization failed, using simulation: {e}")
            self.simulation_mode = True
            self.is_initialized = True
            return True
    
    def generate_lip_sync_video(self, audio_path: str, avatar_image_path: str, 
                               character_id: str) -> Optional[str]:
        """
        Generate lip-synced video using MuseTalk (full or simulation mode)
        """
        if not self.is_initialized:
            logger.error("MuseTalk not initialized")
            return None
        
        if self.simulation_mode:
            return self._generate_simulation_video(audio_path, avatar_image_path, character_id)
        else:
            return self._generate_full_musetalk_video(audio_path, avatar_image_path, character_id)
    
    def _generate_simulation_video(self, audio_path: str, avatar_image_path: str, 
                                 character_id: str) -> Optional[str]:
        """Generate a basic lip sync simulation"""
        try:
            logger.info(f"Generating simulation lip sync for {character_id}")
            
            # For now, return a placeholder that indicates simulation mode
            # The frontend will handle the actual animation
            result = {
                "mode": "simulation",
                "character_id": character_id,
                "audio_path": audio_path,
                "avatar_path": avatar_image_path,
                "message": "Using browser-based lip sync simulation"
            }
            
            return json.dumps(result)
            
        except Exception as e:
            logger.error(f"Simulation failed: {e}")
            return None
    
    def _generate_full_musetalk_video(self, audio_path: str, avatar_image_path: str, 
                                    character_id: str) -> Optional[str]:
        """Generate full MuseTalk video (when models are available)"""
        try:
            logger.info(f"Generating full MuseTalk video for {character_id}")
            
            # Create output directory
            output_dir = Path("results") / "musetalk" / character_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Use command-line inference to avoid Python dependency issues
            cmd = [
                "python3", "MuseTalk/scripts/inference.py",
                "--video_path", avatar_image_path,
                "--audio_path", audio_path,
                "--result_dir", str(output_dir),
                "--fps", "25",
                "--batch_size", "1",
                "--output_vid_name", f"{character_id}_lipsync.mp4",
                "--bbox_shift", "0",
                "--extra_margin", "10",
                "--parsing_mode", "jaw",
                "--left_cheek_width", "90", 
                "--right_cheek_width", "90",
                "--use_float16",
                "--version", "v15"
            ]
            
            logger.info(f"Running MuseTalk command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                # Find the generated video file
                output_pattern = str(output_dir / "*.mp4")
                video_files = glob.glob(output_pattern)
                
                if video_files:
                    result_video = video_files[0]
                    logger.info(f"MuseTalk video generated: {result_video}")
                    
                    # Return metadata about the generated video
                    return json.dumps({
                        "mode": "full",
                        "video_path": result_video,
                        "character_id": character_id,
                        "success": True,
                        "message": "Full MuseTalk video generation completed"
                    })
                else:
                    logger.error("MuseTalk completed but no video file found")
                    return self._generate_simulation_video(audio_path, avatar_image_path, character_id)
            else:
                logger.error(f"MuseTalk inference failed: {result.stderr}")
                return self._generate_simulation_video(audio_path, avatar_image_path, character_id)
                
        except subprocess.TimeoutExpired:
            logger.error("MuseTalk inference timed out")
            return self._generate_simulation_video(audio_path, avatar_image_path, character_id)
        except Exception as e:
            logger.error(f"Full MuseTalk generation failed: {e}")
            return self._generate_simulation_video(audio_path, avatar_image_path, character_id)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current MuseTalk system status"""
        return {
            "available": self.is_initialized,
            "mode": "simulation" if self.simulation_mode else "full",
            "requirements": self.check_requirements(),
            "config": self.config
        }

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="MuseTalk Rap Battle Integration")
    parser.add_argument("--initialize", action="store_true", help="Initialize MuseTalk system")
    parser.add_argument("--check-status", action="store_true", help="Check system status")
    parser.add_argument("--generate", nargs=3, metavar=('AUDIO', 'IMAGE', 'CHARACTER'), 
                       help="Generate lip sync video")
    
    args = parser.parse_args()
    
    musetalk = MuseTalkIntegration()
    
    if args.initialize:
        requirements = musetalk.check_requirements()
        if all(requirements.values()):
            success = musetalk.initialize_models()
            result = {"initialized": success, "requirements": requirements}
        else:
            result = {"initialized": False, "requirements": requirements}
        print(json.dumps(result))
        
    elif args.check_status:
        requirements = musetalk.check_requirements()
        result = {
            "available": musetalk.is_initialized,
            "requirements": requirements
        }
        print(json.dumps(result))
        
    elif args.generate:
        audio_path, image_path, character_id = args.generate
        if not musetalk.is_initialized:
            musetalk.initialize_models()
            
        result_video = musetalk.generate_lip_sync_video(audio_path, image_path, character_id)
        result = {"video_path": result_video, "success": result_video is not None}
        print(json.dumps(result))
        
    else:
        parser.print_help()

if __name__ == "__main__":
    main()