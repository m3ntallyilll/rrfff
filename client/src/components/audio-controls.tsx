import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDuration } from "@/lib/audio-utils";
import { motion } from "framer-motion";
import { attemptAutoplay } from "@/lib/audioAutoplay";

interface AudioControlsProps {
  audioUrl?: string;
  autoPlay?: boolean;
  onPlaybackChange?: (isPlaying: boolean) => void;
  className?: string;
}

export function AudioControls({ 
  audioUrl,
  autoPlay = false,
  onPlaybackChange,
  className = ""
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([85]);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  
  const currentTrack = audioUrl && !audioError ? "AI Battle Response" : "No audio available";
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousAudioUrl = useRef<string | undefined>();

  // Only reload audio when URL actually changes
  useEffect(() => {
    if (audioUrl && audioUrl !== previousAudioUrl.current) {
      previousAudioUrl.current = audioUrl;
      console.log('🎵 Loading new audio URL, size:', audioUrl.length, 'chars');
      console.log('🎵 Audio URL format:', audioUrl.substring(0, 80) + '...');
      console.log('🎵 Is base64 data URL:', audioUrl.startsWith('data:audio/'));
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Reset states
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
      setAudioLoaded(false);
      
      const audio = new Audio();
      // Optimize audio loading for performance
      audio.preload = 'metadata'; // Load faster
      audio.crossOrigin = 'anonymous'; // Handle CORS
      
      // Essential mobile attributes for reliable playback
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      audio.src = audioUrl;
      audioRef.current = audio;
      
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
        setAudioLoaded(true);
        console.log('Audio loaded, duration:', audio.duration);
        
        // Attempt auto-play when audio is ready
        if (autoPlay) {
          console.log('🎵 AudioControls: Attempting auto-play with shared manager');
          attemptAutoplay(audio, {
            volume: isMuted ? 0 : volume[0] / 100,
            retryAttempts: 2,
            fallbackToMuted: true,
            onFallback: () => {
              console.log('🔄 AudioControls: Auto-play failed, manual control available');
              // Audio controls remain available for manual interaction
            }
          }).then(success => {
            if (success) {
              console.log('✅ AudioControls: Auto-play successful');
              setIsPlaying(true);
              onPlaybackChange?.(true);
            }
          }).catch(error => {
            console.error('🚨 AudioControls: Auto-play error:', error);
          });
        }
      };
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlaybackChange?.(false);
      };
      const handleError = (e: any) => {
        console.error('Audio loading failed:', e);
        console.log('Audio URL causing error:', audioUrl?.substring(0, 100) + '...');
        setAudioError('Failed to load audio');
        setAudioLoaded(false);
        onPlaybackChange?.(false);
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      audio.volume = isMuted ? 0 : volume[0] / 100;
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.src = '';
      };
    } else if (!audioUrl) {
      // Clear audio when no URL
      previousAudioUrl.current = undefined;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
      setAudioLoaded(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    }
  }, [audioUrl, autoPlay, volume, isMuted, onPlaybackChange]);

  // Handle volume changes separately
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  const togglePlayback = async () => {
    if (!audioRef.current || !audioLoaded) {
      console.warn('Audio not ready for playback');
      return;
    }
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPlaybackChange?.(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
        onPlaybackChange?.(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
      onPlaybackChange?.(false);
      setAudioError('Playback failed');
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume[0] / 100;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume[0] / 100;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-battle-gray rounded-xl p-6 border border-gray-700 ${className}`}>
      <h3 className="font-orbitron font-bold text-lg mb-4 text-accent-red">
        <Volume2 className="inline mr-2" size={20} />
        Audio Controls
      </h3>

      {/* Now Playing */}
      <div className="bg-secondary-dark rounded-lg p-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Now Playing:</div>
        <div className="font-semibold text-accent-gold mb-3" data-testid="text-current-track">
          {audioError ? (
            <span className="text-red-400">Audio Error: {audioError}</span>
          ) : audioUrl ? (
            currentTrack
          ) : (
            "No audio available"
          )}
        </div>
        
        {/* Audio Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span data-testid="text-current-time">{formatDuration(Math.floor(currentTime))}</span>
            <span data-testid="text-total-time">{formatDuration(Math.floor(duration))}</span>
          </div>
          <div 
            className="w-full h-2 bg-battle-gray rounded-full cursor-pointer"
            onClick={handleProgressClick}
            data-testid="progress-audio-track"
          >
            <motion.div 
              className="h-2 bg-gradient-to-r from-accent-red to-accent-gold rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-secondary-dark hover:bg-gray-600 w-12 h-12 rounded-full border-gray-600"
          data-testid="button-previous-track"
        >
          <SkipBack className="text-accent-blue" size={20} />
        </Button>
        
        <Button
          onClick={togglePlayback}
          disabled={!audioUrl || !audioLoaded || audioError !== null}
          className="bg-gradient-to-r from-accent-red to-red-600 hover:from-red-500 hover:to-red-700 w-16 h-16 rounded-full transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-toggle-playback"
        >
          {isPlaying ? (
            <Pause className="text-white" size={24} />
          ) : (
            <Play className="text-white ml-1" size={24} />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="bg-secondary-dark hover:bg-gray-600 w-12 h-12 rounded-full border-gray-600"
          data-testid="button-next-track"
        >
          <SkipForward className="text-accent-blue" size={20} />
        </Button>
      </div>

      {/* Volume & Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Master Volume</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="p-1"
              data-testid="button-toggle-mute"
            >
              {isMuted ? (
                <VolumeX className="text-gray-400" size={16} />
              ) : (
                <Volume2 className="text-accent-blue" size={16} />
              )}
            </Button>
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
              data-testid="slider-master-volume"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Voice Type</span>
          <div className="text-sm text-accent-gold font-semibold">
            Hardcore MC (Fixed)
          </div>
        </div>
      </div>
    </div>
  );
}
