import { useState, useCallback, useMemo, Suspense } from 'react';
import { Dices, GripHorizontal, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useDraggable } from '@/hooks/useDraggable';
import { DicePhysicsScene } from './dice/DicePhysics';

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

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 480;

export const DiceRoller = () => {
  const [results, setResults] = useState<DiceResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<{ sides: number; colorName: string } | null>(null);
  const [rollTrigger, setRollTrigger] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  
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
    if (isRolling) return;
    
    setIsRolling(true);
    setCurrentRoll({ sides, colorName });
    setRollTrigger(prev => prev + 1);
  };

  const handleRollComplete = useCallback((result: number) => {
    if (!currentRoll) return;
    
    const newResult: DiceResult = {
      id: Date.now(),
      sides: currentRoll.sides,
      result,
      colorName: currentRoll.colorName,
    };

    setResults(prev => [newResult, ...prev.slice(0, 9)]);
    setIsRolling(false);
  }, [currentRoll]);

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
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden" style={{ width: PANEL_WIDTH }}>
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

          <div className="p-4 space-y-4">
            {/* Dice buttons */}
            <div className="grid grid-cols-6 gap-2">
              {diceTypes.map(({ sides, label, color, colorName }) => (
                <button
                  key={sides}
                  onClick={() => rollDice(sides, colorName)}
                  disabled={isRolling}
                  className={`aspect-square rounded-lg ${color} hover:opacity-90 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xs font-bold text-foreground shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  title={`Lanzar ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 3D Physics Scene */}
            <Suspense fallback={
              <div className="w-full h-48 rounded-lg bg-secondary/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            }>
              <DicePhysicsScene
                sides={currentRoll?.sides || 6}
                color={currentRoll?.colorName || 'blue'}
                onRollComplete={handleRollComplete}
                rollTrigger={rollTrigger}
              />
            </Suspense>

            {/* Rolling indicator */}
            {isRolling && (
              <div className="text-center text-sm text-muted-foreground animate-pulse">
                Rodando d{currentRoll?.sides}...
              </div>
            )}

            {/* Results history */}
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Historial</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearResults}
                    className="text-xs h-6 px-2 hover:bg-destructive/20"
                  >
                    Limpiar
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto scrollbar-thin">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        isCritical(result)
                          ? 'bg-token-green/20 text-token-green border border-token-green/50'
                          : isFumble(result)
                          ? 'bg-destructive/20 text-destructive border border-destructive/50'
                          : 'bg-secondary/50 text-foreground border border-border/30'
                      }`}
                    >
                      <span className="text-muted-foreground text-xs mr-1">d{result.sides}:</span>
                      <span>{result.result}</span>
                      {isCritical(result) && (
                        <Sparkles className="w-3 h-3 inline ml-1 text-token-yellow" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && !isRolling && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Selecciona un dado para lanzar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
