import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface LibraryGroup {
  id: string;
  name: string;
  color: string;
}

export interface EntityGroupLink {
  id: string;
  group_id: string;
  entity_id: string;
  entity_type: 'character' | 'monster';
}

export const useLibraryGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<LibraryGroup[]>([]);
  const [links, setLinks] = useState<EntityGroupLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLinks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: g, error: ge }, { data: l, error: le }] = await Promise.all([
      supabase.from('library_groups').select('id, name, color').order('name'),
      supabase.from('entity_groups').select('id, group_id, entity_id, entity_type'),
    ]);
    if (ge) {
      console.error('library_groups fetch:', ge);
      toast.error('Error al cargar grupos');
    } else {
      setGroups((g ?? []) as LibraryGroup[]);
    }
    if (le) {
      console.error('entity_groups fetch:', le);
    } else {
      setLinks((l ?? []) as EntityGroupLink[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createGroup = useCallback(async (name: string, color = '#6366f1') => {
    if (!user || !name.trim()) return null;
    const { data, error } = await supabase
      .from('library_groups')
      .insert({ name: name.trim(), color, user_id: user.id })
      .select('id, name, color')
      .single();
    if (error) {
      toast.error('Error al crear grupo');
      console.error(error);
      return null;
    }
    setGroups(prev => [...prev, data as LibraryGroup].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`Grupo "${data.name}" creado`);
    return data as LibraryGroup;
  }, [user]);

  const renameGroup = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from('library_groups').update({ name: name.trim() }).eq('id', id);
    if (error) { toast.error('Error al renombrar'); return; }
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: name.trim() } : g)
      .sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    const { error } = await supabase.from('library_groups').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar grupo'); return; }
    setGroups(prev => prev.filter(g => g.id !== id));
    setLinks(prev => prev.filter(l => l.group_id !== id));
    toast.success('Grupo eliminado');
  }, []);

  const setEntityGroups = useCallback(async (
    entityId: string,
    entityType: 'character' | 'monster',
    groupIds: string[],
  ) => {
    if (!user) return;
    const current = links.filter(l => l.entity_id === entityId && l.entity_type === entityType);
    const currentIds = new Set(current.map(l => l.group_id));
    const nextIds = new Set(groupIds);

    const toAdd = [...nextIds].filter(id => !currentIds.has(id));
    const toRemoveLinks = current.filter(l => !nextIds.has(l.group_id));

    if (toRemoveLinks.length) {
      const { error } = await supabase
        .from('entity_groups')
        .delete()
        .in('id', toRemoveLinks.map(l => l.id));
      if (error) { toast.error('Error al actualizar grupos'); console.error(error); return; }
    }

    let inserted: EntityGroupLink[] = [];
    if (toAdd.length) {
      const { data, error } = await supabase
        .from('entity_groups')
        .insert(toAdd.map(group_id => ({
          group_id,
          entity_id: entityId,
          entity_type: entityType,
          user_id: user.id,
        })))
        .select('id, group_id, entity_id, entity_type');
      if (error) { toast.error('Error al asignar grupos'); console.error(error); return; }
      inserted = (data ?? []) as EntityGroupLink[];
    }

    setLinks(prev => [
      ...prev.filter(l => !(l.entity_id === entityId && l.entity_type === entityType && !nextIds.has(l.group_id))),
      ...inserted,
    ]);
  }, [user, links]);

  const getGroupsForEntity = useCallback((entityId: string, entityType: 'character' | 'monster') => {
    return links.filter(l => l.entity_id === entityId && l.entity_type === entityType).map(l => l.group_id);
  }, [links]);

  return {
    groups,
    links,
    loading,
    createGroup,
    renameGroup,
    deleteGroup,
    setEntityGroups,
    getGroupsForEntity,
    refetch: fetchAll,
  };
};
