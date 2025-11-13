import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { TokenColor, TokenData } from './MapViewer';

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
        >
          <Plus className="w-4 h-4" />
          {isAddingToken ? 'Haz clic en el mapa' : 'Añadir token'}
        </Button>

        {/* Color picker */}
        <div className="space-y-2">
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

        {tokens.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="destructive"
            size="sm"
            className="w-full mt-4 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar todos
          </Button>
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
            tokens.map((token) => (
              <div
                key={token.id}
                className={`p-3 rounded-lg border ${
                  selectedToken === token.id
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-secondary/50'
                } hover:bg-secondary transition-colors cursor-pointer`}
                onClick={() => onSelectToken(token.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      tokenColors.find((c) => c.color === token.color)?.class
                    } border-2 border-foreground/30 flex-shrink-0`}
                  />
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
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
