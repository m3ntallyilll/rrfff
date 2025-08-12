import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { BattleCharacter } from '../../shared/characters';

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
    this.servicePath = path.join(__dirname, 'musetalk.py');
  }

  /**
   * Initialize MuseTalk models (one-time setup)
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing MuseTalk service...');
      
      const { stdout } = await execAsync(`${this.pythonPath} ${this.servicePath} init`);
      const result = JSON.parse(stdout.trim());
      
      this.initialized = result.success;
      
      if (this.initialized) {
        console.log('MuseTalk service initialized successfully');
      } else {
        console.warn('MuseTalk service initialization failed - running in fallback mode');
      }
      
      return this.initialized;
    } catch (error) {
      console.error('MuseTalk initialization error:', error);
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
        `${this.pythonPath} ${this.servicePath} prepare --avatar-id "${avatarId}" --image-path "${imagePath}"`
      );

      const result = JSON.parse(stdout.trim()) as AvatarPrepResult;
      
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
        `${this.pythonPath} ${this.servicePath} generate --avatar-id "${avatarId}" --audio-path "${audioPath}" --output-path "${outputPath}"`
      );

      const result = JSON.parse(stdout.trim()) as MuseTalkResult;
      
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
   * Get status of MuseTalk service
   */
  getStatus() {
    return {
      initialized: this.initialized,
      preparedAvatars: Array.from(this.preparedAvatars),
      pythonPath: this.pythonPath,
      servicePath: this.servicePath
    };
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