export type Suit = 'S' | 'H' | 'C' | 'D';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export interface Card {
    rank: Rank;
    suit: Suit;
    /** Valor numérico para comparaciones: 2=2 ... 10=10, J=11, Q=12, K=13, A=14 */
    value: number;
}
export type GameState = 'WAITING' | 'STARTING' | 'DEALING' | 'BETTING' | 'PLAYING' | 'ROUND_END' | 'NEXT_ROUND' | 'GAME_END';
export interface Player {
    id: string;
    name: string;
    isBot: boolean;
    isConnected: boolean;
    /** Posición en la mesa (0 = primer asiento) */
    seatIndex: number;
}
export interface PlayerRoundData {
    playerId: string;
    hand: Card[];
    bet: number | null;
    tricksWon: number;
    score: number;
    totalScore: number;
}
export interface Trick {
    /** Cartas jugadas en la mano actual. Índice = orden de juego */
    plays: TrickPlay[];
    /** ID del jugador que ganó esta mano (null si no resuelta aún) */
    winnerId: string | null;
}
export interface TrickPlay {
    playerId: string;
    card: Card;
    /** Posición en la mesa del jugador (para resolver desempates por cercanía a la Mano) */
    seatIndex: number;
}
export interface RoundResult {
    roundNumber: number;
    playerResults: RoundPlayerResult[];
    tricks: Trick[];
}
export interface RoundPlayerResult {
    playerId: string;
    bet: number;
    tricksWon: number;
    roundScore: number;
    totalScore: number;
    betFulfilled: boolean;
}
export interface GameConfig {
    playerCount: 4 | 5 | 6;
    /** Índice del asiento que tiene la Mano en la ronda 1 */
    initialDealerSeat: number;
}
export interface GameSnapshot {
    state: GameState;
    roundNumber: number;
    dealerSeat: number;
    currentTrick: Trick | null;
    completedTricks: Trick[];
    playerData: PlayerRoundData[];
    players: Player[];
    config: GameConfig;
    bettingOrder: string[];
    playOrder: string[];
    currentBettorIndex: number;
    currentPlayerIndex: number;
}
//# sourceMappingURL=types.d.ts.map