import { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import { Token } from './Token';
import { MapControls } from './MapControls';
import { TokenToolbar } from './TokenToolbar';
import { DiceRoller } from './DiceRoller';
import { TurnTracker } from './TurnTracker';
import { AmbientPlayer } from './AmbientPlayer';
import { FogOfWar } from './FogOfWar';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Character, Monster, getModifier } from '@/types/dnd';
import { Film, X, Upload } from 'lucide-react';
import { useSessionStorage } from '@/hooks/useSessionStorage';

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
}

export const MapViewer = () => {
  const { 
    mapImage: savedMapImage,
    tokens: savedTokens,
    showGrid: savedShowGrid,
    gridSize: savedGridSize,
    gridColor: savedGridColor,
    gridLineWidth: savedGridLineWidth,
    combatMode: savedCombatMode,
    currentTurnIndex: savedCurrentTurnIndex,
    fogEnabled: savedFogEnabled,
    fogData: savedFogData,
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
  
  // Combat mode state
  const [combatMode, setCombatMode] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Fog of war state
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogEditMode, setFogEditMode] = useState(false);
  const [fogBrushSize, setFogBrushSize] = useState(50);
  const [fogData, setFogData] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // Load saved session on mount
  useEffect(() => {
    if (isLoaded) {
      setMapImage(savedMapImage);
      setTokens(savedTokens);
      setShowGrid(savedShowGrid);
      setGridSize(savedGridSize);
      setGridColor(savedGridColor);
      setGridLineWidth(savedGridLineWidth);
      setCombatMode(savedCombatMode);
      setCurrentTurnIndex(savedCurrentTurnIndex);
      setFogEnabled(savedFogEnabled);
      setFogData(savedFogData);
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
        combatMode,
        currentTurnIndex,
        fogEnabled,
        fogData,
      });
    }
  }, [mapImage, tokens, showGrid, gridSize, gridColor, gridLineWidth, combatMode, currentTurnIndex, fogEnabled, fogData, isLoaded, updateSession]);
  
  // Store zoom functions
  const zoomFunctionsRef = useRef<{
    setTransform: (x: number, y: number, scale: number) => void;
    state: { positionX: number; positionY: number; scale: number };
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Get tokens sorted by initiative (descending) for combat, excluding dead/inactive
  const combatOrder = [...tokens]
    .filter(t => t.status === 'active')
    .sort((a, b) => b.initiative - a.initiative);
  
  const currentTurnTokenId = combatMode && combatOrder.length > 0 
    ? combatOrder[currentTurnIndex % combatOrder.length]?.id 
    : null;

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
    // In combat mode, only allow moving the current turn token
    if (combatMode && id !== currentTurnTokenId) {
      toast.error('Solo puedes mover el token del turno actual');
      return;
    }
    
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

  const handleInitiativeChange = (id: string, initiative: number) => {
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, initiative } : token
    ));
  };

  const handleStatusChange = (id: string, status: TokenStatus) => {
    // Get current token info before changing
    const wasCurrentTurn = combatMode && id === currentTurnTokenId;
    
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, status } : token
    ));
    
    // If we're in combat and the token being marked dead was the current turn,
    // we need to adjust the index to stay on the same position (which will now be the next token)
    if (wasCurrentTurn && status !== 'active') {
      // The combatOrder will recalculate, but the index should stay the same
      // to point to what was the next token
      const newCombatOrder = tokens
        .filter(t => t.id !== id && t.status === 'active')
        .sort((a, b) => b.initiative - a.initiative);
      
      if (newCombatOrder.length > 0) {
        // Adjust index if it would be out of bounds
        setCurrentTurnIndex(prev => Math.min(prev, newCombatOrder.length - 1));
      }
    }
    
    if (status !== 'active') {
      toast.success(status === 'dead' ? 'Token eliminado del combate' : 'Token marcado como inactivo');
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
    setCurrentTurnIndex(0);
    toast.success('Todos los tokens eliminados');
  };

  const handleClearSession = () => {
    setMapImage(null);
    setTokens([]);
    setSelectedToken(null);
    setCurrentTurnIndex(0);
    setCombatMode(false);
    clearSession();
    toast.success('Sesión limpiada');
  };

  const animateToToken = (token: TokenData) => {
    if (!zoomFunctionsRef.current || !mapContainerRef.current) return;
    
    const { setTransform } = zoomFunctionsRef.current;
    const container = mapContainerRef.current;
    const parent = container.parentElement?.parentElement?.parentElement;
    if (!parent) return;
    
    // Get the actual image dimensions
    const img = container.querySelector('img');
    if (!img) return;
    
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Get viewport dimensions
    const viewportWidth = parent.clientWidth;
    const viewportHeight = parent.clientHeight;
    
    // Calculate token position in actual image pixels
    const tokenX = (token.x / 100) * imgWidth;
    const tokenY = (token.y / 100) * imgHeight;
    
    // Gentle zoom level
    const targetScale = 1.2;
    
    // Calculate offset to center the token
    const offsetX = (viewportWidth / 2) - (tokenX * targetScale);
    const offsetY = (viewportHeight / 2) - (tokenY * targetScale);
    
    setTransform(offsetX, offsetY, targetScale);
    setZoomLevel(targetScale);
  };

  const handleNextTurn = () => {
    if (combatOrder.length === 0) return;
    const nextIndex = (currentTurnIndex + 1) % combatOrder.length;
    setCurrentTurnIndex(nextIndex);
    const nextToken = combatOrder[nextIndex];
    if (nextToken) {
      toast.success(`Turno de ${nextToken.name}`);
      // Animate to the next token
      setTimeout(() => animateToToken(nextToken), 100);
    }
  };

  const handlePrevTurn = () => {
    if (combatOrder.length === 0) return;
    const prevIndex = (currentTurnIndex - 1 + combatOrder.length) % combatOrder.length;
    setCurrentTurnIndex(prevIndex);
    const prevToken = combatOrder[prevIndex];
    if (prevToken) {
      // Animate to the previous token
      setTimeout(() => animateToToken(prevToken), 100);
    }
  };

  const handleStartCombat = () => {
    setCombatMode(true);
    setCurrentTurnIndex(0);
    if (combatOrder.length > 0) {
      toast.success(`¡Combate iniciado! Turno de ${combatOrder[0].name}`);
    }
  };

  const handleEndCombat = () => {
    setCombatMode(false);
    setCurrentTurnIndex(0);
    toast.success('Combate finalizado');
  };

  const handleAddCharacterToMap = (character: Character) => {
    const newToken: TokenData = {
      id: `char-${Date.now()}`,
      x: 50, // Center of map
      y: 50,
      color: character.token_color,
      name: character.name,
      size: character.token_size,
      initiative: getModifier(character.dexterity) + character.initiative_bonus,
      status: 'active',
      conditions: [],
      hpMax: character.hit_points_max,
      hpCurrent: character.hit_points_current ?? character.hit_points_max,
      imageUrl: character.image_url || undefined,
    };
    setTokens([...tokens, newToken]);
    toast.success(`${character.name} añadido al mapa`);
  };

  const handleAddMonsterToMap = (monster: Monster) => {
    const newToken: TokenData = {
      id: `monster-${Date.now()}`,
      x: 50,
      y: 50,
      color: monster.token_color,
      name: monster.name,
      size: monster.token_size,
      initiative: getModifier(monster.dexterity),
      status: 'active',
      conditions: [],
      hpMax: monster.hit_points,
      hpCurrent: monster.hit_points,
      imageUrl: monster.image_url || undefined,
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
                isCurrentTurn={combatMode && token.id === currentTurnTokenId}
                combatMode={combatMode}
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
          
          {/* Turn Tracker overlay in cinema mode */}
          {combatMode && combatOrder.length > 0 && (
            <div className="absolute top-4 right-4 z-20">
              <TurnTracker
                combatOrder={combatOrder}
                currentTurnTokenId={currentTurnTokenId}
                onNextTurn={handleNextTurn}
                onPrevTurn={handlePrevTurn}
              />
            </div>
          )}
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
            onInitiativeChange={handleInitiativeChange}
            onStatusChange={handleStatusChange}
            onTokenSizeChange={handleTokenSizeChange}
            onTokenRotationChange={handleTokenRotation}
            onToggleCondition={handleToggleCondition}
            onHpChange={handleHpChange}
            combatMode={combatMode}
            currentTurnTokenId={currentTurnTokenId}
            combatOrder={combatOrder}
            onStartCombat={handleStartCombat}
            onEndCombat={handleEndCombat}
            onNextTurn={handleNextTurn}
            onPrevTurn={handlePrevTurn}
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
                <>
                  {renderMapContent()}
                  
                  {/* Turn Tracker overlay */}
                  {combatMode && combatOrder.length > 0 && (
                    <div className="absolute top-4 right-4 z-20">
                      <TurnTracker
                        combatOrder={combatOrder}
                        currentTurnTokenId={currentTurnTokenId}
                        onNextTurn={handleNextTurn}
                        onPrevTurn={handlePrevTurn}
                      />
                    </div>
                  )}
                </>
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
