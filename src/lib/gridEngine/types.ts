/**
 * Grid Engine Types - Core types for the D&D 5e Grid and Movement System
 */

// ============= GRID TYPES =============

export type GridType = 'square' | 'none';

export type CellState = 'free' | 'blocked' | 'difficult';

export interface GridCell {
  x: number;
  y: number;
  state: CellState;
}

export interface GridConfig {
  /** Grid type: square or none (disabled) */
  type: GridType;
  /** Size of each cell in pixels */
  cellSize: number;
  /** Offset X in pixels from map origin */
  offsetX: number;
  /** Offset Y in pixels from map origin */
  offsetY: number;
  /** Map width in pixels */
  mapWidth: number;
  /** Map height in pixels */
  mapHeight: number;
  /** 1 cell = 5 feet (standard D&D) */
  feetPerCell: number;
}

export interface GridData {
  config: GridConfig;
  /** Map of "x,y" -> CellState for cells with non-default states */
  cellStates: Record<string, CellState>;
}

// ============= TOKEN TYPES =============

export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

/** Size in cells for each creature size */
export const CREATURE_SIZE_CELLS: Record<CreatureSize, number> = {
  tiny: 1,    // 0.5 would be ideal but we use 1 for simplicity
  small: 1,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4,
};

export interface GridTokenData {
  id: string;
  /** Cell X coordinate (origin cell for multi-cell tokens) */
  cellX: number;
  /** Cell Y coordinate (origin cell for multi-cell tokens) */
  cellY: number;
  /** Size in cells (1x1, 2x2, etc.) */
  sizeInCells: number;
  /** Base speed in feet */
  speedFeet: number;
  /** Remaining movement this turn in feet */
  movementRemaining: number;
}

// ============= MOVEMENT TYPES =============

export interface MoveResult {
  success: boolean;
  /** New cell X if successful */
  newCellX?: number;
  /** New cell Y if successful */
  newCellY?: number;
  /** Movement cost in feet */
  costFeet?: number;
  /** Error message if failed */
  error?: string;
}

export interface ReachableCellInfo {
  x: number;
  y: number;
  /** Total cost in feet to reach this cell */
  costFeet: number;
  /** Path of cells to reach this cell */
  path: Array<{ x: number; y: number }>;
}

// ============= AREA OF EFFECT TYPES =============

export type AreaShape = 'cone' | 'line' | 'sphere' | 'cube';

export interface AreaOfEffect {
  shape: AreaShape;
  /** Size in feet (radius for sphere, side for cube, length for line/cone) */
  sizeFeet: number;
  /** Origin cell X */
  originX: number;
  /** Origin cell Y */
  originY: number;
  /** Direction in degrees (0 = right, 90 = down, etc.) - for cones and lines */
  direction?: number;
}

export interface AffectedCell {
  x: number;
  y: number;
  /** Distance from origin in feet */
  distanceFeet: number;
}
