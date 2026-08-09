ALTER TABLE public.monsters
  ADD COLUMN IF NOT EXISTS subtype text,
  ADD COLUMN IF NOT EXISTS xp integer,
  ADD COLUMN IF NOT EXISTS initiative_bonus integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defense_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mythic_actions jsonb NOT NULL DEFAULT '{"trigger": null, "actions": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS spellcasting jsonb,
  ADD COLUMN IF NOT EXISTS special_equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS token_image_url text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_version text;

CREATE UNIQUE INDEX IF NOT EXISTS monsters_user_source_external_idx
  ON public.monsters (user_id, source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;