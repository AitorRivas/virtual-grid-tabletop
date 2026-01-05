import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, Swords, Zap, Shield, Star } from 'lucide-react';
import { getModifier, formatModifier } from '@/types/dnd';
import { CharacterAction, ActionType, DAMAGE_TYPES, SAVES } from '@/types/dnd5e';

interface ActionsPanelProps {
  actions: CharacterAction[];
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencyBonus: number;
  onChange: (actions: CharacterAction[]) => void;
  readOnly?: boolean;
}

const ACTION_TYPES: { value: ActionType; label: string; icon: React.ReactNode }[] = [
  { value: 'action', label: 'Acción', icon: <Swords className="w-3 h-3" /> },
  { value: 'bonus_action', label: 'Acción Adicional', icon: <Zap className="w-3 h-3" /> },
  { value: 'reaction', label: 'Reacción', icon: <Shield className="w-3 h-3" /> },
  { value: 'legendary', label: 'Legendaria', icon: <Star className="w-3 h-3" /> },
  { value: 'free', label: 'Libre', icon: null },
];

const ABILITY_OPTIONS = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'dexterity', label: 'Destreza' },
  { value: 'constitution', label: 'Constitución' },
  { value: 'intelligence', label: 'Inteligencia' },
  { value: 'wisdom', label: 'Sabiduría' },
  { value: 'charisma', label: 'Carisma' },
];

const emptyAction: Omit<CharacterAction, 'id'> = {
  name: '',
  type: 'action',
  description: '',
  is_attack: false,
};

export const ActionsPanel = ({
  actions,
  abilities,
  proficiencyBonus,
  onChange,
  readOnly = false
}: ActionsPanelProps) => {
  const [showNewAction, setShowNewAction] = useState(false);
  const [newAction, setNewAction] = useState<Omit<CharacterAction, 'id'>>(emptyAction);
  const [expandedSections, setExpandedSections] = useState<ActionType[]>(['action', 'bonus_action', 'reaction']);

  const addAction = () => {
    if (!newAction.name.trim()) return;
    const action: CharacterAction = {
      ...newAction,
      id: crypto.randomUUID(),
    };
    onChange([...actions, action]);
    setNewAction(emptyAction);
    setShowNewAction(false);
  };

  const deleteAction = (id: string) => {
    onChange(actions.filter(a => a.id !== id));
  };

  const calculateAttackBonus = (action: CharacterAction): string => {
    if (!action.is_attack || !action.attack_ability) return '';
    const abilityMod = getModifier(abilities[action.attack_ability as keyof typeof abilities] || 10);
    const total = abilityMod + proficiencyBonus + (action.attack_bonus || 0);
    return formatModifier(total);
  };

  const calculateDamage = (action: CharacterAction): string => {
    if (!action.damage_dice) return '';
    let damageBonus = action.damage_bonus || 0;
    if (action.damage_ability && action.damage_ability !== 'none') {
      damageBonus += getModifier(abilities[action.damage_ability as keyof typeof abilities] || 10);
    }
    const damageType = DAMAGE_TYPES.find(d => d.value === action.damage_type)?.label || '';
    return `${action.damage_dice}${damageBonus !== 0 ? formatModifier(damageBonus) : ''} ${damageType}`.trim();
  };

  const groupedActions = ACTION_TYPES.reduce((acc, type) => {
    acc[type.value] = actions.filter(a => a.type === type.value);
    return acc;
  }, {} as Record<ActionType, CharacterAction[]>);

  const toggleSection = (type: ActionType) => {
    setExpandedSections(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="space-y-3">
      {/* Add Action Button */}
      {!readOnly && (
        <Dialog open={showNewAction} onOpenChange={setShowNewAction}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Nueva Acción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Acción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={newAction.name}
                    onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                    placeholder="Espada larga"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={newAction.type} 
                    onValueChange={(v) => setNewAction({ ...newAction, type: v as ActionType })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newAction.is_attack}
                  onCheckedChange={(checked) => setNewAction({ ...newAction, is_attack: !!checked })}
                />
                <Label>Es un ataque</Label>
              </div>

              {newAction.is_attack && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Característica de ataque</Label>
                      <Select
                        value={newAction.attack_ability || ''}
                        onValueChange={(v) => setNewAction({ ...newAction, attack_ability: v as any })}
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {ABILITY_OPTIONS.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Bonus adicional</Label>
                      <Input
                        type="number"
                        value={newAction.attack_bonus || ''}
                        onChange={(e) => setNewAction({ ...newAction, attack_bonus: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Dados de daño</Label>
                      <Input
                        value={newAction.damage_dice || ''}
                        onChange={(e) => setNewAction({ ...newAction, damage_dice: e.target.value })}
                        placeholder="1d8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de daño</Label>
                      <Select
                        value={newAction.damage_type || ''}
                        onValueChange={(v) => setNewAction({ ...newAction, damage_type: v as any })}
                      >
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
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
                        value={newAction.damage_ability || ''}
                        onValueChange={(v) => setNewAction({ ...newAction, damage_ability: v as any })}
                      >
                        <SelectTrigger><SelectValue placeholder="Car." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {ABILITY_OPTIONS.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Alcance</Label>
                    <Input
                      value={newAction.range || ''}
                      onChange={(e) => setNewAction({ ...newAction, range: e.target.value })}
                      placeholder="5 pies o 30/120 pies"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  placeholder="Describe la acción..."
                  rows={3}
                />
              </div>

              <Button onClick={addAction} className="w-full">Crear Acción</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Groups */}
      {ACTION_TYPES.filter(type => groupedActions[type.value]?.length > 0 || !readOnly).map((type) => {
        const typeActions = groupedActions[type.value] || [];
        if (typeActions.length === 0 && readOnly) return null;

        return (
          <Collapsible
            key={type.value}
            open={expandedSections.includes(type.value)}
            onOpenChange={() => toggleSection(type.value)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-card border rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-2">
                {type.icon}
                <span className="text-sm font-semibold">{type.label}</span>
                <span className="text-xs text-muted-foreground">({typeActions.length})</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.includes(type.value) ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {typeActions.map((action) => (
                <div key={action.id} className="p-3 bg-muted/30 border rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{action.name}</span>
                      {action.is_attack && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                          {calculateAttackBonus(action)} al impacto
                        </span>
                      )}
                    </div>
                    {!readOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => deleteAction(action.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {action.is_attack && action.damage_dice && (
                    <div className="text-xs text-muted-foreground mb-1">
                      Daño: {calculateDamage(action)}
                      {action.range && ` · Alcance: ${action.range}`}
                    </div>
                  )}
                  {action.description && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{action.description}</p>
                  )}
                </div>
              ))}
              {typeActions.length === 0 && !readOnly && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Sin acciones de este tipo
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};
