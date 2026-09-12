/**
 * Motor de dados centralizado del VTT.
 * Toda tirada de la aplicación debe pasar por aquí.
 */

export const MAX_DICE = 100;
export const ALLOWED_SIDES = [2, 3, 4, 6, 8, 10, 12, 20, 100] as const;
export const MAX_SIDES = 100;

export interface ParsedRoll {
  count: number;
  sides: number;
  modifier: number;
  expression: string;
}

export interface RollResult {
  expression: string;
  count: number;
  sides: number;
  modifier: number;
  rolls: number[];
  diceTotal: number;
  total: number;
  /** Media matemática esperada solo de los dados */
  averageDice: number;
  /** Media matemática esperada incluyendo el modificador */
  averageTotal: number;
}

export interface ParseError {
  error: string;
}

const EXPRESSION_RE = /^\s*(\d*)\s*[dD]\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/;

export const INVALID_FORMAT_MESSAGE =
  'Formato de tirada no válido. Utiliza 2d6, 1d20+5, etc.';

export function parseDiceExpression(input: string): ParsedRoll | ParseError {
  const match = EXPRESSION_RE.exec(input ?? '');
  if (!match) return { error: INVALID_FORMAT_MESSAGE };

  const count = match[1] === '' ? 1 : parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const sign = match[3] === '-' ? -1 : 1;
  const modifier = match[4] ? sign * parseInt(match[4], 10) : 0;

  if (count < 1) return { error: 'Debes lanzar al menos 1 dado.' };
  if (count > MAX_DICE) return { error: `Máximo ${MAX_DICE} dados por tirada.` };
  if (sides < 2) return { error: 'Un dado debe tener al menos 2 caras.' };
  if (sides > MAX_SIDES) return { error: `Máximo ${MAX_SIDES} caras por dado.` };

  return {
    count,
    sides,
    modifier,
    expression: `${count}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''}`,
  };
}

export function isParseError(v: ParsedRoll | ParseError): v is ParseError {
  return (v as ParseError).error !== undefined;
}

/** Aleatoriedad criptográfica sin sesgo por dado individual. */
function randomInt(sides: number): number {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const limit = Math.floor(0xffffffff / sides) * sides;
    const buf = new Uint32Array(1);
    let v = 0;
    do {
      cryptoObj.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return (v % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
}

/** Ejecuta una tirada a partir de una expresión ya parseada. */
export function rollParsed(parsed: ParsedRoll): RollResult {
  const rolls: number[] = [];
  for (let i = 0; i < parsed.count; i++) rolls.push(randomInt(parsed.sides));
  const diceTotal = rolls.reduce((a, b) => a + b, 0);
  const averageDice = parsed.count * ((parsed.sides + 1) / 2);
  return {
    expression: parsed.expression,
    count: parsed.count,
    sides: parsed.sides,
    modifier: parsed.modifier,
    rolls,
    diceTotal,
    total: diceTotal + parsed.modifier,
    averageDice,
    averageTotal: averageDice + parsed.modifier,
  };
}

/**
 * API principal: lanza una expresión tipo "8d8+3".
 * Devuelve el resultado o un error de validación.
 */
export function roll(expression: string): RollResult | ParseError {
  const parsed = parseDiceExpression(expression);
  if (isParseError(parsed)) return parsed;
  return rollParsed(parsed);
}

export function formatModifierValue(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function formatAverage(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace('.', ',');
}

export function isCriticalRoll(r: RollResult): boolean {
  return r.sides === 20 && r.count === 1 && r.rolls[0] === 20;
}

export function isFumbleRoll(r: RollResult): boolean {
  return r.sides === 20 && r.count === 1 && r.rolls[0] === 1;
}
