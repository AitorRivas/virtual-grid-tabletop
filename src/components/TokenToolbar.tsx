import { Plus, Trash2, Users, Swords, ChevronLeft, ChevronRight, Skull, RotateCcw, Ruler } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Slider } from './ui/slider';
import { TokenColor, TokenData, TokenStatus } from './MapViewer';

interface TokenToolbarProps {
  selectedColor: TokenColor;
  onColorChange: (color: TokenColor) => void;
  isAddingToken: boolean;
  onToggleAddToken: () => void;
  onClearAll: () => void;
  tokens: TokenData[];
  selectedToken: string | null;
  onSelectToken: (id: string) => void;
  onDeleteToken: (id: string) => void;
  onTokenNameChange: (id: string, name: string) => void;
  onInitiativeChange: (id: string, initiative: number) => void;
  onStatusChange: (id: string, status: TokenStatus) => void;
  onTokenSizeChange: (id: string, size: number) => void;
  combatMode: boolean;
  currentTurnTokenId: string | null;
  combatOrder: TokenData[];
  onStartCombat: () => void;
  onEndCombat: () => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  defaultTokenSize: number;
  onDefaultTokenSizeChange: (size: number) => void;
}

const tokenColors: { color: TokenColor; label: string; class: string }[] = [
  { color: 'red', label: 'Rojo', class: 'bg-token-red' },
  { color: 'blue', label: 'Azul', class: 'bg-token-blue' },
  { color: 'green', label: 'Verde', class: 'bg-token-green' },
  { color: 'yellow', label: 'Amarillo', class: 'bg-token-yellow' },
  { color: 'purple', label: 'Morado', class: 'bg-token-purple' },
  { color: 'orange', label: 'Naranja', class: 'bg-token-orange' },
  { color: 'pink', label: 'Rosa', class: 'bg-token-pink' },
  { color: 'cyan', label: 'Cian', class: 'bg-token-cyan' },
];

export const TokenToolbar = ({
  selectedColor,
  onColorChange,
  isAddingToken,
  onToggleAddToken,
  onClearAll,
  tokens,
  selectedToken,
  onSelectToken,
  onDeleteToken,
  onTokenNameChange,
  onInitiativeChange,
  onStatusChange,
  onTokenSizeChange,
  combatMode,
  currentTurnTokenId,
  combatOrder,
  onStartCombat,
  onEndCombat,
  onNextTurn,
  onPrevTurn,
  defaultTokenSize,
  onDefaultTokenSizeChange,
}: TokenToolbarProps) => {
  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-card-foreground">Tokens</h2>
        </div>

        {/* Add token button */}
        <Button
          onClick={onToggleAddToken}
          variant={isAddingToken ? "default" : "secondary"}
          className="w-full gap-2 mb-4"
          disabled={combatMode}
        >
          <Plus className="w-4 h-4" />
          {isAddingToken ? 'Haz clic en el mapa' : 'Añadir token'}
        </Button>

        {/* Color picker */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-card-foreground">
            Color del token:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {tokenColors.map(({ color, label, class: colorClass }) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-full aspect-square rounded-full ${colorClass} border-2 ${
                  selectedColor === color ? 'border-primary' : 'border-transparent'
                } hover:scale-110 transition-transform`}
                title={label}
              />
            ))}
          </div>
        </div>

        {/* Default token size slider */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Tamaño por defecto: {defaultTokenSize}px
          </label>
          <Slider
            value={[defaultTokenSize]}
            onValueChange={(value) => onDefaultTokenSizeChange(value[0])}
            min={20}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        {tokens.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="destructive"
            size="sm"
            className="w-full gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar todos
          </Button>
        )}
      </div>

      {/* Combat Mode Section */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2 mb-3">
          <Swords className="w-5 h-5 text-destructive" />
          <h3 className="font-bold text-card-foreground">Modo Combate</h3>
        </div>

        {!combatMode ? (
          <Button
            onClick={onStartCombat}
            variant="default"
            className="w-full gap-2 bg-destructive hover:bg-destructive/90"
            disabled={tokens.filter(t => t.status === 'active').length === 0}
          >
            <Swords className="w-4 h-4" />
            Iniciar Combate
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Current turn display */}
            {currentTurnTokenId && (
              <div className="bg-primary/20 border border-primary/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Turno actual</p>
                <p className="font-bold text-primary">
                  {combatOrder.find(t => t.id === currentTurnTokenId)?.name}
                </p>
              </div>
            )}

            {/* Turn navigation */}
            <div className="flex gap-2">
              <Button
                onClick={onPrevTurn}
                variant="secondary"
                size="sm"
                className="flex-1 gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                onClick={onNextTurn}
                variant="default"
                size="sm"
                className="flex-1 gap-1"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={onEndCombat}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              Finalizar Combate
            </Button>
          </div>
        )}
      </div>

      {/* Token list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay tokens en el mapa
            </div>
          ) : (
            <>
              {/* Combat order header */}
              {combatMode && combatOrder.length > 0 && (
                <div className="mb-3 pb-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Orden de iniciativa:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {combatOrder.map((token, index) => (
                      <span
                        key={token.id}
                        className={`text-xs px-2 py-1 rounded ${
                          token.id === currentTurnTokenId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {index + 1}. {token.name} ({token.initiative})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tokens.map((token) => (
                <div
                  key={token.id}
                  className={`p-3 rounded-lg border ${
                    token.id === currentTurnTokenId
                      ? 'border-primary bg-primary/10'
                      : selectedToken === token.id
                      ? 'border-primary bg-secondary'
                      : token.status !== 'active'
                      ? 'border-border bg-secondary/30 opacity-60'
                      : 'border-border bg-secondary/50'
                  } hover:bg-secondary transition-colors cursor-pointer`}
                  onClick={() => onSelectToken(token.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full ${
                        token.status === 'dead' 
                          ? 'bg-gray-800' 
                          : tokenColors.find((c) => c.color === token.color)?.class
                      } border-2 border-foreground/30 flex-shrink-0 flex items-center justify-center`}
                    >
                      {token.status === 'dead' && <Skull className="w-4 h-4 text-white" />}
                    </div>
                    <Input
                      value={token.name}
                      onChange={(e) => onTokenNameChange(token.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-8 bg-background"
                    />
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteToken(token.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Initiative, size and status controls */}
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Iniciativa:</label>
                        <Input
                          type="number"
                          value={token.initiative}
                          onChange={(e) => onInitiativeChange(token.id, parseInt(e.target.value) || 0)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm bg-background"
                          disabled={combatMode}
                        />
                      </div>
                      
                      {token.status !== 'active' ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(token.id, 'active');
                          }}
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Revivir
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(token.id, 'dead');
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs hover:bg-gray-700 hover:text-white"
                        >
                          <Skull className="w-3 h-3" />
                          Muerto
                        </Button>
                      )}
                    </div>
                    
                    {/* Individual token size */}
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        Tamaño: {token.size}px
                      </label>
                      <Slider
                        value={[token.size]}
                        onValueChange={(value) => onTokenSizeChange(token.id, value[0])}
                        onClick={(e) => e.stopPropagation()}
                        min={20}
                        max={200}
                        step={5}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
