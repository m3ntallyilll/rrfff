import { useState, useEffect, useRef } from "react";
import { Settings, Smile, Flame, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BattleCharacter } from "@shared/characters";

interface BattleAvatarProps {
  isAISpeaking: boolean;
  battleState?: "idle" | "battle" | "mad" | "victory" | "defeat";
  audioUrl?: string;
  className?: string;
  character?: BattleCharacter;
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

  // Lip sync audio analysis
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    if (audioUrl && isAISpeaking) {
      audio = new Audio(audioUrl);
      
      const startLipSync = () => {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioContext = audioContextRef.current;
          
          const source = audioContext.createMediaElementSource(audio!);
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);
          
          const updateLipSync = () => {
            if (analyserRef.current && dataArrayRef.current) {
              analyserRef.current.getByteFrequencyData(dataArrayRef.current);
              
              // Calculate average frequency data for mouth movement
              const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
              const normalizedLevel = average / 255;
              
              setLipSyncLevel(normalizedLevel);
              
              // Update mouth shape based on audio intensity
              if (normalizedLevel > 0.7) {
                setMouthShape("large");
              } else if (normalizedLevel > 0.4) {
                setMouthShape("medium");
              } else if (normalizedLevel > 0.1) {
                setMouthShape("small");
              } else {
                setMouthShape("closed");
              }
            }
            
            if (isAISpeaking) {
              animationFrameRef.current = requestAnimationFrame(updateLipSync);
            }
          };
          
          audio!.play();
          updateLipSync();
          
        } catch (error) {
          console.warn("Lip sync not supported:", error);
          // Fallback to simple mouth animation
          setMouthShape(isAISpeaking ? "medium" : "closed");
        }
      };
      
      startLipSync();
      
      audio.addEventListener('ended', () => {
        setMouthShape("closed");
        setLipSyncLevel(0);
      });
    } else {
      setMouthShape("closed");
      setLipSyncLevel(0);
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
          {/* Character Avatar Image */}
          {character?.avatar ? (
            <img
              src={`/attached_assets/generated_images/${character.avatar}`}
              alt={character.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-white">
              🤖
            </div>
          )}
          {/* Lip Sync Overlay for Character Images */}
          {character?.avatar && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Animated Mouth Overlay for Lip Sync */}
              <motion.div 
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex justify-center"
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
                  mouthShape === "closed" ? "w-4 h-2 bg-red-900 opacity-60" :
                  mouthShape === "small" ? "w-5 h-3 bg-red-800 opacity-70" :
                  mouthShape === "medium" ? "w-6 h-4 bg-red-700 opacity-80" :
                  "w-8 h-5 bg-red-600 opacity-90"
                } transition-all duration-100 shadow-lg`} />
              </motion.div>
              
              {/* Lip sync intensity indicator */}
              {isAISpeaking && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <motion.div 
                    className="w-1 bg-accent-gold rounded-full"
                    style={{
                      height: `${8 + lipSyncLevel * 16}px`,
                    }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                </div>
              )}
            </div>
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
        
        {/* Battle State Indicator */}
        <motion.div 
          className={`absolute -top-2 -right-2 w-8 h-8 ${getAvatarStateColor()} rounded-full flex items-center justify-center`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          data-testid="indicator-avatar-state"
        >
          {getAvatarStateIcon()}
        </motion.div>
        
        {/* Speech Indicator */}
        <AnimatePresence>
          {isAISpeaking && (
            <motion.div 
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary-dark px-3 py-1 rounded-full border border-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              data-testid="indicator-ai-speaking"
            >
              <Volume2 className="inline text-accent-blue animate-pulse mr-1" size={12} />
              <span className="text-xs">Spitting fire...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-secondary-dark hover:bg-gray-600 border-gray-600"
          onClick={() => setCurrentEmotion(currentEmotion === "happy" ? "neutral" : "happy")}
          data-testid="button-toggle-avatar-emotion"
        >
          <Smile className="text-accent-gold" size={16} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-secondary-dark hover:bg-gray-600 border-gray-600"
          data-testid="button-avatar-settings"
        >
          <Settings className="text-accent-blue" size={16} />
        </Button>
      </div>
    </div>
  );
}
