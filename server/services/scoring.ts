import { type RoundScores } from "@shared/schema";

export class ScoringService {
  calculateRhymeDensity(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 0;

    // Calculate end rhymes (line endings)
    let endRhymes = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      const word1 = this.getLastWord(lines[i]);
      const word2 = this.getLastWord(lines[i + 1]);
      if (this.wordsRhyme(word1, word2)) {
        endRhymes++;
      }
    }

    // Calculate internal rhymes (within lines)
    let internalRhymes = 0;
    for (const line of lines) {
      const words = line.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if (this.wordsRhyme(words[i], words[j])) {
            internalRhymes++;
          }
        }
      }
    }

    // Calculate multi-syllabic rhymes
    let multiSyllableRhymes = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      const word1 = this.getLastWord(lines[i]);
      const word2 = this.getLastWord(lines[i + 1]);
      if (this.isMultiSyllableRhyme(word1, word2)) {
        multiSyllableRhymes++;
      }
    }

    // Weighted scoring: end rhymes (50%), internal rhymes (30%), multi-syllabic (20%)
    const endScore = Math.min(50, (endRhymes / Math.max(1, lines.length - 1)) * 50);
    const internalScore = Math.min(30, internalRhymes * 5);
    const multiScore = Math.min(20, multiSyllableRhymes * 10);
    
    return Math.round(endScore + internalScore + multiScore);
  }

  calculateFlowQuality(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    let totalScore = 0;

    for (const line of lines) {
      const syllableCount = this.countSyllables(line);
      const wordCount = line.split(' ').filter(word => word.trim()).length;
      
      // Ideal: 8-16 syllables per line, 4-8 words per line
      const syllableScore = this.scoreInRange(syllableCount, 8, 16);
      const wordScore = this.scoreInRange(wordCount, 4, 8);
      
      totalScore += (syllableScore + wordScore) / 2;
    }

    return lines.length > 0 ? totalScore / lines.length : 0;
  }

  calculateCreativity(text: string): number {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    // COMPREHENSIVE ANALYSIS based on actual rap battle criteria
    
    // 1. BASIC REQUIREMENTS - reasonable penalties for minimal effort
    if (words.length <= 1) {
      console.log(`❌ Too few words (${words.length}) - penalty applied`);
      return 10; // Still give some credit for trying
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    
    // Small bonus for more content, but don't punish short verses too harshly
    let contentBonus = Math.min(15, words.length * 2);
    if (words.length >= 8) contentBonus = 15; // Full bonus for 8+ words
    
    // 2. LEXICAL DIVERSITY (vocabulary richness) - More generous scoring
    const uniqueWords = new Set(words);
    const lexicalDiversity = Math.min(15, Math.max(5, (uniqueWords.size / words.length) * 30 + 5));
    
    // 3. ADVANCED WORDPLAY DETECTION
    const wordplayScore = this.detectAdvancedWordplay(text);
    
    // 4. METAPHORS & SIMILES
    const figurativeScore = this.detectFigurativeLanguage(text);
    
    // 5. PUNCHLINES & BATTLE TACTICS
    const punchlineScore = this.detectPunchlines(text);
    
    // 6. HOMONYMS & DOUBLE MEANINGS
    const homonymScore = this.detectHomonyms(text);
    
    // 7. FLOW CONSISTENCY & RHYTHM
    const rhythmScore = this.analyzeRhythm(text);
    
    // 8. ORIGINALITY (anti-cliché)
    const originalityScore = this.calculateOriginality(text);
    
    const totalScore = Math.round(
      contentBonus + lexicalDiversity + wordplayScore + figurativeScore + 
      punchlineScore + homonymScore + rhythmScore + originalityScore
    );
    
    console.log(`🎭 Creativity breakdown: Content ${contentBonus}/15, Vocab ${lexicalDiversity}/15, Wordplay ${wordplayScore}/20, Figurative ${figurativeScore}/15, Punchlines ${punchlineScore}/50, Homonyms ${homonymScore}/10, Rhythm ${rhythmScore}/10, Original ${originalityScore}/15`);
    
    return Math.min(100, totalScore);
  }

  private detectWordplay(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();
    
    // Double entendres and puns (look for multiple meanings)
    const wordplayPatterns = [
      /\b(\w+)\b.*\b\1\b/g, // word repetition with different meaning
      /\b(\w{4,})\b.*\b(\w*\1\w*|\1\w+)\b/g, // similar sounding words
    ];
    
    wordplayPatterns.forEach(pattern => {
      const matches = lower.match(pattern) || [];
      score += matches.length * 5;
    });
    
    return Math.min(25, score);
  }

  private detectMetaphors(text: string): number {
    let score = 0;
    
    // Direct metaphor indicators
    const metaphorWords = ['like', 'as', 'than', 'resemble', 'mirror', 'echo', 'fire', 'ice', 'storm', 'lightning', 'thunder'];
    const metaphorCount = text.toLowerCase().split(/\s+/).filter(word => 
      metaphorWords.includes(word.replace(/[^\w]/g, ''))
    ).length;
    
    // Extended metaphors and imagery
    const imageWords = ['crown', 'throne', 'king', 'queen', 'warrior', 'soldier', 'beast', 'lion', 'snake', 'venom'];
    const imageCount = text.toLowerCase().split(/\s+/).filter(word => 
      imageWords.includes(word.replace(/[^\w]/g, ''))
    ).length;
    
    score = Math.min(20, (metaphorCount * 5) + (imageCount * 3));
    return score;
  }

  private detectBattleTactics(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();
    
    // Aggressive language and confidence
    const aggressiveWords = ['destroy', 'demolish', 'crush', 'annihilate', 'dominate', 'weak', 'pathetic', 'amateur'];
    const aggressiveCount = aggressiveWords.filter(word => lower.includes(word)).length;
    
    // Call-outs and direct attacks
    const calloutWords = ['you', 'your', 'yours'];
    const calloutCount = lower.split(/\s+/).filter(word => calloutWords.includes(word)).length;
    
    // Confidence and bragging
    const confidenceWords = ['i am', 'im', 'my', 'mine', 'best', 'greatest', 'supreme'];
    const confidenceCount = confidenceWords.filter(phrase => lower.includes(phrase)).length;
    
    score = Math.min(15, (aggressiveCount * 3) + Math.min(5, calloutCount) + (confidenceCount * 2));
    return score;
  }

  // NEW ADVANCED DETECTION METHODS
  
  private detectAdvancedWordplay(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    
    // Multi-syllabic wordplay (like Eminem)
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i];
      const word2 = words[i + 1];
      
      // Check for similar sounds/patterns
      if (word1.length > 3 && word2.length > 3) {
        if (this.soundSimilar(word1, word2)) {
          score += 3;
        }
      }
    }
    
    // Double/triple entendres
    const entendrePatterns = [
      /\b(bank|dough|bread|green|cash)\b.*\b(money|rich|broke|pay)\b/g,
      /\b(fire|hot|burn|flame)\b.*\b(sick|ill|cold|freeze)\b/g,
      /\b(crown|king|royal)\b.*\b(rule|reign|throne)\b/g
    ];
    
    entendrePatterns.forEach(pattern => {
      const matches = lower.match(pattern) || [];
      score += matches.length * 5;
    });
    
    return Math.min(20, score);
  }
  
  private detectFigurativeLanguage(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();
    
    // SIMILES (like, as comparisons)
    const similePattern = /\b(like|as)\s+[a-z\s]{3,}/g;
    const similes = lower.match(similePattern) || [];
    score += similes.length * 4;
    
    // METAPHORS (is/are statements, direct comparisons)
    const metaphorPatterns = [
      /\bi\s+(am|was)\s+[a-z\s]{3,}/g,
      /\byou\s+(are|were)\s+[a-z\s]{3,}/g,
      /\b(fire|ice|lightning|thunder|storm|beast|king|queen|god)\b/g
    ];
    
    metaphorPatterns.forEach(pattern => {
      const matches = lower.match(pattern) || [];
      score += matches.length * 3;
    });
    
    return Math.min(15, score);
  }
  
  private detectPunchlines(text: string): number {
    let score = 0;
    const lower = text.toLowerCase();
    const lines = text.split('\n').filter(line => line.trim());
    
    // DIABOLICAL MULTI-LINE RHYME DETECTION
    score += this.detectMultiLineRhymes(lines) * 8; // Heavy weight for multi-line rhymes
    
    // COMPLEX INTERNAL RHYME PATTERNS
    score += this.detectComplexInternalRhymes(lines) * 6;
    
    // DEVASTATING PUNCHLINE CATEGORIES
    score += this.detectNameFlips(lower) * 5;
    score += this.detectSkillDemolition(lower) * 5;
    score += this.detectPersonalAttacks(lower) * 4;
    score += this.detectCareerDestruction(lower) * 4;
    
    // SETUP/PAYOFF COMBINATIONS
    score += this.detectSetupPayoff(lines) * 7;
    
    // PSYCHOLOGICAL WARFARE TACTICS
    score += this.detectPsychologicalWarfare(lower) * 3;
    
    // Original basic punchline detection (reduced weight)
    const punchlineWords = [
      'destroy', 'kill', 'murder', 'slaughter', 'demolish', 'annihilate',
      'weak', 'pathetic', 'trash', 'garbage', 'amateur', 'clown',
      'better', 'supreme', 'greatest', 'legend', 'god', 'king'
    ];
    
    lines.forEach((line, index) => {
      const lineWords = line.toLowerCase().split(/\s+/);
      const hasPunchlineWord = lineWords.some(word => 
        punchlineWords.includes(word.replace(/[^\w]/g, ''))
      );
      
      if (hasPunchlineWord) {
        score += (index === lines.length - 1) ? 3 : 2; // Reduced from original
      }
    });
    
    // Aggressive direct attacks with "you"
    const attackPattern = /\byou\s+(are|were|can't|won't|never|always)\s+[a-z\s]{3,}/g;
    const attacks = lower.match(attackPattern) || [];
    score += attacks.length * 2; // Reduced from original
    
    return Math.min(50, score); // Increased max to accommodate new techniques
  }
  
  private detectHomonyms(text: string): number {
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    // Common homonyms and double meanings in rap
    const homonymPairs = [
      ['to', 'too', 'two'], ['there', 'their', 'they\'re'],
      ['right', 'write'], ['peace', 'piece'], ['steal', 'steel'],
      ['brake', 'break'], ['rain', 'reign', 'rein'], ['cent', 'sent', 'scent'],
      ['bass', 'base'], ['beat', 'beet'], ['rap', 'wrap'],
      ['flow', 'flo'], ['bars', 'bars'], ['dope', 'dope']
    ];
    
    homonymPairs.forEach(group => {
      const groupWords = group.filter(word => words.includes(word));
      if (groupWords.length >= 2) {
        score += 3;
      }
    });
    
    return Math.min(10, score);
  }
  
  private analyzeRhythm(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 2;
    
    let score = 0;
    const syllableCounts = lines.map(line => this.countSyllables(line));
    
    // Check for consistent rhythm
    const avgSyllables = syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length;
    const consistency = syllableCounts.filter(count => 
      Math.abs(count - avgSyllables) <= 2
    ).length / syllableCounts.length;
    
    score += consistency * 6;
    
    // Bonus for good rhythm range (8-16 syllables)
    if (avgSyllables >= 8 && avgSyllables <= 16) {
      score += 4;
    }
    
    return Math.min(10, Math.round(score));
  }
  
  private soundSimilar(word1: string, word2: string): boolean {
    // Simple phonetic similarity check
    const cleanWord1 = word1.replace(/[^\w]/g, '');
    const cleanWord2 = word2.replace(/[^\w]/g, '');
    
    if (cleanWord1.length < 3 || cleanWord2.length < 3) return false;
    
    // Check for similar endings (rhyme)
    const ending1 = cleanWord1.slice(-2);
    const ending2 = cleanWord2.slice(-2);
    
    return ending1 === ending2 || 
           cleanWord1.includes(cleanWord2.slice(0, 3)) ||
           cleanWord2.includes(cleanWord1.slice(0, 3));
  }

  // DIABOLICAL PUNCHLINE DETECTION METHODS
  
  private detectMultiLineRhymes(lines: string[]): number {
    let score = 0;
    
    for (let i = 0; i < lines.length - 1; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const line1 = lines[i].toLowerCase().replace(/[^\w\s]/g, '');
        const line2 = lines[j].toLowerCase().replace(/[^\w\s]/g, '');
        
        // Check if entire lines have similar rhyme patterns
        const words1 = line1.split(/\s+/).filter(w => w.length > 2);
        const words2 = line2.split(/\s+/).filter(w => w.length > 2);
        
        let rhymeMatches = 0;
        for (const w1 of words1) {
          for (const w2 of words2) {
            if (this.wordsRhymeAdvanced(w1, w2)) {
              rhymeMatches++;
            }
          }
        }
        
        // Multi-line rhyme detected if 3+ word pairs rhyme
        if (rhymeMatches >= 3) {
          score += 3; // "smokin up all the drugs" / "youre broke u cant call the plug"
        }
        
        // Perfect multi-syllabic line rhymes
        if (this.linesRhymePerfectly(line1, line2)) {
          score += 5;
        }
      }
    }
    
    return Math.min(15, score);
  }
  
  private detectComplexInternalRhymes(lines: string[]): number {
    let score = 0;
    
    lines.forEach(line => {
      const words = line.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let internalRhymes = 0;
      
      // Check for multiple rhyming words within the same line
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if (this.wordsRhymeAdvanced(words[i], words[j])) {
            internalRhymes++;
          }
        }
      }
      
      // Bonus for 3+ internal rhymes in one line
      if (internalRhymes >= 3) score += 3;
      else if (internalRhymes >= 2) score += 2;
      else if (internalRhymes >= 1) score += 1;
    });
    
    return Math.min(10, score);
  }
  
  private detectNameFlips(text: string): number {
    let score = 0;
    // Detect clever name manipulations and flips
    const nameFlipPatterns = [
      /\b[A-Z][a-z]+.*\b(more like|sounds like|rhymes with)\b.*[a-z]/g,
      /\byour name\b.*\b(should be|is really)\b/g,
      /\bcall you\b.*\b(instead|rather than)\b/g
    ];
    
    nameFlipPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      score += matches.length * 2;
    });
    
    return score;
  }
  
  private detectSkillDemolition(text: string): number {
    let score = 0;
    const skillAttacks = [
      'cant rap', 'no skill', 'no talent', 'fake rapper', 'wannabe',
      'amateur hour', 'kindergarten', 'elementary', 'basic', 'beginner',
      'trash flows', 'wack bars', 'corny lines', 'generic', 'copycat'
    ];
    
    const lower = text.toLowerCase();
    skillAttacks.forEach(attack => {
      if (lower.includes(attack)) score += 2;
    });
    
    return Math.min(8, score);
  }
  
  private detectPersonalAttacks(text: string): number {
    let score = 0;
    const personalPatterns = [
      /\byour\s+(mom|mama|mother|dad|father|family)\b/g,
      /\byou\s+(look|smell|act|sound)\s+like\b/g,
      /\byou\s+(live|stay|work)\s+in\b/g,
      /\byour\s+(job|car|house|clothes)\b/g
    ];
    
    personalPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      score += matches.length * 2;
    });
    
    return Math.min(6, score);
  }
  
  private detectCareerDestruction(text: string): number {
    let score = 0;
    const careerAttacks = [
      'end your career', 'career over', 'retire now', 'quit rapping',
      'find a new job', 'back to work', 'flip burgers', 'day job',
      'never make it', 'industry reject', 'label dropout'
    ];
    
    const lower = text.toLowerCase();
    careerAttacks.forEach(attack => {
      if (lower.includes(attack)) score += 3;
    });
    
    return Math.min(9, score);
  }
  
  private detectSetupPayoff(lines: string[]): number {
    let score = 0;
    
    // Look for question/answer or setup/punchline patterns
    for (let i = 0; i < lines.length - 1; i++) {
      const line1 = lines[i].toLowerCase();
      const line2 = lines[i + 1].toLowerCase();
      
      // Setup patterns
      if (line1.includes('you think') || line1.includes('you said') || 
          line1.includes('what') || line1.includes('how') || line1.includes('why')) {
        // Payoff patterns
        if (line2.includes('but') || line2.includes('nah') || 
            line2.includes('actually') || line2.includes('really')) {
          score += 3;
        }
      }
      
      // Classic setup/punchline structure
      if (line1.endsWith('?') && !line2.endsWith('?')) {
        score += 2;
      }
    }
    
    return Math.min(6, score);
  }
  
  private detectPsychologicalWarfare(text: string): number {
    let score = 0;
    const psychWarfare = [
      'in your head', 'mess with your mind', 'drive you crazy',
      'haunt your dreams', 'live rent free', 'obsessed with me',
      'cant stop thinking', 'losing sleep', 'paranoid', 'insecure'
    ];
    
    const lower = text.toLowerCase();
    psychWarfare.forEach(tactic => {
      if (lower.includes(tactic)) score += 2;
    });
    
    return Math.min(8, score);
  }
  
  private wordsRhymeAdvanced(word1: string, word2: string): boolean {
    if (word1 === word2 || word1.length < 2 || word2.length < 2) return false;
    
    // Multi-syllabic rhyme detection
    if (word1.length >= 4 && word2.length >= 4) {
      // Check last 3+ characters for complex rhymes
      if (word1.slice(-3) === word2.slice(-3)) return true;
      if (word1.slice(-4) === word2.slice(-4)) return true;
    }
    
    // Perfect rhyme (last 2+ characters)
    if (word1.slice(-2) === word2.slice(-2)) return true;
    
    // Assonance (vowel sounds)
    const vowels1 = word1.match(/[aeiou]/g)?.join('') || '';
    const vowels2 = word2.match(/[aeiou]/g)?.join('') || '';
    if (vowels1 === vowels2 && vowels1.length >= 2) return true;
    
    // Near rhymes with similar consonant patterns
    const consonants1 = word1.replace(/[aeiou]/g, '');
    const consonants2 = word2.replace(/[aeiou]/g, '');
    if (consonants1.slice(-2) === consonants2.slice(-2) && consonants1.length >= 2) {
      return true;
    }
    
    return false;
  }
  
  private linesRhymePerfectly(line1: string, line2: string): boolean {
    const words1 = line1.split(/\s+/).filter(w => w.length > 1);
    const words2 = line2.split(/\s+/).filter(w => w.length > 1);
    
    if (words1.length < 3 || words2.length < 3) return false;
    
    // Check if multiple corresponding words rhyme
    let rhymeCount = 0;
    const minLength = Math.min(words1.length, words2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (this.wordsRhymeAdvanced(words1[i], words2[i])) {
        rhymeCount++;
      }
    }
    
    // Lines rhyme perfectly if 60%+ of words rhyme
    return rhymeCount / minLength >= 0.6;
  }
  
  private calculateOriginality(text: string): number {
    // Check against common rap clichés
    const cliches = [
      'mic check', 'drop the beat', 'in the house', 'make some noise', 
      'put your hands up', 'lets go', 'turn up', 'haters gonna hate'
    ];
    
    const lower = text.toLowerCase();
    const clicheCount = cliches.filter(cliche => lower.includes(cliche)).length;
    
    // Start with max points, subtract for clichés
    return Math.max(0, 15 - (clicheCount * 3)); // Increased max from 10 to 15
  }

  private isMultiSyllableRhyme(word1: string, word2: string): boolean {
    if (word1.length < 4 || word2.length < 4) return false;
    const ending1 = word1.slice(-3);
    const ending2 = word2.slice(-3);
    return ending1 === ending2 && word1 !== word2;
  }

  scoreRound(userVerse: string, aiVerse: string): RoundScores {
    const userRhyme = this.calculateRhymeDensity(userVerse);
    const userFlow = this.calculateFlowQuality(userVerse);
    const userCreativity = this.calculateCreativity(userVerse);
    
    const aiRhyme = this.calculateRhymeDensity(aiVerse);
    const aiFlow = this.calculateFlowQuality(aiVerse);
    const aiCreativity = this.calculateCreativity(aiVerse);
    
    // DYNAMIC BALANCED SCORING: Excel at different techniques at different times
    // Perfect balance across ALL battle rap techniques known to the genre
    
    // Get detailed component scores for perfect balance
    const userComponents = this.getDetailedComponents(userVerse);
    const aiComponents = this.getDetailedComponents(aiVerse);
    
    // Dynamic weighting based on what each rapper excels at this round
    const userWeights = this.calculateDynamicWeights(userComponents);
    const aiWeights = this.calculateDynamicWeights(aiComponents);
    
    const userScore = Math.round(this.calculateBalancedScore(userComponents, userWeights));
    const aiScore = Math.round(this.calculateBalancedScore(aiComponents, aiWeights));

    return {
      userScore,
      aiScore,
      rhymeDensity: userRhyme,
      flowQuality: userFlow,
      creativity: userCreativity,
      totalScore: userScore,
    };
  }

  private getLastWord(line: string): string {
    const words = line.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    return lastWord.replace(/[^\w]/g, '').toLowerCase();
  }

  private wordsRhyme(word1: string, word2: string): boolean {
    if (word1.length < 1 || word2.length < 1 || word1 === word2) return false;
    
    // Enhanced rhyme detection
    const clean1 = word1.toLowerCase().replace(/[^a-z]/g, '');
    const clean2 = word2.toLowerCase().replace(/[^a-z]/g, '');
    
    if (clean1.length < 1 || clean2.length < 1) return false;
    
    // Perfect rhyme detection - check various ending patterns
    if (clean1.length >= 3 && clean2.length >= 3) {
      if (clean1.slice(-3) === clean2.slice(-3)) return true; // 3-char endings
    }
    if (clean1.length >= 2 && clean2.length >= 2) {
      if (clean1.slice(-2) === clean2.slice(-2)) return true; // 2-char endings  
    }
    
    // Single letter rhymes for short words
    if (clean1.slice(-1) === clean2.slice(-1) && (clean1.length <= 2 || clean2.length <= 2)) {
      return true;
    }
    
    // Common rhyme patterns
    const rhymePatterns = [
      ['yo', 'go', 'so', 'no', 'flow', 'pro', 'show', 'know'],
      ['man', 'can', 'ran', 'plan', 'fan', 'ban'],
      ['ay', 'day', 'way', 'say', 'play', 'stay'],
      ['ight', 'right', 'fight', 'night', 'sight', 'might']
    ];
    
    for (const pattern of rhymePatterns) {
      if (pattern.includes(clean1) && pattern.includes(clean2)) {
        return true;
      }
    }
    
    return false;
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let total = 0;
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length === 0) continue;
      
      // Simple syllable counting heuristic
      const vowels = cleanWord.match(/[aeiouy]+/g);
      const syllableCount = vowels ? vowels.length : 1;
      total += Math.max(1, syllableCount);
    }
    
    return total;
  }

  private scoreInRange(value: number, min: number, max: number): number {
    if (value >= min && value <= max) return 100;
    
    const distance = Math.min(
      Math.abs(value - min),
      Math.abs(value - max)
    );
    
    return Math.max(0, 100 - (distance * 10));
  }

  // COMPREHENSIVE BALANCED SCORING SYSTEM
  // Excel at different techniques at different times while maintaining perfect balance
  
  private getDetailedComponents(text: string): any {
    const components = {
      // Core Rhyme Techniques (30% total)
      endRhymes: this.calculateEndRhymes(text),
      internalRhymes: this.calculateInternalRhymes(text), 
      multiLineRhymes: this.calculateMultiLineRhymes(text),
      multiSyllabicRhymes: this.calculateMultiSyllabicRhymes(text),
      
      // Flow & Delivery (25% total)
      rhythm: this.analyzeRhythm(text),
      syllableFlow: this.calculateSyllableFlow(text),
      pacing: this.calculatePacing(text),
      
      // Wordplay Mastery (25% total)
      punchlines: this.detectPunchlines(text),
      wordplay: this.detectAdvancedWordplay(text),
      homonyms: this.detectHomonyms(text),
      metaphors: this.detectFigurativeLanguage(text),
      
      // Battle Technique (20% total)
      battleTactics: this.detectBattleTactics(text),
      psychologicalWarfare: this.detectPsychologicalWarfare(text),
      personalAttacks: this.detectPersonalAttacks(text),
      skillDemolition: this.detectSkillDemolition(text),
      nameFlips: this.detectNameFlips(text),
      setupPayoff: this.detectSetupPayoff(text.split('\n').filter(l => l.trim())),
      
      // Overall Quality
      originality: this.calculateOriginality(text),
      vocabulary: this.calculateVocabulary(text)
    };
    
    return components;
  }
  
  private calculateDynamicWeights(components: any): { rhyme: number; flow: number; wordplay: number; battle: number } {
    // Identify what this rapper excels at and adjust weights accordingly
    // This creates dynamic battles where different techniques shine at different times
    
    const strengths: string[] = [];
    const baseWeights = {
      rhyme: 0.30,
      flow: 0.25, 
      wordplay: 0.25,
      battle: 0.20
    };
    
    // Detect strengths and boost weights for excellence
    if (components.multiLineRhymes >= 8) strengths.push('rhyme');
    if (components.punchlines >= 15) strengths.push('wordplay');
    if (components.rhythm >= 8 && components.syllableFlow >= 8) strengths.push('flow');
    if (components.battleTactics >= 10) strengths.push('battle');
    
    // Excel at detected strengths (10% boost), balance others
    const adjustedWeights = { ...baseWeights };
    if (strengths.length > 0) {
      const boost = 0.10 / strengths.length;
      const reduction = 0.10 / (4 - strengths.length);
      
      strengths.forEach(strength => {
        if (strength in adjustedWeights) {
          (adjustedWeights as any)[strength] += boost;
        }
      });
      
      Object.keys(adjustedWeights).forEach(key => {
        if (!strengths.includes(key)) {
          (adjustedWeights as any)[key] = Math.max(0.05, (adjustedWeights as any)[key] - reduction);
        }
      });
    }
    
    return adjustedWeights;
  }
  
  private calculateBalancedScore(components: any, weights: any): number {
    // Rhyme Component (weighted)
    const rhymeScore = (
      components.endRhymes * 0.25 + 
      components.internalRhymes * 0.25 + 
      components.multiLineRhymes * 0.30 + 
      components.multiSyllabicRhymes * 0.20
    );
    
    // Flow Component (weighted)
    const flowScore = (
      components.rhythm * 0.4 + 
      components.syllableFlow * 0.4 + 
      components.pacing * 0.2
    );
    
    // Wordplay Component (weighted)
    const wordplayScore = (
      components.punchlines * 0.35 +
      components.wordplay * 0.25 +
      components.homonyms * 0.20 +
      components.metaphors * 0.20
    );
    
    // Battle Component (weighted)
    const battleScore = (
      components.battleTactics * 0.20 +
      components.psychologicalWarfare * 0.15 +
      components.personalAttacks * 0.15 +
      components.skillDemolition * 0.15 +
      components.nameFlips * 0.15 +
      components.setupPayoff * 0.20
    );
    
    // Overall Quality Boost
    const qualityMultiplier = 1 + ((components.originality + components.vocabulary) / 200);
    
    // Final balanced score
    const totalScore = (
      (rhymeScore * weights.rhyme) +
      (flowScore * weights.flow) +
      (wordplayScore * weights.wordplay) +
      (battleScore * weights.battle)
    ) * qualityMultiplier;
    
    return Math.max(0, Math.min(100, totalScore));
  }
  
  // Additional component calculators for perfect balance
  private calculateEndRhymes(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    let score = 0;
    
    for (let i = 0; i < lines.length - 1; i++) {
      const word1 = this.getLastWord(lines[i]);
      const word2 = this.getLastWord(lines[i + 1]);
      if (this.wordsRhymeAdvanced(word1, word2)) {
        score += 5;
      }
    }
    
    return Math.min(20, score);
  }
  
  private calculateInternalRhymes(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    let score = 0;
    
    lines.forEach(line => {
      const words = line.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if (this.wordsRhymeAdvanced(words[i], words[j])) {
            score += 2;
          }
        }
      }
    });
    
    return Math.min(25, score);
  }
  
  private calculateMultiLineRhymes(text: string): number {
    return this.detectMultiLineRhymes(text.split('\n').filter(line => line.trim()));
  }
  
  private calculateMultiSyllabicRhymes(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    let score = 0;
    
    for (let i = 0; i < lines.length - 1; i++) {
      const word1 = this.getLastWord(lines[i]);
      const word2 = this.getLastWord(lines[i + 1]);
      if (this.isMultiSyllableRhyme(word1, word2)) {
        score += 3;
      }
    }
    
    return Math.min(15, score);
  }
  
  private calculateSyllableFlow(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 5;
    
    const syllableCounts = lines.map(line => this.countSyllables(line));
    const avgSyllables = syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length;
    
    // Perfect flow: 8-16 syllables per line with consistency
    const rangeScore = this.scoreInRange(avgSyllables, 8, 16) / 10;
    
    const consistency = syllableCounts.filter(count => 
      Math.abs(count - avgSyllables) <= 3
    ).length / syllableCounts.length;
    
    return Math.round((rangeScore + (consistency * 10)) / 2);
  }
  
  private calculatePacing(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    let score = 8; // Base score
    
    // Check for good pacing indicators
    const pacingWords = ['pause', 'wait', 'hold', 'stop', 'break', 'breathe'];
    const lower = text.toLowerCase();
    
    pacingWords.forEach(word => {
      if (lower.includes(word)) score += 1;
    });
    
    return Math.min(12, score);
  }
  
  private calculateVocabulary(text: string): number {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = new Set(words);
    
    const diversity = uniqueWords.size / Math.max(1, words.length);
    return Math.round(diversity * 15);
  }
  
  calculateUserScore(userText: string): number {
    const components = this.getDetailedComponents(userText);
    const weights = this.calculateDynamicWeights(components);
    const score = this.calculateBalancedScore(components, weights);
    
    // Legacy compatibility - still show main components
    const rhymeDensity = this.calculateRhymeDensity(userText);
    const flowQuality = this.calculateFlowQuality(userText);
    const creativity = this.calculateCreativity(userText);
    
    console.log(`🎯 User components: Rhyme ${rhymeDensity}, Flow ${flowQuality}, Creativity ${creativity} → Score ${Math.round(score)}`);
    
    return Math.max(0, Math.min(100, score));
  }
}

export const scoringService = new ScoringService();
