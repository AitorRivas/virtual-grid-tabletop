/**
 * React hook that provides reactive access to the centralized GameState store.
 * Works in both GM and Player windows — changes sync automatically.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { gameStateStore, GameState, MapData, SceneData, NarrativeLightData, PlayerViewConfig, DmCameraState, MapCombatState, CombatEntryStored, PlayerCameraSnapshot } from '@/stores/gameState';

export type { MapData, SceneData, GameState, NarrativeLightData, PlayerViewConfig, DmCameraState, MapCombatState, CombatEntryStored, PlayerCameraSnapshot };

type MapUpdate =
  | Partial<MapData>
  | ((currentMap: MapData | null, fullState: GameState) => Partial<MapData> | null);

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
  musicTrackData: null,
  ambientTrackData: null,
});

export const useGameState = () => {
  const state = useSyncExternalStore(
    (cb) => gameStateStore.subscribe(cb),
    () => gameStateStore.getState(),
  );

  const isLoaded = gameStateStore.isLoaded();
  const activeMap = state.maps.find((m) => m.id === state.activeMapId) ?? null;

  const setActiveMapId = useCallback((id: string) => {
    gameStateStore.setState((prev) => ({ ...prev, activeMapId: id }));
  }, []);

  const addMap = useCallback((name?: string) => {
    const newMap = createDefaultMap(name || `Mapa ${gameStateStore.getState().maps.length + 1}`);
    gameStateStore.setState((prev) => ({
      ...prev,
      maps: [...prev.maps, newMap],
      activeMapId: newMap.id,
    }));
    return newMap.id;
  }, []);

  const removeMap = useCallback((id: string) => {
    gameStateStore.setState((prev) => {
      const remaining = prev.maps.filter((m) => m.id !== id);
      const newActiveId = prev.activeMapId === id
        ? (remaining[0]?.id ?? null)
        : prev.activeMapId;
      return { ...prev, maps: remaining, activeMapId: newActiveId };
    });
  }, []);

  const renameMap = useCallback((id: string, name: string) => {
    gameStateStore.setState((prev) => ({
      ...prev,
      maps: prev.maps.map((m) => (m.id === id ? { ...m, name } : m)),
    }));
  }, []);

  const updateActiveMap = useCallback((updates: MapUpdate) => {
    gameStateStore.setState((prev) => {
      if (!prev.activeMapId) return prev;

      const currentMap = prev.maps.find((m) => m.id === prev.activeMapId) ?? null;
      const resolvedUpdates = typeof updates === 'function'
        ? updates(currentMap, prev)
        : updates;

      if (!currentMap || !resolvedUpdates) return prev;

      return {
        ...prev,
        maps: prev.maps.map((m) => (
          m.id === prev.activeMapId ? { ...m, ...resolvedUpdates } : m
        )),
      };
    });
  }, []);

  const addScene = useCallback((name: string) => {
    const currentState = gameStateStore.getState();
    const newScene = createDefaultScene(name, currentState.activeMapId);
    gameStateStore.setState((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));
    return newScene.id;
  }, []);

  const removeScene = useCallback((id: string) => {
    gameStateStore.setState((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((s) => s.id !== id),
      activeSceneId: prev.activeSceneId === id ? null : prev.activeSceneId,
    }));
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<SceneData>) => {
    gameStateStore.setState((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const setActiveSceneId = useCallback((id: string | null) => {
    gameStateStore.setState((prev) => ({ ...prev, activeSceneId: id }));
  }, []);

  const setNarrativeOverlay = useCallback((overlay: GameState['narrativeOverlay']) => {
    gameStateStore.setState((prev) => ({ ...prev, narrativeOverlay: overlay }));
  }, []);

  const setNarrativeLight = useCallback((light: Partial<NarrativeLightData>) => {
    gameStateStore.setState((prev) => ({
      ...prev,
      narrativeLight: { ...prev.narrativeLight, ...light },
    }));
  }, []);

  const setActiveInitiativeTokenId = useCallback((tokenId: string | null) => {
    gameStateStore.setState((prev) => (
      prev.activeInitiativeTokenId === tokenId ? prev : { ...prev, activeInitiativeTokenId: tokenId }
    ));
  }, []);

  const setPlayerViewConfig = useCallback((updates: Partial<PlayerViewConfig>) => {
    gameStateStore.setState((prev) => ({
      ...prev,
      playerViewConfig: { ...prev.playerViewConfig, ...updates },
    }));
  }, []);

  const setDmCamera = useCallback((camera: Omit<DmCameraState, 'tick'>) => {
    gameStateStore.setState((prev) => {
      const cur = prev.dmCamera;
      if (
        cur.mapId === camera.mapId &&
        Math.abs(cur.positionX - camera.positionX) < 0.5 &&
        Math.abs(cur.positionY - camera.positionY) < 0.5 &&
        Math.abs(cur.scale - camera.scale) < 0.001
      ) {
        return prev;
      }
      return { ...prev, dmCamera: { ...camera, tick: cur.tick + 1 } };
    });
  }, []);

  const setDmSelectedTokenId = useCallback((tokenId: string | null) => {
    gameStateStore.setState((prev) => (
      prev.dmSelectedTokenId === tokenId ? prev : { ...prev, dmSelectedTokenId: tokenId }
    ));
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
    activeInitiativeTokenId: state.activeInitiativeTokenId,
    playerViewConfig: state.playerViewConfig,
    dmCamera: state.dmCamera,
    dmSelectedTokenId: state.dmSelectedTokenId,
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
    setActiveInitiativeTokenId,
    setPlayerViewConfig,
    setDmCamera,
    setDmSelectedTokenId,
    clearSession,
  };
};