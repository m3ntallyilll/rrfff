import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface OpenAITTSOptions {
  apiKey: string;
  voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
  characterGender?: 'male' | 'female';
}

export class OpenAITTSService {
  private openai: OpenAI;
  private outputDir: string;

  constructor(options: OpenAITTSOptions) {
    this.openai = new OpenAI({
      apiKey: options.apiKey,
    });
    
    this.outputDir = path.join(process.cwd(), 'temp_audio');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private getVoiceForCharacter(characterId: string, gender: string = 'male'): string {
    // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
    const maleVoices = ['onyx', 'echo', 'fable'];
    const femaleVoices = ['alloy', 'nova', 'shimmer'];
    
    const voiceMap: Record<string, string> = {
      'razor': 'nova',    // Female, sharp
      'venom': 'onyx',    // Male, deep
      'silk': 'fable',    // Male, smooth
    };

    return voiceMap[characterId] || (gender === 'female' ? 'nova' : 'onyx');
  }

  private getInstructionsForStyle(voiceStyle: string, characterName: string): string {
    const styleInstructions: Record<string, string> = {
      'aggressive': `Speak aggressively with intense energy like a battle rapper delivering hard-hitting bars. Use a confrontational tone with sharp emphasis on punchlines.`,
      'confident': `Speak with supreme confidence and swagger like a seasoned MC who owns the stage. Project authority and charisma in every word.`,
      'smooth': `Deliver with smooth, flowing cadence like a skilled lyricist. Maintain cool composure with rhythmic precision.`,
      'intense': `Speak with raw intensity and passion like you're in a heated battle. Every word should carry weight and emotion.`,
      'playful': `Use a playful, cocky delivery style with attitude. Mix confidence with street-smart wordplay energy.`
    };

    const baseInstruction = styleInstructions[voiceStyle] || styleInstructions['confident'];
    return `${baseInstruction} You are ${characterName}, a battle rapper with distinct personality.`;
  }

  async generateTTS(
    text: string,
    characterId: string,
    options: {
      voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
      characterName?: string;
      gender?: string;
      speedMultiplier?: number;
    } = {}
  ): Promise<{ audioUrl: string; duration: number }> {
    console.log(`🎤 OpenAI TTS generating for ${characterId}: "${text.substring(0, 50)}..."`);
    
    try {
      const voice = this.getVoiceForCharacter(characterId, options.gender);
      const voiceStyle = options.voiceStyle || 'confident';
      const characterName = options.characterName || `MC ${characterId}`;
      const instructions = this.getInstructionsForStyle(voiceStyle, characterName);
      
      console.log(`🎯 Using OpenAI voice: ${voice} with style: ${voiceStyle}`);
      
      // Clean text for better TTS
      const cleanText = text
        .replace(/\[.*?\]/g, '') // Remove style tags
        .replace(/\(.*?\)/g, '') // Remove parentheses and content
        .replace(/\*.*?\*/g, '') // Remove emphasis markers
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();

      /*
      The newest OpenAI model is "gpt-4o-mini-tts" which was released in 2025 with steerability features.
      This model supports instructable speech where you can control tone, emotion, and speaking style.
      */
      const response = await this.openai.audio.speech.create({
        model: "gpt-4o-mini-tts", // Latest 2025 model with steerability
        voice: voice as any,
        input: cleanText,
        instructions: instructions, // Steerability feature for authentic rapper delivery
        response_format: 'wav',
        speed: options.speedMultiplier || 1.0
      });

      const timestamp = Date.now();
      const filename = `openai_tts_${characterId}_${timestamp}.wav`;
      const outputPath = path.join(this.outputDir, filename);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ OpenAI TTS success: ${buffer.length} bytes`);

      // Convert to base64 for immediate use
      const base64Audio = buffer.toString('base64');
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;

      // Estimate duration (rough calculation)
      const duration = Math.floor(cleanText.length / 15);

      return {
        audioUrl,
        duration
      };

    } catch (error: any) {
      console.error(`❌ OpenAI TTS failed for ${characterId}:`, error.message);
      throw new Error(`OpenAI TTS generation failed: ${error.message}`);
    }
  }
}

// Factory function for creating OpenAI TTS instances
export function createOpenAITTS(apiKey: string): OpenAITTSService {
  return new OpenAITTSService({ apiKey });
}