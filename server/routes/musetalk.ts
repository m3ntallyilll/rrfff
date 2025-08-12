import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { museTalkService } from '../services/musetalkService';
import { BATTLE_CHARACTERS } from '../../shared/characters';

const router = Router();

/**
 * Initialize MuseTalk service
 * POST /api/musetalk/init
 */
router.post('/init', async (req, res) => {
  try {
    const initialized = await museTalkService.initialize();
    
    res.json({
      success: initialized,
      status: museTalkService.getStatus()
    });
  } catch (error) {
    console.error('MuseTalk initialization error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get MuseTalk service status
 * GET /api/musetalk/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: museTalkService.getStatus()
  });
});

/**
 * Prepare character avatar for lip sync
 * POST /api/musetalk/prepare/:characterId
 */
router.post('/prepare/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    
    const character = BATTLE_CHARACTERS.find((c) => c.id === characterId);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    const result = await museTalkService.prepareAvatar(character);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Avatar preparation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate lip-synced video for character
 * POST /api/musetalk/generate
 * Body: { characterId, audioPath, outputPath? }
 */
router.post('/generate', async (req, res) => {
  try {
    const { characterId, audioPath, outputPath } = req.body;

    if (!characterId || !audioPath) {
      return res.status(400).json({
        success: false,
        error: 'characterId and audioPath are required'
      });
    }

    const character = BATTLE_CHARACTERS.find((c) => c.id === characterId);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    // Generate output path if not provided
    const finalOutputPath = outputPath || path.join(
      process.cwd(),
      'server/public/videos',
      `${characterId}_${Date.now()}.mp4`
    );

    // Ensure output directory exists
    await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });

    let result;
    
    if (museTalkService.isAvailable()) {
      // Use MuseTalk for advanced lip sync
      result = await museTalkService.generateLipSyncVideo(
        character,
        audioPath,
        finalOutputPath
      );
    } else {
      // Fallback to static video
      result = await museTalkService.createFallbackVideo(
        character,
        audioPath,
        finalOutputPath
      );
    }

    if (result.success) {
      res.json({
        ...result,
        videoUrl: `/videos/${path.basename(finalOutputPath)}`
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate lip-synced video for battle round
 * POST /api/musetalk/battle/:battleId/:roundId
 */
router.post('/battle/:battleId/:roundId', async (req, res) => {
  try {
    const { battleId, roundId } = req.params;
    const { characterId } = req.body;

    // This would integrate with the battle system to automatically
    // generate lip-synced videos for AI responses
    
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Battle video generation not yet implemented',
      battleId,
      roundId,
      characterId
    });
  } catch (error) {
    console.error('Battle video generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;