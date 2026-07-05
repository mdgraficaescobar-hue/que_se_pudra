"use strict";
// ─────────────────────────────────────────────
//  QSP SERVER — BOT (Dificultad Normal / MVP)
//  Misma información que un humano.
//  Sin ventajas ocultas.
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.botDecideBet = botDecideBet;
exports.botDecideCard = botDecideCard;
exports.botThinkTime = botThinkTime;
/**
 * Decide cuánto apuesta el bot.
 *
 * Estrategia normal:
 * - Estima cuántas manos puede ganar según el valor de sus cartas.
 * - Si la apuesta estimada está prohibida, ajusta +1 o -1.
 * - Siempre apuesta dentro del rango válido.
 */
function botDecideBet(botId, snapshot, validBets) {
    const playerData = snapshot.playerData.find(p => p.playerId === botId);
    if (!playerData || validBets.length === 0)
        return validBets[0] ?? 0;
    const hand = playerData.hand;
    const cardsInRound = snapshot.roundNumber;
    // Contar cuántas cartas son "altas" (valor >= 11, o sea J, Q, K, A)
    // + cartas de valor medio si la ronda tiene pocas cartas
    const threshold = cardsInRound <= 3 ? 10 : 9;
    let estimate = hand.filter(c => c.value >= threshold).length;
    // Ajustar si la estimación no está en validBets
    if (validBets.includes(estimate))
        return estimate;
    // Buscar el valor más cercano a la estimación que sea válido
    const closest = validBets.reduce((best, v) => Math.abs(v - estimate) < Math.abs(best - estimate) ? v : best, validBets[0]);
    return closest;
}
/**
 * Decide qué carta juega el bot.
 *
 * Estrategia normal:
 * - Si necesita ganar manos (tricks restantes < manos faltantes): juega la más alta.
 * - Si ya cumplió su apuesta: juega la más baja para no ganar manos extra.
 * - Si es la primera carta de la mano: juega carta media.
 */
function botDecideCard(botId, snapshot) {
    const playerData = snapshot.playerData.find(p => p.playerId === botId);
    if (!playerData || playerData.hand.length === 0)
        return 0;
    const hand = playerData.hand;
    const bet = playerData.bet ?? 0;
    const tricksWon = playerData.tricksWon;
    const tricksNeeded = bet - tricksWon;
    const tricksLeft = snapshot.roundNumber - snapshot.completedTricks.length;
    const currentTrickPlays = snapshot.currentTrick?.plays ?? [];
    const isLeading = currentTrickPlays.length === 0;
    // Ordenar cartas: índices por valor asc/desc
    const sortedAsc = [...hand.map((c, i) => ({ c, i }))].sort((a, b) => a.c.value - b.c.value);
    const sortedDesc = [...sortedAsc].reverse();
    // ¿Ya cumplió? Tirar la más baja para no sumar manos extra
    if (tricksNeeded <= 0) {
        return sortedAsc[0].i;
    }
    // Necesita ganar, hay suficientes tricks: jugar alta
    if (tricksNeeded > 0) {
        // Si hay cartas jugadas, verificar si podemos ganar esta mano
        if (!isLeading && currentTrickPlays.length > 0) {
            const maxOnTable = Math.max(...currentTrickPlays.map(p => p.card.value));
            const canWin = sortedDesc.find(({ c }) => c.value > maxOnTable);
            if (canWin)
                return canWin.i;
            // No puede ganar → tirar la más baja
            return sortedAsc[0].i;
        }
        // Es el primero en jugar la mano
        return sortedDesc[0].i;
    }
    // Default: carta del medio
    const mid = Math.floor(hand.length / 2);
    return mid;
}
/**
 * Delay simulado para que el bot no juegue instantáneo.
 * Humaniza la experiencia.
 */
function botThinkTime(baseMs = 1200) {
    return baseMs + Math.floor(Math.random() * 800);
}
//# sourceMappingURL=bot.js.map