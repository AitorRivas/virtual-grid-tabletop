/**
 * Grid Engine - D&D 5e Grid and Movement System
 * 
 * A modular, extensible system for handling grid-based movement,
 * area of effect, distance, line of sight, cover, and persistent zones
 * following D&D 5e rules.
 */

// Types
export * from './types';
export { 
  CREATURE_SIZE_CELLS, 
  CREATURE_SIZE_PIXELS, 
  getTokenSizeFromCreatureSize 
} from './types';

// Movement calculations
export {
  cellKey,
  parseKey,
  getDiagonalCost,
  getStraightCost,
  isCellWalkable,
  isCellDifficult,
  calculateReachableCells,
  calculateMoveCost,
  pixelToCell,
  cellToPixel,
  percentToCell,
  cellToPercent,
  snapToGrid,
} from './movementCalculator';

// Area of Effect calculations
export {
  calculateConeAffectedCells,
  calculateLineAffectedCells,
  calculateSphereAffectedCells,
  calculateCubeAffectedCells,
  calculateAffectedCells,
} from './areaOfEffect';

// Distance calculations
export {
  calculateDistanceFeet,
  calculateEuclideanDistance,
  calculateManhattanDistance,
  isWithinRange,
} from './distanceCalculator';
export type { DistanceResult } from './distanceCalculator';

// Line of Sight calculations
export {
  calculateLineOfSight,
  hasLineOfSight,
  getVisibleCells,
} from './lineOfSight';
export type { LineOfSightResult } from './lineOfSight';

// Cover calculations
export {
  calculateCover,
  getCoverDescription,
} from './coverCalculator';
export type { CoverLevel, CoverResult } from './coverCalculator';

// Persistent Zones
export {
  getZoneAffectedCells,
  isCellInZoneWithEffect,
  getZonesAtCell,
  getTriggeredEffects,
  isCellDifficultFromZone,
  createZone,
  advanceZoneRounds,
  createDifficultTerrainZone,
  createDamageZone,
  createSaveZone,
} from './persistentZones';
export type {
  DamageType,
  SaveAbility,
  ZoneTrigger,
  ZoneEffect,
  PersistentZone,
  ZoneManagerState,
} from './persistentZones';
