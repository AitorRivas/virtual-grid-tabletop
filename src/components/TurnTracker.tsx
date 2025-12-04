import { TokenData } from './MapViewer';
import { Swords, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface TurnTrackerProps {
  combatOrder: TokenData[];
  currentTurnTokenId: string | null;
  onNextTurn: () => void;
  onPrevTurn: () => void;
}

const tokenColorClasses: Record<string, string> = {
  red: 'bg-token-red',
  blue: 'bg-token-blue',
  green: 'bg-token-green',
  yellow: 'bg-token-yellow',
  purple: 'bg-token-purple',
  orange: 'bg-token-orange',
  pink: 'bg-token-pink',
  cyan: 'bg-token-cyan',
  black: 'bg-gray-800',
};

export const TurnTracker = ({ 
  combatOrder, 
  currentTurnTokenId, 
  onNextTurn, 
  onPrevTurn 
}: TurnTrackerProps) => {
  if (combatOrder.length === 0) return null;

  const currentIndex = combatOrder.findIndex(t => t.id === currentTurnTokenId);
  const nextIndex = (currentIndex + 1) % combatOrder.length;
  const currentToken = combatOrder[currentIndex];
  const nextToken = combatOrder[nextIndex];

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4 pb-2 border-b border-border">
        <Swords className="w-5 h-5 text-destructive" />
        <h3 className="font-bold text-foreground">Combate</h3>
      </div>

      {/* Current Turn - Big */}
      {currentToken && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground text-center mb-2">TURNO ACTUAL</p>
          <div className="flex items-center gap-3 p-3 bg-primary/20 border-2 border-primary rounded-lg">
            <div 
              className={`w-12 h-12 rounded-full ${tokenColorClasses[currentToken.color]} border-3 border-primary shadow-lg flex items-center justify-center text-white font-bold text-lg`}
            >
              {currentToken.initiative}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-foreground truncate">{currentToken.name}</p>
              <p className="text-xs text-muted-foreground">Iniciativa: {currentToken.initiative}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Up */}
      {nextToken && nextToken.id !== currentToken?.id && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground text-center mb-2">SIGUIENTE</p>
          <div className="flex items-center gap-2 p-2 bg-secondary/50 border border-border rounded-lg opacity-80">
            <div 
              className={`w-8 h-8 rounded-full ${tokenColorClasses[nextToken.color]} border-2 border-border flex items-center justify-center text-white font-bold text-sm`}
            >
              {nextToken.initiative}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{nextToken.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Turn Controls */}
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

      {/* Initiative Order - Small List */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Orden de iniciativa:</p>
        <div className="flex flex-wrap gap-1">
          {combatOrder.map((token, index) => (
            <span
              key={token.id}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
                token.id === currentTurnTokenId
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${tokenColorClasses[token.color]}`} />
              {index + 1}. {token.name.slice(0, 10)}{token.name.length > 10 ? '…' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
