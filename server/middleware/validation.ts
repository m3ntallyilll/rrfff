import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Audio file validation
export const validateAudioUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Audio file is required' });
  }

  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp3',
    'audio/mp4',
    'audio/webm',
    'audio/ogg'
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      message: 'Invalid audio format. Supported formats: MP3, WAV, MP4, WebM, OGG' 
    });
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      message: 'Audio file too large. Maximum size: 10MB' 
    });
  }

  next();
};

// Battle creation validation
export const validateBattleCreation = (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    characterId: z.string().min(1, 'Character ID is required'),
    difficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
    profanityFilter: z.boolean().optional().default(false),
    lyricComplexity: z.number().min(0).max(100).optional(),
    styleIntensity: z.number().min(0).max(100).optional(),
    voiceSpeed: z.number().min(0.5).max(2.0).optional(),
    customSettings: z.object({
      aiAggressiveness: z.number().min(0).max(100).optional(),
      responseTime: z.number().min(1000).max(10000).optional(),
      analysisDepth: z.enum(['basic', 'enhanced', 'expert']).optional(),
      voiceSpeed: z.number().min(0.5).max(2.0).optional(),
      battleLength: z.number().min(3).max(10).optional()
    }).optional().default({})
  });

  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

// Payment validation
export const validatePayment = (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    tier: z.enum(['premium', 'pro']).optional(),
    battleCount: z.number().min(1).max(100).optional(),
    paymentMethod: z.enum(['stripe', 'cashapp']).default('stripe')
  });

  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid payment data',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

// API key validation
export const validateAPIKeys = (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    openaiApiKey: z.string().min(1, 'OpenAI API key is required').regex(/^sk-/, 'Invalid OpenAI API key format').optional(),
    groqApiKey: z.string().min(1, 'Groq API key is required').regex(/^gsk_/, 'Invalid Groq API key format').optional(),
    preferredTtsService: z.enum(['openai', 'groq', 'typecast', 'bark']).default('openai')
  });

  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid API keys',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

// Tournament validation
export const validateTournament = (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    name: z.string().min(1, 'Tournament name is required').max(100, 'Tournament name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    maxParticipants: z.number().min(4).max(64, 'Max participants must be between 4 and 64'),
    entryFee: z.number().min(0, 'Entry fee cannot be negative').optional(),
    prizePool: z.number().min(0, 'Prize pool cannot be negative').optional(),
    rules: z.string().max(1000, 'Rules too long').optional(),
    difficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
    format: z.enum(['single_elimination', 'double_elimination', 'round_robin']).default('single_elimination')
  });

  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid tournament data',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

// Generic validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};