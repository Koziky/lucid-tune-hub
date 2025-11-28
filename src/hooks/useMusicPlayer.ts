import { useState, useCallback, useRef, useEffect } from 'react';
import { Song, Playlist, RepeatMode } from '@/types/music';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useMusicPlayer = () => {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [isImportingSpotify, setIsImportingSpotify] = useState(false);
  const [isRefreshingMetadata, setIsRefreshingMetadata] = useState(false);
  const playerRef = useRef<any>(null);
  const originalQueueRef = useRef<Song[]>([]);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sleep timer effect
  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimer((prev) => {
          if (prev === null || prev <= 1) {
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
            setIsPlaying(false);
            if (playerRef.current) playerRef.current.pauseVideo();
            toast({ title: 'Sleep timer', description: 'Playback stopped' });
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimer !== null]);

  // Fetch user's playlists
  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      const playlistsWithSongs = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { data: playlistSongs, error: songsError } = await supabase
            .from('playlist_songs')
            .select(`position, songs (*)`)
            .eq('playlist_id', playlist.id)
            .order('position', { ascending: true });

          if (songsError) throw songsError;

          const songs: Song[] = (playlistSongs || []).map((ps: any) => ({
            id: ps.songs.id,
            title: ps.songs.title,
            artist: ps.songs.artist,
            youtubeId: ps.songs.youtube_id,
            thumbnail: ps.songs.thumbnail,
            duration: ps.songs.duration,
            userId: ps.songs.user_id,
            createdAt: ps.songs.created_at,
          }));

          return {
            id: playlist.id,
            name: playlist.name,
            songs,
            createdAt: new Date(playlist.created_at),
            userId: playlist.user_id,
          };
        })
      );

      return playlistsWithSongs;
    },
  });

  // Fetch all user's songs
  const { data: allSongs = [] } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        youtubeId: song.youtube_id,
        thumbnail: song.thumbnail,
        duration: song.duration,
        userId: song.user_id,
        createdAt: song.created_at,
      }));
    },
  });

  // Fetch liked songs
  const { data: likedSongs = [] } = useQuery({
    queryKey: ['liked_songs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('liked_songs')
        .select('song_id, created_at, songs(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.songs.id,
        title: item.songs.title,
        artist: item.songs.artist,
        youtubeId: item.songs.youtube_id,
        thumbnail: item.songs.thumbnail,
        duration: item.songs.duration,
        userId: item.songs.user_id,
        createdAt: item.songs.created_at,
        likedAt: item.created_at,
      }));
    },
  });

  // Fetch play history
  const { data: recentlyPlayed = [] } = useQuery({
    queryKey: ['play_history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('play_history')
        .select('played_at, songs(*)')
        .order('played_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.songs.id,
        title: item.songs.title,
        artist: item.songs.artist,
        youtubeId: item.songs.youtube_id,
        thumbnail: item.songs.thumbnail,
        duration: item.songs.duration,
        userId: item.songs.user_id,
        playedAt: item.played_at,
      }));
    },
  });

  const likedSongIds = new Set(likedSongs.map(s => s.id));

  // Mutations
  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('playlists')
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async (song: Omit<Song, 'id' | 'userId' | 'createdAt'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: song.title,
          artist: song.artist,
          youtube_id: song.youtubeId,
          thumbnail: song.thumbnail,
          duration: song.duration,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });

  const addSongToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const { data: existingSongs } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const position = existingSongs && existingSongs.length > 0 
        ? existingSongs[0].position + 1 
        : 0;

      const { error } = await supabase
        .from('playlist_songs')
        .insert({ playlist_id: playlistId, song_id: songId, position });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, name }: { playlistId: string; name: string }) => {
      const { error } = await supabase
        .from('playlists')
        .update({ name })
        .eq('id', playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ songId, isLiked }: { songId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('liked_songs')
          .delete()
          .eq('song_id', songId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('liked_songs')
          .insert({ song_id: songId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked_songs'] });
    },
  });

  const addToPlayHistoryMutation = useMutation({
    mutationFn: async (songId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('play_history')
        .insert({ song_id: songId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['play_history'] });
    },
  });

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const addToQueue = useCallback(async (song: Song) => {
    setQueue(prev => [...prev, song]);
    originalQueueRef.current = [...originalQueueRef.current, song];
    
    const existingSong = allSongs.find(s => s.youtubeId === song.youtubeId);
    if (!existingSong) {
      await addSongMutation.mutateAsync(song);
    }
    
    toast({
      title: "Added to queue",
      description: `${song.title} by ${song.artist}`,
    });
  }, [allSongs, addSongMutation]);

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

    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-metadata', {
        body: { videoId },
      });

      if (error) throw error;

      if (!data || !data.title) {
        throw new Error('Invalid response from metadata service');
      }

      const song: Song = {
        id: `${Date.now()}-${videoId}`,
        title: data.title,
        artist: data.artist,
        youtubeId: videoId,
        thumbnail: data.thumbnail,
        duration: data.duration,
      };

      addToQueue(song);
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      
      const song: Song = {
        id: `${Date.now()}-${videoId}`,
        title: 'YouTube Video',
        artist: 'Unknown Artist',
        youtubeId: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };
      
      addToQueue(song);
    }
  }, [addToQueue]);

  const importFromSpotify = useCallback(async (url: string) => {
    setIsImportingSpotify(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-import', {
        body: { url },
      });

      if (error) throw error;

      if (!data || !data.tracks || data.tracks.length === 0) {
        throw new Error('No tracks found or could not match to YouTube');
      }

      for (const track of data.tracks) {
        const song: Song = {
          id: `${Date.now()}-${track.youtubeId}`,
          title: track.title,
          artist: track.artist,
          youtubeId: track.youtubeId,
          thumbnail: track.youtubeThumbnail || track.thumbnail,
          duration: track.duration,
        };
        
        const existingSong = allSongs.find(s => s.youtubeId === song.youtubeId);
        if (!existingSong) {
          await addSongMutation.mutateAsync(song);
        }
        
        setQueue(prev => [...prev, song]);
        originalQueueRef.current = [...originalQueueRef.current, song];
      }

      toast({
        title: "Spotify import complete",
        description: `Added ${data.matched}/${data.total} tracks to queue`,
      });
    } catch (error) {
      console.error('Spotify import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Could not import from Spotify",
        variant: "destructive",
      });
    } finally {
      setIsImportingSpotify(false);
    }
  }, [allSongs, addSongMutation]);

  const refreshAllMetadata = useCallback(async () => {
    setIsRefreshingMetadata(true);
    let updated = 0;

    try {
      for (const song of allSongs) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-youtube-metadata', {
            body: { videoId: song.youtubeId },
          });

          if (!error && data && data.title && data.title !== song.title) {
            await supabase
              .from('songs')
              .update({
                title: data.title,
                artist: data.artist,
                thumbnail: data.thumbnail,
              })
              .eq('id', song.id);
            updated++;
          }
        } catch (e) {
          console.error(`Failed to refresh metadata for ${song.id}:`, e);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });

      toast({
        title: "Metadata refreshed",
        description: `Updated ${updated} songs`,
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh metadata",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingMetadata(false);
    }
  }, [allSongs, queryClient]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(oldIndex, 1);
      newQueue.splice(newIndex, 0, removed);
      
      if (oldIndex === currentIndex) {
        setCurrentIndex(newIndex);
      } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
        setCurrentIndex(prev => prev + 1);
      }
      
      return newQueue;
    });
    
    if (!isShuffle) {
      originalQueueRef.current = [...originalQueueRef.current];
      const [removed] = originalQueueRef.current.splice(oldIndex, 1);
      originalQueueRef.current.splice(newIndex, 0, removed);
    }
  }, [currentIndex, isShuffle]);

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
        originalQueueRef.current = [...queue];
        const currentSong = queue[currentIndex];
        const otherSongs = queue.filter((_, i) => i !== currentIndex);
        const shuffled = [...otherSongs].sort(() => Math.random() - 0.5);
        setQueue([currentSong, ...shuffled]);
        setCurrentIndex(0);
      } else {
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

  const toggleLike = useCallback(async (song: Song) => {
    const isLiked = likedSongIds.has(song.id);
    await toggleLikeMutation.mutateAsync({ songId: song.id, isLiked });
    toast({
      title: isLiked ? "Removed from Liked Songs" : "Added to Liked Songs",
      description: song.title,
    });
  }, [likedSongIds, toggleLikeMutation]);

  const setSleepTimerMinutes = useCallback((minutes: number | 'end') => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    
    if (minutes === 'end') {
      // Will be handled in playNext
      toast({ title: 'Sleep timer set', description: 'Will stop after current song' });
    } else {
      setSleepTimer(minutes * 60);
      toast({ title: 'Sleep timer set', description: `Will stop in ${minutes} minutes` });
    }
  }, []);

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    setSleepTimer(null);
    toast({ title: 'Sleep timer cancelled' });
  }, []);

  const shareSong = useCallback((song: Song) => {
    const url = `https://www.youtube.com/watch?v=${song.youtubeId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "YouTube link copied to clipboard",
    });
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    const newPlaylist = await createPlaylistMutation.mutateAsync(name);
    if (!newPlaylist) return '';
    toast({
      title: "Playlist created",
      description: `Created playlist: ${name}`,
    });
    return newPlaylist.id;
  }, [createPlaylistMutation]);

  const addToPlaylist = useCallback(async (playlistId: string, song: Song) => {
    let songId = song.id;
    
    const existingSong = allSongs.find(s => s.youtubeId === song.youtubeId);
    if (!existingSong) {
      const newSong = await addSongMutation.mutateAsync(song);
      if (!newSong) return;
      songId = newSong.id;
    }

    await addSongToPlaylistMutation.mutateAsync({ playlistId, songId });
    
    toast({
      title: "Added to playlist",
      description: `Added ${song.title} to playlist`,
    });
  }, [allSongs, addSongMutation, addSongToPlaylistMutation]);

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

  const deletePlaylist = useCallback(async (playlistId: string) => {
    await deletePlaylistMutation.mutateAsync(playlistId);
    toast({
      title: "Playlist deleted",
      description: "Playlist has been removed",
    });
  }, [deletePlaylistMutation]);

  const updatePlaylist = useCallback(async (playlistId: string, name: string) => {
    await updatePlaylistMutation.mutateAsync({ playlistId, name });
    toast({
      title: "Playlist updated",
      description: `Renamed to: ${name}`,
    });
  }, [updatePlaylistMutation]);

  const deleteSong = useCallback(async (songId: string) => {
    await deleteSongMutation.mutateAsync(songId);
    toast({
      title: "Song deleted",
      description: "Song removed from your library",
    });
  }, [deleteSongMutation]);

  const playAllSongs = useCallback(() => {
    if (allSongs.length > 0) {
      setQueue(allSongs);
      originalQueueRef.current = allSongs;
      setCurrentIndex(0);
      setIsPlaying(true);
      toast({
        title: "Playing all songs",
        description: `${allSongs.length} songs in queue`,
      });
    }
  }, [allSongs]);

  const playLikedSongs = useCallback(() => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs);
      originalQueueRef.current = likedSongs;
      setCurrentIndex(0);
      setIsPlaying(true);
      toast({
        title: "Playing liked songs",
        description: `${likedSongs.length} songs in queue`,
      });
    }
  }, [likedSongs]);

  const recordPlay = useCallback((songId: string) => {
    addToPlayHistoryMutation.mutate(songId);
  }, [addToPlayHistoryMutation]);

  return {
    queue,
    currentSong: queue[currentIndex],
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
    recordPlay,
  };
};
