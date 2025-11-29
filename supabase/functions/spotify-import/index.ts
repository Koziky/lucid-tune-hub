import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  duration_ms: number;
}

async function getSpotifyToken(): Promise<string> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  console.log('Checking Spotify credentials...');
  console.log('Client ID exists:', !!clientId);
  console.log('Client Secret exists:', !!clientSecret);

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  // Use TextEncoder for proper base64 encoding
  const credentials = `${clientId}:${clientSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(credentials);
  const base64Credentials = btoa(String.fromCharCode(...data));

  console.log('Making token request to Spotify...');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${base64Credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify token error:', response.status, errorText);
    throw new Error(`Failed to get Spotify token: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('Got Spotify token successfully');
  return tokenData.access_token;
}

async function getTrack(token: string, trackId: string): Promise<SpotifyTrack> {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch track');
  }

  return response.json();
}

async function getPlaylistTracks(token: string, playlistId: string): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch playlist tracks');
    }

    const json: { items: any[]; next: string | null } = await res.json();
    tracks.push(...json.items.filter((item: any) => item.track).map((item: any) => item.track));
    nextUrl = json.next;
  }

  return tracks;
}

async function getAlbumTracks(token: string, albumId: string): Promise<SpotifyTrack[]> {
  // First get album info for the cover image
  const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!albumRes.ok) {
    throw new Error('Failed to fetch album');
  }

  const album = await albumRes.json();
  const albumImage = album.images[0]?.url || '';

  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch album tracks');
    }

    const json: { items: any[]; next: string | null } = await res.json();
    // Album tracks don't include album info, so we add it
    tracks.push(...json.items.map((item: any) => ({
      name: item.name,
      artists: item.artists,
      album: { images: [{ url: albumImage }] },
      duration_ms: item.duration_ms,
    })));
    nextUrl = json.next;
  }

  return tracks;
}

async function searchYouTube(query: string): Promise<{ videoId: string; title: string; thumbnail: string } | null> {
  const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
  
  if (!youtubeApiKey) {
    // Fallback: return null and let client handle it
    console.log('YouTube API key not configured, skipping search');
    return null;
  }

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${youtubeApiKey}`;
  
  const response = await fetch(searchUrl);
  if (!response.ok) {
    console.error('YouTube search failed:', response.status);
    return null;
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    return null;
  }

  const item = data.items[0];
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium.url,
  };
}

function extractSpotifyId(url: string): { type: 'track' | 'playlist' | 'album'; id: string } | null {
  // Handle various Spotify URL formats
  const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) {
    return { type: 'track', id: trackMatch[1] };
  }

  const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) {
    return { type: 'playlist', id: playlistMatch[1] };
  }

  const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch) {
    return { type: 'album', id: albumMatch[1] };
  }

  // Handle spotify:track:id format
  const trackUriMatch = url.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (trackUriMatch) {
    return { type: 'track', id: trackUriMatch[1] };
  }

  const playlistUriMatch = url.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (playlistUriMatch) {
    return { type: 'playlist', id: playlistUriMatch[1] };
  }

  const albumUriMatch = url.match(/spotify:album:([a-zA-Z0-9]+)/);
  if (albumUriMatch) {
    return { type: 'album', id: albumUriMatch[1] };
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing Spotify URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const spotifyInfo = extractSpotifyId(url);
    if (!spotifyInfo) {
      throw new Error('Invalid Spotify URL');
    }

    console.log('Spotify info:', spotifyInfo);

    const token = await getSpotifyToken();
    console.log('Got Spotify token');

    let tracks: SpotifyTrack[];

    if (spotifyInfo.type === 'track') {
      const track = await getTrack(token, spotifyInfo.id);
      tracks = [track];
    } else if (spotifyInfo.type === 'album') {
      tracks = await getAlbumTracks(token, spotifyInfo.id);
    } else {
      tracks = await getPlaylistTracks(token, spotifyInfo.id);
    }

    console.log(`Found ${tracks.length} tracks`);

    // Convert to our format and search YouTube for each
    const results = await Promise.all(
      tracks.map(async (track) => {
        const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')} official audio`;
        const youtubeResult = await searchYouTube(searchQuery);

        return {
          title: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          thumbnail: track.album.images[0]?.url || '',
          duration: Math.floor(track.duration_ms / 1000),
          youtubeId: youtubeResult?.videoId || null,
          youtubeThumbnail: youtubeResult?.thumbnail || null,
        };
      })
    );

    // Filter out tracks without YouTube matches
    const validResults = results.filter(r => r.youtubeId);
    console.log(`Found YouTube matches for ${validResults.length}/${tracks.length} tracks`);

    return new Response(
      JSON.stringify({
        tracks: validResults,
        total: tracks.length,
        matched: validResults.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing Spotify URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
