import { GameConfig, GameSnapshot, GameState, Player, RoundResult } from './types';
export declare const TOTAL_ROUNDS = 10;
export declare class QSPEngine {
    private players;
    private config;
    private state;
    private roundNumber;
    private dealerSeat;
    private playerData;
    private currentTrick;
    private completedTricks;
    private roundResults;
    private bettingOrder;
    private playOrder;
    private currentBettorIndex;
    private currentPlayerIndex;
    private rng;
    constructor(players: Player[], config: GameConfig, rng?: () => number);
    getSnapshot(): GameSnapshot;
    getState(): GameState;
    getRoundNumber(): number;
    getRoundResults(): RoundResult[];
    /** Arranca el juego. Llama a startRound() internamente. */
    startGame(): GameSnapshot;
    /** Inicia una ronda nueva (o la primera). */
    startRound(): GameSnapshot;
    /** Registra la apuesta de un jugador. */
    placeBet(playerId: string, bet: number): {
        success: boolean;
        reason?: string;
        snapshot: GameSnapshot;
    };
    /** El jugador actual juega una carta. */
    playCard(playerId: string, cardIndex: number): {
        success: boolean;
        reason?: string;
        trickResult?: {
            winnerId: string;
        };
        snapshot: GameSnapshot;
    };
    /** Finaliza la ronda y calcula puntos. Llamar cuando state === 'ROUND_END'. */
    endRound(): {
        results: RoundResult;
        snapshot: GameSnapshot;
    };
    /** Avanza a la siguiente ronda. Llamar cuando state === 'NEXT_ROUND'. */
    nextRound(): GameSnapshot;
    /** Devuelve el ganador final. Solo disponible en GAME_END. */
    getWinner(): {
        winnerId: string;
        winnerName: string;
        totalScore: number;
    };
    /** Devuelve las apuestas válidas para el apostador actual (útil para bots y UI). */
    getValidBetsForCurrentBettor(): number[];
    private orderedPlayerIds;
    private buildOrderFromDealer;
    private startNewTrick;
}
