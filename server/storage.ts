import {
  users,
  battles,
  type User,
  type UpsertUser,
  type Battle,
  type InsertBattle,
  type RoundScores,
  SUBSCRIPTION_TIERS,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Subscription management
  updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
    battlesRemaining?: number;
  }): Promise<User>;
  
  // Battle management with user tracking
  canUserStartBattle(userId: string): Promise<boolean>;
  createBattle(battle: any): Promise<Battle>;
  getBattle(id: string): Promise<Battle | undefined>;
  getUserBattles(userId: string, limit?: number): Promise<Battle[]>;
  updateBattleScore(battleId: string, userScore: number, aiScore: number): Promise<void>;
  completeBattle(battleId: string): Promise<void>;
  updateUserStripeInfo(userId: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User>;
  
  // Battle analytics
  getUserStats(userId: string): Promise<{
    totalBattles: number;
    totalWins: number;
    winRate: number;
    battlesThisMonth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        // Ensure defaults for new users
        subscriptionTier: userData.subscriptionTier || "free",
        subscriptionStatus: userData.subscriptionStatus || "free",
        battlesRemaining: userData.battlesRemaining !== undefined ? userData.battlesRemaining : 3,
        lastBattleReset: userData.lastBattleReset || new Date(),
        totalBattles: userData.totalBattles || 0,
        totalWins: userData.totalWins || 0,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          // Only update user profile info, preserve subscription data
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
          // Set defaults only if fields are null/undefined
          subscriptionTier: sql`COALESCE(${users.subscriptionTier}, ${userData.subscriptionTier || "free"})`,
          subscriptionStatus: sql`COALESCE(${users.subscriptionStatus}, ${userData.subscriptionStatus || "free"})`,
          battlesRemaining: sql`COALESCE(${users.battlesRemaining}, ${userData.battlesRemaining !== undefined ? userData.battlesRemaining : 3})`,
          lastBattleReset: sql`COALESCE(${users.lastBattleReset}, ${userData.lastBattleReset || new Date()})`,
        },
      })
      .returning();
    return user;
  }

  // Subscription management
  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Battle management
  async canUserStartBattle(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Pro users have unlimited battles - always allow
    if (user.subscriptionTier === "pro") return true;

    // Check if daily battles need reset
    const now = new Date();
    const lastReset = user.lastBattleReset || new Date(0);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceReset > 0) {
      // Reset daily battles
      const tier = SUBSCRIPTION_TIERS[user.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];
      await db
        .update(users)
        .set({
          battlesRemaining: tier.battlesPerDay,
          lastBattleReset: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
      return tier.battlesPerDay > 0;
    }

    return (user.battlesRemaining || 0) > 0;
  }

  async createBattle(battleData: any): Promise<Battle> {
    // First ensure user has battles available and decrement
    const user = await this.getUser(battleData.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check and reset daily battles if needed
    await this.canUserStartBattle(battleData.userId);
    
    // Decrement user's daily battles (except for Pro users)
    if (user.subscriptionTier !== "pro") {
      const updatedUser = await this.getUser(battleData.userId); // Get fresh user data after potential reset
      if ((updatedUser?.battlesRemaining || 0) <= 0) {
        throw new Error("No battles remaining");
      }
      
      await db
        .update(users)
        .set({
          battlesRemaining: Math.max(0, (updatedUser?.battlesRemaining || 0) - 1),
          totalBattles: (updatedUser?.totalBattles || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, battleData.userId));
    } else {
      // Pro users - just increment total battles
      await db
        .update(users)
        .set({
          totalBattles: (user.totalBattles || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, battleData.userId));
    }

    const [battle] = await db
      .insert(battles)
      .values(battleData)
      .returning();
    return battle;
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    const [battle] = await db.select().from(battles).where(eq(battles.id, id));
    return battle;
  }

  async getUserBattles(userId: string, limit = 10): Promise<Battle[]> {
    return await db
      .select()
      .from(battles)
      .where(eq(battles.userId, userId))
      .orderBy(battles.createdAt)
      .limit(limit);
  }

  async updateBattleScore(battleId: string, userScore: number, aiScore: number): Promise<void> {
    await db
      .update(battles)
      .set({ userScore, aiScore })
      .where(eq(battles.id, battleId));
  }

  async updateUserStripeInfo(userId: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async completeBattle(battleId: string): Promise<void> {
    const battle = await this.getBattle(battleId);
    if (!battle) return;

    await db
      .update(battles)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(battles.id, battleId));

    // Update user win count if they won
    if (battle.userScore > battle.aiScore && battle.userId) {
      const user = await this.getUser(battle.userId);
      if (user) {
        await db
          .update(users)
          .set({
            totalWins: (user.totalWins || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(users.id, battle.userId));
      }
    }
  }

  // Analytics
  async getUserStats(userId: string): Promise<{
    totalBattles: number;
    totalWins: number;
    winRate: number;
    battlesThisMonth: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { totalBattles: 0, totalWins: 0, winRate: 0, battlesThisMonth: 0 };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const userBattles = await db
      .select()
      .from(battles)
      .where(
        and(
          eq(battles.userId, userId),
          gte(battles.createdAt, monthStart)
        )
      );

    return {
      totalBattles: user.totalBattles || 0,
      totalWins: user.totalWins || 0,
      winRate: user.totalBattles ? ((user.totalWins || 0) / user.totalBattles) * 100 : 0,
      battlesThisMonth: userBattles.length,
    };
  }
}

export const storage = new DatabaseStorage();