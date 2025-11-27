import { Song } from '@/types/music';
import { Music, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NowPlayingProps {
  song: Song | undefined;
}

export const NowPlaying = ({ song }: NowPlayingProps) => {
  if (!song) {
    return (
      <div className="glass glass-highlight rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-4">
          <Music className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-muted-foreground">No song playing</h3>
        <p className="text-sm text-muted-foreground mt-2">Add a YouTube link to start</p>
      </div>
    );
  }

  const handleOpenYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank');
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative group flex-shrink-0">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-20 h-20 object-cover rounded-lg shadow-lg"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold truncate">{song.title}</h2>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpenYouTube}
        className="flex-shrink-0"
        title="Open on YouTube"
      >
        <ExternalLink className="h-5 w-5" />
      </Button>
    </div>
  );
};
