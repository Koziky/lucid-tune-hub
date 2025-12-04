import { useEffect, useRef } from 'react';
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
    currentIndex,
    queue,
  } = useMusicPlayerContext();

  const lastVideoIdRef = useRef<string | null>(null);

  const handleReady = (event: any) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const handleStateChange = (event: any) => {
    if (event.data === 0) {
      // Video ended - play next even in background
      playNext();
    } else if (event.data === 1) {
      // Playing
      setIsPlaying(true);
    } else if (event.data === 2) {
      // Paused
      setIsPlaying(false);
    }
  };

  // Handle song changes - load new video when currentSong changes
  useEffect(() => {
    if (currentSong && playerRef.current && lastVideoIdRef.current !== currentSong.youtubeId) {
      lastVideoIdRef.current = currentSong.youtubeId;
      playerRef.current.loadVideoById(currentSong.youtubeId);
      if (isPlaying) {
        playerRef.current.playVideo();
      }
    }
  }, [currentSong?.youtubeId, isPlaying]);

  // Keep a hidden audio element to maintain background playback permission
  useEffect(() => {
    // Create a silent audio context to keep background playback alive
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Silent
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    return () => {
      oscillator.stop();
      audioContext.close();
    };
  }, []);

  if (!currentSong) return null;

  return (
    <div className="hidden">
      <YouTube
        videoId={currentSong.youtubeId}
        opts={{
          height: '1',
          width: '1',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            playsinline: 1,
            enablejsapi: 1,
          },
        }}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onEnd={playNext}
      />
    </div>
  );
}
