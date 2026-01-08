/**
 * Movement Calculator - D&D 5e movement rules
 * 
 * Rules implemented:
 * - 1 cell = 5 feet movement cost
 * - Diagonal movement: alternating 5/10 feet (5e optional rule)
 * - Difficult terrain: double movement cost
 */

import { GridConfig, GridCell, CellState, ReachableCellInfo, GridTokenData } from './types';

/** Key generator for cell coordinates */
export const cellKey = (x: number, y: number): string => `${x},${y}`;

/** Parse cell key back to coordinates */
export const parseKey = (key: string): { x: number; y: number } => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};

/**
 * Get movement cost for a diagonal move (5e alternating rule)
 * @param diagonalCount - Number of diagonal moves made so far this path
 * @param isDifficult - Whether the target cell is difficult terrain
 * @returns Movement cost in feet
 */
export const getDiagonalCost = (diagonalCount: number, isDifficult: boolean): number => {
  // Alternating 5/10: odd diagonals cost 5, even diagonals cost 10
  const baseCost = (diagonalCount % 2 === 0) ? 5 : 10;
  return isDifficult ? baseCost * 2 : baseCost;
};

/**
 * Get movement cost for a straight (non-diagonal) move
 * @param isDifficult - Whether the target cell is difficult terrain
 * @returns Movement cost in feet
 */
export const getStraightCost = (isDifficult: boolean): number => {
  return isDifficult ? 10 : 5;
};

/**
 * Check if a cell is walkable (not blocked)
 */
export const isCellWalkable = (
  x: number,
  y: number,
  cellStates: Record<string, CellState>,
  config: GridConfig
): boolean => {
  // Check bounds
  const maxCellX = Math.floor(config.mapWidth / config.cellSize);
  const maxCellY = Math.floor(config.mapHeight / config.cellSize);
  
  if (x < 0 || y < 0 || x >= maxCellX || y >= maxCellY) {
    return false;
  }
  
  const state = cellStates[cellKey(x, y)] || 'free';
  return state !== 'blocked';
};

/**
 * Check if a cell is difficult terrain
 */
export const isCellDifficult = (
  x: number,
  y: number,
  cellStates: Record<string, CellState>
): boolean => {
  const state = cellStates[cellKey(x, y)] || 'free';
  return state === 'difficult';
};

/**
 * Get all 8 neighboring cells
 */
const getNeighbors = (x: number, y: number): Array<{ x: number; y: number; isDiagonal: boolean }> => [
  { x: x - 1, y: y, isDiagonal: false },     // left
  { x: x + 1, y: y, isDiagonal: false },     // right
  { x: x, y: y - 1, isDiagonal: false },     // up
  { x: x, y: y + 1, isDiagonal: false },     // down
  { x: x - 1, y: y - 1, isDiagonal: true },  // top-left
  { x: x + 1, y: y - 1, isDiagonal: true },  // top-right
  { x: x - 1, y: y + 1, isDiagonal: true },  // bottom-left
  { x: x + 1, y: y + 1, isDiagonal: true },  // bottom-right
];

/**
 * Calculate all reachable cells for a token given its remaining movement
 * Uses Dijkstra's algorithm with 5e diagonal movement rules
 */
