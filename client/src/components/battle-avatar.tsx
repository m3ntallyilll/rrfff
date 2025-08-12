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

  // MuseTalk-inspired advanced audio analysis and lip sync
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    if (audioUrl && isAISpeaking) {
      audio = new Audio(audioUrl);
      
      const startAdvancedLipSync = () => {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioContext = audioContextRef.current;
          
          const source = audioContext.createMediaElementSource(audio!);
          analyserRef.current = audioContext.createAnalyser();
          
          // MuseTalk-inspired settings for better frequency analysis
          analyserRef.current.fftSize = 512; // Higher resolution for phoneme detection
          analyserRef.current.smoothingTimeConstant = 0.85; // Smoother transitions
          analyserRef.current.minDecibels = -90;
          analyserRef.current.maxDecibels = -10;
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);
          
          const updateAdvancedLipSync = () => {
            if (analyserRef.current && dataArrayRef.current) {
              analyserRef.current.getByteFrequencyData(dataArrayRef.current);
              
              // Multi-band frequency analysis inspired by MuseTalk
              const lowFreqs = dataArrayRef.current.slice(1, 8);   // 0-1kHz (vowels)
              const midFreqs = dataArrayRef.current.slice(8, 32);  // 1-4kHz (consonants)
              const highFreqs = dataArrayRef.current.slice(32, 64); // 4-8kHz (sibilants)
              
              const lowAvg = lowFreqs.reduce((a, b) => a + b) / lowFreqs.length;
              const midAvg = midFreqs.reduce((a, b) => a + b) / midFreqs.length;
              const highAvg = highFreqs.reduce((a, b) => a + b) / highFreqs.length;
              
              const totalEnergy = (lowAvg + midAvg + highAvg) / 3;
              const normalizedLevel = Math.min(totalEnergy / 128, 1); // More conservative normalization
              
              setLipSyncLevel(normalizedLevel);
              
              // Phoneme-aware mouth shape detection (inspired by MuseTalk's approach)
              let detectedMouthShape: "closed" | "small" | "medium" | "large" = "closed";
              
              if (normalizedLevel < 0.15) {
                detectedMouthShape = "closed";
              } else if (highAvg > midAvg && highAvg > lowAvg) {
                // High frequency dominant (sibilants: S, SH, F, TH)
                detectedMouthShape = normalizedLevel > 0.6 ? "medium" : "small";
              } else if (lowAvg > midAvg) {
                // Low frequency dominant (vowels: A, O, U)
                detectedMouthShape = normalizedLevel > 0.7 ? "large" : 
                                  normalizedLevel > 0.4 ? "medium" : "small";
              } else {
                // Mid frequency dominant (consonants: T, D, K, G)
                detectedMouthShape = normalizedLevel > 0.6 ? "medium" : "small";
              }
              
              setMouthShape(detectedMouthShape);
              
              // Update facial emotions based on intensity patterns
              if (normalizedLevel > 0.8) {
                setCurrentEmotion("angry"); // Intense speech
              } else if (normalizedLevel > 0.5 && lowAvg > midAvg) {
                setCurrentEmotion("happy"); // Expressive vowels
              } else {
                setCurrentEmotion("neutral");
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
          {/* MuseTalk-Inspired Advanced Lip Sync Overlay */}
          {character?.avatar && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Multi-layered mouth animation inspired by MuseTalk's approach */}
              <motion.div 
                className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
                style={{
                  width: `${12 + lipSyncLevel * 20}px`,
                  height: `${6 + lipSyncLevel * 15}px`,
                }}
                animate={{
                  scaleY: mouthShape === "large" ? 2.2 : 
                          mouthShape === "medium" ? 1.6 : 
                          mouthShape === "small" ? 1.2 : 0.8,
                  scaleX: mouthShape === "large" ? 1.4 : 
                          mouthShape === "medium" ? 1.25 : 
                          mouthShape === "small" ? 1.1 : 1,
                  rotateZ: lipSyncLevel > 0.5 ? `${(lipSyncLevel - 0.5) * 3}deg` : 0,
                }}
                transition={{ duration: 0.08, ease: "easeOut" }}
              >
                {/* Outer lip contour */}
                <div className={`absolute inset-0 ${
                  mouthShape === "closed" ? "rounded-full bg-red-900/70" :
                  mouthShape === "small" ? "rounded-full bg-red-800/75" :
                  mouthShape === "medium" ? "rounded-lg bg-red-700/85" :
                  "rounded-lg bg-red-600/90"
                } shadow-2xl border border-red-500/30`} />
                
                {/* Inner mouth cavity for open states */}
                {mouthShape !== "closed" && (
                  <motion.div 
                    className="absolute inset-1 bg-black/80 rounded-full"
                    animate={{
                      scaleY: mouthShape === "large" ? 1.2 : 
                              mouthShape === "medium" ? 0.9 : 0.6,
                    }}
                    transition={{ duration: 0.06 }}
                  />
                )}
                
                {/* Teeth highlight for wide mouth shapes */}
                {(mouthShape === "large" || mouthShape === "medium") && (
                  <motion.div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-white/60 rounded-b-full"
                    style={{
                      width: `${mouthShape === "large" ? "80%" : "60%"}`,
                      height: "30%",
                    }}
                    animate={{
                      opacity: mouthShape === "large" ? 0.8 : 0.5,
                    }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.div>
              
              {/* Advanced intensity visualization with frequency bands */}
              {isAISpeaking && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-accent-gold to-accent-red rounded-full"
                      style={{
                        height: `${4 + (lipSyncLevel * (i + 1) * 4)}px`,
                        opacity: 0.6 + lipSyncLevel * 0.4,
                      }}
                      animate={{
                        scaleY: [0.8, 1.2, 0.8],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 0.4 + i * 0.1,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Facial feature enhancement during speech */}
              {isAISpeaking && lipSyncLevel > 0.6 && (
                <>
                  {/* Eye blink animation during intense speech */}
                  <motion.div
                    className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-black/30 rounded-full"
                    animate={{
                      scaleY: [1, 0.1, 1],
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  />
                  
                  {/* Cheek movement during speech */}
                  <motion.div
                    className="absolute top-10 left-2 w-4 h-6 bg-red-500/20 rounded-full"
                    animate={{
                      scaleX: [1, 1.1, 1],
                      x: [0, 2, 0],
                    }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute top-10 right-2 w-4 h-6 bg-red-500/20 rounded-full"
                    animate={{
                      scaleX: [1, 1.1, 1],
                      x: [0, -2, 0],
                    }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                  />
                </>
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
