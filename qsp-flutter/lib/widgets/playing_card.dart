// ─────────────────────────────────────────────
//  QSP — WIDGET: CARTA
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../models/game_models.dart' as models;
import '../theme/qsp_theme.dart';

class PlayingCard extends StatelessWidget {
  final models.Card card;
  final double width;
  final double height;
  final bool dimmed;

  const PlayingCard({
    super.key,
    required this.card,
    this.width = 52,
    this.height = 72,
    this.dimmed = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = card.isRed ? QSPColors.cardRed : QSPColors.cardBlack;

    return Opacity(
      opacity: dimmed ? 0.5 : 1,
      child: Container(
        width: width,
        height: height,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(.35), blurRadius: 5, offset: const Offset(2, 3)),
          ],
        ),
        child: Stack(
          children: [
            Align(
              alignment: Alignment.topLeft,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(card.rank, style: TextStyle(fontSize: width * 0.26, fontWeight: FontWeight.w800, color: color, height: 1)),
                  Text(card.suitSymbol, style: TextStyle(fontSize: width * 0.22, color: color, height: 1)),
                ],
              ),
            ),
            Align(
              alignment: Alignment.bottomRight,
              child: Transform.rotate(
                angle: 3.14159,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(card.rank, style: TextStyle(fontSize: width * 0.26, fontWeight: FontWeight.w800, color: color, height: 1)),
                    Text(card.suitSymbol, style: TextStyle(fontSize: width * 0.22, color: color, height: 1)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Reverso de carta — usado para mostrar las manos de los rivales
class CardBack extends StatelessWidget {
  final double width;
  final double height;

  const CardBack({super.key, this.width = 36, this.height = 50});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A2E80), Color(0xFF2A44B0)],
        ),
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: Colors.white.withOpacity(.3), width: 1.5),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(.4), blurRadius: 3, offset: const Offset(1, 2))],
      ),
      child: Center(
        child: Text('♠', style: TextStyle(fontSize: width * 0.4, color: Colors.white.withOpacity(.4))),
      ),
    );
  }
}
