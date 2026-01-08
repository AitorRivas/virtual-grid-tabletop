import { Plus, Trash2, Users, Swords, ChevronLeft, ChevronRight, Skull, RotateCcw, RotateCw, Ruler, Sparkles, ChevronDown, ChevronUp, Database, Heart, MinusCircle, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Slider } from './ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TokenColor, TokenData, TokenStatus } from './MapViewer';
import { ConditionManager } from './ConditionManager';
import { CharacterManager } from './CharacterManager';
import { conditions } from '@/data/conditions';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Character, Monster } from '@/types/dnd';

interface TokenToolbarProps {
  selectedColor: TokenColor;
  onColorChange: (color: TokenColor) => void;
  isAddingToken: boolean;
  onToggleAddToken: () => void;
  onClearAll: () => void;
  tokens: TokenData[];
  selectedToken: string | null;
  onSelectToken: (id: string) => void;
  onDeleteToken: (id: string) => void;
  onTokenNameChange: (id: string, name: string) => void;
  onInitiativeChange: (id: string, initiative: number) => void;
  onStatusChange: (id: string, status: TokenStatus) => void;
  onTokenSizeChange: (id: string, size: number) => void;
  onTokenRotationChange: (id: string, rotation: number) => void;
  onToggleCondition: (tokenId: string, conditionId: string) => void;
  onHpChange: (id: string, hpCurrent: number, hpMax: number) => void;
  combatMode: boolean;
  currentTurnTokenId: string | null;
  combatOrder: TokenData[];
  onStartCombat: () => void;
  onEndCombat: () => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  defaultTokenSize: number;
  onDefaultTokenSizeChange: (size: number) => void;
  onAddCharacterToMap: (character: Character) => void;
  onAddMonsterToMap: (monster: Monster) => void;
}

const tokenColors: { color: TokenColor; label: string; class: string }[] = [
  { color: 'red', label: 'Rojo', class: 'bg-token-red' },
  { color: 'blue', label: 'Azul', class: 'bg-token-blue' },
  { color: 'green', label: 'Verde', class: 'bg-token-green' },
  { color: 'yellow', label: 'Amarillo', class: 'bg-token-yellow' },
  { color: 'purple', label: 'Morado', class: 'bg-token-purple' },
  { color: 'orange', label: 'Naranja', class: 'bg-token-orange' },
  { color: 'pink', label: 'Rosa', class: 'bg-token-pink' },
  { color: 'cyan', label: 'Cian', class: 'bg-token-cyan' },
];

