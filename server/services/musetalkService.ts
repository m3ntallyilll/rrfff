import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BattleCharacter } from '../../shared/characters';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

export interface MuseTalkResult {
  success: boolean;
  error?: string;
  videoPath?: string;
  duration?: number;
  method?: string;
}

export interface AvatarPrepResult {
  success: boolean;
  error?: string;
  avatarId?: string;
  info?: any;
}

/**
 * MuseTalk Integration Service
 * Provides real-time lip sync video generation for rap battle characters
 */
export class MuseTalkService {
  private pythonPath: string;
  private servicePath: string;
  private initialized = false;
  private preparedAvatars = new Set<string>();

  constructor() {
    this.pythonPath = 'python3'; // Could be configured based on environment
    this.servicePath = path.join(__dirname, 'musetalk_integration.py');
  }

  /**
   * Initialize MuseTalk models (one-time setup)
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing MuseTalk service...');
      
      const { stdout, stderr } = await execAsync(`${this.pythonPath} ${this.servicePath} --initialize`);
      
      // Check if initialization was successful
      if (stdout.includes('SUCCESS')) {
        this.initialized = true;
        console.log('MuseTalk service initialized successfully');
      } else {
        this.initialized = false;
        console.warn('MuseTalk service initialization failed - running in fallback mode');
        if (stderr) console.warn('Initialization error:', stderr);
      }
      
      return this.initialized;
    } catch (error) {
      console.error('MuseTalk initialization error:', error);
      // Don't fail completely - allow fallback functionality
      this.initialized = false;
      return false;
    }
  }

  /**
   * Prepare character avatar for lip sync processing
   */
  async prepareAvatar(character: BattleCharacter): Promise<AvatarPrepResult> {
    try {
      if (!character.avatar) {
        return { success: false, error: 'Character has no avatar image' };
      }

      const avatarId = character.id;
      const imagePath = path.join(process.cwd(), 'attached_assets', 'generated_images', character.avatar);

      // Check if image exists
      try {
        await fs.access(imagePath);
      } catch {
        return { success: false, error: `Avatar image not found: ${imagePath}` };
      }

      console.log(`Preparing MuseTalk avatar for ${character.displayName} (${avatarId})`);

      const { stdout } = await execAsync(
        `${this.pythonPath} ${this.servicePath} --prepare-avatar "${avatarId}" "${imagePath}"`
      );

      // Check for success message in stdout
      const result: AvatarPrepResult = {
        success: stdout.includes('SUCCESS'),
        avatarId,
        error: stdout.includes('FAILED') ? 'Avatar preparation failed' : undefined
      };
      
      if (result.success) {
        this.preparedAvatars.add(avatarId);
        console.log(`Avatar ${avatarId} prepared successfully`);
      } else {
        console.error(`Avatar preparation failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('Avatar preparation error:', error);
      return { 
        success: false, 
        error: `Avatar preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Generate lip-synced video for character speaking audio
   */
  async generateLipSyncVideo(
    character: BattleCharacter,
    audioPath: string,
    outputPath: string
  ): Promise<MuseTalkResult> {
    try {
      const avatarId = character.id;

      // Ensure avatar is prepared
      if (!this.preparedAvatars.has(avatarId)) {
        const prepResult = await this.prepareAvatar(character);
        if (!prepResult.success) {
          return { success: false, error: `Avatar preparation failed: ${prepResult.error}` };
        }
      }

      // Check if audio file exists
      try {
        await fs.access(audioPath);
      } catch {
        return { success: false, error: `Audio file not found: ${audioPath}` };
      }

      console.log(`Generating MuseTalk lip sync video for ${character.displayName}`);

      const { stdout } = await execAsync(
        `${this.pythonPath} ${this.servicePath} --generate "${avatarId}" "${audioPath}" "${outputPath}"`
      );

      // Check for success message in stdout
      const result: MuseTalkResult = {
        success: stdout.includes('SUCCESS'),
        videoPath: stdout.includes('SUCCESS') ? outputPath : undefined,
        error: stdout.includes('FAILED') ? 'Video generation failed' : undefined,
        method: 'MuseTalk'
      };
      
      if (result.success) {
        console.log(`Lip sync video generated: ${outputPath} (${result.duration}s)`);
      } else {
        console.error(`Video generation failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('MuseTalk video generation error:', error);
      return { 
        success: false, 
        error: `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Check if MuseTalk is available and functional
   */
  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Get detailed status of MuseTalk service
   */
  async getStatus() {
    try {
      const { stdout } = await execAsync(`${this.pythonPath} ${this.servicePath} --status`);
      const status = JSON.parse(stdout);
      return {
        ...status,
        preparedAvatars: Array.from(this.preparedAvatars),
        pythonPath: this.pythonPath,
        servicePath: this.servicePath
      };
    } catch (error) {
      return {
        initialized: this.initialized,
        modelsAvailable: false,
        device: 'unknown',
        avatarsPrepared: 0,
        preparedAvatars: Array.from(this.preparedAvatars),
        pythonPath: this.pythonPath,
        servicePath: this.servicePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a fallback static video when MuseTalk is not available
   */
  async createFallbackVideo(
    character: BattleCharacter,
    audioPath: string,
    outputPath: string
  ): Promise<MuseTalkResult> {
    try {
      if (!character.avatar) {
        return { success: false, error: 'Character has no avatar for fallback video' };
      }

      const imagePath = path.join(process.cwd(), 'attached_assets', 'generated_images', character.avatar);

      // Create static video with character image and audio
      const cmd = [
        'ffmpeg', '-y',
        '-loop', '1', '-i', `"${imagePath}"`,
        '-i', `"${audioPath}"`,
        '-c:v', 'libx264', '-tune', 'stillimage',
        '-c:a', 'aac', '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        `"${outputPath}"`
      ].join(' ');

      await execAsync(cmd);

      return {
        success: true,
        videoPath: outputPath,
        method: 'fallback_static'
      };
    } catch (error) {
      return {
        success: false,
        error: `Fallback video creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const museTalkService = new MuseTalkService();