import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Token } from './Token';
import { CombatTracker, type CombatEntry, type CombatFaction } from './CombatTracker';
import { MapControls } from './MapControls';
import { DiceRoller } from './DiceRoller';
import { AmbientPlayer } from './AmbientPlayer';
import { FogOfWar } from './FogOfWar';

import { NarrativeLight } from './NarrativeLight';
import { CellStateOverlay } from './CellStateOverlay';
import { GridCalibrator } from './GridCalibrator';
import { GMSidebar } from './GMSidebar';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Character, Monster, getModifier } from '@/types/dnd';
import { Film, X, Upload } from 'lucide-react';
import { useGameState, MapCombatState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { useCharacters } from '@/hooks/useCharacters';
import { useExtendedMonsters } from '@/hooks/useExtendedMonsters';
import { GridConfig, CellState, CREATURE_SIZE_CELLS } from '@/lib/gridEngine/types';
import { percentToCell, cellToPercent, snapToGrid } from '@/lib/gridEngine';
import { type CombatTooltipData, localizeSize, localizeType } from './CombatTokenTooltipContent';


export type TokenColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan' | 'black';
export type TokenStatus = 'active' | 'dead' | 'inactive';
export type TokenFaction = 'pj' | 'enemy' | 'npc';

export interface TokenData {
  id: string;
  x: number;
  y: number;
  color: TokenColor;
  name: string;
  size: number;
  initiative: number;
  status: TokenStatus;
  conditions: string[];
  hpMax: number;
  hpCurrent: number;
  imageUrl?: string;
  rotation?: number;
  speedFeet?: number;
  sizeInCells?: number;
  faction?: TokenFaction;
  lightEnabled?: boolean;
  lightRadius?: number;
  lightSoftness?: number;
  lightFlicker?: boolean;
  /** If true, the token is invisible to players but still shown to the DM (semi-transparent). */
  hidden?: boolean;
  /** Reference to the source library entity for combat tooltip lookup (DM-only). */
  sourceMonsterId?: string;
  sourceCharacterId?: string;
}

export const MapViewer = () => {
  const { isGuest, signOut } = useAuth();
  const { characters: libraryCharacters } = useCharacters();
  const { monsters: libraryMonsters } = useExtendedMonsters();
  const {
    maps,
    activeMapId,
    activeMap,
    isLoaded,
    setActiveMapId,
    addMap,
    removeMap,
    renameMap,
    updateActiveMap,
    clearSession,
    scenes,
    activeSceneId,
    addScene,
    removeScene,
    updateScene,
    setActiveSceneId,
    narrativeOverlay,
    setNarrativeOverlay,
    narrativeLight,
    setNarrativeLight,
    setActiveInitiativeTokenId,
    playerViewConfig,
    setPlayerViewConfig,
    setDmCamera,
    setDmSelectedTokenId,
  } = useGameState();

  // Derive current map state from activeMap
  const mapImage = activeMap?.mapImage ?? null;
  const tokens = activeMap?.tokens ?? [];
  const showGrid = activeMap?.showGrid ?? true;
  const gridSize = activeMap?.gridSize ?? 50;
  const gridColor = activeMap?.gridColor ?? '#000000';
  const gridLineWidth = activeMap?.gridLineWidth ?? 1;
  const fogEnabled = activeMap?.fogEnabled ?? false;
  const fogData = activeMap?.fogData ?? null;
  const gridOffsetX = activeMap?.gridOffsetX ?? 0;
  const gridOffsetY = activeMap?.gridOffsetY ?? 0;
  const cellStates = activeMap?.cellStates ?? {};

  // Local UI state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [defaultTokenSize, setDefaultTokenSize] = useState(50);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [newTokenColor, setNewTokenColor] = useState<TokenColor>('red');
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenSize, setNewTokenSize] = useState(50);
  const [newTokenImage, setNewTokenImage] = useState<string | undefined>(undefined);
  const [pendingTokenPosition, setPendingTokenPosition] = useState<{ x: number; y: number } | null>(null);
  const tokenImageInputRef = useRef<HTMLInputElement>(null);

  // Cinema mode
  const [cinemaMode, setCinemaMode] = useState(false);

  // Fog edit state
  const [fogEditMode, setFogEditMode] = useState(false);
  const [fogBrushSize, setFogBrushSize] = useState(50);
  const [fogTool, setFogTool] = useState<import('./FogOfWar').FogTool>('brush');
  const [fogMode, setFogMode] = useState<import('./FogOfWar').FogMode>('reveal');
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // Grid engine
  const [cellEditMode, setCellEditMode] = useState(false);
  const [cellBrushState, setCellBrushState] = useState<CellState>('blocked');
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Combat / Initiative system — derived from active map's combat state (scoped per map)
  const combat = activeMap?.combat ?? { entries: [], activeIndex: 0, isActive: false, round: 1 };
  const combatEntries = combat.entries;
  const activeInitiativeIndex = combat.activeIndex;
  const isInitiativeActive = combat.isActive;
  const [combatMode, setCombatMode] = useState(false);

  const updateCombat = useCallback((updater: Partial<MapCombatState> | ((prev: MapCombatState) => Partial<MapCombatState>)) => {
    updateActiveMap((currentMap) => {
      const cur = currentMap?.combat ?? { entries: [], activeIndex: 0, isActive: false, round: 1 };
      const patch = typeof updater === 'function' ? updater(cur) : updater;
      return { combat: { ...cur, ...patch } };
    });
  }, [updateActiveMap]);

  const setCombatEntries = useCallback((updater: CombatEntry[] | ((prev: CombatEntry[]) => CombatEntry[])) => {
    updateCombat((cur) => ({
      entries: typeof updater === 'function' ? updater(cur.entries) : updater,
    }));
  }, [updateCombat]);

  const setActiveInitiativeIndex = useCallback((updater: number | ((prev: number) => number)) => {
    updateCombat((cur) => ({
      activeIndex: typeof updater === 'function' ? updater(cur.activeIndex) : updater,
    }));
  }, [updateCombat]);

  const setIsInitiativeActive = useCallback((v: boolean) => {
    updateCombat({ isActive: v });
  }, [updateCombat]);

  // Open player view window
  const openPlayerWindow = useCallback(() => {
    const w = window.open('/player-view', 'vtt-player-view', 'popup');
    if (w) w.focus();
  }, []);

  // Scene activation handler
  const handleActivateScene = useCallback((sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setActiveSceneId(sceneId);

    // Switch to linked map if specified
    if (scene.mapId && scene.mapId !== activeMapId) {
      setActiveMapId(scene.mapId);
    }

    // Show narrative image if specified
    if (scene.narrativeImage) {
      setNarrativeOverlay({
        image: scene.narrativeImage,
        text: scene.narrativeText,
        visible: true,
      });
    }

    // Play scene audio tracks
    if (scene.musicTrackData) {
      window.dispatchEvent(new CustomEvent('scene-play-audio', {
        detail: { channel: 1, name: scene.musicTrackName, data: scene.musicTrackData }
      }));
    }
    if (scene.ambientTrackData) {
      window.dispatchEvent(new CustomEvent('scene-play-audio', {
        detail: { channel: 2, name: scene.ambientTrackName, data: scene.ambientTrackData }
      }));
    }

    toast.success(`Escena "${scene.name}" activada`);
  }, [scenes, activeMapId, setActiveMapId, setActiveSceneId, setNarrativeOverlay]);

  // Narrative overlay handlers
  const handleShowNarrativeImage = useCallback((image: string, text?: string) => {
    setNarrativeOverlay({ image, text: text ?? '', visible: true });
  }, [setNarrativeOverlay]);

  const handleHideNarrativeImage = useCallback(() => {
    setNarrativeOverlay({ image: null, text: '', visible: false });
  }, [setNarrativeOverlay]);
  // Grid config memoized
  const gridConfig = useMemo((): GridConfig => ({
    type: showGrid ? 'square' : 'none',
    cellSize: gridSize,
    offsetX: gridOffsetX,
    offsetY: gridOffsetY,
    mapWidth: mapDimensions.width,
    mapHeight: mapDimensions.height,
    feetPerCell: 5,
  }), [showGrid, gridSize, gridOffsetX, gridOffsetY, mapDimensions]);

  // Follow token with narrative light
  useEffect(() => {
    if (!narrativeLight.enabled || !narrativeLight.followTokenId) return;
    const token = tokens.find(t => t.id === narrativeLight.followTokenId);
    if (!token || mapDimensions.width === 0) return;
    const px = (token.x / 100) * mapDimensions.width;
    const py = (token.y / 100) * mapDimensions.height;
    setNarrativeLight({ x: px, y: py });
  }, [narrativeLight.enabled, narrativeLight.followTokenId, tokens, mapDimensions]);

  // Reset local UI state when switching maps
  useEffect(() => {
    setSelectedToken(null);
    setIsAddingToken(false);
    setPendingTokenPosition(null);
    setFogEditMode(false);
    setCellEditMode(false);
    setZoomLevel(1);
    setMapDimensions({ width: 0, height: 0 });
  }, [activeMapId]);

  // Auto-create first map
  useEffect(() => {
    if (isLoaded && maps.length === 0) {
      addMap('Mapa 1');
    }
  }, [isLoaded, maps.length, addMap]);

  // Restore toast
  useEffect(() => {
    if (isLoaded && activeMap?.mapImage) {
      toast.success('Sesión restaurada');
    }
  }, [isLoaded]);

  // Zoom functions
  const zoomFunctionsRef = useRef<{
    setTransform: (x: number, y: number, scale: number) => void;
    state: { positionX: number; positionY: number; scale: number };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Map update helpers
  const setMapImage = useCallback((img: string | null) => updateActiveMap({ mapImage: img }), [updateActiveMap]);
  const setTokens = useCallback((updater: TokenData[] | ((prev: TokenData[]) => TokenData[])) => {
    updateActiveMap((currentMap) => ({
      tokens: typeof updater === 'function' ? updater(currentMap?.tokens ?? []) : updater,
    }));
  }, [updateActiveMap]);
  const setShowGrid = useCallback((v: boolean) => updateActiveMap({ showGrid: v }), [updateActiveMap]);
  const setGridSize = useCallback((v: number) => updateActiveMap({ gridSize: v, gridCellSize: v }), [updateActiveMap]);
  const setGridColor = useCallback((v: string) => updateActiveMap({ gridColor: v }), [updateActiveMap]);
  const setGridLineWidth = useCallback((v: number) => updateActiveMap({ gridLineWidth: v }), [updateActiveMap]);
  const setFogEnabled = useCallback((v: boolean) => updateActiveMap({ fogEnabled: v }), [updateActiveMap]);
  const setFogData = useCallback((v: string | null) => updateActiveMap({ fogData: v }), [updateActiveMap]);
  const setGridOffsetX = useCallback((v: number) => updateActiveMap({ gridOffsetX: v }), [updateActiveMap]);
  const setGridOffsetY = useCallback((v: number) => updateActiveMap({ gridOffsetY: v }), [updateActiveMap]);
  const setCellStates = useCallback((updater: Record<string, CellState> | ((prev: Record<string, CellState>) => Record<string, CellState>)) => {
    updateActiveMap((currentMap) => ({
      cellStates: typeof updater === 'function' ? updater(currentMap?.cellStates ?? {}) : updater,
    }));
  }, [updateActiveMap]);

  // Combat handlers
  const handleStartInitiative = useCallback(() => {
    if (!activeMapId) return;
    if (combatEntries.length === 0) {
      // Auto-import ONLY tokens of the currently active map (no cross-map leakage)
      const factionFromToken = (t: TokenData): CombatFaction =>
        t.faction ?? (t.id.startsWith('char-') ? 'pj' : t.id.startsWith('monster-') ? 'enemy' : 'npc');
      const seen = new Set<string>();
      const fromTokens: CombatEntry[] = tokens
        .filter(t => t.status === 'active')
        .filter(t => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        })
        .sort((a, b) => b.initiative - a.initiative)
        .map(t => ({
          id: `combat-${t.id}`,
          tokenId: t.id,
          name: t.name,
          initiative: t.initiative,
          faction: factionFromToken(t),
        }));
      if (fromTokens.length === 0) {
        toast.error('Añade combatientes antes de iniciar');
        return;
      }
      updateCombat({ entries: fromTokens, activeIndex: 0, isActive: true, round: 1 });
    } else {
      updateCombat({ activeIndex: 0, isActive: true, round: 1 });
    }
    setCombatMode(true);
    toast.success('¡Combate iniciado!');
  }, [activeMapId, combatEntries.length, tokens, updateCombat]);

  const handleNextTurn = useCallback(() => {
    if (combatEntries.length === 0) return;
    const next = (activeInitiativeIndex + 1) % combatEntries.length;
    updateCombat((cur) => ({
      activeIndex: next,
      round: next === 0 ? cur.round + 1 : cur.round,
    }));
    const entry = combatEntries[next];
    if (entry) {
      toast.info(`Turno de ${entry.name}`);
      // Auto-select the active token so Player View centers on it (if syncSelection is on)
      // and the DM also sees its selection halo.
      if (entry.tokenId) {
        setSelectedToken(entry.tokenId);
      }
    }
  }, [combatEntries, activeInitiativeIndex, updateCombat]);

  const handlePrevTurn = useCallback(() => {
    if (combatEntries.length === 0) return;
    const next = (activeInitiativeIndex - 1 + combatEntries.length) % combatEntries.length;
    setActiveInitiativeIndex(next);
    const entry = combatEntries[next];
    if (entry?.tokenId) setSelectedToken(entry.tokenId);
  }, [combatEntries, activeInitiativeIndex, setActiveInitiativeIndex]);

  const handleEndInitiative = useCallback(() => {
    updateCombat({ isActive: false, activeIndex: 0, round: 1 });
    toast.success('Combate finalizado');
  }, [updateCombat]);

  const handleAddFromMap = useCallback(() => {
    const factionFromToken = (t: TokenData): CombatFaction =>
      t.faction ?? (t.id.startsWith('char-') ? 'pj' : t.id.startsWith('monster-') ? 'enemy' : 'npc');
    // Dedupe against existing entries AND within the new batch.
    const existingTokenIds = new Set(combatEntries.map(e => e.tokenId).filter(Boolean) as string[]);
    const additions: CombatEntry[] = [];
    for (const t of tokens) {
      if (t.status !== 'active') continue;
      if (existingTokenIds.has(t.id)) continue;
      existingTokenIds.add(t.id);
      additions.push({
        id: `combat-${t.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tokenId: t.id,
        name: t.name,
        initiative: t.initiative,
        faction: factionFromToken(t),
      });
    }
    if (additions.length === 0) {
      toast.info('Todos los tokens activos ya están en la lista');
      return;
    }
    setCombatEntries(prev => [...prev, ...additions]);
    toast.success(`${additions.length} combatiente(s) añadido(s)`);
  }, [combatEntries, tokens, setCombatEntries]);

  // Get the currently active initiative token id (for halo on map)
  const activeInitiativeTokenId = isInitiativeActive && combatEntries.length > 0
    ? combatEntries[activeInitiativeIndex]?.tokenId ?? null
    : null;

  // Sync active turn token to shared store so Player View can render the halo
  useEffect(() => {
    setActiveInitiativeTokenId(activeInitiativeTokenId);
  }, [activeInitiativeTokenId, setActiveInitiativeTokenId]);

  // Broadcast DM camera state for syncCamera/syncZoom (rAF throttled)
  const cameraRafRef = useRef<number | null>(null);
  const pendingCameraRef = useRef<{ x: number; y: number; s: number } | null>(null);
  const broadcastCamera = useCallback((x: number, y: number, s: number) => {
    pendingCameraRef.current = { x, y, s };
    if (cameraRafRef.current !== null) return;
    cameraRafRef.current = requestAnimationFrame(() => {
      cameraRafRef.current = null;
      const p = pendingCameraRef.current;
      if (!p) return;
      setDmCamera({ positionX: p.x, positionY: p.y, scale: p.s, mapId: activeMapId });
    });
  }, [activeMapId, setDmCamera]);

  useEffect(() => () => {
    if (cameraRafRef.current !== null) cancelAnimationFrame(cameraRafRef.current);
  }, []);

  // Broadcast selected token for syncSelection
  useEffect(() => {
    setDmSelectedTokenId(selectedToken);
  }, [selectedToken, setDmSelectedTokenId]);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setMapImage(e.target?.result as string);
      toast.success('Mapa cargado correctamente');
    };
    reader.onerror = () => {
      toast.error('Error al cargar el archivo');
    };
    reader.readAsDataURL(file);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingToken) return;
    event.stopPropagation();

    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPendingTokenPosition({ x, y });
    setNewTokenName(`Token ${tokens.length + 1}`);
    setNewTokenSize(defaultTokenSize);
    setIsAddingToken(false);
  };

  const confirmAddToken = () => {
    if (!pendingTokenPosition) return;
    
    const newToken: TokenData = {
      id: Date.now().toString(),
      x: pendingTokenPosition.x,
      y: pendingTokenPosition.y,
      color: newTokenColor,
      name: newTokenName.trim() || `Token ${tokens.length + 1}`,
      size: newTokenSize,
      initiative: 0,
      status: 'active',
      conditions: [],
      hpMax: 10,
      hpCurrent: 10,
      imageUrl: newTokenImage,
    };

    setTokens(prev => [...prev, newToken]);
    setPendingTokenPosition(null);
    setNewTokenName('');
    setNewTokenImage(undefined);
    toast.success('Token añadido');
  };

  const cancelAddToken = () => {
    setPendingTokenPosition(null);
    setNewTokenName('');
    setNewTokenImage(undefined);
  };

  const handleTokenImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube una imagen válida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewTokenImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTokenMove = (id: string, x: number, y: number) => {
    const movedToken = tokens.find(t => t.id === id);

    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, x, y } : token
    ));

    // Auto-reveal fog around tokens that have exploration enabled
    if (fogEnabled && mapDimensions.width > 0 && movedToken?.lightEnabled && movedToken.status === 'active') {
      autoRevealFog(x, y, movedToken.lightRadius ?? 120);
    }
  };

  const autoRevealFog = useCallback((xPercent: number, yPercent: number, radius: number) => {
    const fogDataCurrent = activeMap?.fogData;
    if (!fogDataCurrent || mapDimensions.width === 0) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = mapDimensions.width;
    offscreen.height = mapDimensions.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, mapDimensions.width, mapDimensions.height);
      // Reveal a circle using destination-out
      ctx.globalCompositeOperation = 'destination-out';
      const px = (xPercent / 100) * mapDimensions.width;
      const py = (yPercent / 100) * mapDimensions.height;
      const gradient = ctx.createRadialGradient(px, py, radius * 0.5, px, py, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      const newDataUrl = offscreen.toDataURL('image/png', 0.6);
      setFogData(newDataUrl);
    };
    img.src = fogDataCurrent;
  }, [activeMap?.fogData, mapDimensions, setFogData]);

  const handleTokenRotation = (id: string, rotation: number) => {
    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, rotation } : token
    ));
  };

  const handleTokenNameChange = (id: string, name: string) => {
    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, name } : token
    ));
  };

  const handleStatusChange = (id: string, status: TokenStatus) => {
    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, status } : token
    ));
    
    if (status !== 'active') {
      toast.success(status === 'dead' ? 'Token marcado como muerto' : 'Token marcado como inactivo');
    }
  };

  const handleTokenSizeChange = (id: string, size: number) => {
    setTokens(prev => prev.map(token => 
      token.id === id ? { ...token, size } : token
    ));
  };

  const handleTokenLightChange = (id: string, updates: { lightEnabled?: boolean; lightRadius?: number; lightSoftness?: number; lightFlicker?: boolean }) => {
    setTokens(prev => prev.map(token =>
      token.id === id ? { ...token, ...updates } : token
    ));
  };

  const handleToggleHidden = (id: string) => {
    let nowHidden = false;
    setTokens(prev => prev.map(token => {
      if (token.id !== id) return token;
      nowHidden = !token.hidden;
      return { ...token, hidden: nowHidden };
    }));
    toast.success(nowHidden ? 'Token oculto a los jugadores' : 'Token visible para los jugadores');
  };

  const handleHpChange = (id: string, hpCurrent: number, hpMax: number) => {
    setTokens(prev => prev.map(token => {
      if (token.id !== id) return token;
      const newHpCurrent = Math.max(0, Math.min(hpCurrent, hpMax));
      const newStatus = newHpCurrent <= 0 ? 'dead' : token.status === 'dead' ? 'active' : token.status;
      return { ...token, hpCurrent: newHpCurrent, hpMax, status: newStatus };
    }));
  };

  const handleToggleCondition = (tokenId: string, conditionId: string) => {
    setTokens(prev => prev.map(token => {
      if (token.id !== tokenId) return token;
      const hasCondition = token.conditions.includes(conditionId);
      return {
        ...token,
        conditions: hasCondition 
          ? token.conditions.filter(c => c !== conditionId)
          : [...token.conditions, conditionId]
      };
    }));
  };

  const handleDeleteToken = (id: string) => {
    setTokens(prev => prev.filter(token => token.id !== id));
    setSelectedToken(null);
    toast.success('Token eliminado');
  };

  const handleClearAll = () => {
    setTokens([]);
    setSelectedToken(null);
    toast.success('Todos los tokens eliminados');
  };

  const handleClearSession = () => {
    clearSession();
    toast.success('Sesión limpiada');
  };

  const handleCellStateClick = (cellX: number, cellY: number) => {
    const key = `${cellX},${cellY}`;
    setCellStates(prev => {
      const current = prev[key] || 'free';
      if (cellBrushState === current) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: cellBrushState };
    });
  };

  const handleCalibrationComplete = (cellSize: number, offsetX: number, offsetY: number) => {
    setGridSize(cellSize);
    setGridOffsetX(offsetX);
    setGridOffsetY(offsetY);
    setIsCalibrating(false);
    toast.success(`Cuadrícula calibrada: ${cellSize}px por celda`);
  };

  const handleAddCharacterToMap = (character: Character) => {
    const baseTokenSize = character.token_size > 0 ? character.token_size : 100;
    const sizeInCells = Math.max(1, Math.min(4, Math.round(baseTokenSize / 100)));
    const tokenSizePx = sizeInCells * gridSize;

    const newToken: TokenData = {
      id: `char-${Date.now()}`,
      x: 50,
      y: 50,
      color: character.token_color,
      name: character.name,
      size: tokenSizePx,
      initiative: getModifier(character.dexterity) + character.initiative_bonus,
      status: 'active',
      conditions: [],
      hpMax: character.hit_points_max,
      hpCurrent: character.hit_points_max,
      imageUrl: character.image_url || undefined,
      speedFeet: character.speed,
      sizeInCells,
      faction: 'pj',
      sourceCharacterId: character.id,
    };
    setTokens(prev => [...prev, newToken]);
    toast.success(`${character.name} añadido al mapa`);
  };

  const handleAddMonsterToMap = (monster: Monster) => {
    const sizeInCells = CREATURE_SIZE_CELLS[monster.size] ?? 1;
    const tokenSizePx = sizeInCells * gridSize;

    const newToken: TokenData = {
      id: `monster-${Date.now()}`,
      x: 50,
      y: 50,
      color: monster.token_color,
      name: monster.name,
      size: tokenSizePx,
      initiative: getModifier(monster.dexterity),
      status: 'active',
      conditions: [],
      hpMax: monster.hit_points,
      hpCurrent: monster.hit_points,
      imageUrl: monster.image_url || undefined,
      speedFeet: monster.speed,
      sizeInCells,
      faction: 'enemy',
      sourceMonsterId: monster.id,
    };
    setTokens(prev => [...prev, newToken]);
    toast.success(`${monster.name} añadido al mapa`);
  };

  // Build combat tooltip data for a token (only when combat is active and source entity exists with content)
  const monsterById = useMemo(() => new Map(libraryMonsters.map(m => [m.id, m])), [libraryMonsters]);
  const characterById = useMemo(() => new Map(libraryCharacters.map(c => [c.id, c])), [libraryCharacters]);

  const getCombatTooltip = useCallback((token: TokenData): CombatTooltipData | null => {
    if (!isInitiativeActive) return null;
    if (token.sourceMonsterId) {
      const m = monsterById.get(token.sourceMonsterId) as any;
      if (!m) return null;
      const traits = m.traits ?? [];
      const actions = m.actions ?? [];
      const bonusActions = m.bonus_actions ?? [];
      const reactions = m.reactions ?? [];
      const legendary = m.legendary_actions?.actions ?? [];
      if (!traits.length && !actions.length && !bonusActions.length && !reactions.length && !legendary.length) return null;
      const sizeLbl = localizeSize(m.size);
      const typeLbl = localizeType(m.type);
      return {
        name: m.name,
        subtitle: `${sizeLbl} ${typeLbl} · VD ${m.challenge_rating ?? '?'}`.replace(/\s+/g, ' ').trim(),
        hp: { current: token.hpCurrent, max: token.hpMax },
        ac: m.armor_class,
        traits, actions, bonusActions, reactions, legendary,
        source: {
          strength: m.strength, dexterity: m.dexterity, constitution: m.constitution,
          intelligence: m.intelligence, wisdom: m.wisdom, charisma: m.charisma,
          proficiency_bonus: m.proficiency_bonus,
        },
      };
    }
    if (token.sourceCharacterId) {
      const c = characterById.get(token.sourceCharacterId) as any;
      if (!c) return null;
      const traits = (c.features ?? []) as any[];
      const actions = (c.actions ?? []) as any[];
      if (!traits.length && !actions.length) return null;
      return {
        name: c.name,
        subtitle: `Nivel ${c.level ?? '?'} · ${c.class ?? ''}`.trim(),
        hp: { current: token.hpCurrent, max: token.hpMax },
        ac: c.armor_class,
        traits, actions, bonusActions: [], reactions: [], legendary: [],
        source: {
          strength: c.strength, dexterity: c.dexterity, constitution: c.constitution,
          intelligence: c.intelligence, wisdom: c.wisdom, charisma: c.charisma,
          proficiency_bonus: c.proficiency_bonus,
        },
      };
    }
    return null;
  }, [isInitiativeActive, monsterById, characterById]);

  // Render map content
  const renderMapContent = () => (
    <TransformWrapper
      key={activeMapId}
      initialScale={1}
      minScale={0.1}
      maxScale={10}
      centerOnInit
      limitToBounds={false}
      panning={{ disabled: isAddingToken }}
      onZoom={(ref) => {
        setZoomLevel(ref.state.scale);
        zoomFunctionsRef.current = ref;
        broadcastCamera(ref.state.positionX, ref.state.positionY, ref.state.scale);
      }}
      onPanning={(ref) => {
        zoomFunctionsRef.current = ref;
        broadcastCamera(ref.state.positionX, ref.state.positionY, ref.state.scale);
      }}
      onInit={(ref) => {
        zoomFunctionsRef.current = ref;
        broadcastCamera(ref.state.positionX, ref.state.positionY, ref.state.scale);
      }}
    >
      {({ zoomIn, zoomOut, resetTransform, zoomToElement, ...rest }) => (
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
          }}
          contentStyle={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            ref={mapContainerRef}
            className="relative"
            style={{ cursor: fogEditMode ? 'crosshair' : isAddingToken ? 'crosshair' : 'grab' }}
            onClick={handleMapClick}
          >
            <img
              src={mapImage!}
              alt="Mapa de juego"
              className="block select-none pointer-events-none"
              style={{ maxWidth: 'none', maxHeight: 'none' }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setMapDimensions({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />
            
            {/* Grid overlay */}
            {showGrid && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  <pattern
                    id="grid"
                    width={gridSize}
                    height={gridSize}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${gridOffsetX} ${gridOffsetY})`}
                  >
                    <path
                      d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                      fill="none"
                      stroke={gridColor}
                      strokeWidth={gridLineWidth}
                      opacity="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            {/* Cell state overlay */}
            {mapDimensions.width > 0 && (
              <CellStateOverlay
                gridConfig={gridConfig}
                cellStates={cellStates}
                editMode={cellEditMode}
                brushState={cellBrushState}
                onCellClick={handleCellStateClick}
              />
            )}

            {/* Fog of War layer (z-index 20) — DM sees it semi-transparent */}
            {fogEnabled && mapDimensions.width > 0 && (
              <FogOfWar
                key={activeMapId ?? 'no-map'}
                width={mapDimensions.width}
                height={mapDimensions.height}
                enabled={fogEditMode}
                brushSize={fogBrushSize}
                fogData={fogData}
                onFogChange={setFogData}
                fogTool={fogTool}
                fogMode={fogMode}
                opacity={0.45}
              />
            )}


            {/* Narrative Light layer */}
            {narrativeLight.enabled && mapDimensions.width > 0 && (
              <NarrativeLight
                width={mapDimensions.width}
                height={mapDimensions.height}
                x={narrativeLight.x}
                y={narrativeLight.y}
                radius={narrativeLight.radius}
                editable={true}
                onMove={(nx, ny) => setNarrativeLight({ x: nx, y: ny })}
              />
            )}

            {/* Tokens — DM sees ALL tokens (hidden ones with semi-transparent style) */}
            {tokens.map(token => (
              <Token
                key={token.id}
                {...token}
                imageUrl={token.imageUrl}
                rotation={token.rotation}
                isSelected={selectedToken === token.id}
                isActiveInitiative={token.id === activeInitiativeTokenId}
                hidden={token.hidden}
                showHiddenStyle={true}
                onMove={handleTokenMove}
                onClick={() => setSelectedToken(token.id)}
                onDelete={() => handleDeleteToken(token.id)}
                onMarkDead={() => handleStatusChange(token.id, 'dead')}
                onRotate={handleTokenRotation}
                onToggleHidden={() => handleToggleHidden(token.id)}
                mapContainerRef={mapContainerRef}
                combatTooltip={getCombatTooltip(token)}
              />
            ))}
          </div>
        </TransformComponent>
      )}
    </TransformWrapper>
  );

  // Cinema Mode View
  if (cinemaMode && mapImage) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-black flex flex-col">
        <div className="h-16 bg-black flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <span className="text-foreground font-semibold">Modo Cine</span>
          </div>
          <Button
            onClick={() => setCinemaMode(false)}
            variant="ghost"
            size="sm"
            className="text-foreground hover:text-primary gap-2"
          >
            <X className="w-4 h-4" />
            Salir
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden bg-black">
          {renderMapContent()}
        </div>

        <div className="h-16 bg-black" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <AmbientPlayer />
      </div>
    );
  }

  // Normal View
  return (
    <div className="h-screen w-screen overflow-hidden bg-board-bg flex">
      {/* GM Sidebar */}
      <GMSidebar
        maps={maps}
        activeMapId={activeMapId}
        onSelectMap={setActiveMapId}
        onAddMap={addMap}
        onRemoveMap={removeMap}
        onRenameMap={renameMap}
        tokens={tokens}
        selectedToken={selectedToken}
        onSelectToken={setSelectedToken}
        onDeleteToken={handleDeleteToken}
        onTokenNameChange={handleTokenNameChange}
        onStatusChange={handleStatusChange}
        onTokenSizeChange={handleTokenSizeChange}
        onTokenRotationChange={handleTokenRotation}
        onToggleCondition={handleToggleCondition}
        onHpChange={handleHpChange}
        onTokenLightChange={handleTokenLightChange}
        selectedColor={newTokenColor}
        onColorChange={setNewTokenColor}
        isAddingToken={isAddingToken}
        onToggleAddToken={() => setIsAddingToken(!isAddingToken)}
        onClearAll={handleClearAll}
        defaultTokenSize={defaultTokenSize}
        onDefaultTokenSizeChange={setDefaultTokenSize}
        onAddCharacterToMap={handleAddCharacterToMap}
        onAddMonsterToMap={handleAddMonsterToMap}
        onOpenPlayerView={openPlayerWindow}
        combatEntries={combatEntries}
        onCombatEntriesChange={setCombatEntries}
        activeInitiativeIndex={activeInitiativeIndex}
        onActiveInitiativeIndexChange={setActiveInitiativeIndex}
        onStartInitiative={handleStartInitiative}
        onNextTurn={handleNextTurn}
        onPrevTurn={handlePrevTurn}
        onEndInitiative={handleEndInitiative}
        onAddFromMapToCombat={handleAddFromMap}
        isInitiativeActive={isInitiativeActive}
        combatMode={combatMode}
        onToggleCombatMode={() => setCombatMode(prev => !prev)}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onAddScene={addScene}
        onRemoveScene={removeScene}
        onUpdateScene={updateScene}
        onActivateScene={handleActivateScene}
        narrativeOverlay={narrativeOverlay}
        onShowNarrativeImage={handleShowNarrativeImage}
        onHideNarrativeImage={handleHideNarrativeImage}
        playerViewConfig={playerViewConfig}
        onPlayerViewConfigChange={setPlayerViewConfig}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top controls */}
        <MapControls
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          gridColor={gridColor}
          onGridColorChange={setGridColor}
          gridLineWidth={gridLineWidth}
          onGridLineWidthChange={setGridLineWidth}
          zoomLevel={zoomLevel}
          onZoomChange={(zoom) => {
            if (zoomFunctionsRef.current) {
              const { state, setTransform } = zoomFunctionsRef.current;
              setTransform(state.positionX, state.positionY, zoom);
              setZoomLevel(zoom);
            }
          }}
          onUploadClick={() => fileInputRef.current?.click()}
          hasMap={!!mapImage}
          cinemaMode={cinemaMode}
          onToggleCinemaMode={() => setCinemaMode(!cinemaMode)}
          onClearSession={handleClearSession}
          fogEnabled={fogEnabled}
          onToggleFog={() => setFogEnabled(!fogEnabled)}
          fogEditMode={fogEditMode}
          onToggleFogEditMode={() => setFogEditMode(!fogEditMode)}
          fogBrushSize={fogBrushSize}
          onFogBrushSizeChange={setFogBrushSize}
          onResetFog={() => setFogData(null)}
          fogTool={fogTool}
          onFogToolChange={setFogTool}
          fogMode={fogMode}
          onFogModeChange={setFogMode}
          narrativeLightEnabled={narrativeLight.enabled}
          onToggleNarrativeLight={() => setNarrativeLight({ enabled: !narrativeLight.enabled })}
          narrativeLightRadius={narrativeLight.radius}
          onNarrativeLightRadiusChange={(r) => setNarrativeLight({ radius: r })}
          tokens={tokens}
          narrativeLightFollowTokenId={narrativeLight.followTokenId}
          onNarrativeLightFollowToken={(id) => setNarrativeLight({ followTokenId: id })}
          combatMode={combatMode}
          onToggleCombatMode={() => setCombatMode(prev => !prev)}
        />

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden bg-board-bg">
          {!mapImage ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Carga tu mapa
                </h2>
                <p className="text-muted-foreground mb-4">
                  Sube una imagen de tu mapa
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Seleccionar mapa
                </button>
              </div>
            </div>
          ) : (
            renderMapContent()
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Token name dialog */}
      {pendingTokenPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-xl border border-border max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-card-foreground mb-4">Nuevo token</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1 block">
                  Nombre
                </label>
                <Input
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="Escribe el nombre..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAddToken();
                    if (e.key === 'Escape') cancelAddToken();
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Imagen (opcional)
                </label>
                <input
                  ref={tokenImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTokenImageUpload}
                  className="hidden"
                />
                {newTokenImage ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={newTokenImage} 
                      alt="Token preview" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-border"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setNewTokenImage(undefined)}
                    >
                      Quitar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tokenImageInputRef.current?.click()}
                    className="w-full gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Subir imagen
                  </Button>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Tamaño: {newTokenSize}px
                </label>
                <Slider
                  value={[newTokenSize]}
                  onValueChange={(value) => setNewTokenSize(value[0])}
                  min={20}
                  max={400}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Pequeño</span>
                  <span>Grande</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={cancelAddToken}>
                Cancelar
              </Button>
              <Button onClick={confirmAddToken}>
                Añadir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Narrative Overlay (GM preview) */}
      {narrativeOverlay.visible && narrativeOverlay.image && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 cursor-pointer animate-fade-in"
          onClick={handleHideNarrativeImage}
        >
          <div className="relative max-w-3xl max-h-[80vh] flex flex-col items-center gap-4">
            <img 
              src={narrativeOverlay.image} 
              alt="Imagen narrativa" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
            {narrativeOverlay.text && (
              <p className="text-foreground/90 text-lg text-center max-w-xl px-4 italic">
                {narrativeOverlay.text}
              </p>
            )}
            <p className="text-muted-foreground text-xs">Haz clic para cerrar</p>
          </div>
        </div>
      )}

      {/* Dice Roller */}
      <DiceRoller />

      {/* Ambient Player */}
      <AmbientPlayer />

      {/* Copyright */}
      <div className="fixed bottom-1 right-2 text-[10px] text-muted-foreground/50 pointer-events-none select-none z-10">
        © Creado por diFFFerent
      </div>

      {/* Guest mode indicator */}
      {isGuest && (
        <div className="fixed top-2 right-2 z-50 flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 shadow-lg">
          <span className="text-xs text-muted-foreground">Modo invitado</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              signOut();
              window.location.href = '/auth';
            }}
          >
            Iniciar sesión
          </Button>
        </div>
      )}
    </div>
  );
};
