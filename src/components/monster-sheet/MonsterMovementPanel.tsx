import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Footprints, Eye, Languages as LanguagesIcon, Plus, X } from 'lucide-react';
import { Speeds, Senses, SpeedKind } from '@/types/dnd5e';

interface MonsterMovementPanelProps {
  speeds: Speeds;
  senses: Senses;
  languages: string[];
  onChange: (updates: { speeds?: Speeds; senses?: Senses; languages?: string[] }) => void;
  readOnly: boolean;
}

const SPEED_FIELDS: { key: SpeedKind; label: string }[] = [
  { key: 'walk', label: 'Caminar' },
  { key: 'climb', label: 'Trepar' },
  { key: 'swim', label: 'Nadar' },
  { key: 'fly', label: 'Volar' },
  { key: 'burrow', label: 'Excavar' },
];

const SENSE_FIELDS: { key: 'darkvision' | 'blindsight' | 'tremorsense' | 'truesight'; label: string }[] = [
  { key: 'darkvision', label: 'Visión en la oscuridad' },
  { key: 'blindsight', label: 'Visión ciega' },
  { key: 'tremorsense', label: 'Percepción sísmica' },
  { key: 'truesight', label: 'Visión verdadera' },
];

export const MonsterMovementPanel = ({
  speeds,
  senses,
  languages,
  onChange,
  readOnly,
}: MonsterMovementPanelProps) => {
  const speedNotes = speeds.notes || {};
  const senseNotes = senses.notes || {};

  const setSpeed = (key: SpeedKind, value: string) => {
    const num = value === '' ? undefined : parseInt(value) || 0;
    onChange({ speeds: { ...speeds, [key]: key === 'walk' ? (num ?? 0) : num } as Speeds });
  };

  const setSpeedNote = (key: SpeedKind, note: string) => {
    onChange({ speeds: { ...speeds, notes: { ...speedNotes, [key]: note || undefined } } });
  };

  const setSense = (key: typeof SENSE_FIELDS[number]['key'], value: string) => {
    const num = value === '' ? undefined : parseInt(value) || 0;
    onChange({ senses: { ...senses, [key]: num } });
  };

  const setSenseNote = (key: typeof SENSE_FIELDS[number]['key'], note: string) => {
    onChange({ senses: { ...senses, notes: { ...senseNotes, [key]: note || undefined } } });
  };

  const activeSpeeds = SPEED_FIELDS.filter(f => {
    const v = speeds[f.key];
    return typeof v === 'number' && v > 0;
  });
  const activeSenses = SENSE_FIELDS.filter(f => typeof senses[f.key] === 'number' && (senses[f.key] as number) > 0);

  if (readOnly) {
    return (
      <div className="space-y-4">
        {(activeSpeeds.length > 0 || (speeds.other?.length ?? 0) > 0) && (
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Footprints className="w-3 h-3" /> Movimiento</Label>
            <div className="flex flex-wrap gap-1">
              {activeSpeeds.map(f => (
                <Badge key={f.key} variant="secondary">
                  {f.label} {speeds[f.key]} pies{speedNotes[f.key] ? ` ${speedNotes[f.key]}` : ''}
                </Badge>
              ))}
              {(speeds.other || []).map((o, i) => (
                <Badge key={`${o.name}-${i}`} variant="secondary">
                  {o.name}{o.value ? ` ${o.value} pies` : ''}{o.note ? ` ${o.note}` : ''}
                </Badge>
              ))}
              {speeds.hover && <Badge variant="outline">Flota</Badge>}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Sentidos</Label>
          <div className="flex flex-wrap gap-1">
            {activeSenses.map(f => (
              <Badge key={f.key} variant="secondary">
                {f.label} {senses[f.key]} pies{senseNotes[f.key] ? ` ${senseNotes[f.key]}` : ''}
              </Badge>
            ))}
            {(senses.other || []).map((o, i) => (
              <Badge key={`${o.name}-${i}`} variant="secondary">
                {o.name}{o.range ? ` ${o.range} pies` : ''}{o.note ? ` ${o.note}` : ''}
              </Badge>
            ))}
            <Badge variant="outline">Percepción pasiva {senses.passive_perception}</Badge>
          </div>
        </div>

        {languages.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><LanguagesIcon className="w-3 h-3" /> Idiomas</Label>
            <div className="flex flex-wrap gap-1">
              {languages.map(l => <Badge key={l} variant="outline">{l}</Badge>)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1"><Footprints className="w-3 h-3" /> Velocidades (pies)</Label>
        {SPEED_FIELDS.map(f => (
          <div key={f.key} className="grid grid-cols-[110px_80px_1fr] gap-2 items-center">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <Input
              type="number"
              value={typeof speeds[f.key] === 'number' ? (speeds[f.key] as number) : ''}
              onChange={(e) => setSpeed(f.key, e.target.value)}
              className="h-8"
            />
            <Input
              value={speedNotes[f.key] || ''}
              onChange={(e) => setSpeedNote(f.key, e.target.value)}
              placeholder="Texto adicional (ej: flotar)"
              className="h-8 text-xs"
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!speeds.hover}
            onChange={(e) => onChange({ speeds: { ...speeds, hover: e.target.checked } })}
          />
          Puede flotar
        </label>
      </div>

      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Sentidos (pies)</Label>
        <div className="grid grid-cols-[110px_80px_1fr] gap-2 items-center">
          <span className="text-xs text-muted-foreground">Perc. pasiva</span>
          <Input
            type="number"
            value={senses.passive_perception}
            onChange={(e) => onChange({ senses: { ...senses, passive_perception: parseInt(e.target.value) || 10 } })}
            className="h-8"
          />
          <span />
        </div>
        {SENSE_FIELDS.map(f => (
          <div key={f.key} className="grid grid-cols-[110px_80px_1fr] gap-2 items-center">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <Input
              type="number"
              value={typeof senses[f.key] === 'number' ? (senses[f.key] as number) : ''}
              onChange={(e) => setSense(f.key, e.target.value)}
              className="h-8"
            />
            <Input
              value={senseNotes[f.key] || ''}
              onChange={(e) => setSenseNote(f.key, e.target.value)}
              placeholder="Texto adicional"
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1"><LanguagesIcon className="w-3 h-3" /> Idiomas</Label>
        <div className="flex flex-wrap gap-1">
          {languages.map((l, i) => (
            <Badge key={`${l}-${i}`} variant="outline" className="gap-1">
              {l}
              <button onClick={() => onChange({ languages: languages.filter((_, idx) => idx !== i) })}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {languages.length === 0 && <span className="text-xs text-muted-foreground italic">Ninguno</span>}
        </div>
        <div className="flex gap-2">
          <Input
            id="new-language"
            placeholder="Añadir idioma..."
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) {
                  onChange({ languages: [...languages, v] });
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.getElementById('new-language') as HTMLInputElement | null;
              const v = input?.value.trim();
              if (v) {
                onChange({ languages: [...languages, v] });
                input!.value = '';
              }
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
