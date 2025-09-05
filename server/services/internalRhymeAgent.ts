/**
 * INTERNAL RHYME AGENT
 * Specialized agent for sophisticated internal rhyme pattern generation
 * Enhances midline rhyming complexity without disrupting end-rhyme schemes
 */

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
    console.log('🎯 InternalRhymeAgent initialized - Advanced internal rhyme processing enabled');
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
   */
  private addMultisyllabicRhymes(
    words: string[], 
    lineIndex: number, 
    workingRange: number
  ): { success: boolean; words: string[]; spans: InternalRhymeSpan[]; technique: string } {
    
    if (workingRange < 6) return { success: false, words, spans: [], technique: '' };

    // Look for opportunities to place 2-3 syllable rhyming phrases
    const midPoint = Math.floor(workingRange / 2);
    const position1 = midPoint - 2;
    const position2 = midPoint + 1;

    if (position1 < 1 || position2 >= workingRange - 1) {
      return { success: false, words, spans: [], technique: '' };
    }

    // Select rhyming pair from word bank
    const techniques = Object.keys(this.rhymeWordBanks.multi);
    const selectedTechnique = techniques[Math.floor(Math.random() * techniques.length)];
    const candidates = this.rhymeWordBanks.multi[selectedTechnique as keyof typeof this.rhymeWordBanks.multi];
    
    if (candidates.length < 2) {
      return { success: false, words, spans: [], technique: '' };
    }

    const [word1, word2] = candidates.slice(0, 2);
    const newWords = [...words];
    
    // Insert multisyllabic rhymes at calculated positions
    newWords[position1] = word1;
    newWords[position2] = word2;

    const spans: InternalRhymeSpan[] = [
      {
        lineIndex,
        start: position1,
        end: position1 + 1,
        rhymeKey: selectedTechnique,
        strength: 3,
        technique: 'multi'
      },
      {
        lineIndex,
        start: position2,
        end: position2 + 1,
        rhymeKey: selectedTechnique,
        strength: 3,
        technique: 'multi'
      }
    ];

    return { success: true, words: newWords, spans, technique: selectedTechnique };
  }

  /**
   * Add assonance chain - repeated vowel sounds
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
        newWords[pos] = candidates[i];
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

    return { 
      success: spans.length > 1, 
      words: newWords, 
      spans, 
      vowelPattern: selectedVowel 
    };
  }

  /**
   * Add consonance clusters - repeated consonant endings
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
        newWords[pos] = candidates[i];
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

  private getPhoneticAnalysis(word: string): PhoneticAnalysis {
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
    const analysis1 = this.getPhoneticAnalysis(word1);
    const analysis2 = this.getPhoneticAnalysis(word2);
    
    // Perfect rhyme: nucleus + coda match
    if (analysis1.nucleus === analysis2.nucleus && analysis1.coda === analysis2.coda) {
      return true;
    }
    
    // Near rhyme: nucleus matches
    return analysis1.nucleus === analysis2.nucleus;
  }

  private extractRhymeKey(word: string): string {
    const analysis = this.getPhoneticAnalysis(word);
    return analysis.nucleus + analysis.coda;
  }

  private calculateRhymeStrength(word1: string, word2: string): 1 | 2 | 3 {
    const analysis1 = this.getPhoneticAnalysis(word1);
    const analysis2 = this.getPhoneticAnalysis(word2);
    
    // Perfect multisyllabic rhyme
    if (analysis1.nucleus === analysis2.nucleus && 
        analysis1.coda === analysis2.coda && 
        Math.min(analysis1.syllableCount, analysis2.syllableCount) > 1) {
      return 3;
    }
    
    // Perfect single syllable rhyme
    if (analysis1.nucleus === analysis2.nucleus && analysis1.coda === analysis2.coda) {
      return 2;
    }
    
    // Near rhyme or assonance
    return 1;
  }

  private identifyRhymeTechnique(word1: string, word2: string): InternalRhymeSpan['technique'] {
    const analysis1 = this.getPhoneticAnalysis(word1);
    const analysis2 = this.getPhoneticAnalysis(word2);
    
    // Multisyllabic
    if (Math.min(analysis1.syllableCount, analysis2.syllableCount) > 1) {
      return 'multi';
    }
    
    // Alliteration
    if (analysis1.onset === analysis2.onset && analysis1.onset.length > 0) {
      return 'alliteration';
    }
    
    // Consonance
    if (analysis1.coda === analysis2.coda && analysis1.coda.length > 0) {
      return 'consonance';
    }
    
    // Assonance
    if (analysis1.nucleus === analysis2.nucleus) {
      return 'assonance';
    }
    
    return 'overlap';
  }
}