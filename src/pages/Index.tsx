import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { NowPlaying } from '@/components/MusicPlayer/NowPlaying';
import { PlayerControls } from '@/components/MusicPlayer/PlayerControls';
import { Queue } from '@/components/MusicPlayer/Queue';
import { AddSong } from '@/components/MusicPlayer/AddSong';
import { VolumeControl } from '@/components/MusicPlayer/VolumeControl';
import { PlaylistManager } from '@/components/MusicPlayer/PlaylistManager';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, Play, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Index = () => {
  const {
    queue,
    currentSong,
    currentIndex,
    isPlaying,
    volume,
    isShuffle,
    repeatMode,
    playlists,
    allSongs,
    currentPlaylist,
    playerRef,
    setIsPlaying,
    setVolume,
    setCurrentIndex,
    addToQueue,
    addFromYouTubeUrl,
    removeFromQueue,
    reorderQueue,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    createPlaylist,
    addToPlaylist,
    loadPlaylist,
  } = useMusicPlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReady = (event: any) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const handleStateChange = (event: any) => {
    if (event.data === 0) {
      playNext();
    }
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value[0]);
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (playerRef.current) {
      playerRef.current.setVolume(value[0]);
    }
  };

  const handleMuteToggle = () => {
    if (volume === 0) {
      setVolume(previousVolume);
      if (playerRef.current) {
        playerRef.current.setVolume(previousVolume);
      }
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      if (playerRef.current) {
        playerRef.current.setVolume(0);
      }
    }
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreatePlaylistOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          playlists={playlists} 
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-xl font-semibold">Home</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[1800px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Left: Add Song */}
                <div className="lg:col-span-2">
                  <AddSong onAddFromUrl={addFromYouTubeUrl} />
                </div>

                {/* Right: Playlists */}
                <div>
                  <PlaylistManager
                    playlists={playlists}
                    currentPlaylistId={currentPlaylist}
                    onCreatePlaylist={createPlaylist}
                    onLoadPlaylist={loadPlaylist}
                  />
                </div>
              </div>

              {/* Your Music */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Your Music</h2>
                {allSongs.length === 0 ? (
                  <div className="glass glass-highlight rounded-xl p-12 text-center">
                    <Music2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No music yet</h3>
                    <p className="text-muted-foreground">
                      Add YouTube videos to start building your collection
                    </p>
                  </div>
                ) : (
                  <div className="glass glass-highlight rounded-xl p-6">
                    <ScrollArea className="h-[400px]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {allSongs.map((song) => (
                          <div
                            key={song.id}
                            className="group relative rounded-lg overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
                          >
                            <div className="aspect-square relative">
                              <img
                                src={song.thumbnail}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="icon"
                                  className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                  onClick={() => addToQueue(song)}
                                >
                                  <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                                </Button>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-semibold text-sm truncate">{song.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Queue */}
              <div className="mb-6">
                <Queue
                  queue={queue}
                  currentIndex={currentIndex}
                  playlists={playlists}
                  onSongClick={setCurrentIndex}
                  onRemove={removeFromQueue}
                  onReorder={reorderQueue}
                  onAddToPlaylist={addToPlaylist}
                />
              </div>
            </div>
          </div>

          {/* Bottom Player Bar */}
          <div className="border-t border-border bg-card/95 backdrop-blur-md p-4 sticky bottom-0">
            <div className="max-w-[1800px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Left: Now Playing */}
                <div className="md:col-span-1">
                  <NowPlaying song={currentSong} />
                </div>

                {/* Center: Player Controls */}
                <div className="md:col-span-1">
                  <PlayerControls
                    isPlaying={isPlaying}
                    isShuffle={isShuffle}
                    repeatMode={repeatMode}
                    onPlayPause={handlePlayPause}
                    onPrevious={playPrevious}
                    onNext={playNext}
                    onToggleShuffle={toggleShuffle}
                    onToggleRepeat={toggleRepeat}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                  />
                </div>

                {/* Right: Volume */}
                <div className="md:col-span-1 flex justify-end">
                  <VolumeControl
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    onMuteToggle={handleMuteToggle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hidden YouTube Player */}
          {currentSong && (
            <div className="hidden">
              <YouTube
                videoId={currentSong.youtubeId}
                opts={{
                  playerVars: {
                    autoplay: isPlaying ? 1 : 0,
                    controls: 0,
                  },
                }}
                onReady={handleReady}
                onStateChange={handleStateChange}
              />
            </div>
          )}
        </main>
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your playlist a name
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="My Playlist"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            className="bg-background/50"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreatePlaylistOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              className="bg-primary text-primary-foreground"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Index;
