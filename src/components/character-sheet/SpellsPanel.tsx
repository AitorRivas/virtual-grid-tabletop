import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, Sparkles, Circle, CheckCircle2 } from 'lucide-react';
import { 
  CharacterSpells, 
  Spell, 
  SpellSlots, 
  SPELL_SCHOOLS, 
  DAMAGE_TYPES,
  SAVES,
  getSpellSaveDC,
  getSpellAttackBonus
} from '@/types/dnd5e';
import { getModifier, formatModifier } from '@/types/dnd';

interface SpellsPanelProps {
  spells: CharacterSpells;
  spellAbility: string | null;
  abilities: {
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencyBonus: number;
  onChange: (spells: CharacterSpells) => void;
  readOnly: boolean;
}

const SPELL_LEVELS = [
  { value: 0, label: 'Trucos' },
  { value: 1, label: 'Nivel 1' },
  { value: 2, label: 'Nivel 2' },
  { value: 3, label: 'Nivel 3' },
  { value: 4, label: 'Nivel 4' },
  { value: 5, label: 'Nivel 5' },
  { value: 6, label: 'Nivel 6' },
  { value: 7, label: 'Nivel 7' },
  { value: 8, label: 'Nivel 8' },
  { value: 9, label: 'Nivel 9' },
];

export const SpellsPanel = ({ 
  spells, 
  spellAbility, 
  abilities, 
  proficiencyBonus, 
  onChange, 
  readOnly 
}: SpellsPanelProps) => {
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  const spellMod = spellAbility 
    ? getModifier(abilities[spellAbility as keyof typeof abilities] || 10)
    : 0;
  const spellSaveDC = getSpellSaveDC(spellMod, proficiencyBonus);
  const spellAttack = getSpellAttackBonus(spellMod, proficiencyBonus);

  const updateSlots = (level: number, updates: Partial<{ max: number; used: number }>) => {
    const currentSlot = spells.slots[level] || { max: 0, used: 0 };
    onChange({
      ...spells,
      slots: {
        ...spells.slots,
        [level]: { ...currentSlot, ...updates }
      }
    });
  };

  const toggleSlotUsed = (level: number, index: number) => {
    const currentSlot = spells.slots[level] || { max: 0, used: 0 };
    const newUsed = index < currentSlot.used ? index : index + 1;
    updateSlots(level, { used: Math.min(newUsed, currentSlot.max) });
  };

  const addSpell = () => {
    const newSpell: Spell = {
      id: crypto.randomUUID(),
      name: 'Nuevo hechizo',
      level: 0,
      school: 'evocation',
      casting_time: '1 acción',
      range: '30 ft',
      components: 'V, S',
      duration: 'Instantáneo',
      concentration: false,
      ritual: false,
      description: '',
    };
    onChange({
      ...spells,
      known: [...spells.known, newSpell]
    });
    setExpandedSpell(newSpell.id);
  };

  const updateSpell = (id: string, updates: Partial<Spell>) => {
    onChange({
      ...spells,
      known: spells.known.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const deleteSpell = (id: string) => {
    onChange({
      ...spells,
      known: spells.known.filter(s => s.id !== id),
      prepared: spells.prepared.filter(p => p !== id)
    });
  };

  const togglePrepared = (id: string) => {
    const isPrepared = spells.prepared.includes(id);
    onChange({
      ...spells,
      prepared: isPrepared 
        ? spells.prepared.filter(p => p !== id)
        : [...spells.prepared, id]
    });
  };

  const spellsByLevel = SPELL_LEVELS.map(level => ({
    ...level,
    spells: spells.known.filter(s => s.level === level.value)
  }));

  return (
    <div className="space-y-4">
      {/* Spell Stats */}
      {spellAbility && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-card border rounded-lg text-center">
            <Label className="text-xs text-muted-foreground">CD Salvación</Label>
            <p className="text-2xl font-bold">{spellSaveDC}</p>
          </div>
          <div className="p-3 bg-card border rounded-lg text-center">
            <Label className="text-xs text-muted-foreground">Ataque mágico</Label>
            <p className="text-2xl font-bold">{formatModifier(spellAttack)}</p>
          </div>
          <div className="p-3 bg-card border rounded-lg text-center">
            <Label className="text-xs text-muted-foreground">Característica</Label>
            <p className="text-lg font-bold uppercase">
              {SAVES.find(s => s.value === spellAbility)?.abbr || spellAbility}
            </p>
          </div>
        </div>
      )}

      {/* Spell Slots */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Espacios de hechizo</Label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
            const slot = spells.slots[level] || { max: 0, used: 0 };
            if (readOnly && slot.max === 0) return null;
            
            return (
              <div key={level} className="p-2 bg-card border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Nv. {level}</span>
                  {!readOnly && (
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={slot.max}
                      onChange={(e) => updateSlots(level, { max: parseInt(e.target.value) || 0 })}
                      className="w-12 h-6 text-xs text-center"
                    />
                  )}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: slot.max }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => !readOnly && toggleSlotUsed(level, i)}
                      disabled={readOnly}
                      className="transition-colors"
                    >
                      {i < slot.used ? (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spells by Level */}
      <div className="space-y-3">
        {spellsByLevel.map(({ value: level, label, spells: levelSpells }) => {
          if (readOnly && levelSpells.length === 0) return null;
          
          return (
            <Collapsible key={level} defaultOpen={levelSpells.length > 0}>
              <CollapsibleTrigger className="w-full p-2 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted">
                <span className="font-medium text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{levelSpells.length}</Badge>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {levelSpells.map(spell => (
                  <Collapsible 
                    key={spell.id} 
                    open={expandedSpell === spell.id}
                    onOpenChange={(open) => setExpandedSpell(open ? spell.id : null)}
                  >
                    <div className="border rounded-lg bg-card/50">
                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!readOnly && level > 0) togglePrepared(spell.id);
                            }}
                            disabled={readOnly || level === 0}
                            className="flex-shrink-0"
                          >
                            {level === 0 || spells.prepared.includes(spell.id) ? (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-sm">{spell.name}</span>
                          {spell.concentration && (
                            <Badge variant="outline" className="text-xs">C</Badge>
                          )}
                          {spell.ritual && (
                            <Badge variant="outline" className="text-xs">R</Badge>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 border-t space-y-3">
                          {readOnly ? (
                            <>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <p><strong>Tiempo:</strong> {spell.casting_time}</p>
                                <p><strong>Alcance:</strong> {spell.range}</p>
                                <p><strong>Componentes:</strong> {spell.components}</p>
                                <p><strong>Duración:</strong> {spell.duration}</p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{spell.description}</p>
                              {spell.higher_levels && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>A niveles superiores:</strong> {spell.higher_levels}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Nombre</Label>
                                  <Input
                                    value={spell.name}
                                    onChange={(e) => updateSpell(spell.id, { name: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Nivel</Label>
                                  <Select 
                                    value={spell.level.toString()} 
                                    onValueChange={(v) => updateSpell(spell.id, { level: parseInt(v) })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SPELL_LEVELS.map(l => (
                                        <SelectItem key={l.value} value={l.value.toString()}>{l.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Escuela</Label>
                                  <Select 
                                    value={spell.school} 
                                    onValueChange={(v) => updateSpell(spell.id, { school: v as Spell['school'] })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SPELL_SCHOOLS.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Tiempo de lanzamiento</Label>
                                  <Input
                                    value={spell.casting_time}
                                    onChange={(e) => updateSpell(spell.id, { casting_time: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Alcance</Label>
                                  <Input
                                    value={spell.range}
                                    onChange={(e) => updateSpell(spell.id, { range: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Duración</Label>
                                  <Input
                                    value={spell.duration}
                                    onChange={(e) => updateSpell(spell.id, { duration: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Componentes</Label>
                                <Input
                                  value={spell.components}
                                  onChange={(e) => updateSpell(spell.id, { components: e.target.value })}
                                  placeholder="V, S, M (materiales)"
                                />
                              </div>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={spell.concentration}
                                    onChange={(e) => updateSpell(spell.id, { concentration: e.target.checked })}
                                  />
                                  Concentración
                                </label>
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={spell.ritual}
                                    onChange={(e) => updateSpell(spell.id, { ritual: e.target.checked })}
                                  />
                                  Ritual
                                </label>
                              </div>
                              <div>
                                <Label className="text-xs">Descripción</Label>
                                <Textarea
                                  value={spell.description}
                                  onChange={(e) => updateSpell(spell.id, { description: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">A niveles superiores</Label>
                                <Textarea
                                  value={spell.higher_levels || ''}
                                  onChange={(e) => updateSpell(spell.id, { higher_levels: e.target.value || undefined })}
                                  rows={2}
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSpell(spell.id)}
                                className="w-full"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar hechizo
                              </Button>
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
                {!readOnly && (
                  <Button variant="outline" size="sm" onClick={addSpell} className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir hechizo
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};
