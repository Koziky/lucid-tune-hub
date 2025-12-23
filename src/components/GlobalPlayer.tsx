import { useEffect, useRef, useState } from 'react';
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

  const lastVideoIdRef = useRef<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const handleReady = (event: any) => {
    playerRef.current = event.target;
    setIsPlayerReady(true);
    const duration = event.target.getDuration();
    if (duration) {
      setDuration(duration);
    }
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
    if (!currentSong || !isPlayerReady || !playerRef.current) return;
    
    // Only load if video ID actually changed
    if (lastVideoIdRef.current !== currentSong.youtubeId) {
      lastVideoIdRef.current = currentSong.youtubeId;
      try {
        playerRef.current.loadVideoById(currentSong.youtubeId);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.error('Error loading video:', error);
      }
    }
  }, [currentSong?.youtubeId, isPlayerReady, isPlaying]);

  // Keep a hidden audio element to maintain background playback permission
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    
    try {
      // Create a silent audio context to keep background playback alive
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
    } catch (error) {
      console.error('Audio context error:', error);
    }

    return () => {
      try {
        if (oscillator) oscillator.stop();
        if (audioContext) audioContext.close();
      } catch (error) {
        // Ignore cleanup errors
      }
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
        onError={(e) => console.error('YouTube player error:', e)}
      />
    </div>
  );
}
