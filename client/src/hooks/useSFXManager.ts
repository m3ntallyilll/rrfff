import { useState, useRef, useCallback, useEffect } from 'react';

interface SFXConfig {
  crowdReactions: {
    enabled: boolean;
    volume: number;
    reactionTypes: string[];
  };
  roundBell: {
    enabled: boolean;
    volume: number;
    bellType: 'boxing' | 'tournament' | 'classic';
  };
  endingEffects: {
    enabled: boolean;
    volume: number;
    effectTypes: string[];
  };
}

interface SFXManagerHook {
  playRoundStartBell: () => void;
  playCrowdReaction: (intensity?: 'mild' | 'medium' | 'wild') => void;
  playEndingEffect: (type?: 'victory' | 'defeat' | 'draw') => void;
  stopAllSFX: () => void;
  config: SFXConfig;
  updateConfig: (newConfig: Partial<SFXConfig>) => void;
  isPlaying: boolean;
  currentlyPlaying: string | null;
  enableRealtimeCrowdReactions: (enabled: boolean) => void;
  triggerCrowdOnSpeech: () => void;
}

export function useSFXManager(): SFXManagerHook {
  const [config, setConfig] = useState<SFXConfig>({
    crowdReactions: {
      enabled: true,
      volume: 0.7,
      reactionTypes: ['cheer', 'wild', 'hype', 'reaction', 'crowd-going-wild']
    },
    roundBell: {
      enabled: true,
      volume: 0.8,
      bellType: 'boxing'
    },
    endingEffects: {
      enabled: true,
      volume: 0.9,
      effectTypes: ['airhorn-long', 'airhorn-triple', 'dj-airhorn', 'victory-horn']
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [realtimeCrowdEnabled, setRealtimeCrowdEnabled] = useState(true);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const crowdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechDetectionRef = useRef<boolean>(false);

  // Create Web Audio API context for programmatic sound generation
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize Web Audio API
  useEffect(() => {
    const initializeWebAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🔊 Web Audio API initialized for SFX generation');
      } catch (error) {
        console.warn('⚠️ Web Audio API not supported, SFX disabled');
      }
    };
    
    initializeWebAudio();
  }, []);

  // Play audio files from object storage or fallback to Web Audio API
  const playAudioFile = useCallback(async (type: string, volume: number) => {
    console.log(`🔊 Playing SFX: ${type} at volume ${volume}`);
    setIsPlaying(true);
    setCurrentlyPlaying(type);

    // Try to load from object storage first
    let audioUrl = '';
    
    switch (type) {
      case 'round-bell':
        audioUrl = '/public-objects/sfx/boxing-bell.mp3';
        break;
      case 'crowd-mild':
      case 'crowd-medium':
      case 'crowd-wild':
        audioUrl = '/public-objects/sfx/crowd-reaction.mp3';
        break;
      case 'ending-victory':
      case 'ending-defeat':
      case 'ending-draw':
        audioUrl = '/public-objects/sfx/air-horn.mp3';
        break;
    }

    try {
      // Try to play the uploaded audio file
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        console.log(`✅ SFX completed: ${type}`);
      };
      
      audio.onerror = () => {
        console.log(`⚠️ Audio file not found: ${audioUrl}, falling back to generated sound`);
        generateFallbackSFX(type, volume);
      };
      
      await audio.play();
      
    } catch (error) {
      console.log(`⚠️ Failed to play audio file, using fallback sound`);
      generateFallbackSFX(type, volume);
    }
  }, []);

  // Fallback Web Audio API generation
  const generateFallbackSFX = useCallback((type: string, volume: number) => {
    if (!audioContextRef.current) {
      console.warn('⚠️ Web Audio API not available');
      return;
    }

    const ctx = audioContextRef.current;
    const duration = type.includes('bell') ? 0.8 : type.includes('crowd') ? 1.5 : 2.0;

    if (type === 'round-bell') {
      // Boxing bell: metallic ring
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
      
    } else if (type.includes('crowd')) {
      // Crowd noise: filtered white noise
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
      
      gainNode.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      source.start(ctx.currentTime);
      
    } else if (type.includes('ending')) {
      // Air horn: harsh harmonic tone
      const oscillator1 = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator1.frequency.value = 440;
      oscillator2.frequency.value = 880;
      oscillator1.type = 'sawtooth';
      oscillator2.type = 'square';
      
      gainNode.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator1.start(ctx.currentTime);
      oscillator2.start(ctx.currentTime);
      oscillator1.stop(ctx.currentTime + duration);
      oscillator2.stop(ctx.currentTime + duration);
    }

    // Reset playing state after duration
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentlyPlaying(null);
      console.log(`✅ SFX completed: ${type} (fallback)`);
    }, duration * 1000);
  }, []);

  const playRoundStartBell = useCallback(() => {
    if (!config.roundBell.enabled) return;
    console.log('🔔 Playing round start bell');
    playAudioFile('round-bell', config.roundBell.volume);
  }, [config.roundBell, playAudioFile]);

  const playCrowdReaction = useCallback((intensity: 'mild' | 'medium' | 'wild' = 'medium') => {
    if (!config.crowdReactions.enabled) return;
    
    console.log(`👥 Playing crowd reaction: ${intensity}`);
    playAudioFile(`crowd-${intensity}`, config.crowdReactions.volume);
  }, [config.crowdReactions, playAudioFile]);

  const playEndingEffect = useCallback((type: 'victory' | 'defeat' | 'draw' = 'victory') => {
    if (!config.endingEffects.enabled) return;
    
    console.log(`🏁 Playing ending effect: ${type}`);
    playAudioFile(`ending-${type}`, config.endingEffects.volume);
  }, [config.endingEffects, playAudioFile]);

  const stopAllSFX = useCallback(() => {
    console.log('🔇 Stopping all SFX');
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setIsPlaying(false);
    setCurrentlyPlaying(null);
    
    if (crowdTimerRef.current) {
      clearInterval(crowdTimerRef.current);
      crowdTimerRef.current = null;
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<SFXConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
    console.log('🔧 SFX config updated:', newConfig);
  }, []);

  // Real-time crowd reaction system
  const enableRealtimeCrowdReactions = useCallback((enabled: boolean) => {
    setRealtimeCrowdEnabled(enabled);
    
    if (enabled && config.crowdReactions.enabled) {
      console.log('🎤 Real-time crowd reactions enabled');
      // Set up interval for random crowd reactions during user speech
      crowdTimerRef.current = setInterval(() => {
        if (speechDetectionRef.current && Math.random() < 0.3) { // 30% chance during speech
          playCrowdReaction('medium');
        }
      }, 2000); // Check every 2 seconds
    } else {
      console.log('🔇 Real-time crowd reactions disabled');
      if (crowdTimerRef.current) {
        clearInterval(crowdTimerRef.current);
        crowdTimerRef.current = null;
      }
    }
  }, [config.crowdReactions.enabled, playCrowdReaction]);

  const triggerCrowdOnSpeech = useCallback(() => {
    speechDetectionRef.current = true;
    
    // Trigger immediate crowd reaction when user starts speaking
    if (realtimeCrowdEnabled && config.crowdReactions.enabled) {
      setTimeout(() => {
        playCrowdReaction('mild');
      }, 1000); // Slight delay for natural feel
    }
    
    // Reset speech detection after 5 seconds
    setTimeout(() => {
      speechDetectionRef.current = false;
    }, 5000);
  }, [realtimeCrowdEnabled, config.crowdReactions.enabled, playCrowdReaction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSFX();
    };
  }, [stopAllSFX]);

  return {
    playRoundStartBell,
    playCrowdReaction,
    playEndingEffect,
    stopAllSFX,
    config,
    updateConfig,
    isPlaying,
    currentlyPlaying,
    enableRealtimeCrowdReactions,
    triggerCrowdOnSpeech
  };
}