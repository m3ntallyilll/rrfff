import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Zap, Brain, TrendingUp, Award, Flame, Crown } from "lucide-react";

interface BattleStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  bestScore: number;
  favoriteCharacter: string;
  longestWinStreak: number;
  currentWinStreak: number;
  skillBreakdown: {
    rhymes: number;
    flow: number;
    creativity: number;
    consistency: number;
  };
  recentPerformance: Array<{
    date: string;
    opponent: string;
    score: number;
    result: 'win' | 'loss';
    difficulty: string;
  }>;
}

interface BattleStatsDashboardProps {
  stats: BattleStats;
  className?: string;
}

export function BattleStatsDashboard({ stats, className = "" }: BattleStatsDashboardProps) {
  const getSkillLevel = (score: number) => {
    if (score >= 90) return { level: "Master", color: "text-purple-600", bg: "bg-purple-100" };
    if (score >= 80) return { level: "Expert", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 70) return { level: "Advanced", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { level: "Intermediate", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Beginner", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalBattles}</p>
                <p className="text-sm text-muted-foreground">Total Battles</p>
              </div>
              <Trophy className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${getWinRateColor(stats.winRate)}`}>
                  {stats.winRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {stats.currentWinStreak}
                  {stats.currentWinStreak >= 3 && <Flame className="w-5 h-5 text-orange-500" />}
                </p>
                <p className="text-sm text-muted-foreground">Win Streak</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Skills Breakdown */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Skill Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.skillBreakdown).map(([skill, score]) => {
                const skillInfo = getSkillLevel(score);
                return (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{skill}</span>
                      <Badge className={`${skillInfo.bg} ${skillInfo.color} border-0`}>
                        {skillInfo.level}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress value={score} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{score}/100</span>
                        <span>Next: {Math.min(100, Math.ceil(score / 10) * 10)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Battles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentPerformance.map((battle, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={battle.result === 'win' ? 'default' : 'destructive'}
                        className={battle.result === 'win' ? 'bg-green-600' : ''}
                      >
                        {battle.result.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium">vs {battle.opponent}</p>
                        <p className="text-sm text-muted-foreground">
                          {battle.difficulty} • {new Date(battle.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{battle.score}</p>
                      <p className="text-sm text-muted-foreground">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Achievements & Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold">Best Score</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.bestScore}</p>
                  <p className="text-sm text-muted-foreground">Personal Record</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.longestWinStreak}</p>
                  <p className="text-sm text-muted-foreground">Consecutive Wins</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Favorite Opponent</span>
                  </div>
                  <p className="text-lg font-bold">{stats.favoriteCharacter}</p>
                  <p className="text-sm text-muted-foreground">Most Battled</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Battle Master</span>
                  </div>
                  <p className="text-lg font-bold">
                    {stats.winRate >= 80 ? 'Achieved!' : `${(80 - stats.winRate).toFixed(1)}% to go`}
                  </p>
                  <p className="text-sm text-muted-foreground">80%+ Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}