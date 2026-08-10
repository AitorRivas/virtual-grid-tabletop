CREATE TABLE public.user_creature_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monster_id uuid NOT NULL REFERENCES public.monsters(id) ON DELETE CASCADE,
  favorite boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, monster_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_creature_stats TO authenticated;
GRANT ALL ON public.user_creature_stats TO service_role;

ALTER TABLE public.user_creature_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own creature stats"
ON public.user_creature_stats FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_creature_stats_updated_at
BEFORE UPDATE ON public.user_creature_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_creature_stats_user ON public.user_creature_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_monsters_name ON public.monsters(lower(name));
CREATE INDEX IF NOT EXISTS idx_monsters_type ON public.monsters(type);
CREATE INDEX IF NOT EXISTS idx_monsters_cr ON public.monsters(challenge_rating);
CREATE INDEX IF NOT EXISTS idx_monsters_source ON public.monsters(source);

CREATE OR REPLACE VIEW public.monsters_library
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.user_id,
  m.name,
  m.type,
  m.subtype,
  m.size,
  m.challenge_rating,
  m.source,
  m.is_public,
  m.token_color,
  m.token_size,
  m.token_image_url,
  m.armor_class,
  m.hit_points,
  m.speed,
  m.dexterity,
  m.initiative_bonus,
  m.created_at,
  (m.image_url IS NOT NULL AND m.image_url <> '') AS has_image,
  (m.token_image_url IS NOT NULL AND m.token_image_url <> '') AS has_token,
  (m.spellcasting IS NOT NULL AND m.spellcasting <> 'null'::jsonb) AS has_spellcasting,
  (jsonb_typeof(m.reactions) = 'array' AND jsonb_array_length(m.reactions) > 0) AS has_reactions,
  (jsonb_typeof(m.legendary_actions -> 'actions') = 'array' AND jsonb_array_length(m.legendary_actions -> 'actions') > 0) AS has_legendary,
  (jsonb_typeof(m.mythic_actions -> 'actions') = 'array' AND jsonb_array_length(m.mythic_actions -> 'actions') > 0) AS has_mythic,
  (jsonb_typeof(m.lair_actions) = 'array' AND jsonb_array_length(m.lair_actions) > 0) AS has_lair
FROM public.monsters m;

GRANT SELECT ON public.monsters_library TO anon, authenticated;
GRANT ALL ON public.monsters_library TO service_role;