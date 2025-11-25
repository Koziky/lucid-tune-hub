import { Song } from '@/types/music';
import { Music } from 'lucide-react';

interface NowPlayingProps {
  song: Song | undefined;
}

export const NowPlaying = ({ song }: NowPlayingProps) => {
  if (!song) {
    return (
      <div className="glass glass-highlight rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-4">
          <Music className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-muted-foreground">No song playing</h3>
        <p className="text-sm text-muted-foreground mt-2">Add a YouTube link to start</p>
      </div>
    );
  }

  return (
    <div className="glass glass-highlight rounded-2xl p-6 space-y-4">
      <div className="relative group">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full aspect-video object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {song.title}
        </h2>
        <p className="text-muted-foreground">{song.artist}</p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        <div className="glass px-3 py-1 rounded-full text-xs">
          <span className="text-muted-foreground">YouTube</span>
        </div>
      </div>
    </div>
  );
};
