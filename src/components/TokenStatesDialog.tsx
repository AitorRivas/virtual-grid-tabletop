import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ConditionManager } from './ConditionManager';
import { Plus, Upload, Trash2, X } from 'lucide-react';
import { useGameState, type CustomState } from '@/hooks/useGameState';
import { toast } from 'sonner';

interface TokenStatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenName: string;
  activeConditions: string[];
  onToggleCondition: (conditionId: string) => void;
  activeCustomStates: string[];
  onToggleCustomState: (stateId: string) => void;
}

export const TokenStatesDialog = ({
  open, onOpenChange, tokenName,
  activeConditions, onToggleCondition,
  activeCustomStates, onToggleCustomState,
}: TokenStatesDialogProps) => {
  const { customStatesLibrary, addCustomState, removeCustomStateFromLibrary } = useGameState();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#a855f7');
  const [newIcon, setNewIcon] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (file: File) => {
    if (file.size > 256 * 1024) {
      toast.error('Icono demasiado grande (máx 256 KB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewIcon(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newIcon) {
      toast.error('Nombre e icono son obligatorios');
      return;
    }
    addCustomState({ name: newName.trim(), iconUrl: newIcon, color: newColor });
    setNewName(''); setNewIcon(''); setCreating(false);
    toast.success('Estado personalizado creado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Estados de {tokenName}</DialogTitle>
        </DialogHeader>

        {/* Active custom states */}
        {activeCustomStates.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Estados personalizados activos</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {activeCustomStates.map((id) => {
                const cs = customStatesLibrary.find((c) => c.id === id);
                if (!cs) return null;
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="gap-1.5 pl-1.5 pr-2 py-1 cursor-pointer hover:bg-destructive/20"
                    style={{ borderColor: cs.color, borderWidth: 1 }}
                    onClick={() => onToggleCustomState(id)}
                  >
                    <img src={cs.iconUrl} alt="" className="w-4 h-4 object-contain" />
                    {cs.name}
                    <X className="w-3 h-3 ml-0.5" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Predefined conditions (reuses existing system) */}
        <div>
          <Label className="text-xs text-muted-foreground">Condiciones D&D</Label>
          <div className="mt-1.5">
            <ConditionManager
              activeConditions={activeConditions}
              onToggleCondition={onToggleCondition}
            />
          </div>
        </div>

        {/* Custom states library */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground">Biblioteca de estados personalizados</Label>
            <Button size="sm" variant="ghost" onClick={() => setCreating((v) => !v)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {creating ? 'Cancelar' : 'Crear'}
            </Button>
          </div>

          {creating && (
            <div className="space-y-2 p-2 rounded border border-border/60 bg-card mb-2">
              <Input
                placeholder="Nombre del estado"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])}
                />
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {newIcon ? 'Cambiar icono' : 'Subir icono'}
                </Button>
                {newIcon && <img src={newIcon} alt="" className="w-7 h-7 object-contain rounded border" />}
                <Input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-12 p-1"
                />
                <Button size="sm" onClick={handleCreate}>Guardar</Button>
              </div>
            </div>
          )}

          <ScrollArea className="max-h-44">
            <div className="grid grid-cols-2 gap-1 pr-2">
              {customStatesLibrary.length === 0 && (
                <p className="col-span-2 text-xs text-muted-foreground italic text-center py-2">
                  Aún no has creado estados personalizados.
                </p>
              )}
              {customStatesLibrary.map((cs) => {
                const isActive = activeCustomStates.includes(cs.id);
                return (
                  <div
                    key={cs.id}
                    className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer border ${
                      isActive ? 'bg-primary/20 border-primary/50' : 'bg-secondary/50 border-transparent hover:bg-secondary'
                    }`}
                    onClick={() => onToggleCustomState(cs.id)}
                  >
                    <img src={cs.iconUrl} alt="" className="w-5 h-5 object-contain" />
                    <span className="flex-1 truncate" style={{ color: cs.color }}>{cs.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomStateFromLibrary(cs.id);
                        toast.success('Estado eliminado de la biblioteca');
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
