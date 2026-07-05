"use strict";
// ─────────────────────────────────────────────
//  QSP ENGINE — RESOLUCIÓN DE MANOS (TRICKS)
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTrick = resolveTrick;
exports.circularDistance = circularDistance;
exports.applyTrickResult = applyTrickResult;
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
function resolveTrick(trick, dealerSeat, totalPlayers) {
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
function circularDistance(from, to, total) {
    return (to - from + total) % total;
}
/**
 * Registra el resultado de una mano en los datos de los jugadores.
 * Incrementa el contador de manos ganadas del ganador.
 */
function applyTrickResult(winnerId, playerData) {
    const winner = playerData.find(p => p.playerId === winnerId);
    if (!winner) {
        throw new Error(`Jugador ${winnerId} no encontrado al aplicar resultado de mano.`);
    }
    winner.tricksWon += 1;
}
//# sourceMappingURL=trick.js.map