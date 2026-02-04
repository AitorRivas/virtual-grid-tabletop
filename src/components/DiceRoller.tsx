import { useState, useCallback, useMemo, Suspense } from 'react';
import { Dices, GripHorizontal, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useDraggable } from '@/hooks/useDraggable';
import { Dice3D } from './dice/Dice3D';

interface DiceType {
  sides: number;
  label: string;
  color: string;
  colorName: string;
}

const diceTypes: DiceType[] = [
  { sides: 4, label: 'd4', color: 'bg-token-green', colorName: 'green' },
  { sides: 6, label: 'd6', color: 'bg-token-blue', colorName: 'blue' },
  { sides: 8, label: 'd8', color: 'bg-token-purple', colorName: 'purple' },
  { sides: 10, label: 'd10', color: 'bg-token-orange', colorName: 'orange' },
  { sides: 12, label: 'd12', color: 'bg-token-red', colorName: 'red' },
  { sides: 20, label: 'd20', color: 'bg-token-yellow', colorName: 'yellow' },
];

interface DiceResult {
  id: number;
  sides: number;
  result: number;
  isRolling: boolean;
  colorName: string;
}

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 400;

export const DiceRoller = () => {
  const [results, setResults] = useState<DiceResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const defaultPosition = useMemo(() => {
    const x = Math.max(16, window.innerWidth - PANEL_WIDTH - 16);
    const y = Math.max(16, window.innerHeight - PANEL_HEIGHT - 100);
    return { x, y };
  }, []);
  
  const { position, isDragging, dragRef, handleMouseDown, resetPosition } = useDraggable({
    defaultPosition,
  });

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleExpand = useCallback(() => {
    resetPosition();
    setIsExpanded(true);
  }, [resetPosition]);

  const rollDice = (sides: number, colorName: string) => {
    const id = Date.now();
    const newResult: DiceResult = {
      id,
      sides,
      result: 1,
      isRolling: true,
      colorName,
    };

    setResults(prev => [newResult, ...prev.slice(0, 4)]);

    // Animate the roll
    let rollCount = 0;
    const maxRolls = 20;
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
    }, 60);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Only d20 has critical hits and fumbles (natural 20 and natural 1)
  const isCritical = (result: DiceResult) => result.sides === 20 && result.result === 20;
  const isFumble = (result: DiceResult) => result.sides === 20 && result.result === 1;

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
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl w-80 overflow-hidden">
          {/* Draggable header */}
          <div 
            className={`flex items-center justify-between p-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10 cursor-move select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
              className="h-7 w-7 p-0 hover:bg-destructive/20"
            >
              ✕
            </Button>
          </div>

          <div className="p-4">
            {/* Dice buttons */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {diceTypes.map(({ sides, label, color, colorName }) => (
                <button
                  key={sides}
                  onClick={() => rollDice(sides, colorName)}
                  className={`aspect-square rounded-lg ${color} hover:opacity-90 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xs font-bold text-foreground shadow-lg hover:shadow-xl`}
                  title={`Lanzar ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {results.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearResults}
                className="text-xs h-7 mb-3 w-full hover:bg-destructive/20"
              >
                Limpiar resultados
              </Button>
            )}

            {/* 3D Results */}
            {results.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isCritical(result) && !result.isRolling
                        ? 'bg-gradient-to-r from-token-green/20 to-token-yellow/20 border border-token-green/50 shadow-lg shadow-token-green/20'
                        : isFumble(result) && !result.isRolling
                        ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/50 shadow-lg shadow-destructive/20'
                        : 'bg-secondary/30 border border-border/30'
                    }`}
                  >
                    <Suspense fallback={
                      <div className="w-16 h-16 bg-secondary rounded-lg animate-pulse flex items-center justify-center">
                        <Dices className="w-8 h-8 text-muted-foreground" />
                      </div>
                    }>
                      <Dice3D 
                        sides={result.sides} 
                        isRolling={result.isRolling} 
                        color={result.colorName}
                      />
                    </Suspense>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          d{result.sides}
                        </span>
                        <span className="text-muted-foreground/50">→</span>
                        <span 
                          className={`text-2xl font-bold transition-all ${
                            result.isRolling 
                              ? 'text-muted-foreground animate-pulse' 
                              : isCritical(result)
                              ? 'text-token-green'
                              : isFumble(result)
                              ? 'text-destructive'
                              : 'text-primary'
                          }`}
                        >
                          {result.result}
                        </span>
                      </div>
                      
                      {/* Only show critical/fumble labels for d20 */}
                      {isCritical(result) && !result.isRolling && (
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="w-4 h-4 text-token-yellow animate-pulse" />
                          <span className="text-sm font-bold text-token-green">
                            ¡Crítico Natural!
                          </span>
                        </div>
                      )}
                      {isFumble(result) && !result.isRolling && (
                        <span className="text-sm font-bold text-destructive">
                          ¡Pifia Natural!
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Dices className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecciona un dado para lanzar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
