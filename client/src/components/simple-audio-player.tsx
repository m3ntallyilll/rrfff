import React, { useEffect, useRef } from 'react';

interface SimpleAudioPlayerProps {
  audioUrl?: string;
  autoPlay?: boolean;
  volume?: number;
  onPlay?: () => void;
  onEnded?: () => void;
}

export function SimpleAudioPlayer({ 
  audioUrl, 
  autoPlay = false, 
  volume = 1.0,
  onPlay,
  onEnded 
}: SimpleAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

      // Create new audio element
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.preload = 'auto';
      audioRef.current = audio;

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

      // Auto-play if enabled - Enhanced for reliability
      if (autoPlay) {
        console.log('🔥 Auto-playing audio immediately');
        
        // Try immediate playback first
        const tryPlayback = () => {
          return audio.play().then(() => {
            console.log('✅ Autoplay successful');
          }).catch(error => {
            console.error('🔊 Auto-play failed:', error);
            
            // Enhanced retry mechanism with multiple attempts
            console.log('🔄 Attempting enhanced playback retry...');
            
            // Try again after ensuring audio is loaded
            audio.addEventListener('canplaythrough', () => {
              audio.play().catch(e => console.error('🔊 Canplaythrough retry failed:', e));
            }, { once: true });
            
            // Also try after a delay
            setTimeout(() => {
              audio.play().catch(e => {
                console.error('🔊 Delayed retry failed:', e);
                console.log('💡 Audio may require user interaction to play');
              });
            }, 500);
          });
        };
        
        // Immediate attempt
        tryPlayback();
        
        // Also try after a short delay to ensure DOM is ready
        setTimeout(tryPlayback, 100);
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [audioUrl, autoPlay, volume]);

  // This component is invisible - it only handles audio playback
  return null;
}