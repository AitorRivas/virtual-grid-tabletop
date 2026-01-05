// D&D 5e Extended Types and Calculations
import { getModifier, formatModifier } from './dnd';

// ============= EQUIPMENT TYPES =============
export type EquipmentType = 'weapon' | 'armor' | 'shield' | 'gear' | 'magic_item' | 'consumable';
export type WeaponProperty = 'finesse' | 'versatile' | 'two_handed' | 'light' | 'heavy' | 'reach' | 'thrown' | 'ammunition' | 'loading' | 'special';
export type ArmorType = 'light' | 'medium' | 'heavy' | 'shield';
export type DamageType = 'slashing' | 'piercing' | 'bludgeoning' | 'fire' | 'cold' | 'lightning' | 'thunder' | 'poison' | 'acid' | 'necrotic' | 'radiant' | 'force' | 'psychic';

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  quantity: number;
  equipped: boolean;
  description?: string;
  // Weapon properties
  damage_dice?: string; // "1d8", "2d6"
  damage_type?: DamageType;
  damage_bonus?: number;
  attack_bonus?: number;
  properties?: WeaponProperty[];
  range?: string; // "5 ft" or "30/120 ft"
  versatile_damage?: string; // "1d10"
  // Armor properties
  armor_type?: ArmorType;
  ac_base?: number;
  ac_max_dex?: number | null; // null = unlimited
  strength_requirement?: number;
  stealth_disadvantage?: boolean;
  // Magic item
  requires_attunement?: boolean;
  attuned?: boolean;
}

// ============= ACTION TYPES =============
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'lair' | 'free';

export interface CharacterAction {
  id: string;
  name: string;
  type: ActionType;
  description: string;
  // Attack info
  is_attack?: boolean;
  attack_ability?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  attack_bonus?: number; // Additional bonus on top of calculated
  // Damage info
  damage_dice?: string;
  damage_type?: DamageType;
  damage_ability?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma' | 'none';
  damage_bonus?: number;
  // Save info
  save_dc_ability?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  save_dc_bonus?: number;
  save_type?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  // Range
  range?: string;
  // Legendary action cost
  legendary_cost?: number;
  // Uses
  uses_max?: number;
  uses_current?: number;
  recharge?: string; // "short rest", "long rest", "recharge 5-6"
}

// ============= SPELL TYPES =============
export type SpellSchool = 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: SpellSchool;
  casting_time: string;
  range: string;
  components: string; // "V, S, M (a pinch of salt)"
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_levels?: string;
  damage_dice?: string;
  damage_type?: DamageType;
  save_type?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
}

export interface SpellSlots {
  [level: number]: { max: number; used: number };
}

export interface CharacterSpells {
  slots: SpellSlots;
  known: Spell[];
  prepared: string[]; // IDs of prepared spells
}

// ============= PROFICIENCIES =============
export type Skill = 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics' | 'deception' | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine' | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand' | 'stealth' | 'survival';
export type SaveType = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface CharacterProficiencies {
  saves: SaveType[];
  skills: Skill[];
  expertise: Skill[]; // Double proficiency
  weapons: string[];
  armor: string[];
  tools: string[];
  languages: string[];
}

// ============= FEATURE/TRAIT =============
export interface Feature {
  id: string;
  name: string;
  source: string; // "Racial", "Class", "Feat", "Background"
  description: string;
  uses_max?: number;
  uses_current?: number;
  recharge?: string;
}

