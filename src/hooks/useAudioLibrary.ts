import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LibraryAudio {
  id: string;
  name: string;
  channel: 'music' | 'ambient';
  audio_data: string;
  created_at: string;
}

export const useAudioLibrary = () => {
  const [items, setItems] = useState<LibraryAudio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audio_library')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Error al cargar biblioteca de audio');
    } else {
      setItems((data as LibraryAudio[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addToLibrary = useCallback(
    async (name: string, channel: 'music' | 'ambient', audioData: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Debes iniciar sesión');
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
      toast.error('Error al eliminar');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, addToLibrary, removeFromLibrary, refetch: fetchItems };
};
