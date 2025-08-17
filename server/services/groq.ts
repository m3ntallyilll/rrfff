import { AdvancedRhymeEngine } from './advancedRhymeEngine';

export class GroqService {
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1";
  private rhymeEngine: AdvancedRhymeEngine;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "";
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }
    this.rhymeEngine = new AdvancedRhymeEngine();
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

  // Blend AI response with advanced rhyme techniques
  private blendResponses(aiResponse: string, enhancedVerse: string): string {
    // If AI response is too short or generic, use enhanced verse
    if (aiResponse.length < 50 || !aiResponse.includes('\n')) {
      return enhancedVerse;
    }
    
    // Try to maintain AI's content while adding technical complexity
    const aiLines = aiResponse.split('\n').filter(line => line.trim());
    const enhancedLines = enhancedVerse.split('\n').filter(line => line.trim());
    
    if (aiLines.length >= 4) {
      // AI has good content, keep it
      return aiResponse;
    } else {
      // Blend: use AI's style but enhanced techniques
      return enhancedVerse;
    }
  }

  async generateRapResponse(
    userVerse: string,
    difficulty: string = "normal",
    profanityFilter: boolean = true,
    lyricComplexity: number = 50,
    styleIntensity: number = 50
  ): Promise<string> {
    const difficultyPrompts = {
      easy: "Use simple AABB or ABAB rhyme schemes, basic wordplay, straightforward punchlines, and clear syllable patterns that flow naturally.",
      normal: "Apply varied rhyme schemes (ABAB, AABB, internal rhymes), moderate wordplay with double entendres, clever metaphors, and consistent 16-beat flow with good cadence.",
      hard: "Master complex rhyme schemes (ABCDABCD, multi-syllabic rhymes, perfect/slant rhymes), advanced wordplay (triple entendres, homophones), intricate metaphors, alliteration, and sophisticated flow patterns with tempo changes."
    };

    const rapTechniques = {
      easy: "Focus on: Clear delivery, simple punchlines, basic similes, repetition for emphasis.",
      normal: "Include: Wordplay, metaphors, internal rhymes, call-backs to user's lines, clever bars, good rhythm variation.", 
      hard: "Master: INTERNAL RHYMING (rhymes within each line), RHYME STACKING (multiple rhymes in sequence), RHYME JUGGLING (overlapping rhyme patterns across lines), complex multi-syllabic rhymes, extended metaphors, alliterative patterns, sophisticated battle tactics, technical rhyme schemes."
    };

    // Profanity Filter Setting - STRICT ENFORCEMENT
    console.log("Profanity filter status:", profanityFilter ? "ENABLED (clean)" : "DISABLED (uncensored)");
    
    const profanityNote = profanityFilter 
      ? `CRITICAL REQUIREMENT: ABSOLUTELY NO PROFANITY OR OFFENSIVE LANGUAGE ALLOWED. You MUST keep ALL language completely clean and family-friendly. 

STRICTLY FORBIDDEN: Do NOT use any of these words or similar variations: fuck, shit, bitch, damn, pussy, ass, hell, crap, slut, whore, bastard, piss, or any sexual/offensive terms.

REQUIRED: Use only clean, creative wordplay, clever metaphors, and skill-based competitive insults. Example clean battle lines:
- "Your flow's weak, I'm bringing the heat"  
- "Step to me? You're out of your league"
- "My rhymes are fire, yours are just weak"
- "I'm the champion, you're just a wannabe"

Focus on technical rap skills without ANY offensive content.`
      : "Use authentic, raw street rap language with explicit profanity (fuck, shit, bitch, damn, pussy, ass), aggressive insults, sexual references, violence metaphors, and hardcore street terminology for maximum battle impact. Don't hold back - this is uncensored battle rap.";

    // Map complexity levels to descriptive terms
    const complexityLevel = lyricComplexity <= 25 ? 'Basic' : lyricComplexity <= 50 ? 'Intermediate' : lyricComplexity <= 75 ? 'Advanced' : 'Expert';
    const intensityLevel = styleIntensity <= 25 ? 'Chill' : styleIntensity <= 50 ? 'Moderate' : styleIntensity <= 75 ? 'Aggressive' : 'Savage';

    const complexityInstructions = lyricComplexity <= 25 
      ? "Use simple vocabulary and straightforward metaphors. Keep rhyme schemes basic (AABB). Focus on clear, easy-to-follow bars."
      : lyricComplexity <= 50 
      ? "Mix simple and moderate vocabulary. Use some internal rhymes and basic wordplay. Add clever metaphors."
      : lyricComplexity <= 75
      ? "Use sophisticated vocabulary and complex metaphors. Include multi-syllabic rhymes, internal rhymes, and advanced wordplay techniques."
      : "Master-level complexity: Use intricate wordplay, layered meanings, complex rhyme schemes (ABCDABCD), multiple internal rhymes per line, and advanced literary devices.";

    const intensityInstructions = styleIntensity <= 25
      ? "Keep the energy mellow and laid-back. Use clever wordplay over aggression. Be confident but not intimidating."
      : styleIntensity <= 50
      ? "Moderate intensity with some competitive edge. Balance clever bars with confident delivery."
      : styleIntensity <= 75
      ? "High energy and aggressive delivery. Use intimidation tactics and harsh competitive language."
      : "Maximum intensity: Savage, ruthless, and devastating. Use the most aggressive battle rap tactics and brutal verbal attacks.";

    const prompt = `You are a legendary rap battle MC with mastery of every rap technique. The challenger just delivered:

"${userVerse}"

Create a devastating 4-line counter-attack with these specifications:

LYRIC COMPLEXITY (${complexityLevel} - ${lyricComplexity}%): ${complexityInstructions}

STYLE INTENSITY (${intensityLevel} - ${styleIntensity}%): ${intensityInstructions}

RHYME MASTERY: ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

RAP TECHNIQUES: ${rapTechniques[difficulty as keyof typeof rapTechniques]}

${difficulty === 'hard' ? `
ADVANCED RAP SKILLS - MANDATORY FOR HARD DIFFICULTY:

1. INTERNAL RHYMING: Include rhymes WITHIN each line, not just at the ends
   - Example: "I SPIT fire, GET higher, while you QUIT trying to be a SLICK liar"
   - Every line must have 2-3 internal rhymes

2. RHYME STACKING: Stack multiple rhyming syllables in sequence
   - Example: "BACK-to-BACK attacks, CRACK your TRACK, leave you FLAT on your back"
   - Use consecutive words that rhyme or share sounds

3. RHYME JUGGLING: Overlap rhyme patterns across multiple lines
   - Line 1 rhymes should connect with Line 3, Line 2 with Line 4
   - Create complex weaving patterns that show technical mastery

IMPLEMENTATION REQUIREMENTS:
- Use multi-syllabic rhymes (2+ syllables): "BATTLE-rattle", "NEVER-sever"
- Include slant rhymes and consonance for density
- Maintain perfect flow while showcasing technical complexity
` : ''}

BATTLE STRATEGY:
- Directly dismantle their specific bars and flip their own words against them
- Use aggressive confidence and intimidation tactics
- Show technical superiority through superior wordplay and advanced rhyming techniques
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

Return ONLY 4 lines of raw rap verses with line breaks. No reasoning, no quotes, no commentary - just the rap lines.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Using faster model without reasoning overhead
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 1024,
        temperature: Math.min(0.95, 0.6 + (lyricComplexity / 100) * 0.35 + (styleIntensity / 100) * 0.15),
        top_p: 0.9
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
    
    const choice = result.choices[0];
    const responseContent = choice?.message?.content || choice?.message?.reasoning;
    
    if (!responseContent) {
      throw new Error(`Groq API response missing content and reasoning: ${JSON.stringify(choice)}`);
    }

    // Enhance response with advanced rhyming techniques for hard difficulty
    if (difficulty === "hard") {
      try {
        const enhancedVerse = this.rhymeEngine.generateAdvancedVerse(userVerse, difficulty);
        // Blend AI response with advanced techniques
        const baseResponse = choice?.message?.content || choice?.message?.reasoning || "";
        return this.blendResponses(baseResponse.trim(), enhancedVerse);
      } catch (error) {
        console.log("Advanced rhyme enhancement failed, using base response:", error);
      }
    }

    // Direct response handling
    if (choice?.message?.content) {
      let response = choice.message.content.trim();
      
      // Apply profanity filter post-processing if enabled
      if (profanityFilter) {
        console.log("Applying profanity filter to response:", response.substring(0, 50) + "...");
        
        const badWords = ['fuck', 'shit', 'bitch', 'damn', 'pussy', 'ass', 'hell', 'crap', 'fuckin', 'fucking', 'fucked'];
        let filtered = response;
        
        badWords.forEach(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          filtered = filtered.replace(regex, (match: string) => {
            // Replace with clean alternatives
            const replacements: { [key: string]: string } = {
              'fuck': 'dang', 'fucking': 'dang', 'fuckin': 'dang', 'fucked': 'beat',
              'shit': 'trash', 'bitch': 'player', 'damn': 'dang',
              'pussy': 'weak', 'ass': 'self', 'hell': 'dang', 'crap': 'trash'
            };
            const lowerWord = word.toLowerCase();
            return replacements[lowerWord] || 'weak';
          });
        });
        
        console.log("Filtered response:", filtered.substring(0, 50) + "...");
        return filtered;
      }
      
      return response;
    }

    // If we got reasoning instead of content, extract clean rap verses
    if (choice?.message?.reasoning) {
      console.log("Extracting rap from reasoning field...");
      
      // Try to extract quoted rap lines from reasoning text
      const reasoningText = choice.message.reasoning;
      const quotedLines = reasoningText.match(/"([^"]{10,})"/g);
      
      if (quotedLines && quotedLines.length >= 1) {
        const cleanLines = quotedLines.map((line: string) => line.replace(/"/g, '').trim());
        return cleanLines.slice(0, 4).join('\n'); // Take first 4 lines
      }
      
      // Fallback: generate a simple response
      console.log("Using fallback rap response due to parsing failure");
      return `Your flow's decent but I'm bringing the heat,\nLyrics so sharp, got you down in defeat,\nStep to the mic, watch me spit fire clean,\nBest battle rapper that you've ever seen.`;
    }

    return responseContent;
  }
}

export const groqService = new GroqService();

// Legacy export for backwards compatibility
export async function generateAIResponse(
  prompt: string, 
  difficulty = "normal", 
  profanityFilter = false,
  lyricComplexity = 50,
  styleIntensity = 50
): Promise<string> {
  return groqService.generateRapResponse(prompt, difficulty, profanityFilter, lyricComplexity, styleIntensity);
}
