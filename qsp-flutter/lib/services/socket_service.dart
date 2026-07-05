// ─────────────────────────────────────────────
//  QSP — SOCKET SERVICE
//  Única puerta de entrada/salida hacia el servidor.
//  Ninguna pantalla habla con Socket.IO directamente.
// ─────────────────────────────────────────────

import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/game_models.dart';

class SocketService {
  SocketService._internal();
  static final SocketService instance = SocketService._internal();

  IO.Socket? _socket;
  String? myPlayerId;
  String? myRoomCode;

  // ── STREAMS (la UI escucha esto, nunca al socket directo) ──────

  final _roomController = StreamController<RoomState>.broadcast();
  final _snapshotController = StreamController<GameSnapshot>.broadcast();
  final _trickEndController = StreamController<TrickResult>.broadcast();
  final _roundEndController = StreamController<RoundResult>.broadcast();
  final _gameEndController = StreamController<GameEndResult>.broadcast();
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _errorController = StreamController<String>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  Stream<RoomState> get onRoomUpdated => _roomController.stream;
  Stream<GameSnapshot> get onSnapshot => _snapshotController.stream;
  Stream<TrickResult> get onTrickEnd => _trickEndController.stream;
  Stream<RoundResult> get onRoundEnd => _roundEndController.stream;
  Stream<GameEndResult> get onGameEnd => _gameEndController.stream;
  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;
  Stream<String> get onError => _errorController.stream;
  Stream<bool> get onConnectionChange => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;

  // ── CONEXIÓN ─────────────────────────────────────────────────

  Future<void> connect(String serverUrl) async {
    if (_socket != null && _socket!.connected) return;

    _socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['polling', 'websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket!.onConnect((_) => _connectionController.add(true));
    _socket!.onDisconnect((_) => _connectionController.add(false));

    _socket!.on('room:updated', (data) {
      _roomController.add(RoomState.fromJson(data));
    });

    _socket!.on('room:started', (data) {
      _snapshotController.add(GameSnapshot.fromJson(data));
    });

    _socket!.on('game:snapshot', (data) {
      _snapshotController.add(GameSnapshot.fromJson(data));
    });

    _socket!.on('game:trick_end', (data) {
      _trickEndController.add(TrickResult.fromJson(data));
    });

    _socket!.on('game:round_end', (data) {
      _roundEndController.add(RoundResult.fromJson(data));
    });

    _socket!.on('game:end', (data) {
      _gameEndController.add(GameEndResult.fromJson(data));
    });

    _socket!.on('game:message', (data) {
      _messageController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('error', (data) {
      _errorController.add(data['message'] ?? 'Error desconocido');
    });

    // Esperar conexión real antes de devolver
    final completer = Completer<void>();
    _socket!.onConnect((_) {
      if (!completer.isCompleted) completer.complete();
    });
    _socket!.connect();

    return completer.future.timeout(
      const Duration(seconds: 8),
      onTimeout: () => throw Exception('No se pudo conectar al servidor.'),
    );
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  // ── PERSISTENCIA LOCAL (UUID del jugador) ───────────────────────

  Future<String> getOrCreatePlayerId() async {
    final prefs = await SharedPreferences.getInstance();
    String? id = prefs.getString('qsp_player_uuid');
    if (id == null) {
      id = DateTime.now().millisecondsSinceEpoch.toString() +
          (1000 + DateTime.now().microsecond % 9000).toString();
      await prefs.setString('qsp_player_uuid', id);
    }
    return id;
  }

  // ── ACCIONES: SALA ───────────────────────────────────────────

  Future<Map<String, dynamic>> createRoom({
    required String playerName,
    required String avatarId,
    required String colorId,
    required int size,
  }) async {
    final data = await _emitWithAck('room:create', {
      'playerName': playerName,
      'avatarId': avatarId,
      'colorId': colorId,
      'size': size,
    });
    myPlayerId = data['yourPlayerId'];
    myRoomCode = data['roomCode'];
    return data;
  }

  Future<Map<String, dynamic>> joinRoom({
    required String code,
    required String playerName,
    required String avatarId,
    required String colorId,
  }) async {
    final data = await _emitWithAck('room:join', {
      'code': code,
      'playerName': playerName,
      'avatarId': avatarId,
      'colorId': colorId,
    });
    myPlayerId = data['yourPlayerId'];
    myRoomCode = data['roomCode'];
    return data;
  }

  Future<Map<String, dynamic>> quickMatch({
    required String playerName,
    required String avatarId,
    required String colorId,
    int preferredSize = 4,
  }) async {
    final data = await _emitWithAck('room:quick', {
      'playerName': playerName,
      'avatarId': avatarId,
      'colorId': colorId,
      'preferredSize': preferredSize,
    });
    myPlayerId = data['yourPlayerId'];
    myRoomCode = data['roomCode'];
    return data;
  }

  Future<Map<String, dynamic>> startRoom() => _emitWithAck('room:start', {});

  Future<Map<String, dynamic>> leaveGame() => _emitWithAck('room:leave', {});

  Future<Map<String, dynamic>> voteRematch() => _emitWithAck('room:rematch', {});

  // ── ACCIONES: JUEGO ──────────────────────────────────────────

  Future<Map<String, dynamic>> placeBet(int bet) =>
      _emitWithAck('game:bet', {'bet': bet});

  Future<Map<String, dynamic>> playCard(int cardIndex) =>
      _emitWithAck('game:play', {'cardIndex': cardIndex});

  void sendQuickMessage(String messageId) {
    _socket?.emit('game:message', {'messageId': messageId});
  }

  // ── HELPER: emit con acknowledgment tipado como Future ─────────

  Future<Map<String, dynamic>> _emitWithAck(
    String event,
    Map<String, dynamic> payload,
  ) {
    final completer = Completer<Map<String, dynamic>>();

    if (_socket == null || !_socket!.connected) {
      completer.completeError('No conectado al servidor.');
      return completer.future;
    }

    _socket!.emitWithAck(event, payload, ack: (response) {
      final res = Map<String, dynamic>.from(response);
      if (res['ok'] == true) {
        completer.complete(Map<String, dynamic>.from(res['data'] ?? {}));
      } else {
        completer.completeError(res['error'] ?? 'Error desconocido');
      }
    });

    return completer.future.timeout(
      const Duration(seconds: 6),
      onTimeout: () => throw Exception('Tiempo de espera agotado.'),
    );
  }

  void dispose() {
    _roomController.close();
    _snapshotController.close();
    _trickEndController.close();
    _roundEndController.close();
    _gameEndController.close();
    _messageController.close();
    _errorController.close();
    _connectionController.close();
    disconnect();
  }
}
