import { ScoringService } from './scoring';

export interface WordAnalysis {
  word: string;
  position: { start: number; end: number };
  syllables: number;
  rhymes: string[];
  isInternal: boolean;
  isEndRhyme: boolean;
  isMultiSyllable: boolean;
}

export interface LineAnalysis {
  text: string;
  lineNumber: number;
  syllableCount: number;
  wordCount: number;
  flowScore: number;
  endWord: string;
  words: WordAnalysis[];
  rhymeScheme: string;
}

export interface DetailedScoreBreakdown {
  // Overall scores
  totalScore: number;
  rhymeDensity: number;
  flowQuality: number;
  creativity: number;
  
  // Detailed breakdowns
  rhymeAnalysis: {
    endRhymes: number;
    internalRhymes: number;
    multiSyllableRhymes: number;
    endRhymeScore: number;
    internalRhymeScore: number;
    multiSyllableScore: number;
  };
  
  flowAnalysis: {
    averageSyllables: number;
    averageWords: number;
    idealSyllableRange: [number, number];
    idealWordRange: [number, number];
    linesInRange: number;
    totalLines: number;
  };
  
  creativityAnalysis: {
    lexicalDiversity: number;
    wordplayScore: number;
    metaphorScore: number;
    battleTacticsScore: number;
    originalityScore: number;
    detectedWordplay: string[];
    detectedMetaphors: string[];
    battlePhrases: string[];
  };
  
  // Line by line analysis
  lines: LineAnalysis[];
  
  // Visual indicators
  highlightData: {
    rhymes: Array<{ words: string[]; type: 'end' | 'internal' | 'multi'; color: string }>;
    wordplay: Array<{ phrase: string; type: string; explanation: string }>;
    metaphors: Array<{ phrase: string; explanation: string }>;
  };
}

export class LyricAnalysisService {
  private scoringService: ScoringService;
  private groqApiKey: string;
  
  constructor() {
    this.scoringService = new ScoringService();
    this.groqApiKey = process.env.GROQ_API_KEY || '';
  }
  
  async analyzeVerse(text: string): Promise<DetailedScoreBreakdown> {
    try {
      // Use reasoning model for comprehensive phonetic analysis
      const reasoningAnalysis = await this.performReasoningAnalysis(text);
      
      // Perform basic analysis
      const basicAnalysis = this.analyzeVerseBasic(text);
      
      // Enhance basic analysis with reasoning insights
      if (reasoningAnalysis) {
        return this.mergeAnalyses(basicAnalysis, reasoningAnalysis);
      }
      
      return basicAnalysis;
    } catch (error) {
      console.error('Reasoning analysis failed, using basic analysis:', error);
      return this.analyzeVerseBasic(text);
    }
  }

