import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Trophy, Users, Target, Crown, Play } from "lucide-react";
import { Tournament } from "@shared/schema";

export default function TournamentBrackets() {
  const [, setLocation] = useLocation();

  // Fetch active tournaments with bracket data
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments/active'],
  });

  const getTournamentProgress = (tournament: Tournament) => {
    if (tournament.status === 'completed') return 100;
    return (tournament.currentRound / tournament.totalRounds) * 100;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/tournaments')}
            className="text-gray-400 hover:text-white"
            data-testid="button-back-to-tournaments"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Tournaments
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Tournament Brackets
            </h1>
            <p className="text-gray-400">Live brackets and ongoing tournament battles</p>
          </div>
        </div>

        {/* Active Tournaments */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-gray-900 border-gray-700 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-32 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="bg-gray-900 border-gray-700 hover:border-purple-500 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-xl">{tournament.name}</CardTitle>
                    <Badge className="bg-blue-500 text-white">
                      Round {tournament.currentRound}/{tournament.totalRounds}
                    </Badge>
                  </div>
                  <div className="text-gray-400">
                    {tournament.type === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Tournament Progress</span>
                        <span className="text-white">{getTournamentProgress(tournament).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${getTournamentProgress(tournament)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Mini Bracket Preview */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <Trophy className="mr-2 text-yellow-400" size={16} />
                        Current Round Matches
                      </h4>
                      
                      {tournament.bracket?.rounds && tournament.bracket.rounds.length > 0 ? (
                        <div className="space-y-2">
                          {tournament.bracket.rounds
                            .find(r => r.roundNumber === tournament.currentRound)
                            ?.matches?.slice(0, 3) // Show first 3 matches
                            ?.map((match, index) => (
                            <div key={match.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <span className="text-sm text-white">
                                  {match.player1.name} vs {match.player2.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {match.isCompleted ? (
                                  <Badge className="bg-green-500 text-xs">
                                    <Crown className="mr-1" size={10} />
                                    {match.winner?.name || 'Complete'}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-500 text-xs">Active</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {(tournament.bracket.rounds
                            .find(r => r.roundNumber === tournament.currentRound)
                            ?.matches?.length || 0) > 3 && (
                            <div className="text-center text-gray-400 text-sm">
                              +{(tournament.bracket.rounds
                                .find(r => r.roundNumber === tournament.currentRound)
                                ?.matches?.length || 0) - 3} more matches
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-sm">
                          No bracket data available
                        </div>
                      )}
                    </div>

                    {/* Tournament Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center bg-gray-800 rounded p-2">
                        <div className="text-purple-400 font-semibold">
                          {tournament.difficulty}
                        </div>
                        <div className="text-gray-400 text-xs">Difficulty</div>
                      </div>
                      <div className="text-center bg-gray-800 rounded p-2">
                        <div className="text-pink-400 font-semibold">
                          {tournament.lyricComplexity}%
                        </div>
                        <div className="text-gray-400 text-xs">Complexity</div>
                      </div>
                      <div className="text-center bg-gray-800 rounded p-2">
                        <div className="text-blue-400 font-semibold">
                          {tournament.styleIntensity}%
                        </div>
                        <div className="text-gray-400 text-xs">Intensity</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setLocation(`/tournament/${tournament.id}`)}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        data-testid={`button-view-bracket-${tournament.id}`}
                      >
                        <Target className="mr-2" size={16} />
                        View Full Bracket
                      </Button>
                    </div>

                    {/* Prize */}
                    {tournament.prize && (
                      <div className="text-center pt-2 border-t border-gray-700">
                        <span className="text-gray-400 text-sm">Prize: </span>
                        <span className="text-yellow-400 font-medium">{tournament.prize}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="text-center py-12">
              <Users className="mx-auto mb-4 text-gray-500" size={48} />
              <p className="text-gray-400">No active tournament brackets!</p>
              <p className="text-sm text-gray-500 mt-2">Create or join a tournament to see live brackets</p>
              <Button
                onClick={() => setLocation('/tournaments')}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-view-tournaments"
              >
                <Trophy className="mr-2" size={16} />
                View Tournaments
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {tournaments && tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Trophy className="mr-2 text-yellow-400" size={20} />
                  Active Tournaments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {tournaments.length}
                </div>
                <p className="text-gray-400 text-sm">Currently running</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Play className="mr-2 text-green-400" size={20} />
                  Active Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {tournaments.reduce((total, tournament) => {
                    return total + (tournament.bracket?.rounds
                      .find(r => r.roundNumber === tournament.currentRound)
                      ?.matches.filter(m => !m.isCompleted).length || 0);
                  }, 0)}
                </div>
                <p className="text-gray-400 text-sm">Battles in progress</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Crown className="mr-2 text-blue-400" size={20} />
                  Finals Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {tournaments.filter(t => t.currentRound === t.totalRounds).length}
                </div>
                <p className="text-gray-400 text-sm">Championship rounds</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}