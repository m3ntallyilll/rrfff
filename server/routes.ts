import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SUBSCRIPTION_TIERS, insertTournamentSchema } from "@shared/schema";
import { groqService } from "./services/groq";
import { typecastService } from "./services/typecast";
import { barkTTS } from "./services/bark";
import { scoringService } from "./services/scoring";
import { userTTSManager } from "./services/user-tts-manager";
import multer from "multer";
import path from "path";
import fs from "fs";
import { battleRateLimit, authRateLimit, paymentRateLimit } from "./middleware/security";
import { validateBattleCreation, validatePayment, validateAPIKeys, validateAudioUpload } from "./middleware/validation";
import { trackBattleCreated, trackBattleCompleted, trackPaymentAttempt, trackPaymentCompleted, trackUserSignup, trackUserLogin } from "./middleware/analytics";
import { catchAsync } from "./middleware/error-handler";

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // SEO and Social Sharing Routes
  app.get('/sitemap.xml', (req, res) => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://battlerapai.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://battlerapai.com/subscribe</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://battlerapai.com/tournaments</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  app.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /
Allow: /subscribe
Allow: /tournaments

Disallow: /api/
Disallow: /admin
Disallow: /settings
Disallow: /battle

Sitemap: https://battlerapai.com/sitemap.xml`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(robots);
  });

  // Auth routes with rate limiting
  app.get('/api/auth/user', authRateLimit, isAuthenticated, trackUserLogin, catchAsync(async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }));

  // Subscription management routes
  app.get('/api/subscription/tiers', (req, res) => {
    res.json(SUBSCRIPTION_TIERS);
  });

  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const canBattle = await storage.canUserStartBattle(userId);
      
      res.json({
        tier: user?.subscriptionTier || 'free',
        status: user?.subscriptionStatus || 'free',
        battlesRemaining: user?.battlesRemaining || 0,
        canStartBattle: canBattle,
        totalBattles: user?.totalBattles || 0,
        totalWins: user?.totalWins || 0,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // One-time battle purchase
  app.post('/api/purchase-battles', paymentRateLimit, isAuthenticated, validatePayment, trackPaymentAttempt, catchAsync(async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { battleCount = 10, paymentMethod = 'stripe' } = req.body; // Default 10 battles for $1
      
      if (battleCount !== 10) {
        return res.status(400).json({ message: 'Only 10-battle packages available' });
      }

      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.email) {
        throw new Error('No user email on file');
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        });
        
        user = await storage.updateUserStripeInfo(userId, { 
          stripeCustomerId: customer.id 
        });
      }

      console.log(`💰 Creating battle purchase: 10 battles for $1.00`);
      
      // Configure payment method types
      const paymentMethodTypes: ('card' | 'cashapp')[] = paymentMethod === 'cashapp' 
        ? ['cashapp'] 
        : ['card', 'cashapp'];

      // Create one-time payment intent for $1.00 (100 cents)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 100, // $1.00 in cents
        currency: 'usd',
        customer: customer.id,
        payment_method_types: paymentMethodTypes,
        metadata: {
          userId: userId,
          battleCount: battleCount,
          paymentMethod: paymentMethod,
          ...(paymentMethod === 'cashapp' && { cashapp_account: '$ILLAITHEGPTSTORE' })
        },
        description: paymentMethod === 'cashapp' 
          ? `10 Battle Pack ($0.10 per battle) - Pay to $ILLAITHEGPTSTORE`
          : `10 Battle Pack ($0.10 per battle)`,
      });

      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      console.log(`🔑 Client secret: ${!!paymentIntent.client_secret}`);

      res.json({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: 100,
        battleCount: 10
      });
    } catch (error: any) {
      console.error('Battle purchase creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  }));

  // Stripe payment routes
  app.post('/api/create-subscription', paymentRateLimit, isAuthenticated, validatePayment, trackPaymentAttempt, catchAsync(async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier, paymentMethod = 'stripe' } = req.body; // 'premium' or 'pro', 'stripe' or 'cashapp'
      
      if (!tier || !['premium', 'pro'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }

      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.email) {
        throw new Error('No user email on file');
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        });
        
        user = await storage.updateUserStripeInfo(userId, { 
          stripeCustomerId: customer.id 
        });
      }

      console.log(`🔧 Creating subscription for tier: ${tier}`);
      
      // Determine price based on tier
      const priceId = tier === 'premium' 
        ? process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1S1fdYE0KDhHKBCxQxmXMeXX' // $9.99/month Premium
        : process.env.STRIPE_PRO_PRICE_ID || 'price_1S1fdYE0KDhHKBCxCxmXMeXX'; // $19.99/month Pro
      
      console.log(`🔧 Creating subscription with price ID: ${priceId}`);
      
      // Configure payment method types based on selection
      const paymentMethodTypes: ('card' | 'cashapp')[] = paymentMethod === 'cashapp' 
        ? ['cashapp'] 
        : ['card', 'cashapp']; // Allow both card and CashApp for Stripe

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: paymentMethodTypes,
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          paymentMethod: paymentMethod,
          ...(paymentMethod === 'cashapp' && { cashapp_account: '$ILLAITHEGPTSTORE' })
        },
        description: paymentMethod === 'cashapp' 
          ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription - Pay to $ILLAITHEGPTSTORE`
          : `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription`,
      });

      console.log(`✅ Subscription created: ${subscription.id}`);
      const invoiceObj = subscription.latest_invoice as any;
      console.log(`📋 Latest invoice:`, invoiceObj?.id);
      console.log(`💳 Payment intent:`, invoiceObj?.payment_intent?.id);
      console.log(`🔑 Client secret:`, !!invoiceObj?.payment_intent?.client_secret);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: invoiceObj?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  }));

  // Stripe webhook for payment updates (subscriptions + one-time purchases)
  app.post('/api/stripe-webhook', async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature']!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        try {
          // Check if this is a battle pack purchase
          if (paymentIntent.metadata?.battleCount) {
            const userId = paymentIntent.metadata.userId;
            const battleCount = parseInt(paymentIntent.metadata.battleCount);
            
            if (userId && battleCount) {
              // Add battles to user account
              await storage.addUserBattles(userId, battleCount);
              console.log(`✅ Added ${battleCount} battles to user ${userId} (Payment: ${paymentIntent.id})`);
            }
          }
        } catch (error) {
          console.error('Error processing battle pack purchase:', error);
        }
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        
        try {
          // Get all users to find the one with matching stripe customer ID
          const allUsers = await storage.getAllUsers();
          const user = allUsers.find(u => u.stripeCustomerId === subscription.customer);
          
          if (user) {
            const isActive = subscription.status === 'active';
            const tier = subscription.status === 'active' 
              ? (subscription.items.data[0]?.price?.unit_amount === 999 ? 'premium' : 'pro')
              : 'free';
            
            await storage.updateUserSubscription(user.id, {
              subscriptionTier: tier,
              subscriptionStatus: subscription.status,
              stripeSubscriptionId: subscription.id,
              battlesRemaining: isActive ? (tier === 'premium' ? 25 : -1) : 3,
            });
            
            console.log(`✅ Updated subscription for user ${user.id}: ${tier} (${subscription.status})`);
          }
        } catch (error) {
          console.error('Error processing subscription webhook:', error);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Battle management routes
  app.get('/api/battles/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const battles = await storage.getUserBattles(userId, 20);
      res.json(battles);
    } catch (error) {
      console.error("Error fetching battle history:", error);
      res.status(500).json({ message: "Failed to fetch battle history" });
    }
  });

  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Create a new battle
  app.post("/api/battle", battleRateLimit, isAuthenticated, validateBattleCreation, trackBattleCreated, catchAsync(async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { characterId, difficulty = "normal", customSettings = {} } = req.body;

      if (!characterId) {
        return res.status(400).json({ message: "Character selection is required" });
      }

      // Check if user can start a battle
      const canStartBattle = await storage.canUserStartBattle(userId);
      if (!canStartBattle) {
        return res.status(403).json({ message: "No battles remaining today" });
      }

      const battleData = {
        userId,
        aiCharacter: characterId,
        difficulty,
        customSettings,
        status: "active" as const,
        rounds: [],
        userScore: 0,
        aiScore: 0,
      };

      const battle = await storage.createBattle(battleData);
      res.json(battle);
    } catch (error: any) {
      console.error("Error creating battle:", error);
      res.status(500).json({ message: error.message || "Failed to create battle" });
    }
  }));

  // Get battle details
  app.get("/api/battle/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const battle = await storage.getBattle(id);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      res.json(battle);
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ message: "Failed to fetch battle" });
    }
  });

  // Add a round to the battle
  app.post("/api/battle/:id/round", battleRateLimit, isAuthenticated, upload.single('audio'), validateAudioUpload, catchAsync(async (req: any, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      const { difficulty = 'normal', customPrompt } = req.body;
      
      console.log(`🎤 Processing battle round for battle ${id}`);
      console.log(`📊 Difficulty: ${difficulty}`);
      console.log(`🎵 Audio file size: ${req.file.size} bytes`);

      const battle = await storage.getBattle(id);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }

      const audioBuffer = req.file.buffer;

      // Step 1: Transcribe user's audio
      console.log(`🎯 Transcribing user audio...`);
      const transcription = await groqService.transcribeAudio(audioBuffer);
      console.log(`✅ Transcription: "${transcription}"`);

      if (!transcription || transcription.trim().length === 0) {
        return res.status(400).json({ message: "Could not transcribe audio. Please try again." });
      }

      // Step 2: Generate AI response
      console.log(`🤖 Generating AI response...`);
      const aiResponse = await groqService.generateBattleVerse(
        transcription, 
        battle.aiCharacter, 
        difficulty,
        customPrompt
      );
      console.log(`✅ AI Response: "${aiResponse}"`);

      // Step 3: Get AI TTS
      console.log(`🎵 Generating AI voice...`);
      const aiAudioPath = await userTTSManager.generateTTS(aiResponse, battle.aiCharacter, req.user.claims.sub);
      console.log(`✅ AI audio generated: ${!!aiAudioPath}`);

      // Step 4: Score the battle round
      console.log(`📊 Scoring battle round...`);
      const scores = await scoringService.scoreBattleRound(transcription, aiResponse);
      console.log(`✅ Scores - User: ${scores.userScore}, AI: ${scores.aiScore}`);

      // Step 5: Create round data
      const roundData = {
        roundNumber: battle.rounds.length + 1,
        userVerse: transcription,
        aiVerse: aiResponse,
        userScore: scores.userScore,
        aiScore: scores.aiScore,
        aiAudioPath: aiAudioPath || undefined,
        analysis: scores.analysis,
        createdAt: new Date(),
      };

      // Step 6: Add round to battle
      await storage.addBattleRound(id, roundData);

      // Step 7: Update battle scores
      const newUserScore = battle.userScore + scores.userScore;
      const newAiScore = battle.aiScore + scores.aiScore;
      await storage.updateBattleScore(id, newUserScore, newAiScore);

      res.json({
        round: roundData,
        battleScores: {
          userScore: newUserScore,
          aiScore: newAiScore
        }
      });
    } catch (error: any) {
      console.error("Error processing battle round:", error);
      res.status(500).json({ message: error.message || "Failed to process battle round" });
    }
  }));

  // Complete a battle
  app.post("/api/battle/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const battle = await storage.getBattle(id);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }

      if (battle.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to complete this battle" });
      }

      await storage.completeBattle(id);
      res.json({ message: "Battle completed successfully" });
    } catch (error) {
      console.error("Error completing battle:", error);
      res.status(500).json({ message: "Failed to complete battle" });
    }
  });

  // Tournament routes
  app.get('/api/tournaments', isAuthenticated, async (req: any, res) => {
    try {
      const tournaments = await storage.getActiveTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  app.post('/api/tournaments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tournamentData = insertTournamentSchema.parse({
        ...req.body,
        userId
      });
      
      const tournament = await storage.createTournament(tournamentData);
      res.json(tournament);
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      res.status(400).json({ message: error.message || "Failed to create tournament" });
    }
  });

  app.get('/api/tournaments/active', async (req, res) => {
    try {
      const tournaments = await storage.getActiveTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching active tournaments:", error);
      res.status(500).json({ message: "Failed to fetch active tournaments" });
    }
  });

  app.get('/api/tournaments/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tournaments = await storage.getUserTournaments(userId);
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournament history:", error);
      res.status(500).json({ message: "Failed to fetch tournament history" });
    }
  });

  app.get('/api/tournaments/leaderboard', async (req, res) => {
    try {
      // Mock leaderboard data for now
      const leaderboard = [
        {
          rank: 1,
          userId: "user1",
          username: "RapKing2024",
          tournamentsWon: 15,
          tournamentsPlayed: 23,
          winRate: 65.2,
          averageScore: 8.7,
          totalPoints: 2450
        },
        {
          rank: 2,
          userId: "user2", 
          username: "FlowMaster",
          tournamentsWon: 12,
          tournamentsPlayed: 20,
          winRate: 60.0,
          averageScore: 8.3,
          totalPoints: 2100
        },
        {
          rank: 3,
          userId: "user3",
          username: "LyricGenius",
          tournamentsWon: 8,
          tournamentsPlayed: 15,
          winRate: 53.3,
          averageScore: 7.9,
          totalPoints: 1850
        }
      ];
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get('/api/tournament/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      
      res.json(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ message: "Failed to fetch tournament" });
    }
  });

  // Fine-tuning routes
  app.get('/api/fine-tunings', isAuthenticated, async (req: any, res) => {
    try {
      // Mock response for now - this would integrate with OpenAI's fine-tuning API
      res.json({
        available: false,
        message: "Fine-tuning is coming soon! This feature will allow you to create custom AI opponents.",
        models: []
      });
    } catch (error) {
      console.error("Error fetching fine-tunings:", error);
      res.status(500).json({ message: "Failed to fetch fine-tunings" });
    }
  });

  app.get('/api/training-data/sample', isAuthenticated, async (req: any, res) => {
    try {
      const sampleData = {
        sample_data: [
          {
            prompt: "Generate a rap verse responding to: 'You think you're hot but you're not even warm'",
            completion: "I'm not warm? I'm blazing hot like the sun in July\nMy bars so fire they could burn through your lies\nYou speaking on heat but you're cold as December\nI'm the flame that you'll always remember",
            difficulty: "normal",
            style: "aggressive",
            rhyme_scheme: "AABB"
          }
        ],
        jsonl_format: "Each line should be a JSON object with prompt and completion fields",
        instructions: "Create training data in JSONL format to fine-tune AI responses"
      };
      res.json(sampleData);
    } catch (error) {
      console.error("Error fetching sample data:", error);
      res.status(500).json({ message: "Failed to fetch sample data" });
    }
  });

  // API key management
  app.get('/api/user/api-keys/status', isAuthenticated, catchAsync(async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await storage.getUserAPIKeysStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching API key status:", error);
      res.status(500).json({ message: "Failed to fetch API key status" });
    }
  }));

  app.post('/api/user/api-keys', isAuthenticated, validateAPIKeys, catchAsync(async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { openaiApiKey, groqApiKey, preferredTtsService } = req.body;
      
      await storage.updateUserAPIKeys(userId, {
        openaiApiKey,
        groqApiKey, 
        preferredTtsService
      });
      
      res.json({ message: "API keys updated successfully" });
    } catch (error) {
      console.error("Error updating API keys:", error);
      res.status(500).json({ message: "Failed to update API keys" });
    }
  }));

  const httpServer = createServer(app);

  return httpServer;
}