// ─────────────────────────────────────────────
//  QSP — PANTALLA PRINCIPAL
//  Port fiel del mock aprobado, optimizado:
//  sin imágenes pesadas, todo vectorial/nativo.
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../theme/qsp_theme.dart';
import 'lobby_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: feltBackground(),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Column(
                    children: [
                      _TopBar(),
                      const SizedBox(height: 8),
                      _Logo(),
                      const SizedBox(height: 12),
                      const _HeroIllustration(),
                      const SizedBox(height: 16),
                      QSPPrimaryButton(
                        label: 'INGRESAR',
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const LobbyScreen()),
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                      const _FeaturePills(),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

// ── TOP BAR ──────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _TopBarButton(
            icon: Icons.settings_outlined,
            label: 'AJUSTES',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
          const _SuitsRow(),
          _TopBarButton(
            icon: Icons.person_outline,
            label: 'PERFIL',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _TopBarButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _TopBarButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Column(
          children: [
            Icon(icon, color: Colors.white.withOpacity(.8), size: 24),
            const SizedBox(height: 4),
            Text(label, style: QSPTextStyles.caption),
          ],
        ),
      ),
    );
  }
}

class _SuitsRow extends StatelessWidget {
  const _SuitsRow();

  @override
  Widget build(BuildContext context) {
    final suits = [
      ('♠', QSPColors.cardBlack),
      ('♥', QSPColors.cardRed),
      ('♣', QSPColors.cardBlack),
      ('♦', QSPColors.cardRed),
    ];
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(color: QSPColors.neonMag.withOpacity(.5), blurRadius: 12),
        ],
      ),
      child: Row(
        children: suits
            .map((s) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(s.$1, style: TextStyle(fontSize: 20, color: s.$2)),
                ))
            .toList(),
      ),
    );
  }
}

// ── LOGO ─────────────────────────────────────────────────────────

class _Logo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('QUÉ SE\nPUDRA', textAlign: TextAlign.center, style: QSPTextStyles.logo(58)),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1A2E80), Color(0xFF2A44B0), Color(0xFF1A2E80)],
            ),
            border: Border.all(color: Colors.white.withOpacity(.25), width: 2),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Text(
            'POKER CLUB',
            style: TextStyle(
              fontFamily: 'RussoOne',
              fontSize: 14,
              letterSpacing: 4,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}

// ── HERO: mesa, cartas, fichas, bot ─────────────────────────────

class _HeroIllustration extends StatelessWidget {
  const _HeroIllustration();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 190,
      width: 360,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          // Mesa
          Positioned(
            bottom: 0,
            child: Container(
              width: 300,
              height: 80,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.4),
                  colors: [const Color(0xFF1A6644), QSPColors.feltDark],
                ),
                border: Border.all(color: const Color(0xFF8B6914), width: 3),
                borderRadius: BorderRadius.circular(150),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(.7), blurRadius: 32, offset: const Offset(0, 8)),
                ],
              ),
            ),
          ),
          // Cartas en abanico
          Positioned(
            bottom: 46,
            child: SizedBox(
              width: 150,
              height: 70,
              child: Stack(
                children: [
                  _fanCard('A', '♠', QSPColors.cardBlack, -20, 0),
                  _fanCard('K', '♥', QSPColors.cardRed, -10, 24),
                  _fanCard('Q', '♣', QSPColors.cardBlack, 0, 48),
                  _fanCard('J', '♦', QSPColors.cardRed, 10, 72),
                  _fanCard('10', '♥', QSPColors.cardRed, 20, 96),
                ],
              ),
            ),
          ),
          // Fichas
          const Positioned(
            bottom: 50,
            right: 40,
            child: _ChipsStack(),
          ),
          // Bot
          const Positioned(
            bottom: 64,
            left: 16,
            child: Text('🤖', style: TextStyle(fontSize: 38)),
          ),
          // Persona
          const Positioned(
            bottom: 64,
            right: 8,
            child: Text('🧑‍🦱', style: TextStyle(fontSize: 32)),
          ),
        ],
      ),
    );
  }

  Widget _fanCard(String rank, String suit, Color color, double angleDeg, double left) {
    return Positioned(
      left: left,
      bottom: 0,
      child: Transform.rotate(
        angle: angleDeg * 3.14159 / 180,
        alignment: Alignment.bottomCenter,
        child: Container(
          width: 42,
          height: 58,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(5),
            border: Border.all(color: Colors.grey.shade300),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(.4), blurRadius: 4, offset: const Offset(2, 2))],
          ),
          child: Stack(
            children: [
              Align(
                alignment: Alignment.topLeft,
                child: Text(rank, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color, height: 1)),
              ),
              Align(
                alignment: Alignment.bottomRight,
                child: Transform.rotate(
                  angle: 3.14159,
                  child: Text(suit, style: TextStyle(fontSize: 12, color: color)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChipsStack extends StatelessWidget {
  const _ChipsStack();

  @override
  Widget build(BuildContext context) {
    final chips = [QSPColors.chipGreen, QSPColors.chipRed, QSPColors.chipBlue, QSPColors.chipGreen, QSPColors.chipRed];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: chips
          .map((c) => Container(
                margin: const EdgeInsets.only(bottom: 1),
                width: 32,
                height: 9,
                decoration: BoxDecoration(
                  color: c,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(.3), width: 1.5),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(.5), blurRadius: 3, offset: const Offset(0, 2))],
                ),
              ))
          .toList(),
    );
  }
}

// ── FEATURE PILLS ────────────────────────────────────────────────

class _FeaturePills extends StatelessWidget {
  const _FeaturePills();

  @override
  Widget build(BuildContext context) {
    final features = [
      ('👥', '4–6', 'JUGADORES'),
      ('🃏', '10', 'RONDAS'),
      ('🎯', 'Visibles', 'APUESTAS'),
      ('🤖', 'Smart', 'BOTS'),
      ('🏆', 'Al Más Hábil', 'GANA'),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 8,
        runSpacing: 10,
        children: features.map((f) => _FeaturePill(emoji: f.$1, value: f.$2, label: f.$3)).toList(),
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  final String emoji;
  final String value;
  final String label;

  const _FeaturePill({required this.emoji, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 92,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.07),
        border: Border.all(color: Colors.white.withOpacity(.1)),
        borderRadius: BorderRadius.circular(QSPRadii.md),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontFamily: 'RussoOne', fontSize: 12, color: QSPColors.gold)),
          const SizedBox(height: 2),
          Text(label, textAlign: TextAlign.center, style: QSPTextStyles.caption),
        ],
      ),
    );
  }
}
