import { Song } from '@/types/music';
import { Button } from '@/components/ui/button';
import { X, Music2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QueueProps {
  queue: Song[];
  currentIndex: number;
  onSongClick: (index: number) => void;
  onRemove: (index: number) => void;
}

export const Queue = ({ queue, currentIndex, onSongClick, onRemove }: QueueProps) => {
  if (queue.length === 0) {
    return (
      <div className="glass glass-highlight rounded-2xl p-8 text-center">
        <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Queue is empty</p>
      </div>
    );
  }

  return (
    <div className="glass glass-highlight rounded-2xl p-4">
      <h3 className="text-lg font-semibold mb-4 px-2">Up Next</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {queue.map((song, index) => (
            <div
              key={song.id}
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                index === currentIndex
                  ? 'bg-primary/20 border border-primary/30'
                  : 'hover:bg-muted/30'
              }`}
              onClick={() => onSongClick(index)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-14 h-14 object-cover rounded-lg"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-primary/30 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
