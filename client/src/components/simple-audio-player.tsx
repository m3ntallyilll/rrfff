import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { attemptAutoplay, isAudioUnlocked } from '@/lib/audioAutoplay';

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
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element with optimal settings
      console.log('🔊 Creating new Audio element with volume:', volume);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.preload = 'auto';
      
      // Essential mobile attributes for reliable playback
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      audioRef.current = audio;
      
      // Event listeners
      audio.addEventListener('play', () => {
        console.log('🔊 Audio started playing');
        setShowPlayButton(false); // Hide fallback button on successful play
        onPlay?.();
      });

      audio.addEventListener('ended', () => {
        console.log('🔇 Audio playback ended');
        onEnded?.();
      });

      audio.addEventListener('error', (error) => {
        console.error('🔊 Audio error:', error);
        if (showFallbackButton) {
          setShowPlayButton(true);
          setAutoplayAttempted(true);
        }
      });

      // Use shared audio manager for comprehensive auto-play
      if (autoPlay) {
        console.log('🔥 Using shared AudioManager for auto-play');
        
        attemptAutoplay(audio, {
          volume,
          retryAttempts: 3,
          fallbackToMuted: true,
          onFallback: () => {
            console.log('🔄 Auto-play failed - showing fallback button');
            if (showFallbackButton) {
              setShowPlayButton(true);
              setAutoplayAttempted(true);
            }
          }
        }).then(success => {
          if (success) {
            console.log('✅ Shared manager auto-play successful');
            onPlay?.();
          }
        }).catch(error => {
          console.error('🚨 Shared manager auto-play error:', error);
          if (showFallbackButton) {
            setShowPlayButton(true);
            setAutoplayAttempted(true);
          }
        });
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [audioUrl, autoPlay, volume, showFallbackButton, onPlay, onEnded]);

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