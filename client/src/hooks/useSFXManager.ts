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

  // Preload all SFX audio files
  useEffect(() => {
    const loadAudioFiles = async () => {
      console.log('🔊 Loading SFX audio files...');
      
      // Round Start Bell SFX
      const roundBellAudio = new Audio();
      roundBellAudio.preload = 'auto';
      roundBellAudio.src = '/public-objects/sfx/boxing-bell.mp3'; // Object storage path
      audioRefs.current['round-bell'] = roundBellAudio;

      // Crowd Reaction SFX
      config.crowdReactions.reactionTypes.forEach((reactionType, index) => {
        const crowdAudio = new Audio();
        crowdAudio.preload = 'auto';
        crowdAudio.src = `/public-objects/sfx/crowd-${reactionType}-${index + 1}.mp3`;
        audioRefs.current[`crowd-${reactionType}`] = crowdAudio;
      });

      // Ending Effects SFX  
      config.endingEffects.effectTypes.forEach((effectType, index) => {
        const endingAudio = new Audio();
        endingAudio.preload = 'auto';
        endingAudio.src = `/public-objects/sfx/ending-${effectType}.mp3`;
        audioRefs.current[`ending-${effectType}`] = endingAudio;
      });

      console.log('✅ All SFX audio files loaded successfully');
    };

    loadAudioFiles();
  }, []);

  const playAudio = useCallback(async (audioKey: string, volume: number) => {
    const audio = audioRefs.current[audioKey];
    if (!audio) {
      console.warn(`🔊 Audio file not found: ${audioKey}`);
      return;
    }

    try {
      // Stop current playback
      audio.currentTime = 0;
      audio.volume = volume;
      
      setIsPlaying(true);
      setCurrentlyPlaying(audioKey);
      
      console.log(`🔊 Playing SFX: ${audioKey} at volume ${volume}`);
      await audio.play();
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        console.log(`✅ SFX completed: ${audioKey}`);
      };
      
    } catch (error) {
      console.error(`❌ Failed to play SFX: ${audioKey}`, error);
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    }
  }, []);

  const playRoundStartBell = useCallback(() => {
    if (!config.roundBell.enabled) return;
    console.log('🔔 Playing round start bell');
    playAudio('round-bell', config.roundBell.volume);
  }, [config.roundBell, playAudio]);

  const playCrowdReaction = useCallback((intensity: 'mild' | 'medium' | 'wild' = 'medium') => {
    if (!config.crowdReactions.enabled) return;
    
    // Select appropriate crowd reaction based on intensity
    const reactionTypes = config.crowdReactions.reactionTypes;
    let selectedReaction: string;
    
    switch (intensity) {
      case 'mild':
        selectedReaction = reactionTypes[0] || 'cheer';
        break;
      case 'wild':
        selectedReaction = reactionTypes[reactionTypes.length - 1] || 'wild';
        break;
      default:
        selectedReaction = reactionTypes[Math.floor(reactionTypes.length / 2)] || 'hype';
    }
    
    console.log(`👥 Playing crowd reaction: ${selectedReaction} (${intensity})`);
    playAudio(`crowd-${selectedReaction}`, config.crowdReactions.volume);
  }, [config.crowdReactions, playAudio]);

  const playEndingEffect = useCallback((type: 'victory' | 'defeat' | 'draw' = 'victory') => {
    if (!config.endingEffects.enabled) return;
    
    // Select appropriate ending effect
    const effectTypes = config.endingEffects.effectTypes;
    let selectedEffect: string;
    
    switch (type) {
      case 'victory':
        selectedEffect = effectTypes[0] || 'airhorn-long';
        break;
      case 'defeat':
        selectedEffect = effectTypes[1] || 'airhorn-triple';
        break;
      default:
        selectedEffect = effectTypes[2] || 'dj-airhorn';
    }
    
    console.log(`🏁 Playing ending effect: ${selectedEffect} (${type})`);
    playAudio(`ending-${selectedEffect}`, config.endingEffects.volume);
  }, [config.endingEffects, playAudio]);

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