import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AudioChannelKey = 'music' | 'ambient';

export interface LibraryAudio {
  id: string;
  name: string;
  channel: AudioChannelKey;
  audio_data: string;
  created_at: string;
}

/**
 * Library of persisted audio tracks (music + ambient).
 * Loads once per session; consumers filter by channel via `musicItems` / `ambientItems`.
 */
export const useAudioLibrary = () => {
  const [items, setItems] = useState<LibraryAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      // Guest mode: no library, but don't surface an error.
      setItems([]);
      setLoading(false);
      setHasLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from('audio_library')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('audio_library fetch error', error);
      toast.error('Error al cargar biblioteca de audio');
      setItems([]);
    } else {
      setItems((data as LibraryAudio[]) || []);
    }
    setLoading(false);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    // Only fetch once per mount; consumers can call refetch() manually if needed.
    if (!hasLoaded) {
      fetchItems();
    }
  }, [fetchItems, hasLoaded]);

  const addToLibrary = useCallback(
    async (name: string, channel: AudioChannelKey, audioData: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Debes iniciar sesión para guardar pistas');
        return null;
      }
      const { data, error } = await supabase
        .from('audio_library')
        .insert({
          user_id: userData.user.id,
          name,
          channel,
          audio_data: audioData,
        })
        .select()
        .single();
      if (error) {
        console.error('audio_library insert error', error);
        toast.error('Error al guardar en biblioteca');
        return null;
      }
      setItems((prev) => [data as LibraryAudio, ...prev]);
      return data as LibraryAudio;
    },
    []
  );

  const removeFromLibrary = useCallback(async (id: string) => {
    const { error } = await supabase.from('audio_library').delete().eq('id', id);
    if (error) {
      console.error('audio_library delete error', error);
      toast.error('Error al eliminar');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const musicItems = useMemo(() => items.filter((i) => i.channel === 'music'), [items]);
  const ambientItems = useMemo(() => items.filter((i) => i.channel === 'ambient'), [items]);

  return {
    items,
    musicItems,
    ambientItems,
    loading,
    addToLibrary,
    removeFromLibrary,
    refetch: fetchItems,
  };
};
