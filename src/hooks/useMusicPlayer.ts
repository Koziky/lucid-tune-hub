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
  const playerRef = useRef<any>(null);
  const originalQueueRef = useRef<Song[]>([]);

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

      // Fetch songs for each playlist
      const playlistsWithSongs = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { data: playlistSongs, error: songsError } = await supabase
            .from('playlist_songs')
            .select(`
              position,
              songs (*)
            `)
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

  // Create playlist mutation
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

  // Add song mutation
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

  // Add song to playlist mutation
  const addSongToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      // Get current max position
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
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          position,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  // Delete playlist mutation
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

  // Update playlist mutation
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

  // Delete song mutation
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

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const addToQueue = useCallback(async (song: Song) => {
    setQueue(prev => [...prev, song]);
    originalQueueRef.current = [...originalQueueRef.current, song];
    
    // Save song to database if it doesn't exist
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
      console.log('Fetching metadata for video:', videoId);
      
      // Fetch video metadata from YouTube API
      const { data, error } = await supabase.functions.invoke('fetch-youtube-metadata', {
        body: { videoId },
      });

      console.log('Metadata response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

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

      console.log('Adding song to queue:', song);
      addToQueue(song);
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      
      // Fallback to basic song object
      const song: Song = {
        id: `${Date.now()}-${videoId}`,
        title: 'YouTube Video',
        artist: 'Unknown Artist',
        youtubeId: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };
      
      addToQueue(song);
      
      toast({
        title: "Using basic info",
        description: "Could not fetch full video details",
      });
    }
  }, [addToQueue]);

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
      
      // Update current index if needed
      if (oldIndex === currentIndex) {
        setCurrentIndex(newIndex);
      } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
        setCurrentIndex(prev => prev + 1);
      }
      
      return newQueue;
    });
    
    // Update original queue ref if not shuffled
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
    // First ensure the song exists in the database
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
    deletePlaylist,
    updatePlaylist,
    deleteSong,
    playAllSongs,
  };
};
