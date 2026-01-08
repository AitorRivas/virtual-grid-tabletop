/**
 * Cover Calculator - D&D 5e cover rules
 * 
 * Cover types per PHB:
 * - Half Cover: +2 to AC and Dexterity saving throws
 * - Three-Quarters Cover: +5 to AC and Dexterity saving throws
 * - Total Cover: Can't be targeted directly
 * 
 * Cover is determined by drawing lines from corners of the attacker's space
 * to corners of the target's space.
 */

import { GridConfig, CellState } from './types';
import { cellKey } from './movementCalculator';

export type CoverLevel = 'none' | 'half' | 'three-quarters' | 'total';

export interface CoverResult {
  /** Level of cover */
  level: CoverLevel;
  /** AC bonus from cover */
  acBonus: number;
  /** Dex save bonus from cover */
  dexSaveBonus: number;
  /** Number of corner-to-corner lines blocked */
  blockedLines: number;
  /** Total corner-to-corner lines checked */
  totalLines: number;
  /** Can the target be directly targeted? */
  canBeTargeted: boolean;
}

const COVER_BONUSES: Record<CoverLevel, { ac: number; dex: number }> = {
  none: { ac: 0, dex: 0 },
  half: { ac: 2, dex: 2 },
  'three-quarters': { ac: 5, dex: 5 },
  total: { ac: Infinity, dex: Infinity },
};

/**
 * Get the four corners of a cell in fractional cell coordinates
 */
const getCellCorners = (
  cellX: number,
  cellY: number
): Array<{ x: number; y: number }> => {
  return [
    { x: cellX, y: cellY },           // top-left
    { x: cellX + 1, y: cellY },       // top-right
    { x: cellX, y: cellY + 1 },       // bottom-left
    { x: cellX + 1, y: cellY + 1 },   // bottom-right
  ];
};

/**
 * Check if a line between two points is blocked by any obstacles
 * Uses ray casting through cells
 */
const isLineBlocked = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  cellStates: Record<string, CellState>
): boolean => {
  // Sample points along the line
  const steps = 20; // Resolution of ray cast
  const dx = (toX - fromX) / steps;
  const dy = (toY - fromY) / steps;
  
  for (let i = 1; i < steps; i++) {
    const x = fromX + dx * i;
    const y = fromY + dy * i;
    
    // Get the cell this point is in
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    
    const state = cellStates[cellKey(cellX, cellY)] || 'free';
    if (state === 'blocked') {
      return true;
    }
  }
  
  return false;
};

/**
 * Calculate cover between an attacker and target
 * 
 * Per D&D 5e rules:
 * - Draw lines from each corner of attacker's space to each corner of target's space
 * - If 1-2 lines are blocked: no cover
 * - If 3-8 lines are blocked: half cover
 * - If 9-12 lines are blocked: three-quarters cover
 * - If all 16 lines are blocked: total cover
 * 
 * Note: This is a simplified implementation. Actual cover determination
 * can be more nuanced based on DM discretion.
 */
export const calculateCover = (
  attackerX: number,
  attackerY: number,
  targetX: number,
  targetY: number,
  cellStates: Record<string, CellState>,
  config: GridConfig
): CoverResult => {
  // If same cell, no cover
  if (attackerX === targetX && attackerY === targetY) {
    return {
      level: 'none',
      acBonus: 0,
      dexSaveBonus: 0,
      blockedLines: 0,
      totalLines: 0,
      canBeTargeted: true,
    };
  }
  
  const attackerCorners = getCellCorners(attackerX, attackerY);
  const targetCorners = getCellCorners(targetX, targetY);
  
  let blockedLines = 0;
  const totalLines = attackerCorners.length * targetCorners.length; // 16 lines
  
  for (const aCorner of attackerCorners) {
    for (const tCorner of targetCorners) {
      if (isLineBlocked(aCorner.x, aCorner.y, tCorner.x, tCorner.y, cellStates)) {
        blockedLines++;
      }
    }
  }
  
  // Determine cover level based on blocked lines
  let level: CoverLevel;
  if (blockedLines === totalLines) {
    level = 'total';
  } else if (blockedLines >= totalLines * 0.75) {
    level = 'three-quarters';
  } else if (blockedLines >= totalLines * 0.5) {
    level = 'half';
  } else {
    level = 'none';
  }
  
  const bonuses = COVER_BONUSES[level];
  
  return {
    level,
    acBonus: bonuses.ac,
    dexSaveBonus: bonuses.dex,
    blockedLines,
    totalLines,
    canBeTargeted: level !== 'total',
  };
};

/**
 * Get cover level as a simple string (for display purposes)
 */
export const getCoverDescription = (level: CoverLevel): string => {
  switch (level) {
    case 'none':
      return 'No Cover';
    case 'half':
      return 'Half Cover (+2 AC/DEX)';
    case 'three-quarters':
      return 'Three-Quarters Cover (+5 AC/DEX)';
    case 'total':
      return 'Total Cover (Cannot Target)';
  }
};
