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

export interface SceneData {
  id: string;
  name: string;
  mapId: string | null;
  narrativeImage: string | null;
  narrativeText: string;
  musicTrackName: string | null;
  ambientTrackName: string | null;
}

interface SessionData {
  maps: MapData[];
  activeMapId: string | null;
  scenes: SceneData[];
  activeSceneId: string | null;
  narrativeOverlay: {
    image: string | null;
    text: string;
    visible: boolean;
  };
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

export const createDefaultScene = (name: string, mapId: string | null = null): SceneData => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  name,
  mapId,
  narrativeImage: null,
  narrativeText: '',
  musicTrackName: null,
  ambientTrackName: null,
});

const defaultSession: SessionData = {
  maps: [],
  activeMapId: null,
  scenes: [],
  activeSceneId: null,
  narrativeOverlay: { image: null, text: '', visible: false },
};

// Migrate old sessions
function migrateSession(raw: any): SessionData {
  if (raw && Array.isArray(raw.maps)) {
    // Ensure scenes array exists (migration from pre-scene version)
    return {
      maps: raw.maps,
      activeMapId: raw.activeMapId ?? null,
      scenes: raw.scenes ?? [],
      activeSceneId: raw.activeSceneId ?? null,
      narrativeOverlay: raw.narrativeOverlay ?? { image: null, text: '', visible: false },
    };
  }
  // Old format: flat session
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
      scenes: [],
      activeSceneId: null,
      narrativeOverlay: { image: null, text: '', visible: false },
    };
  }
  return defaultSession;
}

export const useSessionStorage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<SessionData>(defaultSession);

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
      ...prev,
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
      return { ...prev, maps: remaining, activeMapId: newActiveId };
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

  // Scene management
  const addScene = useCallback((name: string) => {
    const newScene = createDefaultScene(name, session.activeMapId);
    setSession(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));
    return newScene.id;
  }, [session.activeMapId]);

  const removeScene = useCallback((id: string) => {
    setSession(prev => ({
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== id),
      activeSceneId: prev.activeSceneId === id ? null : prev.activeSceneId,
    }));
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<SceneData>) => {
    setSession(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const setActiveSceneId = useCallback((id: string | null) => {
    setSession(prev => ({ ...prev, activeSceneId: id }));
  }, []);

  // Narrative overlay
  const setNarrativeOverlay = useCallback((overlay: SessionData['narrativeOverlay']) => {
    setSession(prev => ({ ...prev, narrativeOverlay: overlay }));
  }, []);

  const clearSession = useCallback(() => {
    setSession(defaultSession);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    maps: session.maps,
    activeMapId: session.activeMapId,
    activeMap,
    scenes: session.scenes,
    activeSceneId: session.activeSceneId,
    narrativeOverlay: session.narrativeOverlay,
    isLoaded,
    setActiveMapId,
    addMap,
    removeMap,
    renameMap,
    updateActiveMap,
    addScene,
    removeScene,
    updateScene,
    setActiveSceneId,
    setNarrativeOverlay,
    clearSession,
  };
};
