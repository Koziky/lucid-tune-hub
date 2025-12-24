import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Search, Play, Plus, Loader2, Music2, ListPlus, ListMusic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Playlist, Song } from '@/types/music';

interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface YouTubeSearchProps {
  onAddSong: (url: string) => void;
  onAddToPlaylist?: (playlistId: string, song: Song) => void;
  playlists?: Playlist[];
  isOpen: boolean;
  onClose: () => void;
}

export const YouTubeSearch = ({ onAddSong, onAddToPlaylist, playlists = [], isOpen, onClose }: YouTubeSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: query.trim() }
      });

      if (error) throw error;

      if (data?.results) {
        setResults(data.results);
        if (data.results.length === 0) {
          toast.info('No results found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = async (result: YouTubeResult) => {
    setAddingId(result.videoId);
    try {
      const url = `https://www.youtube.com/watch?v=${result.videoId}`;
      onAddSong(url);
      toast.success(`Added "${result.title}" to queue`);
    } catch (error) {
      toast.error('Failed to add song');
    } finally {
      setAddingId(null);
    }
  };

  const handleAddToPlaylist = (result: YouTubeResult, playlistId: string, playlistName: string) => {
    const song: Song = {
      id: crypto.randomUUID(),
      title: result.title,
      artist: result.channelTitle,
      youtubeId: result.videoId,
      thumbnail: result.thumbnail,
    };
    
    if (onAddToPlaylist) {
      onAddToPlaylist(playlistId, song);
      toast.success(`Added "${result.title}" to ${playlistName}`);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass border-border max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            Search YouTube Music
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for songs, artists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-24 h-12 bg-background/50 border-border/50 text-lg focus:border-primary transition-all"
            autoFocus
          />
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </form>

        <ScrollArea className="h-[400px] mt-4 -mx-2 px-2">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="h-12 w-12 text-primary animate-spin relative" />
              </div>
              <p className="text-muted-foreground mt-4">Searching YouTube...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted/30 mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">Search for music</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
                Find songs, artists, or albums on YouTube and add them to your library
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.videoId}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all border border-transparent hover:border-primary/20"
                >
                  <div className="relative flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-16 h-12 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Play className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 max-w-[200px]">
                    <h4 className="font-medium truncate text-sm text-foreground group-hover:text-primary transition-colors">
                      {result.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.channelTitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAddSong(result)}
                      disabled={addingId === result.videoId}
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 transition-all h-8 px-3"
                    >
                      {addingId === result.videoId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ListPlus className="h-4 w-4 mr-1" />
                          Queue
                        </>
                      )}
                    </Button>

                    {playlists.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border/50 hover:border-primary/50 h-8 px-3"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                          <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {playlists.map((playlist) => (
                            <DropdownMenuItem
                              key={playlist.id}
                              onClick={() => handleAddToPlaylist(result, playlist.id, playlist.name)}
                              className="cursor-pointer"
                            >
                              <ListMusic className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{playlist.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
