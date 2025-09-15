export interface CrowdReactionAnalysis {
  reactionType: 'silence' | 'mild_approval' | 'hype' | 'wild_cheering' | 'booing' | 'shocked_gasps';
  intensity: number; // 0-100
  reasoning: string;
  timing: 'immediate' | 'delayed' | 'buildup';
}

import { GroqService } from './groq.js';

export class CrowdReactionService {
  private groqService: GroqService;

  constructor() {
    this.groqService = new GroqService();
  }
  
  /**
   * Analyzes rap lyrics using Groq AI to determine appropriate crowd reaction
   */
  async analyzeForCrowdReaction(lyrics: string, context?: {
    previousLyrics?: string;
    battlePhase?: 'opening' | 'middle' | 'closing';
    userPerformanceScore?: number;
  }): Promise<CrowdReactionAnalysis> {
    
    const cleanLyrics = lyrics.toLowerCase().trim();
    
    // Quick analysis for very short inputs
    if (cleanLyrics.length < 5) {
      return {
        reactionType: 'silence',
        intensity: 10,
        reasoning: 'Too brief for crowd reaction',
        timing: 'immediate'
      };
    }

    // Use Groq AI for intelligent crowd reaction analysis
    try {
      const prompt = `You are an expert battle rap crowd analyzer. Analyze these lyrics ONLY for SPECIFIC TRIGGER WORDS and phrases that would make a crowd react. DO NOT react to timing, length, or general performance - ONLY specific trigger words.

LYRICS: "${lyrics}"

TRIGGER WORD CATEGORIES (crowd reacts ONLY to these):

🔥 DESTRUCTION WORDS (wild_cheering 80-95%):
- kill, murder, destroy, demolish, wreck, finish, slay, slaughter, massacre, eliminate, annihilate, obliterate, devastate, erase, delete

🏆 VICTORY WORDS (wild_cheering 75-90%):
- mic drop, game over, checkmate, done deal, case closed, lights out, victory, winner, champion, conquered, dominated, owned

⚡ INTENSITY WORDS (hype 65-80%):
- savage, brutal, ruthless, vicious, deadly, lethal, killer, beast, monster, demon, devil, nightmare, terror, horror

🔥 HEAT WORDS (hype 60-75%):
- fire, flames, burning, heat, blazing, inferno, torch, roast, hot, heated, steaming, smoking, sizzling, scorching

👑 SUPERIORITY WORDS (hype 55-70%):
- king, crown, throne, legend, god, boss, chief, master, elite, supreme, ultimate, best, greatest, unmatched

⚔️ BATTLE WORDS (mild_approval 45-60%):
- step to me, come at me, try me, test me, bring it, face me, challenge, next level, different league, schooling, amateur

💀 PERSONAL ATTACK WORDS (shocked_gasps 50-75%):
- your mama, your girl, your crew, your family, weak, trash, garbage, pathetic, terrible, awful, wack, basic, lame

RULES:
- NO reaction unless specific trigger words are present
- Multiple trigger words = higher intensity
- Single weak word = lower intensity
- NO reactions for general rap content without triggers
- Match exact words/phrases from categories above

JSON ONLY: {"reactionType":"wild_cheering","intensity":85,"reasoning":"Found trigger words: fire, destroy","timing":"immediate"}`;

      const response = await this.groqService.generateRapResponse(prompt);

      // Enhanced JSON extraction - handle cases where AI returns extra text
      let cleanResponse = response.trim();
      
      // Look for JSON pattern in the response
      const jsonMatch = cleanResponse.match(/\{[^{}]*"reactionType"[^{}]*\}/g);
      if (jsonMatch) {
        cleanResponse = jsonMatch[jsonMatch.length - 1]; // Get the last/best match
      } else {
        // If no JSON found, try to extract content between first { and last }
        const start = cleanResponse.indexOf('{');
        const end = cleanResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          cleanResponse = cleanResponse.substring(start, end + 1);
        }
      }
      
      // Parse JSON response
      const analysis = JSON.parse(cleanResponse);
      
      // Validate response structure
      if (analysis.reactionType && typeof analysis.intensity === 'number' && analysis.reasoning) {
        return {
          reactionType: analysis.reactionType,
          intensity: Math.max(0, Math.min(100, analysis.intensity)),
          reasoning: analysis.reasoning,
          timing: analysis.timing || 'immediate'
        };
      }
      
      // Fallback if JSON parsing fails
      throw new Error('Invalid AI response format');
      
    } catch (error) {
      console.error('🤖 Groq crowd analysis failed - retrying with enhanced prompt:', (error as Error).message);
      
      // RETRY WITH SIMPLER, MORE RELIABLE PROMPT
      try {
        const retryPrompt = `As a battle rap crowd expert, analyze this lyric:

"${lyrics}"

Rate crowd reaction (0-100) and pick ONE type:
- silence (0-20): weak, boring, or basic content with no impact (not worthy of the legends)
- mild_approval (21-40): decent bars with some skill shown (beginner level)
- hype (41-70): good wordplay, flow, or clever content (getting closer to legendary status)
- wild_cheering (71-90): devastating punchlines, complex wordplay, or jaw-dropping skill (worthy of The Destroyer, The Reaper, or Thunderstrike level)
- booing (0-30): terrible performance, cringe, or offensive content (insulting to the legends)
- shocked_gasps (50-80): controversial, surprising, or unexpectedly clever content (Shadow or Ghost level surprise)

Consider battle rap crowd psychology: they want skill, cleverness, aggression, and entertainment worthy of legendary battle rap personas.

JSON only: {"reactionType":"wild_cheering","intensity":85,"reasoning":"devastating punchline","timing":"immediate"}`;

        const retryResponse = await this.groqService.generateRapResponse(retryPrompt);
        
        // Enhanced JSON extraction for retry response
        let cleanRetryResponse = retryResponse.trim();
        
        // Extract JSON from the response if it contains extra text
        const retryJsonMatch = cleanRetryResponse.match(/\{[^{}]*"reactionType"[^{}]*\}/g);
        if (retryJsonMatch) {
          cleanRetryResponse = retryJsonMatch[retryJsonMatch.length - 1]; // Get the last match
        } else {
          // If no JSON found, try to extract content between first { and last }
          const start = cleanRetryResponse.indexOf('{');
          const end = cleanRetryResponse.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            cleanRetryResponse = cleanRetryResponse.substring(start, end + 1);
          }
        }
        
        const retryAnalysis = JSON.parse(cleanRetryResponse);
        
        if (retryAnalysis.reactionType && typeof retryAnalysis.intensity === 'number') {
          return {
            reactionType: retryAnalysis.reactionType,
            intensity: Math.max(0, Math.min(100, retryAnalysis.intensity)),
            reasoning: retryAnalysis.reasoning || 'AI analysis completed',
            timing: retryAnalysis.timing || 'immediate'
          };
        }
      } catch (retryError) {
        console.error('🤖 AI retry also failed:', (retryError as Error).message);
      }
      
