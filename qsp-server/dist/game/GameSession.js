"use strict";
// ─────────────────────────────────────────────
//  QSP SERVER — GAME SESSION
//  Wrapper del engine para uso en el servidor.
//  Convierte snapshots → DTOs para los clientes.
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = void 0;
const engine_1 = require("../engine/engine");
class GameSession {
    constructor(room) {
        this.roomCode = room.code;
        const players = room.players.map(p => ({
            id: p.id,
            name: p.name,
            isBot: p.isBot,
            isConnected: p.isConnected,
            seatIndex: p.seatIndex,
        }));
        const config = {
            playerCount: room.size,
            initialDealerSeat: 0,
        };
        this.engine = new engine_1.QSPEngine(players, config);
    }
    // ── ACCIONES (delegadas al engine) ──────────────────────────
    start() {
        return this.engine.startGame();
    }
    placeBet(playerId, bet) {
        return this.engine.placeBet(playerId, bet);
    }
    playCard(playerId, cardIndex) {
        return this.engine.playCard(playerId, cardIndex);
    }
    endRound() {
        return this.engine.endRound();
    }
    nextRound() {
        return this.engine.nextRound();
    }
    getSnapshot() {
        return this.engine.getSnapshot();
    }
    getValidBets() {
        return this.engine.getValidBetsForCurrentBettor();
    }
    getState() {
        return this.engine.getState();
    }
    getWinner() {
        return this.engine.getWinner();
    }
    // ── SERIALIZACIÓN: Snapshot → DTO ────────────────────────────
    /**
     * Convierte el snapshot interno en DTO seguro para enviar a los clientes.
     * Cada cliente solo ve su propia mano completa; los demás ven solo el conteo.
     */
    toSnapshotDTO(forPlayerId, validBets = null) {
        const snap = this.engine.getSnapshot();
        return buildSnapshotDTO(snap, forPlayerId, validBets);
    }
    /**
     * Snapshot para broadcast general (todos los jugadores simultáneo).
     * Usado en eventos que no necesitan diferenciación por jugador
     * (ej: actualización de tricksWon, scores, etc.)
     * IMPORTANTE: No incluye manos de ningún jugador.
     */
    toPublicSnapshotDTO() {
        const snap = this.engine.getSnapshot();
        return buildPublicSnapshotDTO(snap);
    }
    toTrickResultDTO(winnerId) {
        const snap = this.engine.getSnapshot();
        const lastTrick = snap.completedTricks[snap.completedTricks.length - 1];
        const winner = snap.players.find(p => p.id === winnerId);
        return {
            winnerId,
            winnerName: winner.name,
            plays: lastTrick.plays.map(p => ({
                playerId: p.playerId,
                card: { rank: p.card.rank, suit: p.card.suit, value: p.card.value },
            })),
            updatedTricksWon: Object.fromEntries(snap.playerData.map(p => [p.playerId, p.tricksWon])),
        };
    }
    toRoundResultDTO(results) {
        const snap = this.engine.getSnapshot();
        const nextDealer = snap.state === 'GAME_END' ? null : snap.dealerSeat;
        return {
            roundNumber: results.roundNumber,
            nextDealerSeat: nextDealer,
            results: results.playerResults.map(r => {
                const player = snap.players.find(p => p.id === r.playerId);
                return {
                    playerId: r.playerId,
                    name: player.name,
                    bet: r.bet,
                    tricksWon: r.tricksWon,
                    roundScore: r.roundScore,
                    totalScore: r.totalScore,
                    betFulfilled: r.betFulfilled,
                };
            }),
        };
    }
    toGameEndDTO() {
        const winner = this.engine.getWinner();
        const snap = this.engine.getSnapshot();
        return {
            winnerId: winner.winnerId,
            winnerName: winner.winnerName,
            totalScore: winner.totalScore,
            finalScores: snap.playerData.map(p => {
                const player = snap.players.find(pl => pl.id === p.playerId);
                return {
                    playerId: p.playerId,
                    name: player.name,
                    bet: p.bet ?? 0,
                    tricksWon: p.tricksWon,
                    roundScore: p.score,
                    totalScore: p.totalScore,
                    betFulfilled: p.bet === p.tricksWon,
                };
            }),
        };
    }
}
exports.GameSession = GameSession;
// ── HELPERS DE SERIALIZACIÓN ─────────────────────────────────────
function buildSnapshotDTO(snap, forPlayerId, validBets) {
    const bettorId = snap.bettingOrder[snap.currentBettorIndex] ?? null;
    const playerId = snap.playOrder[snap.currentPlayerIndex] ?? null;
    return {
        state: snap.state,
        roundNumber: snap.roundNumber,
        dealerSeat: snap.dealerSeat,
        currentBettorId: bettorId,
        currentPlayerId: playerId,
        bettingOrder: snap.bettingOrder,
        playOrder: snap.playOrder,
        completedTricksCount: snap.completedTricks.length,
        validBets: bettorId === forPlayerId ? validBets : null,
        currentTrick: snap.currentTrick
            ? { plays: snap.currentTrick.plays.map(p => ({
                    playerId: p.playerId,
                    card: { rank: p.card.rank, suit: p.card.suit, value: p.card.value },
                })) }
            : null,
        players: snap.playerData.map(pd => {
            const player = snap.players.find(p => p.id === pd.playerId);
            return {
                id: pd.playerId,
                name: player.name,
                seatIndex: player.seatIndex,
                isBot: player.isBot,
                // Solo el propio jugador ve sus cartas
                hand: pd.playerId === forPlayerId
                    ? pd.hand.map(c => ({ rank: c.rank, suit: c.suit, value: c.value }))
                    : pd.hand.length,
                bet: pd.bet,
                tricksWon: pd.tricksWon,
                totalScore: pd.totalScore,
            };
        }),
    };
}
function buildPublicSnapshotDTO(snap) {
    const bettorId = snap.bettingOrder[snap.currentBettorIndex] ?? null;
    const playerId = snap.playOrder[snap.currentPlayerIndex] ?? null;
    return {
        state: snap.state,
        roundNumber: snap.roundNumber,
        dealerSeat: snap.dealerSeat,
        currentBettorId: bettorId,
        currentPlayerId: playerId,
        bettingOrder: snap.bettingOrder,
        playOrder: snap.playOrder,
        completedTricksCount: snap.completedTricks.length,
        validBets: null,
        currentTrick: snap.currentTrick
            ? { plays: snap.currentTrick.plays.map(p => ({
                    playerId: p.playerId,
                    card: { rank: p.card.rank, suit: p.card.suit, value: p.card.value },
                })) }
            : null,
        players: snap.playerData.map(pd => {
            const player = snap.players.find(p => p.id === pd.playerId);
            return {
                id: pd.playerId,
                name: player.name,
                seatIndex: player.seatIndex,
                isBot: player.isBot,
                hand: pd.hand.length, // nadie ve las manos ajenas
                bet: pd.bet,
                tricksWon: pd.tricksWon,
                totalScore: pd.totalScore,
            };
        }),
    };
}
//# sourceMappingURL=GameSession.js.map