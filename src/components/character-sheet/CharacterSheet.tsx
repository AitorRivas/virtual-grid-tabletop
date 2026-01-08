import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Swords, Package, Sparkles, BookOpen, Edit, Save, X, Download, Upload, Bookmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CharacterSheetHeader } from './CharacterSheetHeader';
import { AbilityScoresPanel } from './AbilityScoresPanel';
import { CombatPanel } from './CombatPanel';
import { ActionsPanel } from './ActionsPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { FeaturesPanel } from './FeaturesPanel';
import { SpellsPanel } from './SpellsPanel';
import { toast } from 'sonner';
import { getModifier } from '@/types/dnd';
import { 
  ExtendedCharacter, 
  CharacterProficiencies, 
  CharacterAction,
  EquipmentItem,
  Feature,
  Speeds,
  Senses,
  Resistances,
  CharacterSpells,
  SAVES,
  calculateAC
} from '@/types/dnd5e';
import { getProficiencyBonus } from '@/types/dnd5e';
import { useTemplates } from '@/hooks/useTemplates';

interface CharacterSheetProps {
  character: ExtendedCharacter;
  onSave: (character: ExtendedCharacter) => Promise<boolean>;
  onClose?: () => void;
  initialReadOnly?: boolean;
}

export const CharacterSheet = ({ 
  character: initialCharacter, 
  onSave, 
  onClose,
  initialReadOnly = true 
}: CharacterSheetProps) => {
  const [character, setCharacter] = useState<ExtendedCharacter>(initialCharacter);
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  const { createCharacterTemplate } = useTemplates();

  const profBonus = useMemo(() => getProficiencyBonus(character.level), [character.level]);
  const dexMod = useMemo(() => getModifier(character.dexterity), [character.dexterity]);

  // Auto-calculate AC when equipment changes
  const calculatedAC = useMemo(() => {
    return calculateAC(dexMod, character.equipment);
  }, [dexMod, character.equipment]);

  // Sync AC when equipment changes (but allow manual override in edit mode)
  useEffect(() => {
    if (!readOnly && character.equipment.some(e => e.equipped && (e.type === 'armor' || e.type === 'shield'))) {
      if (character.armor_class !== calculatedAC) {
        setCharacter(prev => ({ ...prev, armor_class: calculatedAC }));
        setHasChanges(true);
      }
    }
  }, [calculatedAC, readOnly]);

  const updateCharacter = <K extends keyof ExtendedCharacter>(
    key: K, 
    value: ExtendedCharacter[K]
  ) => {
    setCharacter(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateMultiple = (updates: Partial<ExtendedCharacter>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(character);
    setSaving(false);
    if (success) {
      setHasChanges(false);
      setReadOnly(true);
    }
  };

  const handleCancel = () => {
    setCharacter(initialCharacter);
    setHasChanges(false);
    setReadOnly(true);
  };

  // Export character as JSON
  const handleExport = () => {
    const exportData = {
      ...character,
      id: undefined, // Remove ID for import
      user_id: undefined,
      created_at: undefined,
      updated_at: undefined,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Personaje exportado');
  };

  // Import character from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Merge imported data with current character (keeping ID and user_id)
        setCharacter(prev => ({
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

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-card/50">
        <div className="flex items-center gap-2">
          {character.image_url ? (
            <img 
              src={character.image_url} 
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full border-2 border-primary/30"
              style={{ backgroundColor: character.token_color }}
            />
          )}
          <div>
            <h2 className="font-bold text-lg leading-tight">{character.name || 'Nuevo Personaje'}</h2>
            <p className="text-xs text-muted-foreground">
              {character.race} {character.class} Nv.{character.level}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Save as Template */}
          <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" title="Guardar como plantilla">
                <Bookmark className="w-4 h-4" />
              </Button>
            </DialogTrigger>
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
                <Button 
                  onClick={() => {
                    if (templateName.trim()) {
                      createCharacterTemplate(templateName, character);
                      toast.success('Plantilla guardada');
                      setShowSaveTemplate(false);
                      setTemplateName('');
                    }
                  }} 
                  className="w-full"
                >
                  Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export/Import */}
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
          <CharacterSheetHeader
            character={{
              name: character.name,
              race: character.race,
              class: character.class,
              subclass: character.subclass,
              level: character.level,
              background: character.background,
              alignment: character.alignment,
              proficiency_bonus: character.proficiency_bonus,
              token_size: character.token_size,
            }}
            onChange={(updates) => updateMultiple(updates as Partial<ExtendedCharacter>)}
            readOnly={readOnly}
          />


          <Tabs defaultValue="abilities" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="abilities" className="text-xs gap-1">
                <User className="w-3 h-3" />
                <span className="hidden sm:inline">Atributos</span>
              </TabsTrigger>
              <TabsTrigger value="combat" className="text-xs gap-1">
                <Swords className="w-3 h-3" />
                <span className="hidden sm:inline">Combate</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs gap-1">
                <Swords className="w-3 h-3" />
                <span className="hidden sm:inline">Acciones</span>
              </TabsTrigger>
              <TabsTrigger value="equipment" className="text-xs gap-1">
                <Package className="w-3 h-3" />
                <span className="hidden sm:inline">Equipo</span>
              </TabsTrigger>
              <TabsTrigger value="spells" className="text-xs gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Hechizos</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs gap-1">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Rasgos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="abilities" className="mt-4">
              <AbilityScoresPanel
                abilities={{
                  strength: character.strength,
                  dexterity: character.dexterity,
                  constitution: character.constitution,
                  intelligence: character.intelligence,
                  wisdom: character.wisdom,
                  charisma: character.charisma,
                }}
                proficiencies={character.proficiencies}
                proficiencyBonus={profBonus}
                onChange={(updates) => updateMultiple(updates)}
                onProficienciesChange={(profs) => updateCharacter('proficiencies', profs)}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="combat" className="mt-4">
              <div className="space-y-4">
                <CombatPanel
                  combat={{
                    armor_class: character.armor_class,
                    hit_points_max: character.hit_points_max,
                    hit_points_current: character.hit_points_current,
                    speed: character.speed,
                    initiative_bonus: character.initiative_bonus,
                  }}
                  speeds={character.speeds}
                  senses={character.senses}
                  abilities={{
                    dexterity: character.dexterity,
                    wisdom: character.wisdom,
                    intelligence: character.intelligence,
                    charisma: character.charisma,
                  }}
                  proficiencies={character.proficiencies}
                  proficiencyBonus={profBonus}
                  spellAbility={character.spell_ability}
                  onChange={(updates) => updateMultiple(updates)}
                  onSpeedsChange={(speeds) => updateCharacter('speeds', speeds)}
                  readOnly={readOnly}
                />
                
                {/* Spell Ability Selector */}
                {!readOnly && (
                  <div className="p-3 bg-card border rounded-lg">
                    <Label className="text-xs text-muted-foreground">Característica de lanzamiento</Label>
                    <Select 
                      value={character.spell_ability || ''} 
                      onValueChange={(v) => updateCharacter('spell_ability', v || null)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sin hechizos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin hechizos</SelectItem>
                        {SAVES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <ActionsPanel
                actions={character.actions}
                abilities={{
                  strength: character.strength,
                  dexterity: character.dexterity,
                  constitution: character.constitution,
                  intelligence: character.intelligence,
                  wisdom: character.wisdom,
                  charisma: character.charisma,
                }}
                proficiencyBonus={profBonus}
                onChange={(actions) => updateCharacter('actions', actions)}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="equipment" className="mt-4">
              <EquipmentPanel
                equipment={character.equipment}
                abilities={{
                  strength: character.strength,
                  dexterity: character.dexterity,
                }}
                proficiencyBonus={profBonus}
                onChange={(equipment) => updateCharacter('equipment', equipment)}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="spells" className="mt-4">
              <SpellsPanel
                spells={character.spells}
                spellAbility={character.spell_ability}
                abilities={{
                  intelligence: character.intelligence,
                  wisdom: character.wisdom,
                  charisma: character.charisma,
                }}
                proficiencyBonus={profBonus}
                onChange={(spells) => updateCharacter('spells', spells)}
                readOnly={readOnly}
              />
            </TabsContent>

            <TabsContent value="features" className="mt-4">
              <FeaturesPanel
                features={character.features}
                onChange={(features) => updateCharacter('features', features)}
                readOnly={readOnly}
              />
            </TabsContent>
          </Tabs>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas</Label>
            <Textarea
              value={character.notes || ''}
              onChange={(e) => updateCharacter('notes', e.target.value || null)}
              placeholder="Notas del personaje..."
              rows={4}
              disabled={readOnly}
              className="resize-none"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
