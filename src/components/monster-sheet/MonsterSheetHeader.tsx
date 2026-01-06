import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CREATURE_SIZES, MONSTER_TYPES, CHALLENGE_RATINGS, ALIGNMENTS } from '@/types/dnd';

type AlignmentOption = { value: string; label: string };

interface MonsterHeaderData {
  name: string;
  type: string;
  size: string;
  alignment: string | null;
  challenge_rating: string;
  proficiency_bonus: number;
  hit_dice: string | null;
}

interface MonsterSheetHeaderProps {
  monster: MonsterHeaderData;
  onChange: (updates: Partial<MonsterHeaderData>) => void;
  readOnly: boolean;
}

export const MonsterSheetHeader = ({ monster, onChange, readOnly }: MonsterSheetHeaderProps) => {
  if (readOnly) {
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="capitalize text-xs text-muted-foreground">
            {CREATURE_SIZES.find(s => s.value === monster.size)?.label || monster.size} {MONSTER_TYPES.find(t => t.value === monster.type)?.label || monster.type}
          </span>
          {monster.alignment && (
            <span className="text-xs text-muted-foreground">· {monster.alignment}</span>
          )}
        </div>
        <div className="flex gap-4 text-sm">
          <span><strong>CR</strong> {monster.challenge_rating}</span>
          <span><strong>Competencia</strong> +{monster.proficiency_bonus}</span>
          {monster.hit_dice && <span><strong>Dados de golpe</strong> {monster.hit_dice}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nombre</Label>
          <Input
            value={monster.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Nombre del monstruo"
          />
        </div>
        <div>
          <Label className="text-xs">CR</Label>
          <Select value={monster.challenge_rating} onValueChange={(v) => onChange({ challenge_rating: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHALLENGE_RATINGS.map(cr => (
                <SelectItem key={cr} value={cr}>{cr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={monster.type} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONSTER_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tamaño</Label>
          <Select value={monster.size} onValueChange={(v) => onChange({ size: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREATURE_SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Alineamiento</Label>
          <Select value={monster.alignment || ''} onValueChange={(v) => onChange({ alignment: v || null })}>
            <SelectTrigger>
              <SelectValue placeholder="Sin alineamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin alineamiento</SelectItem>
              {(ALIGNMENTS as AlignmentOption[]).map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Bonificador de competencia</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={monster.proficiency_bonus}
            onChange={(e) => onChange({ proficiency_bonus: parseInt(e.target.value) || 2 })}
          />
        </div>
        <div>
          <Label className="text-xs">Dados de golpe</Label>
          <Input
            value={monster.hit_dice || ''}
            onChange={(e) => onChange({ hit_dice: e.target.value || null })}
            placeholder="ej: 12d10+36"
          />
        </div>
      </div>
    </div>
  );
};
