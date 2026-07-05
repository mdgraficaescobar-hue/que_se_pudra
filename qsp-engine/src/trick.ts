// ─────────────────────────────────────────────
//  QSP ENGINE — RESOLUCIÓN DE MANOS (TRICKS)
// ─────────────────────────────────────────────

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
export function resolveTrick(
  trick: Trick,
  dealerSeat: number,
  totalPlayers: number,
): TrickResolution {
  if (trick.plays.length === 0) {
    throw new Error('No se puede resolver una mano sin jugadas.');
  }

  // Ordenar por valor descendente
  const sorted = [...trick.plays].sort((a, b) => b.card.value - a.card.value);
  const maxValue = sorted[0].card.value;

  // Todos los que empataron en el máximo
  const tied = sorted.filter(p => p.card.value === maxValue);

  if (tied.length === 1) {
    return {
      winnerId: tied[0].playerId,
      winningPlay: tied[0],
      rankedPlays: sorted,
    };
  }

  // Desempate: más cercano a la Mano en sentido horario
  // La Mano tiene prioridad → distancia 0, el siguiente → 1, etc.
  const winner = tied.reduce((best, current) => {
    const distBest = circularDistance(dealerSeat, best.seatIndex, totalPlayers);
    const distCurr = circularDistance(dealerSeat, current.seatIndex, totalPlayers);
    return distCurr < distBest ? current : best;
  });

  return {
    winnerId: winner.playerId,
    winningPlay: winner,
    rankedPlays: sorted,
  };
}

/**
 * Distancia circular en sentido horario desde `from` hasta `to`.
 * Ejemplo con 4 jugadores: from=3, to=1 → distancia=2 (3→0→1)
 */
export function circularDistance(from: number, to: number, total: number): number {
  return (to - from + total) % total;
}

/**
 * Registra el resultado de una mano en los datos de los jugadores.
 * Incrementa el contador de manos ganadas del ganador.
 */
export function applyTrickResult(
  winnerId: string,
  playerData: Array<{ playerId: string; tricksWon: number }>,
): void {
  const winner = playerData.find(p => p.playerId === winnerId);
  if (!winner) {
    throw new Error(`Jugador ${winnerId} no encontrado al aplicar resultado de mano.`);
  }
  winner.tricksWon += 1;
}
