import { useEffect, useState } from 'react';
import { useCharacters } from '@/hooks/useCharacters';
import { useExtendedMonsters } from '@/hooks/useExtendedMonsters';
import { CharacterSheet } from './character-sheet';
import { MonsterSheet } from './monster-sheet';
import type { ExtendedCharacter, ExtendedMonster } from '@/types/dnd5e';

/**
 * Listens for global `vtt:open-character-sheet` and `vtt:open-monster-sheet`
 * CustomEvents and opens the corresponding D&D sheet in read-only mode,
 * regardless of which sidebar tab is currently active.
 *
 * Mount once at the top of the GM view.
 */
export const GlobalSheetOpener = () => {
  const { characters, updateCharacter } = useCharacters();
  const { monsters, updateMonster } = useExtendedMonsters();
  const [character, setCharacter] = useState<ExtendedCharacter | null>(null);
  const [monster, setMonster] = useState<ExtendedMonster | null>(null);

  useEffect(() => {
    const openCharacter = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const c = characters.find(x => x.id === id);
      if (c) setCharacter(c as ExtendedCharacter);
    };
    const openMonster = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const m = monsters.find(x => x.id === id);
      if (m) setMonster(m as ExtendedMonster);
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
      {character && (
        <CharacterSheet
          character={character}
          onClose={() => setCharacter(null)}
          onSave={async (updated) => {
            const ok = await updateCharacter(character.id, updated);
            return !!ok;
          }}
        />
      )}
      {monster && (
        <MonsterSheet
          monster={monster}
          onClose={() => setMonster(null)}
          onSave={async (updated) => {
            const ok = await updateMonster(monster.id, updated);
            return !!ok;
          }}
        />
      )}
    </>
  );
};
