import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useProfile } from '@/hooks/useProfile';
import { 
  AddSong, 
  NowPlaying, 
  PlayerControls, 
  Queue, 
  VolumeControl, 
  PlaylistManager,
  SleepTimerOptions,
} from '@/components/MusicPlayer';
import { ProfileDialog } from '@/components/ProfileDialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AddMusic = () => {
  const {
    queue,
    currentSong,
    currentIndex,
    isPlaying,
    volume,
    isShuffle,
    repeatMode,
    playlists,
    likedSongs,
    likedSongIds,
    recentlyPlayed,
    currentPlaylist,
    playerRef,
    sleepTimer,
    isImportingSpotify,
    setIsPlaying,
    setVolume,
    setCurrentIndex,
    addToQueue,
    addFromYouTubeUrl,
    importFromSpotify,
    removeFromQueue,
    reorderQueue,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    setSleepTimerMinutes,
    cancelSleepTimer,
    shareSong,
    createPlaylist,
    addToPlaylist,
    loadPlaylist,
    deletePlaylist,
    updatePlaylist,
    playLikedSongs,
  } = useMusicPlayer();

  const { profile, updateProfile, uploadAvatar } = useProfile();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmPlaylist, setDeleteConfirmPlaylist] = useState<string | null>(null);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isYourMusicOpen, setIsYourMusicOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
      navigator.mediaSession.setActionHandler('play', () => {
        if (playerRef.current) {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (playerRef.current) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [currentSong, setIsPlaying, playPrevious, playNext]);

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
    } else if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
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

  const handleEditPlaylist = (playlistId: string, currentName: string) => {
    setEditingPlaylist({ id: playlistId, name: currentName });
    setNewPlaylistName(currentName);
  };

  const handleUpdatePlaylist = async () => {
    if (editingPlaylist && newPlaylistName.trim()) {
      await updatePlaylist(editingPlaylist.id, newPlaylistName.trim());
      setEditingPlaylist(null);
      setNewPlaylistName('');
    }
  };

  const handleDeletePlaylist = async () => {
    if (deleteConfirmPlaylist) {
      await deletePlaylist(deleteConfirmPlaylist);
      setDeleteConfirmPlaylist(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          playlists={playlists}
          likedSongsCount={likedSongs.length}
          recentlyPlayedCount={recentlyPlayed.length}
          profile={profile}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onOpenYourMusic={() => setIsYourMusicOpen(true)}
          onEditPlaylist={handleEditPlaylist}
          onDeletePlaylist={(id) => setDeleteConfirmPlaylist(id)}
          onPlayLikedSongs={playLikedSongs}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-xl font-semibold">Add Music</h2>
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
                  <AddSong 
                    onAddFromUrl={addFromYouTubeUrl} 
                    onImportSpotify={importFromSpotify}
                    isImporting={isImportingSpotify}
                  />
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
                  likedSongIds={likedSongIds}
                  onSongClick={setCurrentIndex}
                  onRemove={removeFromQueue}
                  onReorder={reorderQueue}
                  onAddToPlaylist={addToPlaylist}
                  onToggleLike={toggleLike}
                />
              </div>
            </div>
          </div>

          {/* Bottom Player Bar */}
          <div className="border-t border-border bg-card/95 backdrop-blur-md p-4 sticky bottom-0">
            <div className="max-w-[1800px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <NowPlaying 
                    song={currentSong} 
                    isLiked={currentSong ? likedSongIds.has(currentSong.id) : false}
                    onToggleLike={() => currentSong && toggleLike(currentSong)}
                    onShare={() => currentSong && shareSong(currentSong)}
                  />
                </div>

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
                    sleepTimer={sleepTimer}
                    onSleepTimer={() => setIsSleepTimerOpen(true)}
                  />
                </div>

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
                    playsinline: 1,
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
            <DialogDescription>Give your playlist a name</DialogDescription>
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
            <Button variant="ghost" onClick={() => setIsCreatePlaylistOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlaylist} className="bg-primary text-primary-foreground">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Playlist Dialog */}
      <Dialog open={editingPlaylist !== null} onOpenChange={(open) => !open && setEditingPlaylist(null)}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>Change the playlist name</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdatePlaylist()}
            className="bg-background/50"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPlaylist(null)}>Cancel</Button>
            <Button onClick={handleUpdatePlaylist} className="bg-primary text-primary-foreground">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Confirmation */}
      <AlertDialog open={deleteConfirmPlaylist !== null} onOpenChange={(open) => !open && setDeleteConfirmPlaylist(null)}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sleep Timer Dialog */}
      <Dialog open={isSleepTimerOpen} onOpenChange={setIsSleepTimerOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Sleep Timer</DialogTitle>
            <DialogDescription>Stop playback after a set time</DialogDescription>
          </DialogHeader>
          <SleepTimerOptions
            onSelectTime={(time) => {
              setSleepTimerMinutes(time);
              setIsSleepTimerOpen(false);
            }}
            onCancel={() => {
              cancelSleepTimer();
              setIsSleepTimerOpen(false);
            }}
            currentTimer={sleepTimer}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <ProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        profile={profile}
        onUpdateProfile={updateProfile}
        onUploadAvatar={uploadAvatar}
      />
    </SidebarProvider>
  );
};

export default AddMusic;
