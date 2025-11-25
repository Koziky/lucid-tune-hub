export interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  thumbnail: string;
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: Date;
}

export type RepeatMode = 'off' | 'one' | 'all';
