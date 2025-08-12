import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { groqService } from "./services/groq";
import { typecastService } from "./services/typecast";
import { scoringService } from "./services/scoring";
import { FineTuningService } from "./services/fine-tuning";
import { insertBattleSchema, insertBattleRoundSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const fineTuningService = new FineTuningService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new battle
  app.post("/api/battles", async (req, res) => {
    try {
      const battleData = insertBattleSchema.parse(req.body);
      const battle = await storage.createBattle(battleData);
      res.json(battle);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create battle",
        error: "BATTLE_CREATION_FAILED"
      });
    }
  });

  // Get battle by ID
  app.get("/api/battles/:id", async (req, res) => {
    try {
      const battle = await storage.getBattle(req.params.id);
      if (!battle) {
        return res.status(404).json({ 
          message: "Battle not found",
          error: "BATTLE_NOT_FOUND"
        });
      }
      res.json(battle);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch battle",
        error: "BATTLE_FETCH_FAILED"
      });
    }
  });

  // Get battle state
  app.get("/api/battles/:id/state", async (req, res) => {
    try {
      const state = await storage.getBattleState(req.params.id);
      if (!state) {
        return res.status(404).json({ 
          message: "Battle state not found",
          error: "BATTLE_STATE_NOT_FOUND"
        });
      }
      res.json(state);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch battle state",
        error: "BATTLE_STATE_FETCH_FAILED"
      });
    }
  });

  // Update battle state
  app.patch("/api/battles/:id/state", async (req, res) => {
    try {
      const state = await storage.updateBattleState(req.params.id, req.body);
      if (!state) {
        return res.status(404).json({ 
          message: "Battle state not found",
          error: "BATTLE_STATE_NOT_FOUND"
        });
      }
      res.json(state);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update battle state",
        error: "BATTLE_STATE_UPDATE_FAILED"
      });
    }
  });

  // Transcribe audio
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          message: "No audio file provided",
          error: "MISSING_AUDIO_FILE"
        });
      }

      const transcript = await groqService.transcribeAudio(req.file.buffer);
      res.json({ transcript });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Transcription failed",
        error: "TRANSCRIPTION_FAILED"
      });
    }
  });

  // Generate AI rap response
  app.post("/api/generate-rap", async (req, res) => {
    try {
      const { userVerse, difficulty = "normal", profanityFilter = true } = req.body;
      
      if (!userVerse) {
        return res.status(400).json({ 
          message: "User verse is required",
          error: "MISSING_USER_VERSE"
        });
      }

      const aiVerse = await groqService.generateRapResponse(
        userVerse, 
        difficulty, 
        profanityFilter
      );
      
      res.json({ aiVerse });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate rap",
        error: "RAP_GENERATION_FAILED"
      });
    }
  });

  // Generate TTS audio
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "hardcore-mc" } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          message: "Text is required for TTS",
          error: "MISSING_TEXT"
        });
      }

      const result = await typecastService.generateSpeech(text, voice);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "TTS generation failed",
        error: "TTS_GENERATION_FAILED"
      });
    }
  });

  // Process complete battle round
  app.post("/api/battles/:id/rounds", upload.single("audio"), async (req, res) => {
    try {
      const battleId = req.params.id;
      const battle = await storage.getBattle(battleId);
      
      if (!battle) {
        return res.status(404).json({ 
          message: "Battle not found",
          error: "BATTLE_NOT_FOUND"
        });
      }

      let userVerse = "";
      
      // Transcribe audio if provided
      if (req.file) {
        userVerse = await groqService.transcribeAudio(req.file.buffer);
      } else if (req.body.userVerse) {
        userVerse = req.body.userVerse;
      } else {
        return res.status(400).json({ 
          message: "Either audio file or user verse is required",
          error: "MISSING_INPUT"
        });
      }

      // Generate AI response
      const aiVerse = await groqService.generateRapResponse(
        userVerse,
        battle.difficulty,
        battle.profanityFilter
      );

      // Generate TTS for AI response
      const ttsResult = await typecastService.generateSpeech(aiVerse);

      // Calculate scores
      const scores = scoringService.scoreRound(userVerse, aiVerse);

      // Get current rounds to determine round number
      const existingRounds = await storage.getBattleRounds(battleId);
      const roundNumber = existingRounds.length + 1;

      // Create battle round
      const roundData = {
        battleId,
        roundNumber,
        userVerse,
        aiVerse,
        userAudioUrl: null, // Could store uploaded audio URL
        aiAudioUrl: ttsResult.audioUrl,
        scores,
      };

      const battleRound = await storage.createBattleRound(roundData);

      // Update battle scores
      const newUserScore = battle.userScore + scores.userScore;
      const newAiScore = battle.aiScore + scores.aiScore;

      await storage.updateBattle(battleId, {
        userScore: newUserScore,
        aiScore: newAiScore,
      });

      // Update battle state
      await storage.updateBattleState(battleId, {
        currentRound: roundNumber + 1,
        userScore: newUserScore,
        aiScore: newAiScore,
        isAIResponding: false,
      });

      res.json({
        round: battleRound,
        aiAudioUrl: ttsResult.audioUrl,
        scores,
        battleState: {
          userScore: newUserScore,
          aiScore: newAiScore,
          currentRound: roundNumber + 1,
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process battle round",
        error: "BATTLE_ROUND_FAILED"
      });
    }
  });

  // Get battle history
  app.get("/api/battles", async (req, res) => {
    try {
      const battles = await storage.getAllBattles();
      res.json(battles);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch battle history",
        error: "BATTLE_HISTORY_FETCH_FAILED"
      });
    }
  });

  // Get battle rounds
  app.get("/api/battles/:id/rounds", async (req, res) => {
    try {
      const rounds = await storage.getBattleRounds(req.params.id);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch battle rounds",
        error: "BATTLE_ROUNDS_FETCH_FAILED"
      });
    }
  });

  // Get available TTS voices
  app.get("/api/voices", async (req, res) => {
    try {
      const voices = await typecastService.getVoices();
      res.json(voices);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch available voices",
        error: "VOICES_FETCH_FAILED"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
