import { motion } from "framer-motion";

interface WaveformVisualizerProps {
  audioLevels: number[];
  isActive: boolean;
  className?: string;
}

export function WaveformVisualizer({ audioLevels, isActive, className = "" }: WaveformVisualizerProps) {
  return (
    <div className={`flex items-end justify-center space-x-1 h-16 ${className}`}>
      {audioLevels.map((level, index) => (
        <motion.div
          key={index}
          className="w-2 bg-gradient-to-t from-accent-blue to-accent-gold rounded-full"
          style={{ height: `${level}%` }}
          animate={isActive ? {
            scaleY: [0.3, 1, 0.3],
            transition: {
              duration: 0.5,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut"
            }
          } : {
            scaleY: 0.3
          }}
          data-testid={`waveform-bar-${index}`}
        />
      ))}
    </div>
  );
}
