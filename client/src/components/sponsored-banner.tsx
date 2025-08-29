import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SponsoredBanner {
  id: string;
  text: string;
  image?: string;
  url?: string;
  duration: number; // How long it stays visible (ms)
}

const SPONSORED_BANNERS: SponsoredBanner[] = [
  {
    id: 'replit',
    text: 'Sponsored by Replit - Start Coding Now!',
    url: 'https://replit.com?ref=rapbattle',
    duration: 5000
  },
  {
    id: 'groq',
    text: 'Powered by Groq AI - Lightning Fast',
    url: 'https://groq.com',
    duration: 5000
  },
  {
    id: 'mentally-ill',
    text: 'M3ntally-iLL YouTube Channel',
    url: 'https://www.youtube.com/@M3ntally-iLL',
    duration: 5000
  },
  {
    id: 'battle',
    text: 'Battle Like a Pro - Join Premium!',
    url: '/subscribe',
    duration: 4000
  }
];

interface SponsoredBannerProps {
  interval?: number; // How often banners appear (ms)
  enabled?: boolean;
}

export function SponsoredBanner({ interval = 30000, enabled = true }: SponsoredBannerProps) {
  const [currentBanner, setCurrentBanner] = useState<SponsoredBanner | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const showBanner = () => {
      const randomBanner = SPONSORED_BANNERS[Math.floor(Math.random() * SPONSORED_BANNERS.length)];
      setCurrentBanner(randomBanner);
      setIsVisible(true);

      // Hide banner after duration
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setCurrentBanner(null), 500); // Wait for exit animation
      }, randomBanner.duration);
    };

    // Show first banner after initial delay
    const initialTimeout = setTimeout(showBanner, 5000);

    // Then show banners at intervals
    const intervalId = setInterval(showBanner, interval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [interval, enabled]);

  const handleClick = () => {
    if (currentBanner?.url) {
      window.open(currentBanner.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full pointer-events-none z-50">
      <AnimatePresence>
        {currentBanner && isVisible && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '0%', opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ 
              type: 'tween',
              duration: 0.8,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <div 
              className={`
                inline-flex items-center gap-3 px-6 py-3 mx-4 mt-4
                bg-gradient-to-r from-purple-600 to-blue-600 
                text-white rounded-full shadow-lg cursor-pointer
                hover:shadow-xl transition-shadow duration-300
                pointer-events-auto
              `}
              onClick={handleClick}
              data-testid="sponsored-banner"
            >
              {currentBanner.image && (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  <img 
                    src={currentBanner.image} 
                    alt="Sponsor logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <span className="text-sm font-medium tracking-wide">
                {currentBanner.text}
              </span>
              
              {currentBanner.url && (
                <button 
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
                  data-testid="banner-click-button"
                >
                  CLICK
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                    />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to control banner visibility globally
export function useSponsoredBanner() {
  const [enabled, setEnabled] = useState(true);
  
  const disable = () => setEnabled(false);
  const enable = () => setEnabled(true);
  const toggle = () => setEnabled(prev => !prev);
  
  return { enabled, disable, enable, toggle };
}