      // ONLY IF BOTH AI ATTEMPTS FAIL: Return minimal response
      return {
        reactionType: 'silence',
        intensity: 15,
        reasoning: 'AI analysis unavailable - no reaction',
        timing: 'immediate'
      };
    }
  }

  /**
   * FIXED: Lightweight pattern analysis without phonetic analyzer to prevent memory leaks and infinite loops
   */
  private fallbackPatternAnalysis(lyrics: string, context?: any): CrowdReactionAnalysis {
    const cleanLyrics = lyrics.toLowerCase().trim();

    // ENHANCED PUNCHLINE DETECTION - Triggers wild reactions
    const punchlineIndicators = [
      // Destruction words
      /killed|murder|destroy|demolish|wreck|finish|annihilate|obliterate|devastate/i,
      /slay|slaughter|massacre|eliminate|erase|vanish|delete/i,
      
      // Battle victory words  
      /mic drop|game over|checkmate|done deal|case closed|lights out/i,
      /victory|winner|champion|conquered|dominated|owned/i,
      
      // Intensity words
      /savage|brutal|ruthless|vicious|deadly|lethal|killer|beast/i,
      /monster|demon|devil|nightmare|terror|horror/i,
      
      // Heat/Fire words
      /\b(fire|flames|burning|heat|blazing|inferno|torch|roast)\b/i,
      /hot|heated|steaming|smoking|sizzling|scorching/i,
      
      // Personal attacks
      /your mama|your girl|your crew|your family|your squad/i,
      /your style|your flow|your bars|your rhymes/i,
      
      // Weakness calls
      /weak|trash|garbage|amateur|pathetic|terrible|awful|wack/i,
      /basic|lame|boring|tired|played out|expired/i,
      
      // Superiority claims
      /king|crown|throne|legend|god|boss|chief|master/i,
      /elite|supreme|ultimate|best|greatest|unmatched/i
    ];
    
    const hasPunchline = punchlineIndicators.some(pattern => pattern.test(lyrics));
    
    // WORDPLAY DETECTION - Triggers appreciation
    const wordplayIndicators = [
      /\b(\w+).*\b\1\b/g, // Word repetition with different context
      /(\w+ing)\b.*\b(\w+ing)\b/g, // Rhyming -ing words
      /(\w+tion)\b.*\b(\w+tion)\b/g, // Rhyming -tion words
      /\b(\w+).*\b(\w+\1|\1\w+)\b/g // Sound-alike words
    ];
    
    let wordplayCount = 0;
    wordplayIndicators.forEach(pattern => {
      const matches = lyrics.match(pattern);
      if (matches) wordplayCount += matches.length;
    });

    // ENHANCED BATTLE TACTICS DETECTION - Triggers hype
    const battleTactics = [
      // Direct challenges
      /\b(step to me|come at me|try me|test me|bring it|face me)\b/i,
      /\b(challenge|dare|bet|wanna go|let's go|square up)\b/i,
      
      // Skill comparisons
      /\b(next level|different league|out your league|not your level)\b/i,
      /\b(can't compete|can't match|can't touch|can't reach)\b/i,
      
      // Teaching/dominance
      /\b(schooling|teaching|lesson|homework|class|school)\b/i,
      /\b(professor|teacher|master class|education|learn)\b/i,
      
      // Experience taunts
      /\b(amateur|rookie|beginner|newbie|novice|freshman)\b/i,
      /\b(veteran|experienced|been here|done that|seen it all)\b/i,
      
      // Battle positioning
      /\b(top spot|number one|first place|throne|crown)\b/i,
      /\b(undefeated|champion|winner|victor|conqueror)\b/i
    ];
    
    const hasBattleTactics = battleTactics.some(pattern => pattern.test(lyrics));

    // CROWD ENERGY WORDS - Direct crowd triggers
    const energyWords = [
      /everybody|crowd|people|y'all|listen up/i,
      /hands up|jump|bounce|move|dance/i,
      /louder|scream|shout|noise/i,
      /energy|vibe|feeling|atmosphere/i
    ];
    
    const hasCrowdEnergy = energyWords.some(pattern => pattern.test(lyrics));

    // CONTROVERSIAL/SHOCKING CONTENT - Triggers gasps or boos
    const controversialContent = [
      /damn|hell|shit|fuck/i,
      /controversial|shocking|offensive|wild/i,
      /can't believe|no way|what the|holy/i
    ];
    
    const isControversial = controversialContent.some(pattern => pattern.test(lyrics));

    // FLOW AND RHYTHM ANALYSIS
    const wordCount = cleanLyrics.split(/\s+/).length;
    const syllableEstimate = this.estimateSyllables(cleanLyrics);
    const flowQuality = this.analyzeFlowQuality(cleanLyrics);
    
    // DECISION LOGIC
    let reactionType: CrowdReactionAnalysis['reactionType'] = 'mild_approval';
    let intensity = 30;
    let reasoning = 'Standard verse delivery';
    let timing: CrowdReactionAnalysis['timing'] = 'immediate';

    // STRICT FILTERING: Only react to truly impressive content
    // Filter out basic/simple phrases
    const basicPhrases = ['you suck', 'that sucks', 'you bad', 'you weak', 'musik', 'fighting', 
                         'po fighting', 'yo yo', 'yeah yeah', 'uh huh', 'come on', 'let me'];
    const isBasicPhrase = basicPhrases.some(phrase => cleanLyrics.includes(phrase.toLowerCase()));
    
    if (isBasicPhrase && wordCount < 6) {
      reactionType = 'silence';
      intensity = 5;
      reasoning = 'Basic phrase - no crowd reaction needed';
      timing = 'immediate';
    }
    // High-impact punchlines get wild reactions (requires both punchline AND wordplay)
    else if (hasPunchline && wordplayCount > 1) {
      reactionType = 'wild_cheering';
      intensity = 85 + Math.min(15, wordplayCount * 3);
      reasoning = 'Devastating punchline with complex wordplay detected';
      timing = 'delayed'; // Let the punchline land first
    }
    
    // Complex wordplay gets appreciation (increased threshold)
    else if (wordplayCount >= 3) {
      reactionType = 'hype';
      intensity = 60 + Math.min(30, wordplayCount * 5);
      reasoning = `Complex wordplay detected (${wordplayCount} instances)`;
      timing = 'buildup';
    }
    
    // Battle tactics get crowd hype
    else if (hasBattleTactics) {
      reactionType = 'hype';
      intensity = 70;
      reasoning = 'Battle tactics and aggression detected';
      timing = 'immediate';
    }
    
    // Direct crowd engagement
    else if (hasCrowdEnergy) {
      reactionType = 'wild_cheering';
      intensity = 75;
      reasoning = 'Direct crowd engagement detected';
      timing = 'immediate';
    }
    
    // Controversial content gets shocked gasps (no randomness)
    else if (isControversial) {
      reactionType = 'shocked_gasps';
      intensity = 65;
      reasoning = 'Controversial content detected';
      timing = 'immediate';
    }
    
    // Very good flow gets appreciation (RAISED THRESHOLD)
    else if (flowQuality > 85 && wordCount > 8) {
      reactionType = 'hype';
      intensity = Math.min(80, flowQuality);
      reasoning = 'Exceptional flow and rhythm detected';
      timing = 'buildup';
    }
    
    // Default: Most content gets silence/no reaction
    else {
      reactionType = 'silence';
      intensity = 10;
      reasoning = 'Standard content - no crowd reaction needed';
      timing = 'immediate';
    }
    
    // Poor performance gets silence (no randomness)
    if (wordCount < 3 || flowQuality < 20) {
      reactionType = 'silence';
      intensity = Math.max(10, 30 - wordCount * 5);
      reasoning = 'Weak performance detected - no trigger words found';
      timing = 'immediate';
    }

    // Apply context adjustments
    if (context) {
      if (context.userPerformanceScore && context.userPerformanceScore > 70) {
        intensity = Math.min(100, intensity + 15);
        reasoning += ' (boosted for high performance)';
      }
      
      if (context.battlePhase === 'closing' && reactionType === 'wild_cheering') {
        intensity = Math.min(100, intensity + 10);
        reasoning += ' (finale boost)';
      }
    }

    return {
      reactionType,
      intensity,
      reasoning,
      timing
    };
  }

  private estimateSyllables(text: string): number {
    const words = text.split(/\s+/);
    let totalSyllables = 0;
    
    for (const word of words) {
      totalSyllables += this.countSyllablesSimple(word);
    }
    
    return totalSyllables;
  }

  private analyzeFlowQuality(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.estimateSyllables(text);
    
    if (words.length === 0) return 0;
    
    // Ideal syllable-to-word ratio for rap flow
    const syllableWordRatio = syllables / words.length;
    const idealRatio = 1.5; // Sweet spot for rap flow
    
    // Penalize if too far from ideal
    const ratioScore = Math.max(0, 100 - Math.abs(syllableWordRatio - idealRatio) * 30);
    
    // Bonus for good word count (4-12 words is good for a quick verse)
    const wordCountScore = words.length >= 4 && words.length <= 12 ? 20 : 0;
    
    // Bonus for varied word lengths
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const varietyScore = avgWordLength >= 4 && avgWordLength <= 6 ? 15 : 0;
    
    return Math.min(100, ratioScore + wordCountScore + varietyScore);
  }

  /**
   * Simple syllable counting without phonetic analyzer
   */
  private countSyllablesSimple(word: string): number {
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
    return vowelGroups ? vowelGroups.length : 1;
  }

  /**
   * Maps reaction type to SFX intensity levels
   */
  mapToSFXIntensity(reaction: CrowdReactionAnalysis): 'mild' | 'medium' | 'wild' {
    switch (reaction.reactionType) {
      case 'silence':
        return 'mild';
      case 'mild_approval':
        return 'mild';
      case 'hype':
        return 'medium';
      case 'wild_cheering':
        return 'wild';
      case 'booing':
        return 'medium';
      case 'shocked_gasps':
        return 'medium';
      default:
        return 'mild';
    }
  }

  /**
   * Determines delay timing for reaction
   */
  getReactionDelay(reaction: CrowdReactionAnalysis): number {
    switch (reaction.timing) {
      case 'immediate':
        return 100; // Almost instant
      case 'delayed':
        return 800; // Let the line finish
      case 'buildup':
        return 400; // Quick buildup
      default:
        return 300;
    }
  }
}

export const crowdReactionService = new CrowdReactionService();