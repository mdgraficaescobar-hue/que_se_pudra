import { PlayerRoundData } from './types';
export interface BetValidationResult {
    valid: boolean;
    reason?: string;
}
/**
 * Valida si un jugador puede apostar `bet` manos.
 *
 * Reglas:
 * 1. La apuesta debe ser un entero >= 0.
 * 2. La apuesta no puede superar el total de cartas de la ronda.
 * 3. REGLA DE SUMA PROHIBIDA: si este es el ÚLTIMO apostador,
 *    su apuesta no puede hacer que la suma total === cardsInRound.
 */
export declare function validateBet(bet: number, playerId: string, playerData: PlayerRoundData[], cardsInRound: number, isLastBettor: boolean): BetValidationResult;
/**
 * Determina si un jugador es el último en apostar.
 */
export declare function isLastBettor(playerId: string, bettingOrder: string[], playerData: PlayerRoundData[]): boolean;
/**
 * Devuelve el rango de apuestas válidas para el último apostador.
 * Útil para mostrar en la UI qué valores están permitidos.
 */
export declare function validBetsForLastBettor(playerData: PlayerRoundData[], lastBettorId: string, cardsInRound: number): number[];
