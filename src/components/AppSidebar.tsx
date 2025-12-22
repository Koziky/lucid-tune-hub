import { Home, Music2, ListMusic, Plus, MoreVertical, Pencil, Trash2, Heart, User, Settings, PlusCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Playlist } from '@/types/music';
import { Profile } from '@/hooks/useProfile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mainItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Add Music', url: '/add-music', icon: PlusCircle },
];

interface AppSidebarProps {
  playlists: Playlist[];
  likedSongsCount?: number;
  recentlyPlayedCount?: number;
  profile?: Profile | null;
  onCreatePlaylist: () => void;
  onOpenYourMusic: () => void;
  onEditPlaylist: (playlistId: string, currentName: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onPlayLikedSongs?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export function AppSidebar({ 
  playlists, 
  likedSongsCount = 0,
  recentlyPlayedCount = 0,
  profile,
  onCreatePlaylist, 
  onOpenYourMusic,
  onEditPlaylist,
  onDeletePlaylist,
  onPlayLikedSongs,
  onOpenProfile,
  onOpenSettings,
}: AppSidebarProps) {
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            GlassBeats
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors"
                      activeClassName="text-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenYourMusic}
                  className="px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <Music2 className="h-5 w-5" />
                  {open && <span>Your Music</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenSettings}
                  className="px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <Settings className="h-5 w-5" />
                  {open && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-6 py-2">
          <div className="h-px bg-border" />
        </div>

        {/* Library Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
            Library
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onPlayLikedSongs}
                  className="px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <Heart className="h-5 w-5" />
                  {open && (
                    <span className="flex items-center justify-between flex-1">
                      <span>Liked Songs</span>
                      <span className="text-xs text-muted-foreground">{likedSongsCount}</span>
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-6 py-2">
          <div className="h-px bg-border" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
            Playlists
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={onCreatePlaylist}
                  className="px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  {open && <span>Create Playlist</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            {playlists.length > 0 && (
              <ScrollArea className="h-[300px]">
                <SidebarMenu>
                  {playlists.map((playlist) => (
                    <SidebarMenuItem key={playlist.id}>
                      <div className="group flex items-center">
                        <SidebarMenuButton asChild className="flex-1">
                          <NavLink
                            to={`/playlist/${playlist.id}`}
                            className="flex items-center gap-3 px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors"
                            activeClassName="text-primary font-semibold"
                          >
                            <ListMusic className="h-5 w-5" />
                            {open && <span className="truncate">{playlist.name}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                        {open && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-border">
                              <DropdownMenuItem
                                onClick={() => onEditPlaylist(playlist.id, playlist.name)}
                                className="cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Name
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeletePlaylist(playlist.id)}
                                className="cursor-pointer text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </ScrollArea>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Profile Footer */}
      <SidebarFooter className="border-t border-border p-4">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/30 transition-colors"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.username?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium truncate">{profile?.username || 'Set username'}</p>
              <p className="text-xs text-muted-foreground">Edit profile</p>
            </div>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
