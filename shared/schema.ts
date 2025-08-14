import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Define RoundScores interface first
export interface RoundScores {
  userScore: number;
  aiScore: number;
  rhymeDensity: number;
  flowQuality: number;
  creativity: number;
  totalScore: number;
}

// Battles table with user authentication
export const battles = pgTable("battles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  userScore: integer("user_score").notNull().default(0),
  aiScore: integer("ai_score").notNull().default(0),
  difficulty: text("difficulty").notNull().default("normal"),
  profanityFilter: boolean("profanity_filter").notNull().default(false),
  aiCharacterId: text("ai_character_id"),
  aiCharacterName: text("ai_character_name"),
  aiVoiceId: text("ai_voice_id"),
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
  status: text("status").notNull().default("active"),
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

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication and subscriptions
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, cancelled, past_due
  subscriptionTier: varchar("subscription_tier").default("free"), // free, premium, pro
  battlesRemaining: integer("battles_remaining").default(3), // Daily free battles
  lastBattleReset: timestamp("last_battle_reset").defaultNow(),
  totalBattles: integer("total_battles").default(0),
  totalWins: integer("total_wins").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Relations
export const userRelations = relations(users, ({ many }) => ({
  battles: many(battles),
}));

export const battleRelations = relations(battles, ({ one }) => ({
  user: one(users, { fields: [battles.userId], references: [users.id] }),
}));

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Subscription tiers and pricing
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    battlesPerDay: 3,
    features: ["3 battles per day", "Basic AI opponents", "Standard voices"]
  },
  premium: {
    name: "Premium",
    price: 9.99,
    battlesPerDay: 25,
    features: ["25 battles per day", "Advanced AI opponents", "Premium voices", "Battle analysis", "No ads"]
  },
  pro: {
    name: "Pro",
    price: 19.99,
    battlesPerDay: -1, // unlimited
    features: ["Unlimited battles", "All AI opponents", "Custom voices", "Advanced analytics", "Priority support", "Tournament mode"]
  }
} as const;
