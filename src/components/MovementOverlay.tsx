import { useMemo } from 'react';
import { GridConfig, CellState, GridTokenData } from '@/lib/gridEngine/types';
import { calculateReachableCells, cellToPixel } from '@/lib/gridEngine';

interface MovementOverlayProps {
  gridConfig: GridConfig;
  cellStates: Record<string, CellState>;
  tokenCellX: number;
  tokenCellY: number;
  tokenSizeInCells: number;
  movementRemaining: number;
  visible: boolean;
  onCellClick?: (cellX: number, cellY: number, costFeet: number) => void;
}

export const MovementOverlay = ({
  gridConfig,
  cellStates,
  tokenCellX,
  tokenCellY,
  tokenSizeInCells,
  movementRemaining,
  visible,
  onCellClick,
}: MovementOverlayProps) => {
  const reachableCells = useMemo(() => {
    if (!visible || movementRemaining <= 0) return [];
    
    const token: GridTokenData = {
      id: 'temp',
      cellX: tokenCellX,
      cellY: tokenCellY,
      sizeInCells: tokenSizeInCells,
      speedFeet: movementRemaining,
      movementRemaining,
    };
    
    return calculateReachableCells(token, cellStates, gridConfig);
  }, [gridConfig, cellStates, tokenCellX, tokenCellY, tokenSizeInCells, movementRemaining, visible]);

  if (!visible || reachableCells.length === 0) return null;

  const { cellSize } = gridConfig;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {reachableCells.map((cell) => {
        const { pixelX, pixelY } = cellToPixel(cell.x, cell.y, gridConfig);
        const intensity = 1 - (cell.costFeet / movementRemaining) * 0.5;
        
        // Adjust to top-left corner instead of center
        const left = pixelX - cellSize / 2;
        const top = pixelY - cellSize / 2;
        
        return (
          <div
            key={`${cell.x},${cell.y}`}
            className="absolute transition-all duration-150 pointer-events-auto cursor-pointer hover:ring-2 hover:ring-primary"
            style={{
              left,
              top,
              width: cellSize,
              height: cellSize,
              backgroundColor: `hsla(142, 76%, 36%, ${0.2 + intensity * 0.3})`,
              border: '1px solid hsla(142, 76%, 36%, 0.5)',
            }}
            onClick={() => onCellClick?.(cell.x, cell.y, cell.costFeet)}
            title={`Coste: ${cell.costFeet} pies`}
          />
        );
      })}
    </div>
  );
};
