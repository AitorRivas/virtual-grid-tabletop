/**
 * Centralized GameState store shared across windows via BroadcastChannel + localStorage.
 * Both GM and Player views subscribe to the same reactive state.
 */

import type { TokenData } from '@/components/MapViewer';
import type { CellState } from '@/lib/gridEngine/types';

const STORAGE_KEY = 'dnd-session';
const BROADCAST_CHANNEL = 'vtt-gamestate-sync';

export interface CombatEntryStored {
  id: string;
  tokenId?: string;
  /** Map this combatant belongs to. Required in the global model so we know where each token lives. */
  mapId?: string | null;
  name: string;
  initiative: number;
  faction: 'pj' | 'enemy' | 'npc';
}

/** @deprecated Legacy per-map combat state. Migrated to GlobalCombatState. Kept only for type compatibility while reading old payloads. */
export interface MapCombatState {
  entries: CombatEntryStored[];
  activeIndex: number;
  isActive: boolean;
  round: number;
}

/** Single global combat shared across all maps in a session. */
export interface GlobalCombatState {
  entries: CombatEntryStored[];
  activeIndex: number;
  isActive: boolean;
  round: number;
}

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
  /** Per-map combat state (initiative tracker scoped to this map only). */
  combat?: MapCombatState;
}

export interface SceneData {
  id: string;
  name: string;
  mapId: string | null;
  narrativeImage: string | null;
  narrativeText: string;
  musicTrackName: string | null;
  ambientTrackName: string | null;
  musicTrackData: string | null;   // base64 audio data for music
  ambientTrackData: string | null; // base64 audio data for ambient
}

export interface NarrativeLightData {
  enabled: boolean;
  x: number;
  y: number;
  radius: number;
  followTokenId: string | null;
}

export interface PlayerViewConfig {
  syncCamera: boolean;
  syncZoom: boolean;
  syncSelection: boolean;
  /** When false (default), HP bars of enemies/NPCs are hidden in Player View. PJ bars always visible. */
  showEnemyHpBars: boolean;
  /** When true, HP bars of undead-type creatures are hidden (overrides showEnemyHpBars for that subset). */
  hideUndeadHpBars: boolean;
  /** When true, the global timer is also rendered in Player View. */
  showTimer: boolean;
}

/** Global decision timer shown in the top bar. Synced across windows. */
export interface TimerState {
  /** True while counting down. */
  active: boolean;
  /** Configured total duration in ms (used by Reset and presets). */
  durationMs: number;
  /** Epoch ms when the current run will hit zero. Only meaningful while active. */
  endsAt: number | null;
  /** Cached remaining ms when paused (so Resume continues from here). */
  remainingMs: number;
}

export interface DmCameraState {
  /** Position from react-zoom-pan-pinch (positionX in screen px applied to content) */
  positionX: number;
  positionY: number;
  scale: number;
  /** Map this camera state belongs to (avoids cross-map application) */
  mapId: string | null;
  /** Monotonic counter so PlayerView can react to repeated identical values (e.g. re-center). */
  tick: number;
}

export interface PlayerCameraSnapshot {
  positionX: number;
  positionY: number;
  scale: number;
}

export interface GameState {
  revision: number;
  updatedAt: number;
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
  /** ID of the token currently taking its turn in combat (null if no combat active). Synced to Player View. */
  activeInitiativeTokenId: string | null;
  /** Phase 2: Configurable sync flags between DM and Player View */
  playerViewConfig: PlayerViewConfig;
  /** DM camera snapshot, broadcast for syncCamera/syncZoom */
  dmCamera: DmCameraState;
  /** Token selected by DM, broadcast for syncSelection (centers Player View on it) */
  dmSelectedTokenId: string | null;
  /** Per-map saved Player View camera (position + zoom) so switching maps restores the previous viewport. */
  playerCameras: Record<string, PlayerCameraSnapshot>;
  /** Per-map saved DM camera so switching maps restores the previous DM viewport (mirrors playerCameras). */
  dmCameras: Record<string, PlayerCameraSnapshot>;
  /** Single global combat state. Independent of activeMapId — combatants reference their own map via entry.mapId. */
  globalCombat: GlobalCombatState;
}

const defaultGlobalCombat: GlobalCombatState = {
  entries: [],
  activeIndex: 0,
  isActive: false,
  round: 1,
};

