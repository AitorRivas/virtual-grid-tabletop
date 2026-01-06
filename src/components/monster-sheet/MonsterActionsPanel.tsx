import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, ChevronDown, Swords, Zap, Shield, Crown, Castle } from 'lucide-react';
import { CharacterAction, ActionType, DAMAGE_TYPES, SAVES } from '@/types/dnd5e';
import { getModifier, formatModifier } from '@/types/dnd';

interface MonsterActionsPanelProps {
  actions: CharacterAction[];
  bonusActions: CharacterAction[];
  reactions: CharacterAction[];
  legendaryActions: { count: number; actions: CharacterAction[] };
  lairActions: CharacterAction[];
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencyBonus: number;
  onChange: (updates: {
    actions?: CharacterAction[];
    bonus_actions?: CharacterAction[];
    reactions?: CharacterAction[];
    legendary_actions?: { count: number; actions: CharacterAction[] };
    lair_actions?: CharacterAction[];
  }) => void;
  readOnly: boolean;
}

const ActionItem = ({ 
  action, 
  abilities, 
  profBonus, 
  onUpdate, 
  onDelete, 
  readOnly,
  showCost = false
}: {
  action: CharacterAction;
  abilities: MonsterActionsPanelProps['abilities'];
  profBonus: number;
  onUpdate: (updates: Partial<CharacterAction>) => void;
  onDelete: () => void;
  readOnly: boolean;
  showCost?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const getAbilityMod = (ability?: string) => {
    if (!ability) return 0;
    return getModifier(abilities[ability as keyof typeof abilities] || 10);
  };

  const attackBonus = action.is_attack 
    ? getAbilityMod(action.attack_ability) + profBonus + (action.attack_bonus || 0)
    : 0;

  const damageBonus = action.damage_ability && action.damage_ability !== 'none'
    ? getAbilityMod(action.damage_ability) + (action.damage_bonus || 0)
    : (action.damage_bonus || 0);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-lg bg-card/50">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Swords className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-medium text-sm truncate">{action.name}</span>
            {showCost && action.legendary_cost && (
              <span className="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                Coste: {action.legendary_cost}
              </span>
            )}
            {action.is_attack && (
              <span className="text-xs text-muted-foreground">
                {formatModifier(attackBonus)} al ataque
              </span>
            )}
            {action.damage_dice && (
              <span className="text-xs text-destructive">
                {action.damage_dice}{damageBonus !== 0 ? formatModifier(damageBonus) : ''}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180 flex-shrink-0" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 border-t space-y-3">
            {readOnly ? (
              <>
                <p className="text-sm whitespace-pre-wrap">{action.description}</p>
                {action.range && <p className="text-xs text-muted-foreground">Alcance: {action.range}</p>}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={action.name}
                      onChange={(e) => onUpdate({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Alcance</Label>
                    <Input
                      value={action.range || ''}
                      onChange={(e) => onUpdate({ range: e.target.value || undefined })}
                      placeholder="5 ft o 30/120 ft"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea
                    value={action.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`attack-${action.id}`}
                    checked={action.is_attack || false}
                    onChange={(e) => onUpdate({ is_attack: e.target.checked })}
                  />
                  <Label htmlFor={`attack-${action.id}`} className="text-xs">Es un ataque</Label>
                </div>

                {action.is_attack && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Característica (ataque)</Label>
                      <Select 
                        value={action.attack_ability || ''} 
                        onValueChange={(v) => onUpdate({ attack_ability: v as CharacterAction['attack_ability'] || undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAVES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Bonif. extra ataque</Label>
                      <Input
                        type="number"
                        value={action.attack_bonus || 0}
                        onChange={(e) => onUpdate({ attack_bonus: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Dados de daño</Label>
                    <Input
                      value={action.damage_dice || ''}
                      onChange={(e) => onUpdate({ damage_dice: e.target.value || undefined })}
                      placeholder="2d6"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de daño</Label>
                    <Select 
                      value={action.damage_type || ''} 
                      onValueChange={(v) => onUpdate({ damage_type: v as CharacterAction['damage_type'] || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAMAGE_TYPES.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Car. daño</Label>
                    <Select 
                      value={action.damage_ability || 'none'} 
                      onValueChange={(v) => onUpdate({ damage_ability: v as CharacterAction['damage_ability'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {SAVES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.abbr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {showCost && (
                  <div>
                    <Label className="text-xs">Coste (acciones legendarias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3}
                      value={action.legendary_cost || 1}
                      onChange={(e) => onUpdate({ legendary_cost: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ActionList = ({ 
  actions, 
  abilities, 
  profBonus, 
  onChange, 
  readOnly, 
  addLabel,
  showCost = false
}: {
  actions: CharacterAction[];
  abilities: MonsterActionsPanelProps['abilities'];
  profBonus: number;
  onChange: (actions: CharacterAction[]) => void;
  readOnly: boolean;
  addLabel: string;
  showCost?: boolean;
}) => {
  const addAction = () => {
    const newAction: CharacterAction = {
      id: crypto.randomUUID(),
      name: 'Nueva acción',
      type: 'action',
      description: '',
      legendary_cost: showCost ? 1 : undefined
    };
    onChange([...actions, newAction]);
  };

  if (readOnly && actions.length === 0) {
    return <p className="text-sm text-muted-foreground italic py-2">Ninguna</p>;
  }

  return (
    <div className="space-y-2">
      {actions.map(action => (
        <ActionItem
          key={action.id}
          action={action}
          abilities={abilities}
          profBonus={profBonus}
          onUpdate={(updates) => onChange(actions.map(a => a.id === action.id ? { ...a, ...updates } : a))}
          onDelete={() => onChange(actions.filter(a => a.id !== action.id))}
          readOnly={readOnly}
          showCost={showCost}
        />
      ))}
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addAction} className="w-full">
          <Plus className="w-4 h-4 mr-1" />
          {addLabel}
        </Button>
      )}
    </div>
  );
};

export const MonsterActionsPanel = ({
  actions,
  bonusActions,
  reactions,
  legendaryActions,
  lairActions,
  abilities,
  proficiencyBonus,
  onChange,
  readOnly
}: MonsterActionsPanelProps) => {
  return (
    <Tabs defaultValue="actions" className="w-full">
      <TabsList className="grid w-full grid-cols-5 text-xs">
        <TabsTrigger value="actions" className="gap-1 px-1">
          <Swords className="w-3 h-3" />
          <span className="hidden sm:inline">Acciones</span>
        </TabsTrigger>
        <TabsTrigger value="bonus" className="gap-1 px-1">
          <Zap className="w-3 h-3" />
          <span className="hidden sm:inline">Adicionales</span>
        </TabsTrigger>
        <TabsTrigger value="reactions" className="gap-1 px-1">
          <Shield className="w-3 h-3" />
          <span className="hidden sm:inline">Reacciones</span>
        </TabsTrigger>
        <TabsTrigger value="legendary" className="gap-1 px-1">
          <Crown className="w-3 h-3" />
          <span className="hidden sm:inline">Legendarias</span>
        </TabsTrigger>
        <TabsTrigger value="lair" className="gap-1 px-1">
          <Castle className="w-3 h-3" />
          <span className="hidden sm:inline">Guarida</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="actions" className="mt-4">
        <ActionList
          actions={actions}
          abilities={abilities}
          profBonus={proficiencyBonus}
          onChange={(a) => onChange({ actions: a })}
          readOnly={readOnly}
          addLabel="Añadir acción"
        />
      </TabsContent>

      <TabsContent value="bonus" className="mt-4">
        <ActionList
          actions={bonusActions}
          abilities={abilities}
          profBonus={proficiencyBonus}
          onChange={(a) => onChange({ bonus_actions: a })}
          readOnly={readOnly}
          addLabel="Añadir acción adicional"
        />
      </TabsContent>

      <TabsContent value="reactions" className="mt-4">
        <ActionList
          actions={reactions}
          abilities={abilities}
          profBonus={proficiencyBonus}
          onChange={(a) => onChange({ reactions: a })}
          readOnly={readOnly}
          addLabel="Añadir reacción"
        />
      </TabsContent>

      <TabsContent value="legendary" className="mt-4 space-y-4">
        {!readOnly && (
          <div>
            <Label className="text-xs">Acciones legendarias por turno</Label>
            <Input
              type="number"
              min={0}
              max={5}
              value={legendaryActions.count}
              onChange={(e) => onChange({ 
                legendary_actions: { 
                  ...legendaryActions, 
                  count: parseInt(e.target.value) || 0 
                } 
              })}
              className="w-24"
            />
          </div>
        )}
        {readOnly && legendaryActions.count > 0 && (
          <p className="text-sm text-muted-foreground">
            Puede realizar {legendaryActions.count} acción(es) legendaria(s) por turno.
          </p>
        )}
        <ActionList
          actions={legendaryActions.actions}
          abilities={abilities}
          profBonus={proficiencyBonus}
          onChange={(a) => onChange({ legendary_actions: { ...legendaryActions, actions: a } })}
          readOnly={readOnly}
          addLabel="Añadir acción legendaria"
          showCost
        />
      </TabsContent>

      <TabsContent value="lair" className="mt-4">
        <ActionList
          actions={lairActions}
          abilities={abilities}
          profBonus={proficiencyBonus}
          onChange={(a) => onChange({ lair_actions: a })}
          readOnly={readOnly}
          addLabel="Añadir acción de guarida"
        />
      </TabsContent>
    </Tabs>
  );
};
