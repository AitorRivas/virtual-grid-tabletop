import { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Token } from './Token';
import { MapControls } from './MapControls';
import { TokenToolbar } from './TokenToolbar';
import { toast } from 'sonner';

export type TokenColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan';

export interface TokenData {
  id: string;
  x: number;
  y: number;
  color: TokenColor;
  name: string;
}

export const MapViewer = () => {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [newTokenColor, setNewTokenColor] = useState<TokenColor>('red');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 20MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setMapImage(e.target?.result as string);
      toast.success('Mapa cargado correctamente');
    };
    reader.readAsDataURL(file);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isAddingToken) return;

    // Get click position relative to the image
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newToken: TokenData = {
      id: Date.now().toString(),
      x,
      y,
      color: newTokenColor,
      name: `Token ${tokens.length + 1}`,
    };

    setTokens([...tokens, newToken]);
    setIsAddingToken(false);
    toast.success('Token añadido');
  };

  const handleTokenMove = (id: string, x: number, y: number) => {
    // x and y are now percentages (0-100)
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, x, y } : token
    ));
  };

  const handleTokenNameChange = (id: string, name: string) => {
    setTokens(tokens.map(token => 
      token.id === id ? { ...token, name } : token
    ));
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

  return (
    <div className="flex h-screen bg-board-bg">
      {/* Sidebar */}
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
      />

      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
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
                  Sube una imagen JPG de hasta 20MB
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
              maxScale={5}
              centerOnInit
            >
              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass="w-full h-full"
              >
                <div
                  ref={mapContainerRef}
                  className="relative inline-block"
                  style={{ cursor: isAddingToken ? 'crosshair' : 'grab' }}
                >
                  <img
                    src={mapImage}
                    alt="Mapa de juego"
                    className="max-w-none select-none"
                    draggable={false}
                    onClick={handleMapClick}
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
                      onMove={handleTokenMove}
                      onClick={() => setSelectedToken(token.id)}
                      mapContainerRef={mapContainerRef}
                    />
                  ))}
                </div>
              </TransformComponent>
            </TransformWrapper>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
