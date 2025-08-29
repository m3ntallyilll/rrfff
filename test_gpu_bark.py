#!/usr/bin/env python3
"""Test Bark TTS with GPU acceleration"""
import os
import sys
os.chdir('/tmp')
sys.path.insert(0, '/home/runner/workspace/bark')

try:
    import torch
    import numpy as np
    from bark import generate_audio, SAMPLE_RATE
    from scipy.io.wavfile import write as write_wav
    
    print("=== GPU Test for Bark TTS ===")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU count: {torch.cuda.device_count()}")
        print(f"GPU name: {torch.cuda.get_device_name(0)}")
        print(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # Clear GPU memory
        torch.cuda.empty_cache()
        print("GPU cache cleared")
    
    # Test generation with GPU
    text = "Yo, testing GPU acceleration for rap battles!"
    print(f"\nGenerating: {text}")
    
    import time
    start_time = time.time()
    audio = generate_audio(
        text,
        history_prompt="v2/en_speaker_6",
        text_temp=0.7,
        waveform_temp=0.7,
        silent=False
    )
    end_time = time.time()
    
    # Save audio
    output_path = "/home/runner/workspace/gpu_test_audio.wav"
    write_wav(output_path, SAMPLE_RATE, audio)
    
    file_size = os.path.getsize(output_path)
    duration = len(audio) / SAMPLE_RATE
    generation_time = end_time - start_time
    
    print(f"\n✅ GPU Test Results:")
    print(f"Generation time: {generation_time:.2f} seconds")
    print(f"Audio duration: {duration:.2f} seconds")
    print(f"File size: {file_size} bytes")
    print(f"Speed ratio: {duration/generation_time:.2f}x realtime")
    
except ImportError as e:
    print(f"Import error: {e}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()