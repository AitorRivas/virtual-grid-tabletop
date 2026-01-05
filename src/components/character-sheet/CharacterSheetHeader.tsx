import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DND_RACES, DND_CLASSES, ALIGNMENTS, getRaceLabel, getClassLabel } from '@/types/dnd';
import { getProficiencyBonus } from '@/types/dnd5e';

interface CharacterSheetHeaderProps {
  character: {
    name: string;
    race: string;
    class: string;
    subclass: string | null;
    level: number;
    background: string | null;
    alignment: string | null;
    proficiency_bonus: number;
  };
  onChange: (updates: Partial<CharacterSheetHeaderProps['character']>) => void;
  readOnly?: boolean;
}

export const CharacterSheetHeader = ({ character, onChange, readOnly = false }: CharacterSheetHeaderProps) => {
  const profBonus = getProficiencyBonus(character.level);
  
  return (
    <div className="space-y-4">
      {/* Name and Level */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input
            value={character.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="text-xl font-bold h-10"
            disabled={readOnly}
            placeholder="Nombre del personaje"
          />
        </div>
        <div className="w-20">
          <Label className="text-xs text-muted-foreground">Nivel</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={character.level}
            onChange={(e) => {
              const level = parseInt(e.target.value) || 1;
              onChange({ 
                level, 
                proficiency_bonus: getProficiencyBonus(level) 
              });
            }}
            className="text-center font-bold"
            disabled={readOnly}
          />
        </div>
        <div className="w-20">
          <Label className="text-xs text-muted-foreground">Competencia</Label>
          <div className="h-9 flex items-center justify-center bg-primary/20 rounded-md border border-primary/30 font-bold text-primary">
            +{profBonus}
          </div>
        </div>
      </div>

      {/* Class and Race */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Raza</Label>
          {readOnly ? (
            <div className="h-9 flex items-center px-3 bg-muted/50 rounded-md border text-sm">
              {getRaceLabel(character.race)}
            </div>
          ) : (
            <Select value={character.race} onValueChange={(v) => onChange({ race: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DND_RACES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Clase</Label>
          {readOnly ? (
            <div className="h-9 flex items-center px-3 bg-muted/50 rounded-md border text-sm">
              {getClassLabel(character.class)}
            </div>
          ) : (
            <Select value={character.class} onValueChange={(v) => onChange({ class: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DND_CLASSES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Subclase</Label>
          <Input
            value={character.subclass || ''}
            onChange={(e) => onChange({ subclass: e.target.value || null })}
            placeholder="Subclase"
            disabled={readOnly}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Trasfondo</Label>
          <Input
            value={character.background || ''}
            onChange={(e) => onChange({ background: e.target.value || null })}
            placeholder="Trasfondo"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Alignment */}
      <div className="w-48">
        <Label className="text-xs text-muted-foreground">Alineamiento</Label>
        {readOnly ? (
          <div className="h-9 flex items-center px-3 bg-muted/50 rounded-md border text-sm">
            {ALIGNMENTS.find(a => a.value === character.alignment)?.label || character.alignment || 'Sin definir'}
          </div>
        ) : (
          <Select value={character.alignment || ''} onValueChange={(v) => onChange({ alignment: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {ALIGNMENTS.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
