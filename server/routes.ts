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

      // Get AI character voice ID from battle data
      const aiVoiceId = battle.aiVoiceId || "tc_67d237f1782cabcc6155272f";
      
      // Generate TTS for AI response using character's voice
      const ttsResult = await typecastService.generateSpeech(aiVerse, aiVoiceId);

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

  // MuseTalk integration endpoints
  app.get("/api/musetalk/status", (req, res) => {
    res.json({
      success: true,
      available: false, // Will be true when fully integrated
      message: "MuseTalk integration in development",
      features: [
        "Real-time lip sync processing",
        "Character avatar preparation", 
        "Video generation with audio sync",
        "Multi-character support"
      ]
    });
  });

  // Fine-tuning endpoints
  app.get("/api/fine-tunings", async (req, res) => {
    try {
      const access = await fineTuningService.checkFineTuningAccess();
      if (!access.available) {
        return res.json({ 
          available: false, 
          message: access.message,
          models: []
        });
      }
      
      const models = await fineTuningService.listFineTunings();
      res.json({ 
        available: true, 
        message: "Fine-tuning access confirmed",
        models 
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to check fine-tuning access",
        error: "FINE_TUNING_CHECK_FAILED"
      });
    }
  });

  app.post("/api/fine-tunings", async (req, res) => {
    try {
      const { name, base_model, training_data } = req.body;
      
      // Upload training data first
      const fileId = await fineTuningService.uploadTrainingFile(training_data);
      
      // Create fine-tuning job
      const job = await fineTuningService.createFineTuning({
        name: name || "Custom Rap Model",
        input_file_id: fileId,
        base_model: base_model || "llama-3.1-8b-instant",
        type: "lora"
      });
      
      res.json(job);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create fine-tuning job",
        error: "FINE_TUNING_CREATION_FAILED"
      });
    }
  });

  app.get("/api/fine-tunings/:id", async (req, res) => {
    try {
      const job = await fineTuningService.getFineTuning(req.params.id);
      res.json(job);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get fine-tuning job",
        error: "FINE_TUNING_GET_FAILED"
      });
    }
  });

  app.get("/api/training-data/sample", async (req, res) => {
    try {
      const sampleData = fineTuningService.generateSampleRapData();
      const jsonl = fineTuningService.exportTrainingDataAsJSONL(sampleData);
      
      res.json({
        sample_data: sampleData,
        jsonl_format: jsonl,
        instructions: "Use this format for your training data. Each entry should have prompt, completion, difficulty, and style."
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate sample training data",
        error: "SAMPLE_DATA_FAILED"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
