import { Home, Music2, ListMusic, Plus } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Playlist } from '@/types/music';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

const mainItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Your Music', url: '/library', icon: Music2 },
];

interface AppSidebarProps {
  playlists: Playlist[];
  onCreatePlaylist: () => void;
}

export function AppSidebar({ playlists, onCreatePlaylist }: AppSidebarProps) {
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-6 py-4">
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
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/playlist/${playlist.id}`}
                          className="flex items-center gap-3 px-6 py-3 text-sidebar-foreground hover:text-primary transition-colors"
                          activeClassName="text-primary font-semibold"
                        >
                          <ListMusic className="h-5 w-5" />
                          {open && <span className="truncate">{playlist.name}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </ScrollArea>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
