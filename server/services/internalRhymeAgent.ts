/**
 * INTERNAL RHYME AGENT
 * Specialized agent for sophisticated internal rhyme pattern generation
 * Enhances midline rhyming complexity without disrupting end-rhyme schemes
 */

import { PhoneticRhymeAnalyzer } from './phoneticRhymeAnalyzer';

export interface InternalRhymeSpan {
  lineIndex: number;
  start: number;
  end: number;
  rhymeKey: string;
  strength: 1 | 2 | 3; // 1=subtle, 2=strong, 3=devastating
  technique: 'multi' | 'assonance' | 'consonance' | 'alliteration' | 'mosaic' | 'overlap';
}

export interface InternalRhymePlan {
  enhancedLyrics: string;
  spans: InternalRhymeSpan[];
  density: number;
  notes: string[];
}

export interface InternalRhymeOptions {
  targetDensity: number; // 0.35-0.55 recommended
  preserveEndWords: boolean;
  maxSyllableDeltaPerLine: number;
  mode: 'balanced' | 'aggressive' | 'subtle';
  bpm?: number;
}

interface PhoneticAnalysis {
  nucleus: string; // vowel sound
  coda: string; // consonants after vowel
  onset: string; // consonants before vowel
  syllableCount: number;
}

export class InternalRhymeAgent {
  private phoneticCache = new Map<string, PhoneticAnalysis>();
  private readonly MAX_CACHE_SIZE = 1000; // LRU cache limit
  private cacheAccessOrder = new Set<string>(); // Track access order for LRU
  private phoneticAnalyzer: PhoneticRhymeAnalyzer;
  
  // Internal rhyme word banks for different techniques
  private rhymeWordBanks = {
    multi: {
      'ation': ['devastation', 'annihilation', 'domination', 'assassination', 'validation'],
      'ession': ['possession', 'obsession', 'aggression', 'confession', 'progression'],
      'icular': ['particular', 'vehicular', 'spectacular', 'perpendicular'],
      'ility': ['ability', 'stability', 'hostility', 'facility', 'agility']
    },
    assonance: {
      'a': ['attack', 'track', 'back', 'pack', 'stack', 'crack'],
      'e': ['beast', 'least', 'east', 'feast', 'peace', 'release'],
      'i': ['fire', 'wire', 'desire', 'inspire', 'retire', 'acquire'],
      'o': ['flow', 'show', 'glow', 'know', 'throw', 'grow'],
      'u': ['truth', 'youth', 'proof', 'smooth', 'booth']
    },
    consonance: {
      'ck': ['attack', 'track', 'crack', 'stack', 'back'],
      'st': ['beast', 'least', 'fast', 'last', 'blast'],
      'ng': ['strong', 'wrong', 'long', 'song', 'bring'],
      'nd': ['sound', 'ground', 'round', 'found', 'bound']
    }
  };

  // Syllable templates for mosaic rhymes
  private mosaicTemplates = [
    { pattern: 'AA BB', example: 'silver screen' },
    { pattern: 'AAA B', example: 'rock the block' },
    { pattern: 'A BBB', example: 'mind rewind time' }
  ];

  constructor() {
    this.phoneticAnalyzer = new PhoneticRhymeAnalyzer();
    console.log('🎯 InternalRhymeAgent initialized - Advanced internal rhyme processing enabled with PhoneticRhymeAnalyzer');
  }

  /**
   * Get comprehensive phonetic rhyme analysis using the advanced algorithm
   */
  getPhoneticRhymeSchemeAnalysis(lyrics: string) {
    return this.phoneticAnalyzer.analyzeRhymeScheme(lyrics);
  }

  /**
   * Analyze existing internal rhyme patterns in lyrics
   */
  analyzeInternalPatterns(lyrics: string): { spans: InternalRhymeSpan[]; density: number; perLineStats: any[] } {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const spans: InternalRhymeSpan[] = [];
    const perLineStats: any[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const words = this.tokenize(line);
      const lineSpans = this.findInternalRhymesInLine(words, lineIndex);
      spans.push(...lineSpans);
      
      perLineStats.push({
        lineIndex,
        wordCount: words.length,
        internalRhymes: lineSpans.length,
        techniques: lineSpans.map(span => span.technique)
      });
    }

    const density = spans.length / Math.max(1, lines.length);
    return { spans, density, perLineStats };
  }

