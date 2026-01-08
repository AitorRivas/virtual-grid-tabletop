import { useState, useCallback, useMemo } from 'react';
import { Dices, GripHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { useDraggable } from '@/hooks/useDraggable';

interface DiceType {
  sides: number;
  label: string;
  color: string;
}

const diceTypes: DiceType[] = [
  { sides: 4, label: 'd4', color: 'bg-token-green' },
  { sides: 6, label: 'd6', color: 'bg-token-blue' },
  { sides: 8, label: 'd8', color: 'bg-token-purple' },
  { sides: 10, label: 'd10', color: 'bg-token-orange' },
  { sides: 12, label: 'd12', color: 'bg-token-red' },
  { sides: 20, label: 'd20', color: 'bg-token-yellow' },
];

interface DiceResult {
  id: number;
  sides: number;
  result: number;
  isRolling: boolean;
}

const PANEL_WIDTH = 288; // w-72 = 18rem = 288px
const PANEL_HEIGHT = 320; // approximate height

export const DiceRoller = () => {
  const [results, setResults] = useState<DiceResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate safe position when expanding - memoized to avoid recreating on every render
  const defaultPosition = useMemo(() => {
    const x = Math.max(16, window.innerWidth - PANEL_WIDTH - 16);
    const y = Math.max(16, window.innerHeight - PANEL_HEIGHT - 100);
    return { x, y };
  }, []);
  
  const { position, isDragging, dragRef, handleMouseDown, resetPosition } = useDraggable({
    defaultPosition,
  });

  // Reset to safe position when minimized
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleExpand = useCallback(() => {
    resetPosition();
    setIsExpanded(true);
  }, [resetPosition]);

  const rollDice = (sides: number) => {
    const id = Date.now();
    const newResult: DiceResult = {
      id,
      sides,
      result: 1,
      isRolling: true,
    };

    setResults(prev => [newResult, ...prev.slice(0, 9)]);

    // Animate the roll
    let rollCount = 0;
    const maxRolls = 15;
    const interval = setInterval(() => {
      rollCount++;
      const randomResult = Math.floor(Math.random() * sides) + 1;
      
      setResults(prev => 
        prev.map(r => 
          r.id === id 
            ? { ...r, result: randomResult, isRolling: rollCount < maxRolls } 
            : r
        )
      );

      if (rollCount >= maxRolls) {
        clearInterval(interval);
      }
    }, 50);
  };

  const clearResults = () => {
    setResults([]);
  };

  const getDiceShape = (sides: number) => {
    switch (sides) {
      case 4:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon 
              points="50,10 90,85 10,85" 
              fill="currentColor" 
              className="text-token-green"
            />
          </svg>
        );
      case 6:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect 
              x="15" y="15" 
              width="70" height="70" 
              rx="8"
              fill="currentColor" 
              className="text-token-blue"
            />
          </svg>
        );
      case 8:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon 
              points="50,5 95,50 50,95 5,50" 
              fill="currentColor" 
              className="text-token-purple"
            />
          </svg>
        );
      case 10:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon 
              points="50,5 90,35 80,85 20,85 10,35" 
              fill="currentColor" 
              className="text-token-orange"
            />
          </svg>
        );
      case 12:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon 
              points="50,5 82,20 95,55 75,90 25,90 5,55 18,20" 
              fill="currentColor" 
              className="text-token-red"
            />
          </svg>
        );
      case 20:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon 
              points="50,5 85,25 95,60 75,90 25,90 5,60 15,25" 
              fill="currentColor" 
              className="text-token-yellow"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={dragRef}
      className="fixed z-50"
      style={{ 
        left: isExpanded ? position.x : 'auto',
        top: isExpanded ? position.y : 'auto',
        right: isExpanded ? 'auto' : '16px',
        bottom: isExpanded ? 'auto' : '16px',
      }}
    >
      {/* Toggle button */}
      {!isExpanded && (
        <Button
          onClick={handleExpand}
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <Dices className="w-6 h-6" />
        </Button>
      )}

      {/* Dice panel */}
      {isExpanded && (
        <div className="bg-card border border-border rounded-lg shadow-xl w-72">
          {/* Draggable header */}
          <div 
            className={`flex items-center justify-between p-3 border-b border-border cursor-move select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
              <Dices className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-card-foreground">Lanzar Dados</h3>
            </div>
            <Button
              onClick={handleCollapse}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              ✕
            </Button>
          </div>

          <div className="p-4">
            {results.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearResults}
                className="text-xs h-7 mb-3 w-full"
              >
                Limpiar
              </Button>
            )}

            {/* Dice buttons */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {diceTypes.map(({ sides, label, color }) => (
                <button
                  key={sides}
                  onClick={() => rollDice(sides)}
                  className={`aspect-square rounded-lg ${color} hover:opacity-80 active:scale-95 transition-all flex items-center justify-center text-xs font-bold text-foreground shadow-md`}
                  title={`Lanzar ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs text-muted-foreground font-medium">Resultados:</p>
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className={`flex items-center gap-3 p-2 rounded-lg bg-secondary/50 ${
                        result.isRolling ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 relative ${result.isRolling ? 'animate-spin' : ''}`}>
                        {getDiceShape(result.sides)}
                        <span 
                          className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                            result.sides === 4 ? 'pt-2' : ''
                          } ${
                            result.sides === 20 || result.sides === 6 
                              ? 'text-primary-foreground' 
                              : 'text-foreground'
                          }`}
                        >
                          {result.result}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-card-foreground">
                          d{result.sides}
                        </span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span 
                          className={`text-lg font-bold ${
                            result.result === result.sides 
                              ? 'text-token-green' 
                              : result.result === 1 
                              ? 'text-destructive' 
                              : 'text-primary'
                          }`}
                        >
                          {result.result}
                        </span>
                        {result.result === result.sides && !result.isRolling && (
                          <span className="ml-2 text-xs text-token-green">¡Crítico!</span>
                        )}
                        {result.result === 1 && !result.isRolling && (
                          <span className="ml-2 text-xs text-destructive">¡Pifia!</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
