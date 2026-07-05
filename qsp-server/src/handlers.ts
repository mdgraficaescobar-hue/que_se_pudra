// ─────────────────────────────────────────────
//  QSP SERVER — SOCKET HANDLER
//  Toda la lógica de eventos Socket.IO
// ─────────────────────────────────────────────

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './rooms/RoomManager';
import { GameSession } from './game/GameSession';
import { botDecideBet, botDecideCard, botThinkTime } from './bot/bot';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  QUICK_MESSAGES,
} from './events';

type QSPSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type QSPServer = Server<ClientToServerEvents, ServerToClientEvents>;

const roomManager = new RoomManager();
/** roomCode → GameSession activa */
const gameSessions = new Map<string, GameSession>();

export function registerHandlers(io: QSPServer, socket: QSPSocket): void {
  const playerId = uuidv4(); // UUID único por conexión

  // ── SALA: CREAR ───────────────────────────────────────────────

  socket.on('room:create', (payload, cb) => {
    try {
      const room = roomManager.createRoom(
        socket.id, playerId,
        payload.playerName, payload.avatarId, payload.colorId,
        payload.size,
      );

      socket.join(room.code);

      cb({ ok: true, data: {
        roomCode: room.code,
        yourPlayerId: playerId,
        roomState: roomManager.toRoomState(room),
      }});

      broadcastRoomState(io, room.code);
    } catch (e: any) {
      cb({ ok: false, error: e.message });
    }
  });

  // ── SALA: UNIRSE ──────────────────────────────────────────────

  socket.on('room:join', (payload, cb) => {
    const result = roomManager.joinRoom(
      socket.id, playerId,
      payload.playerName, payload.avatarId, payload.colorId,
      payload.code,
    );

    if (result.error) { cb({ ok: false, error: result.error }); return; }

    const room = result.room!;
    socket.join(room.code);

    cb({ ok: true, data: {
      roomCode: room.code,
      yourPlayerId: playerId,
      roomState: roomManager.toRoomState(room),
    }});

    broadcastRoomState(io, room.code);

    // Sala llena → programar auto-start
    const humanCount = room.players.filter(p => !p.isBot).length;
    if (humanCount >= room.size) {
      roomManager.scheduleAutoStart(room.code, () => startGame(io, room.code));
      broadcastRoomState(io, room.code);
    }
  });

  // ── SALA: QUICK MATCH ─────────────────────────────────────────

  socket.on('room:quick', (payload, cb) => {
    const room = roomManager.quickMatch(
      socket.id, playerId,
      payload.playerName, payload.avatarId, payload.colorId,
      payload.preferredSize ?? 4,
    );

    socket.join(room.code);

    cb({ ok: true, data: {
      roomCode: room.code,
      yourPlayerId: playerId,
      roomState: roomManager.toRoomState(room),
    }});

    broadcastRoomState(io, room.code);
  });

  // ── SALA: INICIAR MANUALMENTE ─────────────────────────────────

  socket.on('room:start', (...args) => { const cb = typeof args[0] === 'function' ? args[0] : () => {};
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) { cb({ ok: false, error: 'No estás en ninguna sala.' }); return; }
    if (room.hostId !== playerId) { cb({ ok: false, error: 'Solo el host puede iniciar.' }); return; }
    if (room.players.filter(p => !p.isBot).length < 1) {
      cb({ ok: false, error: 'Se necesitan al menos 2 jugadores.' }); return;
    }

    roomManager.cancelAutoStart(room.code);
    cb({ ok: true, data: {} });
    startGame(io, room.code);
  });

  // ── SALA: IRSE AL MAZO ────────────────────────────────────────

  socket.on('room:leave', (cb) => {
    const result = roomManager.leaveGame(playerId);
    if (!result) { cb({ ok: false, error: 'No estás en una partida.' }); return; }

    socket.leave(result.room.code);
    cb({ ok: true, data: {} });

    // Notificar a la sala
    io.to(result.room.code).emit('player:disconnected', {
      playerId,
      playerName: result.player.name,
      replacedByBot: true,
    });

    broadcastRoomState(io, result.room.code);
  });

  // ── SALA: REVANCHA ────────────────────────────────────────────

  socket.on('room:rematch', (cb) => {
    const result = roomManager.voteRematch(playerId);
    if (!result) { cb({ ok: false, error: 'Error al votar revancha.' }); return; }

    cb({ ok: true, data: {} });

    if (result.allVoted) {
      const room = roomManager.resetForRematch(result.room.code);
      if (room) {
        broadcastRoomState(io, room.code);
        setTimeout(() => startGame(io, room.code), 2000);
      }
    }
  });

  // ── JUEGO: APOSTAR ────────────────────────────────────────────

  socket.on('game:bet', (payload, cb) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) { cb({ ok: false, error: 'No estás en una sala.' }); return; }

    const session = gameSessions.get(room.code);
    if (!session) { cb({ ok: false, error: 'El juego no está activo.' }); return; }

    const result = session.placeBet(playerId, payload.bet);
    if (!result.success) { cb({ ok: false, error: result.reason ?? 'Error al apostar.' }); return; }

    cb({ ok: true, data: {} });
    broadcastSnapshots(io, room.code, session);

    // Si pasamos a PLAYING → activar bots si corresponde
    if (result.snapshot.state === 'PLAYING') {
      scheduleBotActions(io, room.code, session);
    } else if (result.snapshot.state === 'BETTING') {
      // ¿Le toca apostar a un bot?
      scheduleBotBet(io, room.code, session);
    }
  });

  // ── JUEGO: JUGAR CARTA ────────────────────────────────────────

  socket.on('game:play', (payload, cb) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) { cb({ ok: false, error: 'No estás en una sala.' }); return; }

    const session = gameSessions.get(room.code);
    if (!session) { cb({ ok: false, error: 'El juego no está activo.' }); return; }

    const result = session.playCard(playerId, payload.cardIndex);
    if (!result.success) { cb({ ok: false, error: result.reason ?? 'Movimiento inválido.' }); return; }

    cb({ ok: true, data: {} });

    if (result.trickResult) {
      // Fin de mano
      const trickDTO = session.toTrickResultDTO(result.trickResult.winnerId);
      io.to(room.code).emit('game:trick_end', trickDTO);

      if (result.snapshot.state === 'ROUND_END') {
        handleRoundEnd(io, room.code, session);
      } else {
        broadcastSnapshots(io, room.code, session);
        scheduleBotActions(io, room.code, session);
      }
    } else {
      broadcastSnapshots(io, room.code, session);
      scheduleBotActions(io, room.code, session);
    }
  });

  // ── MENSAJES RÁPIDOS ──────────────────────────────────────────

  socket.on('game:message', (payload) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const msgData = QUICK_MESSAGES[payload.messageId];
    if (!msgData) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    io.to(room.code).emit('game:message', {
      senderId: playerId,
      senderName: player.name,
      messageId: payload.messageId,
      text: msgData.text,
      emoji: msgData.emoji,
    });
  });

  // ── DESCONEXIÓN ───────────────────────────────────────────────

  socket.on('disconnect', () => {
    const { room, player } = roomManager.handleDisconnect(socket.id);
    if (!room || !player) return;

    io.to(room.code).emit('player:disconnected', {
      playerId: player.id,
      playerName: player.name,
      replacedByBot: room.status === 'playing',
    });

    broadcastRoomState(io, room.code);

    // Si estaba en juego, el bot toma control automáticamente
    if (room.status === 'playing') {
      const session = gameSessions.get(room.code);
      if (session) {
        scheduleBotActions(io, room.code, session);
      }
    }
  });

  // ── RECONEXIÓN ────────────────────────────────────────────────
  // El cliente envía su UUID guardado en localStorage al reconectarse

  socket.on('room:join', (payload: any, cb) => {
    // Si payload contiene un playerId existente → es reconexión
    if (payload._reconnectId) {
      const result = roomManager.tryReconnect(socket.id, payload._reconnectId);
      if (result) {
        socket.join(result.room.code);
        io.to(result.room.code).emit('player:reconnected', {
          playerId: result.player.id,
          playerName: result.player.name,
        });
        broadcastRoomState(io, result.room.code);
        return;
      }
    }
  });
}

