import { useEffect, useRef, useState } from 'react';
import { useMusicPlayerContext } from '@/contexts/MusicPlayerContext';

interface AudioVisualizerProps {
  className?: string;
  barCount?: number;
  style?: 'bars' | 'wave' | 'synthwave';
}

export function AudioVisualizer({ className = '', barCount = 32, style = 'synthwave' }: AudioVisualizerProps) {
  const { isPlaying, currentSong, currentTime } = useMusicPlayerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0));
  const bassRef = useRef(0);
  const beatRef = useRef(0);

  // Simulate audio visualization with bass-responsive behavior
  useEffect(() => {
    if (!isPlaying) {
      // Animate bars down when paused
      const decayInterval = setInterval(() => {
        setBars(prev => prev.map(b => Math.max(0, b - 8)));
        bassRef.current = Math.max(0, bassRef.current - 5);
      }, 50);
      return () => clearInterval(decayInterval);
    }

    let lastTime = 0;
    let phase = 0;
    
    const animate = (time: number) => {
      if (time - lastTime > 33) { // ~30fps
        lastTime = time;
        phase += 0.15;
        
        // Simulate bass hit detection (random intervals for dynamic feel)
        const bassHitChance = Math.random();
        if (bassHitChance > 0.85) {
          bassRef.current = 80 + Math.random() * 20;
          beatRef.current = time;
        } else {
          bassRef.current = Math.max(0, bassRef.current - 3);
        }
        
        setBars(prev =>
          prev.map((_, i) => {
            const isBassBar = i < barCount * 0.3; // First 30% are bass bars
            const isMidBar = i >= barCount * 0.3 && i < barCount * 0.7;
            
            let baseHeight;
            if (isBassBar) {
              // Bass bars - respond more to bass hits
              baseHeight = bassRef.current * 0.8 + Math.sin(phase + i * 0.3) * 15;
            } else if (isMidBar) {
              // Mid-range bars
              baseHeight = Math.sin(phase * 2 + i * 0.5) * 35 + 45 + bassRef.current * 0.3;
            } else {
              // High frequency bars - faster, more erratic
              baseHeight = Math.sin(phase * 3 + i * 0.8) * 25 + 35 + Math.random() * 20;
            }
            
            const variation = Math.random() * 15;
            return Math.min(100, Math.max(5, baseHeight + variation));
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

    // Get computed CSS colors and parse them for canvas compatibility
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryHsl = computedStyle.getPropertyValue('--primary').trim();
    const accentHsl = computedStyle.getPropertyValue('--accent').trim();
    
    // Parse HSL values (format: "280 80% 65%") and convert to proper canvas format
    const parseHsl = (hsl: string) => {
      const parts = hsl.split(' ').map(p => p.trim());
      return { h: parts[0], s: parts[1], l: parts[2] };
    };
    
    const primary = parseHsl(primaryHsl);
    const accent = parseHsl(accentHsl);
    
    const primaryColor = `hsl(${primary.h}, ${primary.s}, ${primary.l})`;
    const accentColor = `hsl(${accent.h}, ${accent.s}, ${accent.l})`;
    
    // Helper to create hsla colors with proper comma syntax
    const hsla = (parsed: { h: string; s: string; l: string }, alpha: number) => 
      `hsla(${parsed.h}, ${parsed.s}, ${parsed.l}, ${alpha})`;

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

      // Clear with fade effect - faster fade when bass hits
      const fadeAmount = isPlaying ? (0.15 + bassRef.current * 0.002) : 0.3;
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount})`;
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        // Speed up animation based on bass
        time += 0.02 + bassRef.current * 0.0005;

        // Draw synthwave sun - pulses with bass
        const sunY = height * 0.3;
        const baseSunRadius = 35;
        const sunPulse = bassRef.current * 0.15;
        const sunRadius = baseSunRadius + sunPulse;
        
        const gradient = ctx.createLinearGradient(width / 2, sunY - sunRadius, width / 2, sunY + sunRadius);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, accentColor);
        
        // Sun glow effect on bass hit
        if (bassRef.current > 50) {
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 20 + bassRef.current * 0.3;
        }
        
        ctx.beginPath();
        ctx.arc(width / 2, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw horizontal lines (grid) - move faster on bass
        const gridSpeed = 1 + bassRef.current * 0.05;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const y = height * 0.5 + i * 15 + Math.sin(time * gridSpeed + i) * (3 + bassRef.current * 0.05);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.strokeStyle = hsla(primary, 0.3);
          ctx.stroke();
        }

        // Draw vertical perspective lines
        const centerX = width / 2;
        for (let i = -8; i <= 8; i++) {
          const x = centerX + i * 30;
          ctx.beginPath();
          ctx.moveTo(centerX, height * 0.5);
          ctx.lineTo(x, height);
          ctx.strokeStyle = hsla(primary, 0.2);
          ctx.stroke();
        }

        // Draw waveform - more intense on bass
        const waveIntensity = 1 + bassRef.current * 0.02;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.6);
        for (let x = 0; x < width; x += 4) {
          const normalizedX = x / width;
          const waveHeight = (Math.sin(normalizedX * 10 + time * 3) * 20 +
                            Math.sin(normalizedX * 20 + time * 5) * 10 +
                            Math.sin(normalizedX * 5 + time * 2) * 15) * waveIntensity;
          ctx.lineTo(x, height * 0.55 + waveHeight);
        }
        
        const waveGradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.7);
        waveGradient.addColorStop(0, hsla(primary, 0.8));
        waveGradient.addColorStop(1, hsla(accent, 0.4));
        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = 2 + bassRef.current * 0.03;
        ctx.stroke();

        // Draw bars at bottom - bass bars are taller
        const barWidth = width / barCount;
        bars.forEach((barHeight, i) => {
          const x = i * barWidth;
          const isBassBar = i < barCount * 0.3;
          const heightMultiplier = isBassBar ? 0.4 : 0.3;
          const h = (barHeight / 100) * height * heightMultiplier;
          
          const barGradient = ctx.createLinearGradient(x, height, x, height - h);
          barGradient.addColorStop(0, primaryColor);
          barGradient.addColorStop(1, hsla(accent, 0.5));
          
          ctx.fillStyle = barGradient;
          ctx.fillRect(x + 1, height - h, barWidth - 2, h);
          
          // Enhanced glow effect on bass bars
          if (isBassBar && bassRef.current > 40) {
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = 15 + bassRef.current * 0.2;
            ctx.fillRect(x + 1, height - h, barWidth - 2, 3);
            ctx.shadowBlur = 0;
          }
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
          className="bg-gradient-to-t from-primary to-accent rounded-t transition-all duration-75"
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