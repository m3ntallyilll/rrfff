import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Trophy, Crown, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Tournament, TournamentMatch, TournamentPlayer } from '@shared/schema';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tournament data
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', id],
    enabled: !!id,
  });

  // Start next battle mutation
  const startBattle = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest('POST', `/api/tournaments/${id}/battles/${matchId}`);
    },
    onSuccess: (response: any) => {
      // Navigate to battle arena with tournament context
      const data = typeof response === 'object' ? response : {};
      const battleId = data.battleId || data.id;
      setLocation(`/battle/${battleId}?tournament=${id}`);
    },
    onError: (error) => {
      toast({
        title: "Battle Start Failed",
        description: "Failed to start tournament battle. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-700 rounded mb-8 w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-800 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-800 rounded"></div>
                <div className="h-64 bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
          <Button onClick={() => setLocation('/tournaments')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="mr-2" size={16} />
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  const getTournamentProgress = () => {
    if (tournament.status === 'completed') return 100;
    return (tournament.currentRound / tournament.totalRounds) * 100;
  };

  const getCurrentMatch = (): TournamentMatch | null => {
    const currentRound = tournament.bracket.rounds.find(r => r.roundNumber === tournament.currentRound);
    if (!currentRound) return null;
    
    return currentRound.matches.find(m => !m.isCompleted) || null;
  };

  const renderBracket = () => {
    return (
      <div className="space-y-6">
        {tournament.bracket.rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">
                {round.roundNumber === tournament.totalRounds ? 'Final' : 
                 round.roundNumber === tournament.totalRounds - 1 ? 'Semi-Final' : 
                 `Round ${round.roundNumber}`}
              </h3>
              {round.roundNumber === tournament.currentRound && (
                <Badge className="bg-blue-500">Current</Badge>
              )}
              {round.roundNumber < tournament.currentRound && (
                <Badge className="bg-green-500">Completed</Badge>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {round.matches.map((match, matchIndex) => (
                <Card 
                  key={match.id} 
                  className={`bg-gray-900 border-gray-700 ${
                    match.isCompleted ? 'border-green-500' : 
                    round.roundNumber === tournament.currentRound ? 'border-blue-500' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-gray-300">
                        Match {matchIndex + 1}
                      </CardTitle>
                      {match.isCompleted && match.winner && (
                        <Crown className="text-yellow-400" size={16} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Player 1 */}
                    <div className={`flex items-center space-x-3 p-2 rounded ${
                      match.winner?.id === match.player1.id ? 'bg-green-900 border border-green-500' : 'bg-gray-800'
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                        {match.player1.type === 'user' ? 'U' : 'AI'}
                      </div>
                      <span className="text-white text-sm font-medium">{match.player1.name}</span>
                    </div>
                    
                    <div className="text-center text-gray-500 text-xs">VS</div>
                    
                    {/* Player 2 */}
                    <div className={`flex items-center space-x-3 p-2 rounded ${
                      match.winner?.id === match.player2.id ? 'bg-green-900 border border-green-500' : 'bg-gray-800'
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                        {match.player2.type === 'user' ? 'U' : 'AI'}
                      </div>
                      <span className="text-white text-sm font-medium">{match.player2.name}</span>
                    </div>
                    
                    {/* Action Button */}
                    {!match.isCompleted && round.roundNumber === tournament.currentRound && 
                     (match.player1.type === 'user' || match.player2.type === 'user') && (
                      <Button 
                        onClick={() => startBattle.mutate(match.id)}
                        disabled={startBattle.isPending}
                        className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        size="sm"
                        data-testid={`button-start-match-${match.id}`}
                      >
                        <Play className="mr-2" size={14} />
                        {startBattle.isPending ? 'Starting...' : 'Start Battle'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const currentMatch = getCurrentMatch();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/tournaments')}
            className="text-gray-400 hover:text-white"
            data-testid="button-back-to-tournaments"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-gray-400 capitalize">
              {tournament.type.replace('_', ' ')} Tournament
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tournament Bracket */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="mr-2 text-yellow-400" size={24} />
                  Tournament Bracket
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBracket()}
              </CardContent>
            </Card>
          </div>

          {/* Tournament Info Sidebar */}
          <div className="space-y-4">
            {/* Tournament Status */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Tournament Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{tournament.currentRound}/{tournament.totalRounds} rounds</span>
                  </div>
                  <Progress value={getTournamentProgress()} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={`${
                      tournament.status === 'completed' ? 'bg-green-500' :
                      tournament.status === 'abandoned' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {tournament.status === 'completed' ? 'Completed' :
                       tournament.status === 'abandoned' ? 'Abandoned' : 'Active'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-white capitalize">{tournament.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Complexity:</span>
                    <span className="text-purple-400">{tournament.lyricComplexity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intensity:</span>
                    <span className="text-pink-400">{tournament.styleIntensity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Content Safety:</span>
                    <span className="text-white">{tournament.profanityFilter ? 'Family' : 'Battle'}</span>
                  </div>
                </div>

                {tournament.prize && (
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-center">
                      <span className="text-gray-400 text-sm">Prize</span>
                      <p className="text-yellow-400 font-medium">{tournament.prize}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Battle */}
            {currentMatch && tournament.status === 'active' && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Zap className="mr-2 text-blue-400" size={20} />
                    Next Battle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-2">Round {tournament.currentRound}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-white font-medium">{currentMatch.player1.name}</span>
                          <span className="text-gray-500">vs</span>
                          <span className="text-white font-medium">{currentMatch.player2.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => startBattle.mutate(currentMatch.id)}
                      disabled={startBattle.isPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      data-testid="button-start-next-battle"
                    >
                      <Play className="mr-2" size={16} />
                      {startBattle.isPending ? 'Starting Battle...' : 'Start Battle'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tournament Completed */}
            {tournament.status === 'completed' && (
              <Card className="bg-gray-900 border-gray-700 border-yellow-500">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Crown className="mr-2 text-yellow-400" size={20} />
                    Tournament Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Trophy className="mx-auto mb-3 text-yellow-400" size={48} />
                  <p className="text-white font-medium mb-2">Congratulations!</p>
                  <p className="text-gray-400 text-sm mb-4">You've completed the tournament</p>
                  <p className="text-yellow-400 font-medium">{tournament.prize}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}