-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for new users to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create D&D size enum
CREATE TYPE public.creature_size AS ENUM ('tiny', 'small', 'medium', 'large', 'huge', 'gargantuan');

-- Create token color enum
CREATE TYPE public.token_color AS ENUM ('red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'black');

-- Create characters table (player characters)
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  race TEXT NOT NULL DEFAULT 'Human',
  class TEXT NOT NULL DEFAULT 'Fighter',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  background TEXT,
  alignment TEXT,
  
  -- Ability scores (1-30 range for D&D)
  strength INTEGER NOT NULL DEFAULT 10 CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL DEFAULT 10 CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL DEFAULT 10 CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL DEFAULT 10 CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL DEFAULT 10 CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL DEFAULT 10 CHECK (charisma >= 1 AND charisma <= 30),
  
  -- Combat stats
  armor_class INTEGER NOT NULL DEFAULT 10,
  hit_points_max INTEGER NOT NULL DEFAULT 10,
  hit_points_current INTEGER DEFAULT 10,
  speed INTEGER NOT NULL DEFAULT 30,
  initiative_bonus INTEGER NOT NULL DEFAULT 0,
  
  -- Token appearance
  token_color token_color NOT NULL DEFAULT 'blue',
  token_size INTEGER NOT NULL DEFAULT 50,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Characters policies
CREATE POLICY "Users can view their own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters" ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Create monsters table
CREATE TABLE public.monsters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Beast', -- beast, dragon, humanoid, undead, fiend, etc.
  size creature_size NOT NULL DEFAULT 'medium',
  challenge_rating TEXT NOT NULL DEFAULT '1', -- Can be fractions like "1/4", "1/2"
  
  -- Ability scores
  strength INTEGER NOT NULL DEFAULT 10 CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL DEFAULT 10 CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL DEFAULT 10 CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL DEFAULT 10 CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL DEFAULT 10 CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL DEFAULT 10 CHECK (charisma >= 1 AND charisma <= 30),
  
  -- Combat stats
  armor_class INTEGER NOT NULL DEFAULT 10,
  hit_points INTEGER NOT NULL DEFAULT 10,
  speed INTEGER NOT NULL DEFAULT 30,
  
  -- Token appearance
  token_color token_color NOT NULL DEFAULT 'red',
  token_size INTEGER NOT NULL DEFAULT 50,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on monsters
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;

-- Monsters policies
CREATE POLICY "Users can view their own monsters" ON public.monsters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own monsters" ON public.monsters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monsters" ON public.monsters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monsters" ON public.monsters FOR DELETE USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monsters_updated_at BEFORE UPDATE ON public.monsters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();