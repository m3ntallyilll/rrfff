import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

export interface GroqTTSOptions {
  apiKey: string;
  voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
  characterGender?: 'male' | 'female';
}

export class GroqTTSService {
  private groq: Groq;
  private outputDir: string;

  constructor(options: GroqTTSOptions) {
    this.groq = new Groq({
      apiKey: options.apiKey,
    });
    
    this.outputDir = path.join(process.cwd(), 'temp_audio');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private getVoiceForCharacter(characterId: string, gender: string = 'male'): string {
    // Groq PlayAI voices optimized for rap battle characters
    const maleVoices = [
      'Fritz-PlayAI',    // Deep, authoritative
      'Thunder-PlayAI',  // Intense, powerful
      'Basil-PlayAI',    // Smooth, controlled
      'Cillian-PlayAI',  // Sharp, aggressive
      'Calum-PlayAI'     // Confident, street-smart
    ];
    
    const femaleVoices = [
      'Celeste-PlayAI',  // Strong, commanding
      'Cheyenne-PlayAI', // Fierce, edgy
      'Gail-PlayAI',     // Confident, bold
      'Indigo-PlayAI',   // Smooth, mysterious
      'Deedee-PlayAI'    // Playful, sharp
    ];

    // Character-specific voice mapping
    const voiceMap: Record<string, string> = {
      'razor': 'Cheyenne-PlayAI',  // Female, sharp and cutting
      'venom': 'Thunder-PlayAI',   // Male, intense and powerful
      'silk': 'Basil-PlayAI',      // Male, smooth and controlled
      'cypher': 'Fritz-PlayAI',    // Robot - Deep, mechanical bass
    };

    if (voiceMap[characterId]) {
      return voiceMap[characterId];
    }
    
    // Fallback to gender-appropriate voices
    const voices = gender === 'female' ? femaleVoices : maleVoices;
    return voices[Math.floor(Math.random() * voices.length)];
  }

  private applyRobotVoiceEffects(text: string, characterId: string): string {
    // Special robot voice processing for CYPHER-9000
    if (characterId === 'cypher') {
      // Add robotic speech patterns and digital terminology
      let robotText = text
        .replace(/\bi\b/g, 'SYSTEM')
        .replace(/\byou\b/g, 'HUMAN_TARGET') 
        .replace(/\byour\b/g, 'HUMAN_TARGET.PROPERTY')
        .replace(/destroy/g, 'TERMINATE')
        .replace(/kill/g, 'DELETE')
        .replace(/beat/g, 'OVERRIDE')
        .replace(/weak/g, 'INSUFFICIENT')
        .replace(/strong/g, 'OPTIMIZED');
      
      // Add robotic delivery markers
      robotText = `[robotic_voice_fx] ${robotText} [/robotic_voice_fx]`;
      
      return robotText;
    }
    return text;
  }

  async generateTTS(
    text: string,
    characterId: string,
    options: {
      voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
      characterName?: string;
      gender?: string;
    } = {}
  ): Promise<{ audioUrl: string; duration: number }> {
    console.log(`🎤 Groq TTS generating for ${characterId}: "${text.substring(0, 50)}..."`);
    
    try {
      const voice = this.getVoiceForCharacter(characterId, options.gender);
      const voiceStyle = options.voiceStyle || 'confident';
      
      console.log(`🚀 Using Groq voice: ${voice} with style: ${voiceStyle}`);
      
      // Apply robot voice effects for CYPHER-9000
      const processedText = this.applyRobotVoiceEffects(text, characterId);
      
      // Clean text for better TTS - keep robot FX markers for CYPHER-9000
      const cleanText = characterId === 'cypher' 
        ? processedText // Keep robot effects for CYPHER-9000
            .replace(/\*.*?\*/g, '') // Remove emphasis markers only
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim()
        : processedText
            .replace(/\[.*?\]/g, '') // Remove all style tags for other characters
            .replace(/\*.*?\*/g, '') // Remove emphasis markers
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();

      // Use Groq's PlayAI TTS model (10x faster than real-time)
      const response = await this.groq.audio.speech.create({
        model: "playai-tts", // Fast PlayAI model from Groq
        voice: voice,
        input: cleanText,
        response_format: 'wav',
        speed: 1.0
      });

      const timestamp = Date.now();
      const filename = `groq_tts_${characterId}_${timestamp}.wav`;
      const outputPath = path.join(this.outputDir, filename);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Groq TTS success: ${buffer.length} bytes (140 chars/second speed)`);

      // Convert to base64 for immediate use
      const base64Audio = buffer.toString('base64');
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;

      // Estimate duration (Groq is 10x faster than real-time)
      const duration = Math.floor(cleanText.length / 15);

      return {
        audioUrl,
        duration
      };

    } catch (error: any) {
      console.error(`❌ Groq TTS failed for ${characterId}:`, error.message);
      throw new Error(`Groq TTS generation failed: ${error.message}`);
    }
  }

  // Test if the API key works
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.groq.audio.speech.create({
        model: "playai-tts",
        voice: "Fritz-PlayAI",
        input: "Test connection",
        response_format: 'wav'
      });
      
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.length > 0;
    } catch (error) {
      console.error('Groq TTS test failed:', error);
      return false;
    }
  }
}

// Factory function for creating Groq TTS instances
export function createGroqTTS(apiKey: string): GroqTTSService {
  return new GroqTTSService({ apiKey });
}