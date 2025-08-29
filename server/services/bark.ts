import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface BarkVoiceConfig {
  historyPrompt: string;
  description: string;
  temperature: number;
}

// Voice configurations for different rap battle characters
const VOICE_CONFIGS: Record<string, BarkVoiceConfig> = {
  'mc_razor': {
    historyPrompt: 'v2/en_speaker_6', // Female speaker with attitude
    description: 'Aggressive female rapper voice',
    temperature: 0.8
  },
  'mc_venom': {
    historyPrompt: 'v2/en_speaker_9', // Deep male speaker
    description: 'Deep male rapper voice',
    temperature: 0.7
  },
  'mc_silk': {
    historyPrompt: 'v2/en_speaker_0', // Smooth male speaker
    description: 'Smooth male rapper voice',
    temperature: 0.6
  }
};

export class BarkTTS {
  private readonly outputDir: string;
  private isModelPreloaded = false;
  private isBarkAvailable = false;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp_audio');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Check if Bark is available
    this.checkBarkAvailability();
  }

  /**
   * Check if Bark dependencies are available
   */
  private async checkBarkAvailability(): Promise<void> {
    try {
      const testScript = `
import sys
sys.path.insert(0, './bark')
try:
    from bark import generate_audio
    print("Bark available")
except ImportError as e:
    print(f"Bark not available: {e}")
    sys.exit(1)
      `;

      const { stdout, stderr } = await execAsync(`python3 -c "${testScript}"`);
      
      if (stdout.includes('Bark available')) {
        this.isBarkAvailable = true;
        console.log('✅ Bark TTS system available');
      } else {
        console.log('📢 Bark TTS not available, will use fallback system');
      }
    } catch (error) {
      console.log('📢 Bark TTS dependencies not found, using fallback system');
      this.isBarkAvailable = false;
    }
  }

  /**
   * Preload Bark models for faster generation
   */
  private async preloadModels(): Promise<void> {
    if (this.isModelPreloaded) return;

    console.log('🐶 Preloading Bark models...');
    
    try {
      const preloadScript = `
import sys
sys.path.insert(0, './bark')
from bark import preload_models
preload_models()
print("Bark models preloaded successfully!")
      `;

      const { stdout, stderr } = await execAsync(`python3 -c "${preloadScript}"`);
      
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`Model preload error: ${stderr}`);
      }
      
      console.log('✅ Bark models preloaded:', stdout.trim());
      this.isModelPreloaded = true;
    } catch (error) {
      console.error('❌ Failed to preload Bark models:', error);
      throw error;
    }
  }

  /**
   * Generate audio from text using Bark TTS (with fallback)
   */
  async generateAudio(text: string, characterId: string): Promise<{ audioPath: string; fileSize: number }> {
    // If Bark is not available, create a placeholder that indicates fallback is needed
    if (!this.isBarkAvailable) {
      console.log(`📢 Bark not available for ${characterId}, will use Typecast fallback`);
      throw new Error('BARK_NOT_AVAILABLE'); // Special error for fallback handling
    }

    await this.preloadModels();

    const voiceConfig = VOICE_CONFIGS[characterId] || VOICE_CONFIGS['mc_venom'];
    const timestamp = Date.now();
    const filename = `bark_${characterId}_${timestamp}.wav`;
    const outputPath = path.join(this.outputDir, filename);

    console.log(`🎤 Generating Bark audio for ${characterId}: "${text.substring(0, 50)}..."`);

    try {
      // Clean text for rap battle context
      const cleanText = this.prepareRapText(text);
      
      const generationScript = `
import sys
sys.path.insert(0, './bark')
import numpy as np
from bark import SAMPLE_RATE, generate_audio
from scipy.io.wavfile import write as write_wav

# Text to generate
text = '''${cleanText}'''
history_prompt = "${voiceConfig.historyPrompt}"
temp = ${voiceConfig.temperature}

print(f"Generating audio with voice: {history_prompt}")
print(f"Text length: {len(text)} characters")
print(f"Temperature: {temp}")

# Generate audio
audio_array = generate_audio(
    text,
    history_prompt=history_prompt,
    text_temp=temp,
    waveform_temp=0.7,
    silent=False
)

# Save to file
write_wav("${outputPath}", SAMPLE_RATE, audio_array)

# Get file stats
import os
file_size = os.path.getsize("${outputPath}")
duration = len(audio_array) / SAMPLE_RATE

print(f"Audio generated successfully!")
print(f"File: ${filename}")
print(f"Size: {file_size} bytes")
print(f"Duration: {duration:.2f} seconds")
print(f"Sample rate: {SAMPLE_RATE} Hz")
      `;

      const { stdout, stderr } = await execAsync(`python3 -c "${generationScript}"`, {
        timeout: 120000 // 2 minute timeout
      });

      if (stderr && !stderr.includes('Warning') && !stderr.includes('UserWarning')) {
        console.error('Bark generation stderr:', stderr);
      }

      console.log('Bark generation output:', stdout);

      // Verify file was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Audio file was not generated');
      }

      const stats = fs.statSync(outputPath);
      const fileSize = stats.size;

      console.log(`✅ Bark audio generated: ${filename} (${fileSize} bytes)`);

      return {
        audioPath: outputPath,
        fileSize
      };

    } catch (error) {
      console.error(`❌ Bark generation failed for ${characterId}:`, error);
      throw new Error(`Failed to generate audio with Bark: ${error.message}`);
    }
  }

  /**
   * Prepare text for rap battle context
   */
  private prepareRapText(text: string): string {
    // Clean and format text for better rap delivery
    let cleanText = text
      .replace(/["""]/g, '"')
      .replace(/[''']/g, "'")
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Add rap battle context markers
    if (cleanText.length > 100) {
      // For longer texts, add natural pauses
      cleanText = cleanText.replace(/[.!?]/g, '$&... ');
    }

    // Ensure it sounds like a rap battle verse
    if (!cleanText.includes('[') && !cleanText.includes('♪')) {
      // Add subtle rap battle energy markers
      const intensity = Math.random() > 0.5 ? '[confident]' : '[aggressive]';
      cleanText = `${intensity} ${cleanText}`;
    }

    return cleanText;
  }

  /**
   * Clean up old audio files
   */
  async cleanup(olderThanMinutes: number = 30): Promise<void> {
    try {
      const files = fs.readdirSync(this.outputDir);
      const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('bark_') && file.endsWith('.wav')) {
          const filePath = path.join(this.outputDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up old Bark audio: ${file}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to cleanup Bark audio files:', error);
    }
  }

  /**
   * Get available voice configurations
   */
  getVoiceConfigs(): Record<string, BarkVoiceConfig> {
    return VOICE_CONFIGS;
  }
}

// Create singleton instance
export const barkTTS = new BarkTTS();

// Cleanup old files on startup
barkTTS.cleanup().catch(console.error);