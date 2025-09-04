import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  MessageSquare, 
  Link, 
  Copy,
  Trophy,
  Target,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  hashtags?: string[];
  variant?: 'default' | 'minimal' | 'floating';
  className?: string;
  battleResult?: {
    userScore: number;
    aiScore: number;
    opponent: string;
    userWon: boolean;
  };
  leaderboardData?: {
    rank: number;
    username: string;
    score: number;
  };
}

export function SocialShare({ 
  title, 
  text, 
  url = window.location.href, 
  hashtags = [],
  variant = 'default',
  className = '',
  battleResult,
  leaderboardData
}: SocialShareProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Generate enhanced share content based on context
  const getShareContent = () => {
    let enhancedText = text;
    let enhancedHashtags = [...hashtags, 'RapBattleAI', 'AIBattle', 'FreestyleBattle'];

    if (battleResult) {
      const { userScore, aiScore, opponent, userWon } = battleResult;
      enhancedText = userWon 
        ? `🔥 VICTORY! Just defeated ${opponent} with a score of ${userScore}-${aiScore}! My flow was unstoppable! 🎤` 
        : `💪 Intense battle against ${opponent}! Score: ${userScore}-${aiScore}. Ready for the rematch! 🎯`;
      enhancedHashtags.push('BattleWon', 'RapVictory', 'AIChallenge');
    }

    if (leaderboardData) {
      const { rank, username, score } = leaderboardData;
      enhancedText = `🏆 Climbing the ranks! Currently #${rank} on the Rap Battle AI leaderboard with ${score} points! Who's ready to challenge me? 🎤`;
      enhancedHashtags.push('Leaderboard', 'TopRapper', 'Ranked');
    }

    return {
      text: enhancedText,
      hashtags: enhancedHashtags
    };
  };

  const { text: shareText, hashtags: shareHashtags } = getShareContent();
  const hashtagString = shareHashtags.map(tag => `#${tag}`).join(' ');

  const shareData = {
    title,
    text: `${shareText} ${hashtagString}`,
    url
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${url}\n\n${hashtagString}`);
      toast({
        title: "📋 Copied to clipboard!",
        description: "Share content ready to paste anywhere",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "🚀 Shared successfully!",
          description: "Thanks for spreading the word!",
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(shareHashtags.join(','))}`,
      color: 'hover:bg-blue-600'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
      color: 'hover:bg-blue-700'
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
      color: 'hover:bg-green-600'
    },
    {
      name: 'Reddit',
      icon: Target,
      url: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      color: 'hover:bg-orange-600'
    },
    {
      name: 'Discord',
      icon: Users,
      url: `https://discord.com/channels/@me`,
      color: 'hover:bg-indigo-600',
      action: () => {
        copyToClipboard();
        toast({
          title: "💬 Discord ready!",
          description: "Content copied - paste in your Discord server",
        });
      }
    }
  ];

  const openSocial = (platform: typeof socialPlatforms[0]) => {
    if (platform.action) {
      platform.action();
    } else {
      window.open(platform.url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
    setIsOpen(false);
    
    toast({
      title: `🎯 Sharing on ${platform.name}`,
      description: "Thanks for spreading the rap battle hype!",
    });
  };

  if (variant === 'minimal') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className={`text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white ${className}`}
        data-testid="button-share-minimal"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
              data-testid="button-share-floating"
            >
              <Share2 className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <DropdownMenuItem
                  key={platform.name}
                  onClick={() => openSocial(platform)}
                  className={`flex items-center text-white ${platform.color} cursor-pointer`}
                  data-testid={`menu-item-${platform.name.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  Share on {platform.name}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={copyToClipboard}
              className="flex items-center text-white hover:bg-gray-700 cursor-pointer"
              data-testid="menu-item-copy"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-purple-400" />
            <span className="font-medium text-white">Share your battle</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick share buttons */}
            {socialPlatforms.slice(0, 3).map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.name}
                  variant="outline"
                  size="sm"
                  onClick={() => openSocial(platform)}
                  className={`text-gray-400 border-gray-600 ${platform.color} hover:text-white transition-colors`}
                  data-testid={`button-${platform.name.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-400 border-gray-600 hover:bg-purple-600 hover:text-white"
                  data-testid="button-more-options"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700">
                {socialPlatforms.slice(3).map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <DropdownMenuItem
                      key={platform.name}
                      onClick={() => openSocial(platform)}
                      className={`flex items-center text-white ${platform.color} cursor-pointer`}
                      data-testid={`menu-item-${platform.name.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {platform.name}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  onClick={copyToClipboard}
                  className="flex items-center text-white hover:bg-gray-700 cursor-pointer"
                  data-testid="menu-item-copy-link"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Preview text */}
        <div className="mt-3 p-2 bg-gray-800 rounded text-sm text-gray-300">
          {shareText}
        </div>
      </CardContent>
    </Card>
  );
}