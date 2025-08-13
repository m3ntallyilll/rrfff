// Advanced Rhyme Engine for Internal Rhyming, Rhyme Stacking, and Rhyme Juggling
export class AdvancedRhymeEngine {
  
  // Internal rhyming patterns - rhymes within single lines
  private internalRhymePatterns = [
    "I {verb1} {noun1}, {verb2} {noun2}, while you {verb3} {noun3}",
    "{adj1} and {adj2}, {verb1} and {verb2}, that's how I {verb3}",
    "From {place1} to {place2}, {verb1} {noun1}, {verb2} {noun2}",
    "{verb1} quick, {verb2} slick, {verb3} thick, that's my {noun1}",
    "Can't {verb1}, won't {verb2}, don't {verb3}, I'm the {noun1}"
  ];

  // Rhyme stacking - consecutive rhyming words
  private rhymeStackPatterns = [
    "{rhyme1}-{rhyme2}-{rhyme3} attacks, {rhyme4} your {rhyme5}",
    "Back-to-back {rhyme1}, crack your {rhyme2}, leave you {rhyme3}",
    "{rhyme1} the {rhyme2}, {rhyme3} the {rhyme4}, {rhyme5} supreme",
    "Stack-pack-attack, {rhyme1}-{rhyme2}-{rhyme3}",
    "Rapid-fire {rhyme1}, {rhyme2} higher, {rhyme3} supplier"
  ];

  // Rhyme juggling - overlapping patterns across lines
  private jugglePatterns = {
    "ABAB": ["Line 1 ends {A}, line 2 ends {B}", "Line 3 ends {A}, line 4 ends {B}"],
    "ABBA": ["Line 1 ends {A}, line 2 ends {B}", "Line 3 ends {B}, line 4 ends {A}"],
    "AABA": ["Line 1 ends {A}, line 2 ends {A}", "Line 3 ends {B}, line 4 ends {A}"],
    "AAAA": ["All lines end with {A} sound variations"]
  };

  // Multi-syllabic rhyme word banks
  private multiSyllabicRhymes = {
    "ation": ["creation", "devastation", "domination", "annihilation", "demonstration"],
    "attle": ["battle", "rattle", "cattle", "prattle", "chattel"],
    "ever": ["never", "clever", "sever", "whatever", "endeavor"],
    "icious": ["vicious", "malicious", "suspicious", "ambitious", "nutritious"],
    "ower": ["power", "tower", "shower", "devour", "empower"],
    "inning": ["winning", "spinning", "beginning", "grinning", "pinning"],
    "acking": ["attacking", "lacking", "packing", "tracking", "cracking"],
    "ision": ["vision", "decision", "precision", "collision", "division"]
  };

  // Consonance and assonance patterns
  private soundPatterns = {
    consonance: {
      "ck": ["back", "pack", "attack", "crack", "stack", "lack"],
      "st": ["best", "test", "rest", "chest", "quest", "nest"],
      "ng": ["bring", "sing", "ring", "sting", "wing", "thing"],
      "sh": ["flash", "clash", "bash", "cash", "dash", "slash"]
    },
    assonance: {
      "ay": ["way", "say", "day", "play", "stay", "pay"],
      "ight": ["fight", "right", "light", "might", "sight", "tight"],
      "ow": ["flow", "show", "know", "blow", "glow", "slow"],
      "ick": ["quick", "thick", "sick", "trick", "stick", "brick"]
    }
  };

  // Generate verse with internal rhymes
  generateInternalRhymeVerse(theme: string, intensity: 'medium' | 'high' = 'high'): string[] {
    const lines = [];
    const targetRhymes = intensity === 'high' ? 3 : 2;
    
    for (let i = 0; i < 4; i++) {
      const line = this.createInternalRhymeLine(theme, targetRhymes);
      lines.push(line);
    }
    
    return lines;
  }

  // Create a line with internal rhymes
  private createInternalRhymeLine(theme: string, rhymeCount: number): string {
    const rhymeSet = this.selectRhymeSet();
    const pattern = this.internalRhymePatterns[Math.floor(Math.random() * this.internalRhymePatterns.length)];
    
    // Fill pattern with rhyming words
    let line = pattern;
    for (let i = 1; i <= rhymeCount; i++) {
      const rhymeWord = rhymeSet[i % rhymeSet.length];
      line = line.replace(`{rhyme${i}}`, rhymeWord);
    }
    
    return line;
  }

  // Generate rhyme stacking sequence
  generateRhymeStack(baseWord: string): string[] {
    const baseSound = this.extractRhymeSound(baseWord);
    const rhymeFamily = (this.multiSyllabicRhymes as any)[baseSound] || 
                       (this.soundPatterns.consonance as any)[baseSound] ||
                       (this.soundPatterns.assonance as any)[baseSound] ||
                       [baseWord, "attack", "back", "crack", "pack"];
    
    return rhymeFamily.slice(0, 5);
  }

  // Generate rhyme juggling pattern
  generateRhymeJuggle(scheme: keyof typeof this.jugglePatterns): string[] {
    const pattern = this.jugglePatterns[scheme];
    const rhymeA = this.selectRhymeSet();
    const rhymeB = this.selectRhymeSet();
    
    const lines = [];
    
    if (scheme === "ABAB") {
      lines.push(`Your game is ${rhymeA[0]}, my flow's ${rhymeB[0]}`);
      lines.push(`I stay ${rhymeA[1]}, you just ${rhymeB[1]}`);
      lines.push(`Never ${rhymeA[2]}, always ${rhymeB[0]}`);
      lines.push(`I'm ${rhymeA[3]}, you ${rhymeB[1]}`);
    } else if (scheme === "AABA") {
      lines.push(`I bring the ${rhymeA[0]}, you bring the ${rhymeA[1]}`);
      lines.push(`My style's ${rhymeB[0]}, yours is ${rhymeB[1]}`);
      lines.push(`I stay ${rhymeA[2]}, you just ${rhymeA[3]}`);
    }
    
    return lines;
  }

