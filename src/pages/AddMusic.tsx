import { useState } from 'react';
import { useMusicPlayerContext } from '@/contexts/MusicPlayerContext';
import { useProfile } from '@/hooks/useProfile';
import { 
  AddSong, 
  NowPlaying, 
  PlayerControls, 
  Queue, 
  VolumeControl, 
  PlaylistManager,
  SleepTimerOptions,
  RefreshMetadataButton,
} from '@/components/MusicPlayer';
import { ProfileDialog } from '@/components/ProfileDialog';
import { YouTubeSearch } from '@/components/YouTubeSearch';
import { YouTubePlaylistImport } from '@/components/YouTubePlaylistImport';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Music2, Play, Trash2, PlayCircle, Search, Heart, Clock } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    allSongs,
    likedSongs,
    likedSongIds,
    recentlyPlayed,
    currentPlaylist,
    playerRef,
    sleepTimer,
    isImportingSpotify,
    isRefreshingMetadata,
    currentTime,
    duration,
    setIsPlaying,
    setVolume,
    setCurrentIndex,
    addToQueue,
    addFromYouTubeUrl,
    importFromSpotify,
    refreshAllMetadata,
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
    deleteSong,
    playAllSongs,
    playLikedSongs,
  } = useMusicPlayerContext();

  const { profile, updateProfile, uploadAvatar } = useProfile();

  const [previousVolume, setPreviousVolume] = useState(50);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmPlaylist, setDeleteConfirmPlaylist] = useState<string | null>(null);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isYourMusicOpen, setIsYourMusicOpen] = useState(false);
  const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);
  const [isPlaylistImportOpen, setIsPlaylistImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSongId, setDeleteSongId] = useState<string | null>(null);

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

  const handleDeleteSong = async () => {
    if (deleteSongId) {
      await deleteSong(deleteSongId);
      setDeleteSongId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
                {/* Left: Add Song + Search */}
                <div className="lg:col-span-2 space-y-4">
                  <AddSong 
                    onAddFromUrl={addFromYouTubeUrl} 
                    onImportSpotify={importFromSpotify}
                    isImporting={isImportingSpotify}
                  />
                  
                  {/* Search Music Button */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsYouTubeSearchOpen(true)}
                      variant="outline"
                      className="flex-1 h-14 glass glass-highlight border-primary/30 hover:border-primary hover:bg-primary/10 transition-all group"
                    >
                      <Search className="h-5 w-5 mr-3 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-lg font-medium">Search YouTube</span>
                    </Button>
                    <Button
                      onClick={() => setIsPlaylistImportOpen(true)}
                      variant="outline"
                      className="flex-1 h-14 glass glass-highlight border-primary/30 hover:border-primary hover:bg-primary/10 transition-all group"
                    >
                      <Music2 className="h-5 w-5 mr-3 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-lg font-medium">Import Playlist</span>
                    </Button>
                  </div>
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

      {/* Your Music Dialog */}
      <Dialog open={isYourMusicOpen} onOpenChange={setIsYourMusicOpen}>
        <DialogContent className="glass border-border max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl">Your Music</DialogTitle>
                  <DialogDescription>{allSongs.length} songs in your library</DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshMetadataButton onRefresh={refreshAllMetadata} isRefreshing={isRefreshingMetadata} />
                  {allSongs.length > 0 && (
                    <Button
                      onClick={() => {
                        playAllSongs();
                        setIsYourMusicOpen(false);
                      }}
                      className="bg-primary text-primary-foreground"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Play All
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Songs ({allSongs.length})</TabsTrigger>
              <TabsTrigger value="liked">
                <Heart className="h-4 w-4 mr-1" />
                Liked ({likedSongs.length})
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="h-4 w-4 mr-1" />
                Recent ({recentlyPlayed.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>

            <TabsContent value="all">
              {allSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Music2 className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No music yet</h3>
                  <p className="text-muted-foreground">Add YouTube or Spotify links to start</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allSongs
                      .filter(song => 
                        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((song) => (
                        <div key={song.id} className="group relative rounded-lg overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all">
                          <div className="aspect-square relative">
                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <Button
                                size="icon"
                                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => addToQueue(song)}
                              >
                                <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                              </Button>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => toggleLike(song)}
                                >
                                  <Heart className={`h-4 w-4 ${likedSongIds.has(song.id) ? 'fill-primary text-primary' : ''}`} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => setDeleteSongId(song.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
              )}
            </TabsContent>

            <TabsContent value="liked">
              {likedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No liked songs</h3>
                  <p className="text-muted-foreground">Click the heart icon to like songs</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {likedSongs
                      .filter(song => 
                        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((song) => (
                        <div key={song.id} className="group relative rounded-lg overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all">
                          <div className="aspect-square relative">
                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
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
              )}
            </TabsContent>

            <TabsContent value="recent">
              {recentlyPlayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No recent plays</h3>
                  <p className="text-muted-foreground">Start listening to build your history</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {recentlyPlayed.map((song: any, index) => (
                      <div 
                        key={`${song.id}-${index}`} 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer"
                        onClick={() => addToQueue(song)}
                      >
                        <img src={song.thumbnail} alt={song.title} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{song.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(song.playedAt)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Song Confirmation */}
      <AlertDialog open={deleteSongId !== null} onOpenChange={(open) => !open && setDeleteSongId(null)}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Song?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the song from your library and all playlists.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSong} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Dialog */}
      <ProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        profile={profile}
        onUpdateProfile={updateProfile}
        onUploadAvatar={uploadAvatar}
      />

      {/* YouTube Search */}
      <YouTubeSearch
        isOpen={isYouTubeSearchOpen}
        onClose={() => setIsYouTubeSearchOpen(false)}
        onAddSong={addFromYouTubeUrl}
        onAddToPlaylist={addToPlaylist}
        playlists={playlists}
      />

      {/* YouTube Playlist Import */}
      <YouTubePlaylistImport
        isOpen={isPlaylistImportOpen}
        onClose={() => setIsPlaylistImportOpen(false)}
        onImportSongs={async (videos) => {
          for (const video of videos) {
            await addFromYouTubeUrl(video.url);
          }
        }}
      />
    </SidebarProvider>
  );
};

export default AddMusic;
