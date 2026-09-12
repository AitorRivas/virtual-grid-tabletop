import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Dices, GripHorizontal, Sparkles, Skull, Eraser } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useDraggable } from '@/hooks/useDraggable';
import {
  roll as rollExpression,
  isParseError,
  formatModifierValue,
  formatAverage,
  isCriticalRoll,
  isFumbleRoll,
  type RollResult,
} from '@/lib/dice/diceEngine';

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 460;
const ROLL_ANIMATION_MS = 450;

interface HistoryEntry extends RollResult {
  id: number;
}

const dieColor = (sides: number) => {
  switch (sides) {
    case 4: return 'bg-token-green/20 border-token-green/60 text-token-green';
    case 6: return 'bg-token-blue/20 border-token-blue/60 text-token-blue';
    case 8: return 'bg-token-purple/20 border-token-purple/60 text-token-purple';
    case 10: return 'bg-token-orange/20 border-token-orange/60 text-token-orange';
    case 12: return 'bg-token-red/20 border-token-red/60 text-token-red';
    case 20: return 'bg-token-yellow/20 border-token-yellow/60 text-token-yellow';
    default: return 'bg-primary/20 border-primary/60 text-primary';
  }
};

export const DiceRoller = () => {
  const [expression, setExpression] = useState('1d20');
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<HistoryEntry | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [spinFaces, setSpinFaces] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => { timers.current.forEach(clearInterval); }, []);

  const defaultPosition = useMemo(() => ({
    x: Math.max(16, window.innerWidth - PANEL_WIDTH - 16),
    y: Math.max(16, window.innerHeight - PANEL_HEIGHT - 100),
  }), []);

  const { position, isDragging, dragRef, handleMouseDown, resetPosition } = useDraggable({
    defaultPosition,
  });

  const handleExpand = useCallback(() => { resetPosition(); setIsExpanded(true); }, [resetPosition]);

  const doRoll = useCallback((expr: string) => {
    const result = rollExpression(expr);
    if (isParseError(result)) {
      setError(result.error);
      return;
    }
    setError(null);
    const entry: HistoryEntry = { ...result, id: Date.now() };

    setIsRolling(true);
    setCurrent(entry);
    setSpinFaces(result.rolls.map(() => 1));

    const interval = window.setInterval(() => {
      setSpinFaces(result.rolls.map(() => Math.floor(Math.random() * result.sides) + 1));
    }, 60);
    timers.current.push(interval);

    window.setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      setHistory(prev => [entry, ...prev].slice(0, 20));
    }, ROLL_ANIMATION_MS);
  }, []);

  const insertDie = (sides: number) => {
    setError(null);
    setExpression(prev => {
      const match = /^\s*(\d*)\s*[dD]\s*\d+\s*(([+-])\s*(\d+))?\s*$/.exec(prev);
      const count = match && match[1] ? match[1] : '1';
      const mod = match && match[2] ? match[2].replace(/\s/g, '') : '';
      return `${count}d${sides}${mod}`;
    });
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
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl w-[360px] overflow-hidden">
          <div
            className={`flex items-center justify-between p-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
              <Dices className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-card-foreground">Lanzar Dados</h3>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-destructive/20"
            >
              ✕
            </Button>
          </div>

          <div className="p-4 space-y-3">
            {/* Expresión */}
            <form
              onSubmit={(e) => { e.preventDefault(); doRoll(expression); }}
              className="flex gap-2"
            >
              <Input
                value={expression}
                onChange={(e) => { setExpression(e.target.value); setError(null); }}
                placeholder="Ej: 8d8+3"
                className="h-10 font-mono text-base"
                aria-label="Expresión de tirada"
              />
              <Button type="submit" className="h-10 px-5 font-bold">Tirar</Button>
            </form>

            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}

            {/* Botones rápidos */}
            <div className="grid grid-cols-7 gap-1.5">
              {QUICK_DICE.map((sides) => (
                <button
                  key={sides}
                  type="button"
                  onClick={() => insertDie(sides)}
                  className={`h-9 rounded-lg border text-[11px] font-bold transition-all hover:scale-105 active:scale-95 ${dieColor(sides)}`}
                  title={`Insertar d${sides}`}
                >
                  d{sides}
                </button>
              ))}
            </div>

            {/* Resultado */}
            {current && (
              <div
                className={`rounded-xl border p-3 transition-all ${
                  !isRolling && isCriticalRoll(current)
                    ? 'border-token-green/60 bg-gradient-to-br from-token-green/15 to-token-yellow/10'
                    : !isRolling && isFumbleRoll(current)
                    ? 'border-destructive/60 bg-gradient-to-br from-destructive/20 to-destructive/5'
                    : 'border-border/50 bg-secondary/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-primary">{current.expression}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {current.count} × d{current.sides}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(isRolling ? spinFaces : current.rolls).map((value, i) => (
                    <span
                      key={i}
                      className={`min-w-8 h-8 px-1.5 rounded-lg border flex items-center justify-center text-sm font-bold ${dieColor(current.sides)} ${isRolling ? 'animate-pulse' : 'animate-scale-in'}`}
                    >
                      {value}
                    </span>
                  ))}
                </div>

                {!isRolling && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dados</span>
                      <span className="font-semibold">{current.diceTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modificador</span>
                      <span className="font-semibold">{formatModifierValue(current.modifier)}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-border/40 pt-2 mt-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total</span>
                      <span className="text-3xl font-extrabold text-primary leading-none">{current.total}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Media dados</span>
                      <span>{formatAverage(current.averageDice)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Media total</span>
                      <span>{formatAverage(current.averageTotal)}</span>
                    </div>

                    {isCriticalRoll(current) && (
                      <div className="flex items-center gap-1 pt-1">
                        <Sparkles className="w-4 h-4 text-token-yellow animate-pulse" />
                        <span className="text-sm font-bold text-token-green">¡Crítico Natural!</span>
                      </div>
                    )}
                    {isFumbleRoll(current) && (
                      <div className="flex items-center gap-1 pt-1">
                        <Skull className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-bold text-destructive">¡Pifia Natural!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Historial */}
            {history.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Historial</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] hover:bg-destructive/20"
                    onClick={() => { setHistory([]); setCurrent(null); }}
                  >
                    <Eraser className="w-3 h-3 mr-1" /> Limpiar
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto scrollbar-thin pr-1 space-y-1">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => { setExpression(h.expression); doRoll(h.expression); }}
                      className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors"
                      title="Repetir tirada"
                    >
                      <span className="font-mono text-muted-foreground">{h.expression}</span>
                      <span className="font-bold text-foreground">→ {h.total}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!current && (
              <div className="text-center py-6 text-muted-foreground">
                <Dices className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Escribe una tirada (ej. 8d8+3) o usa los botones</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
