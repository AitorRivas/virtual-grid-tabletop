import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Character, TokenColor } from '@/types/dnd';
import { ExtendedCharacter, CharacterProficiencies, CharacterAction, EquipmentItem, Feature, Speeds, Senses, Resistances, CharacterSpells, MulticlassEntry } from '@/types/dnd5e';
import { toast } from 'sonner';

// Helper to parse JSON fields safely
const parseCharacterFromDB = (data: any): ExtendedCharacter => ({
  ...data,
  equipment: Array.isArray(data.equipment) ? data.equipment : [],
  proficiencies: data.proficiencies || { saves: [], skills: [], expertise: [], weapons: [], armor: [], tools: [], languages: [] },
  features: Array.isArray(data.features) ? data.features : [],
  actions: Array.isArray(data.actions) ? data.actions : [],
  spells: data.spells || { slots: {}, known: [], prepared: [] },
  speeds: data.speeds || { walk: data.speed || 30 },
  senses: data.senses || { passive_perception: 10 },
  resistances: data.resistances || { damage: [], conditions: [] },
  multiclass: Array.isArray(data.multiclass) ? data.multiclass : [],
});

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCharacters = async () => {
    if (!user) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar personajes');
      console.error(error);
    } else {
      setCharacters((data || []).map(parseCharacterFromDB) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCharacters();
  }, [user]);

  const createCharacter = async (character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('characters')
      .insert({ ...character, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear personaje');
      console.error(error);
      return null;
    }

    setCharacters(prev => [data as Character, ...prev]);
    toast.success('Personaje creado');
    return data as Character;
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    const { error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar personaje');
      console.error(error);
      return false;
    }

    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast.success('Personaje actualizado');
    return true;
  };

  const deleteCharacter = async (id: string) => {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar personaje');
      console.error(error);
      return false;
    }

    setCharacters(prev => prev.filter(c => c.id !== id));
    toast.success('Personaje eliminado');
    return true;
  };

  const cloneCharacter = async (character: ExtendedCharacter) => {
    const { id, user_id, created_at, updated_at, ...rest } = character;
    const cloned = await createCharacter({
      ...rest,
      name: `${character.name} (copia)`
    } as any);
    return cloned;
  };

  return { characters, loading, createCharacter, updateCharacter, deleteCharacter, cloneCharacter, refetch: fetchCharacters };
};
