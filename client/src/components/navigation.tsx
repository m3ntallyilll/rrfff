import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Settings, Home, Trophy, Sword, Crown } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="fixed top-6 right-6 z-[100] max-w-[calc(100vw-3rem)]">
      <div className="flex gap-2 flex-wrap justify-end">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            <Home className="w-4 h-4" />
          </Button>
        </Link>
        
        <Link href="/battle">
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            <Sword className="w-4 h-4" />
          </Button>
        </Link>
        
        <Link href="/tournaments">
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            <Trophy className="w-4 h-4" />
          </Button>
        </Link>
        
        <Link href="/subscribe">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gradient-to-r from-purple-600 to-amber-600 border-purple-500 hover:from-purple-700 hover:to-amber-700 text-white shadow-lg min-w-fit whitespace-nowrap px-3" 
            data-testid="nav-subscribe"
          >
            <Crown className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Subscribe</span>
            <span className="ml-1 sm:hidden">Sub</span>
          </Button>
        </Link>
        
        <Link href="/settings">
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700" data-testid="nav-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}