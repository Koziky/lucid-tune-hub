import { useState, useRef } from 'react';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, Loader2, User } from 'lucide-react';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onUpdateProfile: (updates: { username?: string }) => Promise<any>;
  onUploadAvatar: (file: File) => Promise<void>;
}

export const ProfileDialog = ({
  open,
  onOpenChange,
  profile,
  onUpdateProfile,
  onUploadAvatar,
}: ProfileDialogProps) => {
  const [username, setUsername] = useState(profile?.username || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadAvatar(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({ username });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {profile?.username?.[0]?.toUpperCase() || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Username */}
          <div className="w-full space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
