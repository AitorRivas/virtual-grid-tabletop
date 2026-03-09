import { useState, useEffect, useCallback } from 'react';
import { TokenData } from '@/components/MapViewer';
import { CellState } from '@/lib/gridEngine/types';

const STORAGE_KEY = 'dnd-session';

export interface MapData {
  id: string;
  name: string;
  mapImage: string | null;
  tokens: TokenData[];
  showGrid: boolean;
  gridSize: number;
  gridColor: string;
  gridLineWidth: number;
  fogEnabled: boolean;
  fogData: string | null;
  gridCellSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  cellStates: Record<string, CellState>;
}

interface SessionData {
  maps: MapData[];
  activeMapId: string | null;
}

const createDefaultMap = (name = 'Mapa 1'): MapData => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  name,
  mapImage: null,
  tokens: [],
  showGrid: true,
  gridSize: 50,
  gridColor: '#000000',
  gridLineWidth: 1,
  fogEnabled: false,
  fogData: null,
  gridCellSize: 50,
  gridOffsetX: 0,
  gridOffsetY: 0,
  cellStates: {},
});

const defaultSession: SessionData = {
  maps: [],
  activeMapId: null,
};

// Migrate old single-map sessions to new multi-map format
function migrateSession(raw: any): SessionData {
  if (raw && Array.isArray(raw.maps)) {
    return raw as SessionData;
  }
  // Old format: flat session with mapImage, tokens, etc.
  if (raw && (raw.mapImage !== undefined || raw.tokens !== undefined)) {
    const migratedMap: MapData = {
      id: 'migrated-1',
      name: 'Mapa 1',
      mapImage: raw.mapImage ?? null,
      tokens: raw.tokens ?? [],
      showGrid: raw.showGrid ?? true,
      gridSize: raw.gridSize ?? 50,
      gridColor: raw.gridColor ?? '#000000',
      gridLineWidth: raw.gridLineWidth ?? 1,
      fogEnabled: raw.fogEnabled ?? false,
      fogData: raw.fogData ?? null,
      gridCellSize: raw.gridCellSize ?? 50,
      gridOffsetX: raw.gridOffsetX ?? 0,
      gridOffsetY: raw.gridOffsetY ?? 0,
      cellStates: raw.cellStates ?? {},
    };
    return {
      maps: [migratedMap],
      activeMapId: migratedMap.id,
    };
  }
  return defaultSession;
}

export const useSessionStorage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<SessionData>(defaultSession);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(migrateSession(parsed));
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever session changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session to localStorage:', error);
    }
  }, [session, isLoaded]);

  const activeMap = session.maps.find(m => m.id === session.activeMapId) ?? null;

  const setActiveMapId = useCallback((id: string) => {
    setSession(prev => ({ ...prev, activeMapId: id }));
  }, []);

  const addMap = useCallback((name?: string) => {
    const newMap = createDefaultMap(name || `Mapa ${session.maps.length + 1}`);
    setSession(prev => ({
      maps: [...prev.maps, newMap],
      activeMapId: newMap.id,
    }));
    return newMap.id;
  }, [session.maps.length]);

  const removeMap = useCallback((id: string) => {
    setSession(prev => {
      const remaining = prev.maps.filter(m => m.id !== id);
      const newActiveId = prev.activeMapId === id
        ? (remaining[0]?.id ?? null)
        : prev.activeMapId;
      return { maps: remaining, activeMapId: newActiveId };
    });
  }, []);

  const renameMap = useCallback((id: string, name: string) => {
    setSession(prev => ({
      ...prev,
      maps: prev.maps.map(m => m.id === id ? { ...m, name } : m),
    }));
  }, []);

  const updateActiveMap = useCallback((updates: Partial<MapData>) => {
    setSession(prev => ({
      ...prev,
      maps: prev.maps.map(m =>
        m.id === prev.activeMapId ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const clearSession = useCallback(() => {
    setSession(defaultSession);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    maps: session.maps,
    activeMapId: session.activeMapId,
    activeMap,
    isLoaded,
    setActiveMapId,
    addMap,
    removeMap,
    renameMap,
    updateActiveMap,
    clearSession,
  };
};
