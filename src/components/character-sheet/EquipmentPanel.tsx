import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Shield, Swords, Package, Sparkles } from 'lucide-react';
import { getModifier, formatModifier } from '@/types/dnd';
import { 
  EquipmentItem, 
  EquipmentType, 
  ArmorType,
  DAMAGE_TYPES,
  getWeaponAttackBonus,
  getWeaponDamageBonus,
  formatDamage
} from '@/types/dnd5e';

interface EquipmentPanelProps {
  equipment: EquipmentItem[];
  abilities: {
    strength: number;
    dexterity: number;
  };
  proficiencyBonus: number;
  onChange: (equipment: EquipmentItem[]) => void;
  readOnly?: boolean;
}

const EQUIPMENT_TYPES: { value: EquipmentType; label: string; icon: React.ReactNode }[] = [
  { value: 'weapon', label: 'Arma', icon: <Swords className="w-3 h-3" /> },
  { value: 'armor', label: 'Armadura', icon: <Shield className="w-3 h-3" /> },
  { value: 'shield', label: 'Escudo', icon: <Shield className="w-3 h-3" /> },
  { value: 'gear', label: 'Equipo', icon: <Package className="w-3 h-3" /> },
  { value: 'magic_item', label: 'Objeto mágico', icon: <Sparkles className="w-3 h-3" /> },
  { value: 'consumable', label: 'Consumible', icon: <Package className="w-3 h-3" /> },
];

const ARMOR_TYPES: { value: ArmorType; label: string }[] = [
  { value: 'light', label: 'Ligera' },
  { value: 'medium', label: 'Media' },
  { value: 'heavy', label: 'Pesada' },
  { value: 'shield', label: 'Escudo' },
];

const emptyItem: Omit<EquipmentItem, 'id'> = {
  name: '',
  type: 'gear',
  quantity: 1,
  equipped: false,
};

