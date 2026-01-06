import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, Star } from 'lucide-react';
import { Feature } from '@/types/dnd5e';

interface TraitsPanelProps {
  traits: Feature[];
  onChange: (traits: Feature[]) => void;
  readOnly: boolean;
}

export const TraitsPanel = ({ traits, onChange, readOnly }: TraitsPanelProps) => {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addTrait = () => {
    const newTrait: Feature = {
      id: crypto.randomUUID(),
      name: 'Nuevo rasgo',
      source: 'Monster',
      description: '',
    };
    onChange([...traits, newTrait]);
    setExpanded([...expanded, newTrait.id]);
  };

  const updateTrait = (id: string, updates: Partial<Feature>) => {
    onChange(traits.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrait = (id: string) => {
    onChange(traits.filter(t => t.id !== id));
  };

  if (readOnly && traits.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin rasgos especiales</p>;
  }

  return (
    <div className="space-y-2">
      {traits.map(trait => (
        <Collapsible 
          key={trait.id} 
          open={expanded.includes(trait.id)} 
          onOpenChange={() => toggleExpanded(trait.id)}
        >
          <div className="border rounded-lg bg-card/50">
            <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-sm">{trait.name}</span>
                {trait.uses_max && (
                  <span className="text-xs text-muted-foreground">
                    ({trait.uses_current ?? trait.uses_max}/{trait.uses_max})
                  </span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 border-t space-y-3">
                {readOnly ? (
                  <p className="text-sm whitespace-pre-wrap">{trait.description}</p>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={trait.name}
                        onChange={(e) => updateTrait(trait.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Textarea
                        value={trait.description}
                        onChange={(e) => updateTrait(trait.id, { description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Usos máx.</Label>
                        <Input
                          type="number"
                          min={0}
                          value={trait.uses_max || ''}
                          onChange={(e) => updateTrait(trait.id, { 
                            uses_max: parseInt(e.target.value) || undefined,
                            uses_current: parseInt(e.target.value) || undefined
                          })}
                          placeholder="∞"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Usos actuales</Label>
                        <Input
                          type="number"
                          min={0}
                          max={trait.uses_max || 99}
                          value={trait.uses_current ?? ''}
                          onChange={(e) => updateTrait(trait.id, { uses_current: parseInt(e.target.value) || 0 })}
                          disabled={!trait.uses_max}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Recarga</Label>
                        <Input
                          value={trait.recharge || ''}
                          onChange={(e) => updateTrait(trait.id, { recharge: e.target.value || undefined })}
                          placeholder="ej: 5-6"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTrait(trait.id)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar rasgo
                    </Button>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addTrait} className="w-full">
          <Plus className="w-4 h-4 mr-1" />
          Añadir rasgo
        </Button>
      )}
    </div>
  );
};
