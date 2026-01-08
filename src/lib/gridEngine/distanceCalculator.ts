/**
 * Distance Calculator - D&D 5e distance measurement
 * 
 * Rules implemented (per PHB):
 * - Straight distance: 5 feet per cell
 * - Diagonal distance: alternating 5/10 feet rule
 */

import { GridConfig } from './types';

export interface DistanceResult {
  /** Distance in feet */
  feet: number;
  /** Distance in cells */
  cells: number;
  /** Whether the path is diagonal */
  isDiagonal: boolean;
}

/**
 * Calculate distance between two cells in feet using D&D 5e rules
 * Uses the 5/10/5 diagonal rule
 */
export const calculateDistanceFeet = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  config: GridConfig
): DistanceResult => {
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  
  // Number of diagonal moves = min of dx and dy
  const diagonalMoves = Math.min(dx, dy);
  // Number of straight moves = remaining after diagonals
  const straightMoves = Math.abs(dx - dy);
  
  // Apply 5/10/5 rule for diagonals
  // Odd diagonals (1st, 3rd, 5th...) cost 5ft
  // Even diagonals (2nd, 4th, 6th...) cost 10ft
  let diagonalCost = 0;
  for (let i = 1; i <= diagonalMoves; i++) {
    diagonalCost += (i % 2 === 1) ? 5 : 10;
  }
  
  const straightCost = straightMoves * config.feetPerCell;
  const totalFeet = diagonalCost + straightCost;
  const totalCells = diagonalMoves + straightMoves;
  
  return {
    feet: totalFeet,
    cells: totalCells,
    isDiagonal: diagonalMoves > 0,
  };
};

/**
 * Calculate Euclidean distance between two cells (for non-5e uses)
 */
export const calculateEuclideanDistance = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  config: GridConfig
): number => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const cellDistance = Math.sqrt(dx * dx + dy * dy);
  return cellDistance * config.feetPerCell;
};

/**
 * Calculate Manhattan distance (no diagonals) between two cells
 */
export const calculateManhattanDistance = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  config: GridConfig
): number => {
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  return (dx + dy) * config.feetPerCell;
};

/**
 * Check if a target is within a certain range in feet
 */
export const isWithinRange = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  rangeFeet: number,
  config: GridConfig
): boolean => {
  const distance = calculateDistanceFeet(fromX, fromY, toX, toY, config);
  return distance.feet <= rangeFeet;
};
