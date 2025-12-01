import {
  EyeOff, Heart, EarOff, Battery, AlertTriangle, Link, Ban, Ghost,
  Zap, Gem, Skull as SkullIcon, ArrowDown, Lock, Brain, Moon,
  Sparkles, Plane, PersonStanding, EyeClosed, Shield, Droplets, Sun,
  Star, Flame, Clock, Leaf, Target, Wind, Footprints, Smile, HelpCircle,
  Wine, CheckCircle, RefreshCw, TrendingUp, TrendingDown, ShieldHalf,
  CircleDot, Snowflake, Mountain, Activity
} from 'lucide-react';

export interface Condition {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // HSL color for the badge
  category: 'official' | 'common' | 'spell' | 'terrain' | 'roleplay' | 'meta';
}

export const conditions: Condition[] = [
  // OFFICIAL CONDITIONS
  { id: 'blinded', name: 'Blinded', nameEs: 'Cegado', description: 'No ve, desventaja en ataques, ventaja contra él', icon: EyeOff, color: '0 0% 30%', category: 'official' },
  { id: 'charmed', name: 'Charmed', nameEs: 'Encantado', description: 'No puede atacar al encantador', icon: Heart, color: '330 80% 60%', category: 'official' },
  { id: 'deafened', name: 'Deafened', nameEs: 'Ensordecido', description: 'No oye, desventaja en tiradas de oído', icon: EarOff, color: '40 30% 50%', category: 'official' },
  { id: 'exhausted', name: 'Exhausted', nameEs: 'Fatigado', description: 'Niveles acumulativos de agotamiento', icon: Battery, color: '30 60% 40%', category: 'official' },
  { id: 'frightened', name: 'Frightened', nameEs: 'Asustado', description: 'Desventaja mientras ve la fuente de miedo', icon: AlertTriangle, color: '45 100% 50%', category: 'official' },
  { id: 'grappled', name: 'Grappled', nameEs: 'Agarrado', description: 'Velocidad 0', icon: Link, color: '200 30% 50%', category: 'official' },
  { id: 'incapacitated', name: 'Incapacitated', nameEs: 'Incapacitado', description: 'No puede realizar acciones ni reacciones', icon: Ban, color: '0 50% 50%', category: 'official' },
  { id: 'invisible', name: 'Invisible', nameEs: 'Invisible', description: 'No puede ser visto, ventaja en ataques', icon: Ghost, color: '200 50% 70%', category: 'official' },
  { id: 'paralyzed', name: 'Paralyzed', nameEs: 'Paralizado', description: 'Incapacitado, no puede moverse, críticos automáticos', icon: Zap, color: '60 100% 50%', category: 'official' },
  { id: 'petrified', name: 'Petrified', nameEs: 'Petrificado', description: 'Convertido en piedra', icon: Gem, color: '30 20% 60%', category: 'official' },
  { id: 'poisoned', name: 'Poisoned', nameEs: 'Envenenado', description: 'Desventaja en ataques y pruebas', icon: SkullIcon, color: '120 60% 35%', category: 'official' },
  { id: 'prone', name: 'Prone', nameEs: 'Derribado', description: 'Tumbado, ventaja cuerpo a cuerpo, desventaja a distancia', icon: ArrowDown, color: '30 50% 45%', category: 'official' },
  { id: 'restrained', name: 'Restrained', nameEs: 'Restringido', description: 'Velocidad 0, desventaja en ataques', icon: Lock, color: '280 40% 50%', category: 'official' },
  { id: 'stunned', name: 'Stunned', nameEs: 'Aturdido', description: 'No puede moverse, falla FOR/DES', icon: Brain, color: '270 60% 60%', category: 'official' },
  { id: 'unconscious', name: 'Unconscious', nameEs: 'Inconsciente', description: 'Cae al suelo, incapacitado, críticos cuerpo a cuerpo', icon: Moon, color: '240 40% 40%', category: 'official' },

  // COMMON UNOFFICIAL
  { id: 'concentrating', name: 'Concentrating', nameEs: 'Concentración', description: 'Manteniendo un hechizo de concentración', icon: Sparkles, color: '180 80% 50%', category: 'common' },
  { id: 'flying', name: 'Flying', nameEs: 'Volando', description: 'En el aire, altura variable', icon: Plane, color: '200 80% 60%', category: 'common' },
  { id: 'mounted', name: 'Mounted', nameEs: 'Montado', description: 'Sobre una montura', icon: PersonStanding, color: '30 60% 50%', category: 'common' },
  { id: 'hidden', name: 'Hidden', nameEs: 'Oculto', description: 'Escondido de enemigos', icon: EyeClosed, color: '260 30% 40%', category: 'common' },
  { id: 'half_cover', name: 'Half Cover', nameEs: '½ Cobertura', description: '+2 CA y salvaciones DES', icon: Shield, color: '210 30% 50%', category: 'common' },
  { id: 'three_quarters_cover', name: '¾ Cover', nameEs: '¾ Cobertura', description: '+5 CA y salvaciones DES', icon: ShieldHalf, color: '210 40% 45%', category: 'common' },
  { id: 'full_cover', name: 'Full Cover', nameEs: 'Cobertura Total', description: 'No puede ser objetivo directo', icon: Mountain, color: '210 50% 35%', category: 'common' },
  { id: 'submerged', name: 'Submerged', nameEs: 'Sumergido', description: 'Bajo el agua', icon: Droplets, color: '200 70% 50%', category: 'common' },
  { id: 'dim_light', name: 'Dim Light', nameEs: 'Penumbra', description: 'Zona de penumbra', icon: Sun, color: '45 50% 50%', category: 'common' },
  { id: 'darkness', name: 'Darkness', nameEs: 'Oscuridad', description: 'Zona de oscuridad', icon: Moon, color: '260 20% 20%', category: 'common' },

  // SPELL EFFECTS
  { id: 'blessed', name: 'Blessed', nameEs: 'Bendecido', description: '+1d4 a ataques y salvaciones', icon: Star, color: '50 100% 60%', category: 'spell' },
  { id: 'cursed', name: 'Cursed', nameEs: 'Maldecido', description: 'Bajo efecto de maldición (Hex/Bane)', icon: SkullIcon, color: '280 60% 40%', category: 'spell' },
  { id: 'hasted', name: 'Hasted', nameEs: 'Acelerado', description: 'Velocidad doble, +2 CA, acción extra', icon: Zap, color: '50 100% 50%', category: 'spell' },
  { id: 'slowed', name: 'Slowed', nameEs: 'Aletargado', description: 'Velocidad reducida a la mitad', icon: Clock, color: '200 30% 40%', category: 'spell' },
  { id: 'polymorphed', name: 'Polymorphed', nameEs: 'Transformado', description: 'Bajo efecto de Polymorph/Wild Shape', icon: Leaf, color: '120 50% 45%', category: 'spell' },
  { id: 'levitating', name: 'Levitating', nameEs: 'Levitando', description: 'Flotando, movimiento vertical', icon: Wind, color: '180 50% 60%', category: 'spell' },
  { id: 'entangled', name: 'Entangled', nameEs: 'Enredado', description: 'Atrapado en red/telaraña', icon: Link, color: '30 40% 45%', category: 'spell' },
  { id: 'burning', name: 'Burning', nameEs: 'En llamas', description: 'Recibiendo daño de fuego recurrente', icon: Flame, color: '15 100% 50%', category: 'spell' },
  { id: 'marked', name: 'Marked', nameEs: 'Marcado', description: "Hunter's Mark / Favored Foe activo", icon: Target, color: '0 70% 50%', category: 'spell' },

  // TERRAIN
  { id: 'slippery', name: 'Slippery', nameEs: 'Resbaladizo', description: 'En terreno de grasa/hielo', icon: Snowflake, color: '200 80% 70%', category: 'terrain' },
  { id: 'difficult_terrain', name: 'Difficult Terrain', nameEs: 'Terreno Difícil', description: 'Movimiento a mitad de velocidad', icon: Footprints, color: '30 30% 40%', category: 'terrain' },
  { id: 'hazardous', name: 'Hazardous', nameEs: 'Zona Peligrosa', description: 'En zona de daño (llamas/ácido/espinas)', icon: AlertTriangle, color: '15 80% 50%', category: 'terrain' },

  // ROLEPLAY
  { id: 'inspired', name: 'Inspired', nameEs: 'Inspirado', description: 'Tiene inspiración de bardo o heroísmo', icon: Star, color: '45 100% 55%', category: 'roleplay' },
  { id: 'confused', name: 'Confused', nameEs: 'Confundido', description: 'Bajo efecto de Confusion o similar', icon: HelpCircle, color: '270 50% 55%', category: 'roleplay' },
  { id: 'drunk', name: 'Drunk', nameEs: 'Borracho', description: 'Bajo efectos del alcohol', icon: Wine, color: '350 50% 45%', category: 'roleplay' },

  // META
  { id: 'turn_used', name: 'Turn Used', nameEs: 'Turno Gastado', description: 'Ya actuó este turno', icon: CheckCircle, color: '0 0% 50%', category: 'meta' },
  { id: 'reaction_used', name: 'Reaction Used', nameEs: 'Reacción Gastada', description: 'Ya usó su reacción', icon: RefreshCw, color: '0 0% 45%', category: 'meta' },
  { id: 'advantage', name: 'Advantage', nameEs: 'Con Ventaja', description: 'Tiene ventaja en tiradas', icon: TrendingUp, color: '120 60% 45%', category: 'meta' },
  { id: 'disadvantage', name: 'Disadvantage', nameEs: 'Con Desventaja', description: 'Tiene desventaja en tiradas', icon: TrendingDown, color: '0 60% 45%', category: 'meta' },
  { id: 'concentration_broken', name: 'Concentration Broken', nameEs: 'Concentración Rota', description: 'Perdió la concentración', icon: Activity, color: '0 70% 50%', category: 'meta' },
];

export const conditionCategories = [
  { id: 'official', name: 'Condiciones Oficiales' },
  { id: 'common', name: 'Estados Comunes' },
  { id: 'spell', name: 'Efectos de Hechizos' },
  { id: 'terrain', name: 'Terreno' },
  { id: 'roleplay', name: 'Roleplay' },
  { id: 'meta', name: 'Meta' },
];

export const getConditionById = (id: string): Condition | undefined => {
  return conditions.find(c => c.id === id);
};
