import { useRef, useEffect, useCallback, useState } from 'react';

interface NarrativeLightProps {
  width: number;
  height: number;
  x: number;
  y: number;
  radius: number;
  editable?: boolean;
  onMove?: (x: number, y: number) => void;
}

export const NarrativeLight = ({
  width,
  height,
  x,
  y,
  radius,
  editable = false,
  onMove,
}: NarrativeLightProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const [localPos, setLocalPos] = useState({ x, y });

  // Sync external position
  useEffect(() => {
    setLocalPos({ x, y });
  }, [x, y]);

  // Draw the lantern mask
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // Cut out the visible circle with soft edge
    ctx.globalCompositeOperation = 'destination-out';
    const gradient = ctx.createRadialGradient(
      localPos.x, localPos.y, radius * 0.6,
      localPos.x, localPos.y, radius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(localPos.x, localPos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, [width, height, localPos.x, localPos.y, radius]);

  const getMapCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [width, height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    const coords = getMapCoords(e);
    if (coords) {
      setLocalPos(coords);
    }
  }, [editable, getMapCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !editable) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getMapCoords(e);
    if (coords) {
      setLocalPos(coords);
    }
  }, [editable, getMapCoords]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    onMove?.(localPos.x, localPos.y);
  }, [localPos, onMove]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-auto"
      style={{
        width: '100%',
        height: '100%',
        cursor: editable ? 'move' : 'default',
        pointerEvents: editable ? 'auto' : 'none',
        zIndex: 40,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
