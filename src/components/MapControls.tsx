import { Upload, Grid3x3, Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface MapControlsProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onUploadClick: () => void;
  hasMap: boolean;
}

export const MapControls = ({
  showGrid,
  onToggleGrid,
  gridSize,
  onGridSizeChange,
  onUploadClick,
  hasMap,
}: MapControlsProps) => {
  return (
    <div className="bg-toolbar-bg border-b border-border p-4">
      <div className="flex items-center gap-4 max-w-7xl mx-auto">
        <Button
          onClick={() => {
            console.log('Upload button clicked');
            onUploadClick();
          }}
          variant={hasMap ? "secondary" : "default"}
          size="sm"
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {hasMap ? 'Cambiar mapa' : 'Cargar mapa'}
        </Button>

        {hasMap && (
          <>
            <div className="h-6 w-px bg-border" />
            
            <Button
              onClick={onToggleGrid}
              variant={showGrid ? "default" : "secondary"}
              size="sm"
              className="gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Cuadrícula
            </Button>

            {showGrid && (
              <div className="flex items-center gap-3 ml-2">
                <Minus className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[gridSize]}
                  onValueChange={(values) => onGridSizeChange(values[0])}
                  min={20}
                  max={100}
                  step={5}
                  className="w-32"
                />
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground min-w-[3rem]">
                  {gridSize}px
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
