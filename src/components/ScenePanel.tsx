import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Upload, Image as ImageIcon, Layers, Eye, EyeOff, Move } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { toast } from 'sonner';

/**
 * Panel for managing variants and overlays of the active map.
 * - Variants: swap the visible image without moving tokens/fog/grid.
 * - Overlays: transparent images layered above the map (collapsed bridge, fire, runes, etc).
 */
export const ScenePanel = () => {
  const {
    activeMap,
    activeMapId,
    addMapVariant, updateMapVariant, removeMapVariant, setActiveMapVariant,
    addOverlay, updateOverlay, removeOverlay,
  } = useGameState();

  const variantFileRef = useRef<HTMLInputElement>(null);
  const overlayFileRef = useRef<HTMLInputElement>(null);
  const [newVariantName, setNewVariantName] = useState('');
  const [newOverlayName, setNewOverlayName] = useState('');

  if (!activeMap || !activeMapId) {
    return <p className="p-3 text-xs text-muted-foreground italic">Selecciona un mapa primero.</p>;
  }

  const variants = activeMap.variants ?? [];
  const overlays = activeMap.overlays ?? [];

  const readFile = (file: File, onLoad: (data: string) => void, maxMB = 8) => {
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Imagen demasiado grande (máx ${maxMB} MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleAddVariant = (file?: File) => {
    const name = newVariantName.trim() || `Variante ${variants.length + 1}`;
    if (file) {
      readFile(file, (data) => {
        const id = addMapVariant(activeMapId, { name, image: data });
        setActiveMapVariant(activeMapId, id);
        setNewVariantName('');
        toast.success(`Variante "${name}" creada`);
      });
    } else {
      // create empty variant (placeholder for current map image)
      const id = addMapVariant(activeMapId, { name, image: activeMap.mapImage });
      setActiveMapVariant(activeMapId, id);
      setNewVariantName('');
      toast.success(`Variante "${name}" creada con la imagen actual`);
    }
  };

  const handleAddOverlay = (file: File) => {
    const name = newOverlayName.trim() || `Overlay ${overlays.length + 1}`;
    readFile(file, (data) => {
      addOverlay(activeMapId, {
        name, imageUrl: data, visible: true,
        x: 50, y: 50, scale: 30, opacity: 1, rotation: 0,
      });
      setNewOverlayName('');
      toast.success(`Overlay "${name}" añadido`);
    });
  };

  return (
    <div className="p-3 space-y-4">
      {/* Variants */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Variantes del mapa</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
          Cambia entre versiones visuales del mismo escenario sin mover tokens, HP, niebla ni iniciativa.
        </p>

        <div className="space-y-1.5 mb-2">
          {/* Original */}
          <button
            onClick={() => setActiveMapVariant(activeMapId, null)}
            className={`w-full text-left flex items-center gap-2 p-1.5 rounded text-xs border ${
              !activeMap.activeVariantId ? 'bg-primary/15 border-primary/50' : 'bg-secondary/40 border-transparent hover:bg-secondary'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="flex-1 truncate">Original</span>
          </button>
          {variants.map((v) => (
            <div
              key={v.id}
              className={`flex items-center gap-1 p-1.5 rounded text-xs border ${
                activeMap.activeVariantId === v.id
                  ? 'bg-primary/15 border-primary/50'
                  : 'bg-secondary/40 border-transparent hover:bg-secondary'
              }`}
            >
              <button
                onClick={() => setActiveMapVariant(activeMapId, v.id)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                {v.image ? (
                  <img src={v.image} alt="" className="w-6 h-6 object-cover rounded" />
                ) : (
                  <div className="w-6 h-6 rounded bg-muted" />
                )}
                <Input
                  value={v.name}
                  onChange={(e) => updateMapVariant(activeMapId, v.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 text-xs px-1.5 flex-1 min-w-0"
                />
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => removeMapVariant(activeMapId, v.id)}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Nombre nueva variante"
            value={newVariantName}
            onChange={(e) => setNewVariantName(e.target.value)}
            className="h-7 text-xs"
          />
          <input
            ref={variantFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAddVariant(f);
              e.target.value = '';
            }}
          />
          <Button size="sm" variant="outline" className="h-7" onClick={() => variantFileRef.current?.click()}>
            <Upload className="w-3 h-3 mr-1" /> Imagen
          </Button>
          <Button size="sm" className="h-7" onClick={() => handleAddVariant()}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </section>

      {/* Overlays */}
      <section className="border-t border-border/50 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Move className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Overlays</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
          Imágenes transparentes sobre el mapa. Arrástralas en el mapa para moverlas, usa el tirador inferior derecho para escalar.
        </p>

        <ScrollArea className="max-h-64 mb-2">
          <div className="space-y-1.5 pr-2">
            {overlays.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic text-center py-2">
                Sin overlays. Sube uno desde abajo.
              </p>
            )}
            {overlays.map((o) => (
              <div key={o.id} className="flex items-center gap-1.5 p-1.5 rounded border border-border/40 bg-card">
                <Checkbox
                  checked={o.visible}
                  onCheckedChange={(v) => updateOverlay(activeMapId, o.id, { visible: !!v })}
                />
                <img src={o.imageUrl} alt="" className="w-7 h-7 object-contain rounded" />
                <Input
                  value={o.name}
                  onChange={(e) => updateOverlay(activeMapId, o.id, { name: e.target.value })}
                  className="h-6 text-xs px-1.5 flex-1 min-w-0"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => updateOverlay(activeMapId, o.id, { visible: !o.visible })}
                  title={o.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {o.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => removeOverlay(activeMapId, o.id)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Nombre overlay"
            value={newOverlayName}
            onChange={(e) => setNewOverlayName(e.target.value)}
            className="h-7 text-xs"
          />
          <input
            ref={overlayFileRef}
            type="file"
            accept="image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAddOverlay(f);
              e.target.value = '';
            }}
          />
          <Button size="sm" className="h-7" onClick={() => overlayFileRef.current?.click()}>
            <Upload className="w-3 h-3 mr-1" /> Añadir
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Recomendado: PNG/WebP/SVG transparente.
        </p>
      </section>
    </div>
  );
};
