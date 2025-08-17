export class TypecastService {
  private apiKey: string;
  private baseUrl = "https://api.typecast.ai";

  constructor() {
    this.apiKey = process.env.TYPECAST_API_KEY || process.env.TYPECAST_API_KEY_ENV_VAR || "";
    if (!this.apiKey) {
      throw new Error("TYPECAST_API_KEY environment variable is required");
    }
  }

  async generateSpeech(
    text: string,
    characterId: string = "venom"
  ): Promise<{ audioUrl: string; duration: number }> {
    // Get correct voice ID from character data
    const { getCharacterById } = await import("@shared/characters");
    const character = getCharacterById(characterId);
    const voiceId = character?.voiceId || "tc_67d237f1782cabcc6155272f"; // fallback to MC Venom voice
    console.log("Attempting Typecast TTS generation for text:", text.substring(0, 50) + "...");
    console.log(`Character: ${character?.name || 'Unknown'} (${character?.gender || 'unknown'})`);
    console.log(`Character ID: ${characterId}, Voice ID: ${voiceId}`);
    
    try {

      const response = await fetch(`${this.baseUrl}/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice_id: voiceId,
          text,
          model: "ssfm-v21",
          language: "eng",
          prompt: {
            emotion_preset: "normal",
            emotion_intensity: 1.0
          },
          output: {
            volume: 100,
            audio_pitch: 0,
            audio_tempo: 1.0,
            audio_format: "wav"
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("TTS generation failed:", response.status, errorText);
        throw new Error(`TTS generation failed: ${response.status}`);
      }

      // According to the docs, this should return binary audio data
      const audioBuffer = await response.arrayBuffer();
      console.log("Generated audio size:", audioBuffer.byteLength, "bytes");
      
      // Convert to base64 data URL for embedding
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;

      return {
        audioUrl,
        duration: Math.floor(text.length / 15), // Estimate duration
      };

    } catch (error) {
      console.log("Typecast TTS completely failed:", error instanceof Error ? error.message : error);
      
      // For now, gracefully continue without audio rather than breaking the battle
      // This allows the user to experience the text-based battle while TTS issues are resolved
      return {
        audioUrl: "", // No audio - the frontend should handle this gracefully
        duration: Math.floor(text.length / 15),
      };
    }
  }

  async getVoices(): Promise<Array<{ id: string; name: string; description: string }>> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const typecastService = new TypecastService();
