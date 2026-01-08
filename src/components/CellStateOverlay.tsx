import { CellState, GridConfig } from '@/lib/gridEngine/types';
import { cellToPixel } from '@/lib/gridEngine';

interface CellStateOverlayProps {
  gridConfig: GridConfig;
  cellStates: Record<string, CellState>;
  editMode: boolean;
  brushState: CellState;
  onCellClick?: (cellX: number, cellY: number) => void;
}

export const CellStateOverlay = ({
  gridConfig,
  cellStates,
  editMode,
  brushState,
  onCellClick,
}: CellStateOverlayProps) => {
  const { cellSize, mapWidth, mapHeight } = gridConfig;
  
  // Calculate grid dimensions
  const cols = Math.ceil(mapWidth / cellSize);
  const rows = Math.ceil(mapHeight / cellSize);

  const getCellColor = (state: CellState): string => {
    switch (state) {
      case 'blocked':
        return 'hsla(0, 84%, 60%, 0.4)';
      case 'difficult':
        return 'hsla(45, 93%, 47%, 0.4)';
      default:
        return 'transparent';
    }
  };

  const getCellBorder = (state: CellState): string => {
    switch (state) {
      case 'blocked':
        return '2px solid hsla(0, 84%, 60%, 0.7)';
      case 'difficult':
        return '2px dashed hsla(45, 93%, 47%, 0.7)';
      default:
        return 'none';
    }
  };

  // Only render cells with non-free states when not in edit mode
  const cellsToRender = editMode
    ? Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({ x: col, y: row }))
      ).flat()
    : Object.entries(cellStates)
        .filter(([, state]) => state !== 'free')
        .map(([key]) => {
          const [x, y] = key.split(',').map(Number);
          return { x, y };
        });

  return (
    <div className="absolute inset-0" style={{ zIndex: editMode ? 10 : 4, pointerEvents: editMode ? 'auto' : 'none' }}>
      {cellsToRender.map(({ x, y }) => {
        const key = `${x},${y}`;
        const state = cellStates[key] || 'free';
        const { pixelX, pixelY } = cellToPixel(x, y, gridConfig);
        
        // Adjust to top-left corner instead of center
        const left = pixelX - cellSize / 2;
        const top = pixelY - cellSize / 2;
        
        if (!editMode && state === 'free') return null;

        return (
          <div
            key={key}
            className={`absolute transition-colors ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}`}
            style={{
              left,
              top,
              width: cellSize,
              height: cellSize,
              backgroundColor: getCellColor(state),
              border: getCellBorder(state),
            }}
            onClick={() => editMode && onCellClick?.(x, y)}
            title={editMode ? `Clic para ${brushState === 'free' ? 'liberar' : brushState === 'blocked' ? 'bloquear' : 'terreno difícil'}` : undefined}
          />
        );
      })}
    </div>
  );
};
