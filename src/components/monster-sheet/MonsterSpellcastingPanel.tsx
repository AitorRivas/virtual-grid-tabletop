import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Sparkles, Backpack } from 'lucide-react';
import {
  MonsterSpellcasting,
  SpellcastingGroup,
  SpecialEquipmentEntry,
  SAVES,
  SaveType,
} from '@/types/dnd5e';

interface MonsterSpellcastingPanelProps {
  spellcasting: MonsterSpellcasting | null;
  specialEquipment: SpecialEquipmentEntry[];
  onChange: (updates: {
    spellcasting?: MonsterSpellcasting | null;
    special_equipment?: SpecialEquipmentEntry[];
  }) => void;
  readOnly: boolean;
}

const emptySpellcasting: MonsterSpellcasting = {
  description: '',
  ability: undefined,
  save_dc: undefined,
  attack_bonus: undefined,
  at_will: [],
  groups: [],
};

const parseList = (value: string) => value.split(',').map(s => s.trim()).filter(Boolean);

export const MonsterSpellcastingPanel = ({
  spellcasting,
  specialEquipment,
  onChange,
  readOnly,
}: MonsterSpellcastingPanelProps) => {
  const sc = spellcasting;
  const groups = sc?.groups || [];
  const atWill = sc?.at_will || [];

  const update = (patch: Partial<MonsterSpellcasting>) => {
    onChange({ spellcasting: { ...(sc || emptySpellcasting), ...patch } });
  };

  const updateGroup = (index: number, patch: Partial<SpellcastingGroup>) => {
    update({ groups: groups.map((g, i) => (i === index ? { ...g, ...patch } : g)) });
  };

  const hasSpellcasting = !!sc && (
    !!sc.description || !!sc.ability || !!sc.save_dc || atWill.length > 0 || groups.length > 0
  );

  return (
    <div className="space-y-6">
      {/* ---- Spellcasting ---- */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> Lanzamiento de conjuros
        </Label>

        {readOnly ? (
          hasSpellcasting ? (
            <div className="space-y-2 p-3 border rounded-lg bg-card/50">
              {sc?.description && <p className="text-sm whitespace-pre-wrap">{sc.description}</p>}
              <div className="flex flex-wrap gap-1">
                {sc?.ability && (
                  <Badge variant="outline">
                    Aptitud: {SAVES.find(s => s.value === sc.ability)?.label}
                  </Badge>
                )}
                {typeof sc?.save_dc === 'number' && <Badge variant="outline">CD {sc.save_dc}</Badge>}
                {typeof sc?.attack_bonus === 'number' && (
                  <Badge variant="outline">
                    Ataque {sc.attack_bonus >= 0 ? '+' : ''}{sc.attack_bonus}
                  </Badge>
                )}
              </div>
              {atWill.length > 0 && (
                <p className="text-sm"><span className="font-medium">A voluntad:</span> {atWill.join(', ')}</p>
              )}
              {groups.map((g, i) => (
                <p key={`${g.label}-${i}`} className="text-sm">
                  <span className="font-medium">{g.label}:</span> {g.spells.join(', ')}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Esta criatura no lanza conjuros.</p>
          )
        ) : (
          <div className="space-y-3">
            <Textarea
              value={sc?.description || ''}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              placeholder="Texto introductorio del rasgo de conjuros..."
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Aptitud mágica</Label>
                <Select
                  value={sc?.ability || 'none'}
                  onValueChange={(v) => update({ ability: v === 'none' ? undefined : (v as SaveType) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {SAVES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">CD de salvación</Label>
                <Input
                  type="number"
                  value={sc?.save_dc ?? ''}
                  onChange={(e) => update({ save_dc: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label className="text-xs">Bono de ataque</Label>
                <Input
                  type="number"
                  value={sc?.attack_bonus ?? ''}
                  onChange={(e) => update({ attack_bonus: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">A voluntad (separados por comas)</Label>
              <Input
                value={atWill.join(', ')}
                onChange={(e) => update({ at_will: parseList(e.target.value) })}
                placeholder="luz, prestidigitación"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Grupos de conjuros</Label>
              {groups.map((g, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    value={g.label}
                    onChange={(e) => updateGroup(i, { label: e.target.value })}
                    placeholder="Nivel 1 (4 espacios)"
                    className="w-48"
                  />
                  <Input
                    value={g.spells.join(', ')}
                    onChange={(e) => updateGroup(i, { spells: parseList(e.target.value) })}
                    placeholder="proyectil mágico, escudo"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => update({ groups: groups.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => update({ groups: [...groups, { label: '', spells: [] }] })}
              >
                <Plus className="w-3 h-3 mr-1" /> Añadir grupo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ---- Special equipment ---- */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-1">
          <Backpack className="w-4 h-4" /> Equipo especial
        </Label>

        {specialEquipment.length === 0 && readOnly && (
          <p className="text-sm text-muted-foreground italic">Sin equipo especial.</p>
        )}

        <div className="space-y-2">
          {specialEquipment.map((item, i) => (
            readOnly ? (
              <div key={item.id} className="p-2 border rounded-lg">
                <p className="text-sm font-medium">
                  {item.name}{item.quantity && item.quantity > 1 ? ` (x${item.quantity})` : ''}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                )}
              </div>
            ) : (
              <div key={item.id} className="p-2 border rounded-lg space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => onChange({
                      special_equipment: specialEquipment.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it)
                    })}
                    placeholder="Nombre"
                  />
                  <Input
                    type="number"
                    className="w-20"
                    value={item.quantity ?? 1}
                    onChange={(e) => onChange({
                      special_equipment: specialEquipment.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it)
                    })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onChange({ special_equipment: specialEquipment.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => onChange({
                    special_equipment: specialEquipment.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it)
                  })}
                  rows={2}
                  placeholder="Descripción"
                />
              </div>
            )
          ))}
        </div>

        {!readOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({
              special_equipment: [
                ...specialEquipment,
                { id: crypto.randomUUID(), name: '', description: '', quantity: 1 },
              ],
            })}
          >
            <Plus className="w-3 h-3 mr-1" /> Añadir equipo
          </Button>
        )}
      </div>
    </div>
  );
};
