export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
export type TokenColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan' | 'black';

export interface Character {
  id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
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
  token_color: TokenColor;
  token_size: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Monster {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: CreatureSize;
  challenge_rating: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armor_class: number;
  hit_points: number;
  speed: number;
  token_color: TokenColor;
  token_size: number;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Razas en español
export const DND_RACES = [
  { value: 'Human', label: 'Humano' },
  { value: 'Elf', label: 'Elfo' },
  { value: 'Dwarf', label: 'Enano' },
  { value: 'Halfling', label: 'Mediano' },
  { value: 'Gnome', label: 'Gnomo' },
  { value: 'Half-Elf', label: 'Semielfo' },
  { value: 'Half-Orc', label: 'Semiorco' },
  { value: 'Tiefling', label: 'Tiefling' },
  { value: 'Dragonborn', label: 'Dracónido' },
  { value: 'Aasimar', label: 'Aasimar' },
  { value: 'Goliath', label: 'Goliat' },
  { value: 'Tabaxi', label: 'Tabaxi' },
  { value: 'Kenku', label: 'Kenku' },
  { value: 'Firbolg', label: 'Firbolg' },
  { value: 'Triton', label: 'Tritón' },
  { value: 'Genasi', label: 'Genasi' },
];

// Clases en español
export const DND_CLASSES = [
  { value: 'Fighter', label: 'Guerrero' },
  { value: 'Wizard', label: 'Mago' },
  { value: 'Rogue', label: 'Pícaro' },
  { value: 'Cleric', label: 'Clérigo' },
  { value: 'Ranger', label: 'Explorador' },
  { value: 'Paladin', label: 'Paladín' },
  { value: 'Barbarian', label: 'Bárbaro' },
  { value: 'Bard', label: 'Bardo' },
  { value: 'Druid', label: 'Druida' },
  { value: 'Monk', label: 'Monje' },
  { value: 'Sorcerer', label: 'Hechicero' },
  { value: 'Warlock', label: 'Brujo' },
  { value: 'Artificer', label: 'Artífice' },
];

// Tipos de monstruos en español
export const MONSTER_TYPES = [
  { value: 'Aberration', label: 'Aberración' },
  { value: 'Beast', label: 'Bestia' },
  { value: 'Celestial', label: 'Celestial' },
  { value: 'Construct', label: 'Constructo' },
  { value: 'Dragon', label: 'Dragón' },
  { value: 'Elemental', label: 'Elemental' },
  { value: 'Fey', label: 'Feérico' },
  { value: 'Fiend', label: 'Infernal' },
  { value: 'Giant', label: 'Gigante' },
  { value: 'Humanoid', label: 'Humanoide' },
  { value: 'Monstrosity', label: 'Monstruosidad' },
  { value: 'Ooze', label: 'Cieno' },
  { value: 'Plant', label: 'Planta' },
  { value: 'Undead', label: 'No-muerto' },
];

// Tamaños de criaturas en español
export const CREATURE_SIZES = [
  { value: 'tiny', label: 'Diminuto' },
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
  { value: 'huge', label: 'Enorme' },
  { value: 'gargantuan', label: 'Gargantuesco' },
];

export const CHALLENGE_RATINGS = [
  '0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
];

// Alineamientos en español
export const ALIGNMENTS = [
  { value: 'Lawful Good', label: 'Legal Bueno' },
  { value: 'Neutral Good', label: 'Neutral Bueno' },
  { value: 'Chaotic Good', label: 'Caótico Bueno' },
  { value: 'Lawful Neutral', label: 'Legal Neutral' },
  { value: 'True Neutral', label: 'Neutral Verdadero' },
  { value: 'Chaotic Neutral', label: 'Caótico Neutral' },
  { value: 'Lawful Evil', label: 'Legal Malvado' },
  { value: 'Neutral Evil', label: 'Neutral Malvado' },
  { value: 'Chaotic Evil', label: 'Caótico Malvado' },
];

// Helper functions
export const getModifier = (score: number) => Math.floor((score - 10) / 2);
export const formatModifier = (mod: number) => mod >= 0 ? `+${mod}` : `${mod}`;

// Helpers para obtener labels
export const getRaceLabel = (value: string) => DND_RACES.find(r => r.value === value)?.label || value;
export const getClassLabel = (value: string) => DND_CLASSES.find(c => c.value === value)?.label || value;
export const getMonsterTypeLabel = (value: string) => MONSTER_TYPES.find(t => t.value === value)?.label || value;
export const getCreatureSizeLabel = (value: string) => CREATURE_SIZES.find(s => s.value === value)?.label || value;
export const getAlignmentLabel = (value: string) => ALIGNMENTS.find(a => a.value === value)?.label || value;
