import { useEffect, useRef, useState } from 'react';
import type { SceneOverlay } from '@/stores/gameState';

interface OverlayLayerProps {
  overlays: SceneOverlay[];
  mapWidth: number;
  mapHeight: number;
  /** When true, overlays are draggable/resizable. */
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onUpdate?: (id: string, patch: Partial<SceneOverlay>) => void;
}

/**
 * Renders transparent image overlays on top of the map. In editable mode (DM)
 * users can drag to move and use the corner handle to scale.
 */
export const OverlayLayer = ({
  overlays, mapWidth, mapHeight, editable = false,
  selectedId = null, onSelect, onUpdate,
}: OverlayLayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    id: string;
    mode: 'move' | 'scale';
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startScale: number;
  } | null>(null);

  const [, force] = useState(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dxPct = ((e.clientX - d.startClientX) / rect.width) * 100;
      const dyPct = ((e.clientY - d.startClientY) / rect.height) * 100;
      if (d.mode === 'move') {
        onUpdate?.(d.id, {
          x: Math.max(0, Math.min(100, d.startX + dxPct)),
          y: Math.max(0, Math.min(100, d.startY + dyPct)),
        });
      } else {
        const next = Math.max(2, Math.min(200, d.startScale + dxPct));
        onUpdate?.(d.id, { scale: next });
      }
    };
    const onUp = () => { dragRef.current = null; force((n) => n + 1); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onUpdate]);

  if (!overlays?.length || mapWidth === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      {overlays.filter((o) => o.visible).map((o) => {
        const widthPx = (o.scale / 100) * mapWidth;
        const isSelected = editable && selectedId === o.id;
        return (
          <div
            key={o.id}
            className={`absolute ${editable ? 'pointer-events-auto cursor-move' : ''} ${isSelected ? 'outline outline-2 outline-primary outline-offset-2' : ''}`}
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: widthPx,
              transform: `translate(-50%, -50%) rotate(${o.rotation ?? 0}deg)`,
              opacity: o.opacity ?? 1,
              zIndex: 25,
            }}
            onMouseDown={(e) => {
              if (!editable) return;
              if ((e.target as HTMLElement).dataset.handle) return;
              e.stopPropagation();
              onSelect?.(o.id);
              dragRef.current = {
                id: o.id, mode: 'move',
                startClientX: e.clientX, startClientY: e.clientY,
                startX: o.x, startY: o.y, startScale: o.scale,
              };
            }}
          >
            <img
              src={o.imageUrl}
              alt={o.name}
              draggable={false}
              className="block w-full h-auto select-none pointer-events-none"
            />
            {isSelected && (
              <div
                data-handle="scale"
                className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary border border-background rounded-sm cursor-nwse-resize pointer-events-auto"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  dragRef.current = {
                    id: o.id, mode: 'scale',
                    startClientX: e.clientX, startClientY: e.clientY,
                    startX: o.x, startY: o.y, startScale: o.scale,
                  };
                }}
                title="Arrastra para escalar"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
