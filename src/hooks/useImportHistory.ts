import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ImportError } from '@/lib/bestiaryImport';

export interface ImportHistoryEntry {
  id: string;
  source: string;
  file_name: string | null;
  total: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors: ImportError[];
  created_at: string;
}

export const useImportHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory(((data as any[]) || []).map(row => ({ ...row, errors: (row.errors as ImportError[]) || [] })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const logImport = useCallback(
    async (entry: Omit<ImportHistoryEntry, 'id' | 'created_at'>) => {
      if (!user) return;
      await supabase.from('import_history').insert({
        user_id: user.id,
        source: entry.source,
        file_name: entry.file_name,
        total: entry.total,
        created_count: entry.created_count,
        updated_count: entry.updated_count,
        skipped_count: entry.skipped_count,
        error_count: entry.error_count,
        errors: entry.errors as any,
      } as any);
      await fetchHistory();
    },
    [user, fetchHistory],
  );

  return { history, loading, logImport, refreshHistory: fetchHistory };
};