  /**
   * Main enhancement function - adds sophisticated internal rhymes
   */
  async enhanceInternalRhymes(lyrics: string, options: InternalRhymeOptions): Promise<InternalRhymePlan> {
    console.log(`🎯 InternalRhymeAgent: Enhancing internal rhymes (mode: ${options.mode}, target density: ${options.targetDensity})`);
    
    const startTime = Date.now();
    const totalTimeBudget = 120; // ms - total time budget for entire operation
    const lines = lyrics.split('\n').filter(line => line.trim());
    const enhancedLines: string[] = [];
    const allSpans: InternalRhymeSpan[] = [];
    const notes: string[] = [];

    // Analyze existing patterns first
    const existing = this.analyzeInternalPatterns(lyrics);
    notes.push(`Found ${existing.spans.length} existing internal rhymes`);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Check total time budget first
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > totalTimeBudget) {
        console.log(`🎯 InternalRhymeAgent: Total time budget exceeded (${elapsedTime}ms), using original for remaining lines`);
        enhancedLines.push(...lines.slice(lineIndex));
        notes.push(`Time budget exceeded at line ${lineIndex}, used original for remaining ${lines.length - lineIndex} lines`);
        break;
      }
      
      // Performance budget per line - dynamically adjust based on remaining time
      const lineStartTime = Date.now();
      const remainingLines = lines.length - lineIndex;
      const remainingTime = totalTimeBudget - elapsedTime;
      const maxTimePerLine = Math.min(80, Math.floor(remainingTime / remainingLines)); // Dynamic time allocation
      
