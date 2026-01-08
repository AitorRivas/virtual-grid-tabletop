/**
 * Area of Effect Calculator - D&D 5e area shapes
 * 
 * Rules implemented (per PHB/DMG):
 * - Cone: Point of origin expands in a direction
 * - Line: Travels in a straight line from origin
 * - Sphere/Circle: Radiates from a point of origin
 * - Cube: Area with a point of origin at one face center
 */

import { AreaOfEffect, AffectedCell, GridConfig } from './types';
import { cellKey } from './movementCalculator';

/**
 * Calculate cells affected by a cone
 * Cone spreads from origin point in a direction, with width equal to distance from origin
 */
export const calculateConeAffectedCells = (
  aoe: AreaOfEffect,
  config: GridConfig
): AffectedCell[] => {
  const affected: AffectedCell[] = [];
  const cellsInRadius = Math.ceil(aoe.sizeFeet / config.feetPerCell);
  const direction = (aoe.direction ?? 0) * (Math.PI / 180);
  
  // Check all cells within the maximum reach
  for (let dx = -cellsInRadius; dx <= cellsInRadius; dx++) {
    for (let dy = -cellsInRadius; dy <= cellsInRadius; dy++) {
      if (dx === 0 && dy === 0) continue; // Skip origin
      
      const cellX = aoe.originX + dx;
      const cellY = aoe.originY + dy;
      
      // Calculate angle from origin to this cell
      const angleToCell = Math.atan2(dy, dx);
      
      // Calculate distance in feet
      const distanceCells = Math.sqrt(dx * dx + dy * dy);
      const distanceFeet = distanceCells * config.feetPerCell;
      
      if (distanceFeet > aoe.sizeFeet) continue;
      
      // Cone width at this distance is equal to the distance (90-degree cone total)
      // Angular width = arctan(1) = 45 degrees on each side
      const maxAngleDiff = Math.PI / 4; // 45 degrees
      
      // Normalize angle difference
      let angleDiff = angleToCell - direction;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      if (Math.abs(angleDiff) <= maxAngleDiff) {
        affected.push({
          x: cellX,
          y: cellY,
          distanceFeet: Math.round(distanceFeet),
        });
      }
    }
  }
  
  return affected;
};

/**
 * Calculate cells affected by a line
 * Line extends from origin in a direction with 5ft width
 */
export const calculateLineAffectedCells = (
  aoe: AreaOfEffect,
  config: GridConfig
): AffectedCell[] => {
  const affected: AffectedCell[] = [];
  const cellsInLength = Math.ceil(aoe.sizeFeet / config.feetPerCell);
  const direction = (aoe.direction ?? 0) * (Math.PI / 180);
  const lineWidth = 5; // Standard 5ft width
  const halfWidthCells = lineWidth / (2 * config.feetPerCell);
  
  // Direction vector
  const dirX = Math.cos(direction);
  const dirY = Math.sin(direction);
  
  // Perpendicular vector for width
  const perpX = -dirY;
  const perpY = dirX;
  
  // Check cells along the line
  for (let d = 1; d <= cellsInLength; d++) {
    const centerX = aoe.originX + dirX * d;
    const centerY = aoe.originY + dirY * d;
    
    // Check cells across the width
    for (let w = -halfWidthCells; w <= halfWidthCells; w += 0.5) {
      const cellX = Math.round(centerX + perpX * w);
      const cellY = Math.round(centerY + perpY * w);
      
      // Avoid duplicates
      const key = cellKey(cellX, cellY);
      if (!affected.find(c => cellKey(c.x, c.y) === key)) {
        const distanceFeet = d * config.feetPerCell;
        affected.push({
          x: cellX,
          y: cellY,
          distanceFeet,
        });
      }
    }
  }
  
  return affected;
};

/**
 * Calculate cells affected by a sphere (or circle in 2D)
 * Sphere radiates from a point of origin
 */
export const calculateSphereAffectedCells = (
  aoe: AreaOfEffect,
  config: GridConfig
): AffectedCell[] => {
  const affected: AffectedCell[] = [];
  const radiusCells = aoe.sizeFeet / config.feetPerCell;
  const maxCells = Math.ceil(radiusCells);
  
  for (let dx = -maxCells; dx <= maxCells; dx++) {
    for (let dy = -maxCells; dy <= maxCells; dy++) {
      const cellX = aoe.originX + dx;
      const cellY = aoe.originY + dy;
      
      // Calculate distance from center of origin cell to center of target cell
      const distanceCells = Math.sqrt(dx * dx + dy * dy);
      const distanceFeet = distanceCells * config.feetPerCell;
      
      // Include if any part of the cell is within radius
      // A cell is affected if its center is within radius + half a cell
      if (distanceFeet <= aoe.sizeFeet) {
        affected.push({
          x: cellX,
          y: cellY,
          distanceFeet: Math.round(distanceFeet),
        });
      }
    }
  }
  
  return affected;
};

/**
 * Calculate cells affected by a cube
 * Cube has a point of origin at the center of one face
 */
export const calculateCubeAffectedCells = (
  aoe: AreaOfEffect,
  config: GridConfig
): AffectedCell[] => {
  const affected: AffectedCell[] = [];
  const sideCells = Math.ceil(aoe.sizeFeet / config.feetPerCell);
  const direction = (aoe.direction ?? 0) * (Math.PI / 180);
  
  // Direction vector
  const dirX = Math.cos(direction);
  const dirY = Math.sin(direction);
  
  // Perpendicular vector
  const perpX = -dirY;
  const perpY = dirX;
  
  const halfSide = sideCells / 2;
  
  // The origin is at the center of one face, so the cube extends
  // sideCells in the direction, and halfSide on each side perpendicular
  for (let d = 0; d < sideCells; d++) {
    for (let w = -Math.floor(halfSide); w <= Math.floor(halfSide); w++) {
      const cellX = Math.round(aoe.originX + dirX * d + perpX * w);
      const cellY = Math.round(aoe.originY + dirY * d + perpY * w);
      
      const distanceFeet = d * config.feetPerCell;
      
      // Avoid duplicates
      const key = cellKey(cellX, cellY);
      if (!affected.find(c => cellKey(c.x, c.y) === key)) {
        affected.push({
          x: cellX,
          y: cellY,
          distanceFeet,
        });
      }
    }
  }
  
  return affected;
};

/**
 * Calculate all cells affected by an area of effect
 */
export const calculateAffectedCells = (
  aoe: AreaOfEffect,
  config: GridConfig
): AffectedCell[] => {
  switch (aoe.shape) {
    case 'cone':
      return calculateConeAffectedCells(aoe, config);
    case 'line':
      return calculateLineAffectedCells(aoe, config);
    case 'sphere':
      return calculateSphereAffectedCells(aoe, config);
    case 'cube':
      return calculateCubeAffectedCells(aoe, config);
    default:
      return [];
  }
};
