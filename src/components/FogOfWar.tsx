import { useRef, useEffect, useState, useCallback } from 'react';

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
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize or restore fog
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (fogData) {
      // Restore from saved data
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = fogData;
    } else {
      // Fill with black fog
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      // Save initial state
      onFogChange(canvas.toDataURL());
    }
  }, [width, height]);

  // Handle brush size changes by updating cursor style
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.cursor = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2 - 1}" fill="none" stroke="white" stroke-width="2"/></svg>') ${brushSize/2} ${brushSize/2}, crosshair`;
  }, [brushSize, enabled]);

  const eraseAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize]);

  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [brushSize]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    setIsDrawing(true);
    lastPointRef.current = coords;
    eraseAt(coords.x, coords.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled || !isDrawing) return;
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    if (lastPointRef.current) {
      drawLine(lastPointRef.current, coords);
    }
    lastPointRef.current = coords;
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;
      // Save fog state
      const canvas = canvasRef.current;
      if (canvas) {
        onFogChange(canvas.toDataURL());
      }
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        onFogChange(canvas.toDataURL());
      }
    }
  };

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
