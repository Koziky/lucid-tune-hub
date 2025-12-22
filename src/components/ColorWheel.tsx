import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';

interface ColorWheelProps {
  hue: number;
  onHueChange: (hue: number) => void;
  onReset: () => void;
}

export function ColorWheel({ hue, onHueChange, onReset }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = `hsl(${angle}, 100%, 60%)`;
      ctx.fill();
    }

    // Draw center circle (dark background)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(0 0% 8%)';
    ctx.fill();

    // Draw selected color in center
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.fill();

    // Draw indicator dot on the wheel
    const indicatorAngle = (hue - 90) * Math.PI / 180;
    const indicatorRadius = radius * 0.8;
    const indicatorX = centerX + Math.cos(indicatorAngle) * indicatorRadius;
    const indicatorY = centerY + Math.sin(indicatorAngle) * indicatorRadius;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [hue, size, centerX, centerY, radius]);

  const getHueFromPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return hue;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;

    return Math.round(angle) % 360;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onHueChange(getHueFromPosition(e.clientX, e.clientY));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onHueChange(getHueFromPosition(e.clientX, e.clientY));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    onHueChange(getHueFromPosition(touch.clientX, touch.clientY));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      onHueChange(getHueFromPosition(touch.clientX, touch.clientY));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Label className="text-sm text-muted-foreground">Pick a color</Label>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="border-border hover:border-destructive hover:text-destructive"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Default
      </Button>
    </div>
  );
}
