// ─────────────────────────────────────────────
//  QSP ENGINE — APUESTAS
// ─────────────────────────────────────────────

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
export function validateBet(
  bet: number,
  playerId: string,
  playerData: PlayerRoundData[],
  cardsInRound: number,
  isLastBettor: boolean,
): BetValidationResult {
  // Debe ser entero no negativo
  if (!Number.isInteger(bet) || bet < 0) {
    return { valid: false, reason: 'La apuesta debe ser un número entero mayor o igual a 0.' };
  }

  // No puede apostar más manos de las que hay
  if (bet > cardsInRound) {
    return {
      valid: false,
      reason: `No podés apostar más de ${cardsInRound} manos en esta ronda.`,
    };
  }

  // Calcular suma de apuestas ya realizadas (excluyendo al jugador actual)
  const currentSum = playerData
    .filter(p => p.playerId !== playerId && p.bet !== null)
    .reduce((acc, p) => acc + (p.bet ?? 0), 0);

  // Regla de suma prohibida: solo aplica al último apostador
  if (isLastBettor && currentSum + bet === cardsInRound) {
    return {
      valid: false,
      reason: `Esta apuesta está prohibida: la suma total (${currentSum + bet}) no puede ser igual a ${cardsInRound}.`,
    };
  }

  return { valid: true };
}

/**
 * Determina si un jugador es el último en apostar.
 */
export function isLastBettor(
  playerId: string,
  bettingOrder: string[],
  playerData: PlayerRoundData[],
): boolean {
  const remaining = bettingOrder.filter(id => {
    const p = playerData.find(pd => pd.playerId === id);
    return p?.bet === null;
  });
  return remaining.length === 1 && remaining[0] === playerId;
}

/**
 * Devuelve el rango de apuestas válidas para el último apostador.
 * Útil para mostrar en la UI qué valores están permitidos.
 */
export function validBetsForLastBettor(
  playerData: PlayerRoundData[],
  lastBettorId: string,
  cardsInRound: number,
): number[] {
  const currentSum = playerData
    .filter(p => p.playerId !== lastBettorId && p.bet !== null)
    .reduce((acc, p) => acc + (p.bet ?? 0), 0);

  const forbidden = cardsInRound - currentSum;
  const valid: number[] = [];

  for (let i = 0; i <= cardsInRound; i++) {
    if (i !== forbidden) valid.push(i);
  }

  return valid;
}
