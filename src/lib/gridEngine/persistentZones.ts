/**
 * Persistent Zones - D&D 5e area effects that persist on the map
 * 
 * Supports zones with:
 * - Difficult terrain
 * - Damage on entry
 * - Saving throws at turn start
 */

import { AreaShape, AffectedCell, GridConfig } from './types';
import { calculateAffectedCells } from './areaOfEffect';
import { cellKey } from './movementCalculator';

export type DamageType = 
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' 
  | 'lightning' | 'necrotic' | 'piercing' | 'poison' 
  | 'psychic' | 'radiant' | 'slashing' | 'thunder';

export type SaveAbility = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export type ZoneTrigger = 'on_enter' | 'on_start_turn' | 'on_end_turn';

export interface ZoneEffect {
  /** Unique identifier for this effect */
  id: string;
  /** Type of effect */
  type: 'difficult_terrain' | 'damage' | 'saving_throw' | 'custom';
  /** When the effect triggers */
  trigger?: ZoneTrigger;
  /** Damage info (if type is 'damage') */
  damage?: {
    diceExpression: string; // e.g., "2d6"
    damageType: DamageType;
  };
  /** Saving throw info (if type is 'saving_throw') */
  save?: {
    ability: SaveAbility;
    dc: number;
    /** Effect on success (e.g., "half damage") */
    onSuccess?: string;
    /** Effect on failure */
    onFailure?: string;
  };
  /** Custom description for 'custom' type */
  customDescription?: string;
}

export interface PersistentZone {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Zone shape */
  shape: AreaShape;
  /** Origin cell X */
  originX: number;
  /** Origin cell Y */
  originY: number;
  /** Size in feet */
  sizeFeet: number;
  /** Direction (for cones and lines) */
  direction?: number;
  /** Effects applied by this zone */
  effects: ZoneEffect[];
  /** Zone color for display (hex) */
  color: string;
  /** Opacity for display (0-1) */
  opacity: number;
  /** Duration in rounds (undefined = permanent until removed) */
  durationRounds?: number;
  /** Current round count */
  currentRound?: number;
  /** Caster/source of the zone */
  sourceId?: string;
  /** Is zone currently active */
  isActive: boolean;
}

export interface ZoneManagerState {
  zones: PersistentZone[];
}

/**
 * Calculate which cells a zone affects
 */
export const getZoneAffectedCells = (
  zone: PersistentZone,
  config: GridConfig
): AffectedCell[] => {
  return calculateAffectedCells({
    shape: zone.shape,
    sizeFeet: zone.sizeFeet,
    originX: zone.originX,
    originY: zone.originY,
    direction: zone.direction,
  }, config);
};

/**
 * Check if a cell is affected by any zone with a specific effect type
 */
export const isCellInZoneWithEffect = (
  cellX: number,
  cellY: number,
  effectType: ZoneEffect['type'],
  zones: PersistentZone[],
  config: GridConfig
): PersistentZone | undefined => {
  for (const zone of zones) {
    if (!zone.isActive) continue;
    
    const hasEffect = zone.effects.some(e => e.type === effectType);
    if (!hasEffect) continue;
    
    const affectedCells = getZoneAffectedCells(zone, config);
    const isAffected = affectedCells.some(c => c.x === cellX && c.y === cellY);
    
    if (isAffected) {
      return zone;
    }
  }
  return undefined;
};

/**
 * Get all zones affecting a specific cell
 */
export const getZonesAtCell = (
  cellX: number,
  cellY: number,
  zones: PersistentZone[],
  config: GridConfig
): PersistentZone[] => {
  return zones.filter(zone => {
    if (!zone.isActive) return false;
    const affectedCells = getZoneAffectedCells(zone, config);
    return affectedCells.some(c => c.x === cellX && c.y === cellY);
  });
};

/**
 * Get all effects that trigger at a specific moment for a cell
 */
