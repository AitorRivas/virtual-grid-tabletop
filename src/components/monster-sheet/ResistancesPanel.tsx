import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Shield, Flame, Skull } from 'lucide-react';
import { Resistances, DamageType, DAMAGE_TYPES, CONDITIONS } from '@/types/dnd5e';

interface ResistancesPanelProps {
  resistances: Resistances;
  immunities: Resistances;
  vulnerabilities: DamageType[];
  onChange: (updates: {
    resistances?: Resistances;
    immunities?: Resistances;
    vulnerabilities?: DamageType[];
  }) => void;
  readOnly: boolean;
}

const DamageTypeSelector = ({ 
  label, 
  icon: Icon,
  values, 
  onChange, 
  readOnly,
  variant = 'default'
}: {
  label: string;
  icon: React.ElementType;
  values: DamageType[];
  onChange: (values: DamageType[]) => void;
  readOnly: boolean;
  variant?: 'default' | 'destructive' | 'secondary';
}) => {
  const addType = (type: DamageType) => {
    if (!values.includes(type)) {
      onChange([...values, type]);
    }
  };

  const removeType = (type: DamageType) => {
    onChange(values.filter(v => v !== type));
  };

  const availableTypes = DAMAGE_TYPES.filter(d => !values.includes(d.value));

  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Label>
      <div className="flex flex-wrap gap-1">
        {values.map(type => (
          <Badge key={type} variant={variant} className="gap-1">
            {DAMAGE_TYPES.find(d => d.value === type)?.label || type}
            {!readOnly && (
              <button onClick={() => removeType(type)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Ninguno</span>
        )}
      </div>
      {!readOnly && availableTypes.length > 0 && (
        <Select onValueChange={(v) => addType(v as DamageType)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Añadir tipo de daño..." />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

const ConditionSelector = ({ 
  label, 
  values, 
  onChange, 
  readOnly 
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  readOnly: boolean;
}) => {
  const addCondition = (condition: string) => {
    if (!values.includes(condition)) {
      onChange([...values, condition]);
    }
  };

  const removeCondition = (condition: string) => {
    onChange(values.filter(v => v !== condition));
  };

  const availableConditions = CONDITIONS.filter(c => !values.includes(c));

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {values.map(condition => (
          <Badge key={condition} variant="outline" className="gap-1">
            {condition}
            {!readOnly && (
              <button onClick={() => removeCondition(condition)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Ninguna</span>
        )}
      </div>
      {!readOnly && availableConditions.length > 0 && (
        <Select onValueChange={addCondition}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Añadir condición..." />
          </SelectTrigger>
          <SelectContent>
            {availableConditions.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export const ResistancesPanel = ({
  resistances,
  immunities,
  vulnerabilities,
  onChange,
  readOnly
}: ResistancesPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Vulnerabilities */}
      <DamageTypeSelector
        label="Vulnerabilidades"
        icon={Skull}
        values={vulnerabilities}
        onChange={(v) => onChange({ vulnerabilities: v })}
        readOnly={readOnly}
        variant="destructive"
      />

      {/* Resistances */}
      <div className="space-y-4">
        <DamageTypeSelector
          label="Resistencias a daño"
          icon={Shield}
          values={resistances.damage}
          onChange={(v) => onChange({ resistances: { ...resistances, damage: v } })}
          readOnly={readOnly}
          variant="secondary"
        />
        <ConditionSelector
          label="Resistencias a condiciones"
          values={resistances.conditions}
          onChange={(v) => onChange({ resistances: { ...resistances, conditions: v } })}
          readOnly={readOnly}
        />
      </div>

      {/* Immunities */}
      <div className="space-y-4">
        <DamageTypeSelector
          label="Inmunidades a daño"
          icon={Flame}
          values={immunities.damage}
          onChange={(v) => onChange({ immunities: { ...immunities, damage: v } })}
          readOnly={readOnly}
        />
        <ConditionSelector
          label="Inmunidades a condiciones"
          values={immunities.conditions}
          onChange={(v) => onChange({ immunities: { ...immunities, conditions: v } })}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
