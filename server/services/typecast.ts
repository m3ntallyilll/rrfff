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
    try {
      // First try to get available voices to find a valid voice ID
      const voicesResponse = await fetch(`${this.baseUrl}/v1/voices`, {
        headers: {
          "X-API-KEY": this.apiKey,
        },
      });

      let voiceId = "tc_62a8975e695ad26f7fb514d1"; // fallback
      
      if (voicesResponse.ok) {
        const voices = await voicesResponse.json();
        if (voices && voices.length > 0) {
          voiceId = voices[0].voice_id; // Use first available voice
          console.log("Using Typecast voice:", voiceId);
        }
      }

      const response = await fetch(`${this.baseUrl}/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
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
            audio_format: "mp3"
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Typecast TTS failed, using fallback:", errorText);
        // Fall back to a text-based response instead of failing
        return {
          audioUrl: "", // Empty URL indicates no audio available
          duration: Math.floor(text.length / 15), // Rough estimate: ~15 chars per second
        };
      }

      // Handle the response - this might be binary data or a URL
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('audio')) {
        // Binary audio data - we'd need to save it and return a URL
        // For now, return a placeholder
        return {
          audioUrl: "data:audio/mp3;base64,generated-audio-placeholder",
          duration: Math.floor(text.length / 15),
        };
      } else {
        // JSON response with URL
        const result = await response.json();
        return {
          audioUrl: result.audio_url || result.audioUrl || "",
          duration: result.duration || Math.floor(text.length / 15),
        };
      }
    } catch (error) {
      console.log("Typecast TTS error, using fallback:", error);
      // Graceful fallback - don't fail the whole battle round
      return {
        audioUrl: "", // No audio available
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
