import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mic, MicOff, Volume2, Swords, Trophy, Clock, Flame, Zap, 
  Share2, Heart, MessageCircle, Users, Crown, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useSimpleBattle } from "@/hooks/use-simple-battle";
import { BATTLE_CHARACTERS, getCharacterById } from "@shared/characters";

export default function ViralBattleArena() {
  const { toast } = useToast();
  const {
    currentBattleId,
    battle,
    battleState,
    rounds,
    currentTranscription,
    currentAiResponse,
    currentAudioUrl,
    currentUserScore,
    currentAiScore,
    isLoading,
    isProcessing,
    startNewBattle,
    submitRound,
  } = useSimpleBattle();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [battleStarted, setBattleStarted] = useState(false);
  const timerRef = useRef<number>();

  // Battle settings
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [character, setCharacter] = useState("cypher");

  // Audio playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play AI audio when it becomes available
  useEffect(() => {
    if (currentAudioUrl && !isPlayingAudio) {
      // Auto-play with a small delay for dramatic effect
      setTimeout(() => {
        playAiAudio();
      }, 1000);
    }
  }, [currentAudioUrl]);

  // Track when audio chunks are ready for auto-submit
  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording && !isProcessing) {
      // Audio is ready but not yet submitted, trigger auto-submit
      autoSubmitRecording();
    }
  }, [audioChunks, isRecording, isProcessing]);

  // Viral elements
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showDefeatAnimation, setShowDefeatAnimation] = useState(false);
  const [battleHype, setBattleHype] = useState(0);

  const selectedCharacter = getCharacterById(character);
  const currentRound = rounds ? rounds.length + 1 : 1;
  const hasActiveRecording = audioChunks.length > 0;

  // Calculate battle hype based on scores
  useEffect(() => {
    const scoreDiff = Math.abs(currentUserScore - currentAiScore);
    const totalScore = currentUserScore + currentAiScore;
    const hype = Math.min(100, (scoreDiff * 10) + (totalScore * 2));
    setBattleHype(hype);
  }, [currentUserScore, currentAiScore]);

  // Victory/Defeat animations
  useEffect(() => {
    if (rounds && rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1];
      if (lastRound.userScore > lastRound.aiScore) {
        setShowVictoryAnimation(true);
        setTimeout(() => setShowVictoryAnimation(false), 3000);
      } else {
        setShowDefeatAnimation(true);
        setTimeout(() => setShowDefeatAnimation(false), 2000);
      }
    }
  }, [rounds]);

  // Start recording with viral effects
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
      
      console.log("🎤 Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "🎤 Mic Permission Needed",
        description: "Enable microphone to spit fire! 🔥",
        variant: "destructive",
      });
    }
  };

  // Stop recording and auto-submit
  const stopRecording = async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      console.log("🎤 Recording stopped, auto-submitting...");
      
      // Auto-submit after a short delay to ensure audio data is ready
      setTimeout(autoSubmitRecording, 500);
    }
  };

  // Auto-submit recording without user interaction
  const autoSubmitRecording = async () => {
    if (audioChunks.length === 0) {
      console.log("No audio chunks available for auto-submit");
      return;
    }

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("🎵 Auto-submitting audio:", audioBlob.size, "bytes");
      
      await submitRound(audioBlob);
      
      // Clear recording
      setAudioChunks([]);
      setRecordingTime(0);
      
      toast({
        title: "🔥 BARS AUTO-SUBMITTED!",
        description: "AI is cooking up a response... 🤖",
      });
    } catch (error) {
      console.error("Error auto-submitting recording:", error);
      toast({
        title: "❌ Auto-Submit Failed",
        description: "Tap to submit manually! ⚡",
        variant: "destructive",
      });
    }
  };

  // Manual submit (backup for auto-submit failures)
  const submitRecording = async () => {
    if (audioChunks.length === 0) {
      toast({
        title: "🎤 Drop Your Bars!",
        description: "Record your fire verse first! 🔥",
        variant: "destructive",
      });
      return;
    }

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("🎵 Manual submitting audio:", audioBlob.size, "bytes");
      
      await submitRound(audioBlob);
      
      // Clear recording
      setAudioChunks([]);
      setRecordingTime(0);
      
      toast({
        title: "🔥 BARS SUBMITTED!",
        description: "AI is cooking up a response... 🤖",
      });
    } catch (error) {
      console.error("Error submitting recording:", error);
      toast({
        title: "❌ Battle Glitch",
        description: "Try again! Keep the energy up! ⚡",
        variant: "destructive",
      });
    }
  };

  // Play AI audio with viral effects
  const playAiAudio = () => {
    if (!currentAudioUrl) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(currentAudioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => {
      setIsPlayingAudio(true);
      toast({
        title: "🔊 AI ROASTING YOU!",
        description: "Listen to that fire! 🤖🔥",
      });
    };
    
    audio.onended = () => {
      setIsPlayingAudio(false);
      toast({
        title: "🎤 YOUR TURN!",
        description: "Drop your comeback! 💀",
      });
    };
    
    audio.onerror = () => {
      setIsPlayingAudio(false);
      toast({
        title: "🔊 Audio Error",
        description: "AI voice glitched out! 🤖",
        variant: "destructive",
      });
    };
    
    audio.play().catch(error => {
      console.error("Audio play failed:", error);
      setIsPlayingAudio(false);
    });
  };

  // Start new battle with hype
  const handleStartBattle = async () => {
    try {
      await startNewBattle(difficulty, character);
      setBattleStarted(true);
      toast({
        title: "🚨 BATTLE STARTED!",
        description: `${selectedCharacter?.displayName} is ready to destroy! 💀`,
      });
    } catch (error) {
      console.error("Error starting battle:", error);
      toast({
        title: "💥 Battle Failed",
        description: "System overload! Try again! ⚡",
        variant: "destructive",
      });
    }
  };

  // Share battle functionality
  const shareBattle = () => {
    const battleStats = `🎤 BATTLE STATS 🎤\n${currentUserScore} VS ${currentAiScore}\nFaced: ${selectedCharacter?.displayName}\nRounds: ${rounds?.length || 0}`;
    
    if (navigator.share) {
      navigator.share({
        title: "🔥 Epic Rap Battle!",
        text: battleStats,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(battleStats);
      toast({
        title: "📋 Battle Stats Copied!",
        description: "Share your epic battle! 🚀",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white overflow-hidden">
      {/* Viral Background Effects */}
      <div className="fixed inset-0 opacity-20">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-500 to-purple-500"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Victory Animation */}
      <AnimatePresence>
        {showVictoryAnimation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-green-500/20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <motion.div
              className="text-center"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.5, repeat: 6 }}
            >
              <Crown className="w-32 h-32 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-6xl font-bold text-yellow-400 mb-2">🏆 VICTORY! 🏆</h1>
              <p className="text-2xl text-white">YOU DESTROYED THE AI!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defeat Animation */}
      <AnimatePresence>
        {showDefeatAnimation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-500/20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <motion.div
              className="text-center"
              animate={{
                rotate: [0, -2, 2, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 0.3, repeat: 5 }}
            >
              <Target className="w-32 h-32 text-red-400 mx-auto mb-4" />
              <h1 className="text-6xl font-bold text-red-400 mb-2">💀 DEFEATED! 💀</h1>
              <p className="text-2xl text-white">AI TOOK YOU DOWN!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Viral Header */}
        <motion.div
          className="text-center py-6"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-black bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 bg-clip-text text-transparent mb-4"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            🎤 RAP BATTLE 🎤
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-300"
            animate={{
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            HUMAN VS AI • VIRAL SHOWDOWN
          </motion.p>
        </motion.div>

        {/* Battle Setup */}
        {!currentBattleId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-black/50 border-purple-500 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Swords className="w-6 h-6 text-red-500" />
                  Choose Your Opponent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {BATTLE_CHARACTERS.map((char) => (
                    <motion.div
                      key={char.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        character === char.id 
                          ? 'border-red-500 bg-red-500/20' 
                          : 'border-gray-700 bg-gray-800/50 hover:border-purple-500'
                      }`}
                      onClick={() => setCharacter(char.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {char.displayName.substring(0, 2)}
                        </span>
                      </div>
                      <h3 className="font-bold text-center text-sm">{char.displayName}</h3>
                      <p className="text-xs text-center text-gray-400">{char.difficulty.toUpperCase()}</p>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                    <SelectTrigger className="flex-1 bg-black/50 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🟢 Easy Mode</SelectItem>
                      <SelectItem value="normal">🟡 Normal Mode</SelectItem>
                      <SelectItem value="hard">🔴 Hard Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <motion.div className="text-center">
                  <Button 
                    onClick={handleStartBattle}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold py-4 text-xl"
                    size="lg"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⚡ LOADING...
                      </motion.div>
                    ) : (
                      "🚨 START BATTLE 🚨"
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Battle Interface */}
        {currentBattleId && (
          <div className="space-y-6">
            
            {/* Battle Status */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-black/50 backdrop-blur-lg rounded-lg p-4 border border-purple-500"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center">
                  <span className="font-bold">
                    {selectedCharacter?.displayName.substring(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold">VS {selectedCharacter?.displayName}</h3>
                  <p className="text-sm text-gray-400">Round {currentRound} • {difficulty.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  <Trophy className="w-4 h-4 mr-1" />
                  YOU: {currentUserScore}
                </Badge>
                <Badge className="bg-red-600 text-white px-3 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  AI: {currentAiScore}
                </Badge>
                <Button
                  onClick={shareBattle}
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-400"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </motion.div>

            {/* Battle Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* User Section */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card className="bg-blue-900/50 border-blue-500 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-400">YOUR VERSE</h3>
                        <p className="text-sm text-gray-400">Human MC • Drop your fire! 🔥</p>
                      </div>
                      {isProcessing && (
                        <motion.div
                          className="w-4 h-4 bg-blue-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </div>
                    
                    <div className="min-h-[150px] p-4 bg-black/50 rounded-lg border border-blue-500/50">
                      <AnimatePresence>
                        {currentTranscription ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-300 font-mono text-lg leading-relaxed"
                          >
                            {currentTranscription.split('\n').map((line, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="mb-2"
                              >
                                {line}
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <div className="text-gray-500 italic text-center py-8">
                            {isProcessing ? (
                              <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                🎤 Processing your fire...
                              </motion.div>
                            ) : (
                              "🎤 Your rap will appear here..."
                            )}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Section */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card className="bg-red-900/50 border-red-500 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-500 bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedCharacter?.displayName.substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-400">
                          {selectedCharacter?.displayName} RESPONSE
                        </h3>
                        <p className="text-sm text-gray-400">
                          {selectedCharacter?.difficulty.toUpperCase()} • {selectedCharacter?.style}
                        </p>
                      </div>
                      {isProcessing && (
                        <motion.div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-red-400 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ 
                                duration: 0.6, 
                                repeat: Infinity, 
                                delay: i * 0.2 
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="min-h-[150px] p-4 bg-black/50 rounded-lg border border-red-500/50">
                      <AnimatePresence>
                        {currentAiResponse ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-red-300 font-mono text-lg leading-relaxed"
                          >
                            {currentAiResponse.split('\n').map((line, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="mb-2"
                              >
                                {line}
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <div className="text-gray-500 italic text-center py-8">
                            {isProcessing ? (
                              <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                🤖 AI is cooking up destruction...
                              </motion.div>
                            ) : (
                              "🤖 AI response will appear here..."
                            )}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recording Controls */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-4"
            >
              <Card className="bg-black/80 backdrop-blur-lg border-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-4">
                    
                    {!isRecording ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          onClick={startRecording}
                          disabled={isProcessing}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg"
                          size="lg"
                        >
                          <Mic className="w-6 h-6 mr-2" />
                          🎤 RECORD YOUR FIRE
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Button 
                          onClick={stopRecording}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-full text-lg"
                          size="lg"
                        >
                          <MicOff className="w-6 h-6 mr-2" />
                          ⏹️ STOP & AUTO-SUBMIT ({recordingTime.toFixed(1)}s)
                        </Button>
                      </motion.div>
                    )}

                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Button 
                          disabled
                          className="bg-purple-600 text-white font-bold py-4 px-8 rounded-full text-lg opacity-75"
                          size="lg"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            ⚡ AI COOKING RESPONSE...
                          </motion.div>
                        </Button>
                      </motion.div>
                    )}

                    {hasActiveRecording && !isRecording && !isProcessing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          onClick={submitRecording}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg"
                          size="lg"
                        >
                          <Flame className="w-6 h-6 mr-2" />
                          🚀 MANUAL SUBMIT
                        </Button>
                      </motion.div>
                    )}
                    
                    {currentAudioUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          onClick={playAiAudio}
                          disabled={isPlayingAudio}
                          variant="outline"
                          className="border-purple-500 text-purple-400 font-bold py-4 px-6 rounded-full"
                          size="lg"
                        >
                          <Volume2 className="w-5 h-5 mr-2" />
                          {isPlayingAudio ? "🔊 PLAYING..." : "🎵 HEAR AI"}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}