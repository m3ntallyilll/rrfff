import { type Battle, type BattleRound, type InsertBattle, type InsertBattleRound, type BattleState } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Battle operations
  createBattle(battle: InsertBattle): Promise<Battle>;
  getBattle(id: string): Promise<Battle | undefined>;
  updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined>;
  getAllBattles(): Promise<Battle[]>;
  
  // Battle round operations
  createBattleRound(round: InsertBattleRound): Promise<BattleRound>;
  getBattleRounds(battleId: string): Promise<BattleRound[]>;
  
  // Battle state management
  getBattleState(battleId: string): Promise<BattleState | undefined>;
  updateBattleState(battleId: string, state: Partial<BattleState>): Promise<BattleState | undefined>;
}

export class MemStorage implements IStorage {
  private battles: Map<string, Battle>;
  private battleRounds: Map<string, BattleRound>;
  private battleStates: Map<string, BattleState>;

  constructor() {
    this.battles = new Map();
    this.battleRounds = new Map();
    this.battleStates = new Map();
  }

  async createBattle(insertBattle: InsertBattle): Promise<Battle> {
    const id = randomUUID();
    
    // Select random AI character if not specified
    const selectedCharacter = (insertBattle as any).aiCharacterId 
      ? (await import("@shared/characters")).BATTLE_CHARACTERS.find(c => c.id === (insertBattle as any).aiCharacterId)
      : (await import("@shared/characters")).getRandomCharacter();
    
    const battle: Battle = {
      id,
      userScore: insertBattle.userScore ?? 0,
      aiScore: insertBattle.aiScore ?? 0,
      difficulty: insertBattle.difficulty ?? "normal",
      profanityFilter: insertBattle.profanityFilter ?? true,
      aiCharacterId: selectedCharacter?.id || null,
      aiCharacterName: selectedCharacter?.name || null,
      aiVoiceId: selectedCharacter?.voiceId || "tc_67d237f1782cabcc6155272f",
      rounds: [],
      status: insertBattle.status ?? "active",
      createdAt: new Date(),
      completedAt: null,
    };
    this.battles.set(id, battle);

    // Initialize battle state
    const battleState: BattleState = {
      id,
      currentRound: 1,
      maxRounds: 3,
      isRecording: false,
      isAIResponding: false,
      isPlayingAudio: false,
      userScore: battle.userScore,
      aiScore: battle.aiScore,
      difficulty: battle.difficulty as "easy" | "normal" | "hard",
      profanityFilter: battle.profanityFilter,
      timeRemaining: 120, // 2 minutes per battle
    };
    this.battleStates.set(id, battleState);

    return battle;
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    return this.battles.get(id);
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined> {
    const battle = this.battles.get(id);
    if (!battle) return undefined;

    const updatedBattle = { ...battle, ...updates };
    this.battles.set(id, updatedBattle);
    return updatedBattle;
  }

  async getAllBattles(): Promise<Battle[]> {
    return Array.from(this.battles.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createBattleRound(insertRound: InsertBattleRound): Promise<BattleRound> {
    const id = randomUUID();
    const round: BattleRound = {
      id,
      battleId: insertRound.battleId,
      roundNumber: insertRound.roundNumber,
      userVerse: insertRound.userVerse ?? null,
      aiVerse: insertRound.aiVerse,
      userAudioUrl: insertRound.userAudioUrl ?? null,
      aiAudioUrl: insertRound.aiAudioUrl ?? null,
      scores: insertRound.scores,
      createdAt: new Date(),
    };
    this.battleRounds.set(id, round);
    return round;
  }

  async getBattleRounds(battleId: string): Promise<BattleRound[]> {
    return Array.from(this.battleRounds.values())
      .filter(round => round.battleId === battleId)
      .sort((a, b) => a.roundNumber - b.roundNumber);
  }

  async getBattleState(battleId: string): Promise<BattleState | undefined> {
    return this.battleStates.get(battleId);
  }

  async updateBattleState(battleId: string, state: Partial<BattleState>): Promise<BattleState | undefined> {
    const currentState = this.battleStates.get(battleId);
    if (!currentState) return undefined;

    const updatedState = { ...currentState, ...state };
    this.battleStates.set(battleId, updatedState);
    return updatedState;
  }
}

export const storage = new MemStorage();
