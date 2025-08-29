#!/usr/bin/env python3
"""Bark TTS generation script"""
import os
import sys
import argparse

# Setup paths
os.chdir('/tmp')
sys.path.insert(0, '/home/runner/workspace/bark')

def generate_bark_audio(text, output_path, voice_prompt="v2/en_speaker_6", temperature=0.7):
    try:
        import numpy as np
        from bark import generate_audio, SAMPLE_RATE
        from scipy.io.wavfile import write as write_wav
        
        print(f"Generating audio with voice: {voice_prompt}")
        print(f"Text: {text[:50]}...")
        print(f"Temperature: {temperature}")
        
        # Generate audio
        audio_array = generate_audio(
            text,
            history_prompt=voice_prompt,
            text_temp=temperature,
            waveform_temp=0.7,
            silent=False
        )
        
        # Save to file
        write_wav(output_path, SAMPLE_RATE, audio_array)
        
        # Get file stats
        file_size = os.path.getsize(output_path)
        duration = len(audio_array) / SAMPLE_RATE
        
        print(f"SUCCESS")
        print(f"File: {output_path}")
        print(f"Size: {file_size} bytes")
        print(f"Duration: {duration:.2f} seconds")
        print(f"Sample rate: {SAMPLE_RATE} Hz")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate Bark TTS audio')
    parser.add_argument('text', help='Text to generate')
    parser.add_argument('output', help='Output file path')
    parser.add_argument('--voice', default='v2/en_speaker_6', help='Voice prompt')
    parser.add_argument('--temp', type=float, default=0.7, help='Temperature')
    
    args = parser.parse_args()
    generate_bark_audio(args.text, args.output, args.voice, args.temp)