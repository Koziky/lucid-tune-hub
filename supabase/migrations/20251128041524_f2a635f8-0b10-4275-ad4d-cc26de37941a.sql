-- Liked Songs table
CREATE TABLE public.liked_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- Play History table
CREATE TABLE public.play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;

-- Liked Songs policies
CREATE POLICY "Users can view their liked songs" ON public.liked_songs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can like songs" ON public.liked_songs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike songs" ON public.liked_songs
  FOR DELETE USING (auth.uid() = user_id);

-- Play History policies
CREATE POLICY "Users can view their play history" ON public.play_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to play history" ON public.play_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);