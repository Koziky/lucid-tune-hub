import { Song } from '@/types/music';
import { Button } from '@/components/ui/button';
import { X, Music2, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QueueProps {
  queue: Song[];
  currentIndex: number;
  onSongClick: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

interface SortableItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  onSongClick: (index: number) => void;
  onRemove: (index: number) => void;
}

const SortableItem = ({ song, index, isCurrentSong, onSongClick, onRemove }: SortableItemProps) => {
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

export const Queue = ({ queue, currentIndex, onSongClick, onRemove, onReorder }: QueueProps) => {
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
                  onSongClick={onSongClick}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
};
