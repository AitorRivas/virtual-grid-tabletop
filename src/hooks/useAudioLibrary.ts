import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AudioChannelKey = 'music' | 'ambient';

/**
 * Lightweight metadata-only entry — `audio_data` is loaded on demand
 * to avoid pulling multi-MB base64 blobs for every track on mount
 * (which was causing the "biblioteca de audio" load errors).
 */
export interface LibraryAudioMeta {
  id: string;
  name: string;
  channel: AudioChannelKey;
  created_at: string;
}

/** Full record (only retrieved when the user actually plays the track). */
export interface LibraryAudio extends LibraryAudioMeta {
  audio_data: string;
}

const ALLOWED_MIME = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/webm'];

export const isSupportedAudioFile = (file: File) => {
  if (file.type && ALLOWED_MIME.includes(file.type)) return true;
  // Fallback to extension sniffing (some browsers report empty type).
  return /\.(mp3|ogg|wav|webm)$/i.test(file.name);
};

export const useAudioLibrary = () => {
  const [items, setItems] = useState<LibraryAudioMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setItems([]);
      setLoading(false);
      setHasLoaded(true);
      return;
    }
    // Only metadata — we do NOT load audio_data here.
    const { data, error } = await supabase
      .from('audio_library')
      .select('id, name, channel, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('audio_library fetch error', error);
      toast.error('Error al cargar biblioteca de audio');
      setItems([]);
    } else {
      setItems((data as LibraryAudioMeta[]) || []);
    }
    setLoading(false);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) fetchItems();
  }, [fetchItems, hasLoaded]);

  /** Lazy-load the actual audio data (base64 data URI) for a single track. */
  const loadAudioData = useCallback(async (id: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('audio_library')
      .select('audio_data')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) {
      console.error('audio_library loadAudioData error', { id, error });
      toast.error('No se pudo cargar la pista');
      return null;
    }
    return (data as { audio_data: string }).audio_data;
  }, []);

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
        .select('id, name, channel, created_at')
        .single();
      if (error) {
        console.error('audio_library insert error', error);
        toast.error('Error al guardar en biblioteca');
        return null;
      }
      const meta = data as LibraryAudioMeta;
      setItems((prev) => [meta, ...prev]);
      return meta;
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
    loadAudioData,
    refetch: fetchItems,
  };
};
