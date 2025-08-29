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
    
    // 1. BASIC REQUIREMENTS - severe penalties for minimal effort
    if (words.length <= 3) {
      console.log(`❌ Too few words (${words.length}) - major penalty`);
      return 5; // Maximum 5/100 for lazy attempts
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length <= 1) {
      console.log(`❌ Only ${lines.length} line(s) - major penalty`);
      return Math.max(5, words.length * 2); // Cap at very low score
    }
    
    // 2. LEXICAL DIVERSITY (vocabulary richness)
    const uniqueWords = new Set(words);
    const lexicalDiversity = Math.min(15, (uniqueWords.size / words.length) * 40);
    
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
      lexicalDiversity + wordplayScore + figurativeScore + 
      punchlineScore + homonymScore + rhythmScore + originalityScore
    );
    
    console.log(`🎭 Creativity breakdown: Vocab ${lexicalDiversity}/15, Wordplay ${wordplayScore}/20, Figurative ${figurativeScore}/15, Punchlines ${punchlineScore}/15, Homonyms ${homonymScore}/10, Rhythm ${rhythmScore}/10, Original ${originalityScore}/15`);
    
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
    
    // Punchline indicators
    const punchlineWords = [
      'destroy', 'kill', 'murder', 'slaughter', 'demolish', 'annihilate',
      'weak', 'pathetic', 'trash', 'garbage', 'amateur', 'clown',
      'better', 'supreme', 'greatest', 'legend', 'god', 'king'
    ];
    
    // Check last line of each verse for strong endings
    lines.forEach((line, index) => {
      const lineWords = line.toLowerCase().split(/\s+/);
      const hasPunchlineWord = lineWords.some(word => 
        punchlineWords.includes(word.replace(/[^\w]/g, ''))
      );
      
      if (hasPunchlineWord) {
        score += (index === lines.length - 1) ? 5 : 3; // More points for closing lines
      }
    });
    
    // Aggressive direct attacks with "you"
    const attackPattern = /\byou\s+(are|were|can't|won't|never|always)\s+[a-z\s]{3,}/g;
    const attacks = lower.match(attackPattern) || [];
    score += attacks.length * 3;
    
    return Math.min(15, score);
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

  private calculateOriginality(text: string): number {
    // Check against common rap clichés
    const cliches = [
      'mic check', 'drop the beat', 'in the house', 'make some noise', 
      'put your hands up', 'lets go', 'turn up', 'haters gonna hate'
    ];
    
    const lower = text.toLowerCase();
    const clicheCount = cliches.filter(cliche => lower.includes(cliche)).length;
    
    // Start with max points, subtract for clichés
    return Math.max(0, 10 - (clicheCount * 3));
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
    
    // Weight the scores: rhyme 40%, flow 35%, creativity 25%
    const userScore = Math.round(
      (userRhyme * 0.4) + (userFlow * 0.35) + (userCreativity * 0.25)
    );
    
    const aiScore = Math.round(
      (aiRhyme * 0.4) + (aiFlow * 0.35) + (aiCreativity * 0.25)
    );

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
    if (word1.length < 2 || word2.length < 2) return false;
    
    // Simple rhyme detection - check if last 2-3 characters match
    const ending1 = word1.slice(-3);
    const ending2 = word2.slice(-3);
    
    return ending1 === ending2 || 
           word1.slice(-2) === word2.slice(-2);
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

  calculateUserScore(userText: string): number {
    // Calculate individual components
    const rhymeDensity = this.calculateRhymeDensity(userText);
    const flowQuality = this.calculateFlowQuality(userText);
    const creativity = this.calculateCreativity(userText);
    
    // Weighted average: Creativity 50%, Rhyme 30%, Flow 20%
    const userScore = Math.round(creativity * 0.5 + rhymeDensity * 0.3 + flowQuality * 0.2);
    
    console.log(`🎯 User components: Rhyme ${rhymeDensity}, Flow ${flowQuality}, Creativity ${creativity} → Score ${userScore}`);
    
    return Math.max(0, Math.min(100, userScore));
  }
}

export const scoringService = new ScoringService();
