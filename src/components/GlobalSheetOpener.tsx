import { useEffect, useState } from 'react';
import { useCharacters } from '@/hooks/useCharacters';
import { useExtendedMonsters } from '@/hooks/useExtendedMonsters';
import { CharacterSheet } from './character-sheet';
import { MonsterSheet } from './monster-sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { ExtendedCharacter, ExtendedMonster } from '@/types/dnd5e';

/**
 * Listens for global `vtt:open-character-sheet` and `vtt:open-monster-sheet`
 * CustomEvents and opens the corresponding D&D sheet in read-only mode,
 * regardless of which sidebar tab is currently active.
 *
 * Event detail accepts either a string (id only) or { id, tab } to open on a
 * specific tab (e.g. 'actions' for context-menu "Atacar").
 *
 * Mount once at the top of the GM view (and once in PlayerView for player-side
 * "Ver ficha" via right-click).
 */
type SheetEventDetail = string | { id: string; tab?: string };

const parseDetail = (e: Event): { id: string; tab?: string } | null => {
  const d = (e as CustomEvent<SheetEventDetail>).detail;
  if (!d) return null;
  if (typeof d === 'string') return { id: d };
  if (typeof d === 'object' && typeof d.id === 'string') return { id: d.id, tab: d.tab };
  return null;
};

export const GlobalSheetOpener = () => {
  const { characters, updateCharacter } = useCharacters();
  const { monsters, updateMonster } = useExtendedMonsters();
  const [character, setCharacter] = useState<ExtendedCharacter | null>(null);
  const [characterTab, setCharacterTab] = useState<string | undefined>(undefined);
  const [monster, setMonster] = useState<ExtendedMonster | null>(null);
  const [monsterTab, setMonsterTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    const openCharacter = (e: Event) => {
      const payload = parseDetail(e);
      if (!payload) return;
      const c = characters.find(x => x.id === payload.id);
      if (c) {
        setCharacterTab(payload.tab);
        setCharacter(c as ExtendedCharacter);
      }
    };
    const openMonster = (e: Event) => {
      const payload = parseDetail(e);
      if (!payload) return;
      const m = monsters.find(x => x.id === payload.id);
      if (m) {
        setMonsterTab(payload.tab);
        setMonster(m as ExtendedMonster);
      }
    };
    window.addEventListener('vtt:open-character-sheet', openCharacter);
    window.addEventListener('vtt:open-monster-sheet', openMonster);
    return () => {
      window.removeEventListener('vtt:open-character-sheet', openCharacter);
      window.removeEventListener('vtt:open-monster-sheet', openMonster);
    };
  }, [characters, monsters]);

  return (
    <>
      <Dialog open={!!character} onOpenChange={(o) => !o && setCharacter(null)}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden [&>button]:hidden">
          {character && (
            <CharacterSheet
              key={`${character.id}-${characterTab ?? 'default'}`}
              character={character}
              initialTab={characterTab}
              onClose={() => setCharacter(null)}
              onSave={async (updated) => {
                const ok = await updateCharacter(character.id, updated as any);
                return !!ok;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!monster} onOpenChange={(o) => !o && setMonster(null)}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden [&>button]:hidden">
          {monster && (
            <MonsterSheet
              key={`${monster.id}-${monsterTab ?? 'default'}`}
              monster={monster}
              initialTab={monsterTab}
              onClose={() => setMonster(null)}
              onSave={async (updated) => {
                const ok = await updateMonster(monster.id, updated as any);
                return !!ok;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
