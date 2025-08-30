import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, ExternalLink } from "lucide-react";
import { useEffect } from "react";

export default function Blog() {
  useEffect(() => {
    document.title = "Battle Rap AI Blog - CYPHER-9000 Secrets & Rap Battle Tips";
  }, []);

  const blogPosts = [
    {
      id: 1,
      title: "CYPHER-9000's Secret Training Methods REVEALED",
      excerpt: "How the undefeated AI rapper learned to destroy 10,000+ human opponents using advanced neural networks and battle analysis.",
      date: "January 15, 2025",
      author: "Battle Rap AI Team",
      readTime: "5 min read",
      category: "AI Insights",
      featured: true,
      image: "/social-share-image.jpg"
    },
    {
      id: 2,
      title: "5 Rappers Who Almost Beat CYPHER-9000 (What Went Wrong)",
      excerpt: "Breaking down the closest battles in CYPHER-9000 history and what these rappers could have done differently.",
      date: "January 12, 2025", 
      author: "MC Analysis",
      readTime: "7 min read",
      category: "Battle Breakdowns",
      image: "/blog-battle-breakdown.jpg"
    },
    {
      id: 3,
      title: "Voice Recognition Technology: How CYPHER-9000 Reads Your Flow",
      excerpt: "The cutting-edge AI technology that allows CYPHER-9000 to analyze your rap style in real-time and counter-attack.",
      date: "January 10, 2025",
      author: "Tech Team",
      readTime: "6 min read", 
      category: "Technology",
      image: "/blog-voice-tech.jpg"
    },
    {
      id: 4,
      title: "Building Your Perfect Battle Rap Setup: Equipment Guide",
      excerpt: "Professional microphones, audio interfaces, and studio setups used by the pros who challenge CYPHER-9000.",
      date: "January 8, 2025",
      author: "Audio Expert",
      readTime: "8 min read",
      category: "Equipment",
      image: "/blog-studio-setup.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Battle Rap AI <span className="text-purple-400">Blog</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Inside secrets, battle breakdowns, and everything you need to know about facing CYPHER-9000
        </p>
      </div>

      {/* Featured Post */}
      <div className="container mx-auto px-4 mb-16">
        <Card className="bg-gradient-to-r from-purple-800 to-purple-900 border-purple-600 text-white overflow-hidden">
          <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/social-share-image.jpg)' }}>
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-yellow-500 text-black">FEATURED</Badge>
                <Badge variant="outline" className="border-purple-400 text-purple-300">
                  {blogPosts[0].category}
                </Badge>
              </div>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-3xl">{blogPosts[0].title}</CardTitle>
            <CardDescription className="text-purple-200 text-lg">
              {blogPosts[0].excerpt}
            </CardDescription>
            <div className="flex items-center gap-4 text-sm text-purple-300 mt-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {blogPosts[0].date}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {blogPosts[0].author}
              </div>
              <span>{blogPosts[0].readTime}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              Read Full Article
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Latest Articles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.slice(1).map((post) => (
            <Card key={post.id} className="bg-slate-800 border-slate-700 text-white hover:border-purple-600 transition-colors overflow-hidden">
              <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }}>
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                <div className="absolute top-4 left-4">
                  <Badge variant="outline" className="border-gray-600 text-gray-200 bg-black bg-opacity-60">
                    {post.category}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  {post.excerpt}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </div>
                  <span>{post.readTime}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white">
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Special Opportunity Section */}
      <div className="container mx-auto px-4 mb-16">
        <Card className="bg-gradient-to-r from-green-800 to-emerald-900 border-green-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">
              🚀 EXCLUSIVE OPPORTUNITY: Multiply Your Rap Skills Exponentially!
            </CardTitle>
            <CardDescription className="text-green-200 text-lg">
              Want to level up your rap game faster than ever? Join our exclusive network where rappers help rappers succeed through our proven pyramid training system.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">How It Works:</h3>
              <ul className="text-left max-w-md mx-auto space-y-2 text-green-100">
                <li>✓ Train 3 new rappers using our proven methods</li>
                <li>✓ Each rapper you train brings in 3 more</li>
                <li>✓ Earn battle credits for every successful training</li>
                <li>✓ Build your rap empire while improving your skills</li>
                <li>✓ Exclusive access to CYPHER-9000 training data</li>
              </ul>
            </div>
            <div className="bg-yellow-500 text-black p-4 rounded-lg mb-6">
              <p className="font-bold">🔥 LIMITED TIME: First 100 members get FREE premium battles!</p>
            </div>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4"
              onClick={() => window.open('https://rapbattlepyramid.com/join', '_blank')}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Join The Rap Battle Network Now!
            </Button>
            <p className="text-sm text-green-300 mt-4">
              *This exclusive opportunity is only available to serious rappers ready to take their skills to the next level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Signup */}
      <div className="container mx-auto px-4 mb-16">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Stay Updated with CYPHER-9000 Intel</CardTitle>
            <CardDescription className="text-gray-400">
              Get exclusive battle tips, AI insights, and early access to new features
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              />
              <Button className="bg-purple-600 hover:bg-purple-700">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}