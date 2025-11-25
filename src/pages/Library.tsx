import { Song } from '@/types/music';
import { Music2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LibraryProps {
  songs: Song[];
  onAddToQueue: (song: Song) => void;
}

const Library = ({ songs, onAddToQueue }: LibraryProps) => {
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Music2 className="h-20 w-20 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Your Music Library is Empty</h2>
        <p className="text-muted-foreground">
          Add YouTube videos to start building your collection
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Your Music</h1>
        <p className="text-muted-foreground">{songs.length} songs</p>
      </div>

      <div className="glass glass-highlight rounded-xl p-6">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2">
            {songs.map((song) => (
              <div
                key={song.id}
                className="group flex items-center gap-4 p-4 rounded-lg hover:bg-muted/30 transition-all"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => onAddToQueue(song)}
                    >
                      <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => onAddToQueue(song)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Add to Queue
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Library;
