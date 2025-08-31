import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real, decimal, index } from "drizzle-orm/pg-core";
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
  lyricComplexity: integer("lyric_complexity").default(50), // 0-100 complexity level
  styleIntensity: integer("style_intensity").default(50), // 0-100 style intensity level
  voiceSpeed: real("voice_speed").default(1.0), // 0.5-2.0 voice speed multiplier
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
  userBattleMap: text("user_battle_map"), // Professional battle rap mapping for display
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
  storeCredit: decimal("store_credit", { precision: 10, scale: 2 }).notNull().default("0.00"), // Store credit balance
  referralCode: varchar("referral_code"), // User's unique referral code
  referredBy: varchar("referred_by"), // Who referred this user
  totalBattles: integer("total_battles").default(0),
  totalWins: integer("total_wins").default(0),
  // User-managed API keys for enhanced TTS services
  openaiApiKey: varchar("openai_api_key"), // User's encrypted OpenAI API key
  groqApiKey: varchar("groq_api_key"), // User's encrypted Groq API key  
  preferredTtsService: varchar("preferred_tts_service").default("system"), // "openai", "groq", "system"
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

// Tournament system
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("single_elimination"), // single_elimination, double_elimination
  status: varchar("status").notNull().default("active"), // active, completed, abandoned
  currentRound: integer("current_round").notNull().default(1),
  totalRounds: integer("total_rounds").notNull(),
  difficulty: varchar("difficulty").notNull().default("normal"),
  profanityFilter: boolean("profanity_filter").notNull().default(false),
  lyricComplexity: integer("lyric_complexity").default(50),
  styleIntensity: integer("style_intensity").default(50),
  prize: varchar("prize"), // What player gets for winning
  opponents: jsonb("opponents").$type<string[]>().notNull().default([]), // Array of character IDs
  bracket: jsonb("bracket").$type<TournamentBracket>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const tournamentBattles = pgTable("tournament_battles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  battleId: varchar("battle_id").references(() => battles.id).notNull(),
  round: integer("round").notNull(),
  position: integer("position").notNull(), // Position in the bracket
  isCompleted: boolean("is_completed").notNull().default(false),
  winnerId: varchar("winner_id"), // user ID or character ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Referral system table
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").references(() => users.id).notNull(), // User who made the referral
  refereeId: varchar("referee_id").references(() => users.id), // User who was referred
  referralCode: varchar("referral_code").notNull(), // The referral code used
  status: varchar("status").notNull().default("pending"), // pending, completed, rewarded
  creditAwarded: decimal("credit_awarded", { precision: 10, scale: 2 }).default("0.00"), // Amount of credit given
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"), // When the referral was completed
});

export interface TournamentBracket {
  rounds: TournamentRound[];
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  winner?: TournamentPlayer;
  battleId?: string;
  isCompleted: boolean;
}

export interface TournamentPlayer {
  id: string;
  name: string;
  type: 'user' | 'ai';
  avatar?: string;
}

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  bracket: z.object({
    rounds: z.array(z.object({
      roundNumber: z.number(),
      matches: z.array(z.object({
        id: z.string(),
        player1: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['user', 'ai']),
          avatar: z.string().optional()
        }),
        player2: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['user', 'ai']),
          avatar: z.string().optional()
        }),
        winner: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['user', 'ai']),
          avatar: z.string().optional()
        }).optional(),
        battleId: z.string().optional(),
        isCompleted: z.boolean()
      }))
    }))
  })
});

export const insertTournamentBattleSchema = createInsertSchema(tournamentBattles).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournamentBattle = z.infer<typeof insertTournamentBattleSchema>;
export type TournamentBattle = typeof tournamentBattles.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

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
