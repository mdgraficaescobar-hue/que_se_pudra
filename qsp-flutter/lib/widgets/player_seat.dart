// ─────────────────────────────────────────────
//  QSP — WIDGET: ASIENTO DE JUGADOR
//  Indicadores: 👑 Mano · 🎯 Apuesta · 🤖 Bot
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../theme/qsp_theme.dart';
import 'playing_card.dart';

class PlayerSeat extends StatelessWidget {
  final GamePlayer player;
  final bool isDealer;        // 👑
  final bool isCurrentTurn;
  final bool isCompact;        // true para rivales (cartas pequeñas/reverso)

  const PlayerSeat({
    super.key,
    required this.player,
    required this.isDealer,
    required this.isCurrentTurn,
    this.isCompact = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isCurrentTurn ? QSPColors.gold.withOpacity(.12) : Colors.black.withOpacity(.25),
        borderRadius: BorderRadius.circular(QSPRadii.md),
        border: Border.all(
          color: isCurrentTurn ? QSPColors.gold : Colors.white.withOpacity(.1),
          width: isCurrentTurn ? 2 : 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isDealer) const Padding(
                padding: EdgeInsets.only(right: 4),
                child: Text('👑', style: TextStyle(fontSize: 13)),
              ),
              if (player.isBot) const Padding(
                padding: EdgeInsets.only(right: 4),
                child: Text('🤖', style: TextStyle(fontSize: 12)),
              ),
              Flexible(
                child: Text(
                  player.name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _StatChip(
                icon: '🎯',
                value: player.bet?.toString() ?? '–',
              ),
              const SizedBox(width: 6),
              _StatChip(
                icon: '✋',
                value: '${player.tricksWon}',
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${player.totalScore} pts',
            style: const TextStyle(color: QSPColors.gold, fontSize: 11, fontWeight: FontWeight.w700),
          ),
          if (isCompact && player.cardCount > 0) ...[
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(
                player.cardCount > 5 ? 1 : player.cardCount,
                (i) => Padding(
                  padding: const EdgeInsets.only(left: 2),
                  child: player.cardCount > 5
                      ? Text('x${player.cardCount}', style: const TextStyle(color: Colors.white60, fontSize: 10))
                      : const CardBack(width: 16, height: 22),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String icon;
  final String value;

  const _StatChip({required this.icon, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: const TextStyle(fontSize: 10)),
          const SizedBox(width: 3),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
