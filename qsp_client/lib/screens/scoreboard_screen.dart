// ─────────────────────────────────────────────
//  QSP — SCOREBOARD ENTRE RONDAS
// ─────────────────────────────────────────────

import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/qsp_theme.dart';
import '../models/game_models.dart';
import 'game_screen.dart';

class ScoreboardScreen extends StatefulWidget {
  final RoundResult result;
  const ScoreboardScreen({super.key, required this.result});

  @override
  State<ScoreboardScreen> createState() => _ScoreboardScreenState();
}

class _ScoreboardScreenState extends State<ScoreboardScreen> {
  @override
  void initState() {
    super.initState();
    // El servidor avanza de ronda automáticamente a los 4s.
    // Volvemos a la mesa cuando llegue el próximo snapshot.
    Timer(const Duration(milliseconds: 3800), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const GameScreen()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final sorted = [...widget.result.results]..sort((a, b) => b.totalScore.compareTo(a.totalScore));

    return Scaffold(
      body: Container(
        decoration: feltBackground(),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Text('RONDA ${widget.result.roundNumber} TERMINADA', style: QSPTextStyles.heading),
                const SizedBox(height: 4),
                Text('Próxima ronda en unos segundos...', style: TextStyle(color: Colors.white.withOpacity(.5), fontSize: 12)),
                const SizedBox(height: 24),

                Expanded(
                  child: ListView.separated(
                    itemCount: sorted.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final r = sorted[index];
                      return _ScoreRow(result: r, position: index + 1);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ScoreRow extends StatelessWidget {
  final PlayerRoundResult result;
  final int position;

  const _ScoreRow({required this.result, required this.position});

  @override
  Widget build(BuildContext context) {
    final color = result.betFulfilled ? QSPColors.success : QSPColors.danger;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.06),
        borderRadius: BorderRadius.circular(QSPRadii.md),
        border: Border.all(color: color.withOpacity(.3)),
      ),
      child: Row(
        children: [
          Text('#$position', style: TextStyle(color: Colors.white.withOpacity(.4), fontSize: 13, fontWeight: FontWeight.w800)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(result.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text('Apostó ${result.bet} · Ganó ${result.tricksWon}', style: TextStyle(color: Colors.white.withOpacity(.6), fontSize: 12)),
                    const SizedBox(width: 6),
                    Icon(
                      result.betFulfilled ? Icons.check_circle : Icons.cancel,
                      size: 14,
                      color: color,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('+${result.roundScore}', style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 16)),
              Text('${result.totalScore} pts', style: const TextStyle(color: QSPColors.gold, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }
}
