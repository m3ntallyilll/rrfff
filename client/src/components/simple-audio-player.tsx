import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

// Global mobile audio unlock state
let audioUnlocked = false;

// Mobile audio unlock function - primes audio for autoplay
const unlockMobileAudio = () => {
  if (audioUnlocked) return;
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return;
  
  console.log('📱 UNLOCKING MOBILE AUDIO for autoplay...');
  
  // Create a silent audio context to unlock audio
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('📱 Audio context resumed for mobile');
      audioUnlocked = true;
    }).catch(e => console.log('📱 Audio context resume failed'));
  } else {
    audioUnlocked = true;
  }
  
  // Create a brief silent audio to unlock
  const buffer = audioContext.createBuffer(1, 1, 22050);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
  
  console.log('📱 Mobile audio unlocked for future autoplay');
};

// Add global event listeners for mobile audio unlock
if (typeof window !== 'undefined') {
  ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
    window.addEventListener(event, unlockMobileAudio, { once: true });
  });
}

interface SimpleAudioPlayerProps {
  audioUrl?: string;
  autoPlay?: boolean;
  volume?: number;
  onPlay?: () => void;
  onEnded?: () => void;
  showFallbackButton?: boolean;
}

export function SimpleAudioPlayer({ 
  audioUrl, 
  autoPlay = false, 
  volume = 1.0,
  onPlay,
  onEnded,
  showFallbackButton = true 
}: SimpleAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);

  useEffect(() => {
    if (audioUrl) {
      console.log('🎵 SimpleAudioPlayer: New audio URL received');
      console.log('🎵 Audio URL length:', audioUrl.length);
      console.log('🎵 Audio URL format:', audioUrl.substring(0, 50) + '...');
      console.log('🎵 Auto-play enabled:', autoPlay);
      
      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      console.log('📱 Mobile device detected:', isMobile);
      console.log('🍎 iOS device detected:', isIOS);
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element with debug logging
      console.log('🔊 Creating new Audio element with volume:', volume);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.preload = 'auto';
      
      // Mobile-specific audio setup
      if (isMobile) {
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        console.log('📱 Mobile audio attributes set: playsinline=true');
      }
      
      audioRef.current = audio;
      
      // Debug audio properties
      console.log('🔊 Audio element created:', audio);
      console.log('🔊 Audio volume set to:', audio.volume);
      console.log('🔊 Audio src:', audio.src.substring(0, 100) + '...');
      console.log('🔊 Audio readyState:', audio.readyState);
      console.log('🔊 Audio networkState:', audio.networkState);

      // Event listeners
      audio.addEventListener('play', () => {
        console.log('🔊 Audio started playing');
        onPlay?.();
      });

      audio.addEventListener('ended', () => {
        console.log('🔇 Audio playback ended');
        onEnded?.();
      });

      audio.addEventListener('error', (error) => {
        console.error('🔊 Audio error:', error);
      });

      // SMART AUTO-PLAY - Reliable AI voice playback across all platforms
      if (autoPlay) {
        console.log('🔥 SMART AUTO-PLAY - AI Voice Activation');
        
        const attemptPlayback = async () => {
          console.log('🎯 Attempting smart playback...');
          
          try {
            // Strategy 1: Direct play attempt first (works for desktop)
            await audio.play();
            console.log('✅ Direct autoplay successful!');
            onPlay?.();
            return true;
          } catch (directError) {
            console.log('🔄 Direct autoplay failed, trying mobile-optimized approach...');
            
            // Strategy 2: Mobile-optimized approach
            if (isMobile) {
              try {
                // Mobile requires muted start for autoplay
                audio.muted = true;
                audio.autoplay = true;
                
                // Resume audio context if suspended
                if (window.AudioContext || (window as any).webkitAudioContext) {
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                  }
                }
                
                // Force load and play
                audio.load();
                await audio.play();
                
                // Unmute after successful start (smooth transition)
                setTimeout(() => {
                  audio.muted = false;
                  audio.volume = volume;
                  console.log('📱 Mobile audio unmuted successfully');
                }, 100);
                
                console.log('✅ Mobile autoplay successful!');
                onPlay?.();
                return true;
              } catch (mobileError) {
                console.log('📱 Mobile autoplay failed, falling back to user interaction');
              }
            }
            
            // Strategy 3: Show fallback button for user interaction
            console.log('🔄 Autoplay blocked, showing fallback play button...');
            if (showFallbackButton) {
              setShowPlayButton(true);
              setAutoplayAttempted(true);
            }
            
            // Wait for audio to be ready, then try again
            const tryAfterReady = () => {
              console.log('🔄 Audio ready, attempting playback...');
              audio.play().then(() => {
                console.log('✅ Event-triggered playback successful!');
                setShowPlayButton(false);
                onPlay?.();
              }).catch(e => {
                console.log('🔄 Event-triggered playback failed');
                if (showFallbackButton) {
                  setShowPlayButton(true);
                }
              });
            };
            
            // Try when audio data loads
            audio.addEventListener('loadeddata', tryAfterReady, { once: true });
            audio.addEventListener('canplay', tryAfterReady, { once: true });
            
            return false;
          }
        };
        
        // Immediate attempt
        attemptPlayback();
        
        // Backup attempts with delays
        setTimeout(() => attemptPlayback(), 100);
        setTimeout(() => attemptPlayback(), 300);
        
        // Final fallback for stubborn browsers
        setTimeout(() => {
          if (audio.paused) {
            console.log('🔄 Final fallback attempt...');
            audio.play().catch(error => {
              console.log('🚨 All autoplay attempts failed - user interaction required');
              if (showFallbackButton) {
                setShowPlayButton(true);
                setAutoplayAttempted(true);
              }
            });
          }
        }, 600);
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [audioUrl, autoPlay, volume]);

  // Handle manual play button click
  const handleManualPlay = async () => {
    if (audioRef.current) {
      try {
        console.log('🎯 Manual play button clicked');
        await audioRef.current.play();
        setShowPlayButton(false);
        onPlay?.();
      } catch (error) {
        console.error('🔊 Manual play failed:', error);
      }
    }
  };

  // Show play button fallback when autoplay fails
  if (showPlayButton && autoplayAttempted) {
    return (
      <div className="flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Audio playback blocked by browser</p>
          <Button 
            onClick={handleManualPlay}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-manual-play"
          >
            <Play className="w-4 h-4" />
            Play Audio
          </Button>
        </div>
      </div>
    );
  }

  // Hidden by default - only handles audio playback
  return null;
}