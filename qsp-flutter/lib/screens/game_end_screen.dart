// ─────────────────────────────────────────────
//  QSP — FIN DE PARTIDA
//  🏆 Ganador + tabla final + revancha
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../theme/qsp_theme.dart';
import '../services/socket_service.dart';
import '../models/game_models.dart';
import 'home_screen.dart';

class GameEndScreen extends StatefulWidget {
  final GameEndResult result;
  const GameEndScreen({super.key, required this.result});

  @override
  State<GameEndScreen> createState() => _GameEndScreenState();
}

class _GameEndScreenState extends State<GameEndScreen> {
  bool _votedRematch = false;

  Future<void> _voteRematch() async {
    setState(() => _votedRematch = true);
    try {
      await SocketService.instance.voteRematch();
    } catch (_) {}
  }

  void _goHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final sorted = [...widget.result.finalScores]..sort((a, b) => b.totalScore.compareTo(a.totalScore));
    final iWon = SocketService.instance.myPlayerId == widget.result.winnerId;

    return Scaffold(
      body: Container(
        decoration: feltBackground(),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 20),
                const Text('🏆', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 12),
                Text(
                  iWon ? '¡GANASTE!' : '${widget.result.winnerName} GANÓ',
                  textAlign: TextAlign.center,
                  style: QSPTextStyles.logo(32),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.result.totalScore} puntos',
                  style: const TextStyle(color: QSPColors.gold, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 28),

                Text('TABLA FINAL', style: QSPTextStyles.caption),
                const SizedBox(height: 12),

                Expanded(
                  child: ListView.separated(
                    itemCount: sorted.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final r = sorted[index];
                      final isWinner = r.playerId == widget.result.winnerId;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isWinner ? QSPColors.gold.withOpacity(.12) : Colors.white.withOpacity(.05),
                          borderRadius: BorderRadius.circular(QSPRadii.md),
                          border: isWinner ? Border.all(color: QSPColors.gold, width: 1.5) : null,
                        ),
                        child: Row(
                          children: [
                            Text('${index + 1}°', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w800)),
                            const SizedBox(width: 12),
                            if (isWinner) const Padding(padding: EdgeInsets.only(right: 6), child: Text('🏆', style: TextStyle(fontSize: 16))),
                            Expanded(child: Text(r.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
                            Text('${r.totalScore} pts', style: const TextStyle(color: QSPColors.gold, fontWeight: FontWeight.w800)),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 20),

                if (!_votedRematch)
                  Column(
                    children: [
                      QSPPrimaryButton(label: 'JUGAR REVANCHA', onPressed: _voteRematch, width: double.infinity),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: _goHome,
                        child: Text('Volver al inicio', style: TextStyle(color: Colors.white.withOpacity(.6))),
                      ),
                    ],
                  )
                else
                  Column(
                    children: [
                      const CircularProgressIndicator(color: QSPColors.neonTeal),
                      const SizedBox(height: 8),
                      Text('Esperando a los demás jugadores...', style: TextStyle(color: Colors.white.withOpacity(.6), fontSize: 13)),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
