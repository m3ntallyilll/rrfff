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
        console.log('🔇 Audio playback ended - battle can continue');
        onEnded?.();
      });

      audio.addEventListener('error', (error) => {
        console.error('🔊 Audio error:', error);
      });

      // Auto-play if enabled
      if (autoPlay) {
        console.log('🔥 Auto-playing audio immediately');
        // Add slight delay to ensure audio is loaded
        setTimeout(() => {
          audio.play().catch(error => {
            console.error('🔊 Auto-play failed:', error);
            // Try manual playback as fallback
            console.log('🔄 Retrying audio playback...');
            setTimeout(() => {
              audio.play().catch(e => console.error('🔊 Retry failed:', e));
            }, 500);
          });
        }, 100);
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