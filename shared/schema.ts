import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define RoundScores interface first
export interface RoundScores {
  userScore: number;
  aiScore: number;
  rhymeDensity: number;
  flowQuality: number;
  creativity: number;
  totalScore: number;
}

export const battles = pgTable("battles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userScore: integer("user_score").notNull().default(0),
  aiScore: integer("ai_score").notNull().default(0),
  difficulty: text("difficulty").notNull().default("normal"), // easy, normal, hard
  profanityFilter: boolean("profanity_filter").notNull().default(true),
  rounds: jsonb("rounds").$type<Array<{
    id: string;
    battleId: string;
    roundNumber: number;
    userVerse: string | null;
    aiVerse: string;
    userAudioUrl: string | null;
    aiAudioUrl: string | null;
    scores: RoundScores;
    createdAt: Date;
  }>>().notNull().default([]),
  status: text("status").notNull().default("active"), // active, completed, abandoned
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const battleRounds = pgTable("battle_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  battleId: varchar("battle_id").references(() => battles.id).notNull(),
  roundNumber: integer("round_number").notNull(),
  userVerse: text("user_verse"),
  aiVerse: text("ai_verse").notNull(),
  userAudioUrl: text("user_audio_url"),
  aiAudioUrl: text("ai_audio_url"),
  scores: jsonb("scores").$type<RoundScores>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBattleSchema = createInsertSchema(battles).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertBattleRoundSchema = createInsertSchema(battleRounds).omit({
  id: true,
  createdAt: true,
});

export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battles.$inferSelect;
export type InsertBattleRound = z.infer<typeof insertBattleRoundSchema>;
export type BattleRound = typeof battleRounds.$inferSelect;

export interface BattleState {
  id: string;
  currentRound: number;
  maxRounds: number;
  isRecording: boolean;
  isAIResponding: boolean;
  isPlayingAudio: boolean;
  userScore: number;
  aiScore: number;
  difficulty: "easy" | "normal" | "hard";
  profanityFilter: boolean;
  timeRemaining: number;
}

export interface AudioRecording {
  blob: Blob;
  duration: number;
  transcript?: string;
}

export interface GroqTranscriptionResponse {
  text: string;
}

export interface GroqResponseData {
  id: string;
  object: string;
  status: string;
  output: Array<{
    type: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export interface TypecastTTSResponse {
  audioUrl: string;
  duration: number;
}
