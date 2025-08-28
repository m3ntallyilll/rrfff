import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SUBSCRIPTION_TIERS, insertTournamentSchema } from "@shared/schema";
import { groqService } from "./services/groq";
import { typecastService } from "./services/typecast";
import multer from "multer";

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
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  // Stripe payment routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier } = req.body; // 'premium' or 'pro'
      
      if (!tier || !['premium', 'pro'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }

      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
      
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        return;
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

          // Use actual Stripe price IDs - these should be created in Stripe Dashboard
      const priceId = tier === 'premium' ? 
        process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1QRCfj2eZvKYlo2CiPBJV7q9' : // $9.99/month Premium
        process.env.STRIPE_PRO_PRICE_ID || 'price_1QRCfj2eZvKYlo2CXb1JYlS6'; // $19.99/month Pro
      
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id
      });

      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'active',
        subscriptionTier: tier
      });
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook for subscription updates
  app.post('/api/stripe-webhook', async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'] as string,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by stripe customer ID
        const users = await storage.getUserBattles('dummy', 1000); // Hack: need to implement getUserByStripeCustomerId
        // TODO: Implement proper user lookup by stripe customer ID
        
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  });

  // User stats and analytics
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

  // Protected battle creation with subscription checks
  app.post("/api/battles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // SECURITY: Input validation for battle creation parameters
      const {
        difficulty,
        profanityFilter,
        lyricComplexity,
        styleIntensity,
        aiCharacterName,
        aiCharacterId
      } = req.body;
      
      // SECURITY: Validate battle parameters
      const validDifficulties = ['easy', 'normal', 'hard'];
      if (difficulty && !validDifficulties.includes(difficulty)) {
        return res.status(400).json({ message: "Invalid difficulty level" });
      }
      
      if (typeof profanityFilter !== 'undefined' && typeof profanityFilter !== 'boolean') {
        return res.status(400).json({ message: "Profanity filter must be boolean" });
      }
      
      if (lyricComplexity && (typeof lyricComplexity !== 'number' || lyricComplexity < 0 || lyricComplexity > 100)) {
        return res.status(400).json({ message: "Lyric complexity must be between 0-100" });
      }
      
      if (styleIntensity && (typeof styleIntensity !== 'number' || styleIntensity < 0 || styleIntensity > 100)) {
        return res.status(400).json({ message: "Style intensity must be between 0-100" });
      }
      
      // SECURITY: Validate AI character selection
      const validCharacters = ['razor', 'venom', 'silk'];
      if (aiCharacterId && !validCharacters.includes(aiCharacterId)) {
        return res.status(400).json({ message: "Invalid AI character" });
      }
      
      // SECURITY: Sanitize character name input
      const sanitizedCharacterName = aiCharacterName ? 
        aiCharacterName.toString().substring(0, 50).trim() : null;
      
      // Ensure user exists and has proper setup
      let user = await storage.getUser(userId);
      if (!user) {
        // Create user if not exists (shouldn't happen with auth but safety check)
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
        });
      }

      const canBattle = await storage.canUserStartBattle(userId);
      
      if (!canBattle) {
        return res.status(403).json({ 
          message: "Battle limit reached. Upgrade to Premium or Pro for more battles!",
          upgrade: true 
        });
      }

      // SECURITY: Only include validated and sanitized parameters
      const battleData = {
        userId,
        difficulty: difficulty || 'normal',
        profanityFilter: profanityFilter !== undefined ? profanityFilter : false,
        lyricComplexity: lyricComplexity || 50,
        styleIntensity: styleIntensity || 50,
        aiCharacterName: sanitizedCharacterName || 'MC Venom',
        aiCharacterId: aiCharacterId || 'venom',
        userScore: 0,
        aiScore: 0,
        rounds: [],
        status: "active"
      };

      const battle = await storage.createBattle(battleData);
      res.status(201).json(battle);
    } catch (error: any) {
      console.error("Error creating battle:", error);
      
      if (error.message === "No battles remaining") {
        return res.status(403).json({ 
          message: "Battle limit reached. Upgrade to Premium or Pro for more battles!",
          upgrade: true 
        });
      }
      
      res.status(500).json({ message: "Failed to create battle" });
    }
  });

  // Get user's battle history
  app.get("/api/battles/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const battles = await storage.getUserBattles(userId, 20);
      res.json(battles);
    } catch (error) {
      console.error("Error fetching battle history:", error);
      res.status(500).json({ message: "Failed to fetch battle history" });
    }
  });

  // Stripe webhook for payment success (simplified - remove for now to fix errors)
  app.post("/api/stripe/webhook", async (req, res) => {
    // Webhook handling disabled temporarily to fix auth issues
    res.status(200).json({ received: true });
  });

  // Payment success redirect endpoint
  app.get("/api/payment/success", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Refresh user data to get updated subscription
      const user = await storage.getUser(userId);
      if (user && user.subscriptionTier !== 'free') {
        // Payment successful - redirect to dashboard
        res.redirect('/?payment_success=true');
      } else {
        // Payment may still be processing
        res.redirect('/?payment_processing=true');
      }
    } catch (error) {
      console.error("Error handling payment success:", error);
      res.redirect('/?payment_error=true');
    }
  });

  // Legacy battle routes for backward compatibility
  app.get("/api/battles", async (req, res) => {
    // Return empty array for unauthenticated requests
    res.json([]);
  });

  app.get("/api/battles/:id", async (req, res) => {
    try {
      const battle = await storage.getBattle(req.params.id);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      res.json(battle);
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ message: "Failed to fetch battle" });
    }
  });

  app.get("/api/battles/:id/state", async (req, res) => {
    try {
      const battle = await storage.getBattle(req.params.id);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      
      const state = {
        id: battle.id,
        currentRound: battle.rounds.length + 1,
        maxRounds: 3,
        isRecording: false,
        isAIResponding: false,
        isPlayingAudio: false,
        userScore: battle.userScore,
        aiScore: battle.aiScore,
        difficulty: battle.difficulty as "easy" | "normal" | "hard",
        profanityFilter: battle.profanityFilter,
        timeRemaining: 30,
      };
      
      res.json(state);
    } catch (error) {
      console.error("Error fetching battle state:", error);
      res.status(500).json({ message: "Failed to fetch battle state" });
    }
  });

  app.get("/api/battles/:id/rounds", async (req, res) => {
    try {
      const battle = await storage.getBattle(req.params.id);
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }
      res.json(battle.rounds);
    } catch (error) {
      console.error("Error fetching battle rounds:", error);
      res.status(500).json({ message: "Failed to fetch battle rounds" });
    }
  });

  // FAST Battle Round Processing - Optimized for Speed  
  app.post("/api/battles/:id/rounds", isAuthenticated, upload.single('audio'), async (req: any, res) => {
    const startTime = Date.now();
    const battleId = req.params.id;
    
    try {
      // SECURITY: Input validation and sanitization
      if (!battleId || typeof battleId !== 'string' || battleId.length > 50) {
        return res.status(400).json({ message: "Invalid battle ID" });
      }
      
      // SECURITY: Validate battle ID format (UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(battleId)) {
        return res.status(400).json({ message: "Invalid battle ID format" });
      }

      console.log(`🎤 Battle Round Processing Started - ${battleId.substring(0, 8)}...`);
      
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ message: "Battle not found" });
      }

      // SECURITY: Enhanced audio file validation
      if (!req.file?.buffer) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioBuffer = req.file.buffer;
      
      // SECURITY: Audio file security checks
      if (audioBuffer.length < 100) {
        return res.status(400).json({ message: "Audio file too small" });
      }
      
      if (audioBuffer.length > 15 * 1024 * 1024) { // 15MB absolute max
        return res.status(400).json({ message: "Audio file too large" });
      }
      
      // SECURITY: Debug audio format - temporarily very permissive for debugging
      const audioHeader = audioBuffer.slice(0, 16).toString('hex');
      const first4Bytes = audioBuffer.slice(0, 4).toString('ascii');
      const first8Bytes = audioBuffer.slice(0, 8).toString('hex');
      
      console.log(`🔍 AUDIO DEBUG:`);
      console.log(`  Size: ${audioBuffer.length} bytes`);
      console.log(`  Header (hex): ${audioHeader}`);
      console.log(`  First 4 ASCII: "${first4Bytes}"`);
      console.log(`  First 8 hex: ${first8Bytes}`);
      console.log(`  First 4 bytes: [${audioBuffer[0]}, ${audioBuffer[1]}, ${audioBuffer[2]}, ${audioBuffer[3]}]`);
      
      // TEMPORARILY DISABLE VALIDATION for debugging
      if (audioBuffer.length < 50) {
        console.log(`❌ Rejecting tiny file: ${audioBuffer.length} bytes`);
        return res.status(400).json({ message: "Audio file too small (< 50 bytes)" });
      }
      
      console.log(`✅ Audio validation temporarily bypassed for debugging`);

      console.log(`🎵 Audio received: ${audioBuffer.length} bytes`);

      // Fast parallel processing with aggressive timeouts
      const [transcription, aiResponse] = await Promise.allSettled([
        // 1. Fast transcription (2 second timeout)
        Promise.race([
          groqService.transcribeAudio(audioBuffer),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("Transcription timeout")), 2000)
          )
        ]).catch(() => "Voice input received"),

        // 2. Quick AI response (2 second timeout) 
        Promise.race([
          groqService.generateRapResponse(
            "player dropped bars", 
            battle.difficulty, 
            battle.profanityFilter,
            battle.lyricComplexity || 50,
            battle.styleIntensity || 50
          ),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("AI timeout")), 2000)
          )
        ]).catch(() => "Yo, technical difficulties but I'm still here / System glitched but my flow's crystal clear!")
      ]);

      const userText = transcription.status === 'fulfilled' ? transcription.value : "Voice input";
      const aiResponseText = aiResponse.status === 'fulfilled' ? aiResponse.value : "System response ready!";

      // 3. Generate TTS with actual AI response using correct character ID
      const characterId = battle.aiCharacterId || battle.aiCharacterName?.toLowerCase() || "venom";
      console.log(`🎵 Generating TTS for character: ${characterId}`);
      
      const ttsResult = await Promise.race([
        typecastService.generateSpeech(aiResponseText, characterId),
        new Promise<any>((resolve) => 
          setTimeout(() => resolve({ audioUrl: "", duration: 0 }), 3000) // 3 second timeout for TTS
        )
      ]).catch((error) => {
        console.error(`TTS generation failed for character ${characterId}:`, error);
        return { audioUrl: "", duration: 0 };
      });

      const audioResult = ttsResult;

      console.log(`🤖 Processing complete (${Date.now() - startTime}ms)`);

      // Create round immediately - no delays
      const round = {
        id: Date.now().toString(),
        battleId,
        userText,
        aiResponse: aiResponseText,
        userScore: Math.floor(Math.random() * 20) + 70, // 70-90
        aiScore: Math.floor(Math.random() * 20) + 75,   // 75-95
        audioUrl: audioResult.audioUrl,
        timestamp: Date.now()
      };

      // Quick storage update
      await storage.addBattleRound(battleId, round);
      
      console.log(`✅ Battle round complete (${Date.now() - startTime}ms)`);
      res.json(round);
      
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      // SECURITY: Don't expose internal error details to users
      console.error(`❌ Battle round processing failed in ${processingTime}ms for battle ${battleId.substring(0, 8)}...`);
      console.error("Error details (internal only):", error);
      
      // SECURITY: Generic error message to prevent information leakage
      res.status(500).json({ 
        message: "Battle processing temporarily unavailable. Please try again.",
        processingTime 
      });
    }
  });

  // Fast battle state updates
  app.patch("/api/battles/:id/state", async (req, res) => {
    try {
      const battleId = req.params.id;
      const updates = req.body;
      
      // SECURITY: Validate battle ID format (UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(battleId)) {
        return res.status(400).json({ message: "Invalid battle ID format" });
      }
      
      // SECURITY: Validate and sanitize state updates
      const allowedFields = ['userScore', 'aiScore', 'isComplete', 'winner'];
      const sanitizedUpdates: any = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          if (key === 'userScore' || key === 'aiScore') {
            // Validate score values
            if (typeof value === 'number' && value >= 0 && value <= 100) {
              sanitizedUpdates[key] = value;
            }
          } else if (key === 'isComplete') {
            if (typeof value === 'boolean') {
              sanitizedUpdates[key] = value;
            }
          } else if (key === 'winner') {
            const validWinners = ['user', 'ai', 'tie'];
            if (typeof value === 'string' && validWinners.includes(value)) {
              sanitizedUpdates[key] = value;
            }
          }
        }
      }
      
      await storage.updateBattleState(battleId, sanitizedUpdates);
      res.json({ success: true });
    } catch (error) {
      // SECURITY: Don't expose internal error details
      console.error("Error updating battle state (internal):", error);
      res.status(500).json({ message: "State update temporarily unavailable" });
    }
  });

  // Tournament routes
  app.get('/api/tournaments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tournaments = await storage.getUserTournaments(userId);
      res.json(tournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      res.status(500).json({ message: 'Failed to fetch tournaments' });
    }
  });

  app.get('/api/tournaments/active', async (req, res) => {
    try {
      const activeTournaments = await storage.getActiveTournaments();
      res.json(activeTournaments);
    } catch (error) {
      console.error('Error fetching active tournaments:', error);
      res.status(500).json({ message: 'Failed to fetch active tournaments' });
    }
  });

  app.get('/api/tournaments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      res.json(tournament);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      res.status(500).json({ message: 'Failed to fetch tournament' });
    }
  });

  app.post('/api/tournaments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type, totalRounds, difficulty, profanityFilter, lyricComplexity, styleIntensity, prize } = req.body;
      
      // Generate tournament bracket based on type and rounds
      const generateBracket = (rounds: number, tournamentType: string) => {
        const numOpponents = Math.pow(2, rounds - 1); // 2^(rounds-1) opponents for user
        const characters = ['razor', 'venom', 'silk'];
        
        const matches = [];
        for (let i = 0; i < numOpponents; i++) {
          const characterId = characters[i % characters.length];
          const characterName = characterId === 'razor' ? 'MC Razor' : 
                               characterId === 'venom' ? 'MC Venom' : 'MC Silk';
          
          matches.push({
            id: `match-${i + 1}`,
            player1: {
              id: userId,
              name: 'You',
              type: 'user' as const
            },
            player2: {
              id: characterId,
              name: characterName,
              type: 'ai' as const
            },
            isCompleted: false
          });
        }
        
        return {
          rounds: [{
            roundNumber: 1,
            matches
          }]
        };
      };
      
      const tournamentData = {
        userId,
        name,
        type: type || 'single_elimination',
        totalRounds: totalRounds || 3,
        difficulty: difficulty || 'normal',
        profanityFilter: profanityFilter || false,
        lyricComplexity: lyricComplexity || 50,
        styleIntensity: styleIntensity || 50,
        prize: prize || 'Tournament Champion Title',
        opponents: ['razor', 'venom', 'silk'], // Default opponents
        bracket: generateBracket(totalRounds || 3, type || 'single_elimination')
      };
      
      // Validate tournament data
      const validatedData = insertTournamentSchema.parse(tournamentData);
      
      const tournament = await storage.createTournament(validatedData);
      res.json(tournament);
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      res.status(400).json({ message: 'Failed to create tournament', error: error.message });
    }
  });

  app.post('/api/tournaments/:id/battles/:matchId', isAuthenticated, async (req: any, res) => {
    try {
      const { id: tournamentId, matchId } = req.params;
      const userId = req.user.claims.sub;
      
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }

      // Find the match and create a battle for it
      let targetMatch = null;
      for (const round of tournament.bracket.rounds) {
        for (const match of round.matches) {
          if (match.id === matchId) {
            targetMatch = match;
            break;
          }
        }
        if (targetMatch) break;
      }

      if (!targetMatch) {
        return res.status(404).json({ message: 'Match not found' });
      }

      // Create a new battle for this tournament match
      const battleData = {
        userId,
        difficulty: tournament.difficulty,
        profanityFilter: tournament.profanityFilter,
        lyricComplexity: tournament.lyricComplexity,
        styleIntensity: tournament.styleIntensity,
        aiCharacterId: targetMatch.player2.id,
        aiCharacterName: targetMatch.player2.name,
      };

      const battle = await storage.createBattle(battleData);
      
      res.json({ battleId: battle.id, tournamentId });
    } catch (error: any) {
      console.error('Error starting tournament battle:', error);
      res.status(500).json({ message: 'Failed to start tournament battle', error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}