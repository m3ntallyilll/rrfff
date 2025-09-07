import { useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Keyboard, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { WaveformVisualizer } from "./waveform-visualizer";
import { formatDuration } from "@/lib/audio-utils";
import { motion, AnimatePresence } from "framer-motion";

interface RecordingPanelProps {
  onRecordingComplete?: (recording: { blob: Blob; duration: number; url: string }) => void;
  onTextSubmit?: (text: string) => void;
  onRecordingStart?: () => void;
  profanityFilter: boolean;
  onProfanityFilterChange: (enabled: boolean) => void;
  lyricComplexity: number;
  onLyricComplexityChange: (value: number) => void;
  styleIntensity: number;
  onStyleIntensityChange: (value: number) => void;
  disabled?: boolean;
}

export function RecordingPanel({ 
  onRecordingComplete, 
  onTextSubmit,
  onRecordingStart,
  profanityFilter, 
  onProfanityFilterChange,
  lyricComplexity,
  onLyricComplexityChange,
  styleIntensity,
  onStyleIntensityChange,
  disabled = false 
}: RecordingPanelProps) {
  const [micSensitivity, setMicSensitivity] = useState<number[]>([75]);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const { 
    isRecording, 
    audioLevels, 
    recordingDuration, 
    toggleRecording 
  } = useAudioRecorder();

  // Set up global callback for recording completion
  if (onRecordingComplete) {
    window.audioRecordingCallback = onRecordingComplete;
  }

  const getRecordingStatus = () => {
    if (disabled) return "Battle in progress...";
    if (isRecording) return "Recording... Speak now!";
    
    // Check if we're on mobile and provide specific guidance
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      return "Tap to record (ensure mic permission is enabled)";
    }
    
    return "Press to start recording";
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && onTextSubmit) {
      onTextSubmit(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="bg-battle-gray rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron font-bold text-lg text-accent-gold">
          {inputMode === 'voice' ? <Mic className="inline mr-2" size={20} /> : <Keyboard className="inline mr-2" size={20} />}
          Your Turn
        </h3>
        
        {/* Input Mode Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={inputMode === 'voice' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('voice')}
            className={`px-3 py-1 ${
              inputMode === 'voice'
                ? 'bg-accent-blue text-white'
                : 'border-gray-600 text-gray-400 hover:bg-gray-700'
            }`}
            data-testid="button-voice-mode"
          >
            <Mic className="w-4 h-4 mr-1" />
            Voice
          </Button>
          <Button
            variant={inputMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('text')}
            className={`px-3 py-1 ${
              inputMode === 'text'
                ? 'bg-accent-gold text-black'
                : 'border-gray-600 text-gray-400 hover:bg-gray-700'
            }`}
            data-testid="button-text-mode"
          >
            <Keyboard className="w-4 h-4 mr-1" />
            Text
          </Button>
        </div>
      </div>
      
      {/* Voice Input Mode */}
      {inputMode === 'voice' && (
        <>
          {/* Recording Button */}
          <div className="text-center mb-6">
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
            >
              <Button
                onClick={() => {
                  if (!isRecording && onRecordingStart) {
                    onRecordingStart();
                  }
                  toggleRecording();
                }}
                disabled={disabled}
                className="relative w-24 h-24 bg-gradient-to-br from-accent-red to-red-600 hover:from-red-500 hover:to-red-700 rounded-full transition-all duration-300 focus:ring-4 focus:ring-accent-red focus:ring-opacity-50"
                data-testid="button-toggle-recording"
              >
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="recording"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <MicOff className="text-3xl text-white" size={32} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Mic className="text-3xl text-white" size={32} />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Recording Indicator */}
                {isRecording && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-6 h-6 bg-accent-gold rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    data-testid="indicator-recording-active"
                  />
                )}
              </Button>
            </motion.div>
          </div>

          {/* Recording Status */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400 mb-2" data-testid="text-recording-status">
              {getRecordingStatus()}
            </div>
            <div className="text-xs font-code text-accent-blue" data-testid="text-recording-duration">
              {formatDuration(recordingDuration)}
            </div>
          </div>

          {/* Audio Waveform Visualization */}
          <div className="bg-secondary-dark rounded-lg p-4 mb-4">
            <WaveformVisualizer 
              audioLevels={audioLevels} 
              isActive={isRecording}
              data-testid="visualizer-waveform"
            />
          </div>
        </>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <div className="mb-6">
          <div className="space-y-4">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your rap verse here... Let your creativity flow!"
              className="min-h-32 bg-secondary-dark border-gray-600 text-white placeholder-gray-400 resize-none"
              disabled={disabled}
              data-testid="textarea-rap-input"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {textInput.length} characters
              </div>
              <Button
                onClick={handleTextSubmit}
                disabled={disabled || !textInput.trim()}
                className="bg-accent-gold hover:bg-yellow-500 text-black font-semibold"
                data-testid="button-submit-text"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Verse
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Voice Input</span>
          <div className="flex items-center space-x-2">
            <VolumeX className="text-gray-400" size={16} />
            <Slider
              value={micSensitivity}
              onValueChange={setMicSensitivity}
              max={100}
              step={1}
              className="w-20"
              data-testid="slider-mic-sensitivity"
            />
            <Volume2 className="text-accent-blue" size={16} />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Content Safety</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {profanityFilter ? "Family" : "Battle"}
            </span>
            <Switch
              checked={profanityFilter}
              onCheckedChange={onProfanityFilterChange}
              data-testid="switch-content-safety"
            />
          </div>
        </div>

        {/* Lyric Complexity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Lyric Complexity</span>
            <span className="text-xs text-accent-blue font-semibold">{lyricComplexity}%</span>
          </div>
          <Slider
            value={[lyricComplexity]}
            onValueChange={(value) => onLyricComplexityChange(value[0])}
            max={100}
            step={5}
            className="w-full"
            data-testid="slider-lyric-complexity"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Basic</span>
            <span>Advanced</span>
            <span>Expert</span>
          </div>
        </div>

        {/* Style Intensity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Style Intensity</span>
            <span className="text-xs text-accent-red font-semibold">{styleIntensity}%</span>
          </div>
          <Slider
            value={[styleIntensity]}
            onValueChange={(value) => onStyleIntensityChange(value[0])}
            max={100}
            step={5}
            className="w-full"
            data-testid="slider-style-intensity"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Chill</span>
            <span>Aggressive</span>
            <span>Savage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
