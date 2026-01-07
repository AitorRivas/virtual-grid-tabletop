import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplates, Template, CharacterTemplate, MonsterTemplate } from '@/hooks/useTemplates';
import { ExtendedCharacter, ExtendedMonster } from '@/types/dnd5e';
import { Bookmark, Trash2, Download, Upload, User, Skull, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateManagerProps {
  onApplyCharacterTemplate: (data: Partial<ExtendedCharacter>) => void;
  onApplyMonsterTemplate: (data: Partial<ExtendedMonster>) => void;
  currentCharacter?: ExtendedCharacter | null;
  currentMonster?: ExtendedMonster | null;
}

export const TemplateManager = ({
  onApplyCharacterTemplate,
  onApplyMonsterTemplate,
  currentCharacter,
  currentMonster,
}: TemplateManagerProps) => {
  const {
    getCharacterTemplates,
    getMonsterTemplates,
    createCharacterTemplate,
    createMonsterTemplate,
    deleteTemplate,
    exportTemplates,
    importTemplates,
  } = useTemplates();

  const [showManager, setShowManager] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveType, setSaveType] = useState<'character' | 'monster'>('character');
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  const characterTemplates = getCharacterTemplates();
  const monsterTemplates = getMonsterTemplates();

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Ingresa un nombre para la plantilla');
      return;
    }

    if (saveType === 'character' && currentCharacter) {
      createCharacterTemplate(templateName, currentCharacter, templateDesc || undefined);
      toast.success('Plantilla de personaje guardada');
    } else if (saveType === 'monster' && currentMonster) {
      createMonsterTemplate(templateName, currentMonster, templateDesc || undefined);
      toast.success('Plantilla de monstruo guardada');
    }

    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDesc('');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = importTemplates(e.target?.result as string);
      if (success) {
        toast.success('Plantillas importadas');
      } else {
        toast.error('Error al importar plantillas');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    toast.success('Plantilla eliminada');
  };

  const handleApplyCharacterTemplate = (template: CharacterTemplate) => {
    onApplyCharacterTemplate(template.data);
    setShowManager(false);
    toast.success(`Plantilla "${template.name}" aplicada`);
  };

  const handleApplyMonsterTemplate = (template: MonsterTemplate) => {
    onApplyMonsterTemplate(template.data);
    setShowManager(false);
    toast.success(`Plantilla "${template.name}" aplicada`);
  };

  return (
    <>
      {/* Template Manager Button */}
      <Dialog open={showManager} onOpenChange={setShowManager}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <Bookmark className="w-4 h-4" />
            Plantillas
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Plantillas Guardadas
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={exportTemplates} className="gap-1">
              <Download className="w-3 h-3" />
              Exportar
            </Button>
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button size="sm" variant="outline" asChild className="gap-1">
                <span><Upload className="w-3 h-3" /> Importar</span>
              </Button>
            </label>
          </div>

          <Tabs defaultValue="characters" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="characters" className="gap-1">
                <User className="w-3 h-3" />
                Personajes ({characterTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="monsters" className="gap-1">
                <Skull className="w-3 h-3" />
                Monstruos ({monsterTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="characters">
              <ScrollArea className="h-[300px]">
                {characterTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay plantillas de personajes
                  </p>
                ) : (
                  <div className="space-y-2 pr-2">
                    {characterTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            {template.description && (
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.data.race} {template.data.class}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApplyCharacterTemplate(template)}
                            >
                              Usar
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="monsters">
              <ScrollArea className="h-[300px]">
                {monsterTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay plantillas de monstruos
                  </p>
                ) : (
                  <div className="space-y-2 pr-2">
                    {monsterTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            {template.description && (
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              CR {template.data.challenge_rating} · {template.data.type}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApplyMonsterTemplate(template)}
                            >
                              Usar
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Guardar como Plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la plantilla</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ej: Guerrero nivel 5"
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Notas sobre la plantilla..."
                rows={2}
              />
            </div>
            <Button onClick={handleSaveTemplate} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Guardar Plantilla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Export a simpler hook for components to trigger save dialog
export const useSaveAsTemplate = () => {
  const { createCharacterTemplate, createMonsterTemplate } = useTemplates();

  const saveCharacterAsTemplate = (name: string, character: ExtendedCharacter, description?: string) => {
    createCharacterTemplate(name, character, description);
    toast.success('Plantilla guardada');
  };

  const saveMonsterAsTemplate = (name: string, monster: ExtendedMonster, description?: string) => {
    createMonsterTemplate(name, monster, description);
    toast.success('Plantilla guardada');
  };

  return { saveCharacterAsTemplate, saveMonsterAsTemplate };
};