const defaultNarrativeLight: NarrativeLightData = {
  enabled: false,
  x: 500,
  y: 500,
  radius: 200,
  followTokenId: null,
};

const defaultPlayerViewConfig: PlayerViewConfig = {
  syncCamera: false,
  syncZoom: false,
  syncSelection: false,
  showEnemyHpBars: false,
  hideUndeadHpBars: false,
};

const defaultDmCamera: DmCameraState = {
  positionX: 0,
  positionY: 0,
  scale: 1,
  mapId: null,
  tick: 0,
};

const defaultState: GameState = {
  revision: 0,
  updatedAt: 0,
  maps: [],
  activeMapId: null,
  scenes: [],
  activeSceneId: null,
  narrativeOverlay: { image: null, text: '', visible: false },
  narrativeLight: defaultNarrativeLight,
  activeInitiativeTokenId: null,
  playerViewConfig: defaultPlayerViewConfig,
  dmCamera: defaultDmCamera,
  dmSelectedTokenId: null,
  playerCameras: {},
  dmCameras: {},
  globalCombat: { ...defaultGlobalCombat },
};

/**
 * Build a single global combat from per-map combats (legacy migration).
 * Strategy: merge ALL entries across maps, attach the source mapId to each entry,
 * sort by initiative desc, and keep `isActive` if any source combat was active.
 * The current activeIndex resets to 0 because per-map indices are no longer comparable.
 */
function buildGlobalCombatFromMaps(maps: any[]): GlobalCombatState {
  if (!Array.isArray(maps) || maps.length === 0) return { ...defaultGlobalCombat };
  const merged: CombatEntryStored[] = [];
  let anyActive = false;
  let maxRound = 1;
  for (const m of maps) {
    const c = m?.combat;
    if (!c || !Array.isArray(c.entries)) continue;
    if (c.isActive) anyActive = true;
    if (typeof c.round === 'number' && c.round > maxRound) maxRound = c.round;
    for (const e of c.entries) {
      if (!e) continue;
      // Avoid token duplicates across maps (same tokenId in two maps is unlikely, but guard).
      if (e.tokenId && merged.some((x) => x.tokenId === e.tokenId)) continue;
      merged.push({
        id: e.id ?? `combat-${m.id}-${Math.random().toString(36).slice(2, 8)}`,
        tokenId: e.tokenId,
        mapId: e.mapId ?? m.id ?? null,
        name: e.name ?? 'Combatiente',
        initiative: typeof e.initiative === 'number' ? e.initiative : 0,
        faction: (e.faction as any) ?? 'npc',
      });
    }
  }
  merged.sort((a, b) => b.initiative - a.initiative);
  return {
    entries: merged,
    activeIndex: 0,
    isActive: anyActive && merged.length > 0,
    round: maxRound,
  };
}

// Migrate old session formats
function migrateState(raw: any): GameState {
  if (raw && Array.isArray(raw.maps)) {
    // Strip legacy per-map combat (keeps storage clean) and lift it to a single global combat.
    const cleanedMaps = raw.maps.map((m: any) => {
      if (m && 'combat' in m) {
        const { combat, ...rest } = m;
        return rest;
      }
      return m;
    });
    const globalCombat: GlobalCombatState = raw.globalCombat
      ? {
          entries: Array.isArray(raw.globalCombat.entries) ? raw.globalCombat.entries : [],
          activeIndex: Number(raw.globalCombat.activeIndex ?? 0),
          isActive: !!raw.globalCombat.isActive,
          round: Number(raw.globalCombat.round ?? 1),
        }
      : buildGlobalCombatFromMaps(raw.maps);

    return {
      revision: Number(raw.revision ?? 0),
      updatedAt: Number(raw.updatedAt ?? 0),
      maps: cleanedMaps,
      activeMapId: raw.activeMapId ?? null,
      scenes: raw.scenes ?? [],
      activeSceneId: raw.activeSceneId ?? null,
      narrativeOverlay: raw.narrativeOverlay ?? { image: null, text: '', visible: false },
      narrativeLight: raw.narrativeLight ?? defaultNarrativeLight,
      activeInitiativeTokenId: raw.activeInitiativeTokenId ?? null,
      playerViewConfig: { ...defaultPlayerViewConfig, ...(raw.playerViewConfig ?? {}) },
      dmCamera: raw.dmCamera ?? defaultDmCamera,
      dmSelectedTokenId: raw.dmSelectedTokenId ?? null,
      playerCameras: raw.playerCameras ?? {},
      dmCameras: raw.dmCameras ?? {},
      globalCombat,
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
      revision: 0,
      updatedAt: 0,
      maps: [migratedMap],
      activeMapId: migratedMap.id,
      scenes: [],
      activeSceneId: null,
      narrativeOverlay: { image: null, text: '', visible: false },
      narrativeLight: defaultNarrativeLight,
      activeInitiativeTokenId: null,
      playerViewConfig: defaultPlayerViewConfig,
      dmCamera: defaultDmCamera,
      dmSelectedTokenId: null,
      playerCameras: {},
      dmCameras: {},
      globalCombat: { ...defaultGlobalCombat },
    };
  }

  return defaultState;
}

