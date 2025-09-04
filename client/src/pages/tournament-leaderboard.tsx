import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Crown, Trophy, Medal, Award } from "lucide-react";
import { SocialShare } from "@/components/SocialShare";
import { useAuth } from "@/hooks/useAuth";
const leaderboardImage = "/images/Tournament_leaderboard_hall_3a679b72.png";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  tournamentsWon: number;
  tournamentsPlayed: number;
  winRate: number;
  averageScore: number;
  totalPoints: number;
}

export default function TournamentLeaderboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch global tournament leaderboard
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/tournaments/leaderboard'],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={20} />;
      case 2:
        return <Medal className="text-gray-400" size={20} />;
      case 3:
        return <Award className="text-amber-600" size={20} />;
      default:
        return <Trophy className="text-gray-600" size={16} />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 relative">
      {/* Leaderboard Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-12 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${leaderboardImage})` }}
      />
      <div className="relative z-10 max-w-4xl mx-auto">
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
              Global Leaderboard
            </h1>
            <p className="text-gray-400">Top tournament champions across all battles</p>
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Crown className="mr-2 text-yellow-400" size={24} />
              Tournament Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
                      <div className="h-3 bg-gray-700 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.userId}
                    className={`flex items-center space-x-4 p-4 rounded-lg ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-600' : 'bg-gray-800'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getRankColor(entry.rank)}`}>
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : (
                          <span className="text-white font-bold text-sm">#{entry.rank}</span>
                        )}
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{entry.username}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{entry.tournamentsWon} wins</span>
                        <span>{entry.tournamentsPlayed} played</span>
                        <span>{entry.winRate.toFixed(1)}% win rate</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-400">
                        {entry.totalPoints.toLocaleString()} pts
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.averageScore.toFixed(1)} avg
                      </div>
                    </div>

                    {/* Achievement Badges */}
                    <div className="flex space-x-1">
                      {entry.tournamentsWon >= 10 && (
                        <Badge className="bg-yellow-500 text-black">Champion</Badge>
                      )}
                      {entry.winRate >= 80 && (
                        <Badge className="bg-purple-500">Elite</Badge>
                      )}
                      {entry.tournamentsPlayed >= 50 && (
                        <Badge className="bg-blue-500">Veteran</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="mx-auto mb-4 text-gray-500" size={48} />
                <p className="text-gray-400">No tournament data yet!</p>
                <p className="text-sm text-gray-500 mt-2">Complete tournaments to see rankings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center">
                <Trophy className="mr-2 text-yellow-400" size={20} />
                Total Tournaments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {leaderboard?.length || 0}
              </div>
              <p className="text-gray-400 text-sm">Active players</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center">
                <Crown className="mr-2 text-yellow-400" size={20} />
                Top Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {leaderboard?.[0]?.winRate.toFixed(1) || 0}%
              </div>
              <p className="text-gray-400 text-sm">{leaderboard?.[0]?.username || 'No champion yet'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center">
                <Award className="mr-2 text-yellow-400" size={20} />
                Most Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {leaderboard?.[0]?.totalPoints.toLocaleString() || 0}
              </div>
              <p className="text-gray-400 text-sm">{leaderboard?.[0]?.username || 'No leader yet'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Social Sharing for User's Rank */}
        {user && leaderboard && (
          <div className="mt-8">
            {(() => {
              const userEntry = leaderboard.find(entry => entry.userId === (user as any).id);
              if (userEntry) {
                return (
                  <SocialShare
                    title="Rap Battle AI Tournament Leaderboard"
                    text={`🏆 Ranking #${userEntry.rank} on the Rap Battle AI leaderboard! ${userEntry.totalPoints.toLocaleString()} points earned through epic AI battles! Think you can climb higher?`}
                    hashtags={['RapBattleAI', 'Leaderboard', 'Ranked', 'TournamentChampion']}
                    leaderboardData={{
                      rank: userEntry.rank,
                      username: userEntry.username,
                      score: userEntry.totalPoints
                    }}
                    variant="default"
                    className="mb-6"
                  />
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}