import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ListMusic, Loader2, Download, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  selected: boolean;
}

interface YouTubePlaylistImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSongs: (videos: { url: string; title: string }[]) => Promise<void>;
  onCreatePlaylistWithSongs?: (name: string, videos: { url: string; title: string }[]) => Promise<void>;
  existingPlaylists?: { name: string }[];
}

export function YouTubePlaylistImport({ 
  isOpen, 
  onClose, 
  onImportSongs,
  onCreatePlaylistWithSongs,
  existingPlaylists = []
}: YouTubePlaylistImportProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');

  const getNextYTPName = () => {
    const ytpPattern = /^YTP(\d+)$/;
    const existingNumbers = existingPlaylists
      .map(p => {
        const match = p.name.match(ytpPattern);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);
    
    // Find the smallest missing number starting from 1
    let nextNum = 1;
    const sortedNumbers = [...existingNumbers].sort((a, b) => a - b);
    for (const num of sortedNumbers) {
      if (num === nextNum) {
        nextNum++;
      } else if (num > nextNum) {
        break;
      }
    }
    return `YTP${nextNum}`;
  };

  const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const handleFetchPlaylist = async () => {
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      toast.error('Invalid YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setVideos([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-playlist', {
        body: { playlistId }
      });

      if (error) throw error;

      if (data?.videos) {
        setVideos(data.videos.map((v: any) => ({ ...v, selected: true })));
        setPlaylistTitle(data.playlistTitle || 'YouTube Playlist');
        toast.success(`Found ${data.videos.length} videos`);
      }
    } catch (error) {
      console.error('Playlist fetch error:', error);
      toast.error('Failed to fetch playlist. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideo = (videoId: string) => {
    setVideos(prev =>
      prev.map(v => (v.videoId === videoId ? { ...v, selected: !v.selected } : v))
    );
  };

  const selectAll = () => {
    setVideos(prev => prev.map(v => ({ ...v, selected: true })));
  };

  const deselectAll = () => {
    setVideos(prev => prev.map(v => ({ ...v, selected: false })));
  };

  const handleImport = async () => {
    const selectedVideos = videos.filter(v => v.selected);
    if (selectedVideos.length === 0) {
      toast.error('Please select at least one video');
      return;
    }

    setIsImporting(true);
    try {
      const videosToImport = selectedVideos.map(v => ({
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        title: v.title,
      }));

      // Create a new playlist with YTP naming
      if (onCreatePlaylistWithSongs) {
        const playlistName = getNextYTPName();
        await onCreatePlaylistWithSongs(playlistName, videosToImport);
        toast.success(`Created playlist "${playlistName}" with ${selectedVideos.length} songs`);
      } else {
        await onImportSongs(videosToImport);
        toast.success(`Imported ${selectedVideos.length} songs`);
      }
      handleClose();
    } catch (error) {
      toast.error('Failed to import some songs');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setPlaylistUrl('');
    setVideos([]);
    setPlaylistTitle('');
    onClose();
  };

  const selectedCount = videos.filter(v => v.selected).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass border-border max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
              <ListMusic className="h-5 w-5 text-white" />
            </div>
            Import YouTube Playlist
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube playlist URL to import all videos at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="flex-1 bg-background/50 border-border/50"
              onKeyDown={(e) => e.key === 'Enter' && handleFetchPlaylist()}
            />
            <Button
              onClick={handleFetchPlaylist}
              disabled={isLoading || !playlistUrl.trim()}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
            </Button>
          </div>

          {videos.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{playlistTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} of {videos.length} selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    <XCircle className="h-4 w-4 mr-1" />
                    None
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {videos.map((video) => (
                    <label
                      key={video.videoId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        video.selected
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/20 border border-transparent hover:bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={video.selected}
                        onCheckedChange={() => toggleVideo(video.videoId)}
                      />
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{video.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {video.channelTitle}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>

              <Button
                onClick={handleImport}
                disabled={isImporting || selectedCount === 0}
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import {selectedCount} Songs
                  </>
                )}
              </Button>
            </>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground mt-4">Fetching playlist...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
