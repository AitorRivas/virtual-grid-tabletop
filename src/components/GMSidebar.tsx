import { useState, useCallback } from 'react';
import { Map, Users, Swords, ChevronRight, ChevronLeft, Monitor, Layers, Clapperboard, Image, X } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MapManager } from './MapManager';
import { TokenToolbar } from './TokenToolbar';
import { SceneManager } from './SceneManager';
import { CombatTracker, type CombatEntry } from './CombatTracker';
import { MapData, SceneData } from '@/hooks/useGameState';
import { TokenData, TokenColor, TokenStatus } from './MapViewer';
import { Character, Monster } from '@/types/dnd';
import { cn } from '@/lib/utils';

type SidebarSection = 'maps' | 'tokens' | 'scenes' | 'initiative';

interface GMSidebarProps {
  // Maps
  maps: MapData[];
  activeMapId: string | null;
  onSelectMap: (id: string) => void;
  onAddMap: (name?: string) => string;
  onRemoveMap: (id: string) => void;
  onRenameMap: (id: string, name: string) => void;
  // Tokens
  tokens: TokenData[];
  selectedToken: string | null;
  onSelectToken: (id: string) => void;
  onDeleteToken: (id: string) => void;
  onTokenNameChange: (id: string, name: string) => void;
  onStatusChange: (id: string, status: TokenStatus) => void;
  onTokenSizeChange: (id: string, size: number) => void;
  onTokenRotationChange: (id: string, rotation: number) => void;
  onToggleCondition: (tokenId: string, conditionId: string) => void;
  onHpChange: (id: string, hpCurrent: number, hpMax: number) => void;
  onTokenLightChange: (id: string, updates: { lightEnabled?: boolean; lightRadius?: number; lightSoftness?: number; lightFlicker?: boolean }) => void;
  selectedColor: TokenColor;
  onColorChange: (color: TokenColor) => void;
  isAddingToken: boolean;
  onToggleAddToken: () => void;
  onClearAll: () => void;
  defaultTokenSize: number;
  onDefaultTokenSizeChange: (size: number) => void;
  onAddCharacterToMap: (character: Character) => void;
  onAddMonsterToMap: (monster: Monster) => void;
  // Player view
  onOpenPlayerView: () => void;
  // Combat / Initiative
  combatEntries: CombatEntry[];
  onCombatEntriesChange: (entries: CombatEntry[]) => void;
  activeInitiativeIndex: number;
  onActiveInitiativeIndexChange: (index: number) => void;
  onStartInitiative: () => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onEndInitiative: () => void;
  onAddFromMapToCombat: () => void;
  isInitiativeActive: boolean;
  combatMode: boolean;
  onToggleCombatMode: () => void;
  // Scenes
  scenes: SceneData[];
  activeSceneId: string | null;
  onAddScene: (name: string) => string;
  onRemoveScene: (id: string) => void;
  onUpdateScene: (id: string, updates: Partial<SceneData>) => void;
  onActivateScene: (id: string) => void;
  // Narrative overlay
  narrativeOverlay: { image: string | null; text: string; visible: boolean };
  onShowNarrativeImage: (image: string, text?: string) => void;
  onHideNarrativeImage: () => void;
}

