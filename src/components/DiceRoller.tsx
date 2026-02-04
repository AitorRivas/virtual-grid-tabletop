import { useState, useCallback, useMemo } from 'react';
import { Dices, GripHorizontal, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useDraggable } from '@/hooks/useDraggable';
import { DiceRollModal } from './dice/DiceRollModal';

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
  colorName: string;
}

const PANEL_WIDTH = 340;

export const DiceRoller = () => {
  const [results, setResults] = useState<DiceResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDice, setActiveDice] = useState<{ sides: number; colorName: string }>({ sides: 6, colorName: 'blue' });
  const [isRolling, setIsRolling] = useState(false);
  
  const defaultPosition = useMemo(() => {
    const x = Math.max(16, window.innerWidth - PANEL_WIDTH - 16);
    const y = Math.max(16, window.innerHeight - 450);
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

  const rollDice = useCallback((sides: number, colorName: string) => {
    if (isRolling) return;
    setActiveDice({ sides, colorName });
    setIsRolling(true);
  }, [isRolling]);

  const handleRollComplete = useCallback((result: number) => {
    const newResult: DiceResult = {
      id: Date.now(),
      sides: activeDice.sides,
      result,
      colorName: activeDice.colorName,
    };
    setResults(prev => [newResult, ...prev.slice(0, 9)]);
  }, [activeDice]);

  const handleModalClose = useCallback(() => {
    setIsRolling(false);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

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
      {!isExpanded && (
        <Button
          onClick={handleExpand}
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <Dices className="w-6 h-6" />
        </Button>
      )}

      {isExpanded && (
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden" style={{ width: PANEL_WIDTH }}>
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

          <div className="p-4 space-y-3">
            {/* Dice buttons */}
            <div className="grid grid-cols-6 gap-2">
              {diceTypes.map(({ sides, label, color, colorName }) => (
                <button
                  key={sides}
                  onClick={() => rollDice(sides, colorName)}
                  disabled={isRolling}
                  className={`aspect-square rounded-lg ${color} hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-xs font-bold text-foreground shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  title={`Lanzar ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Fullscreen modal for 3D dice */}
            {isRolling && (
              <DiceRollModal
                sides={activeDice.sides}
                color={activeDice.colorName}
                onComplete={handleRollComplete}
                onClose={handleModalClose}
              />
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Historial</span>
                  <Button variant="ghost" size="sm" onClick={clearResults} className="text-xs h-6 px-2">
                    Limpiar
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-thin">
                  {results.map((r) => (
                    <div
                      key={r.id}
                      className={`px-2 py-1 rounded text-sm font-bold ${
                        isCritical(r)
                          ? 'bg-token-green/20 text-token-green border border-token-green/40'
                          : isFumble(r)
                          ? 'bg-destructive/20 text-destructive border border-destructive/40'
                          : 'bg-secondary/60 text-foreground'
                      }`}
                    >
                      <span className="text-muted-foreground text-xs">d{r.sides}:</span>
                      <span className="ml-1">{r.result}</span>
                      {isCritical(r) && <Sparkles className="w-3 h-3 inline ml-0.5 text-token-yellow" />}
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
