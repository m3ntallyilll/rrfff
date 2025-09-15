import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import path from 'path';

export interface ElevenLabsTTSOptions {
  apiKey: string;
  voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
  characterGender?: 'male' | 'female';
}

export class ElevenLabsTTSService {
  private elevenlabs: ElevenLabsClient;
  private outputDir: string;
  private voiceCache = new Map<string, any>();

  constructor(options: ElevenLabsTTSOptions) {
    this.elevenlabs = new ElevenLabsClient({
      apiKey: options.apiKey,
    });
    
    this.outputDir = path.join(process.cwd(), 'temp_audio');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await this.elevenlabs.voices.getAll();
      return response.voices || [];
    } catch (error) {
      console.error('❌ Failed to fetch ElevenLabs voices:', error);
      return [];
    }
  }

  private async getVoiceForCharacter(characterId: string, gender: string = 'male'): Promise<string> {
    // Check cache first
    const cacheKey = `${characterId}-${gender}`;
    if (this.voiceCache.has(cacheKey)) {
      return this.voiceCache.get(cacheKey);
    }

    // Get all available voices
    const voices = await this.getAvailableVoices();
    
    // Default voice mapping strategy - look for specific characteristics
    const characterVoicePrefs: Record<string, { 
      keywords: string[], 
      preferredGender: 'male' | 'female',
      fallbackVoiceId?: string 
    }> = {
      'razor': { 
        keywords: ['sharp', 'aggressive', 'fierce', 'young', 'confident'], 
        preferredGender: 'female',
        fallbackVoiceId: 'EXAVITQu4vr4xnSDxMaL' // Bella - default ElevenLabs voice
      },
      'venom': { 
        keywords: ['deep', 'dark', 'menacing', 'powerful', 'intense'], 
        preferredGender: 'male',
        fallbackVoiceId: 'bVMeCyTHy58xNoL34h3p' // Jeremy - default ElevenLabs voice
      },
      'silk': { 
        keywords: ['smooth', 'suave', 'confident', 'charming', 'sophisticated'], 
        preferredGender: 'male',
        fallbackVoiceId: 'AZnzlk1XvdvUeBnXmlld' // Domi - default ElevenLabs voice
      },
      'cypher': { 
        keywords: ['robotic', 'artificial', 'synthetic', 'mechanical', 'digital'], 
        preferredGender: 'male',
        fallbackVoiceId: 'bVMeCyTHy58xNoL34h3p' // Jeremy - default ElevenLabs voice (will be processed for robot effects)
      }
    };

    const charPrefs = characterVoicePrefs[characterId] || {
      keywords: ['confident', 'clear'],
      preferredGender: gender as 'male' | 'female',
      fallbackVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam - default ElevenLabs voice
    };

    // Try to find a voice that matches character preferences
    let selectedVoice = voices.find(voice => {
      const voiceName = voice.name?.toLowerCase() || '';
      const voiceDescription = voice.description?.toLowerCase() || '';
      
      // Safely handle voice.labels (can be array, object, or undefined)
      let voiceLabels = '';
      let genderLabels: string[] = [];
      
      try {
        if (Array.isArray(voice.labels)) {
          voiceLabels = voice.labels.join(' ').toLowerCase();
          genderLabels = voice.labels.map((l: unknown) => String(l).toLowerCase());
        } else if (voice.labels && typeof voice.labels === 'object') {
          voiceLabels = Object.values(voice.labels).join(' ').toLowerCase();
          genderLabels = Object.values(voice.labels).map((l: unknown) => String(l).toLowerCase());
        }
      } catch (error) {
        console.warn(`⚠️ ElevenLabs voice labels parsing error for ${voice.name}:`, error);
      }
      
      const searchText = `${voiceName} ${voiceDescription} ${voiceLabels}`;
      
      // Check if voice matches gender preference
      const matchesGender = genderLabels.includes(charPrefs.preferredGender) || 
                           genderLabels.includes(`${charPrefs.preferredGender}_voice`);
      
      // Check if voice matches character keywords
      const matchesKeywords = charPrefs.keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      
      return matchesGender && matchesKeywords;
    });

    // If no perfect match, find any voice matching gender
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => {
        let genderLabels: string[] = [];
        
        try {
          if (Array.isArray(voice.labels)) {
            genderLabels = voice.labels.map((l: unknown) => String(l).toLowerCase());
          } else if (voice.labels && typeof voice.labels === 'object') {
            genderLabels = Object.values(voice.labels).map((l: unknown) => String(l).toLowerCase());
          }
        } catch (error) {
          console.warn(`⚠️ ElevenLabs gender fallback labels error for ${voice.name}:`, error);
        }
        
        return genderLabels.includes(charPrefs.preferredGender) || 
               genderLabels.includes(`${charPrefs.preferredGender}_voice`);
      });
    }

    // Final fallback to character's preferred voice ID
    const voiceId = selectedVoice?.voice_id || charPrefs.fallbackVoiceId;
    
    console.log(`🎤 ElevenLabs voice mapping for ${characterId}: ${selectedVoice?.name || 'fallback'} (${voiceId})`);
    
    // Cache the result
    this.voiceCache.set(cacheKey, voiceId);
    
    return voiceId;
  }

  private applyCharacterSpeechEffects(text: string, characterId: string, voiceStyle?: string): string {
    let processedText = text;
    
    // Clean text for better TTS
    processedText = processedText
      .replace(/\[.*?\]/g, '') // Remove style tags
      .replace(/\(.*?\)/g, '') // Remove parentheses and content
      .replace(/\*.*?\*/g, '') // Remove emphasis markers
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();

    // Special processing for CYPHER-9000 robot character
    if (characterId === 'cypher') {
      // Apply subtle robotic speech patterns that work well with TTS
      processedText = processedText
        .replace(/\bi\s/gi, 'I, as a cybernetic entity, ')
        .replace(/\bmy\b/gi, 'my digital')
        .replace(/\byour\b/gi, 'your biological')
        .replace(/\byou\b/gi, 'you, organic being');
      
      // Add robotic prefixes/suffixes that sound natural
      const robotPrefixes = [
        'Initiating verbal protocol.',
        'Processing lyrical algorithms.',
        'Executing combat subroutines.',
        'Activating battle mode.'
      ];
      
      const robotSuffixes = [
        'Protocol complete.',
        'Systems nominal.',
        'Termination sequence activated.',
        'Combat efficiency: maximum.'
      ];
      
      const prefix = robotPrefixes[Math.floor(Math.random() * robotPrefixes.length)];
      const suffix = robotSuffixes[Math.floor(Math.random() * robotSuffixes.length)];
      
      processedText = `${prefix} ${processedText} ${suffix}`;
      console.log(`🤖 CYPHER-9000 ElevenLabs: Applied robotic speech patterns`);
    }

    return processedText;
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
    console.log(`🎤 ElevenLabs TTS generating for ${characterId}: "${text.substring(0, 50)}..."`);
    
    try {
      const voiceId = await this.getVoiceForCharacter(characterId, options.gender);
      const voiceStyle = options.voiceStyle || 'confident';
      
      console.log(`🚀 Using ElevenLabs voice ID: ${voiceId} with style: ${voiceStyle}`);
      
      // Apply character-specific speech effects
      const processedText = this.applyCharacterSpeechEffects(text, characterId, voiceStyle);
      
      // Voice settings for rap battle delivery
      const voiceSettings = {
        stability: 0.5,           // Medium stability for natural variation
        similarity_boost: 0.8,    // High similarity to maintain character voice
        style: this.getStyleBoost(voiceStyle), // Dynamic style based on character
        use_speaker_boost: true   // Enhanced clarity for battle rap
      };

      console.log(`🎯 ElevenLabs voice settings: stability=${voiceSettings.stability}, similarity=${voiceSettings.similarity_boost}, style=${voiceSettings.style}`);

      // Apply speed multiplier if provided (ElevenLabs doesn't support direct speed control, so we adjust duration estimate)
      const speedMultiplier = options.speedMultiplier || 1.0;
      console.log(`🎯 ElevenLabs speed: ${speedMultiplier}x`);

      // Generate speech with ElevenLabs API
      const audioResponse = await this.elevenlabs.textToSpeech.convert(voiceId, {
        text: processedText,
        modelId: "eleven_multilingual_v2", // Latest multilingual model
        outputFormat: "mp3_44100_128", // High quality MP3
        voice_settings: voiceSettings
      });

      // Save to file
      const timestamp = Date.now();
      const filename = `elevenlabs_tts_${characterId}_${timestamp}.mp3`;
      const outputPath = path.join(this.outputDir, filename);

      // Convert ReadableStream to buffer
      const chunks: Uint8Array[] = [];
      const reader = audioResponse.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ ElevenLabs TTS success: ${buffer.length} bytes`);

      // Convert to base64 for immediate use
      const base64Audio = buffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      // Estimate duration (rough calculation for MP3, adjusted for speed multiplier)
      const baseDuration = Math.floor(processedText.length / 15);
      const duration = Math.floor(baseDuration / speedMultiplier);

      return {
        audioUrl,
        duration
      };

    } catch (error: any) {
      console.error(`❌ ElevenLabs TTS failed for ${characterId}:`, error.message);
      throw new Error(`ElevenLabs TTS generation failed: ${error.message}`);
    }
  }

  private getStyleBoost(voiceStyle: string): number {
    // Map voice styles to ElevenLabs style values (0.0 - 1.0)
    const styleMap: Record<string, number> = {
      'aggressive': 0.8,  // High style for aggressive delivery
      'confident': 0.6,   // Medium-high for confident delivery
      'smooth': 0.4,      // Lower style for smooth delivery
      'intense': 0.9,     // Maximum style for intense delivery
      'playful': 0.7      // High style for playful delivery
    };

    return styleMap[voiceStyle] || 0.6; // Default to confident
  }

  // Test if the API key works
  async testConnection(): Promise<boolean> {
    try {
      const voices = await this.getAvailableVoices();
      return voices.length > 0;
    } catch (error) {
      console.error('ElevenLabs TTS test failed:', error);
      return false;
    }
  }

  // Get user's available voices (for advanced users who want to customize)
  async getUserVoices(): Promise<any[]> {
    try {
      const response = await this.elevenlabs.voices.getAll();
      return response.voices || [];
    } catch (error) {
      console.error('❌ Failed to get user voices:', error);
      return [];
    }
  }
}

// Factory function for creating ElevenLabs TTS instances
export function createElevenLabsTTS(apiKey: string): ElevenLabsTTSService {
  return new ElevenLabsTTSService({ apiKey });
}