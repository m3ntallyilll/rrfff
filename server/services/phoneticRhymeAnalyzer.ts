import * as fs from 'fs';
import * as path from 'path';

// Phonetic Rhyme Scheme Annotation Algorithm
// Based on CMU Pronouncing Dictionary and advanced phonetic analysis

interface PhoneticSyllable {
  phonemes: string[];
  text: string;
  stress: number; // 0=unstressed, 1=primary, 2=secondary
  rhymePattern: string[];
  families: Set<string>;
}

interface RhymeFamily {
  letter: string;
  pattern: string[];
  occurrences: number;
  lines: number[];
}

interface LineAnalysis {
  syllableCount: number;
  syllables: PhoneticSyllable[];
  endRhymeFamily: string;
  familyCounts: Map<string, number>;
  scheme: string;
  breakdown: string;
}

interface RhymeSchemeResult {
  lines: LineAnalysis[];
  families: Map<string, RhymeFamily>;
  overallScheme: string[];
  rhymeDensity: number;
  perfectRhymes: number;
  slantRhymes: number;
}

export class PhoneticRhymeAnalyzer {
  private cmuDict: Map<string, string[][]> = new Map();
  private families: Map<string, RhymeFamily> = new Map();
  private nextFamilyLetter = 'A';
  private readonly SLANT_THRESHOLD = 0.7; // Threshold for slant rhyme similarity

  private static analysisDepth = 0;
  private static readonly MAX_ANALYSIS_DEPTH = 3;

  constructor() {
    this.loadCMUDictionary();
    console.log('🎯 PhoneticRhymeAnalyzer initialized with CMU dictionary');
  }

  /**
   * Load CMU Pronouncing Dictionary for phonetic analysis
   */
  private loadCMUDictionary(): void {
    try {
      // Try to load from node_modules first
      const cmuPath = path.join(process.cwd(), 'node_modules', 'cmu-pronouncing-dictionary', 'cmudict.txt');

      if (fs.existsSync(cmuPath)) {
        const dictData = fs.readFileSync(cmuPath, 'utf8');
        this.parseCMUDict(dictData);
      } else {
        // Fallback to essential phonetic mappings
        this.loadEssentialPhonetics();
      }
    } catch (error) {
      console.warn('⚠️ CMU dictionary loading failed, using essential phonetics:', error);
      this.loadEssentialPhonetics();
    }
  }

  private parseCMUDict(dictData: string): void {
    const lines = dictData.split('\n');
    let wordCount = 0;

    for (const line of lines) {
      if (line.startsWith(';;;') || line.trim() === '') continue;

      const parts = line.split('  ');
      if (parts.length >= 2) {
        let word = parts[0].toLowerCase();

        // Handle alternative pronunciations like WORD(1)
        const parenIndex = word.indexOf('(');
        if (parenIndex > 0) {
          word = word.substring(0, parenIndex);
        }

        const phonemes = parts[1].trim().split(' ');

        if (!this.cmuDict.has(word)) {
          this.cmuDict.set(word, []);
        }
        this.cmuDict.get(word)!.push(phonemes);
        wordCount++;
      }
    }
    console.log(`✅ Loaded ${this.cmuDict.size} words with ${wordCount} pronunciations from CMU dictionary`);
  }

