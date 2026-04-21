import { useState, useRef, ReactNode, useMemo } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Eye, EyeOff, Trash2, Crosshair, FileText, Pencil,
  Cloud, CloudOff, RotateCcw, Plus, Search, User, Skull,
  Swords, SkipForward,
} from 'lucide-react';
import type { TokenData } from './MapViewer';
import type { Character, Monster } from '@/types/dnd';

interface ClickContext {
  /** Token id when right-click was on a token, undefined when on the map. */
  tokenId?: string;
  /** Map percent coordinates of the click point (0-100). */
  xPercent: number;
  yPercent: number;
}

interface MapContextMenuProps {
  children: ReactNode;
  tokens: TokenData[];
  characters: Character[];
  monsters: Monster[];
  fogEnabled: boolean;
  /** Whether combat/initiative is currently active for the displayed map. */
  combatActive?: boolean;
  /** Token id whose turn is currently active (used to gate "Terminar turno"). */
  activeTurnTokenId?: string | null;
  /** Token actions. */
  onViewSheet: (token: TokenData) => void;
  onEditSheet: (token: TokenData) => void;
  onToggleHidden: (id: string) => void;
  onDeleteToken: (id: string) => void;
  onCenterCamera: (token: TokenData) => void;
  /** Combat-mode actions (only used when combatActive=true). */
  onAttack?: (token: TokenData) => void;
  onEndTurn?: () => void;
  /** Map actions. */
  onRevealFog: (xPercent: number, yPercent: number) => void;
  onHideFog: (xPercent: number, yPercent: number) => void;
  onResetFog: () => void;
  onAddCharacterAt: (character: Character, xPercent: number, yPercent: number) => void;
  onAddMonsterAt: (monster: Monster, xPercent: number, yPercent: number) => void;
  /** Ref to the map content div used for percent-coords resolution. */
  mapContainerRef: React.RefObject<HTMLDivElement>;
}

export const MapContextMenu = ({
  children, tokens, characters, monsters, fogEnabled,
  combatActive = false, activeTurnTokenId = null,
  onViewSheet, onEditSheet, onToggleHidden, onDeleteToken, onCenterCamera,
  onAttack, onEndTurn,
  onRevealFog, onHideFog, onResetFog, onAddCharacterAt, onAddMonsterAt,
  mapContainerRef,
}: MapContextMenuProps) => {
  const [ctx, setCtx] = useState<ClickContext | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const pickerCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    const container = mapContainerRef.current;
    if (!container) {
      setCtx(null);
      return;
    }
    const rect = container.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const target = e.target as HTMLElement | null;
    const tokenEl = target?.closest('[data-token-id]') as HTMLElement | null;
    const tokenId = tokenEl?.dataset.tokenId;

    setCtx({
      tokenId,
      xPercent: Math.max(0, Math.min(100, xPercent)),
      yPercent: Math.max(0, Math.min(100, yPercent)),
    });
  };

  const token = useMemo(
    () => (ctx?.tokenId ? tokens.find(t => t.id === ctx.tokenId) ?? null : null),
    [ctx?.tokenId, tokens]
  );

  const filteredChars = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(c => c.name.toLowerCase().includes(q));
  }, [characters, pickerSearch]);

  const filteredMonsters = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return monsters;
    return monsters.filter(m => m.name.toLowerCase().includes(q));
  }, [monsters, pickerSearch]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {token ? (
            combatActive ? (
              <>
                <ContextMenuItem
                  onSelect={() => onAttack?.(token)}
                  disabled={!onAttack}
                >
                  <Swords className="w-4 h-4 mr-2" /> Atacar
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => onEndTurn?.()}
                  disabled={!onEndTurn || activeTurnTokenId !== token.id}
                >
                  <SkipForward className="w-4 h-4 mr-2" /> Terminar turno
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => onViewSheet(token)}>
                  <FileText className="w-4 h-4 mr-2" /> Ver ficha
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => onCenterCamera(token)}>
                  <Crosshair className="w-4 h-4 mr-2" /> Centrar cámara
                </ContextMenuItem>
              </>
            ) : (
              <>
                <ContextMenuItem onSelect={() => onViewSheet(token)}>
                  <FileText className="w-4 h-4 mr-2" /> Ver ficha
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => onCenterCamera(token)}>
                  <Crosshair className="w-4 h-4 mr-2" /> Centrar cámara
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => onToggleHidden(token.id)}>
                  {token.hidden ? (
                    <><Eye className="w-4 h-4 mr-2" /> Mostrar a jugadores</>
                  ) : (
                    <><EyeOff className="w-4 h-4 mr-2" /> Ocultar a jugadores</>
                  )}
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => onDeleteToken(token.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </ContextMenuItem>
              </>
            )
          ) : (
            <>
              <ContextMenuItem
                onSelect={() => {
                  if (!ctx) return;
                  pickerCoordsRef.current = { x: ctx.xPercent, y: ctx.yPercent };
                  setPickerSearch('');
                  setAddPickerOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Añadir token aquí
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={!fogEnabled}
                onSelect={() => setConfirmReset(true)}
                className="text-destructive focus:text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Resetear niebla
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Confirm fog reset */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Resetear niebla del mapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción borrará toda la niebla aplicada al mapa actual. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onResetFog()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Resetear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add token picker */}
      <Dialog open={addPickerOpen} onOpenChange={setAddPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir token al mapa</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar personaje o monstruo..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3 pr-2">
              {filteredChars.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Personajes
                  </p>
                  <div className="space-y-1">
                    {filteredChars.map(c => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          const coords = pickerCoordsRef.current;
                          if (coords) onAddCharacterAt(c, coords.x, coords.y);
                          setAddPickerOpen(false);
                        }}
                      >
                        <User className="w-4 h-4 text-primary" />
                        <span className="truncate">{c.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {filteredMonsters.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Monstruos
                  </p>
                  <div className="space-y-1">
                    {filteredMonsters.map(m => (
                      <Button
                        key={m.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          const coords = pickerCoordsRef.current;
                          if (coords) onAddMonsterAt(m, coords.x, coords.y);
                          setAddPickerOpen(false);
                        }}
                      >
                        <Skull className="w-4 h-4 text-destructive" />
                        <span className="truncate">{m.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {filteredChars.length === 0 && filteredMonsters.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No se encontraron resultados
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
