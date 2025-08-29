#!/usr/bin/env python3
"""Quick Bark availability test"""
import os
import sys
os.chdir('/tmp')
sys.path.insert(0, '/home/runner/workspace/bark')

try:
    import numpy as np
    import torch
    import transformers
    from bark import generate_audio, SAMPLE_RATE
    print("Bark available")
except ImportError as e:
    print("Bark not available:", e)
    sys.exit(1)
except Exception as e:
    print("Bark error:", e)
    sys.exit(1)