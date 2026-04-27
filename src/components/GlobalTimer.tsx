/**
 * Global decision timer rendered in the top bar.
 * - DM mode: collapsible. Collapsed shows just the hourglass; expanded shows controls.
 * - Player mode: read-only, hourglass-only (no exact mm:ss). Players see urgency via color/fill.
 *
 * Visual states based on remaining ratio:
 *   ≥50% normal · <50% soft warning · <20% urgent (subtle pulse) · 0% time-up
 */

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Hourglass, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlobalTimerProps {
  /** When true, renders only the visual display (no controls, no exact time). Used in PlayerView. */
  readOnly?: boolean;
}

const PRESETS: { label: string; ms: number }[] = [
  { label: '30s', ms: 30_000 },
  { label: '1m', ms: 60_000 },
  { label: '2m', ms: 120_000 },
  { label: '5m', ms: 300_000 },
];

const formatTime = (ms: number) => {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const GlobalTimer = ({ readOnly = false }: GlobalTimerProps) => {
  const { timer, setTimer, playerViewConfig } = useGameState();
  const [, forceTick] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Hide entirely in PlayerView when DM hasn't enabled it.
  if (readOnly && !playerViewConfig.showTimer) return null;

  // Derive live remaining time on every repaint without writing to state on every frame.
  const liveRemaining = timer.active && timer.endsAt != null
    ? Math.max(0, timer.endsAt - Date.now())
    : timer.remainingMs;

  // rAF loop while active, just to repaint.
  useEffect(() => {
    if (!timer.active || timer.endsAt == null) return;
    const tick = () => {
      forceTick((n) => (n + 1) % 1_000_000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [timer.active, timer.endsAt]);

  // Auto-stop at zero (only owner / DM should commit; PlayerView is read-only).
  useEffect(() => {
    if (readOnly) return;
    if (!timer.active || timer.endsAt == null) return;
    const remaining = timer.endsAt - Date.now();
    if (remaining <= 0) {
      setTimer({ active: false, endsAt: null, remainingMs: 0 });
      return;
    }
    const id = window.setTimeout(() => {
      setTimer({ active: false, endsAt: null, remainingMs: 0 });
    }, remaining);
    return () => window.clearTimeout(id);
  }, [readOnly, timer.active, timer.endsAt, setTimer]);

  const ratio = timer.durationMs > 0 ? liveRemaining / timer.durationMs : 0;
  const expired = liveRemaining <= 0 && !timer.active && timer.durationMs > 0 && timer.endsAt === null && timer.remainingMs === 0;
  const urgent = !expired && ratio > 0 && ratio < 0.2;
  const warning = !expired && !urgent && ratio < 0.5;

  const handleStart = () => {
    const base = liveRemaining > 0 ? liveRemaining : timer.durationMs;
    setTimer({ active: true, endsAt: Date.now() + base, remainingMs: base });
  };
  const handlePause = () => {
    setTimer({ active: false, endsAt: null, remainingMs: liveRemaining });
  };
  const handleReset = () => {
    setTimer({ active: false, endsAt: null, remainingMs: timer.durationMs });
  };
  const handleAdjust = (deltaMs: number) => {
    if (timer.active && timer.endsAt != null) {
      const newEnd = Math.max(Date.now(), timer.endsAt + deltaMs);
      setTimer({ endsAt: newEnd, remainingMs: newEnd - Date.now() });
    } else {
      setTimer({ remainingMs: Math.max(0, liveRemaining + deltaMs) });
    }
  };
  const handlePreset = (ms: number) => {
    setTimer({ active: false, endsAt: null, durationMs: ms, remainingMs: ms });
  };

  const timeColor = expired
    ? 'text-destructive'
    : urgent
      ? 'text-destructive'
      : warning
        ? 'text-amber-400'
        : 'text-foreground';

  // Hourglass: bottom fills as time elapses.
  const elapsed = 1 - Math.max(0, Math.min(1, ratio));

  // Hourglass visual (shared between collapsed/expanded/readOnly).
  const HourglassVisual = (
    <div className="relative flex h-7 w-7 items-center justify-center">
      <Hourglass
        className={cn(
          'h-6 w-6 transition-colors',
          timer.active ? 'text-primary' : 'text-muted-foreground',
          urgent && 'text-destructive',
          warning && !urgent && 'text-amber-400',
          expired && 'text-destructive',
        )}
        style={timer.active ? { animation: 'spin 6s linear infinite' } : undefined}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-1 bottom-0.5 h-[3px] rounded-full bg-gradient-to-r transition-all',
          urgent || expired ? 'from-destructive to-destructive/60' : warning ? 'from-amber-400 to-amber-500/70' : 'from-primary to-primary/60',
        )}
        style={{ width: `${Math.round(elapsed * 100)}%`, opacity: 0.85 }}
      />
    </div>
  );

  // Player view: hourglass only, no exact time. Subtle pulse when active.
  if (readOnly) {
    return (
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-colors',
          urgent && 'border-destructive/60 animate-pulse',
          warning && 'border-amber-400/50',
          expired && 'border-destructive/70',
        )}
        title="Tiempo de decisión"
      >
        {HourglassVisual}
      </div>
    );
  }

  // DM collapsed: just hourglass + chevron toggle.
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          'pointer-events-auto flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-colors hover:bg-accent/40',
          urgent && 'border-destructive/60 animate-pulse',
          warning && 'border-amber-400/50',
          expired && 'border-destructive/70',
        )}
        title="Mostrar temporizador"
      >
        {HourglassVisual}
        {timer.active && (
          <span className={cn('font-mono text-xs font-semibold tabular-nums', timeColor)}>
            {formatTime(liveRemaining)}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    );
  }

  // DM expanded: full controls.
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-md transition-colors',
        urgent && 'border-destructive/60 animate-pulse',
        warning && 'border-amber-400/50',
        expired && 'border-destructive/70',
      )}
      title="Temporizador global"
    >
      {HourglassVisual}

      <span className={cn('font-mono text-base font-semibold tabular-nums', timeColor)}>
        {formatTime(liveRemaining)}
      </span>

      <div className="h-5 w-px bg-border/70" />

      <div className="flex items-center gap-1">
        {timer.active ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePause} title="Pausar">
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleStart}
            disabled={liveRemaining <= 0 && timer.durationMs <= 0}
            title="Iniciar"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleReset} title="Reiniciar">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAdjust(-10_000)} title="-10s">
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAdjust(10_000)} title="+10s">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border/70" />

      <div className="flex items-center gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePreset(p.ms)}
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors',
              timer.durationMs === p.ms
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            title={`Preset ${p.label}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border/70" />

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => setExpanded(false)}
        title="Colapsar"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
    </div>
  );
};
