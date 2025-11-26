import { useParams, useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, ArrowLeft, Trash2, GripVertical } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Song } from '@/types/music';

interface SortableItemProps {
  song: Song;
  onPlay: () => void;
  onRemove: () => void;
}

const SortableItem = ({ song, onPlay, onRemove }: SortableItemProps) => {
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
      className="group flex items-center gap-4 p-4 rounded-lg hover:bg-muted/30 transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="relative flex-shrink-0">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onPlay}
          >
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{song.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
};

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, addToQueue } = useMusicPlayer();

  const playlist = playlists.find((p) => p.id === id);
  const [songs, setSongs] = useState(playlist?.songs || []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSongs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemoveSong = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar playlists={playlists} onCreatePlaylist={() => {}} />

        <main className="flex-1 flex flex-col">
          <header className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-[1200px] mx-auto">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
                <p className="text-muted-foreground">{songs.length} songs</p>
              </div>

              {songs.length === 0 ? (
                <div className="glass glass-highlight rounded-xl p-12 text-center">
                  <h3 className="text-xl font-semibold mb-2">No songs in this playlist</h3>
                  <p className="text-muted-foreground">
                    Add songs from your queue to get started
                  </p>
                </div>
              ) : (
                <div className="glass glass-highlight rounded-xl p-6">
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={songs.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {songs.map((song) => (
                            <SortableItem
                              key={song.id}
                              song={song}
                              onPlay={() => addToQueue(song)}
                              onRemove={() => handleRemoveSong(song.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PlaylistDetail;
