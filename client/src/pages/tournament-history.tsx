import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Trophy, Clock, Target, Award } from "lucide-react";
import { Tournament } from "@shared/schema";

export default function TournamentHistory() {
  const [, setLocation] = useLocation();

  // Fetch user's tournament history
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments/history'],
  });

  const getTournamentStatus = (tournament: Tournament) => {
    if (tournament.status === 'completed') return 'Completed';
    if (tournament.status === 'abandoned') return 'Abandoned';
    return `Round ${tournament.currentRound}/${tournament.totalRounds}`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'abandoned') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
              Tournament History
            </h1>
            <p className="text-gray-400">Your complete tournament battle record</p>
          </div>
        </div>

        {/* Tournament History */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-900 border-gray-700 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="bg-gray-900 border-gray-700 hover:border-purple-500 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{tournament.name}</CardTitle>
                    <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                      {getTournamentStatus(tournament)}
                    </Badge>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {tournament.type === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Tournament Details */}
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className="capitalize">{tournament.difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Progress:</span>
                        <span>{tournament.currentRound}/{tournament.totalRounds} rounds</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span>{formatDate(tournament.createdAt.toString())}</span>
                      </div>
                      {tournament.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Completed:</span>
                          <span>{formatDate(tournament.completedAt.toString())}</span>
                        </div>
                      )}
                    </div>

                    {/* Performance Stats */}
                    <div className="pt-2 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center">
                          <div className="text-purple-400 font-semibold">
                            {tournament.lyricComplexity}%
                          </div>
                          <div className="text-gray-400 text-xs">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-pink-400 font-semibold">
                            {tournament.styleIntensity}%
                          </div>
                          <div className="text-gray-400 text-xs">Intensity</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/tournament/${tournament.id}`)}
                        className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500/10"
                        data-testid={`button-view-tournament-${tournament.id}`}
                      >
                        <Trophy className="mr-1" size={14} />
                        View Details
                      </Button>
                    </div>

                    {/* Prize */}
                    {tournament.prize && tournament.status === 'completed' && (
                      <div className="pt-2 border-t border-gray-700 text-center">
                        <div className="text-yellow-400 text-sm font-medium">
                          <Award className="inline mr-1" size={14} />
                          {tournament.prize}
                        </div>
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
              <Clock className="mx-auto mb-4 text-gray-500" size={48} />
              <p className="text-gray-400">No tournament history yet!</p>
              <p className="text-sm text-gray-500 mt-2">Create your first tournament to start building your legacy</p>
              <Button
                onClick={() => setLocation('/tournaments')}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-create-first-tournament"
              >
                <Trophy className="mr-2" size={16} />
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {tournaments && tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Trophy className="mr-2 text-yellow-400" size={20} />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {tournaments.length}
                </div>
                <p className="text-gray-400 text-sm">Tournaments</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Award className="mr-2 text-green-400" size={20} />
                  Won
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {tournaments.filter(t => t.status === 'completed').length}
                </div>
                <p className="text-gray-400 text-sm">Completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Target className="mr-2 text-blue-400" size={20} />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {tournaments.filter(t => t.status === 'active').length}
                </div>
                <p className="text-gray-400 text-sm">In Progress</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Clock className="mr-2 text-orange-400" size={20} />
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">
                  {tournaments.length > 0 ? 
                    Math.round((tournaments.filter(t => t.status === 'completed').length / tournaments.length) * 100)
                    : 0}%
                </div>
                <p className="text-gray-400 text-sm">Success</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}