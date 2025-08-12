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
      easy: "Use simple AABB or ABAB rhyme schemes, basic wordplay, straightforward punchlines, and clear syllable patterns that flow naturally.",
      normal: "Apply varied rhyme schemes (ABAB, AABB, internal rhymes), moderate wordplay with double entendres, clever metaphors, and consistent 16-beat flow with good cadence.",
      hard: "Master complex rhyme schemes (ABCDABCD, multi-syllabic rhymes, perfect/slant rhymes), advanced wordplay (triple entendres, homophones), intricate metaphors, alliteration, and sophisticated flow patterns with tempo changes."
    };

    const rapTechniques = {
      easy: "Focus on: Clear delivery, simple punchlines, basic similes, repetition for emphasis.",
      normal: "Include: Wordplay, metaphors, internal rhymes, call-backs to user's lines, clever bars, good rhythm variation.", 
      hard: "Master: Complex internal rhymes, multi-layered wordplay, extended metaphors, alliterative patterns, sophisticated battle tactics, technical rhyme schemes."
    };

    const profanityNote = profanityFilter 
      ? "Keep language clean but hard-hitting through clever wordplay rather than explicit content." 
      : "Use authentic rap battle language including mature themes if contextually appropriate.";

    const prompt = `You are a legendary rap battle MC with mastery of every rap technique. The challenger just delivered:

"${userVerse}"

Create a devastating 4-line counter-attack that demonstrates:

RHYME MASTERY: ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

RAP TECHNIQUES: ${rapTechniques[difficulty as keyof typeof rapTechniques]}

BATTLE STRATEGY:
- Directly dismantle their specific bars and flip their own words against them
- Use aggressive confidence and intimidation tactics
- Show technical superiority through superior wordplay
- End with a knockout punchline that silences the crowd

FLOW & DELIVERY:
- Match syllable count and rhythm for natural delivery
- Use strong consonants and vowel patterns for impact
- Create natural pause points and emphasis beats
- Build tension and release with line structure

CONTENT REQUIREMENTS:
- Counter their specific claims with evidence of your dominance  
- Reference their weaknesses implied in their verse
- Showcase your lyrical superiority through demonstration
- ${profanityNote}

Return only the raw rap verses with natural line breaks, no quotation marks or commentary.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Using base model as fine-tuned model not accessible
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 300,
        temperature: difficulty === "hard" ? 0.95 : difficulty === "normal" ? 0.85 : 0.75,
        top_p: 0.9,
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
