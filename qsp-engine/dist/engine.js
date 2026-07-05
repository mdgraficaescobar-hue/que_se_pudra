"use strict";
// ─────────────────────────────────────────────
//  QSP ENGINE — ORQUESTADOR PRINCIPAL
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.QSPEngine = exports.TOTAL_ROUNDS = void 0;
const deck_1 = require("./deck");
const betting_1 = require("./betting");
const trick_1 = require("./trick");
const scoring_1 = require("./scoring");
exports.TOTAL_ROUNDS = 10;
class QSPEngine {
    constructor(players, config, rng = Math.random) {
        this.state = 'WAITING';
        this.roundNumber = 0;
        this.dealerSeat = 0; // Mano actual
        this.playerData = [];
        this.currentTrick = null;
        this.completedTricks = [];
        this.roundResults = [];
        this.bettingOrder = [];
        this.playOrder = [];
        this.currentBettorIndex = 0;
        this.currentPlayerIndex = 0;
        if (players.length < 4 || players.length > 6) {
            throw new Error('QSP requiere entre 4 y 6 jugadores.');
        }
        if (players.length !== config.playerCount) {
            throw new Error('El número de jugadores no coincide con la configuración.');
        }
        this.players = players;
        this.config = config;
        this.dealerSeat = config.initialDealerSeat;
        this.rng = rng;
    }
    // ── ESTADO PÚBLICO ──────────────────────────────────────────────
    getSnapshot() {
        return {
            state: this.state,
            roundNumber: this.roundNumber,
            dealerSeat: this.dealerSeat,
            currentTrick: this.currentTrick,
            completedTricks: [...this.completedTricks],
            playerData: this.playerData.map(p => ({ ...p, hand: [...p.hand] })),
            players: [...this.players],
            config: { ...this.config },
            bettingOrder: [...this.bettingOrder],
            playOrder: [...this.playOrder],
            currentBettorIndex: this.currentBettorIndex,
            currentPlayerIndex: this.currentPlayerIndex,
        };
    }
    getState() { return this.state; }
    getRoundNumber() { return this.roundNumber; }
    getRoundResults() { return this.roundResults; }
    // ── FLUJO DEL JUEGO ─────────────────────────────────────────────
    /** Arranca el juego. Llama a startRound() internamente. */
    startGame() {
        if (this.state !== 'WAITING')
            throw new Error('El juego ya fue iniciado.');
        this.state = 'STARTING';
        return this.startRound();
    }
    /** Inicia una ronda nueva (o la primera). */
    startRound() {
        this.roundNumber += 1;
        const cardsThisRound = this.roundNumber; // Ronda 1 → 1 carta, ..., Ronda 10 → 10
        this.completedTricks = [];
        this.currentTrick = null;
        // Construir mazo y repartir
        const deck = (0, deck_1.buildGameDeck)(this.config.playerCount, this.rng);
        const playerIds = this.orderedPlayerIds();
        const hands = (0, deck_1.dealCards)(deck, playerIds, cardsThisRound);
        // Inicializar datos de jugadores para esta ronda
        this.playerData = this.players.map(player => ({
            playerId: player.id,
            hand: hands.get(player.id) ?? [],
            bet: null,
            tricksWon: 0,
            score: 0,
            totalScore: this.roundNumber === 1
                ? 0
                : (this.playerData.find(p => p.playerId === player.id)?.totalScore ?? 0),
        }));
        // Orden de apuesta y juego: Mano primero, luego en sentido horario
        this.bettingOrder = this.buildOrderFromDealer();
        this.playOrder = [...this.bettingOrder];
        this.currentBettorIndex = 0;
        this.currentPlayerIndex = 0;
        this.state = 'BETTING';
        return this.getSnapshot();
    }
    /** Registra la apuesta de un jugador. */
    placeBet(playerId, bet) {
        if (this.state !== 'BETTING') {
            return { success: false, reason: 'No es momento de apostar.', snapshot: this.getSnapshot() };
        }
        const expectedBettor = this.bettingOrder[this.currentBettorIndex];
        if (playerId !== expectedBettor) {
            return { success: false, reason: 'No es tu turno de apostar.', snapshot: this.getSnapshot() };
        }
        const cardsInRound = this.roundNumber;
        const lastBettor = (0, betting_1.isLastBettor)(playerId, this.bettingOrder, this.playerData);
        const validation = (0, betting_1.validateBet)(bet, playerId, this.playerData, cardsInRound, lastBettor);
        if (!validation.valid) {
            return { success: false, reason: validation.reason, snapshot: this.getSnapshot() };
        }
        // Registrar la apuesta
        const playerDataEntry = this.playerData.find(p => p.playerId === playerId);
        playerDataEntry.bet = bet;
        this.currentBettorIndex += 1;
        // ¿Todos apostaron?
        if (this.currentBettorIndex >= this.bettingOrder.length) {
            this.state = 'PLAYING';
            this.startNewTrick();
        }
        return { success: true, snapshot: this.getSnapshot() };
    }
    /** El jugador actual juega una carta. */
    playCard(playerId, cardIndex) {
        if (this.state !== 'PLAYING') {
            return { success: false, reason: 'No es momento de jugar.', snapshot: this.getSnapshot() };
        }
        const expectedPlayer = this.playOrder[this.currentPlayerIndex];
        if (playerId !== expectedPlayer) {
            return { success: false, reason: 'No es tu turno.', snapshot: this.getSnapshot() };
        }
        const playerDataEntry = this.playerData.find(p => p.playerId === playerId);
        if (cardIndex < 0 || cardIndex >= playerDataEntry.hand.length) {
            return { success: false, reason: 'Índice de carta inválido.', snapshot: this.getSnapshot() };
        }
        const player = this.players.find(p => p.id === playerId);
        const [card] = playerDataEntry.hand.splice(cardIndex, 1);
        const play = {
            playerId,
            card,
            seatIndex: player.seatIndex,
        };
        this.currentTrick.plays.push(play);
        this.currentPlayerIndex += 1;
        // ¿Todos jugaron en esta mano?
        if (this.currentPlayerIndex >= this.playOrder.length) {
            const resolution = (0, trick_1.resolveTrick)(this.currentTrick, this.dealerSeat, this.config.playerCount);
            this.currentTrick.winnerId = resolution.winnerId;
            this.completedTricks.push(this.currentTrick);
            (0, trick_1.applyTrickResult)(resolution.winnerId, this.playerData);
            const allCardsPlayed = this.playerData.every(p => p.hand.length === 0);
            if (allCardsPlayed) {
                this.state = 'ROUND_END';
                return {
                    success: true,
                    trickResult: { winnerId: resolution.winnerId },
                    snapshot: this.getSnapshot(),
                };
            }
            // Nueva mano: el ganador lidera
            this.startNewTrick(resolution.winnerId);
            return {
                success: true,
                trickResult: { winnerId: resolution.winnerId },
                snapshot: this.getSnapshot(),
            };
        }
        return { success: true, snapshot: this.getSnapshot() };
    }
    /** Finaliza la ronda y calcula puntos. Llamar cuando state === 'ROUND_END'. */
    endRound() {
        if (this.state !== 'ROUND_END')
            throw new Error('La ronda aún no terminó.');
        const playerResults = (0, scoring_1.scoreRound)(this.playerData, this.roundNumber);
        const result = {
            roundNumber: this.roundNumber,
            playerResults,
            tricks: [...this.completedTricks],
        };
        this.roundResults.push(result);
        // Sincronizar totalScore de vuelta a playerData para la próxima ronda
        for (const res of playerResults) {
            const p = this.playerData.find(pd => pd.playerId === res.playerId);
            p.totalScore = res.totalScore;
        }
        if (this.roundNumber === exports.TOTAL_ROUNDS) {
            this.state = 'GAME_END';
        }
        else {
            // Rotar la Mano
            this.dealerSeat = (this.dealerSeat + 1) % this.config.playerCount;
            this.state = 'NEXT_ROUND';
        }
        return { results: result, snapshot: this.getSnapshot() };
    }
    /** Avanza a la siguiente ronda. Llamar cuando state === 'NEXT_ROUND'. */
    nextRound() {
        if (this.state !== 'NEXT_ROUND')
            throw new Error('No es momento de avanzar de ronda.');
        return this.startRound();
    }
    /** Devuelve el ganador final. Solo disponible en GAME_END. */
    getWinner() {
        if (this.state !== 'GAME_END')
            throw new Error('El juego aún no terminó.');
        return (0, scoring_1.determineWinner)(this.playerData, this.players.map(p => ({ id: p.id, name: p.name })));
    }
    /** Devuelve las apuestas válidas para el apostador actual (útil para bots y UI). */
    getValidBetsForCurrentBettor() {
        if (this.state !== 'BETTING')
            return [];
        const bettorId = this.bettingOrder[this.currentBettorIndex];
        const isLast = (0, betting_1.isLastBettor)(bettorId, this.bettingOrder, this.playerData);
        if (!isLast) {
            return Array.from({ length: this.roundNumber + 1 }, (_, i) => i);
        }
        return (0, betting_1.validBetsForLastBettor)(this.playerData, bettorId, this.roundNumber);
    }
    // ── HELPERS PRIVADOS ────────────────────────────────────────────
    orderedPlayerIds() {
        return [...this.players]
            .sort((a, b) => a.seatIndex - b.seatIndex)
            .map(p => p.id);
    }
    buildOrderFromDealer() {
        const sorted = this.orderedPlayerIds();
        const dealerPos = sorted.findIndex(id => this.players.find(p => p.id === id).seatIndex === this.dealerSeat);
        return [...sorted.slice(dealerPos), ...sorted.slice(0, dealerPos)];
    }
    startNewTrick(leaderId) {
        this.currentTrick = { plays: [], winnerId: null };
        if (leaderId) {
            // El ganador de la mano anterior lidera
            const leaderIdx = this.playOrder.indexOf(leaderId);
            this.playOrder = [
                ...this.playOrder.slice(leaderIdx),
                ...this.playOrder.slice(0, leaderIdx),
            ];
        }
        this.currentPlayerIndex = 0;
    }
}
exports.QSPEngine = QSPEngine;
//# sourceMappingURL=engine.js.map