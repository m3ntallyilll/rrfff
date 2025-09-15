/**
 * Comprehensive Rhyme Family Tracking across entire battles
 * This module tracks rhyme families across battle rounds for advanced progression scoring
 */

import { RhymeFamily, RhymeSchemeResult } from './phoneticRhymeAnalyzer';

export interface BattleRhymeFamilyAnalysis {
  familyCount: number;
  familyEvolution: string[];
  rounds: number;
  complexity: number;
  familyProgression: { [familyLetter: string]: number[] }; // rounds where each family appeared
  diversityScore: number;
  evolutionComplexity: number;
}

export class ComprehensiveRhymeFamilyTracker {
  private battleRhymeFamilies = new Map<string, Map<string, RhymeFamily>>();
  private battleProgression = new Map<string, { rounds: number; familyEvolution: string[]; roundScores: number[] }>();
  
  /**
   * Track rhyme families for a battle round
   */
  trackBattleRhymeFamilies(battleId: string, rhymeResult: RhymeSchemeResult, isFinalScore: boolean = false): void {
    // Initialize battle tracking if not exists
    if (!this.battleRhymeFamilies.has(battleId)) {
      this.battleRhymeFamilies.set(battleId, new Map());
      this.battleProgression.set(battleId, { rounds: 0, familyEvolution: [], roundScores: [] });
    }

    const battleFamilies = this.battleRhymeFamilies.get(battleId)!;
    const progression = this.battleProgression.get(battleId)!;

    // Track family evolution across rounds
    rhymeResult.families.forEach((family, letter) => {
      if (battleFamilies.has(letter)) {
        // Existing family - track evolution
        const existingFamily = battleFamilies.get(letter)!;
        existingFamily.occurrences += family.occurrences;
        existingFamily.lines.push(...family.lines.map(line => line + progression.rounds * 1000)); // Offset by rounds
      } else {
        // New family - track emergence
        battleFamilies.set(letter, {
          ...family,
          lines: family.lines.map(line => line + progression.rounds * 1000)
        });
      }
    });

    // Calculate round complexity score
    const roundComplexity = rhymeResult.perfectRhymes * 3 + rhymeResult.slantRhymes * 2 + 
                           rhymeResult.families.size * 5 + Math.floor(rhymeResult.rhymeDensity * 10);

    // Track progression for sophisticated analysis
    progression.rounds++;
    progression.roundScores.push(roundComplexity);
    const familySnapshot = Array.from(battleFamilies.keys()).sort().join('');
    progression.familyEvolution.push(familySnapshot);

    if (isFinalScore) {
      console.log(`🎯 Battle ${battleId.substring(0, 8)} family tracking: ${battleFamilies.size} families across ${progression.rounds} rounds`);
      console.log(`🎯 Family evolution: ${progression.familyEvolution.join(' → ')}`);
      console.log(`🎯 Round complexity scores: ${progression.roundScores.join(', ')}`);
    }

    // Clean old battle data (keep last 10 battles)
    if (this.battleRhymeFamilies.size > 10) {
      const oldestBattleId = this.battleRhymeFamilies.keys().next().value;
      this.battleRhymeFamilies.delete(oldestBattleId);
      this.battleProgression.delete(oldestBattleId);
    }
  }

