/**
 * Centralized GameState store shared across windows via localStorage + storage events.
 * Both GM and Player views subscribe to the same reactive state.
 */

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

export interface NarrativeLightData {
  enabled: boolean;
  x: number;
  y: number;
  radius: number;
  followTokenId: string | null;
}

export interface GameState {
  maps: MapData[];
  activeMapId: string | null;
  scenes: SceneData[];
  activeSceneId: string | null;
  narrativeOverlay: {
    image: string | null;
    text: string;
    visible: boolean;
  };
  narrativeLight: NarrativeLightData;
}

const defaultState: GameState = {
  maps: [],
  activeMapId: null,
  scenes: [],
  activeSceneId: null,
  narrativeOverlay: { image: null, text: '', visible: false },
};

// Migrate old session formats
function migrateState(raw: any): GameState {
  if (raw && Array.isArray(raw.maps)) {
    return {
      maps: raw.maps,
      activeMapId: raw.activeMapId ?? null,
      scenes: raw.scenes ?? [],
      activeSceneId: raw.activeSceneId ?? null,
      narrativeOverlay: raw.narrativeOverlay ?? { image: null, text: '', visible: false },
    };
  }
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
  return defaultState;
}

type Listener = () => void;

/** Singleton reactive store with cross-window sync */
class GameStateStore {
  private state: GameState;
  private listeners = new Set<Listener>();
  private loaded = false;

  constructor() {
    this.state = defaultState;
    this.load();

    // Cross-window sync: other tabs/windows writing to localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.state = migrateState(JSON.parse(e.newValue));
          this.notify();
        } catch {}
      } else if (e.key === STORAGE_KEY && !e.newValue) {
        this.state = defaultState;
        this.notify();
      }
    });
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = migrateState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
    this.loaded = true;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  getState(): GameState {
    return this.state;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Update state, persist, and notify all listeners in this window */
  setState(updater: GameState | ((prev: GameState) => GameState)) {
    const newState = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = newState;
    this.persist();
    this.notify();
  }

  clear() {
    this.state = defaultState;
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }
}

// Singleton instance
export const gameStateStore = new GameStateStore();
