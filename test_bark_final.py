#!/usr/bin/env python3
"""Final Bark test - avoiding numpy conflicts"""
import sys
import os

# Move to a clean directory first to avoid numpy source conflicts
clean_dir = "/tmp/bark_test_clean"
os.makedirs(clean_dir, exist_ok=True)
os.chdir(clean_dir)

# Add workspace bark to path
workspace_bark = "/home/runner/workspace/bark"
if workspace_bark not in sys.path:
    sys.path.insert(0, workspace_bark)

def test_bark_tts():
    try:
        print("🐶 Testing Bark TTS from clean directory...")
        
        # Import required packages
        import numpy as np
        print(f"✅ numpy {np.__version__}")
        
        import torch
        print(f"✅ torch {torch.__version__}")
        
        from bark import generate_audio, SAMPLE_RATE
        print(f"✅ Bark available! Sample rate: {SAMPLE_RATE}")
        
        # Test minimal generation
        print("Generating test rap audio...")
        text = "Yo, this is MC Test coming at you with Bark TTS!"
        audio_array = generate_audio(text)
        
        print(f"✅ Audio generated: {len(audio_array)} samples")
        print(f"Duration: {len(audio_array) / SAMPLE_RATE:.2f} seconds")
        
        # Save test file
        from scipy.io.wavfile import write as write_wav
        output_file = "/home/runner/workspace/temp_audio/bark_test_success.wav"
        os.makedirs("/home/runner/workspace/temp_audio", exist_ok=True)
        write_wav(output_file, SAMPLE_RATE, audio_array)
        
        file_size = os.path.getsize(output_file)
        print(f"✅ Saved to: {output_file} ({file_size} bytes)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_bark_tts()
    if success:
        print("🎉 Bark TTS is working!")
    else:
        print("💔 Bark TTS failed")
    sys.exit(0 if success else 1)