// ============= SPEEDS & SENSES =============
export interface Speeds {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

export interface Senses {
  passive_perception: number;
  passive_investigation?: number;
  passive_insight?: number;
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
}

// ============= RESISTANCES =============
export interface Resistances {
  damage: DamageType[];
  conditions: string[];
}

// ============= MULTICLASS =============
export interface MulticlassEntry {
  class: string;
  subclass?: string;
  level: number;
}

// ============= SKILL DATA =============
export const SKILLS: { value: Skill; label: string; ability: SaveType }[] = [
  { value: 'acrobatics', label: 'Acrobacias', ability: 'dexterity' },
  { value: 'animal_handling', label: 'Trato con Animales', ability: 'wisdom' },
  { value: 'arcana', label: 'Arcanos', ability: 'intelligence' },
  { value: 'athletics', label: 'Atletismo', ability: 'strength' },
  { value: 'deception', label: 'Engaño', ability: 'charisma' },
  { value: 'history', label: 'Historia', ability: 'intelligence' },
  { value: 'insight', label: 'Perspicacia', ability: 'wisdom' },
  { value: 'intimidation', label: 'Intimidación', ability: 'charisma' },
  { value: 'investigation', label: 'Investigación', ability: 'intelligence' },
  { value: 'medicine', label: 'Medicina', ability: 'wisdom' },
  { value: 'nature', label: 'Naturaleza', ability: 'intelligence' },
  { value: 'perception', label: 'Percepción', ability: 'wisdom' },
  { value: 'performance', label: 'Interpretación', ability: 'charisma' },
  { value: 'persuasion', label: 'Persuasión', ability: 'charisma' },
  { value: 'religion', label: 'Religión', ability: 'intelligence' },
  { value: 'sleight_of_hand', label: 'Juego de Manos', ability: 'dexterity' },
  { value: 'stealth', label: 'Sigilo', ability: 'dexterity' },
  { value: 'survival', label: 'Supervivencia', ability: 'wisdom' },
];

export const SAVES: { value: SaveType; label: string; abbr: string }[] = [
  { value: 'strength', label: 'Fuerza', abbr: 'FUE' },
  { value: 'dexterity', label: 'Destreza', abbr: 'DES' },
  { value: 'constitution', label: 'Constitución', abbr: 'CON' },
  { value: 'intelligence', label: 'Inteligencia', abbr: 'INT' },
  { value: 'wisdom', label: 'Sabiduría', abbr: 'SAB' },
  { value: 'charisma', label: 'Carisma', abbr: 'CAR' },
];

export const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: 'slashing', label: 'Cortante' },
  { value: 'piercing', label: 'Perforante' },
  { value: 'bludgeoning', label: 'Contundente' },
  { value: 'fire', label: 'Fuego' },
  { value: 'cold', label: 'Frío' },
  { value: 'lightning', label: 'Rayo' },
  { value: 'thunder', label: 'Trueno' },
  { value: 'poison', label: 'Veneno' },
  { value: 'acid', label: 'Ácido' },
  { value: 'necrotic', label: 'Necrótico' },
  { value: 'radiant', label: 'Radiante' },
  { value: 'force', label: 'Fuerza' },
  { value: 'psychic', label: 'Psíquico' },
];

export const SPELL_SCHOOLS: { value: SpellSchool; label: string }[] = [
  { value: 'abjuration', label: 'Abjuración' },
  { value: 'conjuration', label: 'Conjuración' },
  { value: 'divination', label: 'Adivinación' },
  { value: 'enchantment', label: 'Encantamiento' },
  { value: 'evocation', label: 'Evocación' },
  { value: 'illusion', label: 'Ilusión' },
  { value: 'necromancy', label: 'Nigromancia' },
  { value: 'transmutation', label: 'Transmutación' },
];

export const CONDITIONS = [
  'Apresado', 'Asustado', 'Aturdido', 'Cegado', 'Derribado', 'Encantado', 
  'Ensordecido', 'Envenenado', 'Incapacitado', 'Inconsciente', 'Invisible', 
  'Paralizado', 'Petrificado', 'Restringido', 'Agotamiento'
];

// ============= CALCULATION UTILITIES =============

/** Calculate proficiency bonus based on level */
export const getProficiencyBonus = (level: number): number => {
  return Math.ceil(level / 4) + 1;
};

/** Calculate spell save DC */
export const getSpellSaveDC = (abilityMod: number, profBonus: number, bonus: number = 0): number => {
  return 8 + profBonus + abilityMod + bonus;
};

/** Calculate spell attack bonus */
export const getSpellAttackBonus = (abilityMod: number, profBonus: number, bonus: number = 0): number => {
  return profBonus + abilityMod + bonus;
};

/** Calculate skill modifier */
export const getSkillModifier = (
  abilityScore: number,
  profBonus: number,
  isProficient: boolean,
  hasExpertise: boolean
): number => {
  const mod = getModifier(abilityScore);
  if (hasExpertise) return mod + profBonus * 2;
  if (isProficient) return mod + profBonus;
  return mod;
};

/** Calculate save modifier */
export const getSaveModifier = (
  abilityScore: number,
  profBonus: number,
  isProficient: boolean
): number => {
  const mod = getModifier(abilityScore);
  return isProficient ? mod + profBonus : mod;
};

