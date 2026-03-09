import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapData } from '@/hooks/useGameState';
import { Plus, Trash2, Pencil, Check, X, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MapManagerProps {
  maps: MapData[];
  activeMapId: string | null;
  onSelectMap: (id: string) => void;
  onAddMap: (name?: string) => string;
  onRemoveMap: (id: string) => void;
  onRenameMap: (id: string, name: string) => void;
}

export const MapManager = ({
  maps,
  activeMapId,
  onSelectMap,
  onAddMap,
  onRemoveMap,
  onRenameMap,
}: MapManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (map: MapData) => {
    setEditingId(map.id);
    setEditName(map.name);
  };

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      onRenameMap(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleAdd = () => {
    onAddMap();
    toast.success('Nuevo mapa creado');
  };

  const handleRemove = (id: string, name: string) => {
    if (maps.length <= 1) {
      toast.error('Debe haber al menos un mapa');
      return;
    }
    onRemoveMap(id);
    toast.success(`"${name}" eliminado`);
  };

  return (
    <div className="p-2 space-y-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mapas</span>
        <Button variant="ghost" size="sm" onClick={handleAdd} className="h-6 w-6 p-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {maps.map((map) => (
        <div
          key={map.id}
          className={cn(
            'group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm',
            map.id === activeMapId
              ? 'bg-primary/15 text-primary font-medium'
              : 'hover:bg-muted/50 text-muted-foreground'
          )}
          onClick={() => {
            if (editingId !== map.id) onSelectMap(map.id);
          }}
        >
          <Map className="w-3.5 h-3.5 shrink-0" />

          {editingId === map.id ? (
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
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="truncate flex-1 min-w-0">{map.name}</span>
              {map.mapImage && (
                <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0 opacity-60">
                  <img src={map.mapImage} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); startRename(map); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleRemove(map.id, map.name); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}

      {maps.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">Sin mapas</p>
          <Button variant="outline" size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Crear mapa
          </Button>
        </div>
      )}
    </div>
  );
};
