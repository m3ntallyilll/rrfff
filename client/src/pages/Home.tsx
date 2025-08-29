import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, Trophy, Zap, Crown, TrendingUp, Settings } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'pro';
  status: string;
  battlesRemaining: number;
  canStartBattle: boolean;
}

interface UserStats {
  totalBattles: number;
  totalWins: number;
  winRate: number;
  battlesThisMonth: number;
}

interface Battle {
  id: string;
  aiCharacterName: string;
  createdAt: string;
  userScore: number;
  aiScore: number;
}

export default function Home() {
  const { user } = useAuth();
  
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const { data: battleHistory } = useQuery<Battle[]>({
    queryKey: ["/api/battles/history"],
    enabled: !!user,
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'text-amber-500';
      case 'premium': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro': return <Crown className="h-4 w-4" />;
      case 'premium': return <Zap className="h-4 w-4" />;
      default: return <Mic className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {(user as any)?.firstName || 'Rapper'}!
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={`${getTierColor(subscriptionStatus?.tier || 'free')} bg-slate-800`}>
                {getTierIcon(subscriptionStatus?.tier || 'free')}
                <span className="ml-1 capitalize">{subscriptionStatus?.tier || 'Free'}</span>
              </Badge>
              {subscriptionStatus?.tier === 'free' && (
                <Link href="/subscribe?tier=premium">
                  <Button size="sm" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/logout'}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Logout
          </Button>
        </div>

        {/* Battle Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Battles Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {subscriptionStatus?.tier === 'pro' ? '∞' : subscriptionStatus?.battlesRemaining || 0}
              </div>
              {subscriptionStatus?.tier !== 'pro' && (
                <Progress 
                  value={((subscriptionStatus?.battlesRemaining || 0) / (subscriptionStatus?.tier === 'premium' ? 25 : 3)) * 100} 
                  className="h-2" 
                />
              )}
              <p className="text-xs text-gray-400 mt-2">
                {subscriptionStatus?.tier === 'pro' 
                  ? 'Unlimited battles' 
                  : `Resets daily`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {userStats?.winRate?.toFixed(1) || 0}%
              </div>
              <Progress value={userStats?.winRate || 0} className="h-2" />
              <p className="text-xs text-gray-400 mt-2">
                {userStats?.totalWins || 0} wins of {userStats?.totalBattles || 0} battles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {userStats?.battlesThisMonth || 0}
              </div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active streak
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-800 to-purple-600 border-purple-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Start New Battle
              </CardTitle>
              <CardDescription className="text-purple-100">
                Face off against AI opponents and test your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionStatus?.canStartBattle ? (
                <Link href="/battle">
                  <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold">
                    Battle Now
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    className="w-full bg-gray-600 text-gray-300 cursor-not-allowed"
                    disabled
                  >
                    No Battles Left
                  </Button>
                  <div className="mt-3 space-y-2">
                    <Link href="/subscribe?tier=premium">
                      <Button variant="outline" className="w-full border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white text-sm">
                        Upgrade to Premium - $9.99/mo
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-800 to-orange-600 border-amber-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournament Mode
              </CardTitle>
              <CardDescription className="text-amber-100">
                Compete in elimination brackets for ultimate glory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tournaments">
                <Button className="w-full bg-white text-amber-600 hover:bg-gray-100 font-semibold" data-testid="button-tournament-mode">
                  Enter Tournament
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-800 to-slate-600 border-slate-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API Settings
              </CardTitle>
              <CardDescription className="text-slate-100">
                Manage your OpenAI & Groq API keys for enhanced voice quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button className="w-full bg-white text-slate-600 hover:bg-gray-100 font-semibold" data-testid="button-settings">
                  Configure Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Battles */}
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle>Recent Battles</CardTitle>
          </CardHeader>
          <CardContent>
            {battleHistory && battleHistory.length > 0 ? (
              <div className="space-y-4">
                {battleHistory.slice(0, 5).map((battle: any) => (
                  <div key={battle.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <div className="font-medium">vs {battle.aiCharacterName}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(battle.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {battle.userScore} - {battle.aiScore}
                      </div>
                      <Badge 
                        variant={battle.userScore > battle.aiScore ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {battle.userScore > battle.aiScore ? 'Won' : 'Lost'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No battles yet. Start your first battle to see it here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}