// ─────────────────────────────────────────────
//  QSP — SALA DE ESPERA
//  Muestra jugadores, código para compartir,
//  cuenta regresiva de auto-inicio.
// ─────────────────────────────────────────────

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/qsp_theme.dart';
import '../services/socket_service.dart';
import '../models/game_models.dart';
import 'game_screen.dart';

class RoomScreen extends StatefulWidget {
  final String roomCode;
  const RoomScreen({super.key, required this.roomCode});

  @override
  State<RoomScreen> createState() => _RoomScreenState();
}

class _RoomScreenState extends State<RoomScreen> {
  RoomState? _room;
  StreamSubscription? _roomSub;
  StreamSubscription? _snapshotSub;
  bool _starting = false;

  @override
  void initState() {
    super.initState();
    _roomSub = SocketService.instance.onRoomUpdated.listen((state) {
      if (mounted) setState(() => _room = state);
    });

    // Cuando el juego arranca, navegamos a la mesa
    _snapshotSub = SocketService.instance.onSnapshot.listen((snapshot) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const GameScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _roomSub?.cancel();
    _snapshotSub?.cancel();
    super.dispose();
  }

  bool get _isHost =>
      _room != null && SocketService.instance.myPlayerId == _room!.hostId;

  Future<void> _startNow() async {
    setState(() => _starting = true);
    try {
      await SocketService.instance.startRoom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final room = _room;

    return Scaffold(
      body: Container(
        decoration: feltBackground(),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                    ),
                    const Spacer(),
                    Text('SALA DE ESPERA', style: QSPTextStyles.heading),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
                const SizedBox(height: 20),

                // Código de sala
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: widget.roomCode));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Código copiado')),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(.06),
                      border: Border.all(color: QSPColors.gold.withOpacity(.4), width: 1.5),
                      borderRadius: BorderRadius.circular(QSPRadii.lg),
                    ),
                    child: Column(
                      children: [
                        Text('CÓDIGO DE SALA', style: QSPTextStyles.caption),
                        const SizedBox(height: 6),
                        Text(
                          widget.roomCode,
                          style: const TextStyle(
                            fontFamily: 'RussoOne',
                            fontSize: 32,
                            color: QSPColors.gold,
                            letterSpacing: 4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.copy, size: 13, color: Colors.white.withOpacity(.5)),
                            const SizedBox(width: 4),
                            Text('Tocá para copiar', style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(.5))),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                if (room != null) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'JUGADORES (${room.players.where((p) => !p.isBot).length}/${room.size})',
                        style: QSPTextStyles.caption,
                      ),
                      if (room.secondsUntilAutoStart != null)
                        Text(
                          'Inicio automático en ${room.secondsUntilAutoStart}s',
                          style: const TextStyle(fontSize: 12, color: QSPColors.neonTeal, fontWeight: FontWeight.w700),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Expanded(
                    child: ListView.separated(
                      itemCount: room.size,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final player = room.players.where((p) => p.seatIndex == index).firstOrNull;
                        return _PlayerSlot(player: player, isHost: player?.id == room.hostId);
                      },
                    ),
                  ),

                  const SizedBox(height: 16),

                  if (_isHost)
                    _starting
                        ? const Center(child: CircularProgressIndicator(color: QSPColors.gold))
                        : QSPPrimaryButton(
                            label: 'INICIAR CON BOTS',
                            onPressed: _startNow,
                            width: double.infinity,
                          )
                  else
                    Center(
                      child: Text(
                        'Esperando que el host inicie la partida...',
                        style: TextStyle(color: Colors.white.withOpacity(.6), fontSize: 13),
                      ),
                    ),
                ] else
                  const Expanded(child: Center(child: CircularProgressIndicator(color: QSPColors.gold))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlayerSlot extends StatelessWidget {
  final RoomPlayer? player;
  final bool isHost;

  const _PlayerSlot({required this.player, required this.isHost});

  @override
  Widget build(BuildContext context) {
    final empty = player == null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: empty ? Colors.white.withOpacity(.03) : Colors.white.withOpacity(.07),
        borderRadius: BorderRadius.circular(QSPRadii.md),
        border: Border.all(
          color: empty ? Colors.white.withOpacity(.08) : Colors.white.withOpacity(.15),
          style: empty ? BorderStyle.solid : BorderStyle.solid,
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: empty ? Colors.white.withOpacity(.05) : QSPColors.gold.withOpacity(.2),
            child: empty
                ? Icon(Icons.person_outline, color: Colors.white.withOpacity(.3))
                : Text(
                    player!.name.isNotEmpty ? player!.name[0].toUpperCase() : '?',
                    style: const TextStyle(color: QSPColors.gold, fontFamily: 'RussoOne'),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              empty ? 'Esperando jugador...' : player!.name,
              style: TextStyle(
                color: empty ? Colors.white.withOpacity(.3) : Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
          ),
          if (!empty && isHost)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: QSPColors.gold.withOpacity(.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('HOST', style: TextStyle(fontSize: 10, color: QSPColors.gold, fontWeight: FontWeight.w800)),
            ),
          if (!empty && !player!.isConnected)
            const Padding(
              padding: EdgeInsets.only(left: 8),
              child: Icon(Icons.wifi_off, size: 16, color: QSPColors.danger),
            ),
        ],
      ),
    );
  }
}