export const getTriggeredEffects = (
  cellX: number,
  cellY: number,
  trigger: ZoneTrigger,
  zones: PersistentZone[],
  config: GridConfig
): Array<{ zone: PersistentZone; effect: ZoneEffect }> => {
  const triggeredEffects: Array<{ zone: PersistentZone; effect: ZoneEffect }> = [];
  
  for (const zone of zones) {
    if (!zone.isActive) continue;
    
    const affectedCells = getZoneAffectedCells(zone, config);
    const isAffected = affectedCells.some(c => c.x === cellX && c.y === cellY);
    
    if (!isAffected) continue;
    
    for (const effect of zone.effects) {
      if (effect.trigger === trigger || 
          (effect.type === 'damage' && effect.trigger === undefined && trigger === 'on_enter')) {
        triggeredEffects.push({ zone, effect });
      }
    }
  }
  
  return triggeredEffects;
};

/**
 * Check if a cell counts as difficult terrain due to zones
 */
export const isCellDifficultFromZone = (
  cellX: number,
  cellY: number,
  zones: PersistentZone[],
  config: GridConfig
): boolean => {
  return isCellInZoneWithEffect(cellX, cellY, 'difficult_terrain', zones, config) !== undefined;
};

/**
 * Create a new zone with default values
 */
export const createZone = (
  partial: Partial<PersistentZone> & Pick<PersistentZone, 'name' | 'shape' | 'originX' | 'originY' | 'sizeFeet'>
): PersistentZone => {
  return {
    id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    effects: [],
    color: '#ff6600',
    opacity: 0.3,
    isActive: true,
    ...partial,
  };
};

/**
 * Advance zone timers by one round
 * Returns zones that should be removed (expired)
 */
export const advanceZoneRounds = (
  zones: PersistentZone[]
): { activeZones: PersistentZone[]; expiredZones: PersistentZone[] } => {
  const activeZones: PersistentZone[] = [];
  const expiredZones: PersistentZone[] = [];
  
  for (const zone of zones) {
    if (zone.durationRounds !== undefined) {
      const currentRound = (zone.currentRound ?? 0) + 1;
      
      if (currentRound >= zone.durationRounds) {
        expiredZones.push({ ...zone, currentRound });
      } else {
        activeZones.push({ ...zone, currentRound });
      }
    } else {
      activeZones.push(zone);
    }
  }
  
  return { activeZones, expiredZones };
};

// Preset zone creators for common spells/effects

export const createDifficultTerrainZone = (
  name: string,
  shape: AreaShape,
  originX: number,
  originY: number,
  sizeFeet: number,
  direction?: number
): PersistentZone => createZone({
  name,
  shape,
  originX,
  originY,
  sizeFeet,
  direction,
  effects: [{ id: 'dt_1', type: 'difficult_terrain' }],
  color: '#8B4513', // brown
  opacity: 0.25,
});

export const createDamageZone = (
  name: string,
  shape: AreaShape,
  originX: number,
  originY: number,
  sizeFeet: number,
  diceExpression: string,
  damageType: DamageType,
  trigger: ZoneTrigger = 'on_enter',
  direction?: number
): PersistentZone => createZone({
  name,
  shape,
  originX,
  originY,
  sizeFeet,
  direction,
  effects: [{
    id: 'dmg_1',
    type: 'damage',
    trigger,
    damage: { diceExpression, damageType },
  }],
  color: damageType === 'fire' ? '#ff4400' : 
         damageType === 'cold' ? '#00ccff' : 
         damageType === 'acid' ? '#00ff00' : 
         '#ff00ff',
  opacity: 0.35,
});

export const createSaveZone = (
  name: string,
  shape: AreaShape,
  originX: number,
  originY: number,
  sizeFeet: number,
  ability: SaveAbility,
  dc: number,
  trigger: ZoneTrigger,
  onSuccess: string,
  onFailure: string,
  direction?: number
): PersistentZone => createZone({
  name,
  shape,
  originX,
  originY,
  sizeFeet,
  direction,
  effects: [{
    id: 'save_1',
    type: 'saving_throw',
    trigger,
    save: { ability, dc, onSuccess, onFailure },
  }],
  color: '#9900ff',
  opacity: 0.3,
});
