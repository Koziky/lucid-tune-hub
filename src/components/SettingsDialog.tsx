import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, Volume2, Info } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorWheel } from '@/components/ColorWheel';
import { toast } from 'sonner';

const colorPresets = [
  { name: 'Gold', primary: '45 100% 70%', secondary: '45 80% 55%', accent: '45 95% 65%' },
  { name: 'Purple', primary: '280 80% 65%', secondary: '280 60% 50%', accent: '280 75% 60%' },
  { name: 'Cyan', primary: '180 80% 50%', secondary: '180 60% 40%', accent: '180 75% 55%' },
  { name: 'Rose', primary: '350 80% 65%', secondary: '350 60% 50%', accent: '350 75% 60%' },
  { name: 'Green', primary: '140 70% 50%', secondary: '140 50% 40%', accent: '140 65% 55%' },
  { name: 'Orange', primary: '25 100% 60%', secondary: '25 80% 50%', accent: '25 95% 55%' },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats?: {
    playlists: number;
    likedSongs: number;
    recentlyPlayed: number;
  };
}

export function SettingsDialog({ open, onOpenChange, stats }: SettingsDialogProps) {
  const { colors, setColors, resetColors } = useTheme();

  const [hue, setHue] = useState(() => {
    const match = colors.primary.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 45;
  });

  const handleHueChange = (h: number) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full mt-4">
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
            <Card className="bg-muted/20 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
                  <Label className="text-sm text-muted-foreground mb-3 block">Quick Presets</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetClick(preset)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-all group"
                        title={preset.name}
                      >
                        <div
                          className="w-8 h-8 rounded-full border-2 border-border group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `hsl(${preset.primary})` }}
                        />
                        <span className="text-[10px] font-medium">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Wheel */}
                <div className="flex justify-center">
                  <ColorWheel
                    hue={hue}
                    onHueChange={handleHueChange}
                    onReset={handleReset}
                  />
                </div>

                {/* Preview */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">Preview</Label>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-background/30">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playback" className="mt-6 space-y-6">
            <Card className="bg-muted/20 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Playback Settings
                </CardTitle>
                <CardDescription>
                  Configure how music plays in your app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
            <Card className="bg-muted/20 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
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
                {stats && (
                  <div>
                    <Label className="text-muted-foreground">Library Stats</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="p-3 rounded-lg bg-background/30 text-center">
                        <p className="text-2xl font-bold text-primary">{stats.playlists}</p>
                        <p className="text-xs text-muted-foreground">Playlists</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/30 text-center">
                        <p className="text-2xl font-bold text-primary">{stats.likedSongs}</p>
                        <p className="text-xs text-muted-foreground">Liked Songs</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/30 text-center">
                        <p className="text-2xl font-bold text-primary">{stats.recentlyPlayed}</p>
                        <p className="text-xs text-muted-foreground">Recently Played</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
