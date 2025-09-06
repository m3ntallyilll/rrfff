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
    const voiceId = character?.voiceId || "tc_a4b8f31d52e8763a1234567f"; // fallback to working voice
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
          text: text
            .replace(/\[.*?\]/g, '') // Remove style tags
            .replace(/\(.*?\)/g, '') // Remove parentheses and content
            .replace(/\*.*?\*/g, '') // Remove emphasis markers
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim(), // Clean input text
          model: "ssfm-v21", // Advanced model for best quality
          language: "eng",
          prompt: {
            emotion_preset: "confident", // Better for rap battles
            emotion_intensity: 1.2 // Higher intensity for battle energy
          },
          output: {
            volume: 100,
            audio_pitch: 0, // Keep natural pitch
            audio_tempo: 1.1, // Slightly faster for rap energy
            audio_format: "wav" // High quality format
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("TTS generation failed:", response.status, errorText);
        throw new Error(`TTS generation failed: ${response.status} ${errorText}`);
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
      console.error("Typecast TTS completely failed:", error instanceof Error ? error.message : error);
      
      // Return empty audio URL so battle continues without breaking
      return {
        audioUrl: "", // No audio - frontend handles this gracefully
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
