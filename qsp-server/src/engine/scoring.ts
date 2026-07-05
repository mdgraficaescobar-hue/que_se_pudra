// ─────────────────────────────────────────────
//  QSP ENGINE — PUNTUACIÓN
// ─────────────────────────────────────────────

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
export function calculateRoundScore(bet: number, tricksWon: number): number {
  const betFulfilled = bet === tricksWon;

  if (betFulfilled) {
    // Apuesta 0 cumplida → 10. Apuesta > 0 cumplida → 10 + 5*bet
    return bet === 0 ? 10 : 10 + 5 * bet;
  }

  // Apuesta fallida
  return tricksWon > 0 ? tricksWon : 0;
}

/**
 * Procesa los resultados de todos los jugadores al final de una ronda.
 * Actualiza los totales acumulados y devuelve el resumen.
 */
export function scoreRound(
  playerData: PlayerRoundData[],
  roundNumber: number,
): RoundPlayerResult[] {
  return playerData.map(p => {
    if (p.bet === null) {
      throw new Error(`Jugador ${p.playerId} no realizó su apuesta.`);
    }

    const roundScore = calculateRoundScore(p.bet, p.tricksWon);
    p.score = roundScore;
    p.totalScore += roundScore;

    return {
      playerId: p.playerId,
      bet: p.bet,
      tricksWon: p.tricksWon,
      roundScore,
      totalScore: p.totalScore,
      betFulfilled: p.bet === p.tricksWon,
    };
  });
}

/**
 * Determina el ganador de la partida al finalizar la ronda 10.
 * En caso de empate: gana quien tenga más apuestas cumplidas
 * (criterio de desempate natural — puede ajustarse en la biblia).
 */
export function determineWinner(
  playerData: PlayerRoundData[],
  players: Array<{ id: string; name: string }>,
): { winnerId: string; winnerName: string; totalScore: number } {
  if (playerData.length === 0) throw new Error('No hay jugadores.');

  const sorted = [...playerData].sort((a, b) => b.totalScore - a.totalScore);
  const top = sorted[0];
  const winner = players.find(p => p.id === top.playerId)!;

  return {
    winnerId: top.playerId,
    winnerName: winner.name,
    totalScore: top.totalScore,
  };
}
