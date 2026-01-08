import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Target, Check, X, RotateCcw } from 'lucide-react';

interface GridCalibratorProps {
  isActive: boolean;
  onCalibrationComplete: (cellSize: number, offsetX: number, offsetY: number) => void;
  onCancel: () => void;
  mapContainerRef: React.RefObject<HTMLDivElement>;
}

export const GridCalibrator = ({
  isActive,
  onCalibrationComplete,
  onCancel,
  mapContainerRef,
}: GridCalibratorProps) => {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [manualSize, setManualSize] = useState<string>('');
  const [mode, setMode] = useState<'points' | 'manual'>('points');

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
    }
  }, [isActive]);

  const handleMapClick = (e: MouseEvent) => {
    if (!isActive || !mapContainerRef.current || mode !== 'points') return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const img = mapContainerRef.current.querySelector('img');
    if (!img) return;
    
    // Get click position relative to the image
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (points.length < 2) {
      setPoints([...points, { x, y }]);
    }
    
    if (points.length === 1) {
      // Calculate distance between two points
      const dx = Math.abs(x - points[0].x);
      const dy = Math.abs(y - points[0].y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Use the larger dimension as cell size (assuming user clicks corners)
      const cellSize = Math.round(Math.max(dx, dy));
      
      if (cellSize > 5) {
        onCalibrationComplete(cellSize, 0, 0);
        setPoints([]);
      }
    }
  };

  useEffect(() => {
    if (isActive && mode === 'points') {
      const container = mapContainerRef.current;
      if (container) {
        container.addEventListener('click', handleMapClick);
        return () => container.removeEventListener('click', handleMapClick);
      }
    }
  }, [isActive, mode, points]);

  const handleManualSubmit = () => {
    const size = parseInt(manualSize);
    if (size > 5 && size < 1000) {
      onCalibrationComplete(size, 0, 0);
      setManualSize('');
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[300px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Calibrar Cuadrícula</h3>
          </div>
          <Button size="icon" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'points' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('points')}
            className="flex-1"
          >
            Por puntos
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('manual')}
            className="flex-1"
          >
            Manual
          </Button>
        </div>

        {mode === 'points' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Haz clic en dos esquinas opuestas de una celda del mapa para calibrar el tamaño.
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${points.length >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <span className="text-sm">Punto 1 {points.length >= 1 && '✓'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${points.length >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <span className="text-sm">Punto 2</span>
            </div>
            {points.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPoints([])}
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Tamaño de celda (píxeles)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={manualSize}
                  onChange={(e) => setManualSize(e.target.value)}
                  placeholder="Ej: 50"
                  min={5}
                  max={1000}
                />
                <Button onClick={handleManualSubmit} disabled={!manualSize}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              1 celda = 5 pies (estándar D&D 5e)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
