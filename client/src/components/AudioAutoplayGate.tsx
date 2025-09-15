/**
 * AudioAutoplayGate - One-time overlay to enable audio across the entire app
 * 
 * This component shows a global overlay until the user enables audio,
 * then persists the unlock state so it never shows again.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager, onAudioUnlockStateChange } from '@/lib/audioAutoplay';

interface AudioAutoplayGateProps {
  /** Optional callback when audio is successfully unlocked */
  onAudioUnlocked?: () => void;
  /** Show detailed platform-specific instructions */
  showDetailedInstructions?: boolean;
}

export function AudioAutoplayGate({ 
  onAudioUnlocked,
  showDetailedInstructions = true 
}: AudioAutoplayGateProps) {
  const [showGate, setShowGate] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [platform, setPlatform] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setPlatform(isMobile ? 'mobile' : 'desktop');

    // Check if audio is already unlocked
    const checkUnlockState = () => {
      const isUnlocked = audioManager.isUnlocked();
      const wasUnlocked = localStorage.getItem('audioUnlocked') === 'true';
      
      console.log('🎵 AudioAutoplayGate: Checking unlock state', {
        isUnlocked,
        wasUnlocked,
        shouldShow: !isUnlocked && !wasUnlocked
      });

      // Show gate if audio is not unlocked and hasn't been unlocked before
      setShowGate(!isUnlocked && !wasUnlocked);
    };

    checkUnlockState();

    // Listen for unlock state changes
    const unsubscribe = onAudioUnlockStateChange((unlocked) => {
      console.log('🎵 AudioAutoplayGate: Audio unlock state changed:', unlocked);
      if (unlocked) {
        setShowGate(false);
        setIsUnlocking(false);
        onAudioUnlocked?.();
      }
    });

    return unsubscribe;
  }, [onAudioUnlocked]);

  const handleEnableAudio = async () => {
    console.log('🎵 AudioAutoplayGate: User clicked enable audio');
    setIsUnlocking(true);

    try {
      const success = await audioManager.ensureUnlocked();
      
      if (success) {
        console.log('✅ Audio successfully unlocked via gate');
        localStorage.setItem('audioUnlocked', 'true');
        setShowGate(false);
        onAudioUnlocked?.();
      } else {
        console.warn('🔊 Audio unlock failed via gate');
        // Keep the gate open and reset loading state
        setIsUnlocking(false);
      }
    } catch (error) {
      console.error('🚨 Error during audio unlock:', error);
      setIsUnlocking(false);
    }
  };

  if (!showGate) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        data-testid="overlay-audio-autoplay-gate"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 to-black border-accent-gold/20">
            <CardHeader className="text-center pb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                className="mx-auto mb-4"
              >
                {platform === 'mobile' ? (
                  <Smartphone className="w-12 h-12 text-accent-gold" />
                ) : (
                  <Monitor className="w-12 h-12 text-accent-gold" />
                )}
              </motion.div>
              
              <CardTitle className="text-xl font-orbitron text-white mb-2">
                🎵 Enable Sound for Battle Arena
              </CardTitle>
              
              <CardDescription className="text-gray-300">
                Get ready for epic AI rap battles with immersive audio!
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {showDetailedInstructions && (
                <div className="bg-secondary-dark rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-accent-blue flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    What to expect:
                  </h4>
                  
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• AI responses will play automatically</li>
                    <li>• Crowd reactions and sound effects</li>
                    <li>• Background music and battle atmosphere</li>
                    {platform === 'mobile' && (
                      <li>• Optimized for {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android'} devices</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleEnableAudio}
                  disabled={isUnlocking}
                  size="lg"
                  className="w-full bg-gradient-to-r from-accent-red to-accent-gold hover:from-accent-red/90 hover:to-accent-gold/90 font-orbitron font-bold"
                  data-testid="button-enable-sound"
                >
                  {isUnlocking ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 mr-2"
                    >
                      <VolumeX className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Volume2 className="w-5 h-5 mr-2" />
                  )}
                  {isUnlocking ? 'Enabling Audio...' : 'Enable Sound'}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  {platform === 'mobile' 
                    ? 'Tap to unlock audio for mobile autoplay'
                    : 'Click to enable automatic audio playback'
                  }
                </p>
              </div>

              {platform === 'mobile' && (
                <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-lg p-3">
                  <p className="text-xs text-accent-blue">
                    <strong>Mobile Tip:</strong> After enabling, audio will play automatically during battles without further interaction.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}