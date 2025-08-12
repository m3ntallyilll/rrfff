import { useState, useEffect } from "react";
import { Settings, Smile, Flame, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BattleAvatarProps {
  isAISpeaking: boolean;
  battleState?: "idle" | "battle" | "mad" | "victory" | "defeat";
  className?: string;
}

export function BattleAvatar({ 
  isAISpeaking, 
  battleState = "idle",
  className = "" 
}: BattleAvatarProps) {
  const [currentEmotion, setCurrentEmotion] = useState<"neutral" | "angry" | "happy">("neutral");

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
          AI CHALLENGER
        </div>
        <div className="text-sm text-gray-400" data-testid="text-ai-level">
          Level 47 • Hardcore Mode
        </div>
      </div>

      {/* Avatar Container */}
      <div className="relative mx-auto w-48 h-48 mb-6">
        {/* Avatar Image/Representation */}
        <motion.div
          className="w-full h-full bg-gradient-to-br from-accent-blue to-accent-red rounded-full border-4 border-accent-gold flex items-center justify-center text-6xl"
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
          {/* Simple AI Robot Face */}
          <div className="text-white">
            <div className="text-2xl mb-2">
              {currentEmotion === "angry" ? "😠" : 
               currentEmotion === "happy" ? "😎" : "🤖"}
            </div>
          </div>
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
