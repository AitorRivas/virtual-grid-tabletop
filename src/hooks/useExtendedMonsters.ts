import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { 
  ExtendedMonster, 
  CharacterAction, 
  Feature, 
  Speeds, 
  Senses, 
  Resistances,
  DamageType,
  Skill,
  SaveType
} from '@/types/dnd5e';

const parseMonsterFromDB = (data: any): ExtendedMonster => {
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    type: data.type,
    size: data.size,
    alignment: data.alignment,
    challenge_rating: data.challenge_rating,
    proficiency_bonus: data.proficiency_bonus || 2,
    strength: data.strength,
    dexterity: data.dexterity,
    constitution: data.constitution,
    intelligence: data.intelligence,
    wisdom: data.wisdom,
    charisma: data.charisma,
    armor_class: data.armor_class,
    hit_points: data.hit_points,
    hit_dice: data.hit_dice,
    speed: data.speed,
    speeds: (data.speeds as Speeds) || { walk: 30 },
    senses: (data.senses as Senses) || { passive_perception: 10 },
    languages: (data.languages as string[]) || [],
    resistances: (data.resistances as Resistances) || { damage: [], conditions: [] },
    immunities: (data.immunities as Resistances) || { damage: [], conditions: [] },
    vulnerabilities: (data.vulnerabilities as DamageType[]) || [],
    saves: (data.saves as { ability: SaveType; bonus: number }[]) || [],
    skills: (data.skills as { skill: Skill; bonus: number }[]) || [],
    traits: (data.traits as Feature[]) || [],
    actions: (data.actions as CharacterAction[]) || [],
    bonus_actions: (data.bonus_actions as CharacterAction[]) || [],
    reactions: (data.reactions as CharacterAction[]) || [],
    legendary_actions: (data.legendary_actions as { count: number; actions: CharacterAction[] }) || { count: 0, actions: [] },
    lair_actions: (data.lair_actions as CharacterAction[]) || [],
    token_color: data.token_color,
    token_size: data.token_size,
    image_url: data.image_url,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

export const useExtendedMonsters = () => {
  const [monsters, setMonsters] = useState<ExtendedMonster[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMonsters = async () => {
    if (!user) {
      setMonsters([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('monsters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar monstruos');
      console.error(error);
    } else {
      setMonsters((data || []).map(parseMonsterFromDB));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonsters();
  }, [user]);

  const createMonster = async (monster: Omit<ExtendedMonster, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const dbMonster = {
      name: monster.name,
      type: monster.type,
      size: monster.size as any,
      alignment: monster.alignment,
      challenge_rating: monster.challenge_rating,
      proficiency_bonus: monster.proficiency_bonus,
      strength: monster.strength,
      dexterity: monster.dexterity,
      constitution: monster.constitution,
      intelligence: monster.intelligence,
      wisdom: monster.wisdom,
      charisma: monster.charisma,
      armor_class: monster.armor_class,
      hit_points: monster.hit_points,
      hit_dice: monster.hit_dice,
      speed: monster.speed,
      token_color: monster.token_color as any,
      token_size: monster.token_size,
      image_url: monster.image_url,
      notes: monster.notes,
      user_id: user.id,
      speeds: monster.speeds as any,
      senses: monster.senses as any,
      languages: monster.languages as any,
      resistances: monster.resistances as any,
      immunities: monster.immunities as any,
      vulnerabilities: monster.vulnerabilities as any,
      saves: monster.saves as any,
      skills: monster.skills as any,
      traits: monster.traits as any,
      actions: monster.actions as any,
      bonus_actions: monster.bonus_actions as any,
      reactions: monster.reactions as any,
      legendary_actions: monster.legendary_actions as any,
      lair_actions: monster.lair_actions as any,
    };

    const { data, error } = await supabase
      .from('monsters')
      .insert(dbMonster)
      .select()
      .single();

    if (error) {
      toast.error('Error al crear monstruo');
      console.error(error);
      return null;
    }

    const parsed = parseMonsterFromDB(data);
    setMonsters(prev => [parsed, ...prev]);
    toast.success('Monstruo creado');
    return parsed;
  };

  const updateMonster = async (id: string, updates: Partial<ExtendedMonster>): Promise<boolean> => {
    const dbUpdates: any = { ...updates };
    
    // Convert complex types to JSON
    if (updates.speeds) dbUpdates.speeds = updates.speeds;
    if (updates.senses) dbUpdates.senses = updates.senses;
    if (updates.languages) dbUpdates.languages = updates.languages;
    if (updates.resistances) dbUpdates.resistances = updates.resistances;
    if (updates.immunities) dbUpdates.immunities = updates.immunities;
    if (updates.vulnerabilities) dbUpdates.vulnerabilities = updates.vulnerabilities;
    if (updates.saves) dbUpdates.saves = updates.saves;
    if (updates.skills) dbUpdates.skills = updates.skills;
    if (updates.traits) dbUpdates.traits = updates.traits;
    if (updates.actions) dbUpdates.actions = updates.actions;
    if (updates.bonus_actions) dbUpdates.bonus_actions = updates.bonus_actions;
    if (updates.reactions) dbUpdates.reactions = updates.reactions;
    if (updates.legendary_actions) dbUpdates.legendary_actions = updates.legendary_actions;
    if (updates.lair_actions) dbUpdates.lair_actions = updates.lair_actions;

    const { error } = await supabase
      .from('monsters')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar monstruo');
      console.error(error);
      return false;
    }

    setMonsters(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    toast.success('Monstruo actualizado');
    return true;
  };

  const deleteMonster = async (id: string) => {
    const { error } = await supabase
      .from('monsters')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar monstruo');
      console.error(error);
      return false;
    }

    setMonsters(prev => prev.filter(m => m.id !== id));
    toast.success('Monstruo eliminado');
    return true;
  };

  const cloneMonster = async (monster: ExtendedMonster) => {
    const { id, user_id, created_at, updated_at, ...rest } = monster;
    return createMonster({
      ...rest,
      name: `${monster.name} (copia)`
    });
  };

  return { 
    monsters, 
    loading, 
    createMonster, 
    updateMonster, 
    deleteMonster, 
    cloneMonster,
    refetch: fetchMonsters 
  };
};
