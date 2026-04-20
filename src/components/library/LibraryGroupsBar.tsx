import { useState } from 'react';
import { useLibraryGroups, LibraryGroup } from '@/hooks/useLibraryGroups';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Folder, FolderOpen, X, Pencil, Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface LibraryGroupsBarProps {
  /** null = "Todos", "__none__" = sin grupo, otherwise group id */
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
}

export const LibraryGroupsBar = ({ selectedGroupId, onSelectGroup }: LibraryGroupsBarProps) => {
  const { groups, createGroup, renameGroup, deleteGroup } = useLibraryGroups();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) { setCreating(false); return; }
    await createGroup(newName);
    setNewName('');
    setCreating(false);
  };

  const startEdit = (g: LibraryGroup) => {
    setEditingId(g.id);
    setEditName(g.name);
  };

  const confirmEdit = async () => {
    if (editingId && editName.trim()) await renameGroup(editingId, editName);
    setEditingId(null);
  };

  const Pill = ({
    active, onClick, icon: Icon, label, color, onEdit, onDelete, isEditing, editValue, setEditValue, onConfirmEdit,
  }: any) => (
    <div className={cn(
      'group/pill flex items-center gap-1 rounded-md border text-xs whitespace-nowrap shrink-0 transition-colors',
      active ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/40 border-border/40 hover:border-primary/30',
    )}>
      {isEditing ? (
        <div className="flex items-center gap-1 px-1.5 py-1">
          <Input
            value={editValue}
            onChange={(e: any) => setEditValue(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter') onConfirmEdit(); if (e.key === 'Escape') setEditingId(null); }}
            className="h-5 text-xs px-1 w-24"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-5 w-5 p-0" onClick={onConfirmEdit}>
            <Check className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1 pl-2 pr-1 py-1"
          >
            {color && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            )}
            {Icon && <Icon className="w-3 h-3" />}
            <span>{label}</span>
          </button>
          {onEdit && (
            <div className="flex items-center pr-1 opacity-0 group-hover/pill:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-4 w-4 p-0" onClick={onEdit} title="Renombrar">
                <Pencil className="w-2.5 h-2.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-4 w-4 p-0 text-destructive" onClick={onDelete} title="Eliminar grupo">
                <X className="w-2.5 h-2.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      <Pill
        active={selectedGroupId === null}
        onClick={() => onSelectGroup(null)}
        icon={Layers}
        label="Todos"
      />
      <Pill
        active={selectedGroupId === '__none__'}
        onClick={() => onSelectGroup('__none__')}
        icon={Folder}
        label="Sin grupo"
      />
      {groups.map(g => (
        <Pill
          key={g.id}
          active={selectedGroupId === g.id}
          onClick={() => onSelectGroup(g.id)}
          icon={selectedGroupId === g.id ? FolderOpen : Folder}
          label={g.name}
          color={g.color}
          isEditing={editingId === g.id}
          editValue={editName}
          setEditValue={setEditName}
          onConfirmEdit={confirmEdit}
          onEdit={(e: any) => { e.stopPropagation(); startEdit(g); }}
          onDelete={(e: any) => {
            e.stopPropagation();
            if (confirm(`¿Eliminar el grupo "${g.name}"? Las entidades no se borran.`)) {
              deleteGroup(g.id);
              if (selectedGroupId === g.id) onSelectGroup(null);
            }
          }}
        />
      ))}
      {creating ? (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
            placeholder="Nombre"
            className="h-6 text-xs w-28"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-6 w-6 p-0" onClick={handleCreate}>
            <Check className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => setCreating(true)}>
              <Plus className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Nuevo grupo</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
