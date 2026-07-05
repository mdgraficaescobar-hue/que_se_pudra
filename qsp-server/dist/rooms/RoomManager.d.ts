import { RoomState } from '../events';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export interface RoomPlayer {
    id: string;
    socketId: string;
    name: string;
    avatarId: string;
    colorId: string;
    seatIndex: number;
    isBot: boolean;
    isConnected: boolean;
    isHost: boolean;
    disconnectedAt: number | null;
}
export interface Room {
    code: string;
    size: 4 | 5 | 6;
    players: RoomPlayer[];
    status: RoomStatus;
    hostId: string;
    autoStartTimer: NodeJS.Timeout | null;
    autoStartAt: number | null;
    rematchVotes: Set<string>;
}
export declare class RoomManager {
    private rooms;
    /** socketId → roomCode para reconexiones rápidas */
    private socketToRoom;
    /** playerId → roomCode persistente (para reconexiones) */
    private playerToRoom;
    createRoom(socketId: string, playerId: string, name: string, avatarId: string, colorId: string, size: 4 | 5 | 6): Room;
    joinRoom(socketId: string, playerId: string, name: string, avatarId: string, colorId: string, code: string): {
        room: Room;
        error?: never;
    } | {
        room?: never;
        error: string;
    };
    quickMatch(socketId: string, playerId: string, name: string, avatarId: string, colorId: string, preferredSize?: 4 | 5 | 6): Room;
    handleDisconnect(socketId: string): {
        room: Room | null;
        player: RoomPlayer | null;
        permanent: boolean;
    };
    tryReconnect(socketId: string, playerId: string): {
        room: Room;
        player: RoomPlayer;
    } | null;
    leaveGame(playerId: string): {
        room: Room;
        player: RoomPlayer;
    } | null;
    scheduleAutoStart(code: string, onStart: () => void): void;
    cancelAutoStart(code: string): void;
    voteRematch(playerId: string): {
        allVoted: boolean;
        room: Room;
    } | null;
    resetForRematch(code: string): Room | null;
    getRoom(code: string): Room | undefined;
    getRoomBySocket(socketId: string): Room | undefined;
    getRoomByPlayer(playerId: string): Room | undefined;
    setStatus(code: string, status: RoomStatus): void;
    toRoomState(room: Room): RoomState;
    private toPlayerDTO;
    private nextFreeSeat;
}
