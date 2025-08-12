import { type RoundScores } from "@shared/schema";

export class ScoringService {
  calculateRhymeDensity(text: string): number {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return 0;

    let rhymeCount = 0;
    const totalPairs = lines.length - 1;

    for (let i = 0; i < lines.length - 1; i++) {
      const line1 = this.getLastWord(lines[i]);
      const line2 = this.getLastWord(lines[i + 1]);
      
      if (this.wordsRhyme(line1, line2)) {
        rhymeCount++;
      }
    }

    return Math.min(100, (rhymeCount / totalPairs) * 100);
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
    const lexicalDiversity = (uniqueWords.size / words.length) * 100;
    
    // Check for metaphors and wordplay
    const metaphorWords = ['like', 'as', 'than', 'resemble', 'mirror', 'echo'];
    const metaphorCount = words.filter(word => 
      metaphorWords.includes(word.replace(/[^\w]/g, ''))
    ).length;
    
    const metaphorScore = Math.min(40, metaphorCount * 10);
    const diversityScore = Math.min(60, lexicalDiversity);
    
    return metaphorScore + diversityScore;
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
