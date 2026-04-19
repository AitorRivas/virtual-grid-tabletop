-- Create audio_library table for persistent music/ambient tracks
CREATE TABLE public.audio_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'music',
  audio_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audio_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audio"
  ON public.audio_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audio"
  ON public.audio_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio"
  ON public.audio_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio"
  ON public.audio_library FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_audio_library_user ON public.audio_library(user_id, channel);