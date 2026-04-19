import { useRef, useEffect, useCallback, useState } from 'react';

export type FogTool = 'brush' | 'rectangle' | 'polygon';
export type FogMode = 'reveal' | 'hide';

interface FogOfWarProps {
  width: number;
  height: number;
  enabled: boolean;
  brushSize: number;
  fogData: string | null;
  onFogChange: (data: string) => void;
  fogTool: FogTool;
  fogMode: FogMode;
  /** Visual opacity of the fog layer (1 = fully opaque for players, ~0.45 for DM). Default 1. */
  opacity?: number;
  /** Callback fired the first time the canvas has been painted (used by Player View to lift the black anti-flicker overlay). */
  onReady?: () => void;
}

export const FogOfWar = ({
  width,
  height,
  enabled,
  brushSize,
  fogData,
  onFogChange,
  fogTool,
  fogMode,
  opacity = 1,
  onReady,
}: FogOfWarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const renderedDataRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const readyFiredRef = useRef(false);

  // Rectangle state
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectEnd, setRectEnd] = useState<{ x: number; y: number } | null>(null);

  // Polygon state
  const [polyPoints, setPolyPoints] = useState<{ x: number; y: number }[]>([]);
  const [polyPreview, setPolyPreview] = useState<{ x: number; y: number } | null>(null);

  const fireReady = useCallback(() => {
    if (readyFiredRef.current || !onReady) return;
    readyFiredRef.current = true;
    onReady();
  }, [onReady]);

  // Reset ready flag whenever the canvas is remounted (size change ≈ map change)
  useEffect(() => {
    readyFiredRef.current = false;
  }, [width, height]);

  // ── Initialise / restore fog on mount ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';

    if (fogData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        renderedDataRef.current = fogData;
        mountedRef.current = true;
        fireReady();
      };
      img.src = fogData;
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      mountedRef.current = true;
      const dataUrl = canvas.toDataURL('image/png', 0.6);
      renderedDataRef.current = dataUrl;
      onFogChange(dataUrl);
      fireReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // ── React to *external* fogData changes (cross-window sync) ────
  useEffect(() => {
    if (!mountedRef.current) return;
    if (fogData === renderedDataRef.current) return;
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
        fireReady();
      };
      img.src = fogData;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, width, height);
      renderedDataRef.current = null;
      fireReady();
    }
  }, [fogData, width, height]);

  // ── Clear overlay when tool changes ────────────────────────────
  useEffect(() => {
    setRectStart(null);
    setRectEnd(null);
    setPolyPoints([]);
    setPolyPreview(null);
    clearOverlay();
  }, [fogTool, fogMode]);

  // ── Cursor ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || !enabled) return;
    if (fogTool === 'brush') {
      const s = brushSize;
      const color = fogMode === 'reveal' ? 'rgba(0,255,0,0.8)' : 'rgba(255,0,0,0.8)';
      canvas.style.cursor = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1}" fill="none" stroke="${encodeURIComponent(color)}" stroke-width="2"/></svg>') ${s / 2} ${s / 2}, crosshair`;
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }, [brushSize, enabled, fogTool, fogMode]);

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

  const saveFogState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.6);
    renderedDataRef.current = dataUrl;
    onFogChange(dataUrl);
  }, [onFogChange]);

  const getComposite = useCallback(() => {
    return fogMode === 'reveal' ? 'destination-out' : 'source-over';
  }, [fogMode]);

  const clearOverlay = useCallback(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, ov.width, ov.height);
  }, []);

  // ── BRUSH handlers ─────────────────────────────────────────────
  const brushDown = useCallback((coords: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    isDrawingRef.current = true;
    lastPointRef.current = coords;
    ctx.globalCompositeOperation = getComposite();
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize, getComposite]);

  const brushMove = useCallback((coords: { x: number; y: number }) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = getComposite();
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    lastPointRef.current = coords;
  }, [brushSize, getComposite]);

  const brushUp = useCallback(() => {
    if (isDrawingRef.current) {
      saveFogState();
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, [saveFogState]);

  // ── RECTANGLE handlers ────────────────────────────────────────
  const drawRectPreview = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ov.width, ov.height);
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    ctx.strokeStyle = fogMode === 'reveal' ? 'rgba(0,255,0,0.8)' : 'rgba(255,0,0,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = fogMode === 'reveal' ? 'rgba(0,255,0,0.15)' : 'rgba(255,0,0,0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.setLineDash([]);
  }, [fogMode]);

  const commitRect = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    if (w < 2 || h < 2) return;
    ctx.globalCompositeOperation = getComposite();
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(x, y, w, h);
    clearOverlay();
    saveFogState();
  }, [getComposite, saveFogState, clearOverlay]);

  // ── POLYGON handlers ──────────────────────────────────────────
  const drawPolyPreview = useCallback((points: { x: number; y: number }[], cursor: { x: number; y: number } | null) => {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ov.width, ov.height);
    if (points.length === 0) return;

    const color = fogMode === 'reveal' ? 'rgba(0,255,0,' : 'rgba(255,0,0,';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (cursor) ctx.lineTo(cursor.x, cursor.y);
    ctx.closePath();
    ctx.fillStyle = color + '0.15)';
    ctx.fill();
    ctx.strokeStyle = color + '0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vertices
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color + '1)';
      ctx.fill();
    }
  }, [fogMode]);

  const commitPoly = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < 3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = getComposite();
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    clearOverlay();
    saveFogState();
  }, [getComposite, saveFogState, clearOverlay]);

  // ── Unified mouse handlers ────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    if (fogTool === 'brush') {
      brushDown(coords);
    } else if (fogTool === 'rectangle') {
      setRectStart(coords);
      setRectEnd(coords);
    }
    // polygon uses click, not mousedown
  }, [enabled, fogTool, getCanvasCoordinates, brushDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    if (fogTool === 'brush') {
      brushMove(coords);
    } else if (fogTool === 'rectangle' && rectStart) {
      setRectEnd(coords);
      drawRectPreview(rectStart, coords);
    } else if (fogTool === 'polygon' && polyPoints.length > 0) {
      setPolyPreview(coords);
      drawPolyPreview(polyPoints, coords);
    }
  }, [enabled, fogTool, rectStart, polyPoints, getCanvasCoordinates, brushMove, drawRectPreview, drawPolyPreview]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;

    if (fogTool === 'brush') {
      brushUp();
    } else if (fogTool === 'rectangle' && rectStart && rectEnd) {
      const coords = getCanvasCoordinates(e);
      if (coords) {
        commitRect(rectStart, coords);
      }
      setRectStart(null);
      setRectEnd(null);
    }
  }, [enabled, fogTool, rectStart, rectEnd, brushUp, commitRect, getCanvasCoordinates]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled || fogTool !== 'polygon') return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    setPolyPoints(prev => [...prev, coords]);
  }, [enabled, fogTool, getCanvasCoordinates]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled || fogTool !== 'polygon') return;
    e.preventDefault();
    e.stopPropagation();
    if (polyPoints.length >= 3) {
      commitPoly(polyPoints);
    }
    setPolyPoints([]);
    setPolyPreview(null);
  }, [enabled, fogTool, polyPoints, commitPoly]);

  const handleMouseLeave = useCallback(() => {
    if (fogTool === 'brush') {
      brushUp();
    } else if (fogTool === 'rectangle' && rectStart) {
      setRectStart(null);
      setRectEnd(null);
      clearOverlay();
    }
  }, [fogTool, rectStart, brushUp, clearOverlay]);

  // Handle Escape to cancel polygon
  useEffect(() => {
    if (!enabled || fogTool !== 'polygon') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPolyPoints([]);
        setPolyPreview(null);
        clearOverlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enabled, fogTool, clearOverlay]);

  return (
    <div className="absolute inset-0" style={{ pointerEvents: enabled ? 'auto' : 'none' }}>
      {/* Main fog canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {/* Overlay for previews (rectangle/polygon) */}
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: enabled ? 'auto' : 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};
