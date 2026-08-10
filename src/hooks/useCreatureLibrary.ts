import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ExtendedMonster } from '@/types/dnd5e';
import { toast } from 'sonner';

/**
 * Fila ligera del catálogo: SOLO los campos necesarios para pintar tarjetas y
 * filtrar. Nunca incluye la ilustración principal ni los bloques JSONB pesados
 * (rasgos, acciones, conjuros...), que se cargan bajo demanda al abrir la ficha.
 */
export interface CreatureListItem {
  id: string;
  user_id: string;
  name: string;
  type: string;
  subtype: string | null;
  size: string;
  challenge_rating: string;
  source: string | null;
  is_public: boolean;
  token_color: string;
  token_size: number;
  token_image_url: string | null;
  armor_class: number;
  hit_points: number;
  speed: number;
  dexterity: number;
  initiative_bonus: number;
  created_at: string;
  has_image: boolean;
  has_token: boolean;
  has_spellcasting: boolean;
  has_reactions: boolean;
  has_legendary: boolean;
  has_mythic: boolean;
  has_lair: boolean;
}

export interface CreatureStats {
  monster_id: string;
  favorite: boolean;
  usage_count: number;
  last_used_at: string | null;
}

const LIBRARY_STALE_TIME_MS = 60_000;

/** Convierte un CR textual ("1/8", "17") en número ordenable. */
export const crToNumber = (cr: string): number => {
  if (!cr) return 0;
  if (cr.includes('/')) {
    const [a, b] = cr.split('/').map(Number);
    return b ? a / b : 0;
  }
  const n = parseFloat(cr);
  return Number.isNaN(n) ? 0 : n;
};

/** Normaliza texto para búsquedas insensibles a acentos y mayúsculas. */
export const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const useCreatureLibrary = () => {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();

  const listKey = ['creature-library', user?.id ?? (isGuest ? 'guest' : 'anon')] as const;
  const statsKey = ['creature-stats', user?.id ?? 'anon'] as const;

  const { data: creatures = [], isLoading: loading, refetch } = useQuery({
    queryKey: listKey,
    queryFn: async (): Promise<CreatureListItem[]> => {
      const { data, error } = await supabase
        .from('monsters_library' as any)
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CreatureListItem[];
    },
    enabled: !!user || isGuest,
    staleTime: LIBRARY_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: statsRows = [] } = useQuery({
    queryKey: statsKey,
    queryFn: async (): Promise<CreatureStats[]> => {
      const { data, error } = await supabase
        .from('user_creature_stats' as any)
        .select('monster_id, favorite, usage_count, last_used_at');
      if (error) throw error;
      return (data || []) as unknown as CreatureStats[];
    },
    enabled: !!user,
    staleTime: LIBRARY_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const statsById = useMemo(() => {
    const map = new Map<string, CreatureStats>();
    statsRows.forEach(s => map.set(s.monster_id, s));
    return map;
  }, [statsRows]);

  const upsertStats = useCallback(
    async (monsterId: string, patch: Partial<CreatureStats>) => {
      if (!user) return;
      const current = statsById.get(monsterId);
      const next: CreatureStats = {
        monster_id: monsterId,
        favorite: patch.favorite ?? current?.favorite ?? false,
        usage_count: patch.usage_count ?? current?.usage_count ?? 0,
        last_used_at: patch.last_used_at ?? current?.last_used_at ?? null,
      };

      queryClient.setQueryData<CreatureStats[]>(statsKey, (prev = []) => {
        const others = prev.filter(s => s.monster_id !== monsterId);
        return [...others, next];
      });

      const { error } = await supabase
        .from('user_creature_stats' as any)
        .upsert(
          {
            user_id: user.id,
            monster_id: monsterId,
            favorite: next.favorite,
            usage_count: next.usage_count,
            last_used_at: next.last_used_at,
          } as any,
          { onConflict: 'user_id,monster_id' },
        );
      if (error) console.error('No se pudieron guardar las preferencias de criatura', error);
    },
    [user, statsById, queryClient, statsKey],
  );

  const toggleFavorite = useCallback(
    (monsterId: string) => {
      if (!user) {
        toast.error('Inicia sesión para usar favoritos');
        return;
      }
      const current = statsById.get(monsterId);
      upsertStats(monsterId, { favorite: !current?.favorite });
    },
    [user, statsById, upsertStats],
  );

  /** Suma 1 al contador de uso (no afecta a la creación del token en sí). */
  const registerUsage = useCallback(
    (monsterId: string) => {
      if (!user) return;
      const current = statsById.get(monsterId);
      upsertStats(monsterId, {
        usage_count: (current?.usage_count ?? 0) + 1,
        last_used_at: new Date().toISOString(),
      });
    },
    [user, statsById, upsertStats],
  );

  /** Descarga la ficha completa de UNA criatura (incluye ilustración y JSONB). */
  const fetchFullCreature = useCallback(async (id: string): Promise<ExtendedMonster | null> => {
    const { data, error } = await supabase.from('monsters').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      toast.error('No se pudo cargar la ficha');
      return null;
    }
    return data as unknown as ExtendedMonster;
  }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    creatures.forEach(c => { if (c.source) set.add(c.source); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [creatures]);

  return {
    creatures,
    loading,
    statsById,
    sources,
    toggleFavorite,
    registerUsage,
    fetchFullCreature,
    refetch,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  };
};
