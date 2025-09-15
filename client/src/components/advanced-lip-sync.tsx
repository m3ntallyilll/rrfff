// Advanced Lip Sync Component - Provides data only, no visual rendering
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { getSharedAudioContext, attemptAutoplay } from "@/lib/audioAutoplay";

interface AdvancedLipSyncProps {
  audioUrl?: string;
  isPlaying: boolean;
  avatarImageUrl: string;
  onLipSyncData?: (data: LipSyncData) => void;
  disableAudioPlayback?: boolean;
}

interface LipSyncData {
  mouthOpenness: number;
  jawRotation: number;
  lipCornerPull: number;
  tongueTip: number;
  intensity: number;
  time: number;
}

// Viseme mapping for phoneme-based lip sync
const VISEME_MOUTH_SHAPES: Record<string, { openness: number; width: number; height: number }> = {
  'sil': { openness: 0, width: 1, height: 0.2 },     // Silence
  'p': { openness: 0, width: 1, height: 0.3 },       // P, B, M
  'f': { openness: 0.2, width: 1.2, height: 0.4 },   // F, V
  'th': { openness: 0.3, width: 1.1, height: 0.3 },  // TH
  't': { openness: 0.4, width: 1.0, height: 0.5 },   // T, D, N, L
  'k': { openness: 0.3, width: 1.0, height: 0.4 },   // K, G
  's': { openness: 0.2, width: 1.2, height: 0.3 },   // S, Z
  'sh': { openness: 0.4, width: 0.8, height: 0.5 },  // SH, CH, J
  'r': { openness: 0.4, width: 1.1, height: 0.4 },   // R
  'aa': { openness: 0.8, width: 1.3, height: 1.0 },  // AA (father)
  'e': { openness: 0.5, width: 1.2, height: 0.7 },   // E (bed)
  'i': { openness: 0.3, width: 1.4, height: 0.4 },   // I (bit)
  'o': { openness: 0.6, width: 1.0, height: 0.8 },   // O (dog)
  'u': { openness: 0.4, width: 0.8, height: 0.6 },   // U (book)
  'oh': { openness: 0.7, width: 0.9, height: 0.9 },  // OH (boat)
  'uw': { openness: 0.4, width: 0.7, height: 0.6 },  // UW (boot)
};

