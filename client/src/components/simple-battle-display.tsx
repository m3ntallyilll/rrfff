import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Bot, Trophy, Zap } from "lucide-react";
import { getCharacterById } from "@shared/characters";

interface SimpleBattleDisplayProps {
  userText: string;
  aiResponse: string;
  userScore: number;
  aiScore: number;
  isProcessing: boolean;
  round: number;
  characterId?: string;
}

export function SimpleBattleDisplay({
  userText,
  aiResponse,
  userScore,
  aiScore,
  isProcessing,
  round,
  characterId
}: SimpleBattleDisplayProps) {
  
  const formatRapText = (text: string) => {
    if (!text) return "";
    return text.split('\n').map((line, index) => (
      <div key={index} className="mb-1 leading-relaxed">
        {line.trim()}
      </div>
    ));
  };

  const character = characterId ? getCharacterById(characterId) : null;

  return (
    <div className="space-y-6">
      {/* Round Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Round {round}
        </h2>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-blue-600 text-white">
            <Trophy className="w-4 h-4 mr-1" />
            You: {userScore}
          </Badge>
          <Badge variant="secondary" className="bg-red-600 text-white">
            <Zap className="w-4 h-4 mr-1" />
            AI: {aiScore}
          </Badge>
        </div>
      </div>

      {/* User Section */}
      <Card className="bg-slate-800 border-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-400">Your Verse</h3>
              <p className="text-xs text-slate-400">Human MC</p>
            </div>
            {isProcessing && (
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <div className="min-h-[100px] p-4 bg-slate-900 rounded-lg border border-slate-700">
            <AnimatePresence>
              {userText ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-blue-300 font-mono"
                >
                  {formatRapText(userText)}
                </motion.div>
              ) : (
                <div className="text-slate-500 italic">
                  {isProcessing ? "Processing your rap..." : "Record your verse to begin"}
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* AI Section */}
      <Card className="bg-slate-800 border-red-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {character?.avatar ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500 bg-red-900">
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center text-white font-bold text-xs">
                  {character.displayName.substring(0, 2)}
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">
                {character?.displayName || "AI"} Response
              </h3>
              <p className="text-xs text-slate-400">
                {character?.difficulty.toUpperCase()} • {character?.style || "AI MC"}
              </p>
            </div>
            {isProcessing && (
              <motion.div className="flex space-x-1">
                <motion.div
                  className="w-1 h-1 bg-red-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1 h-1 bg-red-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1 h-1 bg-red-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </motion.div>
            )}
          </div>
          <div className="min-h-[120px] p-4 bg-slate-900 rounded-lg border border-slate-700">
            <AnimatePresence>
              {aiResponse ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-300 font-mono"
                >
                  {formatRapText(aiResponse)}
                </motion.div>
              ) : (
                <div className="text-slate-500 italic">
                  {isProcessing ? "AI is crafting a devastating response..." : "AI response will appear here"}
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}