/**
 * Core Audio Manager - Singleton AudioContext management for reliable auto-play
 * 
 * This module provides a comprehensive solution for audio auto-play across all platforms,
 * with special handling for mobile browsers and their restrictions.
 */

interface AudioAutoplayManager {
  ensureUnlocked(): Promise<boolean>;
  isUnlocked(): boolean;
  attemptAutoplay(audioElement: HTMLAudioElement, options?: AutoplayOptions): Promise<boolean>;
  getSharedAudioContext(): AudioContext | null;
  onUnlockStateChange(callback: (unlocked: boolean) => void): () => void;
}

interface AutoplayOptions {
  volume?: number;
  retryAttempts?: number;
  fallbackToMuted?: boolean;
  onFallback?: () => void;
}

class CoreAudioManager implements AudioAutoplayManager {
  private static instance: CoreAudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private unlocked = false;
  private unlockPromise: Promise<boolean> | null = null;
  private unlockCallbacks: Set<(unlocked: boolean) => void> = new Set();

  private constructor() {
    this.initializeGlobalListeners();
    this.detectPlatform();
  }

  public static getInstance(): CoreAudioManager {
    if (!CoreAudioManager.instance) {
      CoreAudioManager.instance = new CoreAudioManager();
    }
    return CoreAudioManager.instance;
  }

  private detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    console.log('🎵 AudioManager Platform Detection:', {
      isMobile,
      isIOS,
      isAndroid,
      userAgent: userAgent.substring(0, 50) + '...'
    });

    // Store platform info for later use
    (this as any).platform = { isMobile, isIOS, isAndroid };
  }

  private initializeGlobalListeners() {
    // Listen for first user interaction to unlock audio
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    
    const handleFirstInteraction = () => {
      console.log('🎵 First user interaction detected - attempting audio unlock');
      this.performUnlock();
      
      // Remove listeners after first interaction
      unlockEvents.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction, { capture: true });
      });
    };

    unlockEvents.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { 
        capture: true, 
        once: true,
        passive: true 
      });
    });

    // Handle visibility change for tab focus resumption
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.audioContext?.state === 'suspended') {
        console.log('🎵 Tab focused - resuming audio context');
        this.audioContext.resume().catch(console.warn);
      }
    });
  }

  private async performUnlock(): Promise<void> {
    if (this.unlocked) return;

    try {
      // Create or resume AudioContext
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create silent audio to unlock browser
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);

      // Test with a real audio element
      const testAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSJ+zPLZQAsPALBhJhkxKNLg');
      testAudio.volume = 0;
      await testAudio.play();

      this.unlocked = true;
      console.log('✅ Audio successfully unlocked');
      
      // Notify all callbacks
      this.unlockCallbacks.forEach(callback => callback(true));
      
      // Store unlock state
      localStorage.setItem('audioUnlocked', 'true');

    } catch (error) {
      console.warn('🔊 Audio unlock failed:', error);
      // Don't mark as unlocked if it failed
    }
  }

  public async ensureUnlocked(): Promise<boolean> {
    if (this.unlocked) return true;

    // Check if previously unlocked
    if (localStorage.getItem('audioUnlocked') === 'true') {
      await this.performUnlock();
      return this.unlocked;
    }

    // Return existing promise if unlock is in progress
    if (this.unlockPromise) {
      return this.unlockPromise;
    }

    this.unlockPromise = new Promise((resolve) => {
      // Wait for user interaction
      const handleInteraction = () => {
        this.performUnlock().then(() => resolve(this.unlocked));
      };

      // Set up one-time listeners
      ['touchstart', 'click', 'keydown'].forEach(event => {
        document.addEventListener(event, handleInteraction, { once: true });
      });

      // Timeout after 30 seconds
      setTimeout(() => resolve(false), 30000);
    });

    return this.unlockPromise;
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public getSharedAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public onUnlockStateChange(callback: (unlocked: boolean) => void): () => void {
    this.unlockCallbacks.add(callback);
    
    // Return cleanup function
    return () => {
      this.unlockCallbacks.delete(callback);
    };
  }

  public async attemptAutoplay(
    audioElement: HTMLAudioElement, 
    options: AutoplayOptions = {}
  ): Promise<boolean> {
    const {
      volume = 1.0,
      retryAttempts = 3,
      fallbackToMuted = true,
      onFallback
    } = options;

    console.log('🎵 Attempting comprehensive autoplay...', {
      volume,
      retryAttempts,
      fallbackToMuted,
      currentlyUnlocked: this.unlocked,
      audioContextState: this.audioContext?.state
    });

    // Mobile optimizations
    const platform = (this as any).platform || {};
    if (platform.isMobile) {
      audioElement.setAttribute('playsinline', 'true');
      audioElement.setAttribute('webkit-playsinline', 'true');
      
      if (platform.isIOS) {
        audioElement.setAttribute('preload', 'metadata');
      }
    }

    // Strategy 1: Direct play attempt (works if audio is unlocked)
    audioElement.volume = volume;
    try {
      await audioElement.play();
      console.log('✅ Direct autoplay successful');
      return true;
    } catch (directError) {
      console.log('🔄 Direct autoplay failed, trying mobile-optimized approach...');
    }

    // Strategy 2: Mobile-optimized muted start
    if (fallbackToMuted && platform.isMobile) {
      try {
        audioElement.muted = true;
        audioElement.volume = volume;
        
        await audioElement.play();
        
        // Gradually unmute for smooth transition
        setTimeout(() => {
          audioElement.muted = false;
          console.log('📱 Mobile autoplay successful with muted start');
        }, 100);
        
        return true;
      } catch (mutedError) {
        console.log('📱 Muted autoplay also failed');
      }
    }

    // Strategy 3: Retry with context resume
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        await audioElement.play();
        console.log('✅ Autoplay successful after context resume');
        return true;
      } catch (resumeError) {
        console.log('🔄 Context resume autoplay failed');
      }
    }

    // Strategy 4: Progressive retry attempts
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, attempt * 100));
        await audioElement.play();
        console.log(`✅ Autoplay successful on attempt ${attempt}`);
        return true;
      } catch (retryError) {
        console.log(`🔄 Retry attempt ${attempt} failed`);
      }
    }

    // All strategies failed - call fallback
    console.log('🚨 All autoplay strategies failed - user interaction required');
    onFallback?.();
    return false;
  }
}

// Export singleton instance
export const audioManager = CoreAudioManager.getInstance();

// Convenience functions
export const ensureAudioUnlocked = () => audioManager.ensureUnlocked();
export const isAudioUnlocked = () => audioManager.isUnlocked();
export const attemptAutoplay = (audio: HTMLAudioElement, options?: AutoplayOptions) => 
  audioManager.attemptAutoplay(audio, options);
export const getSharedAudioContext = () => audioManager.getSharedAudioContext();
export const onAudioUnlockStateChange = (callback: (unlocked: boolean) => void) => 
  audioManager.onUnlockStateChange(callback);