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
        console.log('🔥 ULTRA-AGGRESSIVE AUTO-PLAY - AI MUST SPEAK NOW!');
        
        const forcePlayback = () => {
          console.log('🎯 MAXIMUM FORCE PLAYBACK ATTEMPT...');
          return audio.play().then(() => {
            console.log('✅ AUTOPLAY SUCCESS - AI VOICE ACTIVATED!');
          }).catch(error => {
            console.error('🔊 Initial autoplay failed, deploying MEGA AGGRESSIVE retries:', error);
            
            // ULTRA AGGRESSIVE RETRY - All strategies at once
            // Strategy 1: Immediate audio loading events
            audio.addEventListener('loadeddata', () => {
              console.log('🔄 Audio loaded, FORCING IMMEDIATE PLAY...');
              audio.play().catch(e => console.log('🔄 Loadeddata retry failed'));
            }, { once: true });
            
            // Strategy 2: Can play events
            audio.addEventListener('canplay', () => {
              console.log('🔄 Audio can play, FORCING IMMEDIATE PLAY...');
              audio.play().catch(e => console.log('🔄 Canplay retry failed'));
            }, { once: true });
            
            // Strategy 3: Can play through events
            audio.addEventListener('canplaythrough', () => {
              console.log('🔄 Audio can play through, FORCING IMMEDIATE PLAY...');
              audio.play().catch(e => console.log('🔄 Canplaythrough retry failed'));
            }, { once: true });
            
            // Strategy 4: Multiple delayed retries with increasing persistence
            setTimeout(() => {
              console.log('🔄 Delayed retry 1 - FORCING PLAY...');
              audio.play().catch(e => console.log('🔄 Delayed retry 1 failed'));
            }, 100);
            
            setTimeout(() => {
              console.log('🔄 Delayed retry 2 - FORCING PLAY...');
              audio.play().catch(e => console.log('🔄 Delayed retry 2 failed'));
            }, 300);
            
            setTimeout(() => {
              console.log('🔄 Delayed retry 3 - FORCING PLAY...');
              audio.play().catch(e => console.log('🔄 Delayed retry 3 failed'));
            }, 600);
            
            // Strategy 5: Final nuclear option
            setTimeout(() => {
              console.log('🔥 NUCLEAR OPTION - AI MUST SPEAK NOW!');
              audio.play().catch(e => {
                console.error('💥 ALL MEGA AGGRESSIVE ATTEMPTS FAILED - Manual interaction required');
                // Last resort: try to trigger user interaction
                console.log('🚨 LAST RESORT: Attempting user interaction trigger...');
              });
            }, 1000);
          });
        };
        
        // MAXIMUM IMMEDIATE ATTEMPTS - Carpet bombing approach
        forcePlayback();
        setTimeout(forcePlayback, 25);
        setTimeout(forcePlayback, 50);
        setTimeout(forcePlayback, 100);
        setTimeout(forcePlayback, 200);
        setTimeout(forcePlayback, 400);
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