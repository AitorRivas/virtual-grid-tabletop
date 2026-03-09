import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { SceneData, MapData } from '@/hooks/useGameState';
import { Plus, Trash2, Pencil, Check, X, Play, Image, Map, Music, Type, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SceneManagerProps {
  scenes: SceneData[];
  activeSceneId: string | null;
  maps: MapData[];
  onAddScene: (name: string) => string;
  onRemoveScene: (id: string) => void;
  onUpdateScene: (id: string, updates: Partial<SceneData>) => void;
  onActivateScene: (id: string) => void;
}

export const SceneManager = ({
  scenes,
  activeSceneId,
  maps,
  onAddScene,
  onRemoveScene,
  onUpdateScene,
  onActivateScene,
}: SceneManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const startRename = (scene: SceneData) => {
    setEditingId(scene.id);
    setEditName(scene.name);
  };

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      onUpdateScene(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleAdd = () => {
    const id = onAddScene(`Escena ${scenes.length + 1}`);
    setExpandedId(id);
    toast.success('Nueva escena creada');
  };

  const handleRemove = (id: string, name: string) => {
    onRemoveScene(id);
    if (expandedId === id) setExpandedId(null);
    toast.success(`"${name}" eliminada`);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTargetId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube una imagen válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande. Máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdateScene(uploadTargetId, { narrativeImage: e.target?.result as string });
      toast.success('Imagen narrativa añadida');
    };
    reader.readAsDataURL(file);

    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="p-2 space-y-1">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escenas</span>
        <Button variant="ghost" size="sm" onClick={handleAdd} className="h-6 w-6 p-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {scenes.map((scene) => (
        <div key={scene.id} className="space-y-0">
          {/* Scene row */}
          <div
            className={cn(
              'group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm',
              scene.id === activeSceneId
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'hover:bg-muted/50 text-muted-foreground'
            )}
            onClick={() => setExpandedId(expandedId === scene.id ? null : scene.id)}
          >
            <Play className={cn("w-3.5 h-3.5 shrink-0", scene.id === activeSceneId && "text-accent")} />

            {editingId === scene.id ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-6 text-xs px-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); confirmRename(); }}>
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <>
                <span className="truncate flex-1 min-w-0">{scene.name}</span>
                {/* Indicators */}
                <div className="flex items-center gap-1 shrink-0">
                  {scene.mapId && <Map className="w-3 h-3 text-muted-foreground/50" />}
                  {scene.narrativeImage && <Image className="w-3 h-3 text-muted-foreground/50" />}
                  {scene.musicTrackName && <Music className="w-3 h-3 text-muted-foreground/50" />}
                </div>
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); startRename(scene); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleRemove(scene.id, scene.name); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Expanded scene editor */}
          {expandedId === scene.id && (
            <div className="ml-5 pl-2 border-l border-border/30 py-2 space-y-3 animate-fade-in">
              {/* Linked map */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Map className="w-3 h-3" /> Mapa vinculado
                </label>
                <select
                  value={scene.mapId ?? ''}
                  onChange={(e) => onUpdateScene(scene.id, { mapId: e.target.value || null })}
                  className="w-full h-7 text-xs rounded-md border border-border bg-input text-foreground px-2"
                >
                  <option value="">Sin mapa</option>
                  {maps.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Narrative image */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Image className="w-3 h-3" /> Imagen narrativa
                </label>
                {scene.narrativeImage ? (
                  <div className="relative group/img">
                    <img
                      src={scene.narrativeImage}
                      alt="Narrativa"
                      className="w-full h-20 object-cover rounded-md border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover/img:opacity-100 transition-opacity"
                      onClick={() => onUpdateScene(scene.id, { narrativeImage: null })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs gap-1"
                    onClick={() => {
                      setUploadTargetId(scene.id);
                      imageInputRef.current?.click();
                    }}
                  >
                    <Upload className="w-3 h-3" />
                    Subir imagen
                  </Button>
                )}
              </div>

              {/* Narrative text */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Type className="w-3 h-3" /> Texto narrativo
                </label>
                <Textarea
                  value={scene.narrativeText}
                  onChange={(e) => onUpdateScene(scene.id, { narrativeText: e.target.value })}
                  placeholder="Descripción de la escena..."
                  className="min-h-[60px] text-xs resize-none"
                />
              </div>

              {/* Music track name reference */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Music className="w-3 h-3" /> Nombre pista musical
                </label>
                <Input
                  value={scene.musicTrackName ?? ''}
                  onChange={(e) => onUpdateScene(scene.id, { musicTrackName: e.target.value || null })}
                  placeholder="Nombre de la pista..."
                  className="h-7 text-xs"
                />
              </div>

              {/* Activate button */}
              <Button
                onClick={() => onActivateScene(scene.id)}
                variant={scene.id === activeSceneId ? "secondary" : "default"}
                size="sm"
                className="w-full gap-2 h-8"
              >
                <Play className="w-3.5 h-3.5" />
                {scene.id === activeSceneId ? 'Escena activa' : 'Activar escena'}
              </Button>
            </div>
          )}
        </div>
      ))}

      {scenes.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">Sin escenas</p>
          <Button variant="outline" size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Crear escena
          </Button>
        </div>
      )}
    </div>
  );
};
