import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Trophy, Users, Calendar, Play, Crown, Zap, History, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Tournament } from '@shared/schema';
const tournamentImage = "/images/Tournament_championship_bracket_0fd32970.png";

interface CreateTournamentForm {
  name: string;
  type: 'single_elimination' | 'double_elimination';
  totalRounds: number;
  difficulty: string;
  profanityFilter: boolean;
  lyricComplexity: number;
  styleIntensity: number;
  prize: string;
}

export default function Tournaments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateTournamentForm>({
    name: '',
    type: 'single_elimination',
    totalRounds: 3,
    difficulty: 'normal',
    profanityFilter: false,
    lyricComplexity: 50,
    styleIntensity: 50,
    prize: 'Tournament Champion Title'
  });

  // Fetch user's tournaments
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch active tournaments (leaderboard)
  const { data: activeTournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments/active'],
  });

  // Create tournament mutation
  const createTournament = useMutation({
    mutationFn: async (data: CreateTournamentForm) => {
      return apiRequest('POST', '/api/tournaments', data);
    },
    onSuccess: () => {
      toast({
        title: "Tournament Created!",
        description: "Your tournament has been created successfully.",
      });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTournament = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a tournament name.",
        variant: "destructive",
      });
      return;
    }
    createTournament.mutate(formData);
  };

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

  return (
    <div className="min-h-screen bg-black text-white p-4 relative">
      {/* Tournament Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-12 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${tournamentImage})` }}
      />
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Tournament Mode
            </h1>
            <p className="text-gray-400">Compete in elimination tournaments against multiple AI opponents</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" data-testid="button-create-tournament">
                <Trophy className="mr-2" size={20} />
                Create Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Tournament</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Set up your tournament bracket and challenge multiple AI opponents
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-white">Tournament Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Ultimate Rap Championship"
                    className="bg-gray-800 border-gray-700 text-white"
                    data-testid="input-tournament-name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-white">Tournament Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-tournament-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="single_elimination">Single Elimination</SelectItem>
                      <SelectItem value="double_elimination">Double Elimination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-white">Tournament Size</Label>
                  <Select value={formData.totalRounds.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, totalRounds: parseInt(value) }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-tournament-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="2">4 Opponents (2 Rounds)</SelectItem>
                      <SelectItem value="3">8 Opponents (3 Rounds)</SelectItem>
                      <SelectItem value="4">16 Opponents (4 Rounds)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-white">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lyric Complexity Slider */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Lyric Complexity</Label>
                    <span className="text-sm text-purple-400 font-medium">{formData.lyricComplexity}%</span>
                  </div>
                  <Slider
                    value={[formData.lyricComplexity]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, lyricComplexity: value[0] }))}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-lyric-complexity"
                  />
                </div>

                {/* Style Intensity Slider */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Style Intensity</Label>
                    <span className="text-sm text-pink-400 font-medium">{formData.styleIntensity}%</span>
                  </div>
                  <Slider
                    value={[formData.styleIntensity]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, styleIntensity: value[0] }))}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-style-intensity"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Content Safety</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formData.profanityFilter ? "Family" : "Battle"}
                    </span>
                    <Switch
                      checked={formData.profanityFilter}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, profanityFilter: checked }))}
                      data-testid="switch-content-safety"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="prize" className="text-white">Prize</Label>
                  <Input
                    id="prize"
                    value={formData.prize}
                    onChange={(e) => setFormData(prev => ({ ...prev, prize: e.target.value }))}
                    placeholder="Tournament Champion Title"
                    className="bg-gray-800 border-gray-700 text-white"
                    data-testid="input-prize"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-700 text-white hover:bg-gray-800">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTournament}
                  disabled={createTournament.isPending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-create-confirm"
                >
                  {createTournament.isPending ? "Creating..." : "Create Tournament"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/tournaments/brackets')}
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10 h-auto p-4"
            data-testid="button-nav-brackets"
          >
            <div className="flex flex-col items-center space-y-2">
              <Target size={24} />
              <div className="text-center">
                <div className="font-semibold">Live Brackets</div>
                <div className="text-xs text-gray-400">Active tournaments</div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation('/tournaments/leaderboard')}
            className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 h-auto p-4"
            data-testid="button-nav-leaderboard"
          >
            <div className="flex flex-col items-center space-y-2">
              <Crown size={24} />
              <div className="text-center">
                <div className="font-semibold">Leaderboard</div>
                <div className="text-xs text-gray-400">Top champions</div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation('/tournaments/history')}
            className="border-blue-500 text-blue-400 hover:bg-blue-500/10 h-auto p-4"
            data-testid="button-nav-history"
          >
            <div className="flex flex-col items-center space-y-2">
              <History size={24} />
              <div className="text-center">
                <div className="font-semibold">History</div>
                <div className="text-xs text-gray-400">Your battles</div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation('/tournaments')}
            className="border-green-500 text-green-400 hover:bg-green-500/10 h-auto p-4"
            data-testid="button-nav-tournaments"
          >
            <div className="flex flex-col items-center space-y-2">
              <BarChart3 size={24} />
              <div className="text-center">
                <div className="font-semibold">Analytics</div>
                <div className="text-xs text-gray-400">Performance</div>
              </div>
            </div>
          </Button>
        </div>

        <Tabs defaultValue="my-tournaments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900">
            <TabsTrigger value="my-tournaments" className="data-[state=active]:bg-purple-600" data-testid="tab-my-tournaments">
              <Users className="mr-2" size={16} />
              My Tournaments
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600" data-testid="tab-leaderboard">
              <Crown className="mr-2" size={16} />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-tournaments" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
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
                      <CardDescription className="text-gray-400">
                        {tournament.type === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>Difficulty:</span>
                          <span className="capitalize">{tournament.difficulty}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Prize:</span>
                          <span className="text-yellow-400">{tournament.prize}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Complexity:</span>
                          <span>{tournament.lyricComplexity}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Intensity:</span>
                          <span>{tournament.styleIntensity}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Link href={`/tournament/${tournament.id}`}>
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            data-testid={`button-view-tournament-${tournament.id}`}
                          >
                            {tournament.status === 'active' ? (
                              <>
                                <Play className="mr-2" size={16} />
                                Continue Tournament
                              </>
                            ) : (
                              <>
                                <Trophy className="mr-2" size={16} />
                                View Results
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-700 text-center py-12">
                <CardContent>
                  <Trophy className="mx-auto mb-4 text-gray-500" size={64} />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tournaments Yet</h3>
                  <p className="text-gray-400 mb-4">Create your first tournament to compete against multiple AI opponents</p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    data-testid="button-create-first-tournament"
                  >
                    <Trophy className="mr-2" size={16} />
                    Create Tournament
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="mr-2 text-yellow-400" size={24} />
                  Tournament Champions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Top performers in tournament mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Zap className="mx-auto mb-4 text-gray-500" size={48} />
                  <p className="text-gray-400">Leaderboard coming soon!</p>
                  <p className="text-sm text-gray-500 mt-2">Complete tournaments to earn your place among the champions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}