  private loadEssentialPhonetics(): void {
    // Essential rap vocabulary with phonetic transcriptions
    const essentialWords = new Map([
      // Common rap words
      ['fire', [['F', 'AY1', 'R']]],
      ['flow', [['F', 'L', 'OW1']]],
      ['beat', [['B', 'IY1', 'T']]],
      ['rap', [['R', 'AE1', 'P']]],
      ['real', [['R', 'IY1', 'L']]],
      ['game', [['G', 'EY1', 'M']]],
      ['fight', [['F', 'AY1', 'T']]],
      ['track', [['T', 'R', 'AE1', 'K']]],
      ['attack', [['AH0', 'T', 'AE1', 'K']]],
      ['back', [['B', 'AE1', 'K']]],
      ['pack', [['P', 'AE1', 'K']]],
      ['stack', [['S', 'T', 'AE1', 'K']]],
      ['crack', [['K', 'R', 'AE1', 'K']]],
      ['black', [['B', 'L', 'AE1', 'K']]],

      // Rhyme endings
      ['nation', [['N', 'EY1', 'SH', 'AH0', 'N']]],
      ['creation', [['K', 'R', 'IY0', 'EY1', 'SH', 'AH0', 'N']]],
      ['devastation', [['D', 'EH2', 'V', 'AH0', 'S', 'T', 'EY1', 'SH', 'AH0', 'N']]],
      ['domination', [['D', 'AA2', 'M', 'AH0', 'N', 'EY1', 'SH', 'AH0', 'N']]],

      // Common endings
      ['time', [['T', 'AY1', 'M']]],
      ['rhyme', [['R', 'AY1', 'M']]],
      ['crime', [['K', 'R', 'AY1', 'M']]],
      ['prime', [['P', 'R', 'AY1', 'M']]],
      ['mind', [['M', 'AY1', 'N', 'D']]],
      ['find', [['F', 'AY1', 'N', 'D']]],
      ['grind', [['G', 'R', 'AY1', 'N', 'D']]],
      ['blind', [['B', 'L', 'AY1', 'N', 'D']]]
    ]);

    this.cmuDict = essentialWords;
    console.log(`✅ Loaded ${this.cmuDict.size} essential rap phonetics`);
  }

