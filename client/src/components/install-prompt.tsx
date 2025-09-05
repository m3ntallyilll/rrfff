import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallEvent);
      
      // Show prompt after a delay if not iOS and not already installed
      if (!iOS && !standalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show prompt after delay if not already installed
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('🎵 User accepted PWA install');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('🎵 Install prompt failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed, dismissed this session, or not supported
  if (isStandalone || 
      sessionStorage.getItem('installPromptDismissed') || 
      (!deferredPrompt && !isIOS) || 
      !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-gradient-to-r from-accent-gold to-accent-red p-4 rounded-lg shadow-lg border border-accent-gold/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-black/70 hover:text-black transition-colors"
          data-testid="button-dismiss-install"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-black/20 p-2 rounded-full">
            <Smartphone className="text-black" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-black text-sm">Install RapBots</h3>
            <p className="text-black/80 text-xs">
              {isIOS 
                ? "Add to your home screen for quick access!" 
                : "Get the full app experience!"
              }
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="text-black/80 text-xs space-y-1">
            <p>• Tap the Share button below</p>
            <p>• Select "Add to Home Screen"</p>
            <p>• Tap "Add" to install</p>
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            className="w-full bg-black text-accent-gold hover:bg-black/90 text-sm py-2"
            data-testid="button-install-app"
          >
            <Download size={16} className="mr-2" />
            Install App
          </Button>
        )}
      </div>
    </div>
  );
}