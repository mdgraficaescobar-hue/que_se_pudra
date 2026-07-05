"use strict";
// ─────────────────────────────────────────────
//  QSP SERVER — ROOM MANAGER
//  Maneja el ciclo de vida de salas y jugadores
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const AUTO_START_DELAY_MS = 60000;
/** Genera código QSP-XXXX */
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `QSP-${code}`;
}
class RoomManager {
    constructor() {
        this.rooms = new Map();
        /** socketId → roomCode para reconexiones rápidas */
        this.socketToRoom = new Map();
        /** playerId → roomCode persistente (para reconexiones) */
        this.playerToRoom = new Map();
    }
    // ── CREAR / UNIRSE ────────────────────────────────────────────
    createRoom(socketId, playerId, name, avatarId, colorId, size) {
        let code = generateCode();
        while (this.rooms.has(code))
            code = generateCode();
        const host = {
            id: playerId,
            socketId,
            name,
            avatarId,
            colorId,
            seatIndex: 0,
            isBot: false,
            isConnected: true,
            isHost: true,
            disconnectedAt: null,
        };
        const room = {
            code,
            size,
            players: [host],
            status: 'waiting',
            hostId: playerId,
            autoStartTimer: null,
            autoStartAt: null,
            rematchVotes: new Set(),
        };
        this.rooms.set(code, room);
        this.socketToRoom.set(socketId, code);
        this.playerToRoom.set(playerId, code);
        return room;
    }
    joinRoom(socketId, playerId, name, avatarId, colorId, code) {
        const room = this.rooms.get(code);
        if (!room)
            return { error: 'Sala no encontrada.' };
        if (room.status !== 'waiting')
            return { error: 'La partida ya comenzó.' };
        const humanCount = room.players.filter(p => !p.isBot).length;
        if (humanCount >= room.size)
            return { error: 'La sala está llena.' };
        const seatIndex = this.nextFreeSeat(room);
        const player = {
            id: playerId,
            socketId,
            name,
            avatarId,
            colorId,
            seatIndex,
            isBot: false,
            isConnected: true,
            isHost: false,
            disconnectedAt: null,
        };
        room.players.push(player);
        this.socketToRoom.set(socketId, code);
        this.playerToRoom.set(playerId, code);
        return { room };
    }
    // ── MATCHMAKING RÁPIDO ────────────────────────────────────────
    quickMatch(socketId, playerId, name, avatarId, colorId, preferredSize = 4) {
        // Buscar sala disponible del tamaño preferido
        const available = [...this.rooms.values()].find(r => r.status === 'waiting' &&
            r.size === preferredSize &&
            r.players.filter(p => !p.isBot).length < r.size);
        if (available) {
            const result = this.joinRoom(socketId, playerId, name, avatarId, colorId, available.code);
            if (result.room)
                return result.room;
        }
        // Si no hay sala disponible, crear una nueva
        return this.createRoom(socketId, playerId, name, avatarId, colorId, preferredSize);
    }
    // ── DESCONEXIÓN / RECONEXIÓN ──────────────────────────────────
    handleDisconnect(socketId) {
        const code = this.socketToRoom.get(socketId);
        if (!code)
            return { room: null, player: null, permanent: false };
        const room = this.rooms.get(code);
        if (!room)
            return { room: null, player: null, permanent: false };
        const player = room.players.find(p => p.socketId === socketId);
        if (!player)
            return { room: null, player: null, permanent: false };
        player.isConnected = false;
        player.disconnectedAt = Date.now();
        this.socketToRoom.delete(socketId);
        return { room, player, permanent: false };
    }
    tryReconnect(socketId, playerId) {
        const code = this.playerToRoom.get(playerId);
        if (!code)
            return null;
        const room = this.rooms.get(code);
        if (!room || room.status === 'finished')
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player || player.isBot)
            return null;
        player.socketId = socketId;
        player.isConnected = true;
        player.disconnectedAt = null;
        this.socketToRoom.set(socketId, code);
        return { room, player };
    }
    // ── "IRSE AL MAZO" ────────────────────────────────────────────
    leaveGame(playerId) {
        const code = this.playerToRoom.get(playerId);
        if (!code)
            return null;
        const room = this.rooms.get(code);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        // Convertir al jugador en bot permanente
        player.isBot = true;
        player.isConnected = false;
        player.name = `Bot (${player.name})`;
        this.playerToRoom.delete(playerId);
        return { room, player };
    }
    // ── AUTO-START ────────────────────────────────────────────────
    scheduleAutoStart(code, onStart) {
        const room = this.rooms.get(code);
        if (!room || room.autoStartTimer)
            return;
        room.autoStartAt = Date.now() + AUTO_START_DELAY_MS;
        room.autoStartTimer = setTimeout(() => {
            room.autoStartTimer = null;
            room.autoStartAt = null;
            onStart();
        }, AUTO_START_DELAY_MS);
    }
    cancelAutoStart(code) {
        const room = this.rooms.get(code);
        if (!room || !room.autoStartTimer)
            return;
        clearTimeout(room.autoStartTimer);
        room.autoStartTimer = null;
        room.autoStartAt = null;
    }
    // ── REVANCHA ─────────────────────────────────────────────────
    voteRematch(playerId) {
        const code = this.playerToRoom.get(playerId);
        if (!code)
            return null;
        const room = this.rooms.get(code);
        if (!room)
            return null;
        room.rematchVotes.add(playerId);
        const humanPlayers = room.players.filter(p => !p.isBot);
        const allVoted = humanPlayers.every(p => room.rematchVotes.has(p.id));
        return { allVoted, room };
    }
    resetForRematch(code) {
        const room = this.rooms.get(code);
        if (!room)
            return null;
        room.status = 'waiting';
        room.rematchVotes.clear();
        // Restaurar bots a estado inicial si es posible
        return room;
    }
    // ── GETTERS ───────────────────────────────────────────────────
    getRoom(code) {
        return this.rooms.get(code);
    }
    getRoomBySocket(socketId) {
        const code = this.socketToRoom.get(socketId);
        return code ? this.rooms.get(code) : undefined;
    }
    getRoomByPlayer(playerId) {
        const code = this.playerToRoom.get(playerId);
        return code ? this.rooms.get(code) : undefined;
    }
    setStatus(code, status) {
        const room = this.rooms.get(code);
        if (room)
            room.status = status;
    }
    // ── SERIALIZACIÓN ─────────────────────────────────────────────
    toRoomState(room) {
        const now = Date.now();
        const secondsLeft = room.autoStartAt
            ? Math.max(0, Math.ceil((room.autoStartAt - now) / 1000))
            : null;
        return {
            code: room.code,
            size: room.size,
            hostId: room.hostId,
            status: room.status,
            secondsUntilAutoStart: secondsLeft,
            players: room.players.map(p => this.toPlayerDTO(p)),
        };
    }
    toPlayerDTO(p) {
        return {
            id: p.id,
            name: p.name,
            avatarId: p.avatarId,
            colorId: p.colorId,
            seatIndex: p.seatIndex,
            isBot: p.isBot,
            isConnected: p.isConnected,
            isHost: p.isHost,
        };
    }
    nextFreeSeat(room) {
        const taken = new Set(room.players.map(p => p.seatIndex));
        for (let i = 0; i < room.size; i++) {
            if (!taken.has(i))
                return i;
        }
        return room.players.length;
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=RoomManager.js.map