  /**
   * Main entry point: Analyze rap lyrics with comprehensive phonetic rhyme scheme
   */
  analyzeRhymeScheme(lyrics: string): RhymeSchemeResult {
    // Prevent infinite recursion and memory leaks
    if (PhoneticRhymeAnalyzer.analysisDepth >= PhoneticRhymeAnalyzer.MAX_ANALYSIS_DEPTH) {
      console.log('🚫 PhoneticRhymeAnalyzer: Maximum recursion depth reached, returning cached result');
      return this.createEmptyResult();
    }

    PhoneticRhymeAnalyzer.analysisDepth++;

    try {
      console.log('🎯 PhoneticRhymeAnalyzer: Starting comprehensive rhyme analysis');

      if (!lyrics || lyrics.trim().length === 0) {
        return this.createEmptyResult();
      }

      // Reset state for new analysis
      this.families.clear();
      this.nextFamilyLetter = 'A';

      const lines = this.preprocessLyrics(lyrics);
      const lineAnalyses: LineAnalysis[] = [];
      let totalPerfectRhymes = 0;
      let totalSlantRhymes = 0;

      // Process each line
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (!line.trim()) continue;

        const analysis = this.analyzeLine(line, lineIndex);
        lineAnalyses.push(analysis);

        // Count rhyme types by analyzing family patterns
        analysis.familyCounts.forEach((count, familyLetter) => {
          const family = this.families.get(familyLetter);
          if (family && count > 1) {
            // Determine perfect vs slant based on pattern exactness
            const rhymePairs = Math.floor(count / 2);

            // Analyze pattern precision for classification
            const isExactPattern = this.isExactRhymePattern(family.pattern);

            if (isExactPattern) {
              totalPerfectRhymes += rhymePairs;
            } else {
              totalSlantRhymes += rhymePairs;
            }
          }
        });
      }

      // Calculate overall metrics
      const totalLines = lineAnalyses.length;
      const totalInternalRhymes = lineAnalyses.reduce((sum, analysis) => {
        return sum + Array.from(analysis.familyCounts.values()).reduce((a, b) => a + b, 0);
      }, 0);

      const rhymeDensity = totalLines > 0 ? totalInternalRhymes / totalLines : 0;
      const overallScheme = lineAnalyses.map(analysis => analysis.scheme);

      return {
        lines: lineAnalyses,
        families: this.families,
        overallScheme,
        rhymeDensity,
        perfectRhymes: totalPerfectRhymes,
        slantRhymes: totalSlantRhymes
      };
    } catch (error) {
      console.error('🚫 PhoneticRhymeAnalyzer: Analysis error:', error);
      return this.createEmptyResult();
    } finally {
      // Always reset the recursion counter
      PhoneticRhymeAnalyzer.analysisDepth = Math.max(0, PhoneticRhymeAnalyzer.analysisDepth - 1);
    }
  }

  /**
   * Analyze a single line for syllables, rhymes, and families
   */
  private analyzeLine(line: string, lineIndex: number): LineAnalysis {
    // 1. Syllabify the line
    const syllables = this.syllabifyLine(line);
    const syllableCount = syllables.length;

    // 2. Identify end-of-line rhyme family
    const endRhymeFamily = this.assignEndRhymeFamily(syllables, lineIndex);

    // 3. Detect internal rhymes
    const familyCounts = this.detectInternalRhymes(syllables, lineIndex);

    // 4. Build scheme annotation
    const scheme = this.buildSchemeAnnotation(syllableCount, familyCounts);
    const breakdown = this.buildSyllableBreakdown(syllables);

    return {
      syllableCount,
      syllables,
      endRhymeFamily,
      familyCounts,
      scheme,
      breakdown
    };
  }

  /**
   * Convert line to phonetic syllables using CMU dictionary
   */
  private syllabifyLine(line: string): PhoneticSyllable[] {
    const words = this.tokenize(line);
    const syllables: PhoneticSyllable[] = [];

    for (const word of words) {
      const wordSyllables = this.syllabifyWord(word);
      syllables.push(...wordSyllables);
    }

    return syllables;
  }

  private syllabifyWord(word: string): PhoneticSyllable[] {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanWord) return [];

    // Get phonemes from CMU dictionary
    const pronunciations = this.cmuDict.get(cleanWord);
    if (!pronunciations || pronunciations.length === 0) {
      // Fallback to heuristic syllabification
      return this.heuristicSyllabify(word);
    }

    // Use first pronunciation
    const phonemes = pronunciations[0];
    const syllables: PhoneticSyllable[] = [];
    let currentSyllable: string[] = [];
    let currentText = '';
    let wordCharIndex = 0;

    for (const phoneme of phonemes) {
      currentSyllable.push(phoneme);

      // Check if this phoneme ends a syllable (has stress marker)
      if (phoneme.match(/[012]$/)) {
        const stress = parseInt(phoneme.slice(-1));

        // Extract corresponding text portion (approximate)
        const syllableLength = Math.max(1, Math.floor(word.length / this.countSyllablesInPhonemes(phonemes)));
        const syllableText = word.slice(wordCharIndex, wordCharIndex + syllableLength);
        wordCharIndex += syllableLength;

        // Create rhyme pattern (from stressed vowel to end)
        const rhymePattern = this.extractRhymePattern(currentSyllable);

        syllables.push({
          phonemes: [...currentSyllable],
          text: syllableText || word.slice(-2), // Fallback
          stress,
          rhymePattern,
          families: new Set()
        });

        currentSyllable = [];
      }
    }

    // Handle any remaining phonemes
    if (currentSyllable.length > 0) {
      syllables.push({
        phonemes: currentSyllable,
        text: word.slice(wordCharIndex) || word.slice(-1),
        stress: 0,
        rhymePattern: this.extractRhymePattern(currentSyllable),
        families: new Set()
      });
    }

    return syllables.length > 0 ? syllables : this.heuristicSyllabify(word);
  }

  /**
   * Determines if a rhyme pattern represents a perfect rhyme
   */
  private isExactRhymePattern(pattern: string[]): boolean {
    // Perfect rhymes have exact phoneme matches
    // This is a simplified check - can be expanded
    return pattern.length >= 2 && pattern.some(p => p.match(/[12]$/));
  }

  private extractRhymePattern(phonemes: string[]): string[] {
    // Find the last stressed vowel and extract from there to end
    let stressedIndex = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (phonemes[i].match(/[12]$/)) {
        stressedIndex = i;
        break;
      }
    }

    if (stressedIndex >= 0) {
      return phonemes.slice(stressedIndex);
    }

    // Fallback: use last few phonemes
    return phonemes.slice(-2);
  }

  private countSyllablesInPhonemes(phonemes: string[]): number {
    return phonemes.filter(p => p.match(/[012]$/)).length;
  }

  private heuristicSyllabify(word: string): PhoneticSyllable[] {
    // Simple heuristic: count vowel groups
    const vowelPattern = /[aeiouAEIOU]+/g;
    const matches = word.match(vowelPattern) || [];
    const syllableCount = Math.max(1, matches.length);

    // Create approximate syllables
    const syllables: PhoneticSyllable[] = [];
    const syllableLength = Math.ceil(word.length / syllableCount);

    for (let i = 0; i < syllableCount; i++) {
      const start = i * syllableLength;
      const end = Math.min(start + syllableLength, word.length);
      const text = word.slice(start, end);

      syllables.push({
        phonemes: [text.toUpperCase()], // Approximate
        text,
        stress: i === syllableCount - 1 ? 1 : 0, // Last syllable stressed
        rhymePattern: [text.slice(-2).toUpperCase()],
        families: new Set()
      });
    }

    return syllables;
  }

  /**
   * Assign rhyme family for line-ending syllable
   */
  private assignEndRhymeFamily(syllables: PhoneticSyllable[], lineIndex: number): string {
    if (syllables.length === 0) return '';

    const lastSyllable = syllables[syllables.length - 1];
    const rhymePattern = lastSyllable.rhymePattern;

    // Check if this pattern matches existing families
    const familiesArray = Array.from(this.families.entries());
    for (const [letter, family] of familiesArray) {
      if (this.phonemeMatch(rhymePattern, family.pattern)) {
        family.occurrences++;
        family.lines.push(lineIndex);
        lastSyllable.families.add(letter);
        return letter;
      }
    }

    // Create new family
    const newLetter = this.nextFamilyLetter;
    this.families.set(newLetter, {
      letter: newLetter,
      pattern: rhymePattern,
      occurrences: 1,
      lines: [lineIndex]
    });

    lastSyllable.families.add(newLetter);
    this.nextFamilyLetter = String.fromCharCode(this.nextFamilyLetter.charCodeAt(0) + 1);

    return newLetter;
  }

  /**
   * Detect internal rhymes within the line
   */
  private detectInternalRhymes(syllables: PhoneticSyllable[], lineIndex: number): Map<string, number> {
    const familyCounts = new Map<string, number>();

    for (const syllable of syllables) {
      // Check against all existing families
      const familiesArray = Array.from(this.families.entries());
      for (const [letter, family] of familiesArray) {
        if (this.phonemeMatch(syllable.rhymePattern, family.pattern)) {
          syllable.families.add(letter);
          familyCounts.set(letter, (familyCounts.get(letter) || 0) + 1);
        }
      }
    }

    return familyCounts;
  }

  /**
   * Advanced phoneme matching for perfect and slant rhymes
   */
  private phonemeMatch(pattern1: string[], pattern2: string[]): boolean {
    if (pattern1.length === 0 || pattern2.length === 0) return false;

    // Perfect match
    if (this.arraysEqual(pattern1, pattern2)) return true;

    // Extract vowel cores for comparison
    const vowel1 = this.extractVowelCore(pattern1);
    const vowel2 = this.extractVowelCore(pattern2);

    // Require same vowel sound for slant rhyme
    if (vowel1 !== vowel2) return false;

    // Calculate consonant similarity for slant rhyme
    const consonantSim = this.consonantSimilarity(pattern1, pattern2);
    return consonantSim >= this.SLANT_THRESHOLD;
  }

  private extractVowelCore(phonemes: string[]): string {
    // Find the main vowel phoneme (with stress marker)
    for (const phoneme of phonemes) {
      if (phoneme.match(/[012]$/)) {
        return phoneme.replace(/[012]$/, ''); // Remove stress marker
      }
    }

    // Fallback: first phoneme
    return phonemes[0]?.replace(/[012]$/, '') || '';
  }

  private consonantSimilarity(pattern1: string[], pattern2: string[]): number {
    // Simple consonant similarity based on shared endings
    const consonants1 = pattern1.filter(p => !p.match(/[AEIOU]/));
    const consonants2 = pattern2.filter(p => !p.match(/[AEIOU]/));

    if (consonants1.length === 0 && consonants2.length === 0) return 1.0;
    if (consonants1.length === 0 || consonants2.length === 0) return 0.5;

    // Count matching consonants
    const matches = consonants1.filter(c1 => 
      consonants2.some(c2 => this.consonantsMatch(c1, c2))
    ).length;

    return matches / Math.max(consonants1.length, consonants2.length);
  }

  private consonantsMatch(c1: string, c2: string): boolean {
    // Exact match
    if (c1 === c2) return true;

    // Voice/voiceless pairs (common in rap slant rhymes)
    const voicePairs = [
      ['P', 'B'], ['T', 'D'], ['K', 'G'], 
      ['F', 'V'], ['TH', 'DH'], ['S', 'Z'],
      ['SH', 'ZH'], ['CH', 'JH']
    ];

    for (const [voiceless, voiced] of voicePairs) {
      if ((c1 === voiceless && c2 === voiced) || (c1 === voiced && c2 === voiceless)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Build scheme annotation in format: X–A²B¹
   */
  private buildSchemeAnnotation(syllableCount: number, familyCounts: Map<string, number>): string {
    let scheme = `${syllableCount}–`;

    // Sort families by letter for consistent output
    const sortedFamilies = Array.from(familyCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [letter, count] of sortedFamilies) {
      if (count > 0) {
        scheme += `${letter}${this.toSuperscript(count)}`;
      }
    }

    return scheme;
  }

  private buildSyllableBreakdown(syllables: PhoneticSyllable[]): string {
    return syllables.map(syl => {
      const familyLabels = Array.from(syl.families).sort().join('');
      const superscripts = familyLabels ? this.toSuperscriptLetters(familyLabels) : '';
      return `${syl.text}${superscripts}`;
    }).join(' ');
  }

  private toSuperscript(num: number): string {
    const superscriptMap: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return num.toString().split('').map(d => superscriptMap[d] || d).join('');
  }

  private toSuperscriptLetters(letters: string): string {
    const superscriptMap: Record<string, string> = {
      'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ', 'F': 'ᶠ', 'G': 'ᴳ', 'H': 'ᴴ',
      'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ',
      'Q': 'Q', 'R': 'ᴿ', 'S': 'ˢ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'X': 'ˣ',
      'Y': 'ʸ', 'Z': 'ᶻ'
    };
    return letters.split('').map(l => superscriptMap[l] || l).join('');
  }

  // Helper methods
  private preprocessLyrics(lyrics: string): string[] {
    return lyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private tokenize(line: string): string[] {
    return line
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Public tokenize method for external use - renamed to avoid recursion
   */
  public tokenizeExternal(line: string): string[] {
    return this.tokenize(line);
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  /**
   * Creates an empty result object for error cases.
   */
  private createEmptyResult(): RhymeSchemeResult {
    return {
      lines: [],
      families: new Map(),
      overallScheme: [],
      rhymeDensity: 0,
      perfectRhymes: 0,
      slantRhymes: 0
    };
  }


  /**
   * Get enhanced rhyme analysis for scoring
   */
  getEnhancedRhymeAnalysis(lyrics: string): {
    totalRhymes: number;
    internalRhymes: number;
    perfectRhymes: number;
    slantRhymes: number;
    rhymeDensity: number;
    complexityScore: number;
  } {
    const analysis = this.analyzeRhymeScheme(lyrics);

    const totalRhymes = Array.from(analysis.families.values())
      .reduce((sum, family) => sum + family.occurrences, 0);

    const internalRhymes = analysis.lines.reduce((sum, line) => {
      return sum + Array.from(line.familyCounts.values()).reduce((a, b) => a + b, 0);
    }, 0);

    // Complexity based on family diversity and internal rhyme patterns
    const familyDiversity = analysis.families.size;
    const avgRhymesPerLine = analysis.lines.length > 0 ? internalRhymes / analysis.lines.length : 0;
    const complexityScore = (familyDiversity * 10) + (avgRhymesPerLine * 20) + (analysis.perfectRhymes * 5);

    return {
      totalRhymes,
      internalRhymes,
      perfectRhymes: analysis.perfectRhymes,
      slantRhymes: analysis.slantRhymes,
      rhymeDensity: analysis.rhymeDensity,
      complexityScore: Math.min(100, complexityScore) // Cap at 100
    };
  }
}