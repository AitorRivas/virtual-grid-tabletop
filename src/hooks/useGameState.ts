/**
 * React hook that provides reactive access to the centralized GameState store.
 * Works in both GM and Player windows — changes sync automatically.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { gameStateStore, GameState, MapData, SceneData, NarrativeLightData } from '@/stores/gameState';

export type { MapData, SceneData, GameState, NarrativeLightData };

export const createDefaultMap = (name = 'Mapa 1'): MapData => ({
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

export const useGameState = () => {
  const state = useSyncExternalStore(
    (cb) => gameStateStore.subscribe(cb),
    () => gameStateStore.getState(),
  );

  const isLoaded = gameStateStore.isLoaded();
  const activeMap = state.maps.find(m => m.id === state.activeMapId) ?? null;

  const setActiveMapId = useCallback((id: string) => {
    gameStateStore.setState(prev => ({ ...prev, activeMapId: id }));
  }, []);

  const addMap = useCallback((name?: string) => {
    const newMap = createDefaultMap(name || `Mapa ${gameStateStore.getState().maps.length + 1}`);
    gameStateStore.setState(prev => ({
      ...prev,
      maps: [...prev.maps, newMap],
      activeMapId: newMap.id,
    }));
    return newMap.id;
  }, []);

  const removeMap = useCallback((id: string) => {
    gameStateStore.setState(prev => {
      const remaining = prev.maps.filter(m => m.id !== id);
      const newActiveId = prev.activeMapId === id
        ? (remaining[0]?.id ?? null)
        : prev.activeMapId;
      return { ...prev, maps: remaining, activeMapId: newActiveId };
    });
  }, []);

  const renameMap = useCallback((id: string, name: string) => {
    gameStateStore.setState(prev => ({
      ...prev,
      maps: prev.maps.map(m => m.id === id ? { ...m, name } : m),
    }));
  }, []);

  const updateActiveMap = useCallback((updates: Partial<MapData>) => {
    gameStateStore.setState(prev => ({
      ...prev,
      maps: prev.maps.map(m =>
        m.id === prev.activeMapId ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const addScene = useCallback((name: string) => {
    const currentState = gameStateStore.getState();
    const newScene = createDefaultScene(name, currentState.activeMapId);
    gameStateStore.setState(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));
    return newScene.id;
  }, []);

  const removeScene = useCallback((id: string) => {
    gameStateStore.setState(prev => ({
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== id),
      activeSceneId: prev.activeSceneId === id ? null : prev.activeSceneId,
    }));
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<SceneData>) => {
    gameStateStore.setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const setActiveSceneId = useCallback((id: string | null) => {
    gameStateStore.setState(prev => ({ ...prev, activeSceneId: id }));
  }, []);

  const setNarrativeOverlay = useCallback((overlay: GameState['narrativeOverlay']) => {
    gameStateStore.setState(prev => ({ ...prev, narrativeOverlay: overlay }));
  }, []);

  const setNarrativeLight = useCallback((light: Partial<NarrativeLightData>) => {
    gameStateStore.setState(prev => ({
      ...prev,
      narrativeLight: { ...prev.narrativeLight, ...light },
    }));
  }, []);

  const clearSession = useCallback(() => {
    gameStateStore.clear();
  }, []);

  return {
    maps: state.maps,
    activeMapId: state.activeMapId,
    activeMap,
    scenes: state.scenes,
    activeSceneId: state.activeSceneId,
    narrativeOverlay: state.narrativeOverlay,
    narrativeLight: state.narrativeLight,
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
    setNarrativeLight,
    clearSession,
  };
};
