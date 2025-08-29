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

      // Auto-play if enabled
      if (autoPlay) {
        console.log('🔥 Auto-playing audio immediately');
        audio.play().catch(error => {
          console.error('🔊 Auto-play failed:', error);
        });
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