import { useState, useRef, useEffect, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import { Token } from './Token';
import { MapControls } from './MapControls';
import { TokenToolbar } from './TokenToolbar';
import { DiceRoller } from './DiceRoller';
import { AmbientPlayer } from './AmbientPlayer';
import { FogOfWar } from './FogOfWar';
import { CellStateOverlay } from './CellStateOverlay';
import { GridCalibrator } from './GridCalibrator';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Character, Monster, getModifier } from '@/types/dnd';
import { Film, X, Upload } from 'lucide-react';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { GridConfig, CellState, CREATURE_SIZE_CELLS } from '@/lib/gridEngine/types';
import { percentToCell, cellToPercent, snapToGrid } from '@/lib/gridEngine';


export type TokenColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan' | 'black';
export type TokenStatus = 'active' | 'dead' | 'inactive';

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
  // Grid engine properties
  speedFeet?: number;
  sizeInCells?: number;
}

export const MapViewer = () => {
  const { 
    mapImage: savedMapImage,
    tokens: savedTokens,
    showGrid: savedShowGrid,
    gridSize: savedGridSize,
    gridColor: savedGridColor,
    gridLineWidth: savedGridLineWidth,
    fogEnabled: savedFogEnabled,
    fogData: savedFogData,
    gridCellSize: savedGridCellSize,
    gridOffsetX: savedGridOffsetX,
    gridOffsetY: savedGridOffsetY,
    cellStates: savedCellStates,
    isLoaded,
    updateSession,
    clearSession,
  } = useSessionStorage();

  const [mapImage, setMapImage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [gridColor, setGridColor] = useState('#000000');
  const [gridLineWidth, setGridLineWidth] = useState(1);
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
  
  // Cinema mode state
  const [cinemaMode, setCinemaMode] = useState(false);

  // Fog of war state
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogEditMode, setFogEditMode] = useState(false);
  const [fogBrushSize, setFogBrushSize] = useState(50);
  const [fogData, setFogData] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // Grid engine state - uses gridSize as the single source of truth for cell size
  const [gridOffsetX, setGridOffsetX] = useState(0);
  const [gridOffsetY, setGridOffsetY] = useState(0);
  const [cellStates, setCellStates] = useState<Record<string, CellState>>({});
  const [cellEditMode, setCellEditMode] = useState(false);
  const [cellBrushState, setCellBrushState] = useState<CellState>('blocked');
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Grid config memoized - uses gridSize for both visual grid and movement engine
  const gridConfig = useMemo((): GridConfig => ({
    type: showGrid ? 'square' : 'none',
    cellSize: gridSize,
    offsetX: gridOffsetX,
    offsetY: gridOffsetY,
    mapWidth: mapDimensions.width,
    mapHeight: mapDimensions.height,
    feetPerCell: 5,
  }), [showGrid, gridSize, gridOffsetX, gridOffsetY, mapDimensions]);

  // Load saved session on mount
  useEffect(() => {
    if (isLoaded) {
      setMapImage(savedMapImage);
      setTokens(savedTokens);
      setShowGrid(savedShowGrid);
      setGridSize(savedGridSize);
      setGridColor(savedGridColor);
      setGridLineWidth(savedGridLineWidth);
      setFogEnabled(savedFogEnabled);
      setFogData(savedFogData);
      if (savedGridCellSize > 0) {
        setGridSize(savedGridCellSize);
      }
      setGridOffsetX(savedGridOffsetX);
      setGridOffsetY(savedGridOffsetY);
      setCellStates(savedCellStates);
      if (savedMapImage) {
        toast.success('Sesión restaurada');
      }
    }
  }, [isLoaded]);

  // Save session when state changes
  useEffect(() => {
    if (isLoaded) {
      updateSession({
        mapImage,
        tokens,
        showGrid,
        gridSize,
        gridColor,
        gridLineWidth,
        fogEnabled,
        fogData,
        gridCellSize: gridSize,
        gridOffsetX,
        gridOffsetY,
        cellStates,
      });
    }
  }, [mapImage, tokens, showGrid, gridSize, gridColor, gridLineWidth, fogEnabled, fogData, gridOffsetX, gridOffsetY, cellStates, isLoaded, updateSession]);
  
  // Store zoom functions
  const zoomFunctionsRef = useRef<{
    setTransform: (x: number, y: number, scale: number) => void;
    state: { positionX: number; positionY: number; scale: number };
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 20MB.');
      return;
    }

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

    setTokens([...tokens, newToken]);
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
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, x, y } : token
    ));
  };

  const handleTokenRotation = (id: string, rotation: number) => {
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, rotation } : token
    ));
  };

  const handleTokenNameChange = (id: string, name: string) => {
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, name } : token
    ));
  };

  const handleStatusChange = (id: string, status: TokenStatus) => {
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, status } : token
    ));
    
    if (status !== 'active') {
      toast.success(status === 'dead' ? 'Token marcado como muerto' : 'Token marcado como inactivo');
    }
  };

  const handleTokenSizeChange = (id: string, size: number) => {
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, size } : token
    ));
  };

  const handleHpChange = (id: string, hpCurrent: number, hpMax: number) => {
    setTokens(tokens.map(token => {
      if (token.id !== id) return token;
      const newHpCurrent = Math.max(0, Math.min(hpCurrent, hpMax));
      const newStatus = newHpCurrent <= 0 ? 'dead' : token.status === 'dead' ? 'active' : token.status;
      return { ...token, hpCurrent: newHpCurrent, hpMax, status: newStatus };
    }));
  };

  const handleToggleCondition = (tokenId: string, conditionId: string) => {
    setTokens(tokens.map(token => {
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
    setTokens(tokens.filter(token => token.id !== id));
    setSelectedToken(null);
    toast.success('Token eliminado');
  };

  const handleClearAll = () => {
    setTokens([]);
    setSelectedToken(null);
    toast.success('Todos los tokens eliminados');
  };

  const handleClearSession = () => {
    setMapImage(null);
    setTokens([]);
    setSelectedToken(null);
    clearSession();
    toast.success('Sesión limpiada');
  };

  // Handle cell state painting
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

  // Handle grid calibration complete
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
    };
    setTokens([...tokens, newToken]);
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
    };
    setTokens([...tokens, newToken]);
    toast.success(`${monster.name} añadido al mapa`);
  };

  // Render map content (shared between normal and cinema mode)
  const renderMapContent = () => (
    <TransformWrapper
      initialScale={1}
      minScale={0.1}
      maxScale={10}
      centerOnInit
      limitToBounds={false}
      panning={{ disabled: isAddingToken }}
      onZoom={(ref) => {
        setZoomLevel(ref.state.scale);
        zoomFunctionsRef.current = ref;
      }}
      onPanning={(ref) => {
        zoomFunctionsRef.current = ref;
      }}
      onInit={(ref) => {
        zoomFunctionsRef.current = ref;
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
                style={{
                  width: '100%',
                  height: '100%',
                }}
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

            {/* Cell state overlay (blocked/difficult terrain) */}
            {mapDimensions.width > 0 && (
              <CellStateOverlay
                gridConfig={gridConfig}
                cellStates={cellStates}
                editMode={cellEditMode}
                brushState={cellBrushState}
                onCellClick={handleCellStateClick}
              />
            )}

            {/* Fog of War layer */}
            {fogEnabled && mapDimensions.width > 0 && (
              <FogOfWar
                width={mapDimensions.width}
                height={mapDimensions.height}
                enabled={fogEditMode}
                brushSize={fogBrushSize}
                fogData={fogData}
                onFogChange={setFogData}
              />
            )}

            {/* Tokens */}
            {tokens.map(token => (
              <Token
                key={token.id}
                {...token}
                imageUrl={token.imageUrl}
                rotation={token.rotation}
                isSelected={selectedToken === token.id}
                onMove={handleTokenMove}
                onClick={() => setSelectedToken(token.id)}
                onDelete={() => handleDeleteToken(token.id)}
                onMarkDead={() => handleStatusChange(token.id, 'dead')}
                onRotate={handleTokenRotation}
                mapContainerRef={mapContainerRef}
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
        {/* Top black bar */}
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

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {renderMapContent()}
        </div>

        {/* Bottom black bar */}
        <div className="h-16 bg-black" />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Ambient Player */}
        <AmbientPlayer />
      </div>
    );
  }

  // Normal View
  return (
    <div className="h-screen w-screen overflow-hidden bg-board-bg">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
          <TokenToolbar
            selectedColor={newTokenColor}
            onColorChange={setNewTokenColor}
            isAddingToken={isAddingToken}
            onToggleAddToken={() => setIsAddingToken(!isAddingToken)}
            onClearAll={handleClearAll}
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
            defaultTokenSize={defaultTokenSize}
            onDefaultTokenSizeChange={setDefaultTokenSize}
            onAddCharacterToMap={handleAddCharacterToMap}
            onAddMonsterToMap={handleAddMonsterToMap}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main viewer */}
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col h-full min-w-0 overflow-hidden">
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
                      Sube una imagen de hasta 20MB
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
        </ResizablePanel>
      </ResizablePanelGroup>

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

              {/* Image upload */}
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

      {/* Dice Roller */}
      <DiceRoller />

      {/* Ambient Player */}
      <AmbientPlayer />
    </div>
  );
};
