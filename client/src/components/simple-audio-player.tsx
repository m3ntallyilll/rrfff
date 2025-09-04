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

      // Create new audio element with debug logging
      console.log('🔊 Creating new Audio element with volume:', volume);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.preload = 'auto';
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

      // FORCE AUTO-PLAY - All AI responses must play automatically
      if (autoPlay) {
        console.log('🔥 FORCING AUTO-PLAY - AI response must play');
        
        const forcePlayback = () => {
          console.log('🎯 Attempting forced playback...');
          return audio.play().then(() => {
            console.log('✅ AUTOPLAY SUCCESS - AI speaking now!');
          }).catch(error => {
            console.error('🔊 Initial autoplay failed, trying aggressive retry:', error);
            
            // AGGRESSIVE RETRY - Multiple strategies
            // Strategy 1: Wait for audio to be ready
            audio.addEventListener('loadeddata', () => {
              console.log('🔄 Audio loaded, retrying...');
              audio.play().catch(e => console.log('🔄 Loadeddata retry failed'));
            }, { once: true });
            
            // Strategy 2: Try after canplay event
            audio.addEventListener('canplay', () => {
              console.log('🔄 Audio can play, retrying...');
              audio.play().catch(e => console.log('🔄 Canplay retry failed'));
            }, { once: true });
            
            // Strategy 3: Delayed retry
            setTimeout(() => {
              console.log('🔄 Delayed retry attempt...');
              audio.play().catch(e => console.log('🔄 Delayed retry failed'));
            }, 300);
            
            // Strategy 4: Final aggressive retry
            setTimeout(() => {
              console.log('🔥 FINAL ATTEMPT - Must play now!');
              audio.play().catch(e => {
                console.error('💥 ALL AUTOPLAY ATTEMPTS FAILED - Manual interaction required');
              });
            }, 1000);
          });
        };
        
        // Multiple immediate attempts
        forcePlayback();
        setTimeout(forcePlayback, 50);
        setTimeout(forcePlayback, 200);
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