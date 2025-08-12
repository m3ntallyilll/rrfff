import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDuration } from "@/lib/audio-utils";
import { motion } from "framer-motion";

interface AudioControlsProps {
  audioUrl?: string;
  onPlaybackChange?: (isPlaying: boolean) => void;
  className?: string;
}

export function AudioControls({ 
  audioUrl, 
  onPlaybackChange,
  className = ""
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([85]);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceType, setVoiceType] = useState("hardcore");
  const [currentTrack, setCurrentTrack] = useState("AI Battle Response #2");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      // Create new audio element when URL changes
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      const audio = audioRef.current;
      
      // Set up event listeners
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration || 0);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlaybackChange?.(false);
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      
      // Set volume
      audio.volume = isMuted ? 0 : volume[0] / 100;
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
      };
    }
  }, [audioUrl, volume, isMuted, onPlaybackChange]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
    onPlaybackChange?.(!isPlaying);
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
          {currentTrack}
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
          disabled={!audioUrl}
          className="bg-gradient-to-r from-accent-red to-red-600 hover:from-red-500 hover:to-red-700 w-16 h-16 rounded-full transition transform hover:scale-105"
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
          <Select value={voiceType} onValueChange={setVoiceType}>
            <SelectTrigger className="w-40 bg-secondary-dark border-gray-600" data-testid="select-voice-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-secondary-dark border-gray-600">
              <SelectItem value="hardcore">Hardcore MC</SelectItem>
              <SelectItem value="smooth">Smooth Flow</SelectItem>
              <SelectItem value="aggressive">Aggressive Battle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
