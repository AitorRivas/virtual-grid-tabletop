import { useRef, useEffect, useMemo } from 'react';
import type { TokenData } from './MapViewer';

interface DynamicLightingProps {
  width: number;
  height: number;
  tokens: TokenData[];
  /** Opacity of the darkness overlay (0-1). Default 0.7 */
  darkness?: number;
}

/**
 * Renders a darkness overlay with radial light cutouts for each token
 * that has lightEnabled=true. Uses canvas compositing for performance.
 */
export const DynamicLighting = ({
  width,
  height,
  tokens,
  darkness = 0.7,
}: DynamicLightingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flickerRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const litTokens = useMemo(
    () => tokens.filter(t => t.lightEnabled && t.status === 'active'),
    [tokens],
  );

  useEffect(() => {
    if (litTokens.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const hasFlicker = litTokens.some(t => t.lightFlicker);

    const draw = () => {
      flickerRef.current += 0.05;

      ctx.clearRect(0, 0, width, height);

      // Dark overlay
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
      ctx.fillRect(0, 0, width, height);

      // Cut out light circles
      ctx.globalCompositeOperation = 'destination-out';

      for (const token of litTokens) {
        const px = (token.x / 100) * width;
        const py = (token.y / 100) * height;
        const baseRadius = token.lightRadius ?? 150;
        const softness = token.lightSoftness ?? 0.6;

        // Flicker variation
        let radius = baseRadius;
        if (token.lightFlicker) {
          const f = flickerRef.current;
          const variation = Math.sin(f * 3.7) * 0.03 + Math.sin(f * 7.1) * 0.02 + Math.sin(f * 11.3) * 0.01;
          radius = baseRadius * (1 + variation);
        }

        const innerRadius = radius * softness;
        const gradient = ctx.createRadialGradient(px, py, innerRadius, px, py, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      if (hasFlicker && running) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [width, height, litTokens, darkness]);

  // Re-draw without flicker when tokens move but no flicker
  useEffect(() => {
    if (litTokens.length === 0) return;
    if (litTokens.some(t => t.lightFlicker)) return; // handled by rAF loop

    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'destination-out';

    for (const token of litTokens) {
      const px = (token.x / 100) * width;
      const py = (token.y / 100) * height;
      const radius = token.lightRadius ?? 150;
      const softness = token.lightSoftness ?? 0.6;
      const innerRadius = radius * softness;
      const gradient = ctx.createRadialGradient(px, py, innerRadius, px, py, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [litTokens, width, height, darkness]);

  if (litTokens.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: 25 }}
    />
  );
};
