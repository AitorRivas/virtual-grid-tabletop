/**
 * Grid Engine - D&D 5e Grid and Movement System
 * 
 * A modular, extensible system for handling grid-based movement
 * and area of effect calculations following D&D 5e rules.
 */

// Types
export * from './types';

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