export const calculateReachableCells = (
  token: GridTokenData,
  cellStates: Record<string, CellState>,
  config: GridConfig
): ReachableCellInfo[] => {
  if (config.type === 'none') return [];
  
  const startX = token.cellX;
  const startY = token.cellY;
  const maxMovement = token.movementRemaining;
  
  // Priority queue entries: [cost, x, y, diagonalCount, path]
  type QueueEntry = {
    cost: number;
    x: number;
    y: number;
    diagonalCount: number;
    path: Array<{ x: number; y: number }>;
  };
  
  const visited = new Map<string, { cost: number; diagonalCount: number }>();
  const reachable: ReachableCellInfo[] = [];
  
  // Simple priority queue using array (sufficient for grid sizes)
  const queue: QueueEntry[] = [{ 
    cost: 0, 
    x: startX, 
    y: startY, 
    diagonalCount: 0, 
    path: [] 
  }];
  
  while (queue.length > 0) {
    // Sort by cost and take lowest
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    
    const key = cellKey(current.x, current.y);
    const existing = visited.get(key);
    
    // Skip if we've visited with equal or lower cost
    if (existing && existing.cost <= current.cost) {
      continue;
    }
    
    visited.set(key, { cost: current.cost, diagonalCount: current.diagonalCount });
    
    // Add to reachable (except starting position)
    if (current.x !== startX || current.y !== startY) {
      reachable.push({
        x: current.x,
        y: current.y,
        costFeet: current.cost,
        path: current.path,
      });
    }
    
    // Explore neighbors
    for (const neighbor of getNeighbors(current.x, current.y)) {
      if (!isCellWalkable(neighbor.x, neighbor.y, cellStates, config)) {
        continue;
      }
      
      // For diagonal movement, check that we can pass through adjacent cells
      if (neighbor.isDiagonal) {
        const adj1 = isCellWalkable(current.x, neighbor.y, cellStates, config);
        const adj2 = isCellWalkable(neighbor.x, current.y, cellStates, config);
        if (!adj1 || !adj2) continue; // Can't squeeze diagonally past blocked cells
      }
      
      const isDifficult = isCellDifficult(neighbor.x, neighbor.y, cellStates);
      const moveCost = neighbor.isDiagonal 
        ? getDiagonalCost(current.diagonalCount, isDifficult)
        : getStraightCost(isDifficult);
      
      const newCost = current.cost + moveCost;
      
      if (newCost > maxMovement) continue;
      
      const newDiagonalCount = neighbor.isDiagonal 
        ? current.diagonalCount + 1 
        : current.diagonalCount;
      
      queue.push({
        cost: newCost,
        x: neighbor.x,
        y: neighbor.y,
        diagonalCount: newDiagonalCount,
        path: [...current.path, { x: current.x, y: current.y }],
      });
    }
  }
  
  return reachable;
};

/**
 * Calculate movement cost between two adjacent cells
 */
export const calculateMoveCost = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  diagonalCount: number,
  cellStates: Record<string, CellState>
): { cost: number; newDiagonalCount: number } | null => {
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  
  // Must be adjacent (including diagonal)
  if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
    return null;
  }
  
  const isDiagonal = dx === 1 && dy === 1;
  const isDifficult = isCellDifficult(toX, toY, cellStates);
  
  const cost = isDiagonal 
    ? getDiagonalCost(diagonalCount, isDifficult)
    : getStraightCost(isDifficult);
  
  return {
    cost,
    newDiagonalCount: isDiagonal ? diagonalCount + 1 : diagonalCount,
  };
};

/**
 * Convert pixel position to cell coordinates
 */
export const pixelToCell = (
  pixelX: number,
  pixelY: number,
  config: GridConfig
): { cellX: number; cellY: number } => {
  const cellX = Math.floor((pixelX - config.offsetX) / config.cellSize);
  const cellY = Math.floor((pixelY - config.offsetY) / config.cellSize);
  return { cellX, cellY };
};

/**
 * Convert cell coordinates to pixel position (center of cell)
 */
export const cellToPixel = (
  cellX: number,
  cellY: number,
  config: GridConfig
): { pixelX: number; pixelY: number } => {
  const pixelX = config.offsetX + (cellX + 0.5) * config.cellSize;
  const pixelY = config.offsetY + (cellY + 0.5) * config.cellSize;
  return { pixelX, pixelY };
};

/**
 * Convert percent position to cell coordinates
 */
export const percentToCell = (
  percentX: number,
  percentY: number,
  config: GridConfig
): { cellX: number; cellY: number } => {
  const pixelX = (percentX / 100) * config.mapWidth;
  const pixelY = (percentY / 100) * config.mapHeight;
  return pixelToCell(pixelX, pixelY, config);
};

/**
 * Convert cell coordinates to percent position
 */
export const cellToPercent = (
  cellX: number,
  cellY: number,
  config: GridConfig
): { percentX: number; percentY: number } => {
  const { pixelX, pixelY } = cellToPixel(cellX, cellY, config);
  const percentX = (pixelX / config.mapWidth) * 100;
  const percentY = (pixelY / config.mapHeight) * 100;
  return { percentX, percentY };
};

/**
 * Snap a percent position to the nearest cell center
 */
export const snapToGrid = (
  percentX: number,
  percentY: number,
  config: GridConfig
): { percentX: number; percentY: number } => {
  const { cellX, cellY } = percentToCell(percentX, percentY, config);
  return cellToPercent(cellX, cellY, config);
};
