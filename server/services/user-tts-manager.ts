import { createOpenAITTS, OpenAITTSService } from './openai-tts';
import { createGroqTTS, GroqTTSService } from './groq-tts';
import { barkTTS } from './bark';
import { typecastService } from './typecast';
import { storage } from '../storage';

export interface TTSGenerationOptions {
  characterId: string;
  characterName?: string;
  gender?: string;
  voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
}

export class UserTTSManager {
  private openaiInstances = new Map<string, OpenAITTSService>();
  private groqInstances = new Map<string, GroqTTSService>();

  private getOpenAIInstance(apiKey: string): OpenAITTSService {
    if (!this.openaiInstances.has(apiKey)) {
      this.openaiInstances.set(apiKey, createOpenAITTS(apiKey));
    }
    return this.openaiInstances.get(apiKey)!;
  }

  private getGroqInstance(apiKey: string): GroqTTSService {
    if (!this.groqInstances.has(apiKey)) {
      this.groqInstances.set(apiKey, createGroqTTS(apiKey));
    }
    return this.groqInstances.get(apiKey)!;
  }

  async generateTTS(
    text: string,
    userId: string,
    options: TTSGenerationOptions
  ): Promise<{ audioUrl: string; duration: number }> {
    console.log(`🎤 UserTTSManager: Generating TTS for user ${userId}, character ${options.characterId}`);
    
    try {
      // Get user's TTS preferences and API keys
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const preferredService = user.preferredTtsService || 'system';
      console.log(`🎯 User ${userId} prefers: ${preferredService} TTS`);

      // FORCE CYPHER-9000 to use Groq for robotic voice
      if (options.characterId === 'cypher') {
        try {
          const apiKey = user.groqApiKey || process.env.GROQ_API_KEY;
          if (apiKey) {
            console.log(`🤖 CYPHER-9000 VOICE PROTOCOL: Forcing Groq TTS (${user.groqApiKey ? "user's" : "system"} key)`);
            const groqInstance = this.getGroqInstance(apiKey);
            return await groqInstance.generateTTS(text, options.characterId, {
              voiceStyle: options.voiceStyle,
              characterName: options.characterName,
              gender: options.gender
            });
          } else {
            console.log(`⚠️ No Groq API key available for CYPHER-9000!`);
          }
        } catch (error: any) {
          console.log(`❌ CYPHER-9000 Groq TTS failed: ${error.message}, falling back`);
        }
      }

      // Try user's preferred service first
      if (preferredService === 'openai' && user.openaiApiKey) {
        try {
          console.log(`🚀 Using user's OpenAI TTS service`);
          const openaiInstance = this.getOpenAIInstance(user.openaiApiKey);
          return await openaiInstance.generateTTS(text, options.characterId, {
            voiceStyle: options.voiceStyle,
            characterName: options.characterName,
            gender: options.gender
          });
        } catch (error: any) {
          console.log(`❌ User's OpenAI TTS failed: ${error.message}, falling back`);
        }
      }

      if (preferredService === 'groq') {
        try {
          // Try user's Groq API key first, then fallback to system key
          const apiKey = user.groqApiKey || process.env.GROQ_API_KEY;
          if (apiKey) {
            console.log(`🚀 Using ${user.groqApiKey ? "user's" : "system"} Groq TTS service`);
            const groqInstance = this.getGroqInstance(apiKey);
            return await groqInstance.generateTTS(text, options.characterId, {
              voiceStyle: options.voiceStyle,
              characterName: options.characterName,
              gender: options.gender
            });
          } else {
            console.log(`⚠️ No Groq API key available (user or system)`);
          }
        } catch (error: any) {
          console.log(`❌ Groq TTS failed: ${error.message}, falling back`);
        }
      }

      // Fallback to system TTS services
      console.log(`🔄 Falling back to system TTS services`);
      return await this.useSystemTTS(text, options);

    } catch (error) {
      console.error(`❌ All TTS services failed for user ${userId}:`, error);
      
      // Ultimate fallback - return empty audio with success status
      return {
        audioUrl: "", // Empty audio - frontend handles gracefully
        duration: Math.floor(text.length / 15)
      };
    }
  }

  private async useSystemTTS(
    text: string, 
    options: TTSGenerationOptions
  ): Promise<{ audioUrl: string; duration: number }> {
    console.log(`🏠 Using system TTS services (Bark + Typecast fallback)`);
    
    try {
      // Try Bark TTS first
      console.log(`🐶 Attempting system Bark TTS...`);
      const barkResult = await barkTTS.generateAudio(text, options.characterId);
      // Convert bark response to expected format
      return {
        audioUrl: barkResult.audioPath,
        duration: Math.floor(text.length / 15)
      };
    } catch (barkError: any) {
      console.log(`📢 Bark failed, trying Typecast fallback: ${barkError.message}`);
      
      try {
        // Try Typecast as fallback
        return await typecastService.generateSpeech(text, options.characterId);
      } catch (typecastError: any) {
        console.log(`❌ Typecast also failed: ${typecastError.message}`);
        
        // Return empty audio - battles continue without audio
        return {
          audioUrl: "",
          duration: Math.floor(text.length / 15)
        };
      }
    }
  }

  // Test a user's API key
  async testUserAPIKey(userId: string, service: 'openai' | 'groq'): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    try {
      if (service === 'openai' && user.openaiApiKey) {
        const instance = this.getOpenAIInstance(user.openaiApiKey);
        const result = await instance.generateTTS("Test", "test", {});
        return result.audioUrl.length > 0;
      }

      if (service === 'groq' && user.groqApiKey) {
        const instance = this.getGroqInstance(user.groqApiKey);
        return await instance.testConnection();
      }

      return false;
    } catch (error) {
      console.error(`API key test failed for ${service}:`, error);
      return false;
    }
  }

  // Clear cached instances when keys change
  clearUserInstances(userId: string) {
    // In a production system, you'd track which instances belong to which users
    // For now, we'll clear all instances when any key changes
    this.openaiInstances.clear();
    this.groqInstances.clear();
    console.log(`🧹 Cleared TTS instances cache`);
  }
}

export const userTTSManager = new UserTTSManager();