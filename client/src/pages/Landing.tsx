import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Mic, Zap, Star } from "lucide-react";
import { useEffect } from "react";

export default function Landing() {
  useEffect(() => {
    // Update page title and meta description dynamically for SEO
    document.title = "Battle Rap AI - Epic Voice-Powered Rap Battles Against AI | Face CYPHER-9000";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Experience the future of rap battles! Fight AI opponents like CYPHER-9000 with real-time voice recognition, authentic battle scoring, and 10 battles for just $1. Master your flow, perfect your rhymes, and dominate the mic!');
    }

    // Update Open Graph tags for social sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Battle Rap AI - Epic Voice-Powered Rap Battles Against AI | Face CYPHER-9000');
    }
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Experience the future of rap battles! Fight AI opponents like CYPHER-9000 with real-time voice recognition, authentic battle scoring, and 10 battles for just $1. Master your flow, perfect your rhymes, and dominate the mic!');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            Battle Rap <span className="text-purple-400">AI</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Face off against advanced AI opponents like <strong>CYPHER-9000</strong> in epic rap battles. 
            Master your flow, perfect your rhymes, and dominate the mic with just <strong>10¢ per battle</strong>!
          </p>
          
          {/* YouTube Video Embed */}
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-lg overflow-hidden shadow-2xl border border-purple-600">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/0RspT9qVNpY?autoplay=1&mute=0&controls=1"
                title="Battle Rap AI Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="max-w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Battling
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-4 text-lg"
            >
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <Badge variant="secondary" className="bg-green-900 text-green-300">
              ✓ 10 Battles for $1
            </Badge>
            <Badge variant="secondary" className="bg-blue-900 text-blue-300">
              ✓ CYPHER-9000 AI
            </Badge>
            <Badge variant="secondary" className="bg-purple-900 text-purple-300">
              ✓ Real Voice Battle
            </Badge>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Choose Your Battle Plan
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-gray-400" />
                Free
              </CardTitle>
              <CardDescription className="text-gray-400">
                Perfect for getting started
              </CardDescription>
              <div className="text-3xl font-bold">$0<span className="text-sm text-gray-400">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ 3 battles per day</li>
                <li>✓ Basic AI opponents</li>
                <li>✓ Standard voices</li>
                <li>✓ Battle history</li>
                <li className="text-gray-500">✗ Advanced analysis</li>
                <li className="text-gray-500">✗ Premium voices</li>
              </ul>
              <Button className="w-full mt-6 bg-gray-600 hover:bg-gray-700">
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card className="bg-gradient-to-b from-purple-800 to-purple-900 border-purple-600 text-white transform scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Premium
                <Badge className="bg-yellow-500 text-black text-xs">POPULAR</Badge>
              </CardTitle>
              <CardDescription className="text-purple-200">
                For serious battle rappers
              </CardDescription>
              <div className="text-3xl font-bold">$9.99<span className="text-sm text-purple-200">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ 25 battles per day</li>
                <li>✓ Advanced AI opponents</li>
                <li>✓ Premium voices</li>
                <li>✓ Battle analysis</li>
                <li>✓ No ads</li>
                <li>✓ Monthly tournaments</li>
              </ul>
              <Button 
                className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                onClick={() => window.location.href = '/api/login'}
              >
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="bg-slate-800 border-amber-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Pro
              </CardTitle>
              <CardDescription className="text-gray-400">
                For championship contenders
              </CardDescription>
              <div className="text-3xl font-bold">$19.99<span className="text-sm text-gray-400">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ Unlimited battles</li>
                <li>✓ All AI opponents</li>
                <li>✓ Custom voices</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ Tournament mode</li>
              </ul>
              <Button 
                className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => window.location.href = '/api/login'}
              >
                Go Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Battle Features
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Voice Recording</h3>
            <p className="text-gray-400 text-sm">Record your verses with studio-quality audio recognition</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">AI Opponents</h3>
            <p className="text-gray-400 text-sm">Battle CYPHER-9000 and other AI with unique rap personalities</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Real-time Analysis</h3>
            <p className="text-gray-400 text-sm">Get instant feedback on rhyme schemes and flow</p>
          </div>
          
          <div className="text-center">
            <div className="bg-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Tournaments</h3>
            <p className="text-gray-400 text-sm">Compete in ranked battles and climb the leaderboard</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 Battle Rap AI. Face CYPHER-9000 and dominate the mic!</p>
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-600 max-w-md mx-auto">
            <p className="text-sm text-gray-300 mb-2">New to Replit? Get started with hosting!</p>
            <a 
              href="https://replit.com/~" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Sign up to Replit with my referral link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}