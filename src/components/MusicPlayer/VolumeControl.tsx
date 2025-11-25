import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (value: number[]) => void;
  onMuteToggle: () => void;
}

export const VolumeControl = ({ volume, onVolumeChange, onMuteToggle }: VolumeControlProps) => {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="text-foreground hover:text-primary transition-colors"
      >
        {volume === 0 ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
      <Slider
        value={[volume]}
        max={100}
        step={1}
        onValueChange={onVolumeChange}
        className="w-24 cursor-pointer"
      />
    </div>
  );
};