export const TokenToolbar = ({
  selectedColor,
  onColorChange,
  isAddingToken,
  onToggleAddToken,
  onClearAll,
  tokens,
  selectedToken,
  onSelectToken,
  onDeleteToken,
  onTokenNameChange,
  onInitiativeChange,
  onStatusChange,
  onTokenSizeChange,
  onTokenRotationChange,
  onToggleCondition,
  onHpChange,
  combatMode,
  currentTurnTokenId,
  combatOrder,
  onStartCombat,
  onEndCombat,
  onNextTurn,
  onPrevTurn,
  defaultTokenSize,
  onDefaultTokenSizeChange,
  onAddCharacterToMap,
  onAddMonsterToMap,
}: TokenToolbarProps) => {
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const toggleTokenExpanded = (tokenId: string) => {
    setExpandedTokens(prev => {
      const next = new Set(prev);
      if (next.has(tokenId)) {
        next.delete(tokenId);
      } else {
        next.add(tokenId);
      }
      return next;
    });
  };

  // Quick HP adjustment
  const handleQuickHpChange = (token: TokenData, delta: number) => {
    const newHp = Math.max(0, Math.min(token.hpMax, token.hpCurrent + delta));
    onHpChange(token.id, newHp, token.hpMax);
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col h-full">
      <Tabs defaultValue="tokens" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border/50 bg-secondary/30 flex-shrink-0 h-11">
          <TabsTrigger value="tokens" className="gap-1.5 text-xs data-[state=active]:bg-primary/20 rounded-none">
            <Users className="w-4 h-4" />
            Mapa
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs data-[state=active]:bg-primary/20 rounded-none" disabled={!user}>
            <Database className="w-4 h-4" />
            Biblioteca
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden data-[state=active]:flex-1">
          {/* Combat Mode Section - Compact */}
          <div className="p-3 border-b border-border/50 bg-gradient-to-r from-destructive/10 to-transparent flex-shrink-0">
            {!combatMode ? (
              <Button
                onClick={onStartCombat}
                variant="default"
                size="sm"
                className="w-full gap-2 bg-destructive hover:bg-destructive/90 h-9"
                disabled={tokens.filter(t => t.status === 'active').length === 0}
              >
                <Swords className="w-4 h-4" />
                Iniciar Combate
              </Button>
            ) : (
              <div className="space-y-2">
                {currentTurnTokenId && (
                  <div className="bg-primary/20 border border-primary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Turno actual</p>
                    <p className="font-bold text-primary text-sm truncate">
                      {combatOrder.find(t => t.id === currentTurnTokenId)?.name}
                    </p>
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Button onClick={onPrevTurn} variant="secondary" size="sm" className="flex-1 h-8 gap-1">
                    <ChevronLeft className="w-4 h-4" />
                    Ant.
                  </Button>
                  <Button onClick={onNextTurn} variant="default" size="sm" className="flex-1 h-8 gap-1">
                    Sig.
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={onEndCombat} variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground">
                  Finalizar Combate
                </Button>
              </div>
            )}
          </div>

          {/* Add Token Section - Collapsible */}
          <Collapsible defaultOpen={tokens.length === 0}>
            <CollapsibleTrigger asChild>
              <div className="p-3 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Añadir Token
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 space-y-3 border-b border-border/50 bg-secondary/10">
                <Button
                  onClick={onToggleAddToken}
                  variant={isAddingToken ? "default" : "secondary"}
                  className="w-full gap-2 h-9"
                  disabled={combatMode}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  {isAddingToken ? 'Haz clic en el mapa' : 'Colocar en mapa'}
                </Button>

                {/* Color picker - Compact */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Color:</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {tokenColors.map(({ color, label, class: colorClass }) => (
                      <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        className={`aspect-square rounded-full ${colorClass} border-2 ${
                          selectedColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                        } hover:scale-110 transition-all`}
                        title={label}
                      />
                    ))}
                  </div>
                </div>

                {/* Default size - Compact */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="text-muted-foreground flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      Tamaño
                    </label>
                    <span className="text-foreground">{defaultTokenSize}px</span>
                  </div>
                  <Slider
                    value={[defaultTokenSize]}
                    onValueChange={(value) => onDefaultTokenSizeChange(value[0])}
                    min={20}
                    max={400}
                    step={5}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Token list */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1.5">
              {/* Combat order summary */}
              {combatMode && combatOrder.length > 0 && (
                <div className="mb-2 p-2 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Orden de iniciativa
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {combatOrder.map((token, index) => (
                      <span
                        key={token.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                          token.id === currentTurnTokenId
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-secondary/50 text-muted-foreground'
                        }`}
                      >
                        {index + 1}. {token.name.slice(0, 8)}{token.name.length > 8 ? '…' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No hay tokens en el mapa</p>
                </div>
              ) : (
                <>
                  {tokens.map((token) => (
                    <Collapsible
                      key={token.id}
                      open={expandedTokens.has(token.id)}
                      onOpenChange={() => toggleTokenExpanded(token.id)}
                    >
                      <div
                        className={`rounded-lg border transition-all ${
                          token.id === currentTurnTokenId
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                            : selectedToken === token.id
                            ? 'border-primary/50 bg-secondary'
                            : token.status !== 'active'
                            ? 'border-border/30 bg-secondary/20 opacity-50'
                            : 'border-border/50 bg-secondary/30 hover:bg-secondary/50'
                        } cursor-pointer`}
                        onClick={() => onSelectToken(token.id)}
                      >
                        <div className="p-2.5">
                          {/* Token header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-7 h-7 rounded-full ${
                                token.status === 'dead' 
                                  ? 'bg-gray-700' 
                                  : token.imageUrl 
                                    ? '' 
                                    : tokenColors.find((c) => c.color === token.color)?.class
                              } border-2 border-foreground/20 flex-shrink-0 flex items-center justify-center overflow-hidden`}
                            >
                              {token.imageUrl ? (
                                <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : token.status === 'dead' ? (
                                <Skull className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <span className="text-white text-xs font-bold">{token.name.charAt(0)}</span>
                              )}
                            </div>
                            <Input
                              value={token.name}
                              onChange={(e) => onTokenNameChange(token.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 h-7 bg-background/50 text-sm px-2"
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteToken(token.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* HP Bar with quick controls */}
                          <div className="mb-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-destructive/20"
                                onClick={(e) => { e.stopPropagation(); handleQuickHpChange(token, -1); }}
                              >
                                <MinusCircle className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                              <div className="flex items-center gap-0.5 flex-1 justify-center">
                                <Heart className="w-3 h-3 text-destructive" />
                                <Input
                                  type="number"
                                  value={token.hpCurrent}
                                  onChange={(e) => onHpChange(token.id, parseInt(e.target.value) || 0, token.hpMax)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-5 w-10 text-[10px] text-center bg-transparent border-0 p-0"
                                  min={0}
                                />
                                <span className="text-[10px] text-muted-foreground">/</span>
                                <Input
                                  type="number"
                                  value={token.hpMax}
                                  onChange={(e) => onHpChange(token.id, token.hpCurrent, parseInt(e.target.value) || 1)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-5 w-10 text-[10px] text-center bg-transparent border-0 p-0"
                                  min={1}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-green-500/20"
                                onClick={(e) => { e.stopPropagation(); handleQuickHpChange(token, 1); }}
                              >
                                <PlusCircle className="w-3.5 h-3.5 text-green-500" />
                              </Button>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.max(0, Math.min(100, (token.hpCurrent / token.hpMax) * 100))}%`,
                                  backgroundColor: token.hpCurrent / token.hpMax > 0.5 
                                    ? 'hsl(142, 76%, 36%)' 
                                    : token.hpCurrent / token.hpMax > 0.25 
                                    ? 'hsl(45, 93%, 47%)'
                                    : 'hsl(0, 84%, 60%)'
                                }}
                              />
                            </div>
                          </div>

                          {/* Condition badges */}
                          {token.conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {token.conditions.slice(0, 3).map(condId => {
                                const condition = conditions.find(c => c.id === condId);
                                if (!condition) return null;
                                const Icon = condition.icon;
                                return (
                                  <span
                                    key={condId}
                                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px]"
                                    style={{ 
                                      backgroundColor: `hsl(${condition.color} / 0.2)`,
                                      color: `hsl(${condition.color})`,
                                    }}
                                    title={condition.description}
                                  >
                                    <Icon className="w-2.5 h-2.5" />
                                    {condition.nameEs.slice(0, 6)}
                                  </span>
                                );
                              })}
                              {token.conditions.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{token.conditions.length - 3}</span>
                              )}
                            </div>
                          )}

                          {/* Initiative and Status row */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <label className="text-[10px] text-muted-foreground">Init:</label>
                                <Input
                                  type="number"
                                  value={token.initiative}
                                  onChange={(e) => onInitiativeChange(token.id, parseInt(e.target.value) || 0)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 w-12 text-xs bg-background/50 px-1"
                                  disabled={combatMode}
                                />
                              </div>
                            </div>
                            
                            {token.status !== 'active' ? (
                              <Button
                                onClick={(e) => { e.stopPropagation(); onStatusChange(token.id, 'active'); }}
                                variant="outline"
                                size="sm"
                                className="h-6 gap-1 text-[10px] px-2"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Revivir
                              </Button>
                            ) : (
                              <Button
                                onClick={(e) => { e.stopPropagation(); onStatusChange(token.id, 'dead'); }}
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 text-[10px] px-2 hover:bg-gray-700 hover:text-white"
                              >
                                <Skull className="w-3 h-3" />
                                Muerto
                              </Button>
                            )}
                          </div>

                          {/* Expand button */}
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Sparkles className="w-3 h-3" />
                              Más opciones
                              {expandedTokens.has(token.id) ? (
                                <ChevronUp className="w-3 h-3 ml-auto" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-auto" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                          <div className="px-2.5 pb-2.5 pt-0 space-y-3 border-t border-border/30">
                            <div className="pt-2.5">
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                                <Ruler className="w-3 h-3" />
                                Tamaño: {token.size}px
                              </label>
                              <Slider
                                value={[token.size]}
                                onValueChange={(value) => onTokenSizeChange(token.id, value[0])}
                                onClick={(e) => e.stopPropagation()}
                                min={20}
                                max={400}
                                step={5}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                                <RotateCw className="w-3 h-3" />
                                Rotación: {token.rotation || 0}°
                              </label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => { e.stopPropagation(); onTokenRotationChange(token.id, ((token.rotation || 0) - 45 + 360) % 360); }}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                                <Slider
                                  value={[token.rotation || 0]}
                                  onValueChange={(value) => onTokenRotationChange(token.id, value[0])}
                                  onClick={(e) => e.stopPropagation()}
                                  min={0}
                                  max={359}
                                  step={15}
                                  className="flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => { e.stopPropagation(); onTokenRotationChange(token.id, ((token.rotation || 0) + 45) % 360); }}
                                >
                                  <RotateCw className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-2">
                                <Sparkles className="w-3 h-3" />
                                Estados alterados
                              </label>
                              <ConditionManager
                                activeConditions={token.conditions}
                                onToggleCondition={(conditionId) => onToggleCondition(token.id, conditionId)}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}

                  {/* Clear all button at the bottom */}
                  {tokens.length > 0 && (
                    <Button
                      onClick={onClearAll}
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar todos
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="library" className="flex-1 m-0 overflow-hidden data-[state=active]:flex-1">
          {user ? (
            <CharacterManager
              onAddCharacterToMap={onAddCharacterToMap}
              onAddMonsterToMap={onAddMonsterToMap}
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Inicia sesión para acceder a tu biblioteca</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
