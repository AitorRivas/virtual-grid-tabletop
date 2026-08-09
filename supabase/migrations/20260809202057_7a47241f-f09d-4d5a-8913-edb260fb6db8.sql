CREATE TABLE public.import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'unknown',
  file_name text,
  total integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_history TO authenticated;
GRANT ALL ON public.import_history TO service_role;

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own import history" ON public.import_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own import history" ON public.import_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own import history" ON public.import_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_import_history_user_created ON public.import_history (user_id, created_at DESC);

CREATE POLICY "Users manage own creature images select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users manage own creature images insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users manage own creature images update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users manage own creature images delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);