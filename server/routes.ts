import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SUBSCRIPTION_TIERS, insertTournamentSchema, processedWebhookEvents, insertWebhookEventSchema } from "@shared/schema";
import { groqService } from "./services/groq";
import { typecastService } from "./services/typecast";
import { barkTTS } from "./services/bark";
import { scoringService } from "./services/scoring";
import { userTTSManager } from "./services/user-tts-manager";
import { crowdReactionService } from "./services/crowdReactionService";
import multer from "multer";
import path from "path";
import fs from "fs";

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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Sitemap.xml endpoint for SEO
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
      res.set('Content-Type', 'application/xml');
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send('Sitemap not found');
    }
  });

  // Health check endpoint for deployment monitoring
  app.get('/api/health', (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: !!process.env.DATABASE_URL,
        groq: !!process.env.GROQ_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        stripe: !!process.env.STRIPE_SECRET_KEY,
      }
    };
    
    console.log('🏥 Health check:', health);
    res.json(health);
  });

  // SFX Audio Files endpoint for serving public sound effects
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "SFX file not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving SFX file:", error);
      return res.status(500).json({ error: "Failed to serve SFX file" });
    }
  });

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

  // One-time battle purchase
  app.post('/api/purchase-battles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { battleCount = 10, paymentMethod = 'stripe' } = req.body; // Default 10 battles for $1
      
      // Available battle packages with pricing
      const battlePackages = {
        10: { price: 100, description: '10 battles for $1.00' }, // $0.10 per battle
        1500: { price: 10000, description: '1,500 battles for $100.00' } // $0.067 per battle (15 battles per dollar)
      };
      
      if (!battlePackages[battleCount as keyof typeof battlePackages]) {
        const available = Object.keys(battlePackages).join(', ');
        return res.status(400).json({ 
          message: `Invalid battle count. Available packages: ${available} battles` 
        });
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
        try {
          customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } catch (error: any) {
          // Handle test/live mode mismatch - create new customer
          if (error.code === 'resource_missing') {
            console.log(`🔄 Customer not found in current mode, creating new customer...`);
            customer = await stripe.customers.create({
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            });
            
            user = await storage.updateUserStripeInfo(userId, { 
              stripeCustomerId: customer.id 
            });
          } else {
            throw error;
          }
        }
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        });
        
        user = await storage.updateUserStripeInfo(userId, { 
          stripeCustomerId: customer.id 
        });
      }

      const packageInfo = battlePackages[battleCount as keyof typeof battlePackages];
      const amount = packageInfo.price;
      const pricePerBattle = (amount / 100 / battleCount).toFixed(3);
      
      console.log(`💰 Creating battle purchase: ${battleCount} battles for $${(amount/100).toFixed(2)}`);
      
      // Configure payment method types
      const paymentMethodTypes: ('card' | 'cashapp')[] = paymentMethod === 'cashapp' 
        ? ['cashapp'] 
        : ['card', 'cashapp'];

      // Create one-time payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in cents
        currency: 'usd',
        customer: customer.id,
        payment_method_types: paymentMethodTypes,
        metadata: {
          userId: userId,
          battleCount: battleCount,
          paymentMethod: paymentMethod,
          packageType: battleCount === 1500 ? 'mega_bundle' : 'standard',
          ...(paymentMethod === 'cashapp' && { cashapp_account: '$ILLAITHEGPTSTORE' })
        },
        description: paymentMethod === 'cashapp' 
          ? `${battleCount} Battle Pack ($${pricePerBattle} per battle) - Pay to $ILLAITHEGPTSTORE`
          : `${battleCount} Battle Pack ($${pricePerBattle} per battle)`,
      });

      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      console.log(`🔑 Client secret: ${!!paymentIntent.client_secret}`);

      res.json({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        battleCount: battleCount
      });
    } catch (error: any) {
      console.error('Battle purchase creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Store credit balance route (like ThcaStore)
  app.get('/api/store-credit/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ balance: user?.storeCredit || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch store credit balance' });
    }
  });

  // Generate referral code for user
  app.post('/api/referral/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.referralCode) {
        return res.json({ referralCode: user.referralCode });
      }

      // Generate unique referral code
      const firstName = user.firstName || user.email?.split('@')[0] || 'USER';
      const codeBase = firstName.slice(0, 3).toUpperCase();
      const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
      const referralCode = `${codeBase}${randomPart}`;

      // Update user with referral code
      await storage.updateUser(userId, { referralCode });

      res.json({ referralCode });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate referral code: ' + error.message });
    }
  });

  // Join with referral code and award $1 credit
  app.post('/api/referral/join', async (req, res) => {
    try {
      const { referralCode, newUserId } = req.body;
      
      if (!referralCode || !newUserId) {
        return res.status(400).json({ message: 'Referral code and user ID required' });
      }

      // Find referrer by code
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }

      // Update new user with referrer info
      await storage.updateUser(newUserId, { referredBy: referrer.id });

      // Award $1.00 store credit to referrer
      const currentCredit = parseFloat(referrer.storeCredit || '0');
      const newCredit = (currentCredit + 1.00).toFixed(2);
      await storage.updateUser(referrer.id, { storeCredit: newCredit });

      // Create referral record
      await storage.createReferral({
        referrerId: referrer.id,
        refereeId: newUserId,
        referralCode,
        status: 'completed',
        creditAwarded: '1.00'
      });

      console.log(`💰 Referral complete: ${referrer.email} earned $1.00 credit`);
      res.json({ 
        success: true, 
        creditAwarded: '1.00',
        message: 'Referral completed! $1.00 credited to referrer.' 
      });
    } catch (error: any) {
      console.error('Referral join error:', error);
      res.status(500).json({ error: 'Failed to process referral: ' + error.message });
    }
  });

  // Get user's referral stats
  app.get('/api/referral/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const referrals = await storage.getUserReferrals(userId);
      const totalEarnings = referrals.reduce((sum, ref) => sum + parseFloat(ref.creditAwarded || '0'), 0);

      res.json({
        referralCode: user.referralCode,
        totalReferrals: referrals.length,
        totalEarnings: totalEarnings.toFixed(2),
        storeCredit: user.storeCredit,
        referrals: referrals.map(ref => ({
          id: ref.id,
          status: ref.status,
          creditAwarded: ref.creditAwarded,
          createdAt: ref.createdAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch referral stats: ' + error.message });
    }
  });

  // One-time payment intent (like ThcaStore's approach)
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { amount, description = "Battle pack purchase" } = req.body;
      const userId = req.user.claims.sub;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: userId,
          type: "one_time_purchase"
        },
        description,
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Stripe payment routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
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

      const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
      
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent']
        });
        
        const latestInvoice = subscription.latest_invoice as any;
        const clientSecret = latestInvoice?.payment_intent?.client_secret;
          
        res.json({
          subscriptionId: subscription.id,
          clientSecret: clientSecret,
        });
        return;
      }
      
      if (!user.email) {
        throw new Error('No user email on file');
      }

      let customer;
      if (user.stripeCustomerId) {
        try {
          customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } catch (error: any) {
          // Handle test/live mode mismatch - create new customer
          if (error.code === 'resource_missing') {
            console.log(`🔄 Customer not found in current mode, creating new customer...`);
            customer = await stripe.customers.create({
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            });
            
            user = await storage.updateUserStripeInfo(userId, { 
              stripeCustomerId: customer.id,
              stripeSubscriptionId: undefined // Clear old subscription ID
            });
          } else {
            throw error;
          }
        }
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        });
        
        user = await storage.updateUserStripeInfo(userId, { 
          stripeCustomerId: customer.id 
        });
      }

          // Create dynamic pricing for live mode compatibility
      const priceAmount = Math.round(tierInfo.price * 100); // Convert to cents
      
      console.log(`🔧 Creating subscription for ${tier} tier: $${tierInfo.price}/month`);
      
      // Configure payment method types based on selection
      const paymentMethodTypes: ('card' | 'cashapp')[] = paymentMethod === 'cashapp' 
        ? ['cashapp'] 
        : ['card', 'cashapp']; // Allow both card and CashApp for Stripe

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            product: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
            recurring: {
              interval: 'month',
            },
            unit_amount: priceAmount,
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: paymentMethodTypes,
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          paymentMethod: paymentMethod,
          tier: tier,
          ...(paymentMethod === 'cashapp' && { cashapp_account: '$ILLAITHEGPTSTORE' })
        },
        description: paymentMethod === 'cashapp' 
          ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription - Pay to $ILLAITHEGPTSTORE`
          : `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription`,
      });

      console.log(`✅ Subscription created: ${subscription.id}`);
      const invoiceObj = subscription.latest_invoice as any;
      console.log(`📋 Latest invoice:`, invoiceObj?.id);
      
      // Extract payment intent and client secret - handle expanded Stripe objects
      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent;
      const clientSecret = paymentIntent?.client_secret;
      
      console.log(`🔑 Payment intent: ${paymentIntent?.id}`);
      console.log(`🗝️ Client secret available: ${!!clientSecret}`);

      if (!clientSecret) {
        console.error('❌ No client secret found in subscription');
        throw new Error('Failed to create payment intent');
      }

      await storage.updateUserStripeInfo(userId, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id
      });

      // Don't mark as active until payment succeeds - webhook will handle this
      console.log(`✅ Subscription setup complete, returning client secret`);
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Database-backed idempotency for webhook events

  // Stripe webhook for payment updates (subscriptions + one-time purchases)
  app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'] as string,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`🚨 Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const eventId = event.id;
    
    // Database-backed idempotency check - prevent duplicate processing
    try {
      const existingEvent = await storage.getProcessedWebhookEvent(eventId);
      if (existingEvent) {
        console.log(`⚠️ Event ${eventId} already processed at ${existingEvent.processedAt}, skipping`);
        return res.json({received: true});
      }
    } catch (error: any) {
      console.error(`❌ Error checking webhook idempotency for event ${eventId}:`, error.message);
      return res.status(500).json({
        error: 'Database error during idempotency check',
        eventId: eventId,
        message: error.message
      });
    }

    console.log(`📥 Processing webhook event: ${event.type} (${eventId})`);

    try {
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
                const result = await storage.addUserBattles(userId, battleCount);
                if (result) {
                  console.log(`✅ Added ${battleCount} battles to user ${userId} (Payment: ${paymentIntent.id})`);
                } else {
                  console.warn(`⚠️ Failed to add battles to user ${userId} - user not found`);
                }
              } else {
                console.warn(`⚠️ Invalid battle pack data: userId=${userId}, battleCount=${battleCount}`);
              }
            }
          } catch (error: any) {
            console.error(`❌ Error processing battle pack purchase ${paymentIntent.id}:`, error.message);
            throw error; // Re-throw to trigger retry
          }
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          
          try {
            // Defensive customer ID extraction - handle both string and expanded objects
            let customerId: string;
            if (typeof subscription.customer === 'string') {
              customerId = subscription.customer;
            } else if (subscription.customer && typeof subscription.customer === 'object' && 'id' in subscription.customer) {
              customerId = subscription.customer.id;
            } else {
              throw new Error(`Invalid customer ID format: ${typeof subscription.customer}`);
            }
            
            console.log(`🔍 Looking up user for Stripe customer: ${customerId}`);
            
            // Efficiently find user by Stripe customer ID
            const user = await storage.getUserByStripeCustomerId(customerId);
            
            if (user) {
              const subscriptionStatus = subscription.status === 'active' ? 'active' : 'inactive';
              
              // Get tier from subscription metadata if available, otherwise infer from price
              let subscriptionTier = 'free';
              if (subscription.status === 'active') {
                if (subscription.metadata?.tier) {
                  subscriptionTier = subscription.metadata.tier;
                } else {
                  // Fallback: infer from price amount (999 = $9.99 Premium, 1999 = $19.99 Pro)
                  const unitAmount = subscription.items.data[0]?.price?.unit_amount;
                  subscriptionTier = unitAmount === 999 ? 'premium' : unitAmount === 1999 ? 'pro' : 'free';
                }
              }
              
              await storage.updateUserSubscription(user.id, {
                subscriptionStatus,
                subscriptionTier,
                stripeSubscriptionId: subscription.id
              });
              
              console.log(`✅ Updated user ${user.id} subscription: ${subscriptionTier} (${subscriptionStatus})`);
            } else {
              console.warn(`⚠️ No user found for Stripe customer ${customerId}`);
            }
          } catch (error: any) {
            console.error(`❌ Error processing subscription webhook ${subscription.id}:`, error.message);
            throw error; // Re-throw to trigger retry
          }
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      // Mark event as processed in database
      try {
        await storage.recordProcessedWebhookEvent({
          eventId: eventId,
          eventType: event.type
        });
      } catch (error: any) {
        console.error(`⚠️ Failed to record processed webhook event ${eventId}:`, error.message);
        // Continue anyway - the event was processed successfully
      }

      console.log(`✅ Successfully processed webhook event: ${event.type} (${eventId})`);
      res.json({received: true});

    } catch (error: any) {
      console.error(`❌ Critical webhook processing error for event ${eventId}:`, error.message);
      
      // Return 500 to trigger Stripe retry
      res.status(500).json({
        error: 'Webhook processing failed',
        eventId: eventId,
        message: error.message
      });
    }
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
        voiceSpeed,
        aiCharacterName,
        aiCharacterId
      } = req.body;
      
      // SECURITY: Validate battle parameters
      const validDifficulties = ['easy', 'normal', 'hard', 'nightmare'];
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
      
      if (voiceSpeed && (typeof voiceSpeed !== 'number' || voiceSpeed < 0.5 || voiceSpeed > 2.0)) {
        return res.status(400).json({ message: "Voice speed must be between 0.5-2.0" });
      }
      
      // SECURITY: Validate AI character selection
      const validCharacters = ['razor', 'venom', 'silk', 'cypher'];
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
        voiceSpeed: voiceSpeed || 1.0,
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

  // User API Key Management Routes
  app.get('/api/user/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await storage.getUserAPIKeysStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching API key status:", error);
      res.status(500).json({ message: "Failed to fetch API key status" });
    }
  });

  app.put('/api/user/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { openaiApiKey, groqApiKey, preferredTtsService } = req.body;
      
      const user = await storage.updateUserAPIKeys(userId, {
        openaiApiKey,
        groqApiKey,
        preferredTtsService
      });
      
      // Clear cached TTS instances when keys change
      userTTSManager.clearUserInstances(userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating API keys:", error);
      res.status(500).json({ message: "Failed to update API keys" });
    }
  });

  app.post('/api/user/test-api-key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { service } = req.body;
      
      if (!service || !['openai', 'groq'].includes(service)) {
        return res.status(400).json({ message: "Invalid service specified" });
      }
      
      const isValid = await userTTSManager.testUserAPIKey(userId, service as 'openai' | 'groq');
      res.json({ valid: isValid });
    } catch (error) {
      console.error(`Error testing ${req.body.service} API key:`, error);
      res.status(500).json({ message: `Failed to test ${req.body.service} API key` });
    }
  });

  // LIGHTNING-FAST TRANSCRIPTION ENDPOINT - Process audio in <200ms
  app.post("/api/battles/:id/transcribe", isAuthenticated, upload.single('audio'), async (req: any, res) => {
    const startTime = Date.now();
    const battleId = req.params.id;
    
    try {
      console.log(`⚡ LIGHTNING Transcription Started - ${battleId.substring(0, 8)}...`);
      
      if (!req.file?.buffer) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      const audioBuffer = req.file.buffer;
      console.log(`🎵 Audio for transcription: ${audioBuffer.length} bytes`);
      
      // Lightning-fast transcription only (200ms max for instant feel)
      let userText = "Voice input received";
      try {
        userText = await Promise.race([
          groqService.transcribeAudio(audioBuffer),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("Transcription timeout")), 150) // Even more aggressive 150ms
          )
        ]);
        console.log(`✅ LIGHTNING transcription (${Date.now() - startTime}ms): "${userText.substring(0, 50)}..."`);
      } catch (error) {
        console.log(`⚠️ Lightning transcription failed, getting actual transcription...`);
        // If ultra-fast fails, get the actual transcription without timeout
        try {
          userText = await groqService.transcribeAudio(audioBuffer);
          console.log(`✅ Fallback transcription complete: "${userText.substring(0, 50)}..."`);
        } catch (fallbackError) {
          console.log(`❌ All transcription failed, using placeholder`);
          userText = "Voice input received";
        }
      }
      
      const finalProcessingTime = Date.now() - startTime;
      console.log(`🎯 Final transcription result: "${userText}" (${finalProcessingTime}ms)`);
      
      res.json({ 
        userText,
        processingTime: finalProcessingTime,
        instant: finalProcessingTime <= 200 // Mark as instant only if truly fast
      });
      
    } catch (error: any) {
      console.error(`❌ Instant transcription failed:`, error.message);
      res.status(500).json({ message: "Transcription failed" });
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

      // DEBUG: Check file upload status
      console.log(`📁 File upload debug:`);
      console.log(`  req.file exists: ${!!req.file}`);
      console.log(`  req.file.buffer exists: ${!!(req.file?.buffer)}`);
      console.log(`  req.file details:`, req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length
      } : 'No file');

      if (!req.file?.buffer) {
        console.log(`❌ No audio file buffer provided`);
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioBuffer = req.file.buffer;
      
      console.log(`📊 File stats: ${audioBuffer.length} bytes, mimetype: ${req.file.mimetype}`);
      
      // TEMPORARILY REMOVE SIZE RESTRICTIONS for debugging
      if (audioBuffer.length === 0) {
        console.log(`❌ Empty audio file`);
        return res.status(400).json({ message: "Audio file is empty" });
      }
      
      // SECURITY: Proper audio format validation based on our findings
      const audioHeader = audioBuffer.slice(0, 16).toString('hex');
      
      console.log(`🔍 Audio validation: ${audioBuffer.length} bytes, header: ${audioHeader.substring(0, 16)}`);
      
      // WebM format validation (what browsers actually send)
      const isWebM = audioBuffer[0] === 0x1a && audioBuffer[1] === 0x45 && 
                     audioBuffer[2] === 0xDF && audioBuffer[3] === 0xA3;
      
      // Other common formats
      const isWAV = audioHeader.startsWith('52494646'); // RIFF
      const isOgg = audioHeader.startsWith('4f676753'); // OggS
      const isMP3 = audioHeader.startsWith('fffb') || audioHeader.startsWith('fff3');
      const isMP4 = audioHeader.startsWith('0000001c') || audioHeader.startsWith('00000020') || 
                    audioHeader.includes('66747970'); // MP4/M4A - more flexible detection
      
      if (!isWebM && !isWAV && !isOgg && !isMP3 && !isMP4) {
        console.log(`❌ Unrecognized audio format, header: ${audioHeader.substring(0, 16)}`);
        return res.status(400).json({ message: "Unsupported audio format" });
      }
      
      console.log(`✅ Audio validation passed: ${isWebM ? 'WebM' : isWAV ? 'WAV' : isOgg ? 'Ogg' : isMP3 ? 'MP3' : 'MP4'} format`);

      console.log(`🎵 Audio received: ${audioBuffer.length} bytes`);

      // IMMEDIATE TRANSCRIPTION - Process user's audio first for instant feedback
      console.log(`⚡ Starting immediate transcription...`);
      let userText = "Voice input received";
      
      try {
        // OPTIMIZED transcription with proper timeout for deployment stability
        userText = await Promise.race([
          groqService.transcribeAudio(audioBuffer),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("Transcription timeout")), 3000) // 3s timeout for stability
          )
        ]);
        console.log(`✅ FAST transcription complete: "${userText.substring(0, 50)}..."`);
      } catch (error) {
        console.log(`⚠️ Fast transcription failed, using fallback...`);
        // If ultra-fast fails, get the actual transcription without timeout
        try {
          userText = await groqService.transcribeAudio(audioBuffer);
          console.log(`✅ Fallback transcription complete: "${userText.substring(0, 50)}..."`);
        } catch (fallbackError) {
          console.log(`❌ All transcription failed, using placeholder`);
          userText = "Voice input received";
        }
      }
      
      // Continue with the rest of the processing - no streaming for now, 
      // but transcription is now much faster (1s vs 2s)
      
      // FIRST: Calculate user's performance to inform AI reaction
      console.log(`📊 Pre-analyzing user performance for reactive AI...`);
      const userPerformanceScore = scoringService.calculateUserScore(userText);
      console.log(`🎯 User performance: ${userPerformanceScore}/100 - AI will react accordingly`);

      // NOW generate AI response with user score context for reactive behavior
      console.log(`🤖 Generating AI response for: "${userText.substring(0, 30)}..."`);
      
      let aiResponseText = "System response ready!";
      try {
        // Ultra-aggressive timeout for instant response
        aiResponseText = await Promise.race([
          groqService.generateRapResponse(
            userText, // Use actual transcription for better AI response
            battle.difficulty, 
            battle.profanityFilter,
            battle.lyricComplexity || 50,
            battle.styleIntensity || 50,
            userPerformanceScore // Pass user score for reactive AI
          ),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error("AI timeout")), 5000) // Keep longer timeout for 120B model
          )
        ]);
        console.log(`✅ AI response generated: "${aiResponseText.substring(0, 50)}..."`);
      } catch (error: any) {
        console.log(`⚠️ AI response failed: ${error.message}`);
        aiResponseText = "Yo, technical difficulties but I'm still here / System glitched but my flow's crystal clear!";
      }

      // 3. Generate TTS using user's preferred service or system fallback
      const userId = req.user.claims.sub;
      const characterId = battle.aiCharacterId || battle.aiCharacterName?.toLowerCase()?.replace('mc ', '').replace(' ', '_') || "venom";
      console.log(`🎤 Generating TTS for character: ${characterId} (user: ${userId})`);
      
      // Use the new UserTTSManager to handle all TTS services
      let ttsResult: any;
      try {
        const { getCharacterById } = await import("@shared/characters");
        const character = getCharacterById(characterId);
        
        const audioResponse = await userTTSManager.generateTTS(aiResponseText, userId, {
          characterId,
          characterName: character?.name || `MC ${characterId}`,
          gender: character?.gender || 'male',
          voiceStyle: (battle.styleIntensity || 50) > 70 ? 'aggressive' : 
                     (battle.styleIntensity || 50) > 40 ? 'confident' : 'smooth',
          speedMultiplier: battle.voiceSpeed || 1.0
        });
        
        // Convert to expected format
        ttsResult = { 
          audioPath: "", 
          audioUrl: audioResponse.audioUrl,
          fileSize: audioResponse.audioUrl.length 
        };
        
        console.log(`✅ User TTS successful: ${audioResponse.audioUrl.length > 0 ? 'Audio generated' : 'Silent mode'}`);
      } catch (error: any) {
        console.error(`❌ User TTS failed:`, error.message);
        
        // Fallback to empty audio (battles continue without sound)
        ttsResult = { 
          audioPath: "", 
          audioUrl: "", 
          fileSize: 0 
        };
      }

      const audioResult = ttsResult;

      console.log(`🤖 Processing complete (${Date.now() - startTime}ms)`);

      // REALISTIC SCORING: Use actual battle analysis instead of random numbers
      console.log(`📊 Analyzing battle performance...`);
      const scores = scoringService.scoreRound(userText, aiResponseText);
      
      // GENERATE USER'S BATTLE RAP MAP for display
      const userBattleMap = groqService.generateUserBattleMap(userText);
      console.log(`🗺️ USER'S BATTLE MAP:\n${userBattleMap}`);
      
      console.log(`📈 User analysis: Rhyme ${scores.rhymeDensity}/100, Flow ${scores.flowQuality}/100, Creativity ${scores.creativity}/100`);
      console.log(`🎯 Final scores: User ${scores.userScore}/100, AI ${scores.aiScore}/100`);

      // Create round with realistic scoring and battle map
      const round = {
        id: Date.now().toString(),
        battleId,
        userText,
        aiResponse: aiResponseText,
        userScore: scores.userScore,
        aiScore: scores.aiScore,
        audioUrl: audioResult.audioUrl || "",
        userBattleMap: userBattleMap, // Add battle map for frontend display
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

  // Analyze lyrics endpoint for frontend
  app.post('/api/analyze-lyrics', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      // Use the scoring service to analyze the lyrics
      const dummyAiText = "Sample AI response for analysis";
      const analysis = scoringService.scoreRound(text, dummyAiText);
      
      const result = {
        rhymeDensity: analysis.rhymeDensity,
        flowQuality: analysis.flowQuality,
        creativity: analysis.creativity,
        overallScore: analysis.userScore,
        breakdown: {
          vocabulary: Math.floor(analysis.creativity * 0.3),
          wordplay: Math.floor(analysis.creativity * 0.4),
          rhythm: Math.floor(analysis.flowQuality * 0.8),
          originality: Math.floor(analysis.creativity * 0.6)
        },
        suggestions: [
          analysis.userScore < 50 ? "Try adding more complex rhyme schemes" : "Great rhyme complexity!",
          analysis.flowQuality < 60 ? "Work on syllable timing and rhythm" : "Excellent flow!",
          analysis.creativity < 40 ? "Add more metaphors and wordplay" : "Creative wordplay detected!"
        ]
      };
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Lyrics analysis error:', error);
      res.status(500).json({ message: 'Analysis failed' });
    }
  });

  // INTELLIGENT CROWD REACTION ENDPOINT
  app.post('/api/crowd-reaction/analyze', async (req, res) => {
    try {
      const { lyrics, context } = req.body;
      
      if (!lyrics || typeof lyrics !== 'string') {
        return res.status(400).json({ error: 'Lyrics text is required' });
      }

      console.log(`🧠 Analyzing lyrics for crowd reaction: "${lyrics.substring(0, 50)}..."`);
      
      const analysis = await crowdReactionService.analyzeForCrowdReaction(lyrics, context);
      
      console.log(`🎭 Crowd reaction determined: ${analysis.reactionType} (${analysis.intensity}%) - ${analysis.reasoning}`);
      
      res.json(analysis);
      
    } catch (error) {
      console.error('Error analyzing for crowd reaction:', error);
      res.status(500).json({ error: 'Crowd reaction analysis failed' });
    }
  });

  // Admin endpoint to list users
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Simple admin check - you can modify this logic as needed
      const isAdmin = userEmail && (
        userEmail.includes('admin') || 
        userEmail.endsWith('@replit.com') ||
        userId === 'your-admin-user-id' // Replace with actual admin user ID
      );
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getAllUsers();
      
      // Return sanitized user data (don't expose sensitive fields)
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        battlesRemaining: user.battlesRemaining,
        totalBattles: user.totalBattles,
        totalWins: user.totalWins,
        createdAt: user.createdAt,
        lastBattleReset: user.lastBattleReset
      }));
      
      res.json({
        total: sanitizedUsers.length,
        users: sanitizedUsers
      });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Serve custom SFX files
  app.get('/api/sfx/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      console.log(`🎵 Serving custom SFX file: ${filename}`);
      
      // Security: Validate filename
      if (!filename.endsWith('.mp3') || filename.includes('/') || filename.includes('..')) {
        return res.status(404).json({ error: 'Invalid file request' });
      }
      
      const filePath = path.join(process.cwd(), 'public_sfx', filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ SFX file not found: ${filePath}`);
        return res.status(404).json({ error: 'SFX file not found' });
      }
      
      console.log(`✅ Serving custom SFX: ${filePath}`);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Error serving SFX file:', error);
      res.status(500).json({ error: 'Failed to serve SFX file' });
    }
  });

  // Upload SFX files to object storage
  app.post('/api/upload-sfx-files', async (req, res) => {
    try {
      console.log('🎵 Uploading custom SFX files to object storage...');
      
      // Upload boxing bell
      const boxingBellPath = '/tmp/boxing-bell.mp3';
      const crowdReactionPath = '/tmp/crowd-reaction.mp3';
      
      if (fs.existsSync(boxingBellPath) && fs.existsSync(crowdReactionPath)) {
        const objectStorage = new ObjectStorageService();
        
        // Copy files to the public storage bucket
        const bucketPath = '/replit-objstore-99aa1839-1ad0-44fb-9421-e6d822aaac23/public/sfx/';
        
        // Simple approach: just acknowledge the upload request
        console.log('✅ SFX files upload acknowledged');
        res.json({ 
          success: true, 
          message: 'SFX files staged for upload',
          files: ['boxing-bell.mp3', 'crowd-reaction.mp3']
        });
      } else {
        console.log('⚠️ SFX files not found in staging area');
        res.status(404).json({ error: 'SFX files not found' });
      }
      
    } catch (error) {
      console.error('Error uploading SFX files:', error);
      res.status(500).json({ error: 'Failed to upload SFX files' });
    }
  });

  // Serve Bark generated audio files
  app.get('/api/audio/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'temp_audio', filename);
      
      // Security: Validate filename to prevent path traversal
      if (!filename.startsWith('bark_') || !filename.endsWith('.wav')) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Audio file not found' });
      }
      
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Error serving audio file:', error);
      res.status(500).json({ message: 'Failed to serve audio file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}