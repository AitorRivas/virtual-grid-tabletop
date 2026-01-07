import { useState, useEffect } from 'react';
import { ExtendedCharacter, ExtendedMonster } from '@/types/dnd5e';

export interface CharacterTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'character';
  data: Partial<ExtendedCharacter>;
  createdAt: string;
}

export interface MonsterTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'monster';
  data: Partial<ExtendedMonster>;
  createdAt: string;
}

export type Template = CharacterTemplate | MonsterTemplate;

const STORAGE_KEY = 'dnd_templates';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates([]);
      }
    }
  }, []);

  // Save to localStorage whenever templates change
  const saveTemplates = (newTemplates: Template[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  };

  const createCharacterTemplate = (
    name: string,
    character: ExtendedCharacter,
    description?: string
  ): CharacterTemplate => {
    const template: CharacterTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      type: 'character',
      data: {
        race: character.race,
        class: character.class,
        subclass: character.subclass,
        background: character.background,
        alignment: character.alignment,
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
        proficiency_bonus: character.proficiency_bonus,
        proficiencies: character.proficiencies,
        features: character.features,
        equipment: character.equipment,
        actions: character.actions,
        spells: character.spells,
        speeds: character.speeds,
        spell_ability: character.spell_ability,
      },
      createdAt: new Date().toISOString(),
    };
    saveTemplates([...templates, template]);
    return template;
  };

  const createMonsterTemplate = (
    name: string,
    monster: ExtendedMonster,
    description?: string
  ): MonsterTemplate => {
    const template: MonsterTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      type: 'monster',
      data: {
        type: monster.type,
        size: monster.size,
        alignment: monster.alignment,
        challenge_rating: monster.challenge_rating,
        proficiency_bonus: monster.proficiency_bonus,
        strength: monster.strength,
        dexterity: monster.dexterity,
        constitution: monster.constitution,
        intelligence: monster.intelligence,
        wisdom: monster.wisdom,
        charisma: monster.charisma,
        armor_class: monster.armor_class,
        hit_points: monster.hit_points,
        hit_dice: monster.hit_dice,
        speed: monster.speed,
        speeds: monster.speeds,
        senses: monster.senses,
        languages: monster.languages,
        resistances: monster.resistances,
        immunities: monster.immunities,
        vulnerabilities: monster.vulnerabilities,
        saves: monster.saves,
        skills: monster.skills,
        traits: monster.traits,
        actions: monster.actions,
        bonus_actions: monster.bonus_actions,
        reactions: monster.reactions,
        legendary_actions: monster.legendary_actions,
        lair_actions: monster.lair_actions,
      },
      createdAt: new Date().toISOString(),
    };
    saveTemplates([...templates, template]);
    return template;
  };

  const deleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  };

  const getCharacterTemplates = (): CharacterTemplate[] => {
    return templates.filter((t): t is CharacterTemplate => t.type === 'character');
  };

  const getMonsterTemplates = (): MonsterTemplate[] => {
    return templates.filter((t): t is MonsterTemplate => t.type === 'monster');
  };

  const exportTemplates = () => {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dnd_templates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTemplates = (jsonData: string): boolean => {
    try {
      const imported = JSON.parse(jsonData) as Template[];
      if (!Array.isArray(imported)) return false;
      
      // Merge with existing, avoiding duplicates by ID
      const existingIds = new Set(templates.map(t => t.id));
      const newTemplates = imported.filter(t => !existingIds.has(t.id));
      saveTemplates([...templates, ...newTemplates]);
      return true;
    } catch {
      return false;
    }
  };

  return {
    templates,
    getCharacterTemplates,
    getMonsterTemplates,
    createCharacterTemplate,
    createMonsterTemplate,
    deleteTemplate,
    exportTemplates,
    importTemplates,
  };
};
