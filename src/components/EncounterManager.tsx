import { useState, useMemo } from 'react';
import { useEncounters } from '@/hooks/useEncounters';
import { useCharacters } from '@/hooks/useCharacters';
import { useExtendedMonsters } from '@/hooks/useExtendedMonsters';
import { Character, Monster } from '@/types/dnd';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Trash2, Pencil, Check, ChevronRight, ChevronDown, Swords, Skull, User, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface EncounterManagerProps {
  onAddCharacterToMap: (character: Character) => void;
  onAddMonsterToMap: (monster: Monster) => void;
}

export const EncounterManager = ({ onAddCharacterToMap, onAddMonsterToMap }: EncounterManagerProps) => {
  const {
    encounters, loading, createEncounter, renameEncounter, deleteEncounter,
    addEntity, updateQuantity, removeEntity, getEntries,
  } = useEncounters();
  const { characters } = useCharacters();
  const { monsters } = useExtendedMonsters();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [pickerOpenForId, setPickerOpenForId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const entityIndex = useMemo(() => {
    const map = new Map<string, { name: string; type: 'character' | 'monster'; ref: any }>();
    characters.forEach(c => map.set(`character:${c.id}`, { name: c.name, type: 'character', ref: c }));
    monsters.forEach(m => map.set(`monster:${m.id}`, { name: m.name, type: 'monster', ref: m }));
    return map;
  }, [characters, monsters]);

  const handleCreate = async () => {
    if (!newName.trim()) { setCreating(false); return; }
    const enc = await createEncounter(newName);
    setNewName('');
    setCreating(false);
    if (enc) setExpandedId(enc.id);
  };

  const deployEncounter = (encounterId: string) => {
    const items = getEntries(encounterId);
    if (items.length === 0) { toast.info('Encuentro vacío'); return; }
    let total = 0;
    items.forEach(item => {
      const found = entityIndex.get(`${item.entity_type}:${item.entity_id}`);
      if (!found) return;
      for (let i = 0; i < item.quantity; i++) {
        if (item.entity_type === 'character') onAddCharacterToMap(found.ref);
        else onAddMonsterToMap(found.ref);
        total++;
      }
    });
    toast.success(`Desplegados ${total} tokens en el mapa`);
  };

  const filteredChars = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return characters;
    return characters.filter(c => c.name.toLowerCase().includes(q));
  }, [characters, pickerSearch]);

  const filteredMonsters = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return monsters;
    return monsters.filter(m => m.name.toLowerCase().includes(q));
  }, [monsters, pickerSearch]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-2">
      {creating ? (
        <div className="flex gap-1.5">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
            placeholder="Nombre del encuentro"
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleCreate}><Check className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName(''); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button size="sm" className="w-full gap-2" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Nuevo encuentro
        </Button>
      )}

      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <p className="text-center text-muted-foreground py-4 text-xs">Cargando...</p>
        ) : encounters.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-xs">Sin encuentros. Crea uno para preparar grupos de combate.</p>
        ) : (
          <div className="space-y-1.5">
            {encounters.map(enc => {
              const items = getEntries(enc.id);
              const totalCount = items.reduce((s, i) => s + i.quantity, 0);
              const isExpanded = expandedId === enc.id;
              return (
                <div key={enc.id} className="rounded-md border border-border/50 bg-muted/30 overflow-hidden">
                  <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 transition-colors">
                    <button onClick={() => setExpandedId(isExpanded ? null : enc.id)} className="p-0.5">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <Swords className="w-3.5 h-3.5 text-primary shrink-0" />
                    {editingId === enc.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { renameEncounter(enc.id, editName); setEditingId(null); }
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="h-6 text-xs"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-5 w-5 p-0" onClick={() => { renameEncounter(enc.id, editName); setEditingId(null); }}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium truncate flex-1">{enc.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{totalCount} tokens</span>
                        <Button
                          size="icon" variant="ghost" className="h-6 w-6 p-0"
                          onClick={() => deployEncounter(enc.id)} title="Desplegar al mapa"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingId(enc.id); setEditName(enc.name); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => {
                          if (confirm(`¿Eliminar el encuentro "${enc.name}"?`)) deleteEncounter(enc.id);
                        }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-2 pb-2 space-y-1 border-t border-border/30">
                      {items.length === 0 && (
                        <p className="text-[10px] text-muted-foreground py-1.5 text-center">Sin entidades</p>
                      )}
                      {items.map(item => {
                        const found = entityIndex.get(`${item.entity_type}:${item.entity_id}`);
                        return (
                          <div key={item.id} className="flex items-center gap-1.5 text-xs py-0.5">
                            {item.entity_type === 'monster'
                              ? <Skull className="w-3 h-3 text-destructive shrink-0" />
                              : <User className="w-3 h-3 text-primary shrink-0" />}
                            <span className={cn('truncate flex-1', !found && 'italic text-muted-foreground')}>
                              {found?.name ?? '(eliminado)'}
                            </span>
                            <Input
                              type="number" min={1} value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="h-5 w-12 text-[10px] px-1 text-center"
                            />
                            <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => removeEntity(item.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}

                      <Dialog open={pickerOpenForId === enc.id} onOpenChange={(o) => { setPickerOpenForId(o ? enc.id : null); if (!o) setPickerSearch(''); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 mt-1">
                            <Plus className="w-3 h-3" /> Añadir entidad
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader><DialogTitle>Añadir a "{enc.name}"</DialogTitle></DialogHeader>
                          <Input
                            placeholder="Buscar..."
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                            className="mb-2"
                          />
                          <Tabs defaultValue="monsters">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="monsters"><Skull className="w-3 h-3 mr-1" /> Monstruos</TabsTrigger>
                              <TabsTrigger value="characters"><User className="w-3 h-3 mr-1" /> Personajes</TabsTrigger>
                            </TabsList>
                            <TabsContent value="monsters">
                              <ScrollArea className="h-72">
                                <div className="space-y-1">
                                  {filteredMonsters.map(m => (
                                    <button
                                      key={m.id}
                                      onClick={() => addEntity(enc.id, m.id, 'monster', 1)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                                    >
                                      <Skull className="w-3.5 h-3.5 text-destructive" />
                                      <span className="flex-1 truncate">{m.name}</span>
                                      <span className="text-[10px] text-muted-foreground">CR {m.challenge_rating}</span>
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </TabsContent>
                            <TabsContent value="characters">
                              <ScrollArea className="h-72">
                                <div className="space-y-1">
                                  {filteredChars.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => addEntity(enc.id, c.id, 'character', 1)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                                    >
                                      <User className="w-3.5 h-3.5 text-primary" />
                                      <span className="flex-1 truncate">{c.name}</span>
                                      <span className="text-[10px] text-muted-foreground">Nv.{c.level}</span>
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
