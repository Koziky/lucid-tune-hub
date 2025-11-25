import { useState, useCallback, useRef } from 'react';
import { Song, Playlist, RepeatMode } from '@/types/music';
import { toast } from '@/hooks/use-toast';

export const useMusicPlayer = () => {
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const originalQueueRef = useRef<Song[]>([]);

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
    originalQueueRef.current = [...originalQueueRef.current, song];
    toast({
      title: "Added to queue",
      description: `${song.title} by ${song.artist}`,
    });
  }, []);

  const addFromYouTubeUrl = useCallback(async (url: string) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you'd fetch video details from YouTube API
    // For now, we'll create a basic song object
    const song: Song = {
      id: `${Date.now()}-${videoId}`,
      title: 'YouTube Video',
      artist: 'Unknown Artist',
      youtubeId: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };

    addToQueue(song);
  }, [addToQueue]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const playNext = useCallback(() => {
    if (repeatMode === 'one') {
      playerRef.current?.seekTo(0);
      return;
    }

    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, queue.length, repeatMode]);

  const playPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const newShuffle = !prev;
      
      if (newShuffle) {
        // Save current queue before shuffling
        originalQueueRef.current = [...queue];
        
        // Shuffle queue except current song
        const currentSong = queue[currentIndex];
        const otherSongs = queue.filter((_, i) => i !== currentIndex);
        const shuffled = [...otherSongs].sort(() => Math.random() - 0.5);
        setQueue([currentSong, ...shuffled]);
        setCurrentIndex(0);
      } else {
        // Restore original queue
        setQueue(originalQueueRef.current);
        const currentSong = queue[currentIndex];
        const originalIndex = originalQueueRef.current.findIndex(s => s.id === currentSong.id);
        setCurrentIndex(originalIndex);
      }
      
      return newShuffle;
    });
  }, [queue, currentIndex]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      songs: [],
      createdAt: new Date(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    toast({
      title: "Playlist created",
      description: `Created playlist: ${name}`,
    });
    return newPlaylist.id;
  }, []);

  const addToPlaylist = useCallback((playlistId: string, song: Song) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId 
        ? { ...p, songs: [...p.songs, song] }
        : p
    ));
  }, []);

  const loadPlaylist = useCallback((playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      setQueue(playlist.songs);
      originalQueueRef.current = playlist.songs;
      setCurrentIndex(0);
      setCurrentPlaylist(playlistId);
      toast({
        title: "Playlist loaded",
        description: `Playing: ${playlist.name}`,
      });
    }
  }, [playlists]);

  return {
    queue,
    currentSong: queue[currentIndex],
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
    addToQueue,
    addFromYouTubeUrl,
    removeFromQueue,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    createPlaylist,
    addToPlaylist,
    loadPlaylist,
  };
};
