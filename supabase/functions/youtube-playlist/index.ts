import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playlistId } = await req.json();

    if (!playlistId) {
      throw new Error('Playlist ID is required');
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!youtubeApiKey) {
      console.error('YouTube API key not configured');
      throw new Error('YouTube API key not configured');
    }

    // Get playlist details first
    const playlistDetailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${youtubeApiKey}`;
    const playlistDetailsResponse = await fetch(playlistDetailsUrl);
    const playlistDetails = await playlistDetailsResponse.json();
    const playlistTitle = playlistDetails.items?.[0]?.snippet?.title || 'YouTube Playlist';

    // Fetch all playlist items (with pagination)
    const videos: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${youtubeApiKey}${pageParam}`;
      
      console.log('Fetching playlist items:', playlistId);
      
      const res: Response = await fetch(url);
      
      if (!res.ok) {
        const errorBody = await res.text();
        console.error('YouTube playlist fetch failed:', res.status, errorBody);
        throw new Error(`YouTube API error: ${res.status}`);
      }

      const json = await res.json();
      
      const items = json.items?.map((item: any) => ({
        videoId: item.snippet.resourceId?.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
      })).filter((v: any) => v.videoId && v.title !== 'Private video' && v.title !== 'Deleted video') || [];

      videos.push(...items);
      
      if (json.nextPageToken) {
        nextPageToken = json.nextPageToken;
      } else {
        hasMore = false;
      }
    }

    console.log('Found', videos.length, 'videos in playlist');

    return new Response(
      JSON.stringify({ videos, playlistTitle }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in youtube-playlist:', error);
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
