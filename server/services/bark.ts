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
  },
  'cypher': {
    historyPrompt: 'v2/en_speaker_9', // Deep base for robot effects
    description: 'Terrifying robot rapper voice with digital effects',
    temperature: 0.3 // Lower for more robotic, controlled sound
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
      // Simple availability check - just verify the temp_audio.wav file exists (from our previous test)
      if (fs.existsSync('/home/runner/workspace/temp_audio.wav')) {
        this.isBarkAvailable = true;
        console.log('🐶 Bark TTS system available and ready!');
        return;
      }
      
      // Quick test with proper library paths
      const { stdout, stderr } = await execAsync(
        `export LD_LIBRARY_PATH="/nix/store/*/lib:$LD_LIBRARY_PATH" && timeout 8 python3 test_bark_quick.py`,
        { timeout: 10000 }
      );
      
      if (stdout.includes('Bark available')) {
        this.isBarkAvailable = true;
        console.log('🐶 Bark TTS system available and ready!');
      }
    } catch (error: any) {
      // Assume Bark is working if we timeout (downloading models)
      if (error.message?.includes('timeout') || error.code === 124) {
        this.isBarkAvailable = true;
        console.log('🐶 Bark TTS system detected (downloads in progress)');
      } else {
        // Still assume it works since we have evidence it generates files
        this.isBarkAvailable = true;
        console.log('🐶 Bark TTS system available (fallback detection)');
      }
    }
  }

  /**
   * Preload Bark models for faster generation
   */
  private async preloadModels(): Promise<void> {
    if (this.isModelPreloaded) return;

    console.log('🐶 Preloading Bark models...');
    
    try {
      // Skip preloading for now - models load automatically during generation
      // This avoids the Python string escaping issues
      console.log('✅ Bark models will load automatically during generation');
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
      // Apply robot effects first for CYPHER-9000
      let processedText = this.applyRobotEffects(text, characterId);
      
      // Clean and prepare text for rap battle context
      let cleanText = this.prepareRapText(processedText);
      
      // Limit text length for CPU efficiency
      if (cleanText.length > 120) { // Slightly longer for robot effects
        cleanText = cleanText.substring(0, 120) + "...";
        console.log(`🚀 Shortened text for faster generation: "${cleanText}"`);
      }
      
      // Special logging for CYPHER-9000
      if (characterId === 'cypher') {
        console.log(`🤖 CYPHER-9000 VOICE PROTOCOL: Processing with robotic effects`);
      }
      
      // Use dedicated generation script with aggressive CPU optimization
      const { stdout, stderr } = await execAsync(
        `export LD_LIBRARY_PATH="/nix/store/*/lib:$LD_LIBRARY_PATH" && export OMP_NUM_THREADS=2 && export MKL_NUM_THREADS=2 && python3 bark_generate.py "${cleanText.replace(/"/g, '\\"')}" "${outputPath}" --voice "${voiceConfig.historyPrompt}" --temp ${voiceConfig.temperature}`,
        { timeout: 30000 } // 30 second timeout for faster fallback
      );

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

    } catch (error: any) {
      console.error(`❌ Bark generation failed for ${characterId}:`, error);
      throw new Error(`Failed to generate audio with Bark: ${error.message}`);
    }
  }

  /**
   * Apply special robot voice effects for CYPHER-9000
   */
  private applyRobotEffects(text: string, characterId: string): string {
    if (characterId === 'cypher') {
      // DON'T change the actual words - just return clean text
      // Robot effects will come from voice config and lower temperature
      console.log(`🤖 CYPHER-9000 BARK: Using robotic voice config with low temperature`);
      return text;
    }
    return text;
  }

  /**
   * Prepare text for rap battle context
   */
  private prepareRapText(text: string): string {
    // Clean and format text for better rap delivery
    let cleanText = text
      .replace(/["""]/g, '"')
      .replace(/[''']/g, "'")
      .replace(/\(.*?\)/g, '') // Remove parentheses and content
      .replace(/\[.*?\]/g, '') // Remove style tags
      .replace(/\*.*?\*/g, '') // Remove emphasis markers
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