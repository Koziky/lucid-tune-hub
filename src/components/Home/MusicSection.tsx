import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { Song } from '@/types/music';

interface MusicSectionProps {
  title: string;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  showArtist?: boolean;
  emptyMessage?: string;
}

export function MusicSection({ 
  title, 
  songs, 
  onPlaySong, 
  showArtist = true,
  emptyMessage = "No songs yet" 
}: MusicSectionProps) {
  if (songs.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {songs.map((song, index) => (
            <div 
              key={`${song.id}-${index}`}
              className="group flex-shrink-0 w-[180px] rounded-lg bg-card/50 hover:bg-card/80 transition-all duration-300 overflow-hidden"
            >
              <div className="relative aspect-square">
                <img 
                  src={song.thumbnail} 
                  alt={song.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="icon"
                    onClick={() => onPlaySong(song)}
                    className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                  >
                    <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{song.title}</h4>
                {showArtist && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{song.artist}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
