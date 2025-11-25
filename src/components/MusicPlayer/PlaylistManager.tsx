import { useState } from 'react';
import { Playlist } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListMusic, Plus } from 'lucide-react';

interface PlaylistManagerProps {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  onCreatePlaylist: (name: string) => void;
  onLoadPlaylist: (id: string) => void;
}

export const PlaylistManager = ({
  playlists,
  currentPlaylistId,
  onCreatePlaylist,
  onLoadPlaylist,
}: PlaylistManagerProps) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="glass glass-highlight rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ListMusic className="h-5 w-5 text-primary" />
          Playlists
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreating(!isCreating)}
          className="text-primary hover:text-primary/80"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {isCreating && (
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="bg-background/50"
            autoFocus
          />
          <Button onClick={handleCreate} size="sm">
            Create
          </Button>
        </div>
      )}

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {playlists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No playlists yet
            </p>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onLoadPlaylist(playlist.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  currentPlaylistId === playlist.id
                    ? 'bg-primary/20 border border-primary/30'
                    : 'hover:bg-muted/30'
                }`}
              >
                <p className="font-medium">{playlist.name}</p>
                <p className="text-sm text-muted-foreground">
                  {playlist.songs.length} songs
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