export const GMSidebar = ({
  maps,
  activeMapId,
  onSelectMap,
  onAddMap,
  onRemoveMap,
  onRenameMap,
  tokens,
  selectedToken,
  onSelectToken,
  onDeleteToken,
  onTokenNameChange,
  onStatusChange,
  onTokenSizeChange,
  onTokenRotationChange,
  onToggleCondition,
  onHpChange,
  onTokenLightChange,
  selectedColor,
  onColorChange,
  isAddingToken,
  onToggleAddToken,
  onClearAll,
  defaultTokenSize,
  onDefaultTokenSizeChange,
  onAddCharacterToMap,
  onAddMonsterToMap,
  onOpenPlayerView,
  initiativeOrder,
  activeInitiativeIndex,
  onStartInitiative,
  onNextTurn,
  onEndInitiative,
  isInitiativeActive,
  scenes,
  activeSceneId,
  onAddScene,
  onRemoveScene,
  onUpdateScene,
  onActivateScene,
  narrativeOverlay,
  onShowNarrativeImage,
  onHideNarrativeImage,
}: GMSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<SidebarSection>('tokens');

  const navItems: { id: SidebarSection; icon: typeof Map; label: string }[] = [
    { id: 'maps', icon: Layers, label: 'Mapas' },
    { id: 'tokens', icon: Users, label: 'Tokens' },
    { id: 'scenes', icon: Clapperboard, label: 'Escenas' },
    { id: 'initiative', icon: Swords, label: 'Iniciativa' },
  ];

  const sortedInitiativeTokens = initiativeOrder
    .map(id => tokens.find(t => t.id === id))
    .filter(Boolean) as TokenData[];

  return (
    <div className={cn(
      "h-full flex bg-card/95 backdrop-blur-sm border-r border-border/50 transition-all duration-300",
      collapsed ? "w-14" : "w-96"
    )}>
      {/* Icon nav strip */}
      <div className="w-14 shrink-0 flex flex-col items-center py-2 gap-1 border-r border-border/30">
        {/* Player view button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 mb-2"
              onClick={onOpenPlayerView}
            >
              <Monitor className="w-5 h-5 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Vista de jugadores</TooltipContent>
        </Tooltip>

        <div className="h-px w-8 bg-border/50 mb-1" />

        {navItems.map(item => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeSection === item.id && !collapsed ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-10 h-10 p-0",
                  activeSection === item.id && !collapsed && "bg-primary/15 text-primary"
                )}
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false);
                    setActiveSection(item.id);
                  } else if (activeSection === item.id) {
                    setCollapsed(true);
                  } else {
                    setActiveSection(item.id);
                  }
                }}
              >
                <item.icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}

        <div className="flex-1" />

        {/* Narrative overlay quick toggle */}
        {narrativeOverlay.visible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-10 h-10 p-0 mb-1"
                onClick={onHideNarrativeImage}
              >
                <X className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Ocultar imagen narrativa</TooltipContent>
          </Tooltip>
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Content area */}
      {!collapsed && (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden animate-fade-in">
          {/* Section header */}
          <div className="px-3 py-2.5 border-b border-border/50 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">
              {navItems.find(n => n.id === activeSection)?.label}
            </h2>
          </div>

          {/* Maps section */}
          {activeSection === 'maps' && (
            <ScrollArea className="flex-1">
              <MapManager
                maps={maps}
                activeMapId={activeMapId}
                onSelectMap={onSelectMap}
                onAddMap={onAddMap}
                onRemoveMap={onRemoveMap}
                onRenameMap={onRenameMap}
              />
            </ScrollArea>
          )}

          {/* Tokens section */}
          {activeSection === 'tokens' && (
            <div className="flex-1 overflow-hidden">
              <TokenToolbar
                selectedColor={selectedColor}
                onColorChange={onColorChange}
                isAddingToken={isAddingToken}
                onToggleAddToken={onToggleAddToken}
                onClearAll={onClearAll}
                tokens={tokens}
                selectedToken={selectedToken}
                onSelectToken={onSelectToken}
                onDeleteToken={onDeleteToken}
                onTokenNameChange={onTokenNameChange}
                onStatusChange={onStatusChange}
                onTokenSizeChange={onTokenSizeChange}
                onTokenRotationChange={onTokenRotationChange}
                onToggleCondition={onToggleCondition}
                onHpChange={onHpChange}
                onTokenLightChange={onTokenLightChange}
                defaultTokenSize={defaultTokenSize}
                onDefaultTokenSizeChange={onDefaultTokenSizeChange}
                onAddCharacterToMap={onAddCharacterToMap}
                onAddMonsterToMap={onAddMonsterToMap}
              />
            </div>
          )}

          {/* Scenes section */}
          {activeSection === 'scenes' && (
            <ScrollArea className="flex-1">
              <SceneManager
                scenes={scenes}
                activeSceneId={activeSceneId}
                maps={maps}
                onAddScene={onAddScene}
                onRemoveScene={onRemoveScene}
                onUpdateScene={onUpdateScene}
                onActivateScene={onActivateScene}
              />
            </ScrollArea>
          )}

          {/* Initiative section */}
          {activeSection === 'initiative' && (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {!isInitiativeActive ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Ordena los tokens por iniciativa y comienza el combate.
                    </p>
                    <Button
                      onClick={onStartInitiative}
                      className="w-full gap-2"
                      size="sm"
                      disabled={tokens.filter(t => t.status === 'active').length === 0}
                    >
                      <Swords className="w-4 h-4" />
                      Iniciar combate
                    </Button>
                    {tokens.filter(t => t.status === 'active').length === 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Añade tokens activos para iniciar
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={onNextTurn}
                        className="flex-1 gap-2"
                        size="sm"
                      >
                        Siguiente turno
                      </Button>
                      <Button
                        onClick={onEndInitiative}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        Fin
                      </Button>
                    </div>

                    <div className="space-y-1">
                      {sortedInitiativeTokens.map((token, index) => (
                        <div
                          key={token.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-sm transition-all",
                            index === activeInitiativeIndex
                              ? "bg-primary/15 border border-primary/30 text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          <span className="w-5 text-center font-mono text-xs">{index + 1}</span>
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full border border-foreground/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden",
                              !token.imageUrl && `bg-token-${token.color}`
                            )}
                          >
                            {token.imageUrl ? (
                              <img src={token.imageUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              token.name.charAt(0)
                            )}
                          </div>
                          <span className="truncate flex-1">{token.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">{token.initiative}</span>
                          {index === activeInitiativeIndex && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};
