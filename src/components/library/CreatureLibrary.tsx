import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search, Star, SlidersHorizontal, FileText, MapPin, Pencil, X,
} from 'lucide-react';
import {
  MONSTER_TYPES, CREATURE_SIZES, CHALLENGE_RATINGS,
  getMonsterTypeLabel, getCreatureSizeLabel,
} from '@/types/dnd';
import {
  useCreatureLibrary, CreatureListItem, crToNumber, normalizeText,
} from '@/hooks/useCreatureLibrary';
import { cn } from '@/lib/utils';

type QuickView = 'all' | 'favorites' | 'mine' | 'imported' | 'recent' | 'used';
type SortKey = 'name-asc' | 'name-desc' | 'cr-asc' | 'cr-desc' | 'recent' | 'used';

const CR_RANGES: { value: string; label: string; test: (n: number) => boolean }[] = [
  { value: 'cr-0', label: 'CR 0', test: n => n === 0 },
  { value: 'cr-1_8', label: 'CR 1/8', test: n => n === 0.125 },
  { value: 'cr-1_4', label: 'CR 1/4', test: n => n === 0.25 },
  { value: 'cr-1_2', label: 'CR 1/2', test: n => n === 0.5 },
  { value: 'cr-1-4', label: 'CR 1–4', test: n => n >= 1 && n <= 4 },
  { value: 'cr-5-10', label: 'CR 5–10', test: n => n >= 5 && n <= 10 },
  { value: 'cr-11-16', label: 'CR 11–16', test: n => n >= 11 && n <= 16 },
  { value: 'cr-17', label: 'CR 17+', test: n => n >= 17 },
];

const SPECIAL_FILTERS: { key: keyof CreatureListItem; label: string }[] = [
  { key: 'has_spellcasting', label: 'Tiene conjuros' },
  { key: 'has_reactions', label: 'Tiene reacciones' },
  { key: 'has_legendary', label: 'Tiene acciones legendarias' },
  { key: 'has_mythic', label: 'Tiene acciones míticas' },
  { key: 'has_lair', label: 'Tiene acciones de guarida' },
  { key: 'has_token', label: 'Tiene token' },
  { key: 'has_image', label: 'Tiene ilustración' },
];

const QUICK_VIEWS: { value: QuickView; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'mine', label: 'Mis criaturas' },
  { value: 'imported', label: 'Importadas' },
  { value: 'recent', label: 'Recientes' },
  { value: 'used', label: 'Más utilizadas' },
];

const CARD_HEIGHT = 168;
const GAP = 8;
const MIN_CARD_WIDTH = 132;

interface CreatureLibraryProps {
  userId?: string;
  /** Abre la ficha detallada (la ilustración completa se carga ahí). */
  onOpenSheet: (id: string, editMode: boolean) => void;
  /** Crea el token en el mapa a partir de la criatura del catálogo. */
  onCreateToken: (creature: CreatureListItem) => void;
  canEditCreature: (creature: CreatureListItem) => boolean;
}

