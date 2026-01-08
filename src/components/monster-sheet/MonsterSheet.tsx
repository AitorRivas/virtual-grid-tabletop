import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Swords, Shield, Star, Edit, Save, X, Download, Upload, Bookmark } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MonsterSheetHeader } from './MonsterSheetHeader';
import { TraitsPanel } from './TraitsPanel';
import { MonsterActionsPanel } from './MonsterActionsPanel';
import { ResistancesPanel } from './ResistancesPanel';
import { AbilityScoresPanel } from '@/components/character-sheet/AbilityScoresPanel';
import { toast } from 'sonner';
import { 
  ExtendedMonster, 
  CharacterProficiencies, 
  Speeds,
  Senses,
  Skill,
  SaveType
} from '@/types/dnd5e';
import { getModifier, formatModifier } from '@/types/dnd';

interface MonsterSheetProps {
  monster: ExtendedMonster;
  onSave: (monster: ExtendedMonster) => Promise<boolean>;
  onClose?: () => void;
  initialReadOnly?: boolean;
}

export const MonsterSheet = ({ 
  monster: initialMonster, 
  onSave, 
  onClose,
  initialReadOnly = true 
}: MonsterSheetProps) => {
  const [monster, setMonster] = useState<ExtendedMonster>(initialMonster);
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { createMonsterTemplate } = useTemplates();

  const updateMonster = <K extends keyof ExtendedMonster>(
    key: K, 
    value: ExtendedMonster[K]
  ) => {
    setMonster(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateMultiple = (updates: Partial<ExtendedMonster>) => {
    setMonster(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(monster);
    setSaving(false);
    if (success) {
      setHasChanges(false);
      setReadOnly(true);
    }
  };

  const handleCancel = () => {
    setMonster(initialMonster);
    setHasChanges(false);
    setReadOnly(true);
  };

  // Export monster as JSON
  const handleExport = () => {
    const exportData = {
      ...monster,
      id: undefined,
      user_id: undefined,
      created_at: undefined,
      updated_at: undefined,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${monster.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Monstruo exportado');
  };

  // Import monster from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setMonster(prev => ({
          ...prev,
          ...data,
          id: prev.id,
          user_id: prev.user_id,
        }));
        setHasChanges(true);
        toast.success('Datos importados correctamente');
      } catch (err) {
        toast.error('Error al importar: archivo JSON inválido');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Convert monster saves/skills to proficiencies format for AbilityScoresPanel
  const proficiencies: CharacterProficiencies = useMemo(() => ({
    saves: monster.saves.map(s => s.ability),
    skills: monster.skills.map(s => s.skill),
    expertise: [],
    weapons: [],
    armor: [],
    tools: [],
    languages: monster.languages
  }), [monster.saves, monster.skills, monster.languages]);

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-card/50">
        <div className="flex items-center gap-2">
          {monster.image_url ? (
            <img 
              src={monster.image_url} 
              alt={monster.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-destructive/30"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full border-2 border-destructive/30"
              style={{ backgroundColor: monster.token_color }}
            />
          )}
          <div>
            <h2 className="font-bold text-lg leading-tight">{monster.name || 'Nuevo Monstruo'}</h2>
            <p className="text-xs text-muted-foreground">
              CR {monster.challenge_rating} · {monster.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Export/Import/Template */}
          <Button size="icon" variant="ghost" onClick={() => setShowSaveTemplate(true)} title="Guardar como plantilla">
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleExport} title="Exportar JSON">
            <Download className="w-4 h-4" />
          </Button>
          <label title="Importar JSON">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button size="icon" variant="ghost" asChild>
              <span><Upload className="w-4 h-4" /></span>
            </Button>
          </label>

          {readOnly ? (
            <Button size="sm" variant="outline" onClick={() => setReadOnly(false)}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} title="Cerrar">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Header Section */}
          <MonsterSheetHeader
            monster={{
              name: monster.name,
              type: monster.type,
              size: monster.size,
              alignment: monster.alignment,
              challenge_rating: monster.challenge_rating,
              proficiency_bonus: monster.proficiency_bonus,
              hit_dice: monster.hit_dice,
            }}

            monster={{
              name: monster.name,
              type: monster.type,
              size: monster.size,
              alignment: monster.alignment,
              challenge_rating: monster.challenge_rating,
              proficiency_bonus: monster.proficiency_bonus,
              hit_dice: monster.hit_dice,
            }}
            onChange={(updates) => updateMultiple(updates as Partial<ExtendedMonster>)}
            readOnly={readOnly}
          />

          {/* Combat Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-card border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">CA</Label>
              {readOnly ? (
                <p className="text-2xl font-bold">{monster.armor_class}</p>
              ) : (
                <Input
                  type="number"
                  value={monster.armor_class}
                  onChange={(e) => updateMonster('armor_class', parseInt(e.target.value) || 10)}
                  className="text-center text-lg font-bold h-10 mt-1"
                />
              )}
            </div>
            <div className="p-3 bg-card border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">PG</Label>
              {readOnly ? (
                <p className="text-2xl font-bold">{monster.hit_points}</p>
              ) : (
                <Input
                  type="number"
                  value={monster.hit_points}
                  onChange={(e) => updateMonster('hit_points', parseInt(e.target.value) || 1)}
                  className="text-center text-lg font-bold h-10 mt-1"
                />
              )}
            </div>
            <div className="p-3 bg-card border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Velocidad</Label>
              {readOnly ? (
                <p className="text-2xl font-bold">{monster.speed} ft</p>
              ) : (
                <Input
                  type="number"
                  value={monster.speed}
                  onChange={(e) => updateMonster('speed', parseInt(e.target.value) || 30)}
                  className="text-center text-lg font-bold h-10 mt-1"
                />
              )}
            </div>
            <div className="p-3 bg-card border rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Iniciativa</Label>
              <p className="text-2xl font-bold">
                {formatModifier(getModifier(monster.dexterity))}
              </p>
            </div>
          </div>

          <Tabs defaultValue="abilities" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="abilities" className="text-xs gap-1">
                <User className="w-3 h-3" />
                <span className="hidden sm:inline">Atributos</span>
              </TabsTrigger>
              <TabsTrigger value="traits" className="text-xs gap-1">
                <Star className="w-3 h-3" />
                <span className="hidden sm:inline">Rasgos</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs gap-1">
                <Swords className="w-3 h-3" />
                <span className="hidden sm:inline">Acciones</span>
              </TabsTrigger>
              <TabsTrigger value="defenses" className="text-xs gap-1">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Defensas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="abilities" className="mt-4">
              <AbilityScoresPanel
                abilities={{
                  strength: monster.strength,
                  dexterity: monster.dexterity,
                  constitution: monster.constitution,
                  intelligence: monster.intelligence,
                  wisdom: monster.wisdom,
                  charisma: monster.charisma,
                }}
                proficiencies={proficiencies}
                proficiencyBonus={monster.proficiency_bonus}
                onChange={(updates) => updateMultiple(updates)}
                onProficienciesChange={(profs) => {
                  // Convert back to monster format
                  updateMultiple({
                    saves: profs.saves.map(s => ({ ability: s, bonus: 0 })),
                    skills: profs.skills.map(s => ({ skill: s, bonus: 0 })),
                    languages: profs.languages
                  } as Partial<ExtendedMonster>);
                }}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="traits" className="mt-4">
              <TraitsPanel
                traits={monster.traits}
                onChange={(traits) => updateMonster('traits', traits)}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <MonsterActionsPanel
                actions={monster.actions}
                bonusActions={monster.bonus_actions}
                reactions={monster.reactions}
                legendaryActions={monster.legendary_actions}
                lairActions={monster.lair_actions}
                abilities={{
                  strength: monster.strength,
                  dexterity: monster.dexterity,
                  constitution: monster.constitution,
                  intelligence: monster.intelligence,
                  wisdom: monster.wisdom,
                  charisma: monster.charisma,
                }}
                proficiencyBonus={monster.proficiency_bonus}
                onChange={(updates) => updateMultiple(updates as Partial<ExtendedMonster>)}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="defenses" className="mt-4">
              <ResistancesPanel
                resistances={monster.resistances}
                immunities={monster.immunities}
                vulnerabilities={monster.vulnerabilities}
                onChange={(updates) => updateMultiple(updates as Partial<ExtendedMonster>)}
                readOnly={readOnly}
              />
            </TabsContent>
          </Tabs>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas</Label>
            <Textarea
              value={monster.notes || ''}
              onChange={(e) => updateMonster('notes', e.target.value || null)}
              placeholder="Notas del monstruo..."
              rows={4}
              disabled={readOnly}
              className="resize-none"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
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
                placeholder={`Ej: ${monster.name} base`}
              />
            </div>
            <Button 
              onClick={() => {
                if (templateName.trim()) {
                  createMonsterTemplate(templateName, monster);
                  toast.success('Plantilla guardada');
                  setShowSaveTemplate(false);
                  setTemplateName('');
                } else {
                  toast.error('Ingresa un nombre');
                }
              }} 
              className="w-full"
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Guardar Plantilla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
