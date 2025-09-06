import { useState, useEffect } from "react";
import { Scroll, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BattleTextDisplayProps {
  liveTranscription?: string;
  aiResponse?: string;
  isTranscribing?: boolean;
  isAIGenerating?: boolean;
  onClear?: () => void;
  className?: string;
}

export function BattleTextDisplay({ 
  liveTranscription = "", 
  aiResponse = "",
  isTranscribing = false,
  isAIGenerating = false,
  onClear,
  className = ""
}: BattleTextDisplayProps) {
  const [displayedAIText, setDisplayedAIText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  // Typewriter effect for AI response
  useEffect(() => {
    // Show AI response immediately when available, regardless of isAIGenerating state
    if (aiResponse && aiResponse.trim()) {
      setCurrentCharIndex(0);
      setDisplayedAIText("");
      
      const interval = setInterval(() => {
        setCurrentCharIndex((prev) => {
          if (prev >= aiResponse.length) {
            clearInterval(interval);
            return prev;
          }
          
          setDisplayedAIText(aiResponse.substring(0, prev + 1));
          return prev + 1;
        });
      }, 30); // Faster speed for better responsiveness

      return () => clearInterval(interval);
    } else {
      setDisplayedAIText("");
      setCurrentCharIndex(0);
    }
  }, [aiResponse, isAIGenerating]);

  const formatRapText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="mb-0.5">
        {line.trim() && (
          <>
            {line.includes('🎤') && <span className="mr-2">🎤</span>}
            {line.replace(/🎤|🔥/g, '').trim()}
            {line.includes('🔥') && <span className="ml-2">🔥</span>}
          </>
        )}
      </div>
    ));
  };

  return (
    <div className={`bg-battle-gray rounded-xl p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron font-bold text-lg text-accent-gold">
          <Scroll className="inline mr-2" size={20} />
          Current Battle
        </h3>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-accent-blue hover:text-blue-400 hover:bg-secondary-dark"
            data-testid="button-clear-battle-text"
          >
            <Eraser size={16} />
          </Button>
        )}
      </div>

      {/* Live Transcription */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
          Live Transcription:
          {isTranscribing && (
            <motion.div
              className="w-2 h-2 bg-accent-red rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              data-testid="indicator-transcribing"
            />
          )}
        </div>
        <div className="bg-secondary-dark rounded-lg p-4 min-h-[80px] border border-gray-600">
          <div className="font-code text-accent-blue" data-testid="text-live-transcription">
            <AnimatePresence>
              {liveTranscription ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {liveTranscription}
                  {isTranscribing && (
                    <motion.span 
                      className="animate-pulse ml-1"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.div>
              ) : (
                <span className="text-gray-500">
                  {isTranscribing ? "Listening..." : "Your rap will appear here..."}
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* AI Response */}
      <div>
        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
          AI Response:
          {isAIGenerating && (
            <motion.div
              className="flex space-x-1"
              data-testid="indicator-ai-generating"
            >
              <motion.div
                className="w-1 h-1 bg-accent-red rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1 h-1 bg-accent-red rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-1 h-1 bg-accent-red rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          )}
        </div>
        <div className="bg-secondary-dark rounded-lg p-4 min-h-[120px] border border-gray-600">
          <div className="font-code text-accent-red" data-testid="text-ai-response">
            <AnimatePresence>
              {displayedAIText ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {formatRapText(displayedAIText)}
                  {currentCharIndex < aiResponse.length && (
                    <motion.span 
                      className="animate-pulse"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.div>
              ) : (
                <span className="text-gray-500">
                  {isAIGenerating ? "AI is crafting a response..." : "AI response will appear here..."}
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
