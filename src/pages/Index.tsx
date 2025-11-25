import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { NowPlaying } from '@/components/MusicPlayer/NowPlaying';
import { PlayerControls } from '@/components/MusicPlayer/PlayerControls';
import { Queue } from '@/components/MusicPlayer/Queue';
import { AddSong } from '@/components/MusicPlayer/AddSong';
import { VolumeControl } from '@/components/MusicPlayer/VolumeControl';
import { PlaylistManager } from '@/components/MusicPlayer/PlaylistManager';

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
    currentPlaylist,
    playerRef,
    setIsPlaying,
    setVolume,
    setCurrentIndex,
    addFromYouTubeUrl,
    removeFromQueue,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    createPlaylist,
    loadPlaylist,
  } = useMusicPlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previousVolume, setPreviousVolume] = useState(50);

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
      // Video ended
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

  return (
    <div className="min-h-screen p-4 md:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-glow">
            GlassBeats
          </h1>
          <p className="text-muted-foreground">Your YouTube Music Player</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Now Playing & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <NowPlaying song={currentSong} />
            
            <div className="glass glass-highlight rounded-2xl p-6 space-y-6">
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
              
              <div className="flex justify-center">
                <VolumeControl
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  onMuteToggle={handleMuteToggle}
                />
              </div>
            </div>

            <AddSong onAddFromUrl={addFromYouTubeUrl} />
          </div>

          {/* Right Column - Queue & Playlists */}
          <div className="space-y-6">
            <Queue
              queue={queue}
              currentIndex={currentIndex}
              onSongClick={setCurrentIndex}
              onRemove={removeFromQueue}
            />
            
            <PlaylistManager
              playlists={playlists}
              currentPlaylistId={currentPlaylist}
              onCreatePlaylist={createPlaylist}
              onLoadPlaylist={loadPlaylist}
            />
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
      </div>
    </div>
  );
};

export default Index;
