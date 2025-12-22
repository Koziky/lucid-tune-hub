import { useEffect, useRef, useState } from 'react';
import { useMusicPlayerContext } from '@/contexts/MusicPlayerContext';

interface AudioVisualizerProps {
  className?: string;
  barCount?: number;
  style?: 'bars' | 'wave' | 'synthwave';
}

export function AudioVisualizer({ className = '', barCount = 32, style = 'synthwave' }: AudioVisualizerProps) {
  const { isPlaying, currentSong } = useMusicPlayerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0));

  // Simulate audio visualization since we can't access YouTube audio stream
  useEffect(() => {
    if (!isPlaying) {
      // Animate bars down when paused
      setBars(prev => prev.map(b => Math.max(0, b - 5)));
      return;
    }

    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 50) { // ~20fps for smooth animation
        lastTime = time;
        setBars(prev =>
          prev.map((_, i) => {
            // Create varying heights with some randomness for visual effect
            const baseHeight = Math.sin(time / 200 + i * 0.5) * 30 + 40;
            const variation = Math.random() * 20;
            return Math.min(100, Math.max(10, baseHeight + variation));
          })
        );
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, barCount]);

  // Canvas-based synthwave visualization
  useEffect(() => {
    if (style !== 'synthwave' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animFrame: number;
    let time = 0;

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        time += 0.02;

        // Draw synthwave sun
        const sunY = height * 0.3;
        const sunRadius = 40;
        const gradient = ctx.createLinearGradient(width / 2, sunY - sunRadius, width / 2, sunY + sunRadius);
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--accent))');
        
        ctx.beginPath();
        ctx.arc(width / 2, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw horizontal lines (grid)
        ctx.strokeStyle = 'hsl(var(--primary) / 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const y = height * 0.5 + i * 15 + Math.sin(time + i) * 3;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw vertical perspective lines
        const centerX = width / 2;
        for (let i = -8; i <= 8; i++) {
          const x = centerX + i * 30;
          ctx.beginPath();
          ctx.moveTo(centerX, height * 0.5);
          ctx.lineTo(x, height);
          ctx.strokeStyle = 'hsl(var(--primary) / 0.2)';
          ctx.stroke();
        }

        // Draw waveform
        ctx.beginPath();
        ctx.moveTo(0, height * 0.6);
        for (let x = 0; x < width; x += 5) {
          const normalizedX = x / width;
          const waveHeight = Math.sin(normalizedX * 10 + time * 3) * 20 +
                            Math.sin(normalizedX * 20 + time * 5) * 10 +
                            Math.sin(normalizedX * 5 + time * 2) * 15;
          ctx.lineTo(x, height * 0.55 + waveHeight);
        }
        
        const waveGradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.7);
        waveGradient.addColorStop(0, 'hsl(var(--primary) / 0.8)');
        waveGradient.addColorStop(1, 'hsl(var(--accent) / 0.4)');
        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw bars at bottom
        const barWidth = width / barCount;
        bars.forEach((barHeight, i) => {
          const x = i * barWidth;
          const h = (barHeight / 100) * height * 0.3;
          
          const barGradient = ctx.createLinearGradient(x, height, x, height - h);
          barGradient.addColorStop(0, 'hsl(var(--primary))');
          barGradient.addColorStop(1, 'hsl(var(--accent) / 0.5)');
          
          ctx.fillStyle = barGradient;
          ctx.fillRect(x + 1, height - h, barWidth - 2, h);
          
          // Glow effect
          ctx.shadowColor = 'hsl(var(--primary))';
          ctx.shadowBlur = 10;
          ctx.fillRect(x + 1, height - h, barWidth - 2, 2);
          ctx.shadowBlur = 0;
        });
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying, bars, style, barCount]);

  if (!currentSong) return null;

  if (style === 'synthwave') {
    return (
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${className}`}
        style={{ background: 'transparent' }}
      />
    );
  }

  // Simple bars fallback
  return (
    <div className={`flex items-end justify-center gap-1 h-full ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-100"
          style={{
            width: `${100 / barCount - 1}%`,
            height: `${height}%`,
            opacity: isPlaying ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
