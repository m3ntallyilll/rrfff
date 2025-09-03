export interface CrowdReactionAnalysis {
  reactionType: 'silence' | 'mild_approval' | 'hype' | 'wild_cheering' | 'booing' | 'shocked_gasps';
  intensity: number; // 0-100
  reasoning: string;
  timing: 'immediate' | 'delayed' | 'buildup';
}

export class CrowdReactionService {
  
  /**
   * Analyzes rap lyrics in real-time to determine appropriate crowd reaction
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

    // PUNCHLINE DETECTION - Triggers wild reactions
    const punchlineIndicators = [
      /killed|murder|destroy|demolish|wreck|finish/i,
      /mic drop|game over|checkmate|done deal/i,
      /savage|brutal|ruthless|vicious/i,
      /\b(fire|flames|burning|heat)\b/i,
      /your mama|your girl|your crew/i,
      /weak|trash|garbage|amateur/i,
      /king|crown|throne|legend/i
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

    // BATTLE TACTICS DETECTION - Triggers hype
    const battleTactics = [
      /step to me|come at me|try me|test me/i,
      /next level|different league|out your league/i,
      /schooling|teaching|lesson|homework/i,
      /amateur|rookie|beginner|newbie/i
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

    // High-impact punchlines get wild reactions
    if (hasPunchline && wordplayCount > 0) {
      reactionType = 'wild_cheering';
      intensity = 85 + Math.min(15, wordplayCount * 3);
      reasoning = 'Devastating punchline with wordplay detected';
      timing = 'delayed'; // Let the punchline land first
    }
    
    // Complex wordplay gets appreciation
    else if (wordplayCount >= 2) {
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
    
    // Controversial content gets mixed reactions
    else if (isControversial) {
      reactionType = Math.random() > 0.6 ? 'shocked_gasps' : 'booing';
      intensity = 65;
      reasoning = 'Controversial content detected';
      timing = 'immediate';
    }
    
    // Very good flow gets appreciation
    else if (flowQuality > 75) {
      reactionType = 'hype';
      intensity = Math.min(80, flowQuality);
      reasoning = 'Exceptional flow and rhythm detected';
      timing = 'buildup';
    }
    
    // Poor performance gets silence or boos
    else if (wordCount < 3 || flowQuality < 20) {
      reactionType = Math.random() > 0.7 ? 'booing' : 'silence';
      intensity = Math.max(10, 30 - wordCount * 5);
      reasoning = 'Weak performance detected';
      timing = 'delayed';
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
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length === 0) continue;
      
      // Basic syllable counting
      const vowelMatches = cleanWord.match(/[aeiouy]+/g);
      const vowelCount = vowelMatches ? vowelMatches.length : 1;
      
      // Adjust for silent e
      const silentE = cleanWord.endsWith('e') && vowelCount > 1 ? 1 : 0;
      totalSyllables += Math.max(1, vowelCount - silentE);
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