  // Select a random rhyme set
  private selectRhymeSet(): string[] {
    const allRhymes = Object.values(this.multiSyllabicRhymes);
    return allRhymes[Math.floor(Math.random() * allRhymes.length)];
  }

  // Extract rhyme sound from word
  private extractRhymeSound(word: string): string {
    const endings = Object.keys(this.multiSyllabicRhymes);
    for (const ending of endings) {
      if (word.endsWith(ending)) {
        return ending;
      }
    }
    return word.slice(-2); // Fallback to last 2 characters
  }

  // Generate complete advanced verse with all techniques
  generateAdvancedVerse(userVerse: string, difficulty: 'normal' | 'hard'): string {
    if (difficulty !== 'hard') {
      return this.generateBasicResponse(userVerse);
    }

    const lines = [];
    
    // Line 1: Internal rhymes + opening attack
    const rhymeSet1 = this.selectRhymeSet();
    lines.push(`I ${rhymeSet1[0]} quick, ${rhymeSet1[1]} slick, ${rhymeSet1[2]} thick, that's my attack`);
    
    // Line 2: Rhyme stacking
    const stackWords = this.generateRhymeStack("back");
    lines.push(`${stackWords[0]}-to-${stackWords[1]} ${stackWords[2]}, ${stackWords[3]} your ${stackWords[4]}`);
    
    // Line 3: Complex internal + juggling setup
    const rhymeSet2 = this.selectRhymeSet();
    lines.push(`Your ${rhymeSet2[0]} can't ${rhymeSet2[1]}, I ${rhymeSet2[2]} and ${rhymeSet2[3]}`);
    
    // Line 4: Closing with maximum technique density
    const finalRhymes = this.selectRhymeSet();
    lines.push(`${finalRhymes[0]} supreme, ${finalRhymes[1]} your dream, I'm the ${finalRhymes[2]} machine`);
    
    return lines.join('\n');
  }

  private generateBasicResponse(userVerse: string): string {
    const responses = [
      "Your bars are weak, my flow's unique, technique so sleek, you're antique",
      "I bring the heat, you face defeat, my rhymes complete, yours obsolete",
      "Step to me wrong, I'll prove you're weak, flow so strong, technique so sleek",
      "Your style's played out, mine's fresh and new, no doubt about it, I'm schooling you"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Analyze if verse contains advanced techniques
  analyzeAdvancedTechniques(verse: string): {
    hasInternalRhymes: boolean;
    hasRhymeStacking: boolean;
    hasRhymeJuggling: boolean;
    technicalComplexity: number;
  } {
    const words = verse.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const lines = verse.split('\n');
    
    const hasInternalRhymes = this.detectInternalRhymes(lines);
    const hasRhymeStacking = this.detectRhymeStacking(words);
    const hasRhymeJuggling = this.detectRhymeJuggling(lines);
    
    const complexityScore = (
      (hasInternalRhymes ? 30 : 0) +
      (hasRhymeStacking ? 25 : 0) +
      (hasRhymeJuggling ? 20 : 0) +
      (this.countMultiSyllabicRhymes(words) * 5)
    );
    
    return {
      hasInternalRhymes,
      hasRhymeStacking,
      hasRhymeJuggling,
      technicalComplexity: Math.min(100, complexityScore)
    };
  }

  private detectInternalRhymes(lines: string[]): boolean {
    for (const line of lines) {
      const words = line.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      const rhymeCount = this.countRhymesInLine(words);
      if (rhymeCount >= 2) return true;
    }
    return false;
  }

  private detectRhymeStacking(words: string[]): boolean {
    for (let i = 0; i < words.length - 2; i++) {
      if (this.wordsRhyme(words[i], words[i + 1]) && 
          this.wordsRhyme(words[i + 1], words[i + 2])) {
        return true;
      }
    }
    return false;
  }

  private detectRhymeJuggling(lines: string[]): boolean {
    if (lines.length < 4) return false;
    
    const endings = lines.map(line => 
      line.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).pop() || ''
    );
    
    // Check for ABAB or ABBA patterns
    return (this.wordsRhyme(endings[0], endings[2]) && this.wordsRhyme(endings[1], endings[3])) ||
           (this.wordsRhyme(endings[0], endings[3]) && this.wordsRhyme(endings[1], endings[2]));
  }

  private countRhymesInLine(words: string[]): number {
    let rhymeCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        if (this.wordsRhyme(words[i], words[j])) {
          rhymeCount++;
        }
      }
    }
    return rhymeCount;
  }

  private countMultiSyllabicRhymes(words: string[]): number {
    let count = 0;
    for (const word of words) {
      if (word.length > 4) {
        for (const ending of Object.keys(this.multiSyllabicRhymes)) {
          if (word.endsWith(ending)) {
            count++;
            break;
          }
        }
      }
    }
    return count;
  }

  private wordsRhyme(word1: string, word2: string): boolean {
    if (word1.length < 2 || word2.length < 2) return false;
    
    // Check perfect rhyme (last 2+ characters)
    if (word1.slice(-2) === word2.slice(-2)) return true;
    if (word1.slice(-3) === word2.slice(-3)) return true;
    
    // Check assonance (vowel sounds)
    const vowels1 = word1.match(/[aeiou]/g)?.join('') || '';
    const vowels2 = word2.match(/[aeiou]/g)?.join('') || '';
    if (vowels1 === vowels2 && vowels1.length > 0) return true;
    
    return false;
  }
}