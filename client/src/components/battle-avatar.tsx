import { useState, useEffect, useRef } from "react";
import { Settings, Smile, Flame, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BattleCharacter } from "@shared/characters";
import { AdvancedLipSync } from "./advanced-lip-sync";

interface BattleAvatarProps {
  isAISpeaking: boolean;
  battleState?: "idle" | "battle" | "mad" | "victory" | "defeat";
  audioUrl?: string;
  className?: string;
  character?: BattleCharacter;
}

interface LipSyncData {
  mouthOpenness: number;
  jawRotation: number;
  lipCornerPull: number;
  tongueTip: number;
  intensity: number;
}

export function BattleAvatar({ 
  isAISpeaking, 
  battleState = "idle",
  audioUrl,
  className = "",
  character
}: BattleAvatarProps) {
  const [currentEmotion, setCurrentEmotion] = useState<"neutral" | "angry" | "happy">("neutral");
  const [lipSyncLevel, setLipSyncLevel] = useState(0);
  const [mouthShape, setMouthShape] = useState<"closed" | "small" | "medium" | "large">("closed");
  const [lipSyncData, setLipSyncData] = useState<LipSyncData>({
    mouthOpenness: 0,
    jawRotation: 0,
    lipCornerPull: 0,
    tongueTip: 0,
    intensity: 0
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Update avatar emotion based on battle state
    switch (battleState) {
      case "mad":
        setCurrentEmotion("angry");
        break;
      case "victory":
        setCurrentEmotion("happy");
        break;
      case "defeat":
        setCurrentEmotion("angry");
        break;
      default:
        setCurrentEmotion("neutral");
    }
  }, [battleState]);

  // Advanced audio analysis for lip sync (legacy system)
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    if (audioUrl && isAISpeaking) {
      audio = new Audio(audioUrl);
      
      const startAdvancedLipSync = () => {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          
          const source = audioContextRef.current.createMediaElementSource(audio!);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
          
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          const updateAdvancedLipSync = () => {
            if (analyserRef.current && dataArrayRef.current) {
              analyserRef.current.getByteFrequencyData(dataArrayRef.current);
              
              const average = Array.from(dataArrayRef.current).reduce((a, b) => a + b) / bufferLength;
              const normalized = average / 255;
              
              setLipSyncLevel(normalized);
              
              // Enhanced mouth shape detection based on frequency ranges
              const lowFreq = dataArrayRef.current.slice(0, bufferLength / 4).reduce((a, b) => a + b) / (bufferLength / 4);
              const midFreq = dataArrayRef.current.slice(bufferLength / 4, bufferLength / 2).reduce((a, b) => a + b) / (bufferLength / 4);
              const highFreq = dataArrayRef.current.slice(bufferLength / 2, bufferLength).reduce((a, b) => a + b) / (bufferLength / 2);
              
              if (normalized < 0.1) {
                setMouthShape("closed");
              } else if (highFreq > 100 && midFreq < 80) {
                setMouthShape("small");  // 'S', 'F', 'TH' sounds
              } else if (lowFreq > 120) {
                setMouthShape("large");  // 'A', 'O', 'AH' sounds
              } else {
                setMouthShape("medium"); // Most consonants and mixed sounds
              }
            }
            
            if (isAISpeaking) {
              animationFrameRef.current = requestAnimationFrame(updateAdvancedLipSync);
            }
          };
          
          audio!.play();
          updateAdvancedLipSync();
          
          console.log("MuseTalk-inspired lip sync initialized with advanced frequency analysis");
          
        } catch (error) {
          console.warn("Advanced lip sync not supported, falling back:", error);
          // Enhanced fallback animation
          const fallbackAnimation = () => {
            if (isAISpeaking) {
              const shapes: Array<"closed" | "small" | "medium" | "large"> = ["small", "medium", "small", "large"];
              const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
              setMouthShape(randomShape);
              setTimeout(fallbackAnimation, 150 + Math.random() * 200);
            }
          };
          fallbackAnimation();
        }
      };
      
      startAdvancedLipSync();
      
      audio.addEventListener('ended', () => {
        setMouthShape("closed");
        setLipSyncLevel(0);
        setCurrentEmotion("neutral");
        console.log("Advanced lip sync session ended");
      });
    } else {
      setMouthShape("closed");
      setLipSyncLevel(0);
      setCurrentEmotion("neutral");
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audio) {
        audio.pause();
        audio.remove();
      }
    };
  }, [audioUrl, isAISpeaking]);

  const getAvatarStateColor = () => {
    switch (battleState) {
      case "battle":
        return "bg-accent-red";
      case "mad":
        return "bg-red-600";
      case "victory":
        return "bg-accent-gold";
      case "defeat":
        return "bg-gray-600";
      default:
        return "bg-accent-blue";
    }
  };

  const getAvatarStateIcon = () => {
    switch (battleState) {
      case "battle":
      case "mad":
        return <Flame className="text-white text-sm" size={12} />;
      case "victory":
        return "🏆";
      case "defeat":
        return "😤";
      default:
        return "🤖";
    }
  };

  return (
    <div className={`bg-battle-gray rounded-xl p-6 border border-gray-700 text-center ${className}`}>
      <div className="mb-4">
        <div className="text-lg font-orbitron font-bold text-accent-red" data-testid="text-ai-title">
          {character?.displayName || "AI CHALLENGER"}
        </div>
        <div className="text-sm text-gray-400" data-testid="text-ai-level">
          {character?.difficulty ? `${character.difficulty.toUpperCase()} MODE` : "HARDCORE MODE"} • {character?.style || "AI Voice"}
        </div>
      </div>

      {/* Avatar Container */}
      <div className="relative mx-auto w-48 h-48 mb-6">
        {/* Avatar Image/Representation */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-accent-gold overflow-hidden relative bg-gradient-to-br from-accent-blue to-accent-red"
          animate={isAISpeaking ? {
            scale: [1, 1.05, 1],
            borderColor: ["var(--accent-gold)", "var(--accent-red)", "var(--accent-gold)"]
          } : {}}
          transition={{
            duration: 0.8,
            repeat: isAISpeaking ? Infinity : 0,
            ease: "easeInOut"
          }}
          data-testid="avatar-ai-character"
        >
          {/* Character Avatar Image with Real Lip Sync Animation */}
          {character?.avatar ? (
            <motion.img
              src={`/attached_assets/generated_images/${character.avatar}`}
              alt={character.displayName}
              className="w-full h-full object-cover"
              animate={{
                // Animate the entire face based on lip sync data from AdvancedLipSync
                scaleY: isAISpeaking ? (1 + (lipSyncData.mouthOpenness * 0.005)) : 1,
                scaleX: isAISpeaking ? (1 + (lipSyncData.lipCornerPull * 0.002)) : 1,
                transformOrigin: "center 75%", // Pivot around mouth area
                filter: isAISpeaking ? 
                  `brightness(${1 + lipSyncData.intensity * 0.01}) contrast(${1 + lipSyncData.intensity * 0.005})` : 
                  'brightness(1) contrast(1)'
              }}
              transition={{ duration: 0.08, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-white">
              🤖
            </div>
          )}

          {/* Real Avatar Lip Sync Component - Hidden behind avatar but provides data */}
          {character?.avatar && audioUrl && (
            <div className="absolute inset-0 pointer-events-none opacity-0">
              <AdvancedLipSync
                audioUrl={audioUrl}
                isPlaying={isAISpeaking}
                avatarImageUrl={`/attached_assets/generated_images/${character.avatar}`}
                onLipSyncData={(data) => setLipSyncData(data)}
                disableAudioPlayback={true}
              />
            </div>
          )}
          
          {/* Subtle visual feedback when speaking */}
          {isAISpeaking && (
            <motion.div 
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  `0 0 0px rgba(${character?.id === 'razor' ? '239, 68, 68' : 
                                  character?.id === 'venom' ? '34, 197, 94' : '59, 130, 246'}, 0)`,
                  `0 0 30px rgba(${character?.id === 'razor' ? '239, 68, 68' : 
                                   character?.id === 'venom' ? '34, 197, 94' : '59, 130, 246'}, 0.2)`,
                  `0 0 0px rgba(${character?.id === 'razor' ? '239, 68, 68' : 
                                  character?.id === 'venom' ? '34, 197, 94' : '59, 130, 246'}, 0)`
                ]
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}

          {/* Fallback AI Character Face for non-character avatars */}
          {!character?.avatar && (
            <div className="text-white relative flex items-center justify-center h-full">
              {/* Eyes */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 flex space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  currentEmotion === "angry" ? "bg-red-500" : 
                  currentEmotion === "happy" ? "bg-green-500" : "bg-blue-400"
                }`} />
                <div className={`w-4 h-4 rounded-full ${
                  currentEmotion === "angry" ? "bg-red-500" : 
                  currentEmotion === "happy" ? "bg-green-500" : "bg-blue-400"
                }`} />
              </div>
              
              {/* Animated Mouth for Lip Sync */}
              <motion.div 
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
                animate={{
                  scaleY: mouthShape === "large" ? 1.8 : 
                          mouthShape === "medium" ? 1.4 : 
                          mouthShape === "small" ? 1.1 : 1,
                  scaleX: mouthShape === "large" ? 1.3 : 
                          mouthShape === "medium" ? 1.2 : 
                          mouthShape === "small" ? 1.1 : 1,
                }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                <div className={`rounded-full ${
                  mouthShape === "closed" ? "w-3 h-1 bg-gray-700" :
                  mouthShape === "small" ? "w-4 h-2 bg-gray-800" :
                  mouthShape === "medium" ? "w-5 h-3 bg-gray-900" :
                  "w-6 h-4 bg-black"
                } transition-all duration-100`} />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Battle Status Indicator */}
      <div className="flex justify-center mb-4">
        <div className={`rounded-full px-3 py-1 text-xs font-bold flex items-center space-x-1 ${getAvatarStateColor()}`}>
          <span>{getAvatarStateIcon()}</span>
          <span className="text-white">
            {battleState === "idle" ? "READY" : 
             battleState === "battle" ? "BATTLING" :
             battleState === "mad" ? "ANGRY" :
             battleState === "victory" ? "VICTORY" : "DEFEATED"}
          </span>
        </div>
      </div>

      {/* Audio Controls */}
      {audioUrl && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-battle-dark hover:bg-battle-gray border border-gray-600"
            data-testid="button-audio-controls"
          >
            <Volume2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}