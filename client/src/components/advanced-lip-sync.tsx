import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface AdvancedLipSyncProps {
  audioUrl?: string;
  isPlaying: boolean;
  avatarImageUrl: string;
  onLipSyncData?: (data: LipSyncData) => void;
}

interface LipSyncData {
  mouthOpenness: number;
  jawRotation: number;
  lipCornerPull: number;
  tongueTip: number;
  intensity: number;
}

interface VisemeData {
  viseme: string;
  time: number;
  intensity: number;
}

// Viseme mapping based on phonetic analysis
const VISEME_MOUTH_SHAPES = {
  'sil': { openness: 0, width: 1, height: 0.2 }, // Silence
  'p': { openness: 0, width: 1, height: 0.3 },   // P, B, M
  'f': { openness: 0.2, width: 1.2, height: 0.4 }, // F, V
  'th': { openness: 0.3, width: 1.1, height: 0.5 }, // TH
  't': { openness: 0.4, width: 1, height: 0.6 },   // T, D, N, L
  'k': { openness: 0.6, width: 1.3, height: 0.7 }, // K, G
  'ch': { openness: 0.3, width: 0.8, height: 0.5 }, // CH, J, SH
  's': { openness: 0.2, width: 1, height: 0.4 },   // S, Z
  'r': { openness: 0.4, width: 0.9, height: 0.6 }, // R
  'aa': { openness: 0.8, width: 1.4, height: 1 },  // AA (hot)
  'ae': { openness: 0.6, width: 1.6, height: 0.8 }, // AE (cat)
  'eh': { openness: 0.5, width: 1.3, height: 0.7 }, // EH (bed)
  'ih': { openness: 0.3, width: 1.1, height: 0.5 }, // IH (bit)
  'oh': { openness: 0.7, width: 0.9, height: 0.9 }, // OH (boat)
  'uw': { openness: 0.4, width: 0.7, height: 0.6 }, // UW (boot)
};

