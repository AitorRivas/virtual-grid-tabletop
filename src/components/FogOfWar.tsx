import { useRef, useEffect, useCallback } from 'react';

interface FogOfWarProps {
  width: number;
  height: number;
  enabled: boolean;       // true = GM can draw/erase
  brushSize: number;
  fogData: string | null; // persisted dataURL from MapData.fogData
  onFogChange: (data: string) => void;
}

/**
 * Canvas-based Fog of War layer.
 *
 * IMPORTANT: Mount this component with `key={activeMapId}` so it fully
 * remounts when the map changes. This guarantees a clean canvas per map
 * and avoids stale-ref bugs from the old implementation.
 *
 * Lifecycle:
 *  1. On mount → if `fogData` exists, restore it; otherwise fill black.
 *  2. While mounted → react to external `fogData` changes (e.g. from
 *     another window writing to the shared GameState).
 *  3. On user draw → save dataURL via `onFogChange`.
 */
export const FogOfWar = ({
  width,
  height,
  enabled,
  brushSize,
  fogData,
  onFogChange,
}: FogOfWarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // Track the fogData we last rendered so we can detect *external* changes
  const renderedDataRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  // ── Initialise / restore fog on mount ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';

    if (fogData) {
      // Restore saved fog
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        renderedDataRef.current = fogData;
        mountedRef.current = true;
      };
      img.src = fogData;
    } else {
      // No saved data → full black fog
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      mountedRef.current = true;

      // Persist the initial black fog
      const dataUrl = canvas.toDataURL('image/png', 0.8);
      renderedDataRef.current = dataUrl;
      onFogChange(dataUrl);
    }
    // Only run on mount (component is keyed by activeMapId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // ── React to *external* fogData changes (cross-window sync) ────
  useEffect(() => {
    if (!mountedRef.current) return; // skip during init
    if (fogData === renderedDataRef.current) return; // nothing new

    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (fogData) {
      const img = new Image();
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        renderedDataRef.current = fogData;
      };
      img.src = fogData;
    } else {
      // Reset: fill black
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      renderedDataRef.current = null;
    }
  }, [fogData, width, height]);

  // ── Brush cursor ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    canvas.style.cursor = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${brushSize / 2 - 1}" fill="none" stroke="white" stroke-width="2"/></svg>') ${brushSize / 2} ${brushSize / 2}, crosshair`;
  }, [brushSize, enabled]);

  // ── Drawing helpers ────────────────────────────────────────────
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const eraseAt = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushSize],
  );

  const saveFogState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && isDrawingRef.current) {
      const dataUrl = canvas.toDataURL('image/png', 0.8);
      renderedDataRef.current = dataUrl;
      onFogChange(dataUrl);
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, [onFogChange]);

  // ── Mouse handlers ─────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      const coords = getCanvasCoordinates(e);
      if (!coords) return;
      isDrawingRef.current = true;
      lastPointRef.current = coords;
      eraseAt(coords.x, coords.y);
    },
    [enabled, getCanvasCoordinates, eraseAt],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled || !isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const coords = getCanvasCoordinates(e);
      if (!coords) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

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
    },
    [enabled, brushSize, getCanvasCoordinates],
  );

  const handleMouseUp = useCallback(() => saveFogState(), [saveFogState]);
  const handleMouseLeave = useCallback(() => saveFogState(), [saveFogState]);

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
