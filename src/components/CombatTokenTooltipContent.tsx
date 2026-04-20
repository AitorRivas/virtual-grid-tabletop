import { Sword, Sparkles, Zap, ShieldCheck, Crown, Skull } from 'lucide-react';
import type { CharacterAction, Feature } from '@/types/dnd5e';
import { formatModifier } from '@/types/dnd';

export interface CombatTooltipData {
  name: string;
  subtitle?: string;
  hp?: { current: number; max: number };
  ac?: number;
  traits: Feature[];
  actions: CharacterAction[];
  bonusActions: CharacterAction[];
  reactions: CharacterAction[];
  legendary: CharacterAction[];
}

const formatActionLine = (a: CharacterAction): string => {
  const parts: string[] = [];
  if (a.is_attack) {
    const atk = a.attack_bonus !== undefined ? formatModifier(a.attack_bonus) : '';
    parts.push(`${atk ? `${atk} ataque` : 'Ataque'}`);
  }
  if (a.damage_dice) {
    const bonus = a.damage_bonus ? (a.damage_bonus >= 0 ? `+${a.damage_bonus}` : `${a.damage_bonus}`) : '';
    parts.push(`${a.damage_dice}${bonus} ${a.damage_type ?? ''} daño`.trim());
  }
  if (a.save_dc_ability) {
    const dc = a.save_dc_bonus ?? '';
    parts.push(`Salv. ${a.save_type ?? ''} CD ${dc}`.trim());
  }
  if (a.range) parts.push(`alc. ${a.range}`);
  return parts.join(' · ');
};

const Section = ({
  icon: Icon,
  title,
  items,
  colorClass,
}: {
  icon: typeof Sword;
  title: string;
  items: { name: string; line: string; description?: string }[];
  colorClass: string;
}) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>{title}</span>
      </div>
      <ul className="space-y-1 pl-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs leading-snug">
            <span className="font-semibold text-foreground">{it.name}</span>
            {it.line && <span className="text-muted-foreground">{`: ${it.line}`}</span>}
            {it.description && !it.line && (
              <span className="text-muted-foreground">{`: ${it.description.slice(0, 90)}${it.description.length > 90 ? '…' : ''}`}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const CombatTokenTooltipContent = ({ data }: { data: CombatTooltipData }) => {
  const traitItems = data.traits.map(t => ({
    name: t.name,
    line: '',
    description: t.description ?? '',
  }));
  const actionItems = data.actions.map(a => ({ name: a.name, line: formatActionLine(a), description: a.description }));
  const bonusItems = data.bonusActions.map(a => ({ name: a.name, line: formatActionLine(a), description: a.description }));
  const reactionItems = data.reactions.map(a => ({ name: a.name, line: formatActionLine(a), description: a.description }));
  const legendaryItems = data.legendary.map(a => ({ name: a.name, line: formatActionLine(a), description: a.description }));

  return (
    <div className="space-y-2 max-w-[320px]">
      <div className="border-b border-border/60 pb-1.5">
        <p className="font-bold text-sm text-foreground leading-tight">{data.name}</p>
        {data.subtitle && <p className="text-[11px] text-muted-foreground">{data.subtitle}</p>}
        <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
          {data.hp && (
            <span>
              <span className="font-semibold text-foreground">PV</span> {data.hp.current}/{data.hp.max}
            </span>
          )}
          {data.ac !== undefined && (
            <span>
              <span className="font-semibold text-foreground">CA</span> {data.ac}
            </span>
          )}
        </div>
      </div>

      <Section icon={Sword} title="Acciones" items={actionItems} colorClass="text-[hsl(var(--token-red))]" />
      <Section icon={Zap} title="Acción adicional" items={bonusItems} colorClass="text-[hsl(var(--token-yellow))]" />
      <Section icon={ShieldCheck} title="Reacciones" items={reactionItems} colorClass="text-[hsl(var(--token-cyan))]" />
      <Section icon={Crown} title="Acciones legendarias" items={legendaryItems} colorClass="text-[hsl(var(--token-purple))]" />
      <Section icon={Sparkles} title="Rasgos" items={traitItems} colorClass="text-[hsl(var(--token-green))]" />

      {actionItems.length === 0 &&
        bonusItems.length === 0 &&
        reactionItems.length === 0 &&
        legendaryItems.length === 0 &&
        traitItems.length === 0 && (
          <p className="text-xs text-muted-foreground italic flex items-center gap-1">
            <Skull className="w-3 h-3" /> Sin habilidades definidas
          </p>
        )}
    </div>
  );
};
