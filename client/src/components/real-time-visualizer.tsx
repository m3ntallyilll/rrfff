import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

interface RealTimeVisualizerProps {
  audioLevels: number[];
  isRecording: boolean;
  className?: string;
}

export function RealTimeVisualizer({ 
  audioLevels, 
  isRecording, 
  className = "" 
}: RealTimeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [beatDetected, setBeatDetected] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (isRecording && audioLevels.length > 0) {
        // Draw frequency bars
        const barWidth = width / audioLevels.length;
        const maxBarHeight = height * 0.8;
        
        audioLevels.forEach((level, index) => {
          const barHeight = (level / 100) * maxBarHeight;
          const x = index * barWidth;
          const y = height - barHeight;
          
          // Create gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#ef4444'); // Red bottom
          gradient.addColorStop(0.5, '#f97316'); // Orange middle
          gradient.addColorStop(1, '#eab308'); // Yellow top
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
          
          // Add glow effect for high levels
          if (level > 70) {
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, barWidth - 2, barHeight);
            ctx.shadowBlur = 0;
          }
        });
        
        // Draw center wave
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const centerY = height / 2;
        const amplitude = Math.max(...audioLevels) / 100;
        
        for (let x = 0; x < width; x++) {
          const angle = (x / width) * Math.PI * 4 + Date.now() * 0.01;
          const y = centerY + Math.sin(angle) * amplitude * 20;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
        
        // Beat detection
        const averageLevel = audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length;
        if (averageLevel > 60 && !beatDetected) {
          setBeatDetected(true);
          setTimeout(() => setBeatDetected(false), 200);
        }
        
      } else {
        // Draw idle state
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        const centerY = height / 2;
        const barCount = 12;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const height = Math.sin(Date.now() * 0.005 + i * 0.5) * 10 + 15;
          ctx.fillRect(i * barWidth, centerY - height / 2, barWidth - 2, height);
        }
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevels, isRecording, beatDetected]);

  return (
    <Card className={`p-4 bg-gradient-to-r from-gray-900 to-gray-800 ${className} ${beatDetected ? 'ring-2 ring-orange-500' : ''}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-24 rounded"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-2 text-center">
        <div className={`text-sm transition-colors ${isRecording ? 'text-red-400' : 'text-gray-400'}`}>
          {isRecording ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Recording - Speak your bars!
            </div>
          ) : (
            'Ready to record'
          )}
        </div>
      </div>
    </Card>
  );
}