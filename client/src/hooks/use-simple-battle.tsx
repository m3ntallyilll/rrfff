import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface BattleRound {
  id: string;
  userText: string;
  aiResponse: string;
  userScore: number;
  aiScore: number;
  audioUrl?: string;
  timestamp: string;
}

interface BattleState {
  status: 'active' | 'completed' | 'waiting';
  currentRound: number;
  totalRounds: number;
  userTotalScore: number;
  aiTotalScore: number;
  timeRemaining: number;
}

interface Battle {
  id: string;
  status: string;
  difficulty: string;
  characterId: string;
  createdAt: string;
}

export function useSimpleBattle() {
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [currentAiResponse, setCurrentAiResponse] = useState("");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Polling function to get latest battle data
  const pollBattleData = useCallback(async () => {
    if (!currentBattleId) return;

    try {
      // Get battle state
      const stateRes = await apiRequest("GET", `/api/battle/${currentBattleId}/state`);
      const stateData = await stateRes.json();
      setBattleState(stateData);

      // Get battle rounds
      const roundsRes = await apiRequest("GET", `/api/battle/${currentBattleId}/rounds`);
      const roundsData = await roundsRes.json();
      setRounds(roundsData || []);

      // Update current texts from latest round
      if (roundsData && roundsData.length > 0) {
        const latestRound = roundsData[roundsData.length - 1];
        setCurrentTranscription(latestRound.userText || "");
        setCurrentAiResponse(latestRound.aiResponse || "");
        setCurrentAudioUrl(latestRound.audioUrl || null);
      }
    } catch (error) {
      console.error("Error polling battle data:", error);
    }
  }, [currentBattleId]);

  // Start polling when we have a battle ID
  useEffect(() => {
    if (!currentBattleId) return;

    // Initial load
    pollBattleData();

    // Poll every 2 seconds for updates
    const interval = setInterval(pollBattleData, 2000);
    return () => clearInterval(interval);
  }, [currentBattleId, pollBattleData]);

  // Create new battle
  const startNewBattle = async (
    difficulty: "easy" | "normal" | "hard" = "normal",
    characterId: string = "razor",
    options: any = {}
  ) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/battle", {
        difficulty,
        characterId,
        profanityFilter: false,
        lyricComplexity: 50,
        styleIntensity: 50,
        voiceSpeed: 1,
        ...options
      });
      const battleData = await res.json();
      
      setBattle(battleData);
      setCurrentBattleId(battleData.id);
      setRounds([]);
      setCurrentTranscription("");
      setCurrentAiResponse("");
      setCurrentAudioUrl(null);
      
      console.log("🎯 New battle started:", battleData.id);
      return battleData;
    } catch (error) {
      console.error("Error starting battle:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit battle round
  const submitRound = async (audioBlob: Blob) => {
    if (!currentBattleId) throw new Error("No active battle");
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const res = await fetch(`/api/battle/${currentBattleId}/round`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Battle round failed: ${res.statusText}`);
      }

      const result = await res.json();
      console.log("🎉 Battle round completed:", result);

      // Update immediately from response
      if (result.userText) setCurrentTranscription(result.userText);
      if (result.aiResponse) setCurrentAiResponse(result.aiResponse);
      if (result.audioUrl) setCurrentAudioUrl(result.audioUrl);

      // Trigger a poll to get latest data
      setTimeout(pollBattleData, 500);
      
      return result;
    } catch (error) {
      console.error("Error submitting round:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate current scores
  const currentUserScore = rounds.reduce((sum, round) => sum + (round.userScore || 0), 0);
  const currentAiScore = rounds.reduce((sum, round) => sum + (round.aiScore || 0), 0);

  return {
    // State
    currentBattleId,
    battle,
    battleState,
    rounds,
    currentTranscription,
    currentAiResponse,
    currentAudioUrl,
    currentUserScore,
    currentAiScore,
    
    // Loading states
    isLoading,
    isProcessing,
    
    // Actions
    startNewBattle,
    submitRound,
    pollBattleData,
  };
}