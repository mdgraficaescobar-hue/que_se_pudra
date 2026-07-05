import { Trick, TrickPlay } from './types';
export interface TrickResolution {
    winnerId: string;
    winningPlay: TrickPlay;
    /** Todas las jugadas ordenadas por valor desc (para log/UI) */
    rankedPlays: TrickPlay[];
}
/**
 * Resuelve quién gana una mano.
 *
 * Reglas:
 * 1. Gana la carta de mayor valor.
 * 2. En caso de empate entre máximos: gana el jugador más cercano
 *    a la Mano en sentido horario.
 *
 * "Más cercano a la Mano" = menor seatIndex RELATIVO al dealerSeat,
 * contando en sentido horario (circular).
 */
export declare function resolveTrick(trick: Trick, dealerSeat: number, totalPlayers: number): TrickResolution;
/**
 * Distancia circular en sentido horario desde `from` hasta `to`.
 * Ejemplo con 4 jugadores: from=3, to=1 → distancia=2 (3→0→1)
 */
export declare function circularDistance(from: number, to: number, total: number): number;
/**
 * Registra el resultado de una mano en los datos de los jugadores.
 * Incrementa el contador de manos ganadas del ganador.
 */
export declare function applyTrickResult(winnerId: string, playerData: Array<{
    playerId: string;
    tricksWon: number;
}>): void;
