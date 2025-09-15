import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { SponsoredBanner } from "@/components/sponsored-banner";
import { ErrorBoundary } from "@/components/error-boundary";
import { InstallPrompt } from "@/components/install-prompt";
import { AudioAutoplayGate } from "@/components/AudioAutoplayGate";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Subscribe from "@/pages/Subscribe";
import BattleArena from "@/pages/battle-arena";
import Tournaments from "@/pages/tournaments";
import TournamentDetail from "@/pages/tournament-detail";
import TournamentLeaderboard from "@/pages/tournament-leaderboard";
import TournamentHistory from "@/pages/tournament-history";
import TournamentBrackets from "@/pages/tournament-brackets";
import FineTuning from "@/pages/fine-tuning";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-black">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyber-red border-t-transparent rounded-full mb-4 glow-red" />
          <div className="text-cyber-red font-orbitron text-lg glow-red digital-flicker">
            🤖 SYSTEM INITIALIZING...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/battle" component={BattleArena} />
          <Route path="/battle/:id" component={BattleArena} />
          <Route path="/tournaments" component={Tournaments} />
          <Route path="/tournaments/leaderboard" component={TournamentLeaderboard} />
          <Route path="/tournaments/history" component={TournamentHistory} />
          <Route path="/tournaments/brackets" component={TournamentBrackets} />
          <Route path="/tournament/:id" component={TournamentDetail} />
          <Route path="/tournament/:tournamentId/battle/:battleId" component={BattleArena} />
          <Route path="/fine-tuning" component={FineTuning} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-primary-dark via-secondary-dark to-primary-dark">
            <Toaster />
            <SponsoredBanner interval={25000} enabled={true} />
            <InstallPrompt />
            <AudioAutoplayGate 
              showDetailedInstructions={true}
              onAudioUnlocked={() => {
                console.log('🎵 Global audio unlocked - all auto-play features enabled');
              }}
            />
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;