export const CreatureLibrary = ({
  userId,
  onOpenSheet,
  onCreateToken,
  canEditCreature,
}: CreatureLibraryProps) => {
  const { creatures, loading, statsById, sources, toggleFavorite } = useCreatureLibrary();

  const [search, setSearch] = useState('');
  const [quickView, setQuickView] = useState<QuickView>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [crFilter, setCrFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [specials, setSpecials] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('name-asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleSpecial = (key: string) =>
    setSpecials(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const clearFilters = () => {
    setTypeFilter('all'); setSizeFilter('all'); setCrFilter('all');
    setSourceFilter('all'); setSpecials([]); setSearch('');
  };

  const activeFilters =
    (typeFilter !== 'all' ? 1 : 0) + (sizeFilter !== 'all' ? 1 : 0) +
    (crFilter !== 'all' ? 1 : 0) + (sourceFilter !== 'all' ? 1 : 0) + specials.length;

  // Índice de búsqueda precalculado (rápido con miles de criaturas)
  const searchIndex = useMemo(() => {
    const map = new Map<string, string>();
    creatures.forEach(c => {
      map.set(
        c.id,
        normalizeText([c.name, getMonsterTypeLabel(c.type), c.type, c.subtype ?? '', c.source ?? ''].join(' ')),
      );
    });
    return map;
  }, [creatures]);

  const filtered = useMemo(() => {
    const q = normalizeText(search.trim());
    const crRange = CR_RANGES.find(r => r.value === crFilter);

    let list = creatures.filter(c => {
      if (q && !(searchIndex.get(c.id) || '').includes(q)) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (sizeFilter !== 'all' && c.size !== sizeFilter) return false;
      if (crFilter !== 'all') {
        if (crRange) { if (!crRange.test(crToNumber(c.challenge_rating))) return false; }
        else if (c.challenge_rating !== crFilter) return false;
      }
      if (sourceFilter !== 'all') {
        if (sourceFilter === '__none__') { if (c.source) return false; }
        else if (c.source !== sourceFilter) return false;
      }
      if (specials.some(k => !(c as any)[k])) return false;

      if (quickView === 'favorites' && !statsById.get(c.id)?.favorite) return false;
      if (quickView === 'mine' && (c.source || c.user_id !== userId)) return false;
      if (quickView === 'imported' && !c.source) return false;
      if (quickView === 'used' && !(statsById.get(c.id)?.usage_count ?? 0)) return false;
      return true;
    });

    const effectiveSort: SortKey =
      quickView === 'recent' ? 'recent' : quickView === 'used' ? 'used' : sort;

    list = [...list].sort((a, b) => {
      switch (effectiveSort) {
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'cr-asc': return crToNumber(a.challenge_rating) - crToNumber(b.challenge_rating) || a.name.localeCompare(b.name);
        case 'cr-desc': return crToNumber(b.challenge_rating) - crToNumber(a.challenge_rating) || a.name.localeCompare(b.name);
        case 'recent': return (b.created_at || '').localeCompare(a.created_at || '');
        case 'used': return (statsById.get(b.id)?.usage_count ?? 0) - (statsById.get(a.id)?.usage_count ?? 0) || a.name.localeCompare(b.name);
        default: return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [creatures, search, searchIndex, typeFilter, sizeFilter, crFilter, sourceFilter, specials, quickView, sort, statsById, userId]);

  // Cuadrícula virtualizada: solo se montan las tarjetas visibles
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      setColumns(Math.max(2, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP))));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rowCount = Math.ceil(filtered.length / columns);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 4,
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar criatura..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm"
        />
        {search && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Vistas rápidas */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
        {QUICK_VIEWS.map(v => (
          <Button
            key={v.value}
            size="sm"
            variant={quickView === v.value ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs shrink-0"
            onClick={() => setQuickView(v.value)}
          >
            {v.value === 'favorites' && <Star className="w-3 h-3 mr-1" />}
            {v.label}
          </Button>
        ))}
      </div>

      {/* Filtros y orden */}
      <div className="flex gap-1.5 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {activeFilters > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{activeFilters}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {MONSTER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tamaño</Label>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tamaños</SelectItem>
                  {CREATURE_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desafío (CR)</Label>
              <Select value={crFilter} onValueChange={setCrFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Cualquier CR</SelectItem>
                  {CR_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  {CHALLENGE_RATINGS.map(cr => <SelectItem key={`exact-${cr}`} value={cr}>CR exacto {cr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fuente</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="__none__">Mis criaturas (sin fuente)</SelectItem>
                  {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Filtros especiales</Label>
              {SPECIAL_FILTERS.map(f => (
                <label key={f.key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={specials.includes(f.key)}
                    onCheckedChange={() => toggleSpecial(f.key)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </PopoverContent>
        </Popover>

        <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
          <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nombre A-Z</SelectItem>
            <SelectItem value="name-desc">Nombre Z-A</SelectItem>
            <SelectItem value="cr-asc">CR ascendente</SelectItem>
            <SelectItem value="cr-desc">CR descendente</SelectItem>
            <SelectItem value="recent">Recientemente añadidas</SelectItem>
            <SelectItem value="used">Más utilizadas</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
          {filtered.length}
        </span>
      </div>

      {/* Cuadrícula virtualizada */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Cargando catálogo...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Sin resultados</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map(virtualRow => {
              const start = virtualRow.index * columns;
              const rowItems = filtered.slice(start, start + columns);
              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 w-full grid"
                  style={{
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    height: CARD_HEIGHT,
                    gap: GAP,
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {rowItems.map(creature => {
                    const stats = statsById.get(creature.id);
                    const selected = selectedId === creature.id;
                    return (
                      <div
                        key={creature.id}
                        className={cn(
                          'relative flex flex-col rounded-lg border bg-muted/40 overflow-hidden transition-colors cursor-pointer',
                          selected ? 'border-primary ring-1 ring-primary/40' : 'border-border hover:border-primary/50',
                        )}
                        onClick={() => setSelectedId(selected ? null : creature.id)}
                      >
                        {/* Miniatura: SIEMPRE el token */}
                        <div className="flex-1 min-h-0 flex items-center justify-center bg-background/40 p-1.5">
                          {creature.token_image_url ? (
                            <img
                              src={creature.token_image_url}
                              alt={creature.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain rounded-full"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-full border-2 border-foreground/20 flex items-center justify-center text-sm font-bold text-background/90"
                              style={{ backgroundColor: creature.token_color === 'black' ? '#1a1a1a' : creature.token_color }}
                            >
                              {creature.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <button
                          className="absolute top-1 right-1 p-1 rounded bg-background/70 hover:bg-background"
                          title={stats?.favorite ? 'Quitar de favoritos' : 'Marcar como favorita'}
                          onClick={e => { e.stopPropagation(); toggleFavorite(creature.id); }}
                        >
                          <Star className={cn('w-3.5 h-3.5', stats?.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
                        </button>

                        <div className="px-2 py-1.5 border-t border-border/60 bg-card/70">
                          <p className="text-xs font-semibold truncate" title={creature.name}>{creature.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {getMonsterTypeLabel(creature.type)} · {getCreatureSizeLabel(creature.size)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">CR {creature.challenge_rating}</p>
                        </div>

                        {selected && (
                          <div
                            className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1.5 bg-background/95 border-t border-border"
                            onClick={e => e.stopPropagation()}
                          >
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Ver ficha" onClick={() => onOpenSheet(creature.id, false)}>
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="default" className="h-7 w-7" title="Crear token" onClick={() => onCreateToken(creature)}>
                              <MapPin className="w-3.5 h-3.5" />
                            </Button>
                            {canEditCreature(creature) && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => onOpenSheet(creature.id, true)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
