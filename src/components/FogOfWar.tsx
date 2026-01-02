import { useRef, useEffect, useCallback } from 'react';

interface FogOfWarProps {
  width: number;
  height: number;
  enabled: boolean;
  brushSize: number;
  fogData: string | null;
  onFogChange: (data: string) => void;
}

export const FogOfWar = ({ 
  width, 
  height, 
  enabled, 
  brushSize, 
  fogData, 
  onFogChange 
}: FogOfWarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize or restore fog
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Reset composite operation to default
    ctx.globalCompositeOperation = 'source-over';

    if (fogData && isInitializedRef.current) {
      // Already initialized, skip
      return;
    }

    if (fogData) {
      // Restore from saved data
      const img = new Image();
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        isInitializedRef.current = true;
      };
      img.src = fogData;
    } else {
      // Fill with black fog
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      isInitializedRef.current = true;
      // Save initial state
      onFogChange(canvas.toDataURL('image/png', 0.8));
    }
  }, [width, height]);

  // Reset when fogData becomes null (reset button)
  useEffect(() => {
    if (fogData === null && isInitializedRef.current) {
      const canvas = canvasRef.current;
      if (!canvas || width === 0 || height === 0) return;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      onFogChange(canvas.toDataURL('image/png', 0.8));
    }
  }, [fogData, width, height, onFogChange]);

  // Handle brush size changes by updating cursor style
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.cursor = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2 - 1}" fill="none" stroke="white" stroke-width="2"/></svg>') ${brushSize/2} ${brushSize/2}, crosshair`;
  }, [brushSize, enabled]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const eraseAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    isDrawingRef.current = true;
    lastPointRef.current = coords;
    eraseAt(coords.x, coords.y);
  }, [enabled, getCanvasCoordinates, eraseAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled || !isDrawingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw line from last point to current point
    if (lastPointRef.current) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    
    lastPointRef.current = coords;
  }, [enabled, brushSize, getCanvasCoordinates]);

  const saveFogState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && isDrawingRef.current) {
      onFogChange(canvas.toDataURL('image/png', 0.8));
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, [onFogChange]);

  const handleMouseUp = useCallback(() => {
    saveFogState();
  }, [saveFogState]);

  const handleMouseLeave = useCallback(() => {
    saveFogState();
  }, [saveFogState]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-auto"
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: enabled ? 'auto' : 'none',
        cursor: enabled ? 'crosshair' : 'inherit',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};
