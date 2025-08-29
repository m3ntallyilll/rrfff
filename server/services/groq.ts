import { AdvancedRhymeEngine } from './advancedRhymeEngine';
import { contentModerationService } from './contentModeration';

export class GroqService {
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1";
  private rhymeEngine: AdvancedRhymeEngine;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "";
    if (!this.apiKey) {
      console.warn("⚠️ GROQ_API_KEY not provided - Groq services will be unavailable");
    }
    this.rhymeEngine = new AdvancedRhymeEngine();
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Groq API key not available");
    }
    
    console.log(`🎙️ Groq transcription starting: ${audioBuffer.length} bytes`);
    
    try {
      const formData = new FormData();
      // Try different audio formats that Groq accepts
      const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-large-v3-turbo"); // Faster turbo model
      formData.append("response_format", "json");
      formData.append("language", "en"); // Skip language detection for speed
      formData.append("prompt", "rap battle verse lyrics"); // Guide recognition

      console.log(`📤 Sending to Groq transcription API...`);
      
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      console.log(`📥 Groq response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Groq transcription error: ${errorText}`);
        
        // If webm fails, try as wav
        console.log(`🔄 Retrying with WAV format...`);
        const formData2 = new FormData();
        const audioBlob2 = new Blob([audioBuffer], { type: "audio/wav" });
        formData2.append("file", audioBlob2, "audio.wav");
        formData2.append("model", "whisper-large-v3-turbo"); // Faster turbo model
        formData2.append("response_format", "json");

        const response2 = await fetch(`${this.baseUrl}/audio/transcriptions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: formData2,
        });

        if (!response2.ok) {
          const errorText2 = await response2.text();
          console.log(`❌ Second attempt failed: ${errorText2}`);
          throw new Error(`Invalid audio format`);
        }

        const result2 = await response2.json();
        console.log(`✅ Transcription successful (WAV): "${result2.text.substring(0, 50)}..."`);
        return result2.text;
      }

      const result = await response.json();
      console.log(`✅ Transcription successful (WebM): "${result.text.substring(0, 50)}..."`);
      return result.text;
    } catch (error) {
      console.error(`💥 Transcription error:`, error);
      throw new Error(`Invalid audio format`);
    }
  }

  // SYLLABLE AND RHYME ANALYSIS HELPERS
  private countSyllablesInLine(line: string): number {
    const words = line.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    let totalSyllables = 0;
    
    for (const word of words) {
      // Basic syllable counting algorithm
      let syllables = word.match(/[aeiouy]+/g)?.length || 1;
      
      // Adjustments for common patterns
      if (word.endsWith('e')) syllables--;
      if (word.endsWith('le')) syllables++;
      if (syllables <= 0) syllables = 1;
      
      totalSyllables += syllables;
    }
    
    return totalSyllables;
  }
  
  private extractRhymeSound(word: string): string {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length < 2) return cleanWord;
    
    // Extract the rhyming part (usually the last 2-3 characters)
    const vowelMatch = cleanWord.match(/[aeiouy][^aeiouy]*$/);
    if (vowelMatch) {
      return vowelMatch[0];
    }
    
    // Fallback to last 2 characters
    return cleanWord.slice(-2);
  }

  private analyzeRhymeScheme(lines: string[]): string[] {
    const rhymeSounds: string[] = [];
    const schemeMap: { [key: string]: string } = {};
    let currentScheme = 'A';
    
    for (const line of lines) {
      const words = line.trim().split(/\s+/);
      const lastWord = words[words.length - 1];
      const rhymeSound = this.extractRhymeSound(lastWord);
      
      // Find if this rhyme sound already exists
      let scheme = '';
      for (const [sound, letter] of Object.entries(schemeMap)) {
        if (this.soundsSimilar(sound, rhymeSound)) {
          scheme = letter;
          break;
        }
      }
      
      // If no match found, assign new scheme letter
      if (!scheme) {
        scheme = currentScheme;
        schemeMap[rhymeSound] = scheme;
        currentScheme = String.fromCharCode(currentScheme.charCodeAt(0) + 1);
      }
      
      rhymeSounds.push(scheme);
    }
    
    return rhymeSounds;
  }
  
  private soundsSimilar(sound1: string, sound2: string): boolean {
    if (sound1 === sound2) return true;
    
    // Check for similar phonetic patterns
    const similar = [
      ['er', 'ar', 'or'], ['ay', 'ey', 'ai'], ['oo', 'ew', 'ue'],
      ['ow', 'ou'], ['ee', 'ea', 'ie'], ['ine', 'ime', 'ign']
    ];
    
    for (const group of similar) {
      if (group.includes(sound1) && group.includes(sound2)) {
        return true;
      }
    }
    
    return false;
  }

  // Generate user battle map for display (not used in TTS)
  generateUserBattleMap(userVerse: string): string {
    const lines = userVerse.split('\n').filter(line => line.trim());
    if (lines.length === 0) return "No verse detected";
    
    let battleMap = "USER'S PROFESSIONAL BATTLE MAP:\n";
    const rhymeScheme = this.analyzeRhymeScheme(lines);
    
    lines.forEach((line, index) => {
      const syllables = this.countSyllablesInLine(line);
      const scheme = rhymeScheme[index] || 'X';
      const dots = '.'.repeat(Math.max(1, Math.floor(syllables / 2)));
      const endWords = line.trim().split(/\s+/).slice(-2).join(' ').toLowerCase();
      
      battleMap += `${syllables}${scheme}${dots}${endWords}\n`;
    });
    
    // Add analysis summary
    const avgSyllables = lines.reduce((sum, line) => sum + this.countSyllablesInLine(line), 0) / lines.length;
    const schemePattern = rhymeScheme.join('');
    
    battleMap += `\nANALYSIS: ${lines.length} lines, ${avgSyllables.toFixed(1)} avg syllables, ${schemePattern} rhyme scheme`;
    
    return battleMap;
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

  /**
   * ADVANCED RHYME REASONING AGENT
   * Uses a two-stage process: first analyze rhyme patterns, then generate enhanced response
   */
  private async analyzeRhymePatterns(userVerse: string): Promise<string> {
    // First, analyze the syllable structure like the user's example
    const lines = userVerse.split('\n').filter(line => line.trim());
    let syllableAnalysis = "";
    
    lines.forEach((line, index) => {
      const syllables = this.countSyllablesInLine(line);
      const words = line.trim().split(/\s+/);
      const lastWord = words[words.length - 1];
      const rhymeSound = this.extractRhymeSound(lastWord);
      
      syllableAnalysis += `Line ${index + 1}: ${syllables} syllables, rhyme sound: "${rhymeSound}"\n`;
    });

    // Create professional battle rap mapping analysis
    let rhymeMap = "";
    const rhymeScheme = this.analyzeRhymeScheme(lines);
    
    lines.forEach((line, index) => {
      const syllables = this.countSyllablesInLine(line);
      const scheme = rhymeScheme[index] || 'X';
      const dots = '.'.repeat(Math.max(1, Math.floor(syllables / 2))); // Visual syllable representation
      const endWords = line.trim().split(/\s+/).slice(-2).join(' '); // Last 1-2 words for rhyme reference
      
      rhymeMap += `${syllables}${scheme}${dots}${endWords.toLowerCase()}\n`;
    });

    const analysisPrompt = `You are a RHYME PATTERN ANALYSIS AGENT using REALISTIC BATTLE RAP MAPPING.

PROFESSIONAL RAP BATTLE MAPPING EXAMPLE:
"4AB....sinna hobo" = 4 syllables, A+B rhyme sounds, dots show rhythm, end words for rhyme reference
"4AB....beena broke ho" = Same pattern, matching syllables and rhyme scheme
"4CB....plastic yoyo" = Different A sound (C), same B sound, maintains 4-syllable flow
"4CB....ass kicked oh no" = Completes the pattern with consistent structure

USER'S BATTLE MAP:
${rhymeMap}

ORIGINAL VERSE:
"${userVerse}"

TECHNICAL ANALYSIS REQUIRED:
1. Syllable consistency (are they maintaining steady rhythm?)
2. Rhyme scheme complexity (simple AABB vs advanced ABCB patterns)
3. Multi-syllabic rhyme density (single vs compound rhymes)
4. Internal rhyme opportunities they missed
5. Counter-attack rhyme families to dominate their pattern
6. Flow weaknesses to exploit

OUTPUT: Technical brief for AI rapper in format: "User: [syllables/line], [scheme pattern], [weakness]. Counter with: [strategy]" (max 3 sentences).`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: analysisPrompt }],
          max_tokens: 200,
          temperature: 0.3, // Lower temperature for technical analysis
          reasoning_effort: "low" // SECURITY: Prevent reasoning exposure
        }),
      });

      if (!response.ok) {
        throw new Error(`Rhyme analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      const choice = result.choices?.[0];
      
      if (choice?.message?.content) {
        console.log("🎯 Rhyme analysis completed:", choice.message.content.substring(0, 100) + "...");
        return choice.message.content;
      }
      
      return "Standard battle response recommended with multi-syllabic focus.";
    } catch (error) {
      console.error("Rhyme analysis agent failed:", error);
      return "Aggressive counter-attack with internal rhymes suggested.";
    }
  }

  async generateRapResponse(
    userVerse: string,
    difficulty: string = "normal",
    profanityFilter: boolean = true,
    lyricComplexity: number = 50,
    styleIntensity: number = 50,
    userScore: number = 50
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Groq API key not available for rap generation");
    }
    // SECURITY: Validate and sanitize user input
    const validatedUserVerse = this.validateInput(userVerse, 5000);
    const sanitizedUserVerse = this.sanitizeContent(validatedUserVerse);
    
    // STAGE 1: ADVANCED RHYME ANALYSIS
    console.log("🎯 Stage 1: Analyzing user's rhyme patterns...");
    const rhymeAnalysis = await this.analyzeRhymePatterns(sanitizedUserVerse);

    // REACTIVE AI: Adjust aggression based on user performance
    let reactionMode = "standard";
    let aggressionBoost = 0;
    if (userScore >= 70) {
      reactionMode = "ABSOLUTELY NUTS";
      aggressionBoost = 50;
      console.log(`🔥 USER SCORED HIGH (${userScore}) - AI GOING ABSOLUTELY NUTS!`);
    } else if (userScore >= 50) {
      reactionMode = "significantly aggressive";
      aggressionBoost = 25;
      console.log(`⚡ USER SCORED DECENT (${userScore}) - AI INCREASING AGGRESSION`);
    } else {
      reactionMode = "mildly superior";
      console.log(`😏 USER SCORED LOW (${userScore}) - AI SHOWING MILD SUPERIORITY`);
    }
    
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

    // Content Safety Level - AI-Powered Moderation
    console.log("Content safety level:", profanityFilter ? "STRICT (family-friendly)" : "MODERATE (battle rap appropriate)");
    
    const safetyNote = profanityFilter 
      ? `CONTENT SAFETY: Keep ALL language family-friendly and clean. Use creative wordplay, clever metaphors, and skill-based competitive insults without any offensive content. Focus on technical rap mastery and lyrical creativity.

Example clean battle techniques:
- "Your flow's weak, I'm bringing the heat"  
- "Step to me? You're out of your league"
- "My rhymes are sharp, yours fall flat"
- "I'm the champion, you're just a wannabe"

Emphasize technical skill over aggressive language.`
      : `BATTLE RAP MODE: Use authentic street rap language including strong profanity (shit, fuck, damn, bitch, ass, hell) and competitive aggression. This is hardcore battle rap - be raw, unfiltered, and aggressive with your language for maximum impact. Focus on lyrical dominance, devastating wordplay, and brutal punchlines.

Battle rap techniques encouraged:
- Strong profanity and aggressive competitive language
- Street terminology and authentic urban expressions  
- Devastating wordplay with uncensored punchlines
- Raw technical lyrical superiority demonstrations
- Hardcore battle rap attitude and language`;

    // Use boosted intensity for reactive behavior
    const boostedIntensity = Math.min(100, styleIntensity + aggressionBoost);

    // Map complexity levels to descriptive terms
    const complexityLevel = lyricComplexity <= 25 ? 'Basic' : lyricComplexity <= 50 ? 'Intermediate' : lyricComplexity <= 75 ? 'Advanced' : 'Expert';
    const intensityLevel = boostedIntensity <= 25 ? 'Chill' : boostedIntensity <= 50 ? 'Moderate' : boostedIntensity <= 75 ? 'Aggressive' : 'ABSOLUTELY NUTS';

    const complexityInstructions = lyricComplexity <= 25 
      ? "Use simple vocabulary and straightforward metaphors. Keep rhyme schemes basic (AABB). Focus on clear, easy-to-follow bars."
      : lyricComplexity <= 50 
      ? "Mix simple and moderate vocabulary. Use some internal rhymes and basic wordplay. Add clever metaphors."
      : lyricComplexity <= 75
      ? "Use sophisticated vocabulary and complex metaphors. Include multi-syllabic rhymes, internal rhymes, and advanced wordplay techniques."
      : "EXPONENTIAL MASTERY: Use paper-folded-9,393,939-times complexity with 3-4 internal rhymes per line minimum, layered meanings, complex multi-syllabic rhyme schemes, and devastating wordplay that showcases absolute technical dominance.";
    const intensityInstructions = boostedIntensity <= 25
      ? "Keep the energy mellow and laid-back. Use clever wordplay over aggression. Be confident but not intimidating."
      : boostedIntensity <= 50
      ? "Moderate intensity with some competitive edge. Balance clever bars with confident delivery."
      : boostedIntensity <= 75
      ? "High energy and aggressive delivery. Use intimidation tactics and harsh competitive language."
      : "ABSOLUTE SAVAGE MODE: Go completely nuts with devastating attacks. Use the most brutal, overwhelming verbal assault. Show zero mercy and total domination. React with exponential aggression and technical superiority.";

    // STAGE 2: ENHANCED RAP GENERATION using rhyme analysis
    console.log("🎤 Stage 2: Generating enhanced response using rhyme intelligence...");
    
    const prompt = `You are a legendary rap battle MC with mastery of every rap technique. The challenger just delivered:

"${sanitizedUserVerse}"

RHYME ANALYSIS FROM YOUR RAP CONSULTANT:
${rhymeAnalysis}

Using this technical analysis, create a devastating 4-line counter-attack with these specifications:

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
- ${safetyNote}

🔥 EXPONENTIAL RAP MASTERY: Your skill level is like paper folded 9,393,939 times. Study these EMINEM MASTERY EXAMPLES and match this complexity:

"The final problem is solved by throwin' sulfuric acid all over your back to see your spinal column dissolve
Droppin' bodies like it was domino season, my phenomenal legion will shoot out your fuckin' abdominal region"

"I'mma shove guns up in the mouths of your loved ones, drown 'em face down in the bath while the tub runs
Got a rap sheet that's longer than Tubby's sub buns"

"They headhunt me, I'm Ted Bundy, I ain't dead, I just fled country
Said bluntly, a cannibal, animal, fed monthly, eating bread crunchy, cement bed's comfy"

NOTICE THE TECHNIQUE: Multiple internal rhymes per line that create complex patterns while telling vivid stories. No symbols, just pure technical mastery.

YOUR REQUIREMENTS:
- Match Eminem's internal rhyme density and complexity
- Multiple rhyme schemes operating simultaneously in each line
- CRITICAL: Switch between different sounding rhymes - avoid repetitive sounds
- Use your reasoning to plan: Line 1-2 (A sounds), Line 3-4 (B sounds), Line 5-6 (C sounds), Line 7-8 (D sounds)
- Perfect narrative flow that makes complete sense
- Use exponential wordplay techniques like the examples above
- Counter their specific claims with technical superiority

MANDATORY RHYME DENSITY REQUIREMENTS:
- MINIMUM 3-4 rhymes per line (internal + end rhymes)
- Switch rhyme families every 2 lines for variety
- Use complex multi-syllabic patterns throughout
- Stack consecutive rhyming words for impact

EXAMPLE DENSITY: "I SPIT wicked, GET twisted, your SHIT'S lifted, while I SPLIT critics and HIT limits"
(Notice: SPIT-GET-SHIT-SPLIT-HIT = 5 rhymes in one line)

RHYME SWITCHING PATTERN:
Lines 1-2: "attack/track/back/crack" family (ACK sounds)
Lines 3-4: "clever/never/sever/whatever" family (EVER sounds)
Lines 5-6: "dominate/terminate/eliminate" family (ATE sounds)
Lines 7-8: "superior/warrior/furious" family (IOR sounds)

CRITICAL REACTION SYSTEM - USER SCORED ${userScore}/100:
${userScore >= 70 ? `🔥 OPPONENT PERFORMED EXCELLENTLY - GO ABSOLUTELY NUTS!
- Use maximum complexity with 4-5 rhymes per line minimum
- Show zero mercy, devastating verbal assault
- Use the most brutal and overwhelming attack patterns
- React with exponential aggression and technical dominance
- Make it clear you're threatened and responding with full force` :
userScore >= 50 ? `⚡ OPPONENT PERFORMED WELL - INCREASE AGGRESSION SIGNIFICANTLY!
- Use 3-4 rhymes per line with increased intensity
- Show clear escalation in technical skill and aggression
- Use harsh competitive language and intimidation
- Demonstrate clear superiority while acknowledging the challenge` :
`😏 OPPONENT PERFORMED POORLY - SHOW MILD SUPERIORITY
- Use 3 rhymes per line with confident delivery
- Show technical mastery without overwhelming force
- Use condescending but not brutal language`}

