// ==================== CONSOLIDATED MUSIC PLAYER COMPONENTS ====================
// This file contains all music player UI components in one place

import { useState } from 'react';
import { Song, Playlist, RepeatMode } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Plus,
  X,
  GripVertical,
  ExternalLink,
  Link as LinkIcon,
  ListMusic,
  Heart,
  Timer,
  Share2,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ==================== ADD SONG COMPONENT ====================
interface AddSongProps {
  onAddFromUrl: (url: string) => void;
  onImportSpotify?: (url: string) => Promise<void>;
  isImporting?: boolean;
}

export const AddSong = ({ onAddFromUrl, onImportSpotify, isImporting }: AddSongProps) => {
  const [url, setUrl] = useState('');

  const isSpotifyUrl = (url: string) => {
    return url.includes('spotify.com') || url.includes('spotify:');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (isSpotifyUrl(url) && onImportSpotify) {
      await onImportSpotify(url.trim());
    } else {
      onAddFromUrl(url.trim());
    }
    setUrl('');
  };

  return (
    <div className="glass glass-highlight rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-primary" />
        Add Music
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube or Spotify URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-background/50 border-border/50 focus:border-primary transition-colors"
          disabled={isImporting}
        />
        <Button
          type="submit"
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold"
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3">
        Supports YouTube videos and Spotify tracks/playlists
      </p>
    </div>
  );
};

// ==================== NOW PLAYING COMPONENT ====================
interface NowPlayingProps {
  song: Song | undefined;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onShare?: () => void;
}

export const NowPlaying = ({ song, isLiked, onToggleLike, onShare }: NowPlayingProps) => {
  if (!song) {
    return (
      <div className="glass glass-highlight rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-4">
          <Music className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-muted-foreground">No song playing</h3>
        <p className="text-sm text-muted-foreground mt-2">Add a YouTube or Spotify link to start</p>
      </div>
    );
  }

  const handleOpenYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank');
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative group flex-shrink-0">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-20 h-20 object-cover rounded-lg shadow-lg"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold truncate">{song.title}</h2>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>

      <div className="flex items-center gap-1">
        {onToggleLike && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLike}
            className="flex-shrink-0"
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
          </Button>
        )}
        {onShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="flex-shrink-0"
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenYouTube}
          className="flex-shrink-0"
          title="Open on YouTube"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// ==================== PLAYER CONTROLS COMPONENT ====================
interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  currentTime: number;
  duration: number;
  onSeek: (value: number[]) => void;
  sleepTimer?: number | null;
  onSleepTimer?: () => void;
}

export const PlayerControls = ({
  isPlaying,
  isShuffle,
  repeatMode,
  onPlayPause,
  onPrevious,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  currentTime,
  duration,
  onSeek,
  sleepTimer,
  onSleepTimer,
}: PlayerControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleShuffle}
          className={`transition-colors ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Shuffle className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="text-foreground hover:text-primary transition-colors"
        >
          <SkipBack className="h-6 w-6" />
        </Button>

        <Button
          size="icon"
          onClick={onPlayPause}
          className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 transition-all text-primary-foreground shadow-glow"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="h-6 w-6 ml-1" fill="currentColor" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="text-foreground hover:text-primary transition-colors"
        >
          <SkipForward className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRepeat}
          className={`transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="h-5 w-5" />
          ) : (
            <Repeat className="h-5 w-5" />
          )}
        </Button>

        {onSleepTimer && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSleepTimer}
            className={`transition-colors ${sleepTimer ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title={sleepTimer ? `Sleep in ${Math.ceil(sleepTimer / 60)}m` : 'Sleep Timer'}
          >
            <Timer className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={onSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== VOLUME CONTROL COMPONENT ====================
interface VolumeControlProps {
  volume: number;
  onVolumeChange: (value: number[]) => void;
  onMuteToggle: () => void;
}

export const VolumeControl = ({ volume, onVolumeChange, onMuteToggle }: VolumeControlProps) => {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="text-foreground hover:text-primary transition-colors"
      >
        {volume === 0 ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
      <Slider
        value={[volume]}
        max={100}
        step={1}
        onValueChange={onVolumeChange}
        className="w-24 cursor-pointer"
      />
    </div>
  );
};

// ==================== PLAYLIST MANAGER COMPONENT ====================
interface PlaylistManagerProps {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  onCreatePlaylist: (name: string) => void;
  onLoadPlaylist: (id: string) => void;
}

export const PlaylistManager = ({
  playlists,
  currentPlaylistId,
  onCreatePlaylist,
  onLoadPlaylist,
}: PlaylistManagerProps) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (newPlaylistName.trim()) {
      await onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="glass glass-highlight rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ListMusic className="h-5 w-5 text-primary" />
          Playlists
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreating(!isCreating)}
          className="text-primary hover:text-primary/80"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {isCreating && (
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="bg-background/50"
            autoFocus
          />
          <Button onClick={handleCreate} size="sm" className="bg-primary text-primary-foreground">
            Create
          </Button>
        </div>
      )}

      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {playlists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No playlists yet
            </p>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onLoadPlaylist(playlist.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  currentPlaylistId === playlist.id
                    ? 'bg-primary/20 border border-primary/30'
                    : 'hover:bg-muted/30'
                }`}
              >
                <p className="font-medium">{playlist.name}</p>
                <p className="text-sm text-muted-foreground">
                  {playlist.songs.length} songs
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ==================== SORTABLE QUEUE ITEM ====================
interface SortableItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  playlists: Playlist[];
  isLiked?: boolean;
  onSongClick: (index: number) => void;
  onRemove: (index: number) => void;
  onAddToPlaylist: (playlistId: string, song: Song) => void;
  onToggleLike?: (song: Song) => void;
}

