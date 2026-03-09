import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Token } from '@/components/Token';
import { FogOfWar } from '@/components/FogOfWar';
import { CellStateOverlay } from '@/components/CellStateOverlay';
import { usePlayerBroadcastReceiver, PlayerViewState } from '@/hooks/usePlayerBroadcast';
import { GridConfig } from '@/lib/gridEngine/types';
import { Maximize, Minimize } from 'lucide-react';

const PlayerView = () => {
  const [state, setState] = useState<PlayerViewState | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Track previous narrative image for transition
  const [narrativeVisible, setNarrativeVisible] = useState(false);
  const [narrativeImage, setNarrativeImage] = useState<string | null>(null);
  const [narrativeText, setNarrativeText] = useState('');
  const [narrativeFading, setNarrativeFading] = useState(false);

  const prevMapImageRef = useRef<string | null>(null);

  usePlayerBroadcastReceiver(useCallback((s: PlayerViewState) => {
    // Reset map dimensions when map image changes to force correct FogOfWar sizing
    if (s.mapImage !== prevMapImageRef.current) {
      setMapDimensions({ width: 0, height: 0 });
      prevMapImageRef.current = s.mapImage;
    }
    setState(s);
  }, []));

  // Handle narrative overlay transitions
  useEffect(() => {
    if (!state) return;
    const overlay = state.narrativeOverlay;

    if (overlay.visible && overlay.image) {
      // Show narrative with fade-in
      setNarrativeImage(overlay.image);
      setNarrativeText(overlay.text);
      setNarrativeFading(false);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setNarrativeVisible(true));
    } else if (!overlay.visible && narrativeVisible) {
      // Fade out
      setNarrativeFading(true);
      setNarrativeVisible(false);
      setTimeout(() => {
        setNarrativeFading(false);
        setNarrativeImage(null);
        setNarrativeText('');
      }, 800);
    }
  }, [state?.narrativeOverlay?.visible, state?.narrativeOverlay?.image]);

  // Listen for fullscreen changes
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

  const gridConfig = useMemo((): GridConfig => ({
    type: state?.showGrid ? 'square' : 'none',
    cellSize: state?.gridSize ?? 50,
    offsetX: state?.gridOffsetX ?? 0,
    offsetY: state?.gridOffsetY ?? 0,
    mapWidth: mapDimensions.width,
    mapHeight: mapDimensions.height,
    feetPerCell: 5,
  }), [state?.showGrid, state?.gridSize, state?.gridOffsetX, state?.gridOffsetY, mapDimensions]);

  if (!state || !state.mapImage) {
    return (
      <div ref={rootRef} className="h-screen w-screen bg-black flex items-center justify-center">
        {/* Narrative overlay even without map */}
        {(narrativeVisible || narrativeFading) && narrativeImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700"
            style={{ opacity: narrativeVisible && !narrativeFading ? 1 : 0 }}
          >
            <img
              src={narrativeImage}
              alt="Narrativa"
              className="max-w-full max-h-full object-contain"
            />
            {narrativeText && (
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-2xl font-medium text-center max-w-3xl mx-auto leading-relaxed">
                  {narrativeText}
                </p>
              </div>
            )}
          </div>
        )}

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
      {/* Narrative overlay */}
      {(narrativeVisible || narrativeFading) && narrativeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700"
          style={{ opacity: narrativeVisible && !narrativeFading ? 1 : 0 }}
        >
          <img
            src={narrativeImage}
            alt="Narrativa"
            className="max-w-full max-h-full object-contain"
          />
          {narrativeText && (
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
              <p className="text-white text-2xl font-medium text-center max-w-3xl mx-auto leading-relaxed">
                {narrativeText}
              </p>
            </div>
          )}
        </div>
      )}

      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        centerOnInit
        limitToBounds={false}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div ref={mapContainerRef} className="relative">
            <img
              src={state.mapImage}
              alt="Mapa"
              className="block select-none pointer-events-none"
              style={{ maxWidth: 'none', maxHeight: 'none' }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setMapDimensions({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />

            {/* Grid */}
            {state.showGrid && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <pattern
                    id="player-grid"
                    width={state.gridSize}
                    height={state.gridSize}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${state.gridOffsetX} ${state.gridOffsetY})`}
                  >
                    <path
                      d={`M ${state.gridSize} 0 L 0 0 0 ${state.gridSize}`}
                      fill="none"
                      stroke={state.gridColor}
                      strokeWidth={state.gridLineWidth}
                      opacity="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#player-grid)" />
              </svg>
            )}

            {/* Cell states */}
            {mapDimensions.width > 0 && (
              <CellStateOverlay
                gridConfig={gridConfig}
                cellStates={state.cellStates}
                editMode={false}
                brushState="blocked"
                onCellClick={() => {}}
              />
            )}

            {/* Fog of War */}
            {state.fogEnabled && mapDimensions.width > 0 && (
              <FogOfWar
                key={state.mapImage}
                width={mapDimensions.width}
                height={mapDimensions.height}
                enabled={false}
                brushSize={50}
                fogData={state.fogData}
                onFogChange={() => {}}
              />
            )}

            {/* Tokens (read-only) */}
            {state.tokens.map(token => (
              <Token
                key={token.id}
                {...token}
                isSelected={false}
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

      {/* Fullscreen toggle */}
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
