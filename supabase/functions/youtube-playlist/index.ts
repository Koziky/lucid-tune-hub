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

    console.log('Received playlistId:', playlistId);

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!youtubeApiKey) {
      console.error('YouTube API key not configured');
      throw new Error('YouTube API key not configured. Please add YOUTUBE_API_KEY to your secrets.');
    }

    // Get playlist details first
    const playlistDetailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${youtubeApiKey}`;
    console.log('Fetching playlist details...');
    
    const playlistDetailsResponse = await fetch(playlistDetailsUrl);
    const playlistDetails = await playlistDetailsResponse.json();
    
    if (playlistDetails.error) {
      console.error('YouTube API error on playlist details:', JSON.stringify(playlistDetails.error));
      throw new Error(`YouTube API error: ${playlistDetails.error.message || playlistDetails.error.code}`);
    }
    
    if (!playlistDetails.items || playlistDetails.items.length === 0) {
      console.error('Playlist not found or is private. Response:', JSON.stringify(playlistDetails));
      throw new Error('Playlist not found. It may be private or the URL is incorrect.');
    }
    
    const playlistTitle = playlistDetails.items[0]?.snippet?.title || 'YouTube Playlist';
    console.log('Playlist title:', playlistTitle);

    // Fetch all playlist items (with pagination)
    const videos: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const pageParam: string = nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${youtubeApiKey}${pageParam}`;
      
      console.log('Fetching playlist items page...');
      
      const res: Response = await fetch(url);
      const json: any = await res.json();
      
      if (json.error) {
        console.error('YouTube API error on playlist items:', JSON.stringify(json.error));
        throw new Error(`YouTube API error: ${json.error.message || json.error.code}`);
      }
      
      const items = json.items?.map((item: any) => ({
        videoId: item.snippet.resourceId?.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.snippet.resourceId?.videoId}/mqdefault.jpg`,
        channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || 'Unknown',
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
