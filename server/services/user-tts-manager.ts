import { createOpenAITTS, OpenAITTSService } from './openai-tts';
import { createGroqTTS, GroqTTSService } from './groq-tts';
import { createElevenLabsTTS, ElevenLabsTTSService } from './elevenlabs-tts';
import { storage } from '../storage';

export interface TTSGenerationOptions {
  characterId: string;
  characterName?: string;
  gender?: string;
  voiceStyle?: 'aggressive' | 'confident' | 'smooth' | 'intense' | 'playful';
  speedMultiplier?: number;
}

export class UserTTSManager {
  private openaiInstances = new Map<string, OpenAITTSService>();
  private groqInstances = new Map<string, GroqTTSService>();
  private elevenlabsInstances = new Map<string, ElevenLabsTTSService>();

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

  private getElevenLabsInstance(apiKey: string): ElevenLabsTTSService {
    if (!this.elevenlabsInstances.has(apiKey)) {
      this.elevenlabsInstances.set(apiKey, createElevenLabsTTS(apiKey));
    }
    return this.elevenlabsInstances.get(apiKey)!;
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

      const preferredService = user.preferredTtsService || 'groq';
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
              gender: options.gender,
              speedMultiplier: options.speedMultiplier
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
            gender: options.gender,
            speedMultiplier: options.speedMultiplier
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
              gender: options.gender,
              speedMultiplier: options.speedMultiplier
            });
          } else {
            console.log(`⚠️ No Groq API key available (user or system)`);
          }
        } catch (error: any) {
          console.log(`❌ Groq TTS failed: ${error.message}, falling back`);
        }
      }

      // ElevenLabs premium TTS option
      if (preferredService === 'elevenlabs') {
        try {
          // Try user's ElevenLabs API key first, then fallback to system key
          const apiKey = user.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;
          if (apiKey) {
            console.log(`🚀 Using ${user.elevenlabsApiKey ? "user's" : "system"} ElevenLabs TTS service (premium)`);
            const elevenlabsInstance = this.getElevenLabsInstance(apiKey);
            return await elevenlabsInstance.generateTTS(text, options.characterId, {
              voiceStyle: options.voiceStyle,
              characterName: options.characterName,
              gender: options.gender,
              speedMultiplier: options.speedMultiplier
            });
          } else {
            console.log(`⚠️ No ElevenLabs API key available (user or system)`);
          }
        } catch (error: any) {
          console.log(`❌ ElevenLabs TTS failed: ${error.message}, falling back`);
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
    console.log(`🔄 Using system TTS services (Groq/ElevenLabs/OpenAI priority)`);
    
    // Try system Groq first (fast, auto-playback optimized)
    if (process.env.GROQ_API_KEY) {
      try {
        console.log(`🚀 Using system Groq TTS (auto-playback optimized)...`);
        const groqInstance = this.getGroqInstance(process.env.GROQ_API_KEY);
        return await groqInstance.generateTTS(text, options.characterId, {
          voiceStyle: options.voiceStyle,
          characterName: options.characterName,
          gender: options.gender,
          speedMultiplier: options.speedMultiplier
        });
      } catch (error: any) {
        console.log(`❌ System Groq TTS failed: ${error.message}`);
      }
    }
    
    // Try system ElevenLabs second (premium quality)
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        console.log(`🚀 Using system ElevenLabs TTS (premium)...`);
        const elevenlabsInstance = this.getElevenLabsInstance(process.env.ELEVENLABS_API_KEY);
        return await elevenlabsInstance.generateTTS(text, options.characterId, {
          voiceStyle: options.voiceStyle,
          characterName: options.characterName,
          gender: options.gender,
          speedMultiplier: options.speedMultiplier
        });
      } catch (error: any) {
        console.log(`❌ System ElevenLabs TTS failed: ${error.message}`);
      }
    }
    
    // Try system OpenAI as final fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`🚀 Using system OpenAI TTS as fallback...`);
        const openaiInstance = this.getOpenAIInstance(process.env.OPENAI_API_KEY);
        return await openaiInstance.generateTTS(text, options.characterId, {
          voiceStyle: options.voiceStyle,
          characterName: options.characterName,
          gender: options.gender,
          speedMultiplier: options.speedMultiplier
        });
      } catch (error: any) {
        console.log(`❌ System OpenAI TTS failed: ${error.message}`);
      }
    }
    
    // All services failed - return empty audio (battle continues without sound)
    console.log(`🚫 No working TTS services available - continuing with silent mode`);
    return {
      audioUrl: "", // Empty audio - frontend handles gracefully
      duration: Math.floor(text.length / 15)
    };
  }

  // Test a user's API key
  async testUserAPIKey(userId: string, service: 'openai' | 'groq' | 'elevenlabs'): Promise<boolean> {
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

      if (service === 'elevenlabs' && user.elevenlabsApiKey) {
        const instance = this.getElevenLabsInstance(user.elevenlabsApiKey);
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
    this.elevenlabsInstances.clear();
    console.log(`🧹 Cleared all TTS instances cache (OpenAI, Groq, ElevenLabs)`);
  }
}

export const userTTSManager = new UserTTSManager();