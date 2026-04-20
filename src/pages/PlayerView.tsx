import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Token } from '@/components/Token';
import { FogOfWar } from '@/components/FogOfWar';

import { NarrativeLight } from '@/components/NarrativeLight';
import { CellStateOverlay } from '@/components/CellStateOverlay';
import { useGameState } from '@/hooks/useGameState';
import { GridConfig } from '@/lib/gridEngine/types';
import { Maximize, Minimize } from 'lucide-react';
import { log } from '@/lib/debug';

const PlayerView = () => {
  const {
    activeMap,
    narrativeOverlay,
    narrativeLight,
    activeInitiativeTokenId,
    playerViewConfig,
    dmCamera,
    dmSelectedTokenId,
    playerCameras,
    savePlayerCamera,
  } = useGameState();
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transformReadyMapId, setTransformReadyMapId] = useState<string | null>(null);
  const [imageReadyMapId, setImageReadyMapId] = useState<string | null>(null);
  const [cameraReadyMapId, setCameraReadyMapId] = useState<string | null>(null);
  const [fogReadyMapId, setFogReadyMapId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const transformApiRef = useRef<{
    setTransform: (x: number, y: number, scale: number, time?: number, easing?: string) => void;
    state: { positionX: number; positionY: number; scale: number };
  } | null>(null);
  const restoredForMapRef = useRef<string | null>(null);
  const isHydratingCameraRef = useRef(false);

  const persistCurrentPlayerCamera = useCallback((mapId: string | null) => {
    const api = transformApiRef.current;
    if (!mapId || !api) return;

    const snapshot = {
      positionX: api.state.positionX,
      positionY: api.state.positionY,
      scale: api.state.scale,
    };

    log('camera:save', { mapId, snapshot, scope: 'player' });
    savePlayerCamera(mapId, snapshot);
  }, [savePlayerCamera]);

  // Track narrative transitions
  const [narrativeVisible, setNarrativeVisible] = useState(false);
  const [narrativeImage, setNarrativeImage] = useState<string | null>(null);
  const [narrativeText, setNarrativeText] = useState('');
  const [narrativeFading, setNarrativeFading] = useState(false);

  const prevMapImageRef = useRef<string | null>(null);

  // Derive state from shared store
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

  const isMapReady = !!activeMap?.id
    && transformReadyMapId === activeMap.id
    && imageReadyMapId === activeMap.id
    && mapDimensions.width > 0
    && mapDimensions.height > 0;

  const isViewReady = !!activeMap?.id
    && isMapReady
    && cameraReadyMapId === activeMap.id
    && (!fogEnabled || fogReadyMapId === activeMap.id);

  // Reset dimensions when map image changes
  useEffect(() => {
    if (mapImage !== prevMapImageRef.current) {
      setMapDimensions({ width: 0, height: 0 });
      prevMapImageRef.current = mapImage;
    }
  }, [mapImage]);

  // Reset hydration flags whenever the active map changes.
  useEffect(() => {
    restoredForMapRef.current = null;
    isHydratingCameraRef.current = true;
    setTransformReadyMapId(null);
    setImageReadyMapId(null);
    setCameraReadyMapId(null);
    setFogReadyMapId(fogEnabled ? null : activeMap?.id ?? null);
  }, [activeMap?.id]);

  useEffect(() => {
    setFogReadyMapId(fogEnabled ? null : activeMap?.id ?? null);
  }, [activeMap?.id, fogEnabled]);

  // Persist outgoing camera before the old TransformWrapper unmounts.
  useLayoutEffect(() => {
    return () => {
      persistCurrentPlayerCamera(activeMap?.id ?? null);
    };
  }, [activeMap?.id, persistCurrentPlayerCamera]);

  // Restore the saved camera only after both the viewport and the map image are ready.
  // This avoids racing against react-zoom-pan-pinch init and cached-image onLoad timing.
  useLayoutEffect(() => {
    if (!activeMap?.id || !isMapReady || !transformApiRef.current) return;
    if (restoredForMapRef.current === activeMap.id) return;

    const api = transformApiRef.current;
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clampCamera = (positionX: number, positionY: number, scale: number) => {
      const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
      const scaledW = mapDimensions.width * safeScale;
      const scaledH = mapDimensions.height * safeScale;

      let nextX = positionX;
      let nextY = positionY;

      if (scaledW <= rect.width) nextX = (rect.width - scaledW) / 2;
      else nextX = Math.min(0, Math.max(rect.width - scaledW, nextX));

      if (scaledH <= rect.height) nextY = (rect.height - scaledH) / 2;
      else nextY = Math.min(0, Math.max(rect.height - scaledH, nextY));

      return { positionX: nextX, positionY: nextY, scale: safeScale };
    };

    const saved = playerCameras[activeMap.id];
    const targetCamera = saved
      ? clampCamera(saved.positionX, saved.positionY, saved.scale)
      : clampCamera(0, 0, 1);

    if (saved) log('camera:restore', { mapId: activeMap.id, snapshot: targetCamera, scope: 'player' });
    else log('camera:default', { mapId: activeMap.id, snapshot: targetCamera, scope: 'player' });

    api.setTransform(targetCamera.positionX, targetCamera.positionY, targetCamera.scale, 0);
    restoredForMapRef.current = activeMap.id;
    isHydratingCameraRef.current = false;
    setCameraReadyMapId(activeMap.id);
  }, [activeMap?.id, isMapReady, mapDimensions.width, mapDimensions.height, playerCameras]);

  // Handle narrative overlay transitions
  useEffect(() => {
    if (narrativeOverlay.visible && narrativeOverlay.image) {
      setNarrativeImage(narrativeOverlay.image);
      setNarrativeText(narrativeOverlay.text);
      setNarrativeFading(false);
      requestAnimationFrame(() => setNarrativeVisible(true));
    } else if (!narrativeOverlay.visible && narrativeVisible) {
      setNarrativeFading(true);
      setNarrativeVisible(false);
      setTimeout(() => {
        setNarrativeFading(false);
        setNarrativeImage(null);
        setNarrativeText('');
      }, 800);
    }
  }, [narrativeOverlay.visible, narrativeOverlay.image]);

  // Fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Sync DM camera (position + zoom) when flags are enabled.
  // Never apply while we are still hydrating a saved/default camera for this map.
  useEffect(() => {
    if (!transformApiRef.current || !activeMap?.id) return;
    if (!playerViewConfig.syncCamera && !playerViewConfig.syncZoom) return;
    if (restoredForMapRef.current !== activeMap.id || isHydratingCameraRef.current) return;
    if (dmCamera.mapId && dmCamera.mapId !== activeMap.id) return;

    const cur = transformApiRef.current.state;
    const targetX = playerViewConfig.syncCamera ? dmCamera.positionX : cur.positionX;
    const targetY = playerViewConfig.syncCamera ? dmCamera.positionY : cur.positionY;
    const targetScale = playerViewConfig.syncZoom ? dmCamera.scale : cur.scale;

    transformApiRef.current.setTransform(targetX, targetY, targetScale, 220, 'easeOut');
    log('sync:player', {
      mapId: activeMap.id,
      type: 'camera',
      syncCamera: playerViewConfig.syncCamera,
      syncZoom: playerViewConfig.syncZoom,
    });
  }, [
    dmCamera.tick,
    dmCamera.positionX,
    dmCamera.positionY,
    dmCamera.scale,
    dmCamera.mapId,
    playerViewConfig.syncCamera,
    playerViewConfig.syncZoom,
    activeMap?.id,
  ]);

  // Sync selection: center Player View on the token the DM selected.
  // Never apply while we are still hydrating a saved/default camera for this map.
  useEffect(() => {
    if (!playerViewConfig.syncSelection || !activeMap?.id) return;
    if (restoredForMapRef.current !== activeMap.id || isHydratingCameraRef.current) return;
    if (!dmSelectedTokenId || !transformApiRef.current) return;
    if (!rootRef.current || mapDimensions.width === 0 || mapDimensions.height === 0) return;
    const token = activeMap.tokens.find((t) => t.id === dmSelectedTokenId);
    if (!token) return;

    const rootRect = rootRef.current.getBoundingClientRect();
    if (!rootRect.width || !rootRect.height) return;

    const cur = transformApiRef.current.state;
    const rawScale = playerViewConfig.syncZoom
      ? dmCamera.scale
      : (cur?.scale ?? 1);
    const scale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1;

    const tokenX = (token.x / 100) * mapDimensions.width;
    const tokenY = (token.y / 100) * mapDimensions.height;

    const scaledMapW = mapDimensions.width * scale;
    const scaledMapH = mapDimensions.height * scale;

    let targetX = rootRect.width / 2 - tokenX * scale;
    let targetY = rootRect.height / 2 - tokenY * scale;

    if (scaledMapW <= rootRect.width) {
      targetX = (rootRect.width - scaledMapW) / 2;
    } else {
      const minX = rootRect.width - scaledMapW;
      const maxX = 0;
      targetX = Math.min(maxX, Math.max(minX, targetX));
    }
    if (scaledMapH <= rootRect.height) {
      targetY = (rootRect.height - scaledMapH) / 2;
    } else {
      const minY = rootRect.height - scaledMapH;
      const maxY = 0;
      targetY = Math.min(maxY, Math.max(minY, targetY));
    }

    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return;

    transformApiRef.current.setTransform(targetX, targetY, scale, 320, 'easeOut');
    log('sync:player', { mapId: activeMap.id, type: 'selection', tokenId: dmSelectedTokenId });
  }, [
    dmSelectedTokenId,
    playerViewConfig.syncSelection,
    playerViewConfig.syncZoom,
    activeMap?.id,
    activeMap?.tokens,
    mapDimensions.width,
    mapDimensions.height,
    dmCamera.scale,
  ]);

  const gridConfig = useMemo((): GridConfig => ({
    type: showGrid ? 'square' : 'none',
    cellSize: gridSize,
    offsetX: gridOffsetX,
    offsetY: gridOffsetY,
    mapWidth: mapDimensions.width,
    mapHeight: mapDimensions.height,
    feetPerCell: 5,
  }), [showGrid, gridSize, gridOffsetX, gridOffsetY, mapDimensions]);

  // Narrative overlay component
  const renderNarrative = () => {
    if (!(narrativeVisible || narrativeFading) || !narrativeImage) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700"
        style={{ opacity: narrativeVisible && !narrativeFading ? 1 : 0 }}
      >
        <img src={narrativeImage} alt="Narrativa" className="max-w-full max-h-full object-contain" />
        {narrativeText && (
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-white text-2xl font-medium text-center max-w-3xl mx-auto leading-relaxed">
              {narrativeText}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Players never see hidden tokens.
  const visibleTokens = tokens.filter((t) => !t.hidden);

  if (!mapImage) {
    return (
      <div ref={rootRef} className="h-screen w-screen bg-black flex items-center justify-center">
        {renderNarrative()}
        <div className="text-center text-white/40 space-y-4">
          <div className="text-6xl">🎲</div>
          <p className="text-xl font-medium">Esperando al DM...</p>
          <p className="text-sm text-white/25">La vista se actualizará automáticamente cuando el DM cargue un mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="h-screen w-screen overflow-hidden bg-black relative">
      {renderNarrative()}

      <div className="h-full w-full" style={{ visibility: isViewReady ? 'visible' : 'hidden' }}>
        <TransformWrapper
          key={activeMap?.id ?? 'no-map'}
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          centerOnInit={false}
          limitToBounds={true}
          smooth
          onInit={(ref) => {
            transformApiRef.current = ref as any;
            setTransformReadyMapId(activeMap?.id ?? null);
          }}
          onZoom={(ref) => { transformApiRef.current = ref as any; }}
          onPanning={(ref) => { transformApiRef.current = ref as any; }}
          onTransformed={(ref, state) => {
            transformApiRef.current = ref as any;
            if (activeMap?.id && restoredForMapRef.current === activeMap.id && !isHydratingCameraRef.current) {
              savePlayerCamera(activeMap.id, {
                positionX: state.positionX,
                positionY: state.positionY,
                scale: state.scale,
              });
            }
          }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%' }}
          >
            <div ref={mapContainerRef} className="relative">
            <img
              src={mapImage}
              alt="Mapa"
              className="block select-none pointer-events-none"
              style={{ maxWidth: 'none', maxHeight: 'none' }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setMapDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                setImageReadyMapId(activeMap?.id ?? null);
              }}
            />

            {showGrid && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <pattern
                    id="player-grid"
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
                <rect width="100%" height="100%" fill="url(#player-grid)" />
              </svg>
            )}

            {mapDimensions.width > 0 && (
              <CellStateOverlay
                gridConfig={gridConfig}
                cellStates={cellStates}
                editMode={false}
                brushState="blocked"
                onCellClick={() => {}}
              />
            )}

            {fogEnabled && mapDimensions.width > 0 && (
              <FogOfWar
                key={mapImage}
                width={mapDimensions.width}
                height={mapDimensions.height}
                enabled={false}
                brushSize={50}
                fogData={fogData}
                onFogChange={() => {}}
                fogTool="brush"
                fogMode="reveal"
                opacity={1}
                onReady={() => setFogReadyMapId(activeMap?.id ?? null)}
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
              />
            )}

            {visibleTokens.map(token => (
              <Token
                key={token.id}
                {...token}
                isSelected={false}
                isActiveInitiative={token.id === activeInitiativeTokenId}
                showHiddenStyle={false}
                onMove={() => {}}
                onClick={() => {}}
                onDelete={() => {}}
                onMarkDead={() => {}}
                onRotate={() => {}}
                mapContainerRef={mapContainerRef}
              />
            ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {!isViewReady && <div className="absolute inset-0 z-20 bg-black" aria-hidden="true" />}

      {isViewReady && (
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white/50 hover:text-white transition-all z-10"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};

export default PlayerView;