  /**
   * Get comprehensive battle rhyme family analysis
   */
  getBattleRhymeFamilyAnalysis(battleId: string): BattleRhymeFamilyAnalysis {
    const families = this.battleRhymeFamilies.get(battleId);
    const progression = this.battleProgression.get(battleId);

    if (!families || !progression) {
      return { 
        familyCount: 0, 
        familyEvolution: [], 
        rounds: 0, 
        complexity: 0,
        familyProgression: {},
        diversityScore: 0,
        evolutionComplexity: 0
      };
    }

    // Calculate family progression analysis
    const familyProgression: { [familyLetter: string]: number[] } = {};
    families.forEach((family, letter) => {
      familyProgression[letter] = family.lines.map(line => Math.floor(line / 1000));
    });

    // Calculate diversity score (how diverse the rhyme families are)
    const uniqueEvolutionSteps = new Set(progression.familyEvolution).size;
    const diversityScore = Math.min(100, (uniqueEvolutionSteps / Math.max(1, progression.rounds)) * 100);

    // Calculate evolution complexity (how the families evolved over time)
    let evolutionComplexity = 0;
    for (let i = 1; i < progression.familyEvolution.length; i++) {
      const prev = new Set(progression.familyEvolution[i-1]);
      const curr = new Set(progression.familyEvolution[i]);
      
      // Add points for new families, maintaining families, and complexity
      const newFamilies = curr.size - prev.size;
      const maintainedFamilies = Array.from(curr).filter(f => prev.has(f)).length;
      
      evolutionComplexity += Math.max(0, newFamilies) * 3 + maintainedFamilies * 1;
    }

    // Overall complexity based on all factors
    const overallComplexity = Math.min(100, 
      (families.size * 8) + 
      (uniqueEvolutionSteps * 4) + 
      (progression.rounds * 2) +
      (evolutionComplexity * 0.5) +
      (progression.roundScores.reduce((a, b) => a + b, 0) * 0.1)
    );

    return {
      familyCount: families.size,
      familyEvolution: progression.familyEvolution,
      rounds: progression.rounds,
      complexity: overallComplexity,
      familyProgression,
      diversityScore,
      evolutionComplexity
    };
  }

  /**
   * Get battle progression insights for display
   */
  getBattleProgressionInsights(battleId: string): string[] {
    const analysis = this.getBattleRhymeFamilyAnalysis(battleId);
    const insights: string[] = [];

    if (analysis.rounds === 0) {
      return ['No battle data available'];
    }

    // Family count insights
    if (analysis.familyCount >= 8) {
      insights.push(`🎯 Exceptional rhyme diversity with ${analysis.familyCount} families`);
    } else if (analysis.familyCount >= 5) {
      insights.push(`📈 Good rhyme variety with ${analysis.familyCount} families`);
    } else if (analysis.familyCount >= 3) {
      insights.push(`⚡ Moderate rhyme families (${analysis.familyCount})`);
    } else {
      insights.push(`📝 Limited rhyme variety (${analysis.familyCount} families)`);
    }

    // Evolution insights
    if (analysis.evolutionComplexity > 50) {
      insights.push(`🌟 Advanced rhyme evolution - families developed sophisticated patterns`);
    } else if (analysis.evolutionComplexity > 25) {
      insights.push(`📊 Solid rhyme progression across rounds`);
    } else if (analysis.evolutionComplexity > 10) {
      insights.push(`🎵 Basic rhyme development`);
    }

    // Diversity insights
    if (analysis.diversityScore > 80) {
      insights.push(`🏆 Masterful rhyme diversity - each round brought unique patterns`);
    } else if (analysis.diversityScore > 60) {
      insights.push(`💪 Strong diversity in rhyme schemes`);
    } else if (analysis.diversityScore > 40) {
      insights.push(`📈 Decent variety in rhyming approach`);
    } else {
      insights.push(`🔄 Repetitive rhyme patterns - try more diverse schemes`);
    }

    // Overall complexity insights
    if (analysis.complexity > 80) {
      insights.push(`🔥 Elite-level rhyme complexity - professional battle tier`);
    } else if (analysis.complexity > 60) {
      insights.push(`🎪 Advanced rhyme construction`);
    } else if (analysis.complexity > 40) {
      insights.push(`📚 Solid rhyming fundamentals`);
    } else {
      insights.push(`📝 Basic rhyme structure - focus on complexity`);
    }

    return insights;
  }

  /**
   * Clear battle data (for memory management)
   */
  clearBattleData(battleId: string): void {
    this.battleRhymeFamilies.delete(battleId);
    this.battleProgression.delete(battleId);
  }
}

export const comprehensiveRhymeFamilyTracker = new ComprehensiveRhymeFamilyTracker();