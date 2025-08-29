import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Settings, Home, Trophy, Sword } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="fixed top-4 right-4 z-50">
      <div className="flex gap-2">
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
        
        <Link href="/settings">
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700" data-testid="nav-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}