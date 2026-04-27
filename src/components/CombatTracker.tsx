import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Swords, Skull, Shield, User, Users, X, MapPin, Crosshair } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TokenData } from './MapViewer';
import type { MapData } from '@/hooks/useGameState';

export type CombatFaction = 'pj' | 'enemy' | 'npc';

export interface CombatEntry {
  id: string;          // unique id of the entry
  tokenId?: string;    // optional link to a map token (highlight on map)
  /** Map this combatant belongs to (global combat). Optional for purely manual entries. */
  mapId?: string | null;
  name: string;
  initiative: number;
  faction: CombatFaction;
}

interface CombatTrackerProps {
  entries: CombatEntry[];
  activeIndex: number;
  isActive: boolean;
  tokens: TokenData[];
  /** All session maps — used to resolve entry.mapId into a readable name and offer "Go to combatant". */
  maps?: MapData[];
  /** Currently active map; combatants on a different map get a "Ir al combatiente" action. */
  activeMapId?: string | null;
  onEntriesChange: (entries: CombatEntry[]) => void;
  onActiveIndexChange: (index: number) => void;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onAddFromMap: () => void;
  onGoToCombatant?: (entry: CombatEntry) => void;
  embedded?: boolean;
}

const factionMeta: Record<CombatFaction, { label: string; icon: typeof Shield; ringClass: string; bgClass: string; textClass: string }> = {
  pj:    { label: 'PJ',     icon: Shield, ringClass: 'ring-2 ring-[hsl(var(--token-blue))]',  bgClass: 'bg-[hsl(var(--token-blue))]/15',   textClass: 'text-[hsl(var(--token-blue))]' },
  enemy: { label: 'Enemigo',icon: Skull,  ringClass: 'ring-2 ring-[hsl(var(--token-red))]',   bgClass: 'bg-[hsl(var(--token-red))]/15',    textClass: 'text-[hsl(var(--token-red))]' },
  npc:   { label: 'NPC',    icon: User,   ringClass: 'ring-2 ring-[hsl(var(--token-yellow))]',bgClass: 'bg-[hsl(var(--token-yellow))]/15', textClass: 'text-[hsl(var(--token-yellow))]' },
};

const cycleFaction = (f: CombatFaction): CombatFaction =>
  f === 'pj' ? 'enemy' : f === 'enemy' ? 'npc' : 'pj';

