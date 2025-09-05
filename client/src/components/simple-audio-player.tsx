import React, { useEffect, useRef } from 'react';

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

      // FORCE AUTO-PLAY - All AI responses must play automatically
      if (autoPlay) {
        console.log('🔥 ULTRA-AGGRESSIVE AUTO-PLAY - AI MUST SPEAK NOW!');
        
        const forcePlayback = () => {
          console.log('🎯 MAXIMUM FORCE PLAYBACK ATTEMPT...');
          
          // Mobile-specific autoplay preparation
          if (isMobile) {
            console.log('📱 MOBILE AUTOPLAY: Priming audio context...');
            console.log('📱 Audio unlocked status:', audioUnlocked);
            
            // If audio isn't unlocked yet, try to prime it
            if (!audioUnlocked) {
              unlockMobileAudio();
            }
            
            // Try to unlock audio context on mobile
            if (window.AudioContext || (window as any).webkitAudioContext) {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              if (audioContext.state === 'suspended') {
                console.log('📱 Resuming suspended audio context for mobile...');
                audioContext.resume().catch(e => console.log('📱 Audio context resume failed'));
              }
            }
            
            // Set mobile-specific properties - START MUTED for mobile autoplay compliance
            audio.muted = true; // Mobile browsers require starting muted for autoplay
            audio.autoplay = true;
            audio.load(); // Force reload on mobile
            
            if (isIOS) {
              console.log('🍎 iOS SPECIFIC: Setting webkitPreservesPitch to false');
              (audio as any).webkitPreservesPitch = false;
              (audio as any).mozPreservesPitch = false;
              (audio as any).preservesPitch = false;
            }
          }
          
          return audio.play().then(() => {
            console.log('✅ AUTOPLAY SUCCESS - AI VOICE ACTIVATED!');
            
            // Unmute audio after successful autoplay on mobile
            if (isMobile && audio.muted) {
              console.log('📱 UNMUTING MOBILE AUDIO after successful autoplay...');
              audio.muted = false;
              audio.volume = volume; // Restore original volume
              console.log('📱 Mobile audio unmuted, volume restored to:', volume);
            }
          }).catch(error => {
            console.error('🔊 Initial autoplay failed, deploying MEGA AGGRESSIVE retries:', error);
            
            // ULTRA AGGRESSIVE RETRY - All strategies at once
            // Strategy 1: Immediate audio loading events
            audio.addEventListener('loadeddata', () => {
              console.log('🔄 Audio loaded, FORCING IMMEDIATE PLAY...');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after loadeddata retry success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => console.log('🔄 Loadeddata retry failed'));
            }, { once: true });
            
            // Strategy 2: Can play events
            audio.addEventListener('canplay', () => {
              console.log('🔄 Audio can play, FORCING IMMEDIATE PLAY...');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after canplay retry success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => console.log('🔄 Canplay retry failed'));
            }, { once: true });
            
            // Strategy 3: Can play through events
            audio.addEventListener('canplaythrough', () => {
              console.log('🔄 Audio can play through, FORCING IMMEDIATE PLAY...');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after canplaythrough retry success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => console.log('🔄 Canplaythrough retry failed'));
            }, { once: true });
            
            // Strategy 4: Multiple delayed retries with increasing persistence
            setTimeout(() => {
              console.log('🔄 Delayed retry 1 - FORCING PLAY...');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after delayed retry 1 success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => console.log('🔄 Delayed retry 1 failed'));
            }, 100);
            
            setTimeout(() => {
              console.log('🔄 Delayed retry 2 - FORCING PLAY...');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after delayed retry 2 success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => console.log('🔄 Delayed retry 2 failed'));
            }, 300);
            
            setTimeout(() => {
              console.log('🔄 Delayed retry 3 - FORCING PLAY...');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after delayed retry 3 success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => console.log('🔄 Delayed retry 3 failed'));
            }, 600);
            
            // Strategy 5: Final nuclear option
            setTimeout(() => {
              console.log('🔥 NUCLEAR OPTION - AI MUST SPEAK NOW!');
              audio.play().then(() => {
                if (isMobile && audio.muted) {
                  console.log('📱 UNMUTING after nuclear option success...');
                  audio.muted = false;
                  audio.volume = volume;
                }
              }).catch(e => {
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