import { Sword, Sparkles, Zap, ShieldCheck, Crown, Skull, ShieldAlert, ShieldOff, Crosshair } from 'lucide-react';
import type { CharacterAction, Feature, DamageType, SaveType } from '@/types/dnd5e';
import { getDamageTypeLabel, getSaveLabel } from '@/types/dnd5e';
import { getModifier, formatModifier } from '@/types/dnd';

export interface CombatTooltipSource {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  proficiency_bonus?: number | null;
}

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
  source?: CombatTooltipSource;
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
}

const SIZE_LABEL: Record<string, string> = {
  tiny: 'Diminuto',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
  huge: 'Enorme',
  gargantuan: 'Gargantuesco',
};

const TYPE_LABEL: Record<string, string> = {
  aberration: 'Aberración',
  beast: 'Bestia',
  celestial: 'Celestial',
  construct: 'Constructo',
  dragon: 'Dragón',
  elemental: 'Elemental',
  fey: 'Feérico',
  fiend: 'Demonio',
  giant: 'Gigante',
  humanoid: 'Humanoide',
  monstrosity: 'Monstruosidad',
  ooze: 'Cieno',
  plant: 'Planta',
  undead: 'No-Muerto',
};

export const localizeSize = (s?: string) => (s ? SIZE_LABEL[s.toLowerCase()] ?? s : '');
export const localizeType = (t?: string) => (t ? TYPE_LABEL[t.toLowerCase()] ?? t : '');

const abilityScore = (src: CombatTooltipSource | undefined, ability?: string): number | undefined => {
  if (!src || !ability) return undefined;
  return (src as any)[ability];
};

const formatActionLine = (a: CharacterAction, source?: CombatTooltipSource): string => {
  const parts: string[] = [];
  const prof = source?.proficiency_bonus ?? 0;

  if (a.is_attack) {
    // attack_bonus is a stored extra; total = ability mod + prof + extra
    const score = abilityScore(source, a.attack_ability);
    const abilMod = score !== undefined ? getModifier(score) : 0;
    const extra = a.attack_bonus ?? 0;
    const total = abilMod + (source ? prof : 0) + extra;
    parts.push(`${formatModifier(total)} al ataque`);
  }

  if (a.damage_dice) {
    const dmgScore = a.damage_ability && a.damage_ability !== 'none' ? abilityScore(source, a.damage_ability) : undefined;
    const abilMod = dmgScore !== undefined ? getModifier(dmgScore) : 0;
    const extra = a.damage_bonus ?? 0;
    const total = abilMod + extra;
    const bonusStr = total === 0 ? '' : total > 0 ? `+${total}` : `${total}`;
    const dmgLabel = a.damage_type ? getDamageTypeLabel(a.damage_type as DamageType) : '';
    parts.push(`${a.damage_dice}${bonusStr}${dmgLabel ? ` ${dmgLabel.toLowerCase()}` : ''}`);
  }

  if (a.save_dc_ability) {
    const saveScore = abilityScore(source, a.save_dc_ability);
    const abilMod = saveScore !== undefined ? getModifier(saveScore) : 0;
    const dc = 8 + (source ? prof : 0) + abilMod + (a.save_dc_bonus ?? 0);
    const saveLbl = a.save_type ? getSaveLabel(a.save_type as SaveType) : '';
    parts.push(`Salv. ${saveLbl} CD ${dc}`.trim());
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
  const src = data.source;
  const traitItems = data.traits.map(t => ({
    name: t.name,
    line: '',
    description: t.description ?? '',
  }));
  const actionItems = data.actions.map(a => ({ name: a.name, line: formatActionLine(a, src), description: a.description }));
  const bonusItems = data.bonusActions.map(a => ({ name: a.name, line: formatActionLine(a, src), description: a.description }));
  const reactionItems = data.reactions.map(a => ({ name: a.name, line: formatActionLine(a, src), description: a.description }));
  const legendaryItems = data.legendary.map(a => ({ name: a.name, line: formatActionLine(a, src), description: a.description }));

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

      {(data.resistances?.length || data.immunities?.length || data.vulnerabilities?.length) ? (
        <div className="border-t border-border/40 pt-1.5 space-y-0.5">
          {data.resistances && data.resistances.length > 0 && (
            <p className="text-[10px] text-muted-foreground leading-snug flex items-start gap-1">
              <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(var(--token-blue))]" />
              <span><span className="font-semibold">Resistencias:</span> {data.resistances.join(', ')}</span>
            </p>
          )}
          {data.immunities && data.immunities.length > 0 && (
            <p className="text-[10px] text-muted-foreground leading-snug flex items-start gap-1">
              <ShieldOff className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(var(--token-yellow))]" />
              <span><span className="font-semibold">Inmunidades:</span> {data.immunities.join(', ')}</span>
            </p>
          )}
          {data.vulnerabilities && data.vulnerabilities.length > 0 && (
            <p className="text-[10px] text-muted-foreground leading-snug flex items-start gap-1">
              <Crosshair className="w-3 h-3 mt-0.5 shrink-0 text-[hsl(var(--token-red))]" />
              <span><span className="font-semibold">Vulnerabilidades:</span> {data.vulnerabilities.join(', ')}</span>
            </p>
          )}
        </div>
      ) : null}

      {actionItems.length === 0 &&
        bonusItems.length === 0 &&
        reactionItems.length === 0 &&
        legendaryItems.length === 0 &&
        traitItems.length === 0 &&
        !data.resistances?.length &&
        !data.immunities?.length &&
        !data.vulnerabilities?.length && (
          <p className="text-xs text-muted-foreground italic flex items-center gap-1">
            <Skull className="w-3 h-3" /> Sin habilidades definidas
          </p>
        )}
    </div>
  );
};
