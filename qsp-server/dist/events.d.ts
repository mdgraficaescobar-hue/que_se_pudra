export interface ClientToServerEvents {
    'room:create': (payload: RoomCreatePayload, cb: AckCallback<RoomJoinedAck>) => void;
    'room:join': (payload: RoomJoinPayload, cb: AckCallback<RoomJoinedAck>) => void;
    'room:quick': (payload: QuickMatchPayload, cb: AckCallback<RoomJoinedAck>) => void;
    'room:start': (cb: AckCallback<OkAck>) => void;
    'room:leave': (cb: AckCallback<OkAck>) => void;
    'room:rematch': (cb: AckCallback<OkAck>) => void;
    'game:bet': (payload: BetPayload, cb: AckCallback<OkAck>) => void;
    'game:play': (payload: PlayCardPayload, cb: AckCallback<OkAck>) => void;
    'game:message': (payload: QuickMessagePayload) => void;
}
export interface ServerToClientEvents {
    'room:updated': (state: RoomState) => void;
    'room:started': (snapshot: GameSnapshotDTO) => void;
    'game:snapshot': (snapshot: GameSnapshotDTO) => void;
    'game:trick_end': (result: TrickResultDTO) => void;
    'game:round_end': (result: RoundResultDTO) => void;
    'game:end': (result: GameEndDTO) => void;
    'game:message': (msg: QuickMessageDTO) => void;
    'player:reconnected': (info: ReconnectDTO) => void;
    'player:disconnected': (info: DisconnectDTO) => void;
    'error': (err: ErrorDTO) => void;
}
export interface RoomCreatePayload {
    playerName: string;
    avatarId: string;
    colorId: string;
    size: 4 | 5 | 6;
}
export interface RoomJoinPayload {
    code: string;
    playerName: string;
    avatarId: string;
    colorId: string;
}
export interface QuickMatchPayload {
    playerName: string;
    avatarId: string;
    colorId: string;
    preferredSize?: 4 | 5 | 6;
}
export interface BetPayload {
    bet: number;
}
export interface PlayCardPayload {
    cardIndex: number;
}
export interface QuickMessagePayload {
    messageId: QuickMessageId;
}
export interface RoomState {
    code: string;
    size: 4 | 5 | 6;
    players: RoomPlayerDTO[];
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    secondsUntilAutoStart: number | null;
}
export interface RoomPlayerDTO {
    id: string;
    name: string;
    avatarId: string;
    colorId: string;
    seatIndex: number;
    isBot: boolean;
    isConnected: boolean;
    isHost: boolean;
}
export interface GameSnapshotDTO {
    state: string;
    roundNumber: number;
    dealerSeat: number;
    players: GamePlayerDTO[];
    currentTrick: TrickDTO | null;
    completedTricksCount: number;
    bettingOrder: string[];
    playOrder: string[];
    currentBettorId: string | null;
    currentPlayerId: string | null;
    validBets: number[] | null;
}
export interface GamePlayerDTO {
    id: string;
    name: string;
    seatIndex: number;
    isBot: boolean;
    hand: CardDTO[] | number;
    bet: number | null;
    tricksWon: number;
    totalScore: number;
}
export interface CardDTO {
    rank: string;
    suit: string;
    value: number;
}
export interface TrickDTO {
    plays: TrickPlayDTO[];
}
export interface TrickPlayDTO {
    playerId: string;
    card: CardDTO;
}
export interface TrickResultDTO {
    winnerId: string;
    winnerName: string;
    plays: TrickPlayDTO[];
    updatedTricksWon: Record<string, number>;
}
export interface RoundResultDTO {
    roundNumber: number;
    results: PlayerRoundResultDTO[];
    nextDealerSeat: number | null;
}
export interface PlayerRoundResultDTO {
    playerId: string;
    name: string;
    bet: number;
    tricksWon: number;
    roundScore: number;
    totalScore: number;
    betFulfilled: boolean;
}
export interface GameEndDTO {
    winnerId: string;
    winnerName: string;
    totalScore: number;
    finalScores: PlayerRoundResultDTO[];
}
export interface QuickMessageDTO {
    senderId: string;
    senderName: string;
    messageId: QuickMessageId;
    text: string;
    emoji: string;
}
export interface ReconnectDTO {
    playerId: string;
    playerName: string;
}
export interface DisconnectDTO {
    playerId: string;
    playerName: string;
    replacedByBot: boolean;
}
export interface ErrorDTO {
    code: string;
    message: string;
}
export type AckCallback<T> = (response: AckResponse<T>) => void;
export type AckResponse<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    error: string;
};
export interface OkAck {
}
export interface RoomJoinedAck {
    roomCode: string;
    yourPlayerId: string;
    roomState: RoomState;
}
export type QuickMessageId = 'QUE_SE_PUDRA' | 'SE_VIENE' | 'BUENA_ESA' | 'FANTASMA' | 'NO_PUEDE_SER' | 'LA_TENGO_CLARA' | 'ME_VOY_AL_MAZO';
export declare const QUICK_MESSAGES: Record<QuickMessageId, {
    text: string;
    emoji: string;
}>;
