// ─────────────────────────────────────────────
//  QSP SERVER — CONTRATO DE EVENTOS SOCKET.IO
//  Este archivo es la fuente de verdad de todos
//  los eventos que cruzan cliente ↔ servidor.
// ─────────────────────────────────────────────

// ── EVENTOS: CLIENTE → SERVIDOR ──────────────

export interface ClientToServerEvents {
  // SALA
  'room:create':  (payload: RoomCreatePayload,  cb: AckCallback<RoomJoinedAck>)  => void;
  'room:join':    (payload: RoomJoinPayload,    cb: AckCallback<RoomJoinedAck>)  => void;
  'room:quick':   (payload: QuickMatchPayload,  cb: AckCallback<RoomJoinedAck>)  => void;
  'room:start':   (cb: AckCallback<OkAck>)                                       => void;
  'room:leave':   (cb: AckCallback<OkAck>)                                       => void;   // "Irse al mazo"
  'room:rematch': (cb: AckCallback<OkAck>)                                       => void;

  // JUEGO
  'game:bet':     (payload: BetPayload,         cb: AckCallback<OkAck>)          => void;
  'game:play':    (payload: PlayCardPayload,    cb: AckCallback<OkAck>)          => void;
  'game:message': (payload: QuickMessagePayload)                                 => void;
}

// ── EVENTOS: SERVIDOR → CLIENTE ──────────────

export interface ServerToClientEvents {
  // SALA
  'room:updated':     (state: RoomState)            => void;
  'room:started':     (snapshot: GameSnapshotDTO)   => void;

  // JUEGO
  'game:snapshot':    (snapshot: GameSnapshotDTO)   => void;   // estado completo tras acción
  'game:trick_end':   (result: TrickResultDTO)      => void;   // resolución de mano
  'game:round_end':   (result: RoundResultDTO)      => void;   // fin de ronda + scores
  'game:end':         (result: GameEndDTO)          => void;   // fin de partida
  'game:message':     (msg: QuickMessageDTO)        => void;   // mensajes rápidos

  // SISTEMA
  'player:reconnected': (info: ReconnectDTO)        => void;
  'player:disconnected':(info: DisconnectDTO)       => void;
  'error':              (err: ErrorDTO)             => void;
}

// ── PAYLOADS C→S ─────────────────────────────

export interface RoomCreatePayload {
  playerName: string;
  avatarId: string;
  colorId: string;
  size: 4 | 5 | 6;
}

export interface RoomJoinPayload {
  code: string;        // formato QSP-XXXX
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

// ── DTOs S→C ─────────────────────────────────

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
  validBets: number[] | null;        // solo para el apostador actual
}

export interface GamePlayerDTO {
  id: string;
  name: string;
  seatIndex: number;
  isBot: boolean;
  hand: CardDTO[] | number;          // array propio / count de otros
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

// ── ACK GENÉRICO ─────────────────────────────

export type AckCallback<T> = (response: AckResponse<T>) => void;

export type AckResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

export interface OkAck { }

export interface RoomJoinedAck {
  roomCode: string;
  yourPlayerId: string;
  roomState: RoomState;
}

// ── MENSAJES RÁPIDOS ─────────────────────────

export type QuickMessageId =
  | 'QUE_SE_PUDRA'
  | 'SE_VIENE'
  | 'BUENA_ESA'
  | 'FANTASMA'
  | 'NO_PUEDE_SER'
  | 'LA_TENGO_CLARA'
  | 'ME_VOY_AL_MAZO';

export const QUICK_MESSAGES: Record<QuickMessageId, { text: string; emoji: string }> = {
  QUE_SE_PUDRA:    { text: 'Qué se Pudra',   emoji: '😈' },
  SE_VIENE:        { text: 'Se viene',        emoji: '🔥' },
  BUENA_ESA:       { text: 'Buena esa',       emoji: '😂' },
  FANTASMA:        { text: 'Fantasma',        emoji: '👻' },
  NO_PUEDE_SER:    { text: 'No puede ser',    emoji: '😱' },
  LA_TENGO_CLARA:  { text: 'La tengo clara',  emoji: '🎯' },
  ME_VOY_AL_MAZO:  { text: 'Me voy al mazo',  emoji: '🃏' },
};
