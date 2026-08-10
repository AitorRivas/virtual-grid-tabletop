import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

export const CREATURE_BUCKET = 'creature-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10; // ~10 años

export type ImportRowStatus = 'new' | 'existing' | 'updatable' | 'error';

export interface ParsedCreature {
  /** Datos crudos de la criatura tal y como vienen del conversor. */
  data: Record<string, any>;
  name: string;
  source: string;
  external_id: string;
  key: string;
  status: ImportRowStatus;
  /** id interno de la criatura ya existente en la Biblioteca (si la hay). */
  existingId?: string;
  error?: string;
  imageFile?: string;
  tokenFile?: string;
}

export interface ParsedBatch {
  fileName: string;
  source: string;
  creatures: ParsedCreature[];
  zip: JSZip;
  images: Record<string, JSZip.JSZipObject>;
  tokens: Record<string, JSZip.JSZipObject>;
  counts: { total: number; new: number; existing: number; updatable: number; errors: number };
}

const baseName = (path: string) => path.split('/').pop() || path;
const stripExt = (name: string) => name.replace(/\.[^.]+$/, '');

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'archivo';

/** Campos que NO se comparan / no se sobreescriben al actualizar. */
const IGNORED_FIELDS = new Set([
  'id', 'user_id', 'created_at', 'updated_at',
]);

/** Normaliza una criatura del lote al modelo de la Biblioteca (sin tocar el modelo actual). */
export const normalizeCreature = (raw: Record<string, any>) => {
  const num = (v: any, fallback: number) => (typeof v === 'number' && !Number.isNaN(v) ? v : fallback);
  return {
    name: String(raw.name ?? '').trim(),
    type: String(raw.type ?? 'Beast'),
    subtype: raw.subtype ?? null,
    size: String(raw.size ?? 'medium').toLowerCase(),
    alignment: raw.alignment ?? null,
    challenge_rating: String(raw.challenge_rating ?? '1'),
    xp: raw.xp ?? null,
    proficiency_bonus: num(raw.proficiency_bonus, 2),
    strength: num(raw.strength, 10),
    dexterity: num(raw.dexterity, 10),
    constitution: num(raw.constitution, 10),
    intelligence: num(raw.intelligence, 10),
    wisdom: num(raw.wisdom, 10),
    charisma: num(raw.charisma, 10),
    armor_class: num(raw.armor_class, 10),
    hit_points: num(raw.hit_points, 10),
    hit_dice: raw.hit_dice ?? null,
    initiative_bonus: num(raw.initiative_bonus, 0),
    speed: num(raw.speed, 30),
    speeds: raw.speeds ?? { walk: num(raw.speed, 30) },
    senses: raw.senses ?? { passive_perception: 10 },
    languages: raw.languages ?? [],
    resistances: raw.resistances ?? { damage: [], conditions: [] },
    immunities: raw.immunities ?? { damage: [], conditions: [] },
    vulnerabilities: raw.vulnerabilities ?? [],
    defense_notes: raw.defense_notes ?? {},
    saves: raw.saves ?? [],
    skills: raw.skills ?? [],
    traits: raw.traits ?? [],
    actions: raw.actions ?? [],
    bonus_actions: raw.bonus_actions ?? [],
    reactions: raw.reactions ?? [],
    legendary_actions: raw.legendary_actions ?? { count: 0, actions: [] },
    lair_actions: raw.lair_actions ?? [],
    mythic_actions: raw.mythic_actions ?? { trigger: null, actions: [] },
    spellcasting: raw.spellcasting ?? null,
    special_equipment: raw.special_equipment ?? [],
    token_color: raw.token_color ?? 'red',
    token_size: num(raw.token_size, 100),
    notes: raw.notes ?? null,
    source_version: raw.source_version ?? null,
  } as Record<string, any>;
};

const stableStringify = (value: any): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).filter(k => !IGNORED_FIELDS.has(k)).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
};

const differs = (incoming: Record<string, any>, existing: Record<string, any>) =>
  Object.keys(incoming).some(key => stableStringify(incoming[key]) !== stableStringify(existing?.[key]));

interface ExistingRef { id: string; row: Record<string, any> }

