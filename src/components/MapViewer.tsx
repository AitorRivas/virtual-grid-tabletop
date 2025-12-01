import { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import { Token } from './Token';
import { MapControls } from './MapControls';
import { TokenToolbar } from './TokenToolbar';
import { DiceRoller } from './DiceRoller';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

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
}

export const MapViewer = () => {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [defaultTokenSize, setDefaultTokenSize] = useState(50);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [newTokenColor, setNewTokenColor] = useState<TokenColor>('red');
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenSize, setNewTokenSize] = useState(50);
  const [pendingTokenPosition, setPendingTokenPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Combat mode state
  const [combatMode, setCombatMode] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
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
    };

    setTokens([...tokens, newToken]);
    setPendingTokenPosition(null);
    setNewTokenName('');
    toast.success('Token añadido');
  };

  const cancelAddToken = () => {
    setPendingTokenPosition(null);
    setNewTokenName('');
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
    const targetToken = tokens.find(t => t.id === id);
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

  const handleNextTurn = () => {
    if (combatOrder.length === 0) return;
    setCurrentTurnIndex((prev) => (prev + 1) % combatOrder.length);
    const nextToken = combatOrder[(currentTurnIndex + 1) % combatOrder.length];
    if (nextToken) {
      toast.success(`Turno de ${nextToken.name}`);
    }
  };

  const handlePrevTurn = () => {
    if (combatOrder.length === 0) return;
    setCurrentTurnIndex((prev) => (prev - 1 + combatOrder.length) % combatOrder.length);
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
            onToggleCondition={handleToggleCondition}
            combatMode={combatMode}
            currentTurnTokenId={currentTurnTokenId}
            combatOrder={combatOrder}
            onStartCombat={handleStartCombat}
            onEndCombat={handleEndCombat}
            onNextTurn={handleNextTurn}
            onPrevTurn={handlePrevTurn}
            defaultTokenSize={defaultTokenSize}
            onDefaultTokenSizeChange={setDefaultTokenSize}
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
              onUploadClick={() => fileInputRef.current?.click()}
              hasMap={!!mapImage}
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
                <TransformWrapper
                  initialScale={1}
                  minScale={0.1}
                  maxScale={10}
                  centerOnInit
                  limitToBounds={false}
                  panning={{ disabled: isAddingToken }}
                >
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
                      style={{ cursor: isAddingToken ? 'crosshair' : 'grab' }}
                      onClick={handleMapClick}
                    >
                      <img
                        src={mapImage}
                        alt="Mapa de juego"
                        className="block select-none pointer-events-none"
                        style={{ maxWidth: 'none', maxHeight: 'none' }}
                        draggable={false}
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
                                stroke="hsl(var(--grid-line))"
                                strokeWidth="1"
                                opacity="0.3"
                              />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                      )}

                      {/* Tokens */}
                      {tokens.map(token => (
                        <Token
                          key={token.id}
                          {...token}
                          isSelected={selectedToken === token.id}
                          isCurrentTurn={combatMode && token.id === currentTurnTokenId}
                          combatMode={combatMode}
                          onMove={handleTokenMove}
                          onClick={() => setSelectedToken(token.id)}
                          onDelete={() => handleDeleteToken(token.id)}
                          onMarkDead={() => handleStatusChange(token.id, 'dead')}
                          mapContainerRef={mapContainerRef}
                        />
                      ))}
                    </div>
                  </TransformComponent>
                </TransformWrapper>
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
              
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Tamaño: {newTokenSize}px
                </label>
                <Slider
                  value={[newTokenSize]}
                  onValueChange={(value) => setNewTokenSize(value[0])}
                  min={20}
                  max={200}
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
    </div>
  );
};