// ── FUNCIONES AUXILIARES ──────────────────────────────────────────

/** Inicia el juego en una sala */
function startGame(io: QSPServer, roomCode: string): void {
  const room = roomManager.getRoom(roomCode);
  if (!room || room.status !== 'waiting') return;

  // Completar con bots si la sala no está llena
  fillWithBots(room);
  roomManager.setStatus(roomCode, 'playing');

  const session = new GameSession(room);
  gameSessions.set(roomCode, session);
  session.start();

  setTimeout(() => { io.to(roomCode).emit('room:started', session.toPublicSnapshotDTO());
  broadcastSnapshots(io, roomCode, session);
  scheduleBotBet(io, roomCode, session);
  }, 1500);
}

/** Rellena los asientos vacíos con bots */
function fillWithBots(room: any): void {
  let botN = 1;
  while (room.players.length < room.size) {
    room.players.push({
      id: `bot-${uuidv4()}`,
      socketId: '',
      name: `Bot ${botN++}`,
      avatarId: 'bot',
      colorId: 'gray',
      seatIndex: room.players.length,
      isBot: true,
      isConnected: true,
      isHost: false,
      disconnectedAt: null,
    });
  }
}

/** Envía el snapshot correcto a cada jugador */
function broadcastSnapshots(io: QSPServer, roomCode: string, session: GameSession): void {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const validBets = session.getValidBets();
  const snap = session.getSnapshot();
  const bettorId = snap.bettingOrder[snap.currentBettorIndex] ?? null;

  room.players
    .filter(p => !p.isBot && p.socketId)
    .forEach(p => {
      const playerValidBets = p.id === bettorId ? validBets : null;
      const dto = session.toSnapshotDTO(p.id, playerValidBets);
      io.to(p.socketId).emit('game:snapshot', dto);
    });
}