type Listener = () => void;

type SyncMessage =
  | {
      type: 'REQUEST_STATE';
      sourceId: string;
      revision: number;
      updatedAt: number;
    }
  | {
      type: 'STATE_UPDATE';
      sourceId: string;
      state: GameState;
    };

/** Singleton reactive store with cross-window sync via BroadcastChannel + localStorage */
class GameStateStore {
  private state: GameState;
  private listeners = new Set<Listener>();
  private loaded = false;
  private channel: BroadcastChannel | null = null;
  private instanceId: string;

  constructor() {
    this.state = defaultState;
    this.instanceId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    this.load();
    this.attachBroadcastChannel();

    window.addEventListener('storage', this.handleStorageEvent);
    this.requestLatestState();
  }

  private attachBroadcastChannel() {
    if (typeof BroadcastChannel === 'undefined') return;

    this.channel = new BroadcastChannel(BROADCAST_CHANNEL);
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;
      if (!message || message.sourceId === this.instanceId) return;

      if (message.type === 'REQUEST_STATE') {
        if (this.isStateNewerThan(message.revision, message.updatedAt)) {
          this.channel?.postMessage({
            type: 'STATE_UPDATE',
            sourceId: this.instanceId,
            state: this.state,
          } satisfies SyncMessage);
        }
        return;
      }

      if (message.type === 'STATE_UPDATE') {
        this.applyIncomingState(migrateState(message.state));
      }
    };
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;

    if (e.newValue) {
      try {
        this.applyIncomingState(migrateState(JSON.parse(e.newValue)));
      } catch {
        // Ignore invalid cross-window payloads.
      }
      return;
    }

    this.state = {
      ...defaultState,
      revision: this.state.revision + 1,
      updatedAt: Date.now(),
    };
    this.notify();
  };

  private requestLatestState() {
    this.channel?.postMessage({
      type: 'REQUEST_STATE',
      sourceId: this.instanceId,
      revision: this.state.revision,
      updatedAt: this.state.updatedAt,
    } satisfies SyncMessage);
  }

  private isStateNewerThan(revision: number, updatedAt: number) {
    if (this.state.revision !== revision) {
      return this.state.revision > revision;
    }

    return this.state.updatedAt > updatedAt;
  }

  private shouldApplyIncomingState(incoming: GameState) {
    if (incoming.revision !== this.state.revision) {
      return incoming.revision > this.state.revision;
    }

    return incoming.updatedAt > this.state.updatedAt;
  }

  private applyIncomingState(incoming: GameState) {
    if (!this.shouldApplyIncomingState(incoming)) return;

    this.state = incoming;
    this.notify();
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

  private broadcastState() {
    try {
      this.channel?.postMessage({
        type: 'STATE_UPDATE',
        sourceId: this.instanceId,
        state: this.state,
      } satisfies SyncMessage);
    } catch {
      // localStorage storage events remain as a fallback.
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
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

  /** Update state, persist, broadcast to other windows, and notify local listeners */
  setState(updater: GameState | ((prev: GameState) => GameState)) {
    const nextBaseState = typeof updater === 'function' ? updater(this.state) : updater;
    if (Object.is(nextBaseState, this.state)) return;

    this.state = {
      ...nextBaseState,
      revision: this.state.revision + 1,
      updatedAt: Date.now(),
    };

    this.persist();
    this.broadcastState();
    this.notify();
  }

  clear() {
    this.state = {
      ...defaultState,
      revision: this.state.revision + 1,
      updatedAt: Date.now(),
    };

    localStorage.removeItem(STORAGE_KEY);
    this.broadcastState();
    this.notify();
  }
}

// Singleton instance
export const gameStateStore = new GameStateStore();