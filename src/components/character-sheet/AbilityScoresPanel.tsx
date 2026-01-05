import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getModifier, formatModifier } from '@/types/dnd';
import { SAVES, SKILLS, getSkillModifier, getSaveModifier, SaveType, Skill, CharacterProficiencies } from '@/types/dnd5e';

interface AbilityScoresPanelProps {
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencies: CharacterProficiencies;
  proficiencyBonus: number;
  onChange: (updates: Partial<AbilityScoresPanelProps['abilities']>) => void;
  onProficienciesChange: (updates: CharacterProficiencies) => void;
  readOnly?: boolean;
}

const ABILITY_LABELS = {
  strength: { full: 'Fuerza', abbr: 'FUE' },
  dexterity: { full: 'Destreza', abbr: 'DES' },
  constitution: { full: 'Constitución', abbr: 'CON' },
  intelligence: { full: 'Inteligencia', abbr: 'INT' },
  wisdom: { full: 'Sabiduría', abbr: 'SAB' },
  charisma: { full: 'Carisma', abbr: 'CAR' },
} as const;

type AbilityKey = keyof typeof ABILITY_LABELS;

export const AbilityScoresPanel = ({ 
  abilities, 
  proficiencies, 
  proficiencyBonus, 
  onChange, 
  onProficienciesChange,
  readOnly = false 
}: AbilityScoresPanelProps) => {
  const toggleSaveProficiency = (save: SaveType) => {
    const newSaves = proficiencies.saves.includes(save)
      ? proficiencies.saves.filter(s => s !== save)
      : [...proficiencies.saves, save];
    onProficienciesChange({ ...proficiencies, saves: newSaves });
  };

  const toggleSkillProficiency = (skill: Skill) => {
    if (proficiencies.expertise.includes(skill)) {
      // Remove from expertise
      onProficienciesChange({
        ...proficiencies,
        expertise: proficiencies.expertise.filter(s => s !== skill)
      });
    } else if (proficiencies.skills.includes(skill)) {
      // Upgrade to expertise
      onProficienciesChange({
        ...proficiencies,
        expertise: [...proficiencies.expertise, skill]
      });
    } else {
      // Add proficiency
      onProficienciesChange({
        ...proficiencies,
        skills: [...proficiencies.skills, skill]
      });
    }
  };

  const removeSkillProficiency = (skill: Skill) => {
    onProficienciesChange({
      ...proficiencies,
      skills: proficiencies.skills.filter(s => s !== skill),
      expertise: proficiencies.expertise.filter(s => s !== skill)
    });
  };

  return (
    <div className="space-y-4">
      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-2">
        {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => {
          const score = abilities[ability];
          const mod = getModifier(score);
          const label = ABILITY_LABELS[ability];
          
          return (
            <div key={ability} className="flex flex-col items-center p-2 bg-card border rounded-lg">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {label.abbr}
              </span>
              <div className="text-lg font-bold text-primary">{formatModifier(mod)}</div>
              {readOnly ? (
                <div className="text-sm text-muted-foreground">{score}</div>
              ) : (
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) => onChange({ [ability]: parseInt(e.target.value) || 10 })}
                  className="w-12 h-7 text-center text-xs p-0"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Saving Throws */}
      <div className="p-3 bg-card border rounded-lg">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Tiradas de Salvación
        </h4>
        <div className="grid grid-cols-2 gap-1">
          {SAVES.map((save) => {
            const isProficient = proficiencies.saves.includes(save.value);
            const abilityScore = abilities[save.value as AbilityKey];
            const mod = getSaveModifier(abilityScore, proficiencyBonus, isProficient);
            
            return (
              <div key={save.value} className="flex items-center gap-2 text-sm py-0.5">
                <Checkbox
                  checked={isProficient}
                  onCheckedChange={() => !readOnly && toggleSaveProficiency(save.value)}
                  disabled={readOnly}
                  className="h-3.5 w-3.5"
                />
                <span className={`w-8 font-mono ${isProficient ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {formatModifier(mod)}
                </span>
                <span className="text-xs">{save.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="p-3 bg-card border rounded-lg">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Habilidades
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
          {SKILLS.map((skill) => {
            const isProficient = proficiencies.skills.includes(skill.value);
            const hasExpertise = proficiencies.expertise.includes(skill.value);
            const abilityScore = abilities[skill.ability as AbilityKey];
            const mod = getSkillModifier(abilityScore, proficiencyBonus, isProficient, hasExpertise);
            
            return (
              <div 
                key={skill.value} 
                className="flex items-center gap-2 text-sm py-0.5 cursor-pointer hover:bg-muted/50 rounded px-1"
                onClick={() => !readOnly && toggleSkillProficiency(skill.value)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!readOnly) removeSkillProficiency(skill.value);
                }}
              >
                <div className="flex items-center gap-0.5">
                  <div className={`w-2 h-2 rounded-full border ${isProficient || hasExpertise ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                  <div className={`w-2 h-2 rounded-full border ${hasExpertise ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                </div>
                <span className={`w-8 font-mono text-xs ${isProficient || hasExpertise ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {formatModifier(mod)}
                </span>
                <span className="text-xs truncate">{skill.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  ({ABILITY_LABELS[skill.ability as AbilityKey].abbr})
                </span>
              </div>
            );
          })}
        </div>
        {!readOnly && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Click: añadir/pericia · Click derecho: quitar
          </p>
        )}
      </div>
    </div>
  );
};
