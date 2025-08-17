import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type BattleState, type Battle, type BattleRound } from "@shared/schema";

export function useBattleState(battleId?: string) {
  const [currentBattleId, setCurrentBattleId] = useState<string | undefined>(battleId);

  // Fetch battle state
  const { data: battleState, isLoading: stateLoading } = useQuery({
    queryKey: ["/api/battles", currentBattleId, "state"],
    enabled: !!currentBattleId,
  });

  // Fetch battle details
  const { data: battle, isLoading: battleLoading } = useQuery({
    queryKey: ["/api/battles", currentBattleId],
    enabled: !!currentBattleId,
  });

  // Fetch battle rounds
  const { data: rounds, isLoading: roundsLoading } = useQuery({
    queryKey: ["/api/battles", currentBattleId, "rounds"],
    enabled: !!currentBattleId,
  });

  // Create new battle mutation
  const createBattleMutation = useMutation({
    mutationFn: async (battleData: { 
      difficulty: string; 
      profanityFilter: boolean; 
      aiCharacterId?: string;
    }) => {
      const res = await apiRequest("POST", "/api/battles", battleData);
      return res.json();
    },
    onSuccess: (data: Battle) => {
      setCurrentBattleId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
    },
  });

  // Update battle state mutation
  const updateStateMutation = useMutation({
    mutationFn: async (updates: Partial<BattleState>) => {
      if (!currentBattleId) throw new Error("No active battle");
      const res = await apiRequest("PATCH", `/api/battles/${currentBattleId}/state`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/battles", currentBattleId, "state"] 
      });
    },
  });

  // Process battle round mutation
  const processBattleRoundMutation = useMutation({
    mutationFn: async (data: { audio?: Blob; userVerse?: string }) => {
      if (!currentBattleId) throw new Error("No active battle");
      
      const formData = new FormData();
      if (data.audio) {
        formData.append("audio", data.audio, "recording.wav");
        console.log("Added audio to FormData:", data.audio.size, "bytes");
      }
      if (data.userVerse) {
        formData.append("userVerse", data.userVerse);
        console.log("Added userVerse to FormData:", data.userVerse);
      }
      
      // Debug FormData contents
      console.log("FormData entries:");
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(key, value);
      });

      const res = await fetch(`/api/battles/${currentBattleId}/rounds`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Battle round failed:", res.status, errorText);
        throw new Error(`Battle round failed: ${res.statusText}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/battles", currentBattleId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/battles", currentBattleId, "state"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/battles", currentBattleId, "rounds"] 
      });
    },
  });

  const startNewBattle = (
    difficulty: "easy" | "normal" | "hard", 
    profanityFilter: boolean = true,
    aiCharacterId?: string
  ) => {
    createBattleMutation.mutate({ difficulty, profanityFilter, aiCharacterId });
  };

  const updateBattleState = (updates: Partial<BattleState>) => {
    updateStateMutation.mutate(updates);
  };

  const submitRound = async (data: { audio?: Blob; userVerse?: string }) => {
    return processBattleRoundMutation.mutateAsync(data);
  };

  const isLoading = stateLoading || battleLoading || roundsLoading;
  const isProcessing = createBattleMutation.isPending || 
                      updateStateMutation.isPending || 
                      processBattleRoundMutation.isPending;

  return {
    // Data
    battleState: battleState as BattleState | undefined,
    battle: battle as Battle | undefined,
    rounds: rounds as BattleRound[] | undefined,
    currentBattleId,
    
    // Loading states
    isLoading,
    isProcessing,
    
    // Actions
    startNewBattle,
    updateBattleState,
    submitRound,
    
    // Mutation states
    createBattle: createBattleMutation,
    updateState: updateStateMutation,
    processBattleRound: processBattleRoundMutation,
  };
}
