import { Upload, Grid3x3, Minus, Plus, ZoomIn } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';

interface MapControlsProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  gridColor: string;
  onGridColorChange: (color: string) => void;
  gridLineWidth: number;
  onGridLineWidthChange: (width: number) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onUploadClick: () => void;
  hasMap: boolean;
}

export const MapControls = ({
  showGrid,
  onToggleGrid,
  gridSize,
  onGridSizeChange,
  gridColor,
  onGridColorChange,
  gridLineWidth,
  onGridLineWidthChange,
  zoomLevel,
  onZoomChange,
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
              <>
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
                
                <div className="flex items-center gap-2 ml-2">
                  <Label htmlFor="grid-color" className="text-sm text-muted-foreground">
                    Color:
                  </Label>
                  <input
                    id="grid-color"
                    type="color"
                    value={gridColor}
                    onChange={(e) => onGridColorChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <Label htmlFor="grid-width" className="text-sm text-muted-foreground">
                    Grosor:
                  </Label>
                  <Slider
                    id="grid-width"
                    value={[gridLineWidth]}
                    onValueChange={(values) => onGridLineWidthChange(values[0])}
                    min={1}
                    max={5}
                    step={0.5}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground min-w-[2rem]">
                    {gridLineWidth}px
                  </span>
                </div>
              </>
            )}

            {hasMap && (
              <>
                <div className="h-6 w-px bg-border" />
                
                <div className="flex items-center gap-3">
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={(values) => onZoomChange(values[0])}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3rem]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
