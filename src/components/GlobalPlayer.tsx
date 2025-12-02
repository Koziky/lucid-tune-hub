import YouTube from 'react-youtube';
import { useMusicPlayerContext } from '@/contexts/MusicPlayerContext';

export function GlobalPlayer() {
  const {
    currentSong,
    isPlaying,
    playerRef,
    setIsPlaying,
    setDuration,
    playNext,
  } = useMusicPlayerContext();

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
    } else if (event.data === 1) {
      // Playing
      setIsPlaying(true);
    } else if (event.data === 2) {
      // Paused
      setIsPlaying(false);
    }
  };

  if (!currentSong) return null;

  return (
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
  );
}
