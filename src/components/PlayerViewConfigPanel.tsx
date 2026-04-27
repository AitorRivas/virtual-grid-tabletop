import { ZoomIn, MousePointerClick, Settings2, Heart, Skull, Hourglass } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import type { PlayerViewConfig } from '@/hooks/useGameState';

interface PlayerViewConfigPanelProps {
  config: PlayerViewConfig;
  onChange: (updates: Partial<PlayerViewConfig>) => void;
}

const ITEMS: { key: keyof PlayerViewConfig; label: string; description: string; icon: typeof ZoomIn }[] = [
  {
    key: 'syncZoom',
    label: 'Sincronizar zoom',
    description: 'Misma escala de zoom en ambas vistas',
    icon: ZoomIn,
  },
  {
    key: 'syncSelection',
    label: 'Centrar en token seleccionado',
    description: 'Al seleccionar un token, la vista de jugadores lo enfoca',
    icon: MousePointerClick,
  },
  {
    key: 'showEnemyHpBars',
    label: 'Mostrar vida de enemigos y NPCs',
    description: 'Si está desactivado, los jugadores solo ven la barra de vida de los aliados (PJ)',
    icon: Heart,
  },
  {
    key: 'hideUndeadHpBars',
    label: 'Ocultar vida de no-muertos',
    description: 'Oculta la barra de vida de criaturas de tipo no-muerto, aunque el resto de enemigos sí se muestren',
    icon: Skull,
  },
  {
    key: 'showTimer',
    label: 'Mostrar temporizador',
    description: 'Muestra el temporizador global también en la Vista de Jugadores',
    icon: Hourglass,
  },
];

export const PlayerViewConfigPanel = ({ config, onChange }: PlayerViewConfigPanelProps) => {
  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 relative"
          title="Sincronización con la Vista de Jugadores"
        >
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          {activeCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-72 p-3">
        <div className="space-y-1 mb-3">
          <h3 className="text-sm font-semibold">Sincronización con jugadores</h3>
          <p className="text-xs text-muted-foreground">
            Controla qué se replica en la Vista de Jugadores en tiempo real.
          </p>
        </div>
        <div className="space-y-3">
          {ITEMS.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <Label htmlFor={`pvc-${key}`} className="text-xs font-medium cursor-pointer">
                  {label}
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
              </div>
              <Switch
                id={`pvc-${key}`}
                checked={config[key]}
                onCheckedChange={(checked) => onChange({ [key]: checked } as Partial<PlayerViewConfig>)}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
