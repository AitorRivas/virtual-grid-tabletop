import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Monster, CreatureSize, TokenColor } from '@/types/dnd';
import { toast } from 'sonner';

export const useMonsters = () => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
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
      setMonsters(data as Monster[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonsters();
  }, [user]);

  const createMonster = async (monster: Omit<Monster, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('monsters')
      .insert({ ...monster, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear monstruo');
      console.error(error);
      return null;
    }

    setMonsters(prev => [data as Monster, ...prev]);
    toast.success('Monstruo creado');
    return data as Monster;
  };

  const updateMonster = async (id: string, updates: Partial<Monster>) => {
    const { error } = await supabase
      .from('monsters')
      .update(updates)
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

  return { monsters, loading, createMonster, updateMonster, deleteMonster, refetch: fetchMonsters };
};