/** Broadcast del estado de sala a todos */
function broadcastRoomState(io: QSPServer, roomCode: string): void {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  io.to(roomCode).emit('room:updated', roomManager.toRoomState(room));
}

/** Maneja fin de ronda → emite resultado → avanza */
function handleRoundEnd(io: QSPServer, roomCode: string, session: GameSession): void {
  const { results } = session.endRound();
  const roundDTO = session.toRoundResultDTO(results);
  io.to(roomCode).emit('game:round_end', roundDTO);

  if (session.getState() === 'GAME_END') {
    const gameEndDTO = session.toGameEndDTO();
    io.to(roomCode).emit('game:end', gameEndDTO);
    roomManager.setStatus(roomCode, 'finished');
    gameSessions.delete(roomCode);
    return;
  }

  // Pausa antes de siguiente ronda (el cliente muestra el scoreboard)
  setTimeout(() => {
    session.nextRound();
    broadcastSnapshots(io, roomCode, session);
    scheduleBotBet(io, roomCode, session);
  }, 4000);
}

/** Programa la apuesta de un bot si es su turno */
function scheduleBotBet(io: QSPServer, roomCode: string, session: GameSession): void {
  const snap = session.getSnapshot();
  if (snap.state !== 'BETTING') return;

  const bettorId = snap.bettingOrder[snap.currentBettorIndex];
  const bettorData = snap.players.find(p => p.id === bettorId);
  if (!bettorData?.isBot) return;

  const validBets = session.getValidBets();

  setTimeout(() => {
    const bet = botDecideBet(bettorId, session.getSnapshot(), validBets);
    const result = session.placeBet(bettorId, bet);

    if (result.success) {
      broadcastSnapshots(io, roomCode, session);

      if (result.snapshot.state === 'PLAYING') {
        scheduleBotActions(io, roomCode, session);
      } else {
        scheduleBotBet(io, roomCode, session);
      }
    }
  }, botThinkTime());
}

/** Programa la jugada de un bot si es su turno */
function scheduleBotActions(io: QSPServer, roomCode: string, session: GameSession): void {
  const snap = session.getSnapshot();
  if (snap.state !== 'PLAYING') return;

  const currentPlayerId = snap.playOrder[snap.currentPlayerIndex];
  const currentPlayer = snap.players.find(p => p.id === currentPlayerId);
  if (!currentPlayer?.isBot) return;

  setTimeout(() => {
    const cardIndex = botDecideCard(currentPlayerId, session.getSnapshot());
    const result = session.playCard(currentPlayerId, cardIndex);

    if (result.success) {
      if (result.trickResult) {
        const trickDTO = session.toTrickResultDTO(result.trickResult.winnerId);
        io.to(roomCode).emit('game:trick_end', trickDTO);

        if (session.getState() === 'ROUND_END') {
          handleRoundEnd(io, roomCode, session);
        } else {
          broadcastSnapshots(io, roomCode, session);
          scheduleBotActions(io, roomCode, session);
        }
      } else {
        broadcastSnapshots(io, roomCode, session);
        scheduleBotActions(io, roomCode, session);
      }
    }
  }, botThinkTime());
}
