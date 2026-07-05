import { GameSnapshot } from '../engine/types';
/**
 * Decide cuánto apuesta el bot.
 *
 * Estrategia normal:
 * - Estima cuántas manos puede ganar según el valor de sus cartas.
 * - Si la apuesta estimada está prohibida, ajusta +1 o -1.
 * - Siempre apuesta dentro del rango válido.
 */
export declare function botDecideBet(botId: string, snapshot: GameSnapshot, validBets: number[]): number;
/**
 * Decide qué carta juega el bot.
 *
 * Estrategia normal:
 * - Si necesita ganar manos (tricks restantes < manos faltantes): juega la más alta.
 * - Si ya cumplió su apuesta: juega la más baja para no ganar manos extra.
 * - Si es la primera carta de la mano: juega carta media.
 */
export declare function botDecideCard(botId: string, snapshot: GameSnapshot): number;
/**
 * Delay simulado para que el bot no juegue instantáneo.
 * Humaniza la experiencia.
 */
export declare function botThinkTime(baseMs?: number): number;