/** Calculate AC from equipment */
export const calculateAC = (
  dexMod: number,
  equipment: EquipmentItem[],
  baseAC: number = 10
): number => {
  const equippedArmor = equipment.find(e => e.equipped && e.type === 'armor' && e.armor_type !== 'shield');
  const equippedShield = equipment.find(e => e.equipped && (e.type === 'shield' || e.armor_type === 'shield'));
  
  let ac = baseAC;
  
  if (equippedArmor) {
    ac = equippedArmor.ac_base || 10;
    const maxDex = equippedArmor.ac_max_dex;
    if (maxDex === null || maxDex === undefined) {
      ac += dexMod; // No limit
    } else if (maxDex === 0) {
      // No dex bonus (heavy armor)
    } else {
      ac += Math.min(dexMod, maxDex);
    }
  } else {
    ac = 10 + dexMod; // Unarmored
  }
  
  if (equippedShield) {
    ac += equippedShield.ac_base || 2;
  }
  
  // Add magic bonuses
  equipment.filter(e => e.equipped && e.attack_bonus).forEach(e => {
    if (e.type === 'armor' || e.type === 'shield') {
      ac += e.attack_bonus || 0;
    }
  });
  
  return ac;
};

/** Calculate initiative bonus */
export const getInitiativeBonus = (dexMod: number, bonus: number = 0): number => {
  return dexMod + bonus;
};

/** Calculate passive perception */
export const getPassivePerception = (
  wisdomScore: number,
  profBonus: number,
  isProficient: boolean,
  hasExpertise: boolean,
  bonus: number = 0
): number => {
  return 10 + getSkillModifier(wisdomScore, profBonus, isProficient, hasExpertise) + bonus;
};

/** Calculate attack bonus for a weapon */
export const getWeaponAttackBonus = (
  weapon: EquipmentItem,
  strMod: number,
  dexMod: number,
  profBonus: number,
  isProficient: boolean = true
): number => {
  const isFinesse = weapon.properties?.includes('finesse');
  const isRanged = weapon.range && !weapon.range.startsWith('5');
  
  const abilityMod = (isFinesse && dexMod > strMod) || isRanged ? dexMod : strMod;
  const proficiency = isProficient ? profBonus : 0;
  const magicBonus = weapon.attack_bonus || 0;
  
  return abilityMod + proficiency + magicBonus;
};

/** Calculate damage bonus for a weapon */
export const getWeaponDamageBonus = (
  weapon: EquipmentItem,
  strMod: number,
  dexMod: number
): number => {
  const isFinesse = weapon.properties?.includes('finesse');
  const isRanged = weapon.range && !weapon.range.startsWith('5');
  
  const abilityMod = (isFinesse && dexMod > strMod) || isRanged ? dexMod : strMod;
  const magicBonus = weapon.damage_bonus || 0;
  
  return abilityMod + magicBonus;
};

/** Format a dice expression with bonus */
export const formatDamage = (dice: string, bonus: number): string => {
  if (bonus === 0) return dice;
  return `${dice}${bonus >= 0 ? '+' : ''}${bonus}`;
};

/** Get skill label by value */
export const getSkillLabel = (skill: Skill): string => {
  return SKILLS.find(s => s.value === skill)?.label || skill;
};

/** Get save label by value */
export const getSaveLabel = (save: SaveType): string => {
  return SAVES.find(s => s.value === save)?.label || save;
};

/** Get damage type label */
export const getDamageTypeLabel = (type: DamageType): string => {
  return DAMAGE_TYPES.find(d => d.value === type)?.label || type;
};

// ============= EXTENDED CHARACTER TYPE =============
export interface ExtendedCharacter {
  id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  subclass: string | null;
  level: number;
  background: string | null;
  alignment: string | null;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armor_class: number;
  hit_points_max: number;
  hit_points_current: number | null;
  speed: number;
  initiative_bonus: number;
  proficiency_bonus: number;
  token_color: string;
  token_size: number;
  image_url: string | null;
  notes: string | null;
  equipment: EquipmentItem[];
  proficiencies: CharacterProficiencies;
  features: Feature[];
  actions: CharacterAction[];
  spells: CharacterSpells;
  speeds: Speeds;
  senses: Senses;
  resistances: Resistances;
  spell_ability: string | null;
  multiclass: MulticlassEntry[];
  created_at: string;
  updated_at: string;
}

// ============= EXTENDED MONSTER TYPE =============
export interface ExtendedMonster {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: string;
  alignment: string | null;
  challenge_rating: string;
  proficiency_bonus: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armor_class: number;
  hit_points: number;
  hit_dice: string | null;
  speed: number;
  speeds: Speeds;
  senses: Senses;
  languages: string[];
  resistances: Resistances;
  immunities: Resistances;
  vulnerabilities: DamageType[];
  saves: { ability: SaveType; bonus: number }[];
  skills: { skill: Skill; bonus: number }[];
  traits: Feature[];
  actions: CharacterAction[];
  bonus_actions: CharacterAction[];
  reactions: CharacterAction[];
  legendary_actions: { count: number; actions: CharacterAction[] };
  lair_actions: CharacterAction[];
  token_color: string;
  token_size: number;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
