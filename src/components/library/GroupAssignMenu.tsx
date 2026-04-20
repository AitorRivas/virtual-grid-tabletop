import { useState } from 'react';
import { useLibraryGroups } from '@/hooks/useLibraryGroups';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Folder } from 'lucide-react';

interface GroupAssignMenuProps {
  entityId: string;
  entityType: 'character' | 'monster';
}

export const GroupAssignMenu = ({ entityId, entityType }: GroupAssignMenuProps) => {
  const { groups, getGroupsForEntity, setEntityGroups } = useLibraryGroups();
  const [open, setOpen] = useState(false);
  const current = getGroupsForEntity(entityId, entityType);

  const toggle = async (groupId: string) => {
    const next = current.includes(groupId)
      ? current.filter(id => id !== groupId)
      : [...current, groupId];
    await setEntityGroups(entityId, entityType, next);
  };

  if (groups.length === 0) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 relative"
          title={current.length ? `En ${current.length} grupo(s)` : 'Asignar a grupos'}
        >
          <Folder className="w-4 h-4" />
          {current.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">
              {current.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Grupos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups.map(g => (
          <DropdownMenuCheckboxItem
            key={g.id}
            checked={current.includes(g.id)}
            onCheckedChange={() => toggle(g.id)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: g.color }} />
            {g.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
