import { PlayerRoundData, RoundPlayerResult } from './types';
/**
 * Calcula los puntos de un jugador para una ronda.
 *
 * Tabla oficial:
 * ┌─────────────────────────────────────┬───────────────────────────┐
 * │ Situación                           │ Puntos                    │
 * ├─────────────────────────────────────┼───────────────────────────┤
 * │ Apuesta cumplida (bet > 0)          │ 10 + (5 × manos ganadas)  │
 * │ Apuesta 0 cumplida (ganó 0 manos)   │ 10                        │
 * │ Apuesta fallida (ganó > 0 manos)    │ 1 × manos ganadas         │
 * │ Apuesta fallida (ganó 0 manos)      │ 0                         │
 * └─────────────────────────────────────┴───────────────────────────┘
 */
export declare function calculateRoundScore(bet: number, tricksWon: number): number;
/**
 * Procesa los resultados de todos los jugadores al final de una ronda.
 * Actualiza los totales acumulados y devuelve el resumen.
 */
export declare function scoreRound(playerData: PlayerRoundData[], roundNumber: number): RoundPlayerResult[];
/**
 * Determina el ganador de la partida al finalizar la ronda 10.
 * En caso de empate: gana quien tenga más apuestas cumplidas
 * (criterio de desempate natural — puede ajustarse en la biblia).
 */
export declare function determineWinner(playerData: PlayerRoundData[], players: Array<{
    id: string;
    name: string;
}>): {
    winnerId: string;
    winnerName: string;
    totalScore: number;
};
//# sourceMappingURL=scoring.d.ts.map