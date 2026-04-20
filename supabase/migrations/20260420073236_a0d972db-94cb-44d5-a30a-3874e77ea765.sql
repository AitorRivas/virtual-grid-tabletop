-- 1. Library groups (flat folders)
CREATE TABLE public.library_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.library_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own groups" ON public.library_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own groups" ON public.library_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own groups" ON public.library_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own groups" ON public.library_groups FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_library_groups_updated_at
  BEFORE UPDATE ON public.library_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Entity <-> group join table (entity can belong to many groups)
CREATE TABLE public.entity_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.library_groups(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'monster')),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, entity_id, entity_type)
);

CREATE INDEX idx_entity_groups_entity ON public.entity_groups(entity_id, entity_type);
CREATE INDEX idx_entity_groups_group ON public.entity_groups(group_id);

ALTER TABLE public.entity_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own entity_groups" ON public.entity_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own entity_groups" ON public.entity_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own entity_groups" ON public.entity_groups FOR DELETE USING (auth.uid() = user_id);

-- 3. Encounters
CREATE TABLE public.encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own encounters" ON public.encounters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own encounters" ON public.encounters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own encounters" ON public.encounters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own encounters" ON public.encounters FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Encounter <-> entity join table
CREATE TABLE public.encounter_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'monster')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  user_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_encounter_entities_encounter ON public.encounter_entities(encounter_id);

ALTER TABLE public.encounter_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own encounter_entities" ON public.encounter_entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own encounter_entities" ON public.encounter_entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own encounter_entities" ON public.encounter_entities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own encounter_entities" ON public.encounter_entities FOR DELETE USING (auth.uid() = user_id);