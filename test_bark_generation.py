#!/usr/bin/env python3
"""Test Bark TTS generation with proper error handling"""
import os
import sys
os.chdir('/tmp')
sys.path.insert(0, '/home/runner/workspace/bark')

try:
    import numpy as np
    import torch
    from bark import generate_audio, SAMPLE_RATE
    from scipy.io.wavfile import write as write_wav
    
    print("✅ All imports successful")
    print(f"Sample rate: {SAMPLE_RATE}")
    
    # Test generation
    text = "Yo, this is MC Razor spitting fire!"
    print(f"Generating audio for: {text}")
    
    audio = generate_audio(
        text,
        history_prompt="v2/en_speaker_6",
        text_temp=0.7,
        waveform_temp=0.7,
        silent=False
    )
    
    # Save audio
    output_path = "/home/runner/workspace/test_audio_output.wav"
    write_wav(output_path, SAMPLE_RATE, audio)
    
    file_size = os.path.getsize(output_path)
    duration = len(audio) / SAMPLE_RATE
    
    print(f"✅ Audio generated successfully!")
    print(f"File: {output_path}")
    print(f"Size: {file_size} bytes")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()