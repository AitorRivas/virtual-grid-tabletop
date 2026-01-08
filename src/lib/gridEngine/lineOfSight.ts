/**
 * Line of Sight Calculator - D&D 5e visibility rules
 * 
 * Uses Bresenham's line algorithm to trace a path between two cells
 * and checks for blocking obstacles.
 */

import { GridConfig, CellState } from './types';
import { cellKey } from './movementCalculator';

export interface LineOfSightResult {
  /** Whether there is clear line of sight */
  hasLineOfSight: boolean;
  /** Cells along the line of sight path */
  pathCells: Array<{ x: number; y: number }>;
  /** First blocking cell if any */
  blockingCell?: { x: number; y: number };
}

/**
 * Calculate line of sight between two cells using Bresenham's algorithm
 * 
 * @param fromX - Origin cell X
 * @param fromY - Origin cell Y
 * @param toX - Target cell X
 * @param toY - Target cell Y
 * @param cellStates - Map of cell states (blocked cells obstruct view)
 * @param config - Grid configuration
 * @returns Line of sight result with path and blocking info
 */
export const calculateLineOfSight = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  cellStates: Record<string, CellState>,
  config: GridConfig
): LineOfSightResult => {
  const pathCells: Array<{ x: number; y: number }> = [];
  
  let x0 = fromX;
  let y0 = fromY;
  const x1 = toX;
  const y1 = toY;
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    pathCells.push({ x: x0, y: y0 });
    
    // Check if current cell (not origin or target) blocks view
    if ((x0 !== fromX || y0 !== fromY) && (x0 !== toX || y0 !== toY)) {
      const state = cellStates[cellKey(x0, y0)] || 'free';
      if (state === 'blocked') {
        return {
          hasLineOfSight: false,
          pathCells,
          blockingCell: { x: x0, y: y0 },
        };
      }
    }
    
    if (x0 === x1 && y0 === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  
  return {
    hasLineOfSight: true,
    pathCells,
  };
};

/**
 * Check if line of sight exists (simple boolean check)
 */
export const hasLineOfSight = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  cellStates: Record<string, CellState>,
  config: GridConfig
): boolean => {
  return calculateLineOfSight(fromX, fromY, toX, toY, cellStates, config).hasLineOfSight;
};

/**
 * Get all cells visible from a position within a certain range
 * 
 * @param originX - Origin cell X
 * @param originY - Origin cell Y
 * @param rangeCells - Maximum range in cells
 * @param cellStates - Map of cell states
 * @param config - Grid configuration
 * @returns Array of visible cell coordinates
 */
export const getVisibleCells = (
  originX: number,
  originY: number,
  rangeCells: number,
  cellStates: Record<string, CellState>,
  config: GridConfig
): Array<{ x: number; y: number }> => {
  const visible: Array<{ x: number; y: number }> = [];
  const checked = new Set<string>();
  
  for (let dx = -rangeCells; dx <= rangeCells; dx++) {
    for (let dy = -rangeCells; dy <= rangeCells; dy++) {
      const targetX = originX + dx;
      const targetY = originY + dy;
      const key = cellKey(targetX, targetY);
      
      if (checked.has(key)) continue;
      checked.add(key);
      
      // Check bounds
      const maxCellX = Math.floor(config.mapWidth / config.cellSize);
      const maxCellY = Math.floor(config.mapHeight / config.cellSize);
      if (targetX < 0 || targetY < 0 || targetX >= maxCellX || targetY >= maxCellY) {
        continue;
      }
      
      // Check if within circular range
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > rangeCells) continue;
      
      // Check line of sight
      if (hasLineOfSight(originX, originY, targetX, targetY, cellStates, config)) {
        visible.push({ x: targetX, y: targetY });
      }
    }
  }
  
  return visible;
};