  private async performReasoningAnalysis(text: string) {
    try {
      const prompt = `Analyze this rap verse for ALL possible rhyming syllable combinations and phonetic patterns. Use step-by-step reasoning to identify every rhyme type:

"${text}"

COMPREHENSIVE ANALYSIS REQUIRED:
1. End rhymes (perfect, near, slant)
2. Internal rhymes (within lines)
3. Multi-syllabic rhymes (compound rhymes)
4. Assonance (vowel sound matches)
5. Consonance (consonant sound matches)
6. Alliteration (repeated initial sounds)
7. Complex rhyme schemes (ABAB, AABA, etc.)

For each rhyming element found:
- Identify the exact syllables/phonemes
- Classify the rhyme type
- Rate strength (1-10)
- Note position in verse

Provide detailed phonetic breakdown using IPA notation where helpful.

Return analysis in this JSON format:
{
  "rhymes": {
    "endRhymes": [{"words": ["word1", "word2"], "type": "perfect", "strength": 9}],
    "internalRhymes": [{"line": 1, "words": ["word1", "word2"], "strength": 7}],
    "multiSyllabic": [{"phrase1": "phrase", "phrase2": "phrase", "syllables": 3}]
  },
  "phoneticAnalysis": {
    "totalRhymingSyllables": 15,
    "rhymeDensity": 0.8,
    "complexityScore": 9
  },
  "flowAnalysis": {
    "syllablePattern": [8, 7, 8, 9],
    "stressPattern": "strong",
    "naturalPauses": 4
  }
}`;

      const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b", // Reasoning model for detailed analysis
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_completion_tokens: 4096,
          temperature: 0.2,
          reasoning_effort: "medium", // Changed from high to medium for better API compatibility
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reasoning analysis failed:', response.statusText, errorText);
        return null;
      }

      const result = await response.json();
      const reasoning = result.choices?.[0]?.message?.reasoning;
      const content = result.choices?.[0]?.message?.content;
      
      console.log('Reasoning process:', reasoning);
      
      if (content) {
        return JSON.parse(content);
      }
      
      return null;
    } catch (error) {
      console.error('Error in reasoning analysis:', error);
      return null;
    }
  }

  private mergeAnalyses(basicAnalysis: DetailedScoreBreakdown, reasoningAnalysis: any): DetailedScoreBreakdown {
    // Enhance basic analysis with reasoning insights
    const enhanced = { ...basicAnalysis };
    
    if (reasoningAnalysis.phoneticAnalysis) {
      enhanced.rhymeDensity = Math.max(enhanced.rhymeDensity, reasoningAnalysis.phoneticAnalysis.rhymeDensity * 100);
    }
    
    if (reasoningAnalysis.rhymes) {
      // Add reasoning-detected rhymes to highlight data
      const reasoningRhymes = [
        ...(reasoningAnalysis.rhymes.endRhymes || []).map((r: any) => ({
          words: r.words,
          type: 'end' as const,
          color: '#ef4444'
        })),
        ...(reasoningAnalysis.rhymes.internalRhymes || []).map((r: any) => ({
          words: r.words,
          type: 'internal' as const,
          color: '#3b82f6'
        })),
        ...(reasoningAnalysis.rhymes.multiSyllabic || []).map((r: any) => ({
          words: [r.phrase1, r.phrase2],
          type: 'multi' as const,
          color: '#8b5cf6'
        }))
      ];
      
      enhanced.highlightData.rhymes = [...enhanced.highlightData.rhymes, ...reasoningRhymes];
    }
    
    return enhanced;
  }

  analyzeVerseBasic(text: string): DetailedScoreBreakdown {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Get basic scores
    const rhymeDensity = this.scoringService.calculateRhymeDensity(text);
    const flowQuality = this.scoringService.calculateFlowQuality(text);
    const creativity = this.scoringService.calculateCreativity(text);
    const totalScore = Math.round((rhymeDensity * 0.4) + (flowQuality * 0.35) + (creativity * 0.25));
    
    // Detailed rhyme analysis
    const rhymeAnalysis = this.analyzeRhymes(text);
    
    // Detailed flow analysis
    const flowAnalysis = this.analyzeFlow(text);
    
    // Detailed creativity analysis
    const creativityAnalysis = this.analyzeCreativity(text);
    
    // Line by line analysis
    const lineAnalyses = this.analyzeLines(text);
    
    // Generate highlight data
    const highlightData = this.generateHighlightData(text, rhymeAnalysis, creativityAnalysis);
    
    return {
      totalScore,
      rhymeDensity,
      flowQuality,
      creativity,
      rhymeAnalysis,
      flowAnalysis,
      creativityAnalysis,
      lines: lineAnalyses,
      highlightData
    };
  }
  
  private analyzeRhymes(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    let endRhymes = 0;
    let internalRhymes = 0;
    let multiSyllableRhymes = 0;
    
    // Count end rhymes
    for (let i = 0; i < lines.length - 1; i++) {
      const word1 = this.getLastWord(lines[i]);
      const word2 = this.getLastWord(lines[i + 1]);
      if (this.wordsRhyme(word1, word2)) {
        endRhymes++;
        if (this.isMultiSyllableRhyme(word1, word2)) {
          multiSyllableRhymes++;
        }
      }
    }
    
    // Count internal rhymes
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
    
    // Calculate scores
    const endRhymeScore = Math.min(50, (endRhymes / Math.max(1, lines.length - 1)) * 50);
    const internalRhymeScore = Math.min(30, internalRhymes * 5);
    const multiSyllableScore = Math.min(20, multiSyllableRhymes * 10);
    
    return {
      endRhymes,
      internalRhymes,
      multiSyllableRhymes,
      endRhymeScore: Math.round(endRhymeScore),
      internalRhymeScore: Math.round(internalRhymeScore),
      multiSyllableScore: Math.round(multiSyllableScore)
    };
  }
  
  private analyzeFlow(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    let totalSyllables = 0;
    let totalWords = 0;
    let linesInRange = 0;
    
    for (const line of lines) {
      const syllableCount = this.countSyllables(line);
      const wordCount = line.split(' ').filter(word => word.trim()).length;
      
      totalSyllables += syllableCount;
      totalWords += wordCount;
      
      // Check if line is in ideal range
      if (syllableCount >= 8 && syllableCount <= 16 && wordCount >= 4 && wordCount <= 8) {
        linesInRange++;
      }
    }
    
    return {
      averageSyllables: lines.length > 0 ? Math.round(totalSyllables / lines.length) : 0,
      averageWords: lines.length > 0 ? Math.round(totalWords / lines.length) : 0,
      idealSyllableRange: [8, 16] as [number, number],
      idealWordRange: [4, 8] as [number, number],
      linesInRange,
      totalLines: lines.length
    };
  }
  
  private analyzeCreativity(text: string) {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const lexicalDiversity = Math.min(30, (uniqueWords.size / words.length) * 100);
    
    // Detect specific elements
    const detectedWordplay = this.findWordplay(text);
    const detectedMetaphors = this.findMetaphors(text);
    const battlePhrases = this.findBattlePhrases(text);
    
    return {
      lexicalDiversity: Math.round(lexicalDiversity),
      wordplayScore: this.scoringService['detectWordplay'](text) || 0,
      metaphorScore: this.scoringService['detectMetaphors'](text) || 0,
      battleTacticsScore: this.scoringService['detectBattleTactics'](text) || 0,
      originalityScore: this.scoringService['calculateOriginality'](text) || 0,
      detectedWordplay,
      detectedMetaphors,
      battlePhrases
    };
  }
  
  private analyzeLines(text: string): LineAnalysis[] {
    const lines = text.split('\n').filter(line => line.trim());
    const analyses: LineAnalysis[] = [];
    
    lines.forEach((line, index) => {
      const syllableCount = this.countSyllables(line);
      const words = line.split(' ').filter(word => word.trim());
      const wordCount = words.length;
      const endWord = this.getLastWord(line);
      
      // Calculate flow score for this line
      const syllableScore = this.scoreInRange(syllableCount, 8, 16);
      const wordScore = this.scoreInRange(wordCount, 4, 8);
      const flowScore = (syllableScore + wordScore) / 2;
      
      // Analyze individual words
      const wordAnalyses: WordAnalysis[] = [];
      let position = 0;
      
      words.forEach(word => {
        const start = line.indexOf(word, position);
        const end = start + word.length;
        position = end;
        
        wordAnalyses.push({
          word,
          position: { start, end },
          syllables: this.countSyllables(word),
          rhymes: this.findRhymingWords(word, text),
          isInternal: this.isInternalRhyme(word, line),
          isEndRhyme: word.toLowerCase() === endWord.toLowerCase(),
          isMultiSyllable: this.countSyllables(word) > 1
        });
      });
      
      analyses.push({
        text: line,
        lineNumber: index + 1,
        syllableCount,
        wordCount,
        flowScore: Math.round(flowScore),
        endWord,
        words: wordAnalyses,
        rhymeScheme: this.determineRhymeScheme(line, index, lines)
      });
    });
    
    return analyses;
  }
  
  private generateHighlightData(text: string, rhymeAnalysis: any, creativityAnalysis: any) {
    const rhymes: Array<{ words: string[]; type: 'end' | 'internal' | 'multi'; color: string }> = [];
    const wordplay: Array<{ phrase: string; type: string; explanation: string }> = [];
    const metaphors: Array<{ phrase: string; explanation: string }> = [];
    
    // Add rhyme highlights
    const lines = text.split('\n').filter(line => line.trim());
    const rhymeColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    for (let i = 0; i < lines.length - 1; i++) {
      const word1 = this.getLastWord(lines[i]);
      const word2 = this.getLastWord(lines[i + 1]);
      if (this.wordsRhyme(word1, word2)) {
        rhymes.push({
          words: [word1, word2],
          type: this.isMultiSyllableRhyme(word1, word2) ? 'multi' : 'end',
          color: rhymeColors[i % rhymeColors.length]
        });
      }
    }
    
    // Add wordplay highlights
    creativityAnalysis.detectedWordplay.forEach((play: string) => {
      wordplay.push({
        phrase: play,
        type: 'wordplay',
        explanation: 'Clever word usage or pun detected'
      });
    });
    
    // Add metaphor highlights
    creativityAnalysis.detectedMetaphors.forEach((metaphor: string) => {
      metaphors.push({
        phrase: metaphor,
        explanation: 'Metaphorical or figurative language'
      });
    });
    
    return { rhymes, wordplay, metaphors };
  }
  
  // Helper methods (using simplified versions of scoring service methods)
  private getLastWord(line: string): string {
    const words = line.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    return words[words.length - 1] || '';
  }
  
  private wordsRhyme(word1: string, word2: string): boolean {
    if (word1.length < 2 || word2.length < 2) return false;
    return word1.slice(-2) === word2.slice(-2) || word1.slice(-3) === word2.slice(-3);
  }
  
  private isMultiSyllableRhyme(word1: string, word2: string): boolean {
    return this.countSyllables(word1) > 1 && this.countSyllables(word2) > 1 && this.wordsRhyme(word1, word2);
  }
  
  private countSyllables(text: string): number {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    return words.reduce((total, word) => {
      return total + Math.max(1, word.replace(/[^aeiou]/g, '').length);
    }, 0);
  }
  
  private scoreInRange(value: number, min: number, max: number): number {
    if (value >= min && value <= max) return 100;
    const distance = Math.min(Math.abs(value - min), Math.abs(value - max));
    return Math.max(0, 100 - distance * 10);
  }
  
  private findRhymingWords(word: string, text: string): string[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    return words.filter(w => w !== word && this.wordsRhyme(word, w));
  }
  
  private isInternalRhyme(word: string, line: string): boolean {
    const words = line.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    return words.some(w => w !== word && this.wordsRhyme(word, w));
  }
  
  private determineRhymeScheme(line: string, index: number, allLines: string[]): string {
    const endWord = this.getLastWord(line);
    const schemes = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // Simple ABAB pattern detection
    if (index >= 2) {
      const prevEndWord = this.getLastWord(allLines[index - 2]);
      if (this.wordsRhyme(endWord, prevEndWord)) {
        return schemes[index % 2];
      }
    }
    
    return schemes[index % schemes.length];
  }
  
  private findWordplay(text: string): string[] {
    const wordplayPatterns = [
      /\b(\w+)\s+\w*\1\w*\b/gi, // Word repetition/variation
      /\b(\w+)\s+(\w+)\s+\1\s+\2\b/gi, // Pattern repetition
    ];
    
    const matches: string[] = [];
    wordplayPatterns.forEach(pattern => {
      const found = text.match(pattern);
      if (found) matches.push(...found);
    });
    
    return matches.slice(0, 5); // Limit to 5 examples
  }
  
  private findMetaphors(text: string): string[] {
    const metaphorKeywords = ['like', 'fire', 'ice', 'thunder', 'lightning', 'storm', 'beast', 'king', 'crown', 'throne'];
    const words = text.toLowerCase().split(/\s+/);
    
    return metaphorKeywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    ).slice(0, 5);
  }
  
  private findBattlePhrases(text: string): string[] {
    const battleKeywords = ['destroy', 'crush', 'demolish', 'defeat', 'murder', 'kill', 'annihilate', 'dominate'];
    const words = text.toLowerCase().split(/\s+/);
    
    return battleKeywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    ).slice(0, 5);
  }
}