export const CombatTracker = ({
  entries,
  activeIndex,
  isActive,
  tokens,
  maps = [],
  activeMapId = null,
  onEntriesChange,
  onActiveIndexChange,
  onStart,
  onStop,
  onNext,
  onPrev,
  onAddFromMap,
  onGoToCombatant,
  embedded = false,
}: CombatTrackerProps) => {
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState('');
  const [newFaction, setNewFaction] = useState<CombatFaction>('enemy');
  const activeRowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active turn
  useEffect(() => {
    if (isActive && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex, isActive]);

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    const initiative = Number(newInit) || 0;
    const entry: CombatEntry = {
      id: `combat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      initiative,
      faction: newFaction,
    };
    onEntriesChange([...entries, entry]);
    setNewName('');
    setNewInit('');
  };

  const removeEntry = (id: string) => {
    const idx = entries.findIndex(e => e.id === id);
    const next = entries.filter(e => e.id !== id);
    onEntriesChange(next);
    if (isActive && next.length > 0) {
      if (idx < activeIndex) onActiveIndexChange(activeIndex - 1);
      else if (idx === activeIndex) onActiveIndexChange(activeIndex % next.length);
    }
  };

  const updateEntry = (id: string, patch: Partial<CombatEntry>) => {
    onEntriesChange(entries.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target], next[index]];
    onEntriesChange(next);
    if (isActive) {
      if (activeIndex === index) onActiveIndexChange(target);
      else if (activeIndex === target) onActiveIndexChange(index);
    }
  };

  const sortByInitiative = () => {
    const next = [...entries].sort((a, b) => b.initiative - a.initiative);
    onEntriesChange(next);
    if (isActive) onActiveIndexChange(0);
  };

  return (
    <div className={cn('flex flex-col h-full', embedded ? '' : 'bg-card border border-border rounded-lg shadow-xl')}>
      {/* Header / Controls */}
      <div className="p-3 border-b border-border/50 space-y-2 shrink-0">
        {!isActive ? (
          <Button onClick={onStart} className="w-full gap-2" size="sm" disabled={entries.length === 0}>
            <Swords className="w-4 h-4" /> Iniciar combate
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onPrev} variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button onClick={onNext} size="sm" className="gap-1">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={onStop} variant="ghost" size="sm" className="col-span-2 text-muted-foreground">
              Finalizar combate
            </Button>
          </div>
        )}

        <div className="flex gap-1">
          <Button onClick={onAddFromMap} variant="outline" size="sm" className="flex-1 gap-1 text-xs h-8" disabled={tokens.length === 0}>
            <Users className="w-3 h-3" /> Tokens del mapa
          </Button>
          <Button onClick={sortByInitiative} variant="outline" size="sm" className="text-xs h-8" disabled={entries.length < 2}>
            Ordenar
          </Button>
        </div>
      </div>

      {/* Add manual entry */}
      <div className="p-3 border-b border-border/50 space-y-2 shrink-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Añadir combatiente</p>
        <div className="flex gap-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre"
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
          />
          <Input
            type="number"
            value={newInit}
            onChange={(e) => setNewInit(e.target.value)}
            placeholder="Init"
            className="h-8 text-xs w-14"
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
          />
        </div>
        <div className="flex gap-1">
          {(Object.keys(factionMeta) as CombatFaction[]).map(f => {
            const meta = factionMeta[f];
            const Icon = meta.icon;
            return (
              <Button
                key={f}
                variant={newFaction === f ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-7 text-[10px] gap-1 px-1"
                onClick={() => setNewFaction(f)}
              >
                <Icon className="w-3 h-3" /> {meta.label}
              </Button>
            );
          })}
          <Button onClick={addManual} size="sm" className="h-7 px-2" disabled={!newName.trim()}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin combatientes. Añade desde el mapa o manualmente.
            </p>
          ) : (
            entries.map((entry, index) => {
              const meta = factionMeta[entry.faction];
              const Icon = meta.icon;
              const isCurrent = isActive && index === activeIndex;
              const linkedToken = entry.tokenId ? tokens.find(t => t.id === entry.tokenId) : null;
              const entryMap = entry.mapId ? maps.find((m) => m.id === entry.mapId) : null;
              const isOnOtherMap = !!entry.mapId && !!activeMapId && entry.mapId !== activeMapId;
              return (
                <div
                  key={entry.id}
                  ref={isCurrent ? activeRowRef : null}
                  className={cn(
                    'flex flex-col gap-1 p-2 rounded-md border transition-all',
                    isCurrent
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border/40 bg-card/50 hover:bg-card',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn('w-5 text-center font-mono text-[10px]', isCurrent ? 'text-primary font-bold' : 'text-muted-foreground')}>
                      {index + 1}
                    </span>

                    {/* Faction badge (clickable to cycle) */}
                    <button
                      type="button"
                      onClick={() => updateEntry(entry.id, { faction: cycleFaction(entry.faction) })}
                      className={cn('shrink-0 w-6 h-6 rounded-full flex items-center justify-center', meta.bgClass, meta.textClass)}
                      title={`Facción: ${meta.label} (clic para cambiar)`}
                    >
                      <Icon className="w-3 h-3" />
                    </button>

                    {/* Avatar if linked */}
                    {linkedToken?.imageUrl && (
                      <img src={linkedToken.imageUrl} alt="" className={cn('w-7 h-7 rounded-full object-cover shrink-0', meta.ringClass)} />
                    )}

                    {/* Name */}
                    <Input
                      value={entry.name}
                      onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                      className="h-7 text-xs px-1.5 flex-1 min-w-0 bg-transparent border-transparent hover:border-input focus:border-input"
                    />

                    {/* Initiative */}
                    <Input
                      type="number"
                      value={entry.initiative}
                      onChange={(e) => updateEntry(entry.id, { initiative: Number(e.target.value) || 0 })}
                      className="h-7 w-12 text-xs px-1.5 text-center font-mono"
                    />

                    {/* Reorder */}
                    <div className="flex flex-col">
                      <button onClick={() => move(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => move(index, 1)} disabled={index === entries.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    <button onClick={() => removeEntry(entry.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Map row: badge + jump button */}
                  {entryMap && (
                    <div className="flex items-center gap-1.5 pl-7">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                          isOnOtherMap
                            ? 'bg-amber-500/15 text-amber-500 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground',
                        )}
                        title={isOnOtherMap ? 'Combatiente en otro mapa' : 'En el mapa actual'}
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[140px]">{entryMap.name}</span>
                      </span>
                      {isOnOtherMap && onGoToCombatant && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] gap-1"
                          onClick={() => onGoToCombatant(entry)}
                          title="Ir al combatiente"
                        >
                          <Crosshair className="w-2.5 h-2.5" /> Ir
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
