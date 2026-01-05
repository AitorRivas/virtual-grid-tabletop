-- Add JSON columns for extended character data
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS subclass text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proficiency_bonus integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS equipment jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proficiencies jsonb DEFAULT '{"saves": [], "skills": [], "expertise": [], "weapons": [], "armor": [], "tools": [], "languages": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS actions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spells jsonb DEFAULT '{"slots": {}, "known": [], "prepared": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS speeds jsonb DEFAULT '{"walk": 30}'::jsonb,
  ADD COLUMN IF NOT EXISTS senses jsonb DEFAULT '{"passive_perception": 10}'::jsonb,
  ADD COLUMN IF NOT EXISTS resistances jsonb DEFAULT '{"damage": [], "conditions": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS spell_ability text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS multiclass jsonb DEFAULT '[]'::jsonb;

-- Add JSON columns for extended monster data
ALTER TABLE public.monsters
  ADD COLUMN IF NOT EXISTS proficiency_bonus integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS alignment text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS speeds jsonb DEFAULT '{"walk": 30}'::jsonb,
  ADD COLUMN IF NOT EXISTS senses jsonb DEFAULT '{"passive_perception": 10, "darkvision": null, "blindsight": null, "tremorsense": null, "truesight": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resistances jsonb DEFAULT '{"damage": [], "conditions": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS immunities jsonb DEFAULT '{"damage": [], "conditions": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS vulnerabilities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS saves jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS traits jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS actions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bonus_actions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legendary_actions jsonb DEFAULT '{"count": 0, "actions": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS lair_actions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hit_dice text DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.characters.equipment IS 'Array of equipment items: {name, type, quantity, equipped, properties, bonus, damage, ac_base, ac_max_dex}';
COMMENT ON COLUMN public.characters.proficiencies IS 'Object with arrays: saves, skills, expertise, weapons, armor, tools, languages';
COMMENT ON COLUMN public.characters.actions IS 'Array of character actions: {name, type, description, attack_bonus, damage, save_dc, range}';
COMMENT ON COLUMN public.characters.spells IS 'Object: {slots: {1: {max, used}...}, known: [], prepared: []}';
COMMENT ON COLUMN public.monsters.actions IS 'Array of monster actions with attack/damage calculations';
COMMENT ON COLUMN public.monsters.legendary_actions IS 'Object: {count: number, actions: [{name, cost, description}]}';