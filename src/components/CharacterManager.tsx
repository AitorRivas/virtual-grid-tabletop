import { useState, useRef } from 'react';
import { useCharacters } from '@/hooks/useCharacters';
import { useMonsters } from '@/hooks/useMonsters';
import { 
  Character, Monster, DND_RACES, DND_CLASSES, MONSTER_TYPES, CHALLENGE_RATINGS, 
  ALIGNMENTS, CREATURE_SIZES, getModifier, formatModifier, TokenColor, CreatureSize,
  getRaceLabel, getClassLabel, getMonsterTypeLabel, getCreatureSizeLabel
} from '@/types/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, User, Skull, Shield, Heart, Zap, Upload, Link, X } from 'lucide-react';
import { toast } from 'sonner';
import { SharedImagePicker } from './SharedImagePicker';

const TOKEN_COLORS: TokenColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'black'];

interface CharacterManagerProps {
  onAddCharacterToMap: (character: Character) => void;
  onAddMonsterToMap: (monster: Monster) => void;
}

export const CharacterManager = ({ onAddCharacterToMap, onAddMonsterToMap }: CharacterManagerProps) => {
  const { characters, loading: loadingChars, createCharacter, deleteCharacter } = useCharacters();
  const { monsters, loading: loadingMonsters, createMonster, deleteMonster } = useMonsters();
  const [showNewCharacter, setShowNewCharacter] = useState(false);
  const [showNewMonster, setShowNewMonster] = useState(false);
  const [charImageInputMode, setCharImageInputMode] = useState<'upload' | 'url'>('upload');
  const [monsterImageInputMode, setMonsterImageInputMode] = useState<'upload' | 'url'>('upload');
  const charFileInputRef = useRef<HTMLInputElement>(null);
  const monsterFileInputRef = useRef<HTMLInputElement>(null);

  const handleCharImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCharForm({ ...charForm, image_url: e.target?.result as string });
      toast.success('Imagen cargada');
    };
    reader.readAsDataURL(file);
  };

  const handleMonsterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, sube una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setMonsterForm({ ...monsterForm, image_url: e.target?.result as string });
      toast.success('Imagen cargada');
    };
    reader.readAsDataURL(file);
  };

  const clearCharImage = () => {
    setCharForm({ ...charForm, image_url: '' });
    if (charFileInputRef.current) {
      charFileInputRef.current.value = '';
    }
  };

  const clearMonsterImage = () => {
    setMonsterForm({ ...monsterForm, image_url: '' });
    if (monsterFileInputRef.current) {
      monsterFileInputRef.current.value = '';
    }
  };

  // New character form state
  const [charForm, setCharForm] = useState({
    name: '',
    race: 'Human',
    class: 'Fighter',
    level: 1,
    background: '',
    alignment: 'True Neutral',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    armor_class: 10,
    hit_points_max: 10,
    hit_points_current: 10,
    speed: 30,
    initiative_bonus: 0,
    token_color: 'blue' as TokenColor,
    token_size: 50,
    image_url: '',
    notes: ''
  });

  // New monster form state
  const [monsterForm, setMonsterForm] = useState({
    name: '',
    type: 'Beast',
    size: 'medium' as CreatureSize,
    challenge_rating: '1',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    armor_class: 10,
    hit_points: 10,
    speed: 30,
    token_color: 'red' as TokenColor,
    token_size: 50,
    image_url: '',
    notes: ''
  });

  const handleCreateCharacter = async () => {
    if (!charForm.name.trim()) return;
    await createCharacter({
      ...charForm,
      image_url: charForm.image_url.trim() || null
    });
    setShowNewCharacter(false);
    setCharForm({
      name: '', race: 'Human', class: 'Fighter', level: 1, background: '', alignment: 'True Neutral',
      strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
      armor_class: 10, hit_points_max: 10, hit_points_current: 10, speed: 30, initiative_bonus: 0,
      token_color: 'blue', token_size: 50, image_url: '', notes: ''
    });
  };

  const handleCreateMonster = async () => {
    if (!monsterForm.name.trim()) return;
    await createMonster({
      ...monsterForm,
      image_url: monsterForm.image_url.trim() || null
    });
    setShowNewMonster(false);
    setMonsterForm({
      name: '', type: 'Beast', size: 'medium', challenge_rating: '1',
      strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
      armor_class: 10, hit_points: 10, speed: 30, token_color: 'red', token_size: 50, image_url: '', notes: ''
    });
  };

  const AbilityScoreInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-2">
      <Label className="w-12 text-xs">{label}</Label>
      <Input
        type="number"
        min={1}
        max={30}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 10)}
        className="w-16 h-8 text-center"
      />
      <span className="text-xs text-muted-foreground w-8">{formatModifier(getModifier(value))}</span>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="characters" className="gap-1">
            <User className="w-4 h-4" />
            Personajes
          </TabsTrigger>
          <TabsTrigger value="monsters" className="gap-1">
            <Skull className="w-4 h-4" />
            Monstruos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-3">
          <Dialog open={showNewCharacter} onOpenChange={setShowNewCharacter}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Nuevo personaje
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear personaje</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre</Label>
                    <Input value={charForm.name} onChange={(e) => setCharForm({ ...charForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Nivel</Label>
                    <Input type="number" min={1} max={20} value={charForm.level} onChange={(e) => setCharForm({ ...charForm, level: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Raza</Label>
                    <Select value={charForm.race} onValueChange={(v) => setCharForm({ ...charForm, race: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DND_RACES.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Clase</Label>
                    <Select value={charForm.class} onValueChange={(v) => setCharForm({ ...charForm, class: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DND_CLASSES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-2 block">Atributos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <AbilityScoreInput label="FUE" value={charForm.strength} onChange={(v) => setCharForm({ ...charForm, strength: v })} />
                    <AbilityScoreInput label="DES" value={charForm.dexterity} onChange={(v) => setCharForm({ ...charForm, dexterity: v })} />
                    <AbilityScoreInput label="CON" value={charForm.constitution} onChange={(v) => setCharForm({ ...charForm, constitution: v })} />
                    <AbilityScoreInput label="INT" value={charForm.intelligence} onChange={(v) => setCharForm({ ...charForm, intelligence: v })} />
                    <AbilityScoreInput label="SAB" value={charForm.wisdom} onChange={(v) => setCharForm({ ...charForm, wisdom: v })} />
                    <AbilityScoreInput label="CAR" value={charForm.charisma} onChange={(v) => setCharForm({ ...charForm, charisma: v })} />
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-2 block">Combate</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">CA</Label>
                      <Input type="number" value={charForm.armor_class} onChange={(e) => setCharForm({ ...charForm, armor_class: parseInt(e.target.value) || 10 })} />
                    </div>
                    <div>
                      <Label className="text-xs">PG Max</Label>
                      <Input type="number" value={charForm.hit_points_max} onChange={(e) => setCharForm({ ...charForm, hit_points_max: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <Label className="text-xs">Velocidad</Label>
                      <Input type="number" value={charForm.speed} onChange={(e) => setCharForm({ ...charForm, speed: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-2 block">Token</Label>
                  <div className="space-y-3">
                    {/* Image input */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs">Imagen (opcional)</Label>
                        <div className="flex gap-1 ml-auto">
                          <Button
                            type="button"
                            size="sm"
                            variant={charImageInputMode === 'upload' ? 'default' : 'outline'}
                            className="h-6 px-2 text-xs"
                            onClick={() => setCharImageInputMode('upload')}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Subir
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={charImageInputMode === 'url' ? 'default' : 'outline'}
                            className="h-6 px-2 text-xs"
                            onClick={() => setCharImageInputMode('url')}
                          >
                            <Link className="w-3 h-3 mr-1" />
                            URL
                          </Button>
                        </div>
                      </div>

                      {charImageInputMode === 'upload' ? (
                        <div className="space-y-2">
                          <input
                            ref={charFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCharImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => charFileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4" />
                            Subir imagen
                          </Button>
                          <SharedImagePicker 
                            category="hero" 
                            onSelect={(img) => setCharForm({ ...charForm, image_url: img })}
                            selectedImage={charForm.image_url}
                          />
                        </div>
                      ) : (
                        <Input 
                          value={charForm.image_url.startsWith('data:') ? '' : charForm.image_url} 
                          onChange={(e) => setCharForm({ ...charForm, image_url: e.target.value })}
                          placeholder="https://ejemplo.com/imagen.png"
                        />
                      )}

                      {/* Image preview */}
                      {charForm.image_url && (
                        <div className="relative inline-block mt-2">
                          <img 
                            src={charForm.image_url} 
                            alt="Vista previa" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                          <button
                            type="button"
                            onClick={clearCharImage}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">Si no hay imagen, se usará el color del token</p>
                    </div>

                    <div>
                      <Label className="text-xs">Color (usado si no hay imagen)</Label>
                      <div className="flex gap-1 mt-1">
                        {TOKEN_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setCharForm({ ...charForm, token_color: color })}
                            className={`w-6 h-6 rounded-full border-2 ${charForm.token_color === color ? 'border-foreground' : 'border-transparent'}`}
                            style={{ backgroundColor: color === 'black' ? '#1a1a1a' : color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tamaño: {charForm.token_size}px</Label>
                      <Slider
                        value={[charForm.token_size]}
                        onValueChange={(v) => setCharForm({ ...charForm, token_size: v[0] })}
                        min={20}
                        max={400}
                        step={5}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleCreateCharacter} className="w-full">Crear personaje</Button>
              </div>
            </DialogContent>
          </Dialog>

          <ScrollArea className="h-[300px]">
            {loadingChars ? (
              <p className="text-center text-muted-foreground py-4">Cargando...</p>
            ) : characters.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tienes personajes</p>
            ) : (
              <div className="space-y-2">
                {characters.map(char => (
                  <div key={char.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {char.image_url ? (
                          <img 
                            src={char.image_url} 
                            alt={char.name}
                            className="w-6 h-6 rounded-full border-2 border-foreground/30 object-cover"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-foreground/30"
                            style={{ backgroundColor: char.token_color === 'black' ? '#1a1a1a' : char.token_color }}
                          />
                        )}
                        <span className="font-semibold text-sm">{char.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAddCharacterToMap(char)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCharacter(char.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getRaceLabel(char.race)} {getClassLabel(char.class)} Nv.{char.level}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> CA {char.armor_class}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> PG {char.hit_points_max}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {char.speed}ft</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="monsters" className="space-y-3">
          <Dialog open={showNewMonster} onOpenChange={setShowNewMonster}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full gap-2" variant="secondary">
                <Plus className="w-4 h-4" />
                Nuevo monstruo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear monstruo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre</Label>
                    <Input value={monsterForm.name} onChange={(e) => setMonsterForm({ ...monsterForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>CR</Label>
                    <Select value={monsterForm.challenge_rating} onValueChange={(v) => setMonsterForm({ ...monsterForm, challenge_rating: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHALLENGE_RATINGS.map(cr => (
                          <SelectItem key={cr} value={cr}>{cr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={monsterForm.type} onValueChange={(v) => setMonsterForm({ ...monsterForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONSTER_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tamaño</Label>
                    <Select value={monsterForm.size} onValueChange={(v) => setMonsterForm({ ...monsterForm, size: v as CreatureSize })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CREATURE_SIZES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-2 block">Atributos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <AbilityScoreInput label="FUE" value={monsterForm.strength} onChange={(v) => setMonsterForm({ ...monsterForm, strength: v })} />
                    <AbilityScoreInput label="DES" value={monsterForm.dexterity} onChange={(v) => setMonsterForm({ ...monsterForm, dexterity: v })} />
                    <AbilityScoreInput label="CON" value={monsterForm.constitution} onChange={(v) => setMonsterForm({ ...monsterForm, constitution: v })} />
                    <AbilityScoreInput label="INT" value={monsterForm.intelligence} onChange={(v) => setMonsterForm({ ...monsterForm, intelligence: v })} />
                    <AbilityScoreInput label="SAB" value={monsterForm.wisdom} onChange={(v) => setMonsterForm({ ...monsterForm, wisdom: v })} />
                    <AbilityScoreInput label="CAR" value={monsterForm.charisma} onChange={(v) => setMonsterForm({ ...monsterForm, charisma: v })} />
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-2 block">Combate</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">CA</Label>
                      <Input type="number" value={monsterForm.armor_class} onChange={(e) => setMonsterForm({ ...monsterForm, armor_class: parseInt(e.target.value) || 10 })} />
                    </div>
                    <div>
                      <Label className="text-xs">PG</Label>
                      <Input type="number" value={monsterForm.hit_points} onChange={(e) => setMonsterForm({ ...monsterForm, hit_points: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <Label className="text-xs">Velocidad</Label>
                      <Input type="number" value={monsterForm.speed} onChange={(e) => setMonsterForm({ ...monsterForm, speed: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-2 block">Token</Label>
                  <div className="space-y-3">
                    {/* Image input */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs">Imagen (opcional)</Label>
                        <div className="flex gap-1 ml-auto">
                          <Button
                            type="button"
                            size="sm"
                            variant={monsterImageInputMode === 'upload' ? 'default' : 'outline'}
                            className="h-6 px-2 text-xs"
                            onClick={() => setMonsterImageInputMode('upload')}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Subir
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={monsterImageInputMode === 'url' ? 'default' : 'outline'}
                            className="h-6 px-2 text-xs"
                            onClick={() => setMonsterImageInputMode('url')}
                          >
                            <Link className="w-3 h-3 mr-1" />
                            URL
                          </Button>
                        </div>
                      </div>

                      {monsterImageInputMode === 'upload' ? (
                        <div className="space-y-2">
                          <input
                            ref={monsterFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleMonsterImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => monsterFileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4" />
                            Seleccionar imagen
                          </Button>
                        </div>
                      ) : (
                        <Input 
                          value={monsterForm.image_url.startsWith('data:') ? '' : monsterForm.image_url} 
                          onChange={(e) => setMonsterForm({ ...monsterForm, image_url: e.target.value })}
                          placeholder="https://ejemplo.com/imagen.png"
                        />
                      )}

                      {/* Image preview */}
                      {monsterForm.image_url && (
                        <div className="relative inline-block mt-2">
                          <img 
                            src={monsterForm.image_url} 
                            alt="Vista previa" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                          <button
                            type="button"
                            onClick={clearMonsterImage}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">Si no hay imagen, se usará el color del token</p>
                    </div>

                    <div>
                      <Label className="text-xs">Color (usado si no hay imagen)</Label>
                      <div className="flex gap-1 mt-1">
                        {TOKEN_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setMonsterForm({ ...monsterForm, token_color: color })}
                            className={`w-6 h-6 rounded-full border-2 ${monsterForm.token_color === color ? 'border-foreground' : 'border-transparent'}`}
                            style={{ backgroundColor: color === 'black' ? '#1a1a1a' : color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tamaño: {monsterForm.token_size}px</Label>
                      <Slider
                        value={[monsterForm.token_size]}
                        onValueChange={(v) => setMonsterForm({ ...monsterForm, token_size: v[0] })}
                        min={20}
                        max={400}
                        step={5}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleCreateMonster} className="w-full">Crear monstruo</Button>
              </div>
            </DialogContent>
          </Dialog>

          <ScrollArea className="h-[300px]">
            {loadingMonsters ? (
              <p className="text-center text-muted-foreground py-4">Cargando...</p>
            ) : monsters.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tienes monstruos</p>
            ) : (
              <div className="space-y-2">
                {monsters.map(monster => (
                  <div key={monster.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {monster.image_url ? (
                          <img 
                            src={monster.image_url} 
                            alt={monster.name}
                            className="w-6 h-6 rounded-full border-2 border-foreground/30 object-cover"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-foreground/30"
                            style={{ backgroundColor: monster.token_color === 'black' ? '#1a1a1a' : monster.token_color }}
                          />
                        )}
                        <span className="font-semibold text-sm">{monster.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAddMonsterToMap(monster)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMonster(monster.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getMonsterTypeLabel(monster.type)} {getCreatureSizeLabel(monster.size)} · CR {monster.challenge_rating}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> CA {monster.armor_class}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> PG {monster.hit_points}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {monster.speed}ft</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
