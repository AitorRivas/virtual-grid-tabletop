import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Token } from '@/components/Token';
import { FogOfWar } from '@/components/FogOfWar';

import { NarrativeLight } from '@/components/NarrativeLight';
import { CellStateOverlay } from '@/components/CellStateOverlay';
import { useGameState } from '@/hooks/useGameState';
import { GridConfig } from '@/lib/gridEngine/types';
import { Maximize, Minimize } from 'lucide-react';

const PlayerView = () => {
  const {
    activeMap,
    narrativeOverlay,
    narrativeLight,
    activeInitiativeTokenId,
    playerViewConfig,
    dmCamera,
    dmSelectedTokenId,
  } = useGameState();
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const transformApiRef = useRef<{
    setTransform: (x: number, y: number, scale: number, time?: number, easing?: string) => void;
    state: { positionX: number; positionY: number; scale: number };
  } | null>(null);

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

  // Reset dimensions when map image changes
  useEffect(() => {
    if (mapImage !== prevMapImageRef.current) {
      setMapDimensions({ width: 0, height: 0 });
      prevMapImageRef.current = mapImage;
    }
  }, [mapImage]);

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
  // Smoothly animate using react-zoom-pan-pinch's setTransform with duration.
  useEffect(() => {
    if (!transformApiRef.current) return;
    if (!playerViewConfig.syncCamera && !playerViewConfig.syncZoom) return;
    if (dmCamera.mapId && dmCamera.mapId !== activeMap?.id) return;

    const cur = transformApiRef.current.state;
    const targetX = playerViewConfig.syncCamera ? dmCamera.positionX : cur.positionX;
    const targetY = playerViewConfig.syncCamera ? dmCamera.positionY : cur.positionY;
    const targetScale = playerViewConfig.syncZoom ? dmCamera.scale : cur.scale;

    transformApiRef.current.setTransform(targetX, targetY, targetScale, 220, 'easeOut');
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
  useEffect(() => {
    if (!playerViewConfig.syncSelection) return;
    if (!dmSelectedTokenId || !transformApiRef.current) return;
    const token = activeMap?.tokens.find((t) => t.id === dmSelectedTokenId);
    if (!token || !mapContainerRef.current || mapDimensions.width === 0) return;

    // Token x/y are stored as percentages (0-1) of the map's natural size.
    const tokenX = token.x * mapDimensions.width;
    const tokenY = token.y * mapDimensions.height;

    const wrapper = mapContainerRef.current.parentElement?.parentElement;
    const wrapperRect = wrapper?.getBoundingClientRect();
    if (!wrapperRect) return;

    const cur = transformApiRef.current.state;
    const scale = playerViewConfig.syncZoom ? dmCamera.scale : cur.scale;
    const targetX = wrapperRect.width / 2 - tokenX * scale;
    const targetY = wrapperRect.height / 2 - tokenY * scale;

    transformApiRef.current.setTransform(targetX, targetY, scale, 320, 'easeOut');
  }, [
    dmSelectedTokenId,
    playerViewConfig.syncSelection,
    playerViewConfig.syncZoom,
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

  if (!mapImage) {
    return (
      <div ref={rootRef} className="h-screen w-screen bg-black flex items-center justify-center">
        {renderNarrative()}
        <div className="text-center text-white/40 space-y-4">
          <div className="text-6xl">🎲</div>
          <p className="text-xl font-medium">Esperando al GM...</p>
          <p className="text-sm text-white/25">La vista se actualizará automáticamente cuando el GM cargue un mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="h-screen w-screen overflow-hidden bg-black relative">
      {renderNarrative()}

      <TransformWrapper
        key={activeMap?.id ?? 'no-map'}
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        centerOnInit
        limitToBounds={true}
        smooth
        onInit={(ref) => { transformApiRef.current = ref as any; }}
        onZoom={(ref) => { transformApiRef.current = ref as any; }}
        onPanning={(ref) => { transformApiRef.current = ref as any; }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

            {tokens.map(token => (
              <Token
                key={token.id}
                {...token}
                isSelected={false}
                isActiveInitiative={token.id === activeInitiativeTokenId}
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

      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white/50 hover:text-white transition-all z-10"
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PlayerView;
