import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Link as LinkIcon } from 'lucide-react';

interface AddSongProps {
  onAddFromUrl: (url: string) => void;
}

export const AddSong = ({ onAddFromUrl }: AddSongProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAddFromUrl(url.trim());
      setUrl('');
    }
  };

  return (
    <div className="glass glass-highlight rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-primary" />
        Add from YouTube
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-background/50 border-border/50 focus:border-primary transition-colors"
        />
        <Button
          type="submit"
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3">
        Paste any YouTube video URL to add it to your queue
      </p>
    </div>
  );
};