export const EquipmentPanel = ({
  equipment,
  abilities,
  proficiencyBonus,
  onChange,
  readOnly = false
}: EquipmentPanelProps) => {
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItem, setNewItem] = useState<Omit<EquipmentItem, 'id'>>(emptyItem);

  const strMod = getModifier(abilities.strength);
  const dexMod = getModifier(abilities.dexterity);

  const addItem = () => {
    if (!newItem.name.trim()) return;
    const item: EquipmentItem = {
      ...newItem,
      id: crypto.randomUUID(),
    };
    onChange([...equipment, item]);
    setNewItem(emptyItem);
    setShowNewItem(false);
  };

  const deleteItem = (id: string) => {
    onChange(equipment.filter(e => e.id !== id));
  };

  const toggleEquipped = (id: string) => {
    onChange(equipment.map(e => 
      e.id === id ? { ...e, equipped: !e.equipped } : e
    ));
  };

  const getItemStats = (item: EquipmentItem): string => {
    if (item.type === 'weapon' && item.damage_dice) {
      const attackBonus = getWeaponAttackBonus(item, strMod, dexMod, proficiencyBonus);
      const damageBonus = getWeaponDamageBonus(item, strMod, dexMod);
      const damageType = DAMAGE_TYPES.find(d => d.value === item.damage_type)?.label || '';
      return `${formatModifier(attackBonus)} | ${formatDamage(item.damage_dice, damageBonus)} ${damageType}`;
    }
    if ((item.type === 'armor' || item.type === 'shield') && item.ac_base) {
      return `CA ${item.ac_base}${item.attack_bonus ? ` (+${item.attack_bonus})` : ''}`;
    }
    return '';
  };

  const groupedEquipment = EQUIPMENT_TYPES.reduce((acc, type) => {
    acc[type.value] = equipment.filter(e => e.type === type.value);
    return acc;
  }, {} as Record<EquipmentType, EquipmentItem[]>);

  return (
    <div className="space-y-3">
      {/* Add Item Button */}
      {!readOnly && (
        <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Añadir Objeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Añadir Objeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Espada larga +1"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(v) => setNewItem({ ...newItem, type: v as EquipmentType })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Checkbox
                    id="equipped"
                    checked={newItem.equipped}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, equipped: !!checked })}
                  />
                  <Label htmlFor="equipped">Equipado</Label>
                </div>
              </div>

              {/* Weapon Fields */}
              {newItem.type === 'weapon' && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <h4 className="text-sm font-semibold">Propiedades del arma</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Dados de daño</Label>
                      <Input
                        value={newItem.damage_dice || ''}
                        onChange={(e) => setNewItem({ ...newItem, damage_dice: e.target.value })}
                        placeholder="1d8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de daño</Label>
                      <Select
                        value={newItem.damage_type || ''}
                        onValueChange={(v) => setNewItem({ ...newItem, damage_type: v as any })}
                      >
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                          {DAMAGE_TYPES.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Bonus mágico ataque</Label>
                      <Input
                        type="number"
                        value={newItem.attack_bonus || ''}
                        onChange={(e) => setNewItem({ ...newItem, attack_bonus: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bonus mágico daño</Label>
                      <Input
                        type="number"
                        value={newItem.damage_bonus || ''}
                        onChange={(e) => setNewItem({ ...newItem, damage_bonus: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Alcance</Label>
                    <Input
                      value={newItem.range || ''}
                      onChange={(e) => setNewItem({ ...newItem, range: e.target.value })}
                      placeholder="5 pies"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={newItem.properties?.includes('finesse')}
                      onCheckedChange={(checked) => {
                        const props = newItem.properties || [];
                        setNewItem({
                          ...newItem,
                          properties: checked 
                            ? [...props, 'finesse'] 
                            : props.filter(p => p !== 'finesse')
                        });
                      }}
                    />
                    <Label className="text-xs">Sutileza (usa DES si es mayor)</Label>
                  </div>
                </div>
              )}

              {/* Armor Fields */}
              {(newItem.type === 'armor' || newItem.type === 'shield') && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <h4 className="text-sm font-semibold">Propiedades de armadura</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tipo de armadura</Label>
                      <Select
                        value={newItem.armor_type || ''}
                        onValueChange={(v) => setNewItem({ ...newItem, armor_type: v as ArmorType })}
                      >
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                          {ARMOR_TYPES.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">CA base</Label>
                      <Input
                        type="number"
                        value={newItem.ac_base || ''}
                        onChange={(e) => setNewItem({ ...newItem, ac_base: parseInt(e.target.value) || 0 })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Máx. DES bonus</Label>
                      <Input
                        type="number"
                        value={newItem.ac_max_dex ?? ''}
                        onChange={(e) => setNewItem({ 
                          ...newItem, 
                          ac_max_dex: e.target.value === '' ? null : parseInt(e.target.value) 
                        })}
                        placeholder="∞"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bonus mágico</Label>
                      <Input
                        type="number"
                        value={newItem.attack_bonus || ''}
                        onChange={(e) => setNewItem({ ...newItem, attack_bonus: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={addItem} className="w-full">Añadir</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Equipment List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-2">
          {EQUIPMENT_TYPES.map(type => {
            const items = groupedEquipment[type.value] || [];
            if (items.length === 0) return null;

            return (
              <div key={type.value}>
                <div className="flex items-center gap-2 mb-1">
                  {type.icon}
                  <span className="text-xs font-semibold text-muted-foreground uppercase">{type.label}</span>
                </div>
                <div className="space-y-1">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        item.equipped ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                      }`}
                    >
                      {!readOnly && (
                        <Checkbox
                          checked={item.equipped}
                          onCheckedChange={() => toggleEquipped(item.id)}
                          className="h-4 w-4"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                          )}
                        </div>
                        {getItemStats(item) && (
                          <span className="text-xs text-muted-foreground">{getItemStats(item)}</span>
                        )}
                      </div>
                      {!readOnly && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {equipment.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin equipo
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
