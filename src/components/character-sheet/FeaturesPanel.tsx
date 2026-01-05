import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ChevronDown, Minus } from 'lucide-react';
import { Feature } from '@/types/dnd5e';

interface FeaturesPanelProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
  readOnly?: boolean;
}

const FEATURE_SOURCES = [
  { value: 'Racial', label: 'Racial' },
  { value: 'Class', label: 'Clase' },
  { value: 'Subclass', label: 'Subclase' },
  { value: 'Feat', label: 'Dote' },
  { value: 'Background', label: 'Trasfondo' },
  { value: 'Other', label: 'Otro' },
];

const emptyFeature: Omit<Feature, 'id'> = {
  name: '',
  source: 'Class',
  description: '',
};

export const FeaturesPanel = ({
  features,
  onChange,
  readOnly = false
}: FeaturesPanelProps) => {
  const [showNewFeature, setShowNewFeature] = useState(false);
  const [newFeature, setNewFeature] = useState<Omit<Feature, 'id'>>(emptyFeature);
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>([]);

  const addFeature = () => {
    if (!newFeature.name.trim()) return;
    const feature: Feature = {
      ...newFeature,
      id: crypto.randomUUID(),
    };
    onChange([...features, feature]);
    setNewFeature(emptyFeature);
    setShowNewFeature(false);
  };

  const deleteFeature = (id: string) => {
    onChange(features.filter(f => f.id !== id));
  };

  const updateFeatureUses = (id: string, delta: number) => {
    onChange(features.map(f => {
      if (f.id === id && f.uses_max !== undefined) {
        const current = f.uses_current ?? f.uses_max;
        return { 
          ...f, 
          uses_current: Math.max(0, Math.min(f.uses_max, current + delta)) 
        };
      }
      return f;
    }));
  };

  const resetUses = (id: string) => {
    onChange(features.map(f => {
      if (f.id === id && f.uses_max !== undefined) {
        return { ...f, uses_current: f.uses_max };
      }
      return f;
    }));
  };

  const toggleFeature = (id: string) => {
    setExpandedFeatures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const groupedFeatures = FEATURE_SOURCES.reduce((acc, source) => {
    acc[source.value] = features.filter(f => f.source === source.value);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="space-y-3">
      {/* Add Feature Button */}
      {!readOnly && (
        <Dialog open={showNewFeature} onOpenChange={setShowNewFeature}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Rasgo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir Rasgo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={newFeature.name}
                    onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                    placeholder="Visión en la oscuridad"
                  />
                </div>
                <div>
                  <Label>Origen</Label>
                  <Select
                    value={newFeature.source}
                    onValueChange={(v) => setNewFeature({ ...newFeature, source: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FEATURE_SOURCES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  placeholder="Describe el rasgo..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Usos (opcional)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newFeature.uses_max || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      setNewFeature({ 
                        ...newFeature, 
                        uses_max: val,
                        uses_current: val
                      });
                    }}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <Label>Recarga</Label>
                  <Input
                    value={newFeature.recharge || ''}
                    onChange={(e) => setNewFeature({ ...newFeature, recharge: e.target.value })}
                    placeholder="Descanso corto"
                  />
                </div>
              </div>

              <Button onClick={addFeature} className="w-full">Añadir Rasgo</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Features List */}
      <ScrollArea className="h-[350px]">
        <div className="space-y-3 pr-2">
          {FEATURE_SOURCES.map(source => {
            const sourceFeatures = groupedFeatures[source.value] || [];
            if (sourceFeatures.length === 0) return null;

            return (
              <div key={source.value}>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  {source.label}
                </div>
                <div className="space-y-1">
                  {sourceFeatures.map(feature => (
                    <Collapsible
                      key={feature.id}
                      open={expandedFeatures.includes(feature.id)}
                      onOpenChange={() => toggleFeature(feature.id)}
                    >
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${
                              expandedFeatures.includes(feature.id) ? 'rotate-180' : ''
                            }`} />
                            <span className="font-medium text-sm truncate">{feature.name}</span>
                          </div>
                          {feature.uses_max !== undefined && (
                            <div className="flex items-center gap-1 ml-2">
                              {!readOnly && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFeatureUses(feature.id, -1);
                                  }}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                              )}
                              <span className="text-xs font-mono px-1">
                                {feature.uses_current ?? feature.uses_max}/{feature.uses_max}
                              </span>
                              {!readOnly && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFeatureUses(feature.id, 1);
                                  }}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-2 pt-0 border-t">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {feature.description || 'Sin descripción'}
                            </p>
                            {feature.recharge && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                  Recarga: {feature.recharge}
                                </span>
                                {!readOnly && feature.uses_max !== undefined && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-xs"
                                    onClick={() => resetUses(feature.id)}
                                  >
                                    Resetear
                                  </Button>
                                )}
                              </div>
                            )}
                            {!readOnly && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs text-destructive mt-2"
                                onClick={() => deleteFeature(feature.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </div>
            );
          })}

          {features.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin rasgos
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
