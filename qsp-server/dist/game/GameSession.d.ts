import { QSPEngine } from '../engine/engine';
import { GameSnapshot } from '../engine/types';
import { Room } from '../rooms/RoomManager';
import { GameSnapshotDTO, TrickResultDTO, RoundResultDTO, GameEndDTO } from '../events';
export declare class GameSession {
    private engine;
    readonly roomCode: string;
    constructor(room: Room);
    start(): GameSnapshot;
    placeBet(playerId: string, bet: number): {
        success: boolean;
        reason?: string;
        snapshot: GameSnapshot;
    };
    playCard(playerId: string, cardIndex: number): {
        success: boolean;
        reason?: string;
        trickResult?: {
            winnerId: string;
        };
        snapshot: GameSnapshot;
    };
    endRound(): {
        results: import("../engine/types").RoundResult;
        snapshot: GameSnapshot;
    };
    nextRound(): GameSnapshot;
    getSnapshot(): GameSnapshot;
    getValidBets(): number[];
    getState(): import("../engine/types").GameState;
    getWinner(): {
        winnerId: string;
        winnerName: string;
        totalScore: number;
    };
    /**
     * Convierte el snapshot interno en DTO seguro para enviar a los clientes.
     * Cada cliente solo ve su propia mano completa; los demás ven solo el conteo.
     */
    toSnapshotDTO(forPlayerId: string, validBets?: number[] | null): GameSnapshotDTO;
    /**
     * Snapshot para broadcast general (todos los jugadores simultáneo).
     * Usado en eventos que no necesitan diferenciación por jugador
     * (ej: actualización de tricksWon, scores, etc.)
     * IMPORTANTE: No incluye manos de ningún jugador.
     */
    toPublicSnapshotDTO(): GameSnapshotDTO;
    toTrickResultDTO(winnerId: string): TrickResultDTO;
    toRoundResultDTO(results: ReturnType<QSPEngine['endRound']>['results']): RoundResultDTO;
    toGameEndDTO(): GameEndDTO;
}