export function AdvancedLipSync({ 
  audioUrl, 
  isPlaying, 
  avatarImageUrl,
  onLipSyncData,
  disableAudioPlayback = true
}: AdvancedLipSyncProps) {
  const [currentViseme, setCurrentViseme] = useState<string>('sil');
  const [mouthShape, setMouthShape] = useState(VISEME_MOUTH_SHAPES['sil']);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [lipSyncData, setLipSyncData] = useState<LipSyncData>({
    mouthOpenness: 0,
    jawRotation: 0,
    lipCornerPull: 0,
    tongueTip: 0,
    intensity: 0,
    time: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Generate comprehensive lip sync data based on detected phoneme
  const generateLipSyncData = useCallback((phoneme: string, intensity: number): LipSyncData => {
    const shape = VISEME_MOUTH_SHAPES[phoneme] || VISEME_MOUTH_SHAPES['sil'];
    
    return {
      mouthOpenness: shape.openness * (0.7 + intensity * 0.003),
      jawRotation: shape.openness * 2 - 1, // Jaw drops more for open sounds
      lipCornerPull: ['i', 'e'].includes(phoneme) ? 0.5 + intensity * 0.005 : 0.2,
      tongueTip: ['t', 'r', 'th'].includes(phoneme) ? 0.6 + intensity * 0.004 : 0.1,
      intensity: Math.min(100, intensity),
      time: Date.now()
    };
  }, []);

  // Detect phoneme from frequency analysis
  const detectPhonemeFromFrequency = useCallback((frequencies: Uint8Array): string => {
    const lowFreq = frequencies.slice(0, 8).reduce((a, b) => a + b) / 8;
    const midFreq = frequencies.slice(8, 32).reduce((a, b) => a + b) / 24;
    const highFreq = frequencies.slice(32, 64).reduce((a, b) => a + b) / 32;
    
    if (lowFreq + midFreq + highFreq < 30) return 'sil';
    if (highFreq > 100 && midFreq < 80) return 's';  // Sibilants
    if (lowFreq > 120) return 'aa';  // Open vowels
    if (midFreq > 90 && highFreq < 70) return 'o';  // Mid vowels
    if (highFreq > 80) return 'i';  // High vowels
    if (lowFreq > 90 && midFreq > 70) return 'r';  // Liquid consonants
    return 'e'; // Default mid vowel
  }, []);

  // Audio analysis and lip sync processing
  useEffect(() => {
    if (!isPlaying) {
      // Reset to neutral state
      setCurrentViseme('sil');
      setMouthShape(VISEME_MOUTH_SHAPES['sil']);
      setAudioIntensity(0);
      return;
    }
    
    // Initialize audio using shared audio manager when needed
    if (!audioRef.current && audioUrl && isPlaying) {
      console.log('🎵 AdvancedLipSync: Initializing audio with shared manager');
      audioRef.current = new Audio(audioUrl);
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.volume = disableAudioPlayback ? 0 : 1.0;
      
      // Essential mobile attributes
      audioRef.current.setAttribute('playsinline', 'true');
      audioRef.current.setAttribute('webkit-playsinline', 'true');
      
      // Use shared audio manager for auto-play
      if (!disableAudioPlayback) {
        audioRef.current.addEventListener('loadeddata', () => {
          console.log('🔥 AdvancedLipSync: Audio ready - using shared manager for auto-play');
          attemptAutoplay(audioRef.current!, {
            volume: 1.0,
            fallbackToMuted: true,
            retryAttempts: 2,
            onFallback: () => {
              console.log('🔄 AdvancedLipSync: Auto-play failed, continuing with lip sync simulation');
            }
          }).catch(error => {
            console.error('🔊 AdvancedLipSync: Auto-play error:', error);
          });
        });
      }
      
      audioRef.current.load();
    }
  }, [audioUrl, isPlaying]);
  
  // Separate effect for audio analysis to prevent infinite loops
  useEffect(() => {
    if (!audioUrl || !isPlaying) {
      setCurrentViseme('sil');
      setMouthShape(VISEME_MOUTH_SHAPES['sil']);
      setAudioIntensity(0);
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        if (disableAudioPlayback) {
          // Pure visual lip sync without audio playback - simulate based on timing
          const simulateLipSync = () => {
            if (isPlaying) {
              // Simulate mouth movements with randomized patterns
              const time = Date.now() / 100;
              const intensity = (Math.sin(time * 0.5) + 1) * 50;
              const phonemeIndex = Math.floor(time / 5) % Object.keys(VISEME_MOUTH_SHAPES).length;
              const phonemeKeys = Object.keys(VISEME_MOUTH_SHAPES);
              const currentPhoneme = phonemeKeys[phonemeIndex];
              
              setCurrentViseme(currentPhoneme);
              setMouthShape(VISEME_MOUTH_SHAPES[currentPhoneme]);
              setAudioIntensity(intensity);
              
              const lipSync = generateLipSyncData(currentPhoneme, intensity);
              setLipSyncData(lipSync);
              onLipSyncData?.(lipSync);
              
              animationFrameRef.current = requestAnimationFrame(simulateLipSync);
            }
          };
          
          simulateLipSync();
          console.log('MuseTalk-inspired lip sync initialized with simulation mode (no audio duplication)');
          return;
        }

        // Use shared AudioContext for analysis (avoids multiple contexts)
        audioContextRef.current = getSharedAudioContext();
        
        if (!audioContextRef.current) {
          console.warn('🎵 AdvancedLipSync: Shared AudioContext not available, falling back to simulation');
          // Fall back to simulation mode
          const simulateLipSync = () => {
            if (isPlaying) {
              const time = Date.now() / 100;
              const intensity = (Math.sin(time * 0.5) + 1) * 50;
              const phonemeIndex = Math.floor(time / 5) % Object.keys(VISEME_MOUTH_SHAPES).length;
              const phonemeKeys = Object.keys(VISEME_MOUTH_SHAPES);
              const currentPhoneme = phonemeKeys[phonemeIndex];
              
              setCurrentViseme(currentPhoneme);
              setMouthShape(VISEME_MOUTH_SHAPES[currentPhoneme]);
              setAudioIntensity(intensity);
              
              const lipSync = generateLipSyncData(currentPhoneme, intensity);
              setLipSyncData(lipSync);
              onLipSyncData?.(lipSync);
              
              animationFrameRef.current = requestAnimationFrame(simulateLipSync);
            }
          };
          simulateLipSync();
          return;
        }
        
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.volume = disableAudioPlayback ? 0 : 1.0;
          audioRef.current.preload = 'auto';
          audioRef.current.setAttribute('playsinline', 'true');
          audioRef.current.setAttribute('webkit-playsinline', 'true');
        }
        
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        source.connect(analyserRef.current);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const processAudio = () => {
          if (analyserRef.current && isPlaying) {
            analyserRef.current.getByteFrequencyData(dataArray);
            
            const intensity = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioIntensity(intensity);
            
            const detectedPhoneme = detectPhonemeFromFrequency(dataArray);
            
            if (detectedPhoneme !== currentViseme) {
              setCurrentViseme(detectedPhoneme);
              setMouthShape(VISEME_MOUTH_SHAPES[detectedPhoneme]);
            }
            
            const lipSync = generateLipSyncData(detectedPhoneme, intensity);
            setLipSyncData(lipSync);
            onLipSyncData?.(lipSync);
            
            animationFrameRef.current = requestAnimationFrame(processAudio);
          }
        };
        
        if (!disableAudioPlayback && audioRef.current) {
          // Use shared manager for reliable auto-play
          console.log('🔥 AdvancedLipSync: Using shared manager for TTS auto-play');
          attemptAutoplay(audioRef.current, {
            volume: 1.0,
            fallbackToMuted: true,
            retryAttempts: 2,
            onFallback: () => {
              console.log('🔄 AdvancedLipSync: TTS auto-play failed, continuing with analysis');
            }
          }).then(success => {
            if (success) {
              processAudio();
            }
          }).catch(error => {
            console.error('🔊 AdvancedLipSync: TTS auto-play error:', error);
            processAudio(); // Continue with analysis even if autoplay fails
          });
        } else {
          processAudio(); // Start analysis even without audio playback
        }
        
      } catch (error) {
        console.warn('Advanced lip sync setup failed:', error);
        setCurrentViseme('eh');
        setMouthShape(VISEME_MOUTH_SHAPES['e']);
      }
    };
    
    setupAudioAnalysis();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Don't close shared AudioContext - it's managed globally
      audioContextRef.current = null;
      analyserRef.current = null;
      
      if (audioRef.current) {
        const existingAudio = document.querySelector('audio') as HTMLAudioElement;
        if (!existingAudio || audioRef.current !== existingAudio) {
          audioRef.current.pause();
        }
      }
    };
  }, [audioUrl, isPlaying, disableAudioPlayback]); // Removed dependencies causing infinite renders

  // This component only provides data - no visual rendering
  return null;
}