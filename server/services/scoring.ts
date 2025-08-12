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
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const lexicalDiversity = Math.min(30, (uniqueWords.size / words.length) * 100);
    
    // Advanced wordplay detection
    const wordplayScore = this.detectWordplay(text);
    
    // Metaphor and imagery detection
    const metaphorScore = this.detectMetaphors(text);
    
    // Battle tactics and aggression
    const battleTacticsScore = this.detectBattleTactics(text);
    
    // Originality (avoiding clichés)
    const originalityScore = this.calculateOriginality(text);
    
    return Math.round(wordplayScore + metaphorScore + battleTacticsScore + originalityScore + lexicalDiversity);
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
}

export const scoringService = new ScoringService();