export function AdvancedLipSync({ 
  audioUrl, 
  isPlaying, 
  avatarImageUrl,
  onLipSyncData 
}: AdvancedLipSyncProps) {
  const [currentViseme, setCurrentViseme] = useState<string>('sil');
  const [mouthShape, setMouthShape] = useState(VISEME_MOUTH_SHAPES['sil']);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [lipSyncData, setLipSyncData] = useState<LipSyncData>({
    mouthOpenness: 0,
    jawRotation: 0,
    lipCornerPull: 0,
    tongueTip: 0,
    intensity: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Advanced phoneme detection from frequency analysis
  const detectPhonemeFromFrequency = useCallback((frequencyData: Uint8Array): string => {
    const lowFreq = frequencyData.slice(0, 8).reduce((a, b) => a + b) / 8;
    const midFreq = frequencyData.slice(8, 20).reduce((a, b) => a + b) / 12;
    const highFreq = frequencyData.slice(20, 32).reduce((a, b) => a + b) / 12;
    
    const total = lowFreq + midFreq + highFreq;
    if (total < 30) return 'sil';
    
    // Advanced phoneme classification based on frequency distribution
    if (highFreq > midFreq && highFreq > lowFreq) {
      if (highFreq > 120) return 's';
      if (highFreq > 100) return 'f';
      return 'th';
    } else if (midFreq > lowFreq) {
      if (midFreq > 140) return 'eh';
      if (midFreq > 120) return 'ih';
      return 't';
    } else {
      if (lowFreq > 140) return 'aa';
      if (lowFreq > 120) return 'oh';
      if (lowFreq > 100) return 'ae';
      return 'uw';
    }
  }, []);

  // Generate realistic lip sync data
  const generateLipSyncData = useCallback((viseme: string, intensity: number): LipSyncData => {
    const baseShape = VISEME_MOUTH_SHAPES[viseme] || VISEME_MOUTH_SHAPES['sil'];
    const normalizedIntensity = Math.min(intensity / 255, 1);
    
    return {
      mouthOpenness: baseShape.openness * normalizedIntensity,
      jawRotation: baseShape.openness * 15 * normalizedIntensity, // degrees
      lipCornerPull: (baseShape.width - 1) * normalizedIntensity,
      tongueTip: viseme === 't' || viseme === 'r' ? normalizedIntensity * 0.8 : 0,
      intensity: normalizedIntensity
    };
  }, []);

  // Audio analysis and lip sync processing
  useEffect(() => {
    if (!audioUrl || !isPlaying) {
      setCurrentViseme('sil');
      setMouthShape(VISEME_MOUTH_SHAPES['sil']);
      setAudioIntensity(0);
      return;
    }

    const setupAudioAnalysis = async () => {
      try {
        audioRef.current = new Audio(audioUrl);
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128; // Higher resolution for better phoneme detection
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const processAudio = () => {
          if (analyserRef.current && isPlaying) {
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate overall intensity
            const intensity = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioIntensity(intensity);
            
            // Detect phoneme from frequency analysis
            const detectedPhoneme = detectPhonemeFromFrequency(dataArray);
            
            if (detectedPhoneme !== currentViseme) {
              setCurrentViseme(detectedPhoneme);
              setMouthShape(VISEME_MOUTH_SHAPES[detectedPhoneme]);
            }
            
            // Generate comprehensive lip sync data
            const lipSync = generateLipSyncData(detectedPhoneme, intensity);
            setLipSyncData(lipSync);
            onLipSyncData?.(lipSync);
            
            animationFrameRef.current = requestAnimationFrame(processAudio);
          }
        };
        
        audioRef.current.play();
        processAudio();
        
      } catch (error) {
        console.warn('Advanced lip sync setup failed:', error);
        // Fallback to basic animation
        setCurrentViseme('eh');
        setMouthShape(VISEME_MOUTH_SHAPES['eh']);
      }
    };
    
    setupAudioAnalysis();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore errors when closing AudioContext
        });
        audioContextRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl, isPlaying, currentViseme, detectPhonemeFromFrequency, generateLipSyncData, onLipSyncData]);

  return (
    <div className="relative w-full h-full">
      {/* Avatar Image */}
      <img
        src={avatarImageUrl}
        alt="Character Avatar"
        className="w-full h-full object-cover rounded-full"
      />
      
      {/* Advanced Mouth Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `rotateX(${lipSyncData.jawRotation}deg)`,
        }}
      >
        {/* Realistic Mouth Shape */}
        <motion.div
          className="absolute"
          style={{
            bottom: '25%', // Centered positioning
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${20 + mouthShape.width * 15}px`,
            height: `${8 + mouthShape.height * 20}px`,
            backgroundColor: `rgba(139, 0, 0, ${0.6 + lipSyncData.intensity * 0.3})`,
            borderRadius: mouthShape.openness > 0.5 ? '50%' : '50% 50% 50% 50% / 60% 60% 40% 40%',
            boxShadow: `inset 0 ${2 + lipSyncData.intensity * 3}px ${4 + lipSyncData.intensity * 4}px rgba(0,0,0,0.8)`,
          }}
          animate={{
            scaleX: 1 + lipSyncData.lipCornerPull * 0.3,
            scaleY: 0.8 + lipSyncData.mouthOpenness * 1.5,
          }}
          transition={{ duration: 0.08, ease: "easeOut" }}
        />
        
        {/* Tongue Animation for specific phonemes */}
        {lipSyncData.tongueTip > 0.3 && (
          <motion.div
            className="absolute bg-pink-800 rounded-full"
            style={{
              bottom: '26%', // Match mouth position
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${4 + lipSyncData.tongueTip * 6}px`,
              height: `${2 + lipSyncData.tongueTip * 4}px`,
            }}
            animate={{
              opacity: lipSyncData.tongueTip,
              scaleY: 0.5 + lipSyncData.tongueTip * 0.5,
            }}
            transition={{ duration: 0.06 }}
          />
        )}
      </motion.div>
      
      {/* Audio Intensity Visualizer */}
      {isPlaying && (
        <motion.div 
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <div 
            className="w-1 bg-gradient-to-t from-accent-gold to-accent-red rounded-full"
            style={{ height: `${10 + audioIntensity * 0.3}px` }}
          />
          <div className="text-xs text-center mt-1 text-accent-gold">
            {currentViseme.toUpperCase()}
          </div>
        </motion.div>
      )}
    </div>
  );
}