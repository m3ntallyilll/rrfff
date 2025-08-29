#!/usr/bin/env python3
"""Optimize Bark TTS for CPU performance"""
import os
import sys
os.chdir('/tmp')
sys.path.insert(0, '/home/runner/workspace/bark')

try:
    import torch
    import numpy as np
    
    print("=== Optimizing Bark for CPU Performance ===")
    
    # Set CPU optimization flags
    torch.set_num_threads(4)  # Use 4 CPU threads
    torch.backends.cudnn.enabled = False  # Disable CUDNN
    
    # Set environment variables for CPU optimization
    os.environ["OMP_NUM_THREADS"] = "4"
    os.environ["MKL_NUM_THREADS"] = "4"
    os.environ["OPENBLAS_NUM_THREADS"] = "4"
    
    print("✅ CPU optimization settings applied")
    print(f"PyTorch threads: {torch.get_num_threads()}")
    print(f"OMP threads: {os.environ.get('OMP_NUM_THREADS', 'default')}")
    
    # Test optimized generation
    from bark import generate_audio, SAMPLE_RATE
    from scipy.io.wavfile import write as write_wav
    import time
    
    text = "Quick CPU test!"
    print(f"Testing optimized generation: {text}")
    
    start_time = time.time()
    audio = generate_audio(
        text,
        history_prompt="v2/en_speaker_0",
        text_temp=0.5,
        waveform_temp=0.5,
        silent=False
    )
    end_time = time.time()
    
    # Save test audio
    output_path = "/home/runner/workspace/cpu_optimized_test.wav"
    write_wav(output_path, SAMPLE_RATE, audio)
    
    generation_time = end_time - start_time
    duration = len(audio) / SAMPLE_RATE
    
    print(f"✅ Optimized CPU Results:")
    print(f"Generation time: {generation_time:.2f}s")
    print(f"Audio duration: {duration:.2f}s")
    print(f"File size: {os.path.getsize(output_path)} bytes")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()