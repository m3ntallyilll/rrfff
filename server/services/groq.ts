export class GroqService {
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "";
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Groq transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  }

  async generateRapResponse(
    userVerse: string,
    difficulty: string = "normal",
    profanityFilter: boolean = true
  ): Promise<string> {
    const difficultyPrompts = {
      easy: "Create a simple, beginner-friendly rap response with basic rhymes and straightforward metaphors.",
      normal: "Generate a solid rap response with good rhyme schemes, wordplay, and moderate complexity.",
      hard: "Craft an advanced rap response with complex rhyme patterns, intricate wordplay, multi-syllabic rhymes, and sophisticated metaphors."
    };

    const profanityNote = profanityFilter 
      ? "Keep the language clean and appropriate for all audiences." 
      : "You can use mature language if it fits the battle context.";

    const prompt = `You are an AI rap battle opponent. The user just delivered this verse:

"${userVerse}"

Respond with a powerful 4-line rap battle response that:
- ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}
- Directly addresses or counters the user's verse
- Shows creativity and originality
- Maintains good flow and rhythm
- ${profanityNote}

Return only the rap verses, no additional commentary.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 200,
        temperature: difficulty === "hard" ? 0.9 : difficulty === "normal" ? 0.8 : 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq response generation failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Groq API Response:", JSON.stringify(result, null, 2));
    
    if (!result.choices || result.choices.length === 0) {
      throw new Error(`Groq API returned no choices: ${JSON.stringify(result)}`);
    }
    
    if (!result.choices[0].message || !result.choices[0].message.content) {
      throw new Error(`Groq API response missing content: ${JSON.stringify(result.choices[0])}`);
    }
    
    return result.choices[0].message.content;
  }
}

export const groqService = new GroqService();
