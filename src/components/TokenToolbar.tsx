import { Plus, Trash2, Users, Swords, ChevronLeft, ChevronRight, Skull, RotateCcw, Ruler, Sparkles, ChevronDown, ChevronUp, LogIn, LogOut, Database, Heart } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="bg-card border-r border-border flex flex-col h-full">
      {/* Auth header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-secondary/30">
        {user ? (
          <>
            <span className="text-sm text-muted-foreground truncate flex-1">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1">
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="w-full gap-2">
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </Button>
        )}
      </div>

      <Tabs defaultValue="tokens" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b flex-shrink-0">
          <TabsTrigger value="tokens" className="gap-1 text-xs">
            <Users className="w-4 h-4" />
            Mapa
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1 text-xs" disabled={!user}>
            <Database className="w-4 h-4" />
            Biblioteca
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden data-[state=active]:flex-1">
          <div className="p-4 border-b border-border flex-shrink-0">
            {/* Add token button */}
            <Button
              onClick={onToggleAddToken}
              variant={isAddingToken ? "default" : "secondary"}
              className="w-full gap-2 mb-4"
              disabled={combatMode}
            >
              <Plus className="w-4 h-4" />
              {isAddingToken ? 'Haz clic en el mapa' : 'Añadir token'}
            </Button>

            {/* Color picker */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-card-foreground">
                Color del token:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {tokenColors.map(({ color, label, class: colorClass }) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`w-full aspect-square rounded-full ${colorClass} border-2 ${
                      selectedColor === color ? 'border-primary' : 'border-transparent'
                    } hover:scale-110 transition-transform`}
                    title={label}
                  />
                ))}
              </div>
            </div>

            {/* Default token size slider */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Tamaño por defecto: {defaultTokenSize}px
              </label>
              <Slider
                value={[defaultTokenSize]}
                onValueChange={(value) => onDefaultTokenSizeChange(value[0])}
                min={20}
                max={400}
                step={5}
                className="w-full"
              />
            </div>

            {tokens.length > 0 && (
              <Button
                onClick={onClearAll}
                variant="destructive"
                size="sm"
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar todos
              </Button>
            )}
          </div>

          {/* Combat Mode Section */}
          <div className="p-4 border-b border-border bg-secondary/30 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-5 h-5 text-destructive" />
              <h3 className="font-bold text-card-foreground">Modo Combate</h3>
            </div>

            {!combatMode ? (
              <Button
                onClick={onStartCombat}
                variant="default"
                className="w-full gap-2 bg-destructive hover:bg-destructive/90"
                disabled={tokens.filter(t => t.status === 'active').length === 0}
              >
                <Swords className="w-4 h-4" />
                Iniciar Combate
              </Button>
            ) : (
              <div className="space-y-3">
                {currentTurnTokenId && (
                  <div className="bg-primary/20 border border-primary/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Turno actual</p>
                    <p className="font-bold text-primary">
                      {combatOrder.find(t => t.id === currentTurnTokenId)?.name}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={onPrevTurn}
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    onClick={onNextTurn}
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  onClick={onEndCombat}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  Finalizar Combate
                </Button>
              </div>
            )}
          </div>

          {/* Token list */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-2">
              {tokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay tokens en el mapa
                </div>
              ) : (
                <>
                  {combatMode && combatOrder.length > 0 && (
                    <div className="mb-3 pb-2 border-b border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Orden de iniciativa:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {combatOrder.map((token, index) => (
                          <span
                            key={token.id}
                            className={`text-xs px-2 py-1 rounded ${
                              token.id === currentTurnTokenId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            {index + 1}. {token.name} ({token.initiative})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {tokens.map((token) => (
                    <Collapsible
                      key={token.id}
                      open={expandedTokens.has(token.id)}
                      onOpenChange={() => toggleTokenExpanded(token.id)}
                    >
                      <div
                        className={`rounded-lg border ${
                          token.id === currentTurnTokenId
                            ? 'border-primary bg-primary/10'
                            : selectedToken === token.id
                            ? 'border-primary bg-secondary'
                            : token.status !== 'active'
                            ? 'border-border bg-secondary/30 opacity-60'
                            : 'border-border bg-secondary/50'
                        } hover:bg-secondary transition-colors cursor-pointer`}
                        onClick={() => onSelectToken(token.id)}
                      >
                        <div className="p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-8 h-8 rounded-full ${
                                token.status === 'dead' 
                                  ? 'bg-gray-800' 
                                  : tokenColors.find((c) => c.color === token.color)?.class
                              } border-2 border-foreground/30 flex-shrink-0 flex items-center justify-center`}
                            >
                              {token.status === 'dead' && <Skull className="w-4 h-4 text-white" />}
                            </div>
                            <Input
                              value={token.name}
                              onChange={(e) => onTokenNameChange(token.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 h-8 bg-background"
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteToken(token.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* HP Bar */}
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Heart className="w-3 h-3 text-destructive" />
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  type="number"
                                  value={token.hpCurrent}
                                  onChange={(e) => onHpChange(token.id, parseInt(e.target.value) || 0, token.hpMax)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 w-14 text-xs text-center bg-background"
                                  min={0}
                                />
                                <span className="text-xs text-muted-foreground">/</span>
                                <Input
                                  type="number"
                                  value={token.hpMax}
                                  onChange={(e) => onHpChange(token.id, token.hpCurrent, parseInt(e.target.value) || 1)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 w-14 text-xs text-center bg-background"
                                  min={1}
                                />
                              </div>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-300"
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

                          {token.conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {token.conditions.slice(0, 4).map(condId => {
                                const condition = conditions.find(c => c.id === condId);
                                if (!condition) return null;
                                const Icon = condition.icon;
                                return (
                                  <span
                                    key={condId}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                                    style={{ 
                                      backgroundColor: `hsl(${condition.color} / 0.3)`,
                                      color: `hsl(${condition.color})`,
                                    }}
                                    title={condition.description}
                                  >
                                    <Icon className="w-3 h-3" />
                                    {condition.nameEs}
                                  </span>
                                );
                              })}
                              {token.conditions.length > 4 && (
                                <span className="text-xs text-muted-foreground">+{token.conditions.length - 4}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-muted-foreground">Iniciativa:</label>
                              <Input
                                type="number"
                                value={token.initiative}
                                onChange={(e) => onInitiativeChange(token.id, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 text-sm bg-background"
                                disabled={combatMode}
                              />
                            </div>
                            
                            {token.status !== 'active' ? (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(token.id, 'active');
                                }}
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Revivir
                              </Button>
                            ) : (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(token.id, 'dead');
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs hover:bg-gray-700 hover:text-white"
                              >
                                <Skull className="w-3 h-3" />
                                Muerto
                              </Button>
                            )}
                          </div>

                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 gap-2 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Sparkles className="w-3 h-3" />
                              Estados y tamaño
                              {expandedTokens.has(token.id) ? (
                                <ChevronUp className="w-3 h-3 ml-auto" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-auto" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border/50">
                            <div className="pt-3">
                              <label className="text-xs text-muted-foreground flex items-center gap-1">
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
                                className="w-full mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
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
              <p>Inicia sesión para acceder a tu biblioteca</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
