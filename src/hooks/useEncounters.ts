import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Encounter {
  id: string;
  name: string;
  notes: string | null;
}

export interface EncounterEntity {
  id: string;
  encounter_id: string;
  entity_id: string;
  entity_type: 'character' | 'monster';
  quantity: number;
  position: number;
}

export const useEncounters = () => {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [entries, setEntries] = useState<EncounterEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setEncounters([]); setEntries([]); setLoading(false); return;
    }
    setLoading(true);
    const [{ data: enc, error: ee }, { data: ent, error: ete }] = await Promise.all([
      supabase.from('encounters').select('id, name, notes').order('created_at', { ascending: false }),
      supabase.from('encounter_entities').select('id, encounter_id, entity_id, entity_type, quantity, position').order('position'),
    ]);
    if (ee) { toast.error('Error al cargar encuentros'); console.error(ee); }
    else setEncounters((enc ?? []) as Encounter[]);
    if (ete) console.error(ete);
    else setEntries((ent ?? []) as EncounterEntity[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createEncounter = useCallback(async (name: string) => {
    if (!user || !name.trim()) return null;
    const { data, error } = await supabase
      .from('encounters')
      .insert({ name: name.trim(), user_id: user.id })
      .select('id, name, notes')
      .single();
    if (error) { toast.error('Error al crear encuentro'); console.error(error); return null; }
    setEncounters(prev => [data as Encounter, ...prev]);
    toast.success(`Encuentro "${data.name}" creado`);
    return data as Encounter;
  }, [user]);

  const renameEncounter = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from('encounters').update({ name: name.trim() }).eq('id', id);
    if (error) { toast.error('Error al renombrar'); return; }
    setEncounters(prev => prev.map(e => e.id === id ? { ...e, name: name.trim() } : e));
  }, []);

  const deleteEncounter = useCallback(async (id: string) => {
    const { error } = await supabase.from('encounters').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setEncounters(prev => prev.filter(e => e.id !== id));
    setEntries(prev => prev.filter(en => en.encounter_id !== id));
    toast.success('Encuentro eliminado');
  }, []);

  const addEntity = useCallback(async (
    encounterId: string,
    entityId: string,
    entityType: 'character' | 'monster',
    quantity = 1,
  ) => {
    if (!user) return;
    const existing = entries.find(e =>
      e.encounter_id === encounterId && e.entity_id === entityId && e.entity_type === entityType
    );
    if (existing) {
      const newQty = existing.quantity + quantity;
      const { error } = await supabase.from('encounter_entities').update({ quantity: newQty }).eq('id', existing.id);
      if (error) { toast.error('Error al actualizar'); return; }
      setEntries(prev => prev.map(e => e.id === existing.id ? { ...e, quantity: newQty } : e));
      return;
    }
    const position = entries.filter(e => e.encounter_id === encounterId).length;
    const { data, error } = await supabase
      .from('encounter_entities')
      .insert({
        encounter_id: encounterId,
        entity_id: entityId,
        entity_type: entityType,
        quantity,
        position,
        user_id: user.id,
      })
      .select('id, encounter_id, entity_id, entity_type, quantity, position')
      .single();
    if (error) { toast.error('Error al añadir entidad'); console.error(error); return; }
    setEntries(prev => [...prev, data as EncounterEntity]);
  }, [user, entries]);

  const updateQuantity = useCallback(async (entryId: string, quantity: number) => {
    if (quantity < 1) return;
    const { error } = await supabase.from('encounter_entities').update({ quantity }).eq('id', entryId);
    if (error) { toast.error('Error'); return; }
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, quantity } : e));
  }, []);

  const removeEntity = useCallback(async (entryId: string) => {
    const { error } = await supabase.from('encounter_entities').delete().eq('id', entryId);
    if (error) { toast.error('Error al eliminar'); return; }
    setEntries(prev => prev.filter(e => e.id !== entryId));
  }, []);

  const getEntries = useCallback((encounterId: string) =>
    entries.filter(e => e.encounter_id === encounterId), [entries]);

  return {
    encounters, entries, loading,
    createEncounter, renameEncounter, deleteEncounter,
    addEntity, updateQuantity, removeEntity,
    getEntries, refetch: fetchAll,
  };
};
