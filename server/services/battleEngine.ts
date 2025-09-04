import { groqService, GroqService } from './groq';
import { typecastService } from './typecast';
import { scoringService, ScoringService } from './scoring';
import { LyricAnalysisService } from './lyricAnalysis';
import { PerformanceOptimizer } from './performanceOptimizer';
import { userTTSManager } from './user-tts-manager';

export interface BattleContext {
  difficulty: 'easy' | 'normal' | 'hard';
  profanityFilter: boolean;
  character: {
    id: string;
    name: string;
    personality: string;
    voiceId: string;
  };
  battleHistory: string[];
  currentRound: number;
}

export interface BattleResponse {
  verse: string;
  audioUrl?: string;
  analysis: any;
  context: {
    responseTime: number;
    confidence: number;
    techniques: string[];
  };
}

export class BattleEngine {
  private groqService: GroqService;
  private typecastService: any; // Keep for compatibility but won't use
  private scoringService: ScoringService;
  private lyricAnalysisService: LyricAnalysisService;
  private performanceOptimizer: PerformanceOptimizer;

  constructor() {
    this.groqService = groqService;
    this.typecastService = typecastService;
    this.scoringService = scoringService;
    this.lyricAnalysisService = new LyricAnalysisService();
    this.performanceOptimizer = new PerformanceOptimizer();
  }

  async processBattleRound(
    userVerse: string,
    context: BattleContext
  ): Promise<BattleResponse> {
    const startTime = Date.now();

    try {
      // Generate AI response with enhanced context
      const aiVerse = await this.generateContextualResponse(userVerse, context);
      
      // Generate audio if needed
      let audioUrl: string | undefined;
      try {
        const audioBuffer = await this.typecastService.generateSpeech(
          aiVerse,
          context.character.voiceId
        );
        
        if (audioBuffer && audioBuffer.length > 0) {
          // Save audio to temp file for serving
          const audioPath = `temp_ai_audio_${Date.now()}.wav`;
          require('fs').writeFileSync(audioPath, audioBuffer);
          audioUrl = `/${audioPath}`;
        }
      } catch (audioError) {
        console.error('Audio generation failed:', audioError);
        // Continue without audio
      }

      // Analyze the AI response
      const analysis = await this.lyricAnalysisService.analyzeVerse(aiVerse);
      
      const responseTime = Date.now() - startTime;
      
      return {
        verse: aiVerse,
        audioUrl,
        analysis,
        context: {
          responseTime,
          confidence: this.calculateConfidence(analysis),
          techniques: this.extractTechniques(aiVerse, context.difficulty)
        }
      };
      
    } catch (error) {
      throw new Error(`Battle engine failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateContextualResponse(
    userVerse: string,
    context: BattleContext
  ): Promise<string> {
    // Check cache first
    const cacheKey = `battle:${Buffer.from(userVerse + context.difficulty + context.character.id).toString('base64').slice(0, 32)}`;
    const cached = this.performanceOptimizer.getCachedAnalysis(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Generate response using enhanced prompting
    const response = await this.groqService.generateRapResponse(
      userVerse,
      context.difficulty,
      context.profanityFilter
    );

    // Cache the response
    this.performanceOptimizer.cacheAnalysis(cacheKey, response, 10);
    
    return response;
  }

  private calculateConfidence(analysis: any): number {
    // Calculate confidence based on analysis metrics
    const baseConfidence = 70;
    const rhymeBonus = Math.min(analysis.rhymeDensity * 0.3, 20);
    const flowBonus = Math.min(analysis.flowQuality * 0.2, 15);
    const creativityBonus = Math.min(analysis.creativity * 0.2, 10);
    
    return Math.min(100, baseConfidence + rhymeBonus + flowBonus + creativityBonus);
  }

  private extractTechniques(verse: string, difficulty: string): string[] {
    const techniques: string[] = [];
    
    // Basic technique detection
    if (verse.includes(' vs ') || verse.includes(' versus ')) {
      techniques.push('Direct Confrontation');
    }
    
    if (difficulty === 'hard') {
      // Check for complex patterns
      const lines = verse.split('\n');
      if (lines.length >= 4) {
        techniques.push('Multi-line Structure');
      }
      
      // Check for internal rhymes
      if (this.hasInternalRhymes(verse)) {
        techniques.push('Internal Rhyming');
      }
      
      // Check for wordplay
      if (this.hasWordplay(verse)) {
        techniques.push('Advanced Wordplay');
      }
    }
    
    return techniques;
  }

  private hasInternalRhymes(verse: string): boolean {
    // Simple internal rhyme detection
    const words = verse.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const rhymeMap = new Map();
    
    for (const word of words) {
      if (word.length < 2) continue;
      const ending = word.slice(-2);
      if (rhymeMap.has(ending)) {
        return true;
      }
      rhymeMap.set(ending, word);
    }
    
    return false;
  }

  private hasWordplay(verse: string): boolean {
    // Simple wordplay detection based on common patterns
    const wordplayPatterns = [
      /\b\w+ing\b.*\b\w+ring\b/, // -ing/-ring patterns
      /\b\w+tion\b.*\b\w+tion\b/, // -tion patterns
      /\b\w+ly\b.*\b\w+ly\b/, // -ly patterns
    ];
    
    return wordplayPatterns.some(pattern => pattern.test(verse.toLowerCase()));
  }
}