const SortableItem = ({ 
  song, 
  index, 
  isCurrentSong, 
  playlists, 
  isLiked,
  onSongClick, 
  onRemove, 
  onAddToPlaylist,
  onToggleLike 
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
        isCurrentSong
          ? 'bg-primary/20 border border-primary/30'
          : 'hover:bg-muted/30'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => onSongClick(index)}
      >
        <div className="relative flex-shrink-0">
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-14 h-14 object-cover rounded-lg"
          />
          {isCurrentSong && (
            <div className="absolute inset-0 bg-primary/30 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
      </div>

      {onToggleLike && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(song);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`} />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass border-border">
          {playlists.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No playlists yet
            </div>
          ) : (
            playlists.map((playlist) => (
              <DropdownMenuItem
                key={playlist.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist(playlist.id, song);
                }}
              >
                Add to {playlist.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank');
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ==================== QUEUE COMPONENT ====================
interface QueueProps {
  queue: Song[];
  currentIndex: number;
  playlists: Playlist[];
  likedSongIds?: Set<string>;
  onSongClick: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onAddToPlaylist: (playlistId: string, song: Song) => void;
  onToggleLike?: (song: Song) => void;
}

export const Queue = ({ 
  queue, 
  currentIndex, 
  playlists, 
  likedSongIds,
  onSongClick, 
  onRemove, 
  onReorder, 
  onAddToPlaylist,
  onToggleLike 
}: QueueProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item) => item.id === active.id);
      const newIndex = queue.findIndex((item) => item.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="glass glass-highlight rounded-xl p-8 text-center">
        <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Queue is empty</p>
      </div>
    );
  }

  return (
    <div className="glass glass-highlight rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4 px-2">Queue</h3>
      <ScrollArea className="h-[calc(100vh-400px)]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={queue.map(song => song.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {queue.map((song, index) => (
                <SortableItem
                  key={song.id}
                  song={song}
                  index={index}
                  isCurrentSong={index === currentIndex}
                  playlists={playlists}
                  isLiked={likedSongIds?.has(song.id)}
                  onSongClick={onSongClick}
                  onRemove={onRemove}
                  onAddToPlaylist={onAddToPlaylist}
                  onToggleLike={onToggleLike}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
};

// ==================== SLEEP TIMER DIALOG COMPONENT ====================
interface SleepTimerDialogProps {
  onSelectTime: (minutes: number | 'end') => void;
  onCancel: () => void;
  currentTimer: number | null;
}

export const SleepTimerOptions = ({ onSelectTime, onCancel, currentTimer }: SleepTimerDialogProps) => {
  const options = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: 'End of song', value: 'end' as const },
  ];

  return (
    <div className="space-y-2">
      {currentTimer && (
        <Button
          variant="outline"
          className="w-full justify-start text-destructive"
          onClick={onCancel}
        >
          Cancel Timer ({Math.ceil(currentTimer / 60)}m remaining)
        </Button>
      )}
      {options.map((option) => (
        <Button
          key={option.label}
          variant="outline"
          className="w-full justify-start"
          onClick={() => onSelectTime(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

// ==================== REFRESH METADATA BUTTON ====================
interface RefreshMetadataButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const RefreshMetadataButton = ({ onRefresh, isRefreshing }: RefreshMetadataButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Metadata'}
    </Button>
  );
};
