export interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  thumbnail: string;
  duration?: number;
  userId?: string;
  createdAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: Date;
  userId?: string;
}

export type RepeatMode = 'off' | 'one' | 'all';
