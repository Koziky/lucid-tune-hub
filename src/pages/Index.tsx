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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          playlists={playlists} 
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <h2 className="text-xl font-semibold">Home</h2>
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
