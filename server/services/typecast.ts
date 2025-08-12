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
    voice: string = "hardcore-mc"
  ): Promise<{ audioUrl: string; duration: number }> {
    console.log("Attempting Typecast TTS generation for text:", text.substring(0, 50) + "...");
    
    try {
      // Use the user's specific voice ID
      const voiceId = "tc_67d237f1782cabcc6155272f";
      console.log("Using specified voice ID:", voiceId);

      const response = await fetch(`${this.baseUrl}/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model: "ssfm-v21",
          voice_id: voiceId,
          prompt: {
            preset: "normal",
            preset_intensity: 1.0
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
