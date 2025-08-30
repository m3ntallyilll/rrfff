import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Play, Pause, Square, Swords, Trophy, Clock, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useSimpleBattle } from "@/hooks/use-simple-battle";
import { SimpleBattleDisplay } from "@/components/simple-battle-display";

export default function NewBattleArena() {
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
  const timerRef = useRef<number>();

  // Battle settings
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [character, setCharacter] = useState("razor");

  // Audio playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start recording
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
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      console.log("🎤 Recording stopped");
    }
  };

  // Submit recording
  const submitRecording = async () => {
    if (audioChunks.length === 0) {
      toast({
        title: "No Recording",
        description: "Please record your rap first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("🎵 Submitting audio:", audioBlob.size, "bytes");
      
      await submitRound(audioBlob);
      
      // Clear recording
      setAudioChunks([]);
      setRecordingTime(0);
      
      toast({
        title: "Round Submitted!",
        description: "Processing your rap battle round...",
      });
    } catch (error) {
      console.error("Error submitting recording:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your round. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Play AI audio
  const playAiAudio = () => {
    if (!currentAudioUrl) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(currentAudioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      setIsPlayingAudio(false);
      toast({
        title: "Audio Error",
        description: "Could not play AI response audio.",
        variant: "destructive",
      });
    };
    
    audio.play();
  };

  // Start new battle
  const handleStartBattle = async () => {
    try {
      await startNewBattle(difficulty, character);
      toast({
        title: "Battle Started!",
        description: `New ${difficulty} battle vs ${character.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error starting battle:", error);
      toast({
        title: "Battle Failed",
        description: "Could not start battle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentRound = rounds ? rounds.length + 1 : 1;
  const hasActiveRecording = audioChunks.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Swords className="w-6 h-6 text-red-500" />
              Rap Battle Arena
              {currentBattleId && (
                <Badge className="ml-2 bg-green-600">
                  Battle Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={character} onValueChange={setCharacter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="razor">Razor</SelectItem>
                  <SelectItem value="cypher">CYPHER-9000</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleStartBattle}
                disabled={isLoading || isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Starting..." : "New Battle"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Battle Display */}
        {currentBattleId ? (
          <SimpleBattleDisplay
            userText={currentTranscription}
            aiResponse={currentAiResponse}
            userScore={currentUserScore}
            aiScore={currentAiScore}
            isProcessing={isProcessing}
            round={currentRound}
          />
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Swords className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-slate-400 mb-2">Ready to Battle?</h3>
              <p className="text-slate-500">Start a new battle to begin your rap showdown!</p>
            </CardContent>
          </Card>
        )}

        {/* Recording Controls */}
        {currentBattleId && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Recording Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
                
                {hasActiveRecording && !isRecording && (
                  <Button 
                    onClick={submitRecording}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? "Processing..." : "Submit Round"}
                  </Button>
                )}
                
                {currentAudioUrl && (
                  <Button 
                    onClick={playAiAudio}
                    disabled={isPlayingAudio}
                    variant="outline"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    {isPlayingAudio ? "Playing..." : "Play AI Voice"}
                  </Button>
                )}
                
                {isRecording && (
                  <Badge className="bg-red-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {recordingTime.toFixed(1)}s
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battle History */}
        {rounds && rounds.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Battle History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rounds.map((round, index) => (
                  <div key={round.id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Round {index + 1}</h4>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-600">You: {round.userScore}</Badge>
                        <Badge className="bg-red-600">AI: {round.aiScore}</Badge>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-400 font-medium mb-1">Your Verse:</p>
                        <p className="text-slate-300">{round.userText}</p>
                      </div>
                      <div>
                        <p className="text-red-400 font-medium mb-1">AI Response:</p>
                        <p className="text-slate-300">{round.aiResponse}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}