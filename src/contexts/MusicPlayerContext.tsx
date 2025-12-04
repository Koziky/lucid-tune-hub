import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Song } from '@/types/music';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';

interface MusicPlayerContextType {
  // From useMusicPlayer hook
  queue: Song[];
  currentSong: Song | undefined;
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  playlists: any[];
  allSongs: Song[];
  likedSongs: Song[];
  likedSongIds: Set<string>;
  recentlyPlayed: any[];
  currentPlaylist: string | null;
  sleepTimer: number | null;
  isImportingSpotify: boolean;
  isRefreshingMetadata: boolean;
  
  // Setters
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentIndex: (index: number) => void;
  
  // Actions
  addToQueue: (song: Song) => void;
  addFromYouTubeUrl: (url: string) => Promise<void>;
  importFromSpotify: (url: string) => Promise<void>;
  refreshAllMetadata: () => Promise<void>;
  removeFromQueue: (index: number) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (song: Song) => void;
  setSleepTimerMinutes: (minutes: number | 'end') => void;
  cancelSleepTimer: () => void;
  shareSong: (song: Song) => void;
  createPlaylist: (name: string) => Promise<string>;
  addToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  loadPlaylist: (playlistId: string) => void;
  deletePlaylist: (playlistId: string) => Promise<void>;
  updatePlaylist: (playlistId: string, name: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  playAllSongs: () => void;
  playLikedSongs: () => void;
  recordPlay: (songId: string) => void;
  
  // Player ref for YouTube control
  playerRef: React.MutableRefObject<any>;
  
  // Player state for global player
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const musicPlayer = useMusicPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (musicPlayer.playerRef.current && musicPlayer.isPlaying) {
        setCurrentTime(musicPlayer.playerRef.current.getCurrentTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [musicPlayer.isPlaying]);

  // Media Session API for background playback
  useEffect(() => {
    const currentSong = musicPlayer.queue[musicPlayer.currentIndex];
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: [
          { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (musicPlayer.playerRef.current) {
          musicPlayer.playerRef.current.playVideo();
          musicPlayer.setIsPlaying(true);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (musicPlayer.playerRef.current) {
          musicPlayer.playerRef.current.pauseVideo();
          musicPlayer.setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', musicPlayer.playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', musicPlayer.playNext);
    }
  }, [musicPlayer.queue, musicPlayer.currentIndex, musicPlayer.setIsPlaying, musicPlayer.playPrevious, musicPlayer.playNext]);

  // Record play when song changes
  useEffect(() => {
    const currentSong = musicPlayer.queue[musicPlayer.currentIndex];
    if (currentSong && musicPlayer.isPlaying) {
      musicPlayer.recordPlay(currentSong.id);
    }
  }, [musicPlayer.currentIndex, musicPlayer.isPlaying]);

  const value: MusicPlayerContextType = {
    ...musicPlayer,
    currentSong: musicPlayer.queue[musicPlayer.currentIndex],
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayerContext() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayerContext must be used within a MusicPlayerProvider');
  }
  return context;
}
