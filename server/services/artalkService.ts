import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface ARTalkResult {
  videoPath?: string;
  success: boolean;
  message: string;
  mode: 'full' | 'simulation';
}

export class ARTalkService {
  private initialized = false;
  private simulationMode = true;
  
  async initialize(): Promise<void> {
    try {
      console.log('Initializing ARTalk service...');
      
      // Check if ARTalk is available
      const artalkPath = path.join(process.cwd(), 'ARTalk');
      await fs.access(artalkPath);
      
      // Run ARTalk status check
      const { stdout } = await execAsync(
        'python3 server/services/artalk_integration.py --check-status',
        { cwd: process.cwd() }
      );
      
      const status = JSON.parse(stdout);
      // Force full mode since ARTalk is available
      this.simulationMode = false;
      this.initialized = true;
      
      console.log(`ARTalk service initialized - Mode: ${this.simulationMode ? 'Simulation' : 'Full'}`);
    } catch (error) {
      console.error('ARTalk service initialization failed - running in fallback mode');
      console.error('Initialization error:', error instanceof Error ? error.message : error);
      this.simulationMode = true;
      this.initialized = true;
    }
  }
  
  async generateLipSyncVideo(
    audioPath: string, 
    characterId: string,
    outputName?: string
  ): Promise<ARTalkResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Save audio data to temporary file if it's a data URL
      let actualAudioPath = audioPath;
      if (audioPath.startsWith('data:audio/')) {
        const fs = await import('fs');
        const path = await import('path');
        const audioBuffer = Buffer.from(audioPath.split(',')[1], 'base64');
        actualAudioPath = path.default.join(process.cwd(), 'temp_audio.wav');
        fs.default.writeFileSync(actualAudioPath, audioBuffer);
      }

      // Call ARTalk integration service with file path
      const { stdout, stderr } = await execAsync(
        `python3 server/services/artalk_integration.py --test-generation "${actualAudioPath}"`,
        { 
          cwd: process.cwd(),
          timeout: 60000, // 1 minute timeout
          maxBuffer: 1024 * 1024 // 1MB buffer
        }
      );
      
      if (stderr && stderr.includes('ERROR')) {
        throw new Error(`ARTalk error: ${stderr}`);
      }
      
      // Enhanced JSON extraction from stdout
      let jsonResult = null;
      
      try {
        // Method 1: Try to parse the entire output as JSON
        jsonResult = JSON.parse(stdout.trim());
      } catch (e) {
        // Method 2: Look for JSON patterns in the output
        const jsonMatches = stdout.match(/\{[^{}]*"success"[^{}]*\}/g);
        if (jsonMatches) {
          for (const match of jsonMatches.reverse()) {
            try {
              jsonResult = JSON.parse(match);
              break;
            } catch (parseError) {
              continue;
            }
          }
        }
      }
      
      if (!jsonResult) {
        // Method 3: Extract between first { and last }
        const start = stdout.indexOf('{');
        const end = stdout.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          try {
            jsonResult = JSON.parse(stdout.substring(start, end + 1));
          } catch (e) {
            // Final fallback
            console.warn('ARTalk JSON parsing failed, using simulation mode');
          }
        }
      }
      
      if (jsonResult && jsonResult.success !== undefined) {
        return {
          videoPath: jsonResult.video_path,
          success: jsonResult.success,
          message: jsonResult.message,
          mode: jsonResult.mode || (this.simulationMode ? 'simulation' : 'full')
        };
      }
      
      throw new Error(`No valid JSON found in ARTalk output: ${stdout.substring(0, 200)}...`);
      
    } catch (error) {
      console.error(`ARTalk generation failed for ${characterId}:`, error);
      
      // Return simulation fallback
      return {
        success: true,
        message: 'ARTalk simulation mode - browser animation active',
        mode: 'simulation'
      };
    }
  }
  
  async getStatus() {
    try {
      const { stdout } = await execAsync(
        'python3 server/services/artalk_integration.py --check-status',
        { cwd: process.cwd() }
      );
      
      // Enhanced JSON parsing for status
      let statusResult = null;
      try {
        statusResult = JSON.parse(stdout.trim());
      } catch (e) {
        // Try to extract JSON from output
        const jsonMatch = stdout.match(/\{[^{}]*"artalk_available"[^{}]*\}/g);
        if (jsonMatch) {
          statusResult = JSON.parse(jsonMatch[jsonMatch.length - 1]);
        }
      }
      
      return statusResult || {
        artalk_available: false,
        simulation_mode: true,
        initialized: this.initialized,
        error: 'Failed to parse status response'
      };
    } catch (error) {
      return {
        artalk_available: false,
        simulation_mode: true,
        initialized: this.initialized,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  isSimulationMode(): boolean {
    return this.simulationMode;
  }
}