ALTER TABLE public.monsters ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS monsters_is_public_idx ON public.monsters (is_public) WHERE is_public;

GRANT SELECT ON public.monsters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monsters TO authenticated;
GRANT ALL ON public.monsters TO service_role;

DROP POLICY IF EXISTS "Users can view their own monsters" ON public.monsters;
DROP POLICY IF EXISTS "Users can create their own monsters" ON public.monsters;
DROP POLICY IF EXISTS "Users can update their own monsters" ON public.monsters;
DROP POLICY IF EXISTS "Users can delete their own monsters" ON public.monsters;

CREATE POLICY "Anyone can view public monsters"
  ON public.monsters FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Users can view their own monsters"
  ON public.monsters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own private monsters"
  ON public.monsters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_public = false);

CREATE POLICY "Admins can create public monsters"
  ON public.monsters FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own private monsters"
  ON public.monsters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_public = false)
  WITH CHECK (auth.uid() = user_id AND is_public = false);

CREATE POLICY "Admins can update any monster"
  ON public.monsters FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own private monsters"
  ON public.monsters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_public = false);

CREATE POLICY "Admins can delete any monster"
  ON public.monsters FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));