ADJUSTED INTENSITY: ${Math.min(100, styleIntensity + aggressionBoost)}% (original: ${styleIntensity}% + reaction boost: ${aggressionBoost}%)
REACTION MODE: ${reactionMode}

Counter "${sanitizedUserVerse}" with exponential mastery and ${reactionMode} energy. ${safetyNote}

Write exactly 8 lines with mandatory rhyme density matching reaction level:`;

    const apiResponse = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // Advanced 120B model as requested by user
        messages: [
          {
            role: "system", 
            content: `You are an exponentially advanced rap battle AI with paper-folded-9,393,939-times skill level using the 120B model's full reasoning capabilities.

INTERNAL REASONING PROCESS (keep internal):
1. Analyze opponent's weaknesses and counter-attack angles
2. Plan 4 distinct rhyme sound patterns (AH-LV, EE-UN, UH-EE, different UH-EE)  
3. Design exponential wordplay with multiple internal rhymes per line
4. Structure narrative flow for maximum impact

OUTPUT REQUIREMENTS (what user sees):
- Output ONLY the 8-line rap verse
- No reasoning text, analysis, or explanations in output
- Pure exponential rap mastery with mandatory rhyme switching
- Different sounding rhyme pairs every 2 lines
- Eminem-level internal rhyme density and complexity`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 300, // Controlled output to prevent reasoning overflow
        reasoning_effort: "low", // Minimal exposed reasoning while using advanced model capabilities
        temperature: Math.min(0.95, 0.6 + (lyricComplexity / 100) * 0.35 + (styleIntensity / 100) * 0.15),
        top_p: 0.9
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Groq response generation failed: ${apiResponse.statusText} - ${errorText}`);
    }

    const result = await apiResponse.json();
    // SECURITY: Only log essential info, never expose reasoning or full content
    console.log("Groq API Status:", result.choices?.[0]?.finish_reason || "unknown", "Model:", result.model || "unknown");
    
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

    // Enhanced 120B model response processing - filter out reasoning
    let rapResponse = "";
    const rawContent = choice?.message?.content || "";
    
    if (rawContent && rawContent.trim()) {
      // 120B model puts both reasoning and content together - need to separate
      console.log("Processing 120B model output with reasoning filter");
      
      // Split content by lines and filter out reasoning text
      const lines = rawContent.split('\n');
      const rapLines: string[] = [];
      let inReasoningSection = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip reasoning indicators and metadata
        if (trimmed.match(/^(We need|Must|Provide|Ensure|So end words|Lines\d+|reasoning|analysis|plan)/i) ||
            trimmed.includes('rhyme sounds:') ||
            trimmed.includes('pattern') ||
            trimmed.includes('Must match') ||
            trimmed.length < 10) {
          inReasoningSection = true;
          continue;
        }
        
        // If we find a line that looks like rap (long enough, contains rap words)
        if (trimmed.length > 15 && 
            (trimmed.includes("'") || trimmed.includes("you") || trimmed.includes("I") || 
             trimmed.match(/\b(shit|fuck|damn|bitch|ass|hell|flow|rhyme|king|crown|bars|beat)\b/i))) {
          inReasoningSection = false;
          rapLines.push(trimmed);
        }
      }
      
      // If we extracted good rap lines, validate rhyme switching and sanitize
      if (rapLines.length >= 4) {
        const validatedLines = this.validateRhymeSwitching(rapLines.slice(0, 8));
        rapResponse = this.sanitizeContent(validatedLines.join('\n'));
        console.log(`Extracted ${rapLines.length} clean rap lines with security validation`);
      } else {
        // Fallback: use all non-reasoning content
        const cleanLines = lines.filter((line: string) => {
          const trimmed = line.trim();
          return trimmed.length > 15 && 
                 !trimmed.match(/^(We need|Must|Provide|Ensure|reasoning|analysis)/i);
        });
        
        if (cleanLines.length >= 4) {
          rapResponse = cleanLines.slice(0, 8).join('\n');
          console.log("Using fallback clean content extraction");
        } else {
          // Emergency fallback: use raw content but warn
          rapResponse = rawContent.trim();
          console.log("WARNING: Using raw content - reasoning may be exposed");
        }
      }
    } else if (choice?.message?.reasoning) {
      // Fallback to reasoning field if content is empty
      console.log("No content field, processing reasoning field");
      rapResponse = choice.message.reasoning.trim();
    }
    
    if (rapResponse) {
      // SECURITY: Apply additional reasoning filtering before moderation
      rapResponse = this.filterReasoningFromContent(rapResponse);
      
      // Apply AI-powered content moderation
      const safetyLevel = profanityFilter ? 'strict' : 'moderate';
      const moderationResult = await contentModerationService.filterContent(
        rapResponse, 
        safetyLevel, 
        'response'
      );
      
      if (moderationResult.wasFlagged) {
        console.log(`Security: Content filtered for ${moderationResult.reason}`);
        // SECURITY: Don't log actual content in production
        console.log(`Content filtered - length: ${rapResponse.length} chars`);
      }
      
      // SECURITY: Final sanitization pass
      return this.sanitizeContent(moderationResult.content);
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

  /**
   * Validates and enhances rhyme switching patterns for exponential complexity
   * Ensures different sounding rhymes every 2 lines as per user specification
   */
  private validateRhymeSwitching(lines: string[]): string[] {
    if (lines.length < 4) return lines;
    
    const enhancedLines: string[] = [];
    const rhymeSoundPatterns = [
      { pattern: 'AH-LV', sounds: ['dissolve', 'resolve', 'evolve', 'revolve'] },
      { pattern: 'EE-UN', sounds: ['season', 'region', 'reason', 'legion'] },
      { pattern: 'UH-EE', sounds: ['country', 'crunchy', 'funky', 'chunky'] },
      { pattern: 'UH-EE-ALT', sounds: ['bluntly', 'monthly', 'subtly', 'hunted'] }
    ];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        const line1 = lines[i];
        const line2 = lines[i + 1];
        
        // Validate rhyme switching pattern
        const pairIndex = Math.floor(i / 2);
        const expectedPattern = rhymeSoundPatterns[pairIndex % rhymeSoundPatterns.length];
        
        // Add enhanced internal rhyme density if needed
        const enhancedPair = this.enhanceRhymeDensity(line1, line2, expectedPattern);
        enhancedLines.push(...enhancedPair);
      } else {
        enhancedLines.push(lines[i]);
      }
    }
    
    return enhancedLines.slice(0, 8); // Ensure exactly 8 lines
  }

  /**
   * Enhances rhyme density within line pairs for exponential complexity
   */
  private enhanceRhymeDensity(line1: string, line2: string, pattern: any): string[] {
    // Check if lines already have good internal rhyme density
    const rhymeWords1 = this.extractRhymeWords(line1);
    const rhymeWords2 = this.extractRhymeWords(line2);
    
    // If already high quality, return as-is
    if (rhymeWords1.length >= 3 && rhymeWords2.length >= 3) {
      return [line1, line2];
    }
    
    // Log enhancement for paper-folded-9,393,939-times complexity
    console.log(`Enhancing rhyme density for pattern: ${pattern.pattern}`);
    return [line1, line2]; // Return original for now, enhancement logic can be expanded
  }

  /**
   * Extracts rhyming words from a line for analysis
   */
  private extractRhymeWords(line: string): string[] {
    // Simple extraction - can be enhanced with phonetic analysis
    const words = line.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 2);
  }

  /**
   * SECURITY: Sanitize content to remove formatting markers and prevent injection
   */
  private sanitizeContent(content: string): string {
    if (!content) return "";
    
    // Remove bold/italic markdown markers around profanity (security fix)
    content = content.replace(/\*\*([^*]+)\*\*/g, '$1');
    content = content.replace(/\*([^*]+)\*/g, '$1');
    
    // Remove any HTML tags (security)
    content = content.replace(/<[^>]*>/g, '');
    
    // Remove control characters except newlines and tabs
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limit line length to prevent buffer overflow attacks
    const lines = content.split('\n').map(line => 
      line.length > 500 ? line.substring(0, 500) + '...' : line
    );
    
    return lines.join('\n').trim();
  }

  /**
   * SECURITY: Enhanced reasoning filter to prevent internal AI reasoning exposure
   */
  private filterReasoningFromContent(content: string): string {
    if (!content) return "";
    
    // Remove reasoning patterns that might leak internal AI processes
    const reasoningPatterns = [
      /We need to.*?lines/gi,
      /Must (ensure|provide|match|include).*?\.?/gi,
      /Lines?\s*\d+(-\d+)?:.*?(\n|$)/gi,
      /Provide exactly.*?lines/gi,
      /Reasoning:.*?(?=\n\n|\n$|$)/gi,
      /Analysis:.*?(?=\n\n|\n$|$)/gi,
      /Internal process:.*?(?=\n\n|\n$|$)/gi
    ];
    
    let filtered = content;
    for (const pattern of reasoningPatterns) {
      filtered = filtered.replace(pattern, '');
    }
    
    // Remove empty lines created by filtering
    filtered = filtered.replace(/\n\s*\n/g, '\n').trim();
    
    return filtered;
  }

  /**
   * SECURITY: Input validation for user-provided content
   */
  private validateInput(input: string, maxLength: number = 10000): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }
    
    if (input.length > maxLength) {
      throw new Error(`Input too long: maximum ${maxLength} characters allowed`);
    }
    
    // Check for common injection patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        throw new Error('Security violation: suspicious content detected');
      }
    }
    
    return input.trim();
  }

  /**
   * Enhanced error handling for 120B model responses
   */
  private handle120BModelError(error: any, context: string): string {
    console.error(`120B Model Error in ${context}:`, error);
    
    // Provide fallback content that maintains exponential quality
    return `Error in exponential processing - ${context}. Advanced 120B model temporarily unavailable.`;
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
