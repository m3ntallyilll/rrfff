#!/usr/bin/env python3
"""Test fast Bark TTS generation"""
import os
import sys
import time
os.chdir('/tmp')
sys.path.insert(0, '/home/runner/workspace/bark')

try:
    import torch
    import numpy as np
    from bark import generate_audio, SAMPLE_RATE
    from scipy.io.wavfile import write as write_wav
    
    # CPU optimizations
    torch.set_num_threads(2)  # Use fewer threads
    os.environ["OMP_NUM_THREADS"] = "2"
    
    print("🚀 Fast Bark Test")
    
    # Very short text for speed test
    text = "Yo, quick test!"
    print(f"Generating: {text}")
    
    start_time = time.time()
    audio = generate_audio(
        text,
        history_prompt="v2/en_speaker_0",  # Simple voice
        text_temp=0.5,  # Lower temperature
        waveform_temp=0.5,
        silent=True
    )
    end_time = time.time()
    
    # Save test audio
    output_path = "/home/runner/workspace/fast_test.wav"
    write_wav(output_path, SAMPLE_RATE, audio)
    
    generation_time = end_time - start_time
    file_size = os.path.getsize(output_path)
    
    print(f"✅ Fast generation completed!")
    print(f"Time: {generation_time:.1f}s")
    print(f"File: {file_size} bytes")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()