import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Trophy, Clock, Flame, Wifi, History, Share, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBattleState } from "@/hooks/use-battle-state";
import { RecordingPanel } from "@/components/recording-panel";
import { BattleAvatar } from "@/components/battle-avatar";
import { BattleTextDisplay } from "@/components/battle-text-display";
import { AudioControls } from "@/components/audio-controls";
import { formatDuration } from "@/lib/audio-utils";
import { motion, AnimatePresence } from "framer-motion";

export default function BattleArena() {
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [battleTimer, setBattleTimer] = useState(105); // 1:45
  const [liveTranscription, setLiveTranscription] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [currentAiAudio, setCurrentAiAudio] = useState<string>();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { toast } = useToast();
  const {
    battleState,
    battle,
    rounds,
    currentBattleId,
    isLoading,
    isProcessing,
    startNewBattle,
    updateBattleState,
    submitRound,
  } = useBattleState();

  // Fetch battle history
  const { data: battleHistory = [] } = useQuery({
    queryKey: ["/api/battles"],
  });

  // Battle timer countdown
  useEffect(() => {
    if (battleState?.timeRemaining && battleState.timeRemaining > 0) {
      const timer = setInterval(() => {
        const newTime = battleState.timeRemaining - 1;
        setBattleTimer(newTime);
        if (newTime <= 0) {
          // End battle
          updateBattleState({ timeRemaining: 0 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [battleState?.timeRemaining, updateBattleState]);

  // Initialize new battle on component mount
  useEffect(() => {
    if (!currentBattleId) {
      startNewBattle(difficulty, profanityFilter);
    }
  }, [currentBattleId, difficulty, profanityFilter, startNewBattle]);

  const handleRecordingComplete = async (recording: { blob: Blob; duration: number; url: string }) => {
    try {
      setIsTranscribing(true);
      updateBattleState({ isAIResponding: true });

      const result = await submitRound({ audio: recording.blob });
      
      if (result) {
        setLiveTranscription(result.round.userVerse);
        setAiResponse(result.round.aiVerse);
        setCurrentAiAudio(result.aiAudioUrl);
        
        toast({
          title: "Round Complete!",
          description: `Score: You ${result.scores.userScore} - AI ${result.scores.aiScore}`,
        });
      }
    } catch (error) {
      toast({
        title: "Battle Error",
        description: error instanceof Error ? error.message : "Failed to process battle round",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      updateBattleState({ isAIResponding: false });
    }
  };

  const handleNewBattle = () => {
    setLiveTranscription("");
    setAiResponse("");
    setCurrentAiAudio(undefined);
    setBattleTimer(120);
    startNewBattle(difficulty, profanityFilter);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value as "easy" | "normal" | "hard");
    if (currentBattleId) {
      updateBattleState({ difficulty: value as "easy" | "normal" | "hard" });
    }
  };

  const getProgressPercentage = () => {
    if (!battleState) return 50;
    const total = battleState.userScore + battleState.aiScore;
    return total > 0 ? (battleState.userScore / total) * 100 : 50;
  };

  const getConnectionStatus = () => {
    return "Connected"; // Could implement real connection monitoring
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-orbitron font-bold text-accent-gold mb-4">
            Initializing Battle Arena...
          </div>
          <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-secondary-dark border-b border-battle-gray px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Mic className="text-accent-gold text-2xl" />
            <h1 className="font-orbitron font-bold text-2xl bg-gradient-to-r from-accent-gold to-accent-red bg-clip-text text-transparent">
              RapBots
            </h1>
            <Badge variant="secondary" className="bg-accent-blue text-white">
              ARENA
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              <span>Streak: </span>
              <span className="text-accent-gold font-semibold">3</span>
            </div>
            <div className="text-sm text-gray-400">
              <span>Score: </span>
              <span className="text-accent-blue font-semibold">
                {battleState?.userScore || 0}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/fine-tuning'}
              className="bg-battle-gray hover:bg-gray-600 border-gray-600 mr-2"
              data-testid="button-fine-tuning"
              title="Fine-tune Custom Models"
            >
              🧠
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-battle-gray hover:bg-gray-600 border-gray-600"
              data-testid="button-settings"
            >
              ⚙️
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Battle Status Bar */}
          <Card className="mb-6 bg-battle-gray border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Badge className="bg-accent-red text-white px-3 py-1">
                    <Flame className="mr-1" size={16} />
                    BATTLE MODE
                  </Badge>
                  <div className="text-accent-gold font-semibold" data-testid="text-current-round">
                    Round {battleState?.currentRound || 1}/{battleState?.maxRounds || 3}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Battle Timer */}
                  <div className="flex items-center space-x-2 bg-secondary-dark px-4 py-2 rounded-lg">
                    <Clock className="text-accent-blue" size={16} />
                    <span className="font-orbitron font-bold text-lg" data-testid="text-battle-timer">
                      {formatDuration(battleTimer)}
                    </span>
                  </div>
                  {/* Difficulty */}
                  <Select value={difficulty} onValueChange={handleDifficultyChange}>
                    <SelectTrigger className="w-32 bg-secondary-dark border-gray-600" data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary-dark border-gray-600">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Battle Progress */}
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-accent-blue font-semibold">YOU</div>
                  <div className="text-2xl font-orbitron font-bold" data-testid="text-user-score">
                    {battleState?.userScore || 0}
                  </div>
                </div>
                <div className="flex-1 mx-8">
                  <Progress 
                    value={getProgressPercentage()} 
                    className="h-2"
                    data-testid="progress-battle-score"
                  />
                  <div className="text-center text-xs font-semibold mt-1">VS</div>
                </div>
                <div className="text-center">
                  <div className="text-accent-red font-semibold">AI BOT</div>
                  <div className="text-2xl font-orbitron font-bold" data-testid="text-ai-score">
                    {battleState?.aiScore || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Controls Panel */}
            <div className="space-y-6">
              {/* Recording Panel */}
              <RecordingPanel
                onRecordingComplete={handleRecordingComplete}
                profanityFilter={profanityFilter}
                onProfanityFilterChange={setProfanityFilter}
                disabled={isProcessing || battleState?.isAIResponding}
              />

              {/* User Score Panel */}
              <Card className="bg-battle-gray border-gray-700">
                <CardContent className="p-6">
                  <h3 className="font-orbitron font-bold text-lg mb-4 text-accent-blue">
                    <Trophy className="inline mr-2" size={20} />
                    Your Stats
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rhyme Density</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={75} className="w-16 h-2" />
                        <span className="text-sm font-semibold" data-testid="text-rhyme-density">75%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Flow Quality</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={80} className="w-16 h-2" />
                        <span className="text-sm font-semibold" data-testid="text-flow-quality">80%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Creativity</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={60} className="w-16 h-2" />
                        <span className="text-sm font-semibold" data-testid="text-creativity">60%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-600">
                      <div className="text-center">
                        <div className="text-2xl font-orbitron font-bold text-accent-gold" data-testid="text-total-score">
                          {battleState?.userScore || 0}
                        </div>
                        <div className="text-sm text-gray-400">Total Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Central Battle Arena */}
            <div className="space-y-6">
              {/* Avatar Section */}
              <BattleAvatar
                isAISpeaking={battleState?.isPlayingAudio || false}
                battleState={battleState?.isAIResponding ? "battle" : "idle"}
              />

              {/* Battle Text Display */}
              <BattleTextDisplay
                liveTranscription={liveTranscription}
                aiResponse={aiResponse}
                isTranscribing={isTranscribing}
                isAIGenerating={battleState?.isAIResponding}
                onClear={() => {
                  setLiveTranscription("");
                  setAiResponse("");
                }}
              />
            </div>

            {/* AI & Audio Controls Panel */}
            <div className="space-y-6">
              {/* Audio Playback Controls */}
              <AudioControls
                audioUrl={currentAiAudio}
                onPlaybackChange={(isPlaying) => 
                  updateBattleState({ isPlayingAudio: isPlaying })
                }
              />

              {/* Battle History */}
              <Card className="bg-battle-gray border-gray-700">
                <CardContent className="p-6">
                  <h3 className="font-orbitron font-bold text-lg mb-4 text-accent-gold">
                    <History className="inline mr-2" size={20} />
                    Battle History
                  </h3>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {Array.isArray(battleHistory) && battleHistory.slice(0, 3).map((historyBattle: any, index: number) => (
                        <motion.div
                          key={historyBattle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-secondary-dark rounded-lg p-3 border border-gray-600"
                          data-testid={`card-battle-history-${index}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-sm">Battle #{index + 47}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(historyBattle.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-accent-gold font-bold">
                                {historyBattle.userScore} - {historyBattle.aiScore}
                              </div>
                              <div className={`text-xs ${
                                historyBattle.userScore > historyBattle.aiScore 
                                  ? "text-accent-blue" 
                                  : "text-accent-red"
                              }`}>
                                {historyBattle.userScore > historyBattle.aiScore ? "VICTORY" : "DEFEAT"}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Button 
                    className="w-full mt-4 bg-accent-blue hover:bg-blue-600" 
                    variant="default"
                    data-testid="button-view-all-battles"
                  >
                    View All Battles
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-battle-gray border-gray-700">
                <CardContent className="p-6">
                  <h3 className="font-orbitron font-bold text-lg mb-4 text-accent-gold">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleNewBattle}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-accent-red to-red-600 hover:from-red-500 hover:to-red-700"
                      data-testid="button-new-battle"
                    >
                      <Flame className="mr-2" size={16} />
                      New Battle
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full bg-accent-blue hover:bg-blue-600 border-accent-blue text-white"
                      data-testid="button-practice-mode"
                    >
                      <Dumbbell className="mr-2" size={16} />
                      Practice Mode
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full bg-battle-gray hover:bg-gray-600 border-gray-600"
                      data-testid="button-share-results"
                    >
                      <Share className="mr-2" size={16} />
                      Share Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Audio Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-secondary-dark border-t border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="destructive"
              size="sm"
              className="bg-accent-red hover:bg-red-600 w-12 h-12 rounded-full"
              data-testid="button-emergency-stop"
            >
              ⏹️
            </Button>
            <div className="text-sm">
              <div className="font-semibold">Battle in Progress</div>
              <div className="text-gray-400" data-testid="text-battle-status">
                Round {battleState?.currentRound || 1} of {battleState?.maxRounds || 3}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Wifi className="text-accent-blue" size={16} />
              <span className="text-sm text-gray-400" data-testid="text-connection-status">
                {getConnectionStatus()}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              API Status: <span className="text-accent-gold" data-testid="text-api-status">Online</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
