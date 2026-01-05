import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Heart, Footprints, Swords, Eye, Minus, Plus } from 'lucide-react';
import { getModifier, formatModifier } from '@/types/dnd';
import { 
  getProficiencyBonus, 
  getInitiativeBonus, 
  getPassivePerception,
  getSpellSaveDC,
  getSpellAttackBonus,
  Speeds,
  Senses,
  CharacterProficiencies 
} from '@/types/dnd5e';

interface CombatPanelProps {
  combat: {
    armor_class: number;
    hit_points_max: number;
    hit_points_current: number | null;
    speed: number;
    initiative_bonus: number;
  };
  speeds: Speeds;
  senses: Senses;
  abilities: {
    dexterity: number;
    wisdom: number;
    intelligence: number;
    charisma: number;
  };
  proficiencies: CharacterProficiencies;
  proficiencyBonus: number;
  spellAbility: string | null;
  onChange: (updates: Partial<CombatPanelProps['combat']>) => void;
  onSpeedsChange: (speeds: Speeds) => void;
  readOnly?: boolean;
}

export const CombatPanel = ({
  combat,
  speeds,
  senses,
  abilities,
  proficiencies,
  proficiencyBonus,
  spellAbility,
  onChange,
  onSpeedsChange,
  readOnly = false
}: CombatPanelProps) => {
  const initiative = getInitiativeBonus(getModifier(abilities.dexterity), combat.initiative_bonus);
  const passivePerception = getPassivePerception(
    abilities.wisdom,
    proficiencyBonus,
    proficiencies.skills.includes('perception'),
    proficiencies.expertise.includes('perception')
  );

  // Spell DC and Attack calculations
  const spellAbilityMod = spellAbility ? getModifier(abilities[spellAbility as keyof typeof abilities] || 10) : 0;
  const spellSaveDC = spellAbility ? getSpellSaveDC(spellAbilityMod, proficiencyBonus) : null;
  const spellAttack = spellAbility ? getSpellAttackBonus(spellAbilityMod, proficiencyBonus) : null;

  const currentHP = combat.hit_points_current ?? combat.hit_points_max;
  const hpPercentage = (currentHP / combat.hit_points_max) * 100;
  
  const adjustHP = (delta: number) => {
    const newHP = Math.max(0, Math.min(combat.hit_points_max, currentHP + delta));
    onChange({ hit_points_current: newHP });
  };

  return (
    <div className="space-y-4">
      {/* Main Combat Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Armor Class */}
        <div className="flex flex-col items-center p-3 bg-card border rounded-lg">
          <Shield className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">CA</span>
          {readOnly ? (
            <span className="text-2xl font-bold">{combat.armor_class}</span>
          ) : (
            <Input
              type="number"
              value={combat.armor_class}
              onChange={(e) => onChange({ armor_class: parseInt(e.target.value) || 10 })}
              className="w-16 h-8 text-center text-xl font-bold"
            />
          )}
        </div>

        {/* Initiative */}
        <div className="flex flex-col items-center p-3 bg-card border rounded-lg">
          <Swords className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">Iniciativa</span>
          <span className="text-2xl font-bold text-primary">{formatModifier(initiative)}</span>
          {!readOnly && (
            <Input
              type="number"
              value={combat.initiative_bonus}
              onChange={(e) => onChange({ initiative_bonus: parseInt(e.target.value) || 0 })}
              className="w-12 h-6 text-center text-xs mt-1"
              placeholder="Bonus"
            />
          )}
        </div>

        {/* Speed */}
        <div className="flex flex-col items-center p-3 bg-card border rounded-lg">
          <Footprints className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">Velocidad</span>
          {readOnly ? (
            <span className="text-2xl font-bold">{speeds.walk}</span>
          ) : (
            <Input
              type="number"
              value={speeds.walk}
              onChange={(e) => onSpeedsChange({ ...speeds, walk: parseInt(e.target.value) || 30 })}
              className="w-16 h-8 text-center text-xl font-bold"
            />
          )}
          <span className="text-[10px] text-muted-foreground">pies</span>
        </div>
      </div>

      {/* Hit Points */}
      <div className="p-3 bg-card border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">Puntos de Golpe</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Máximo: {combat.hit_points_max}
          </div>
        </div>

        {/* HP Bar */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className={`absolute inset-y-0 left-0 transition-all duration-300 ${
              hpPercentage > 50 ? 'bg-green-500' : 
              hpPercentage > 25 ? 'bg-yellow-500' : 'bg-destructive'
            }`}
            style={{ width: `${hpPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-bold text-foreground">
            {currentHP} / {combat.hit_points_max}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center justify-center gap-2">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => adjustHP(-1)}>
              <Minus className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => adjustHP(-5)}>
              -5
            </Button>
            <Input
              type="number"
              value={currentHP}
              onChange={(e) => onChange({ hit_points_current: parseInt(e.target.value) || 0 })}
              className="w-16 h-7 text-center"
            />
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => adjustHP(5)}>
              +5
            </Button>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => adjustHP(1)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}

        {!readOnly && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">PG Máximos</Label>
              <Input
                type="number"
                value={combat.hit_points_max}
                onChange={(e) => onChange({ hit_points_max: parseInt(e.target.value) || 1 })}
                className="h-7"
              />
            </div>
          </div>
        )}
      </div>

      {/* Passive Scores & Spellcasting */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">Pasivas</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Percepción</span>
              <span className="font-bold">{passivePerception}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Investigación</span>
              <span className="font-bold">{senses.passive_investigation || 10 + getModifier(abilities.intelligence)}</span>
            </div>
          </div>
        </div>

        {spellAbility && (
          <div className="p-3 bg-card border rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Hechizos</span>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>CD Salvación</span>
                <span className="font-bold">{spellSaveDC}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ataque</span>
                <span className="font-bold">{formatModifier(spellAttack || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Speeds */}
      {!readOnly && (
        <div className="p-3 bg-card border rounded-lg">
          <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Otras velocidades</span>
          <div className="grid grid-cols-4 gap-2">
            {(['fly', 'swim', 'climb', 'burrow'] as const).map((type) => (
              <div key={type}>
                <Label className="text-[10px] capitalize">{
                  type === 'fly' ? 'Volar' : 
                  type === 'swim' ? 'Nadar' : 
                  type === 'climb' ? 'Trepar' : 'Excavar'
                }</Label>
                <Input
                  type="number"
                  value={speeds[type] || ''}
                  onChange={(e) => onSpeedsChange({ 
                    ...speeds, 
                    [type]: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="h-7 text-xs"
                  placeholder="-"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
