export class TypecastService {
  private apiKey: string;
  private baseUrl = "https://typecast.ai/api/speak";

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
    const voiceMap = {
      "hardcore-mc": "hardcore_mc_voice",
      "smooth-flow": "smooth_flow_voice", 
      "aggressive-battle": "aggressive_battle_voice"
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice: voiceMap[voice as keyof typeof voiceMap] || voiceMap["hardcore-mc"],
        format: "mp3",
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Typecast TTS failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      audioUrl: result.audio_url,
      duration: result.duration || 5, // fallback duration
    };
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