      try {
        const enhanced = await this.enhanceLineInternalRhymes(
          line, 
          lineIndex, 
          options, 
          () => Date.now() - lineStartTime > maxTimePerLine
        );
        
        enhancedLines.push(enhanced.line);
        allSpans.push(...enhanced.spans);
        notes.push(...enhanced.notes);
        
      } catch (error) {
        console.warn(`🎯 InternalRhymeAgent: Line ${lineIndex} enhancement failed, using original`);
        enhancedLines.push(line);
        notes.push(`Line ${lineIndex}: fallback to original (${error instanceof Error ? error.message : 'unknown error'})`);
      }
    }

    const enhancedLyrics = enhancedLines.join('\n');
    const finalDensity = allSpans.length / Math.max(1, lines.length);
    const processingTime = Date.now() - startTime;
    
    console.log(`🎯 InternalRhymeAgent: Enhanced ${allSpans.length} internal rhymes in ${processingTime}ms (density: ${finalDensity.toFixed(2)})`);
    
    return {
      enhancedLyrics,
      spans: allSpans,
      density: finalDensity,
      notes: [...notes, `Processing time: ${processingTime}ms`, `Final density: ${finalDensity.toFixed(2)}`]
    };
  }

  /**
   * Enhance internal rhymes within a single line
   */
  private async enhanceLineInternalRhymes(
    line: string, 
    lineIndex: number, 
    options: InternalRhymeOptions,
    isTimeoutReached: () => boolean
  ): Promise<{ line: string; spans: InternalRhymeSpan[]; notes: string[] }> {
    
    // Use enhanced tokenization with punctuation preservation
    const { words, punctuation } = this.tokenizeWithPunctuation(line);
    if (words.length < 4) {
      return { line, spans: [], notes: ['Line too short for internal rhymes'] };
    }

    const notes: string[] = [];
    let enhancedWords = [...words];
    const spans: InternalRhymeSpan[] = [];

    // Preserve end words if requested
    const protectedEndCount = options.preserveEndWords ? 1 : 0;
    const workingRange = words.length - protectedEndCount;

    // Strategy 1: Multisyllabic internal rhymes (highest priority)
    if (!isTimeoutReached() && (options.mode === 'aggressive' || options.mode === 'balanced')) {
      const multiResult = this.addMultisyllabicRhymes(enhancedWords, lineIndex, workingRange);
      if (multiResult.success) {
        enhancedWords = multiResult.words;
        spans.push(...multiResult.spans);
        notes.push(`Added multisyllabic rhyme: ${multiResult.technique}`);
      }
    }

    // Strategy 2: Assonance chains (vowel repetition)
    if (!isTimeoutReached() && spans.length < 2) {
      const assonanceResult = this.addAssonanceChain(enhancedWords, lineIndex, workingRange);
      if (assonanceResult.success) {
        enhancedWords = assonanceResult.words;
        spans.push(...assonanceResult.spans);
        notes.push(`Added assonance chain: ${assonanceResult.vowelPattern}`);
      }
    }

    // Strategy 3: Consonance clusters (consonant repetition)
    if (!isTimeoutReached() && spans.length < 1) {
      const consonanceResult = this.addConsonanceClusters(enhancedWords, lineIndex, workingRange);
      if (consonanceResult.success) {
        enhancedWords = consonanceResult.words;
        spans.push(...consonanceResult.spans);
        notes.push(`Added consonance: ${consonanceResult.pattern}`);
      }
    }

    // Strategy 4: Alliteration (onset repetition) - always attempt as it's subtle
    if (!isTimeoutReached()) {
      const alliterationResult = this.addAlliteration(enhancedWords, lineIndex, workingRange);
      if (alliterationResult.success) {
        enhancedWords = alliterationResult.words;
        spans.push(...alliterationResult.spans);
        notes.push(`Added alliteration: ${alliterationResult.onset}`);
      }
    }

    // Validate syllable count doesn't exceed limits
    const originalSyllables = this.countTotalSyllables(words);
    const enhancedSyllables = this.countTotalSyllables(enhancedWords);
    const syllableDelta = Math.abs(enhancedSyllables - originalSyllables);
    
    if (syllableDelta > options.maxSyllableDeltaPerLine) {
      notes.push(`Syllable delta too high (${syllableDelta}), reverting to original`);
      return { line, spans: [], notes };
    }

    // Reconstruct line with preserved punctuation
    const enhancedLine = this.reconstructLineWithPunctuation(enhancedWords, punctuation);
    return { line: enhancedLine, spans, notes };
  }

  /**
   * Add multisyllabic internal rhymes - most sophisticated technique
   * Now uses context-aware rhyming that preserves meaning and flow
   */
  private addMultisyllabicRhymes(
    words: string[], 
    lineIndex: number, 
    workingRange: number
  ): { success: boolean; words: string[]; spans: InternalRhymeSpan[]; technique: string } {
    
    if (workingRange < 6) return { success: false, words, spans: [], technique: '' };

    // Find existing words that can be enhanced with internal rhymes
    // Instead of replacing words, look for opportunities to create rhymes with existing content
    const existingWords = words.slice(0, workingRange);
    
    // Look for words that already have strong phonetic endings we can build on
    for (let i = 1; i < existingWords.length - 2; i++) {
      const word = existingWords[i];
      if (word.length < 4) continue; // Skip short words
      
      const phoneticEnding = this.extractPhoneticEnding(word);
      if (phoneticEnding.length < 2) continue;
      
      // Find a suitable position later in the line for a rhyme
      for (let j = i + 2; j < Math.min(workingRange - 1, i + 5); j++) {
        const targetWord = existingWords[j];
        
        // Try to create a meaningful rhyme that fits the context
        const contextualRhyme = this.findContextualRhyme(word, targetWord, phoneticEnding);
        if (contextualRhyme && contextualRhyme !== targetWord) {
          const newWords = [...words];
          newWords[j] = contextualRhyme;
          
          const spans: InternalRhymeSpan[] = [
            {
              lineIndex,
              start: i,
              end: i + 1,
              rhymeKey: phoneticEnding,
              strength: 2,
              technique: 'multi'
            },
            {
              lineIndex,
              start: j,
              end: j + 1,
              rhymeKey: phoneticEnding,
              strength: 2,
              technique: 'multi'
            }
          ];
          
          return { success: true, words: newWords, spans, technique: phoneticEnding };
        }
      }
    }

    return { success: false, words, spans: [], technique: '' };
  }

  /**
   * Find a contextually appropriate rhyme that maintains meaning
   */
  private findContextualRhyme(originalWord: string, targetWord: string, phoneticEnding: string): string | null {
    // Rap-focused contextual word mappings
    const rapContextRhymes: Record<string, string[]> = {
      'ack': ['attack', 'track', 'back', 'stack', 'crack', 'pack'],
      'ow': ['flow', 'show', 'know', 'grow', 'throw', 'blow'],
      'ight': ['fight', 'right', 'might', 'sight', 'tight', 'light'],
      'ound': ['sound', 'ground', 'round', 'found', 'bound', 'pound'],
      'ire': ['fire', 'wire', 'desire', 'inspire', 'require', 'acquire'],
      'eat': ['beat', 'heat', 'feat', 'defeat', 'complete', 'elite'],
      'ame': ['game', 'fame', 'name', 'shame', 'claim', 'flame'],
      'eal': ['real', 'deal', 'steal', 'feel', 'reveal', 'appeal']
    };
    
    // Try to find a rap-appropriate rhyme for the phonetic ending
    const candidates = rapContextRhymes[phoneticEnding] || [];
    
    // Prefer words that maintain the aggressive/confident tone of rap
    const contextPriority = ['attack', 'fire', 'fight', 'flow', 'beat', 'real', 'game'];
    
    for (const priority of contextPriority) {
      if (candidates.includes(priority) && priority !== originalWord) {
        return priority;
      }
    }
    
    // If no priority match, use any available candidate
    const available = candidates.filter(word => word !== originalWord && word !== targetWord);
    return available.length > 0 ? available[0] : null;
  }

  /**
   * Extract phonetic ending for rhyme matching
   * Enhanced with better phonetic analysis beyond substring matching
   */
  private extractPhoneticEnding(word: string): string {
    const cleanWord = word.toLowerCase();
    
    // Enhanced phonetic patterns with IPA-inspired mappings
    const phoneticPatterns = [
      // Perfect rhyme endings (nucleus + coda)
      { pattern: /tion$/, phonetic: 'ʃən' },
      { pattern: /sion$/, phonetic: 'ʒən' },
      { pattern: /ight$/, phonetic: 'aɪt' },
      { pattern: /ought$/, phonetic: 'ɔːt' },
      { pattern: /ound$/, phonetic: 'aʊnd' },
      { pattern: /ack$/, phonetic: 'æk' },
      { pattern: /eat$/, phonetic: 'iːt' },
      { pattern: /ire$/, phonetic: 'aɪər' },
      { pattern: /ow$/, phonetic: 'oʊ' },
      { pattern: /ame$/, phonetic: 'eɪm' },
      { pattern: /eal$/, phonetic: 'iːl' },
      { pattern: /ing$/, phonetic: 'ɪŋ' },
      
      // Consonant cluster endings
      { pattern: /st$/, phonetic: 'st' },
      { pattern: /nd$/, phonetic: 'nd' },
      { pattern: /ck$/, phonetic: 'k' },
      { pattern: /ng$/, phonetic: 'ŋ' },
      { pattern: /mp$/, phonetic: 'mp' },
      { pattern: /nt$/, phonetic: 'nt' },
      
      // Vowel-heavy endings (for assonance)
      { pattern: /ay$/, phonetic: 'eɪ' },
      { pattern: /ey$/, phonetic: 'eɪ' },
      { pattern: /ie$/, phonetic: 'iː' },
      { pattern: /ee$/, phonetic: 'iː' },
      { pattern: /oo$/, phonetic: 'uː' },
    ];
    
    // Try enhanced phonetic patterns first
    for (const { pattern, phonetic } of phoneticPatterns) {
      if (pattern.test(cleanWord)) {
        return phonetic;
      }
    }
    
    // Advanced phonetic analysis for complex words
    const advancedAnalysis = this.getAdvancedPhoneticEnding(cleanWord);
    if (advancedAnalysis) {
      return advancedAnalysis;
    }
    
    // Fallback to basic character-based analysis with vowel prioritization
    return this.getBasicPhoneticEnding(cleanWord);
  }

  /**
   * Get advanced phonetic ending using syllable structure analysis
   */
  private getAdvancedPhoneticEnding(word: string): string | null {
    // Split into phonetic components
    const vowelClusters = word.match(/[aeiouy]+/g) || [];
    const consonantClusters = word.split(/[aeiouy]+/).filter(c => c.length > 0);
    
    if (vowelClusters.length === 0) return null;
    
    const lastVowelCluster = vowelClusters[vowelClusters.length - 1];
    const lastConsonantCluster = consonantClusters[consonantClusters.length - 1] || '';
    
    // Create phonetic key from last syllable components
    const phoneticKey = this.mapToPhonetic(lastVowelCluster) + this.mapToPhonetic(lastConsonantCluster);
    
    return phoneticKey.length > 1 ? phoneticKey : null;
  }

  /**
   * Map character sequences to phonetic representations
   */
  private mapToPhonetic(sequence: string): string {
    const phoneticMap: Record<string, string> = {
      // Vowel mappings
      'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɔ', 'u': 'ʌ', 'y': 'ɪ',
      'ai': 'eɪ', 'ay': 'eɪ', 'ea': 'iː', 'ee': 'iː', 'ei': 'eɪ',
      'ie': 'iː', 'oa': 'oʊ', 'oo': 'uː', 'ou': 'aʊ', 'ow': 'aʊ',
      'ey': 'eɪ', 'ue': 'uː', 'ew': 'uː',
      
      // Consonant mappings
      'ch': 'tʃ', 'sh': 'ʃ', 'th': 'θ', 'ng': 'ŋ', 'ph': 'f',
      'ck': 'k', 'gh': 'f', 'kn': 'n', 'wr': 'r',
      
      // Single consonants
      'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g',
      'h': 'h', 'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm',
      'n': 'n', 'p': 'p', 'q': 'k', 'r': 'r', 's': 's',
      't': 't', 'v': 'v', 'w': 'w', 'x': 'ks', 'z': 'z'
    };
    
    // Try longer sequences first
    for (let len = Math.min(sequence.length, 3); len >= 1; len--) {
      const subseq = sequence.slice(-len);
      if (phoneticMap[subseq]) {
        return phoneticMap[subseq];
      }
    }
    
    return sequence; // Fallback to original
  }

  /**
   * Get basic phonetic ending for simple words
   */
  private getBasicPhoneticEnding(word: string): string {
    // Extract last vowel + consonants for better rhyme matching
    const match = word.match(/([aeiouy]+[^aeiouy]*)$/);
    if (match) {
      return this.mapToPhonetic(match[1]);
    }
    
    // Fallback to last few characters with phonetic preference
    const ending = word.length >= 3 ? word.slice(-3) : word.slice(-2);
    return this.mapToPhonetic(ending);
  }

  /**
   * Add assonance chain - repeated vowel sounds
   * Enhanced with semantic similarity checks to maintain meaning
   */
  private addAssonanceChain(
    words: string[], 
    lineIndex: number, 
    workingRange: number
  ): { success: boolean; words: string[]; spans: InternalRhymeSpan[]; vowelPattern: string } {
    
    const vowels = Object.keys(this.rhymeWordBanks.assonance);
    const selectedVowel = vowels[Math.floor(Math.random() * vowels.length)];
    const candidates = this.rhymeWordBanks.assonance[selectedVowel as keyof typeof this.rhymeWordBanks.assonance];

    if (candidates.length < 2 || workingRange < 4) {
      return { success: false, words, spans: [], vowelPattern: '' };
    }

    const newWords = [...words];
    const spans: InternalRhymeSpan[] = [];
    const positions = [2, 4]; // Strategic positions for assonance

    for (let i = 0; i < Math.min(positions.length, candidates.length); i++) {
      const pos = positions[i];
      if (pos < workingRange) {
        const originalWord = words[pos];
        const candidateWord = candidates[i];
        
        // Semantic similarity check before replacement
        if (this.isSemanticallySimilar(originalWord, candidateWord, 'assonance')) {
          newWords[pos] = candidateWord;
          spans.push({
            lineIndex,
            start: pos,
            end: pos + 1,
            rhymeKey: selectedVowel,
            strength: 2,
            technique: 'assonance'
          });
        }
      }
    }

    return { 
      success: spans.length > 1, 
      words: newWords, 
      spans, 
      vowelPattern: selectedVowel 
    };
  }

  /**
   * Add consonance clusters - repeated consonant endings
   * Enhanced with semantic similarity checks to maintain meaning
   */
  private addConsonanceClusters(
    words: string[], 
    lineIndex: number, 
    workingRange: number
  ): { success: boolean; words: string[]; spans: InternalRhymeSpan[]; pattern: string } {
    
    const patterns = Object.keys(this.rhymeWordBanks.consonance);
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const candidates = this.rhymeWordBanks.consonance[selectedPattern as keyof typeof this.rhymeWordBanks.consonance];

    if (candidates.length < 2 || workingRange < 3) {
      return { success: false, words, spans: [], pattern: '' };
    }

    const newWords = [...words];
    const spans: InternalRhymeSpan[] = [];
    const positions = [1, 3]; // Early positions for consonance

    for (let i = 0; i < Math.min(positions.length, candidates.length); i++) {
      const pos = positions[i];
      if (pos < workingRange) {
        const originalWord = words[pos];
        const candidateWord = candidates[i];
        
        // Semantic similarity check before replacement
        if (this.isSemanticallySimilar(originalWord, candidateWord, 'consonance')) {
          newWords[pos] = candidateWord;
          spans.push({
            lineIndex,
            start: pos,
            end: pos + 1,
            rhymeKey: selectedPattern,
            strength: 2,
            technique: 'consonance'
          });
        }
      }
    }

    return { 
      success: spans.length > 1, 
      words: newWords, 
      spans, 
      pattern: selectedPattern 
    };
  }

  /**
   * Add alliteration - repeated initial consonants
   */
  private addAlliteration(
    words: string[], 
    lineIndex: number, 
    workingRange: number
  ): { success: boolean; words: string[]; spans: InternalRhymeSpan[]; onset: string } {
    
    const alliterativeGroups = [
      ['battle', 'break', 'bring', 'blast'],
      ['fire', 'flow', 'fight', 'force'],
      ['savage', 'strike', 'strong', 'skill'],
      ['deadly', 'destroy', 'devastating', 'dominate']
    ];

    const selectedGroup = alliterativeGroups[Math.floor(Math.random() * alliterativeGroups.length)];
    const onset = selectedGroup[0].charAt(0);

    if (workingRange < 3) {
      return { success: false, words, spans: [], onset };
    }

    const newWords = [...words];
    const spans: InternalRhymeSpan[] = [];
    const positions = [0, 2]; // Beginning positions for alliteration

    for (let i = 0; i < Math.min(positions.length, selectedGroup.length); i++) {
      const pos = positions[i];
      if (pos < workingRange) {
        newWords[pos] = selectedGroup[i];
        spans.push({
          lineIndex,
          start: pos,
          end: pos + 1,
          rhymeKey: onset,
          strength: 1,
          technique: 'alliteration'
        });
      }
    }

    return { 
      success: spans.length > 1, 
      words: newWords, 
      spans, 
      onset 
    };
  }

  /**
   * Find existing internal rhymes in a line
   */
  private findInternalRhymesInLine(words: string[], lineIndex: number): InternalRhymeSpan[] {
    const spans: InternalRhymeSpan[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const word1 = words[i].toLowerCase();
        const word2 = words[j].toLowerCase();
        
        if (this.wordsRhyme(word1, word2)) {
          spans.push({
            lineIndex,
            start: i,
            end: i + 1,
            rhymeKey: this.extractRhymeKey(word1),
            strength: this.calculateRhymeStrength(word1, word2),
            technique: this.identifyRhymeTechnique(word1, word2)
          });
        }
      }
    }
    
    return spans;
  }

  /**
   * Utility functions
   */
  private tokenize(line: string): string[] {
    return line.trim().split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Enhanced tokenization with punctuation preservation
   */
  private tokenizeWithPunctuation(line: string): { words: string[]; punctuation: { [index: number]: string } } {
    const punctuation: { [index: number]: string } = {};
    const cleanedLine = line.trim();
    
    // Extract words while preserving punctuation positions
    const tokens = cleanedLine.split(/(\s+)/);
    const words: string[] = [];
    let wordIndex = 0;
    
    for (const token of tokens) {
      if (token.trim()) {
        // Check for punctuation at end of word
        const match = token.match(/^(.*?)([.!?,:;'"-]+)$/);
        if (match) {
          const [, word, punct] = match;
          if (word) {
            words.push(word);
            punctuation[wordIndex] = punct;
            wordIndex++;
          }
        } else {
          words.push(token);
          wordIndex++;
        }
      }
    }
    
    return { words, punctuation };
  }

  /**
   * Reconstruct line with preserved punctuation
   */
  private reconstructLineWithPunctuation(words: string[], punctuation: { [index: number]: string }): string {
    return words.map((word, index) => {
      const punct = punctuation[index] || '';
      return word + punct;
    }).join(' ');
  }

  // DEPRECATED: Use phoneticAnalyzer.analyzeRhymeScheme() instead
  private getPhoneticAnalysisDeprecated(word: string): PhoneticAnalysis {
    const key = word.toLowerCase();
    
    // LRU cache implementation
    if (this.phoneticCache.has(key)) {
      // Update access order for LRU
      this.cacheAccessOrder.delete(key);
      this.cacheAccessOrder.add(key);
      return this.phoneticCache.get(key)!;
    }

    const cleaned = key.replace(/[^\w]/g, '');
    const vowelMatch = cleaned.match(/([aeiouy]+)([^aeiouy]*)/);
    const onsetMatch = cleaned.match(/^([^aeiouy]*)/);
    
    const analysis: PhoneticAnalysis = {
      nucleus: vowelMatch?.[1] || '',
      coda: vowelMatch?.[2] || '',
      onset: onsetMatch?.[1] || '',
      syllableCount: this.countSyllables(word)
    };

    // LRU cache management
    if (this.phoneticCache.size >= this.MAX_CACHE_SIZE) {
      // Remove least recently used item
      const lruKey = this.cacheAccessOrder.values().next().value;
      if (lruKey) {
        this.phoneticCache.delete(lruKey);
        this.cacheAccessOrder.delete(lruKey);
      }
    }

    this.phoneticCache.set(key, analysis);
    this.cacheAccessOrder.add(key);
    return analysis;
  }

  private countSyllables(word: string): number {
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
    return vowelGroups ? vowelGroups.length : 1;
  }

  private countTotalSyllables(words: string[]): number {
    return words.reduce((total, word) => total + this.countSyllables(word), 0);
  }

  private wordsRhyme(word1: string, word2: string): boolean {
    // Simple rhyme detection to prevent memory leaks
    if (word1.length < 2 || word2.length < 2) return false;
    const ending1 = word1.slice(-2).toLowerCase();
    const ending2 = word2.slice(-2).toLowerCase();
    return ending1 === ending2;
  }

  private extractRhymeKey(word: string): string {
    // Simple rhyme key extraction to prevent memory leaks
    return word.length >= 2 ? word.slice(-2).toLowerCase() : word.toLowerCase();
  }

  private calculateRhymeStrength(word1: string, word2: string): 1 | 2 | 3 {
    // Simple strength calculation to prevent memory leaks
    if (!this.wordsRhyme(word1, word2)) {
      return 1; // Subtle/slant
    }
    
    const word1Syllables = this.countSyllables(word1);
    const word2Syllables = this.countSyllables(word2);
    
    if (word1Syllables > 1 && word2Syllables > 1) {
      return 3; // Multi-syllable rhyme = devastating
    }
    
    return 2; // Standard rhyme
  }

  private identifyRhymeTechnique(word1: string, word2: string): InternalRhymeSpan['technique'] {
    const word1Syllables = this.countSyllables(word1);
    const word2Syllables = this.countSyllables(word2);
    
    // Multisyllabic
    if (Math.min(word1Syllables, word2Syllables) > 1) {
      return 'multi';
    }
    
    // FIXED: Use simple string comparison instead of phonetic analyzer to prevent infinite loops
    const ending1 = word1.slice(-2).toLowerCase();
    const ending2 = word2.slice(-2).toLowerCase();
    const isSameFamily = ending1 === ending2;
    
    if (isSameFamily) {
      return 'assonance';
    }
    
    return 'overlap';
  }

  /**
   * Check semantic similarity between original and candidate words
   * Returns true if replacement maintains contextual relevance
   */
  private isSemanticallySimilar(originalWord: string, candidateWord: string, technique: string): boolean {
    const original = originalWord.toLowerCase();
    const candidate = candidateWord.toLowerCase();
    
    // Never replace with the same word
    if (original === candidate) return false;
    
    // Rap context semantic groups - words that maintain similar energy/meaning
    const semanticGroups = {
      // Action/Movement verbs
      action: ['attack', 'fight', 'strike', 'blast', 'crush', 'destroy', 'break', 'force', 'push', 'move', 'flow', 'go'],
      
      // Power/Strength words
      power: ['strong', 'mighty', 'fierce', 'tough', 'hard', 'solid', 'steel', 'rock', 'fire', 'thunder', 'lightning'],
      
      // Success/Achievement
      success: ['win', 'beat', 'defeat', 'conquer', 'triumph', 'achieve', 'complete', 'master', 'elite', 'champion'],
      
      // Sound/Music
      sound: ['beat', 'track', 'sound', 'music', 'rhythm', 'flow', 'voice', 'song', 'noise', 'blast'],
      
      // Emotion/Attitude
      emotion: ['mad', 'wild', 'fierce', 'calm', 'cool', 'hot', 'cold', 'smooth', 'rough', 'sharp'],
      
      // Time/Speed
      time: ['fast', 'quick', 'slow', 'late', 'soon', 'now', 'then', 'when', 'time', 'moment'],
      
      // Location/Direction
      location: ['here', 'there', 'up', 'down', 'back', 'front', 'side', 'around', 'through', 'ground']
    };
    
    // Check if both words belong to the same semantic group
    for (const [groupName, words] of Object.entries(semanticGroups)) {
      const originalInGroup = words.includes(original);
      const candidateInGroup = words.includes(candidate);
      
      if (originalInGroup && candidateInGroup) {
        return true; // Both in same semantic group
      }
    }
    
    // Fallback: Allow replacement if words share similar phonetic structure
    // This maintains rhythm while being more conservative with meaning
    if (technique === 'assonance' || technique === 'consonance') {
      const originalSyllables = this.countSyllables(original);
      const candidateSyllables = this.countSyllables(candidate);
      
      // Allow if syllable count is similar (within 1) and both are rap-appropriate
      const syllableDiff = Math.abs(originalSyllables - candidateSyllables);
      const rapWords = ['attack', 'track', 'back', 'stack', 'crack', 'pack', 'flow', 'show', 'know', 'grow', 'beat', 'heat', 'feat', 'real', 'deal', 'steel', 'feel'];
      
      return syllableDiff <= 1 && rapWords.includes(candidate);
    }
    
    return false; // Conservative default - don't replace if unsure
  }
}