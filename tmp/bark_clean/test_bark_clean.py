#!/usr/bin/env python3
"""Clean Bark test without path conflicts"""
import sys
import os

# Add workspace bark to path
workspace_bark = "/home/runner/workspace/bark"
if workspace_bark not in sys.path:
    sys.path.insert(0, workspace_bark)

def test_bark():
    try:
        print("Testing Bark TTS from clean environment...")
        
        # Import required packages
        import numpy as np
        print(f"✅ numpy {np.__version__}")
        
        import torch
        print(f"✅ torch {torch.__version__}")
        
        import transformers
        print("✅ transformers")
        
        from bark import generate_audio, SAMPLE_RATE
        print(f"✅ Bark available! Sample rate: {SAMPLE_RATE}")
        
        # Test minimal generation
        print("Generating test audio...")
        text = "Yo, this is a test from the rap battle system!"
        audio_array = generate_audio(text)
        
        print(f"✅ Audio generated: {len(audio_array)} samples")
        print(f"Duration: {len(audio_array) / SAMPLE_RATE:.2f} seconds")
        
        # Save test file
        from scipy.io.wavfile import write as write_wav
        output_file = "/home/runner/workspace/temp_audio/bark_test_success.wav"
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
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
    success = test_bark()
    sys.exit(0 if success else 1)