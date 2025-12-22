import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Palette, RotateCcw, Volume2, Eye, Info } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMusicPlayerContext } from '@/contexts/MusicPlayerContext';
import { useProfile } from '@/hooks/useProfile';
import { ProfileDialog } from '@/components/ProfileDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const colorPresets = [
  { name: 'Gold', primary: '45 100% 70%', secondary: '45 80% 55%', accent: '45 95% 65%' },
  { name: 'Purple', primary: '280 80% 65%', secondary: '280 60% 50%', accent: '280 75% 60%' },
  { name: 'Cyan', primary: '180 80% 50%', secondary: '180 60% 40%', accent: '180 75% 55%' },
  { name: 'Rose', primary: '350 80% 65%', secondary: '350 60% 50%', accent: '350 75% 60%' },
  { name: 'Green', primary: '140 70% 50%', secondary: '140 50% 40%', accent: '140 65% 55%' },
  { name: 'Orange', primary: '25 100% 60%', secondary: '25 80% 50%', accent: '25 95% 55%' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { colors, setColors, resetColors } = useTheme();
  const { playlists, likedSongs, recentlyPlayed, createPlaylist, updatePlaylist, deletePlaylist, playLikedSongs } = useMusicPlayerContext();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmPlaylist, setDeleteConfirmPlaylist] = useState<string | null>(null);

  // Custom color state
  const [hue, setHue] = useState(() => {
    const match = colors.primary.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 45;
  });

  const handleHueChange = (value: number[]) => {
    const h = value[0];
    setHue(h);
    setColors({
      primary: `${h} 100% 70%`,
      secondary: `${h} 80% 55%`,
      accent: `${h} 95% 65%`,
    });
  };

  const handlePresetClick = (preset: typeof colorPresets[0]) => {
    setColors({
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
    });
    const match = preset.primary.match(/^(\d+)/);
    if (match) setHue(parseInt(match[1]));
    toast.success(`Applied ${preset.name} theme`);
  };

  const handleReset = () => {
    resetColors();
    setHue(45);
    toast.success('Theme reset to default');
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreatePlaylistOpen(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          playlists={playlists}
          likedSongsCount={likedSongs.length}
          recentlyPlayedCount={recentlyPlayed.length}
          profile={profile}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onOpenYourMusic={() => {}}
          onEditPlaylist={(id, name) => setEditingPlaylist({ id, name })}
          onDeletePlaylist={(id) => setDeleteConfirmPlaylist(id)}
          onPlayLikedSongs={playLikedSongs}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">Settings</h2>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="appearance">
                    <Palette className="h-4 w-4 mr-2" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="playback">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Playback
                  </TabsTrigger>
                  <TabsTrigger value="about">
                    <Info className="h-4 w-4 mr-2" />
                    About
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="mt-6 space-y-6">
                  {/* Color Theme */}
                  <Card className="glass border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Color Theme
                      </CardTitle>
                      <CardDescription>
                        Customize the accent color of your music player
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Color Presets */}
                      <div>
                        <Label className="text-sm text-muted-foreground mb-3 block">Presets</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => handlePresetClick(preset)}
                              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all group"
                            >
                              <div
                                className="w-10 h-10 rounded-full border-2 border-border group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: `hsl(${preset.primary})` }}
                              />
                              <span className="text-xs font-medium">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Hue Slider */}
                      <div>
                        <Label className="text-sm text-muted-foreground mb-3 block">Custom Color</Label>
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-full border-2 border-border flex-shrink-0"
                            style={{ backgroundColor: `hsl(${hue} 100% 70%)` }}
                          />
                          <Slider
                            value={[hue]}
                            onValueChange={handleHueChange}
                            max={360}
                            step={1}
                            className="flex-1"
                            style={{
                              background: `linear-gradient(to right, 
                                hsl(0, 100%, 70%), 
                                hsl(60, 100%, 70%), 
                                hsl(120, 100%, 70%), 
                                hsl(180, 100%, 70%), 
                                hsl(240, 100%, 70%), 
                                hsl(300, 100%, 70%), 
                                hsl(360, 100%, 70%)
                              )`,
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      <div>
                        <Label className="text-sm text-muted-foreground mb-3 block">Preview</Label>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                          <Button size="sm" className="bg-primary text-primary-foreground">
                            Primary
                          </Button>
                          <Button size="sm" variant="secondary">
                            Secondary
                          </Button>
                          <Button size="sm" variant="outline" className="border-primary text-primary">
                            Outline
                          </Button>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="w-full border-border hover:border-destructive hover:text-destructive"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Default
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="playback" className="mt-6 space-y-6">
                  <Card className="glass border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-primary" />
                        Playback Settings
                      </CardTitle>
                      <CardDescription>
                        Configure how music plays in your app
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Autoplay Next Song</Label>
                          <p className="text-sm text-muted-foreground">Automatically play the next song when one ends</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Crossfade</Label>
                          <p className="text-sm text-muted-foreground">Smooth transition between songs</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Visualizer</Label>
                          <p className="text-sm text-muted-foreground">Display audio visualizer during playback</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="about" className="mt-6 space-y-6">
                  <Card className="glass border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        About GlassBeats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Version</Label>
                        <p className="font-medium">1.0.0</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="font-medium">A beautiful glass-themed music player with YouTube integration</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Library Stats</Label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-2xl font-bold text-primary">{playlists.length}</p>
                            <p className="text-xs text-muted-foreground">Playlists</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-2xl font-bold text-primary">{likedSongs.length}</p>
                            <p className="text-xs text-muted-foreground">Liked Songs</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-2xl font-bold text-primary">{recentlyPlayed.length}</p>
                            <p className="text-xs text-muted-foreground">Recently Played</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      <ProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        profile={profile}
        onUpdateProfile={updateProfile}
        onUploadAvatar={uploadAvatar}
      />
    </SidebarProvider>
  );
}