/** Lee el ZIP, clasifica las criaturas y devuelve una vista previa. */
export const parseBestiaryZip = async (
  file: File,
  existing: Record<string, any>[],
): Promise<ParsedBatch> => {
  const zip = await JSZip.loadAsync(file);

  const creaturesEntry = Object.values(zip.files).find(
    f => !f.dir && baseName(f.name).toLowerCase() === 'creatures.json',
  );
  if (!creaturesEntry) {
    throw new Error('El ZIP no contiene un archivo creatures.json');
  }

  const rawText = await creaturesEntry.async('string');
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('creatures.json no es un JSON válido');
  }

  const list: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.creatures)
      ? parsed.creatures
      : Array.isArray(parsed?.monsters)
        ? parsed.monsters
        : [];

  const batchSource: string = parsed?.source || list[0]?.source || 'desconocido';

  const images: Record<string, JSZip.JSZipObject> = {};
  const tokens: Record<string, JSZip.JSZipObject> = {};
  Object.values(zip.files).forEach(f => {
    if (f.dir) return;
    const lower = f.name.toLowerCase();
    if (lower.includes('images/')) images[stripExt(baseName(lower))] = f;
    else if (lower.includes('tokens/')) tokens[stripExt(baseName(lower))] = f;
  });

  const existingMap = new Map<string, ExistingRef>();
  existing.forEach(row => {
    if (row.source && row.external_id) {
      existingMap.set(`${row.source}::${row.external_id}`, { id: row.id, row });
    }
  });

  const creatures: ParsedCreature[] = list.map((raw, index) => {
    const source = String(raw?.source ?? batchSource ?? '').trim();
    const externalId = String(raw?.external_id ?? '').trim();
    const name = String(raw?.name ?? `Criatura ${index + 1}`);

    if (!raw?.name || !source || !externalId) {
      return {
        data: raw ?? {},
        name,
        source,
        external_id: externalId,
        key: `${source}::${externalId}::${index}`,
        status: 'error',
        error: 'Faltan campos obligatorios (name, source o external_id)',
      };
    }

    const key = `${source}::${externalId}`;
    const found = existingMap.get(key);
    const normalized = normalizeCreature(raw);

    let status: ImportRowStatus = 'new';
    if (found) status = differs(normalized, found.row) ? 'updatable' : 'existing';

    const norm = (v: string) => stripExt(baseName(String(v).toLowerCase()));
    // La ilustración principal y el token son recursos independientes: se buscan
    // en carpetas distintas (images/ y tokens/) y con sus propias claves.
    const imageLookups = [raw.image_file, raw.image, externalId, name].filter(Boolean).map(norm);
    const tokenLookups = [raw.token_file, raw.token, externalId, name].filter(Boolean).map(norm);

    const imageFile = imageLookups.map(k => (images[k] ? images[k].name : null)).find(Boolean) || undefined;
    const tokenFile = tokenLookups.map(k => (tokens[k] ? tokens[k].name : null)).find(Boolean) || undefined;


    return {
      data: raw,
      name,
      source,
      external_id: externalId,
      key,
      status,
      existingId: found?.id,
      imageFile,
      tokenFile,
    };
  });

  return {
    fileName: file.name,
    source: batchSource,
    creatures,
    zip,
    images,
    tokens,
    counts: {
      total: creatures.length,
      new: creatures.filter(c => c.status === 'new').length,
      existing: creatures.filter(c => c.status === 'existing').length,
      updatable: creatures.filter(c => c.status === 'updatable').length,
      errors: creatures.filter(c => c.status === 'error').length,
    },
  };
};

const uploadAsset = async (
  zip: JSZip,
  path: string | undefined,
  userId: string,
  source: string,
  externalId: string,
  kind: 'image' | 'token',
): Promise<string | null> => {
  if (!path) return null;
  const entry = zip.file(path);
  if (!entry) return null;
  try {
    const blob = await entry.async('blob');
    const ext = (baseName(path).match(/\.[^.]+$/)?.[0] || '.png').toLowerCase();
    const storagePath = `${userId}/${slug(source)}/${slug(externalId)}-${kind}${ext}`;
    const { error } = await supabase.storage
      .from(CREATURE_BUCKET)
      .upload(storagePath, blob, { upsert: true, contentType: blob.type || 'image/png' });
    if (error) return null;
    const { data } = await supabase.storage
      .from(CREATURE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
};

export interface ImportError { name: string; external_id: string; message: string }

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface RunImportOptions {
  batch: ParsedBatch;
  userId: string;
  /** claves (source::external_id) que deben actualizarse */
  updateKeys: Set<string>;
  onProgress: (done: number, total: number) => void;
}

const CHUNK_SIZE = 5;

export const runBestiaryImport = async ({
  batch,
  userId,
  updateKeys,
  onProgress,
}: RunImportOptions): Promise<ImportResult> => {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const queue = batch.creatures;
  const total = queue.length;
  let done = 0;

  for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
    const chunk = queue.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async creature => {
        try {
          if (creature.status === 'error') {
            result.errors.push({
              name: creature.name,
              external_id: creature.external_id,
              message: creature.error || 'Criatura inválida',
            });
            return;
          }

          const shouldUpdate = creature.existingId && updateKeys.has(creature.key);
          if (creature.existingId && !shouldUpdate) {
            result.skipped += 1;
            return;
          }

          const payload = normalizeCreature(creature.data);
          const [imageUrl, tokenUrl] = await Promise.all([
            uploadAsset(batch.zip, creature.imageFile, userId, creature.source, creature.external_id, 'image'),
            uploadAsset(batch.zip, creature.tokenFile, userId, creature.source, creature.external_id, 'token'),
          ]);

          const row: Record<string, any> = {
            ...payload,
            user_id: userId,
            source: creature.source,
            external_id: creature.external_id,
            is_public: true,
          };
          if (imageUrl) row.image_url = imageUrl;
          if (tokenUrl) row.token_image_url = tokenUrl;

          if (shouldUpdate) {
            const { error } = await supabase
              .from('monsters')
              .update(row as any)
              .eq('id', creature.existingId!);
            if (error) throw new Error(error.message);
            result.updated += 1;
          } else {
            const { error } = await supabase.from('monsters').insert(row as any);
            if (error) throw new Error(error.message);
            result.created += 1;
          }
        } catch (err: any) {
          result.errors.push({
            name: creature.name,
            external_id: creature.external_id,
            message: err?.message || 'Error desconocido',
          });
        } finally {
          done += 1;
          onProgress(done, total);
        }
      }),
    );

    // Cede el hilo para no bloquear la interfaz entre lotes
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return result;
};
