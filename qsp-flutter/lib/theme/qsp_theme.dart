// ─────────────────────────────────────────────
//  QSP — DESIGN TOKENS
//  Paleta y constantes visuales únicas del proyecto.
//  Toda pantalla debe construirse a partir de esto.
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';

class QSPColors {
  QSPColors._();

  // Base
  static const gold      = Color(0xFFF5C518);
  static const goldDark  = Color(0xFFC8960A);
  static const neonMag   = Color(0xFFFF2EBF);
  static const neonTeal  = Color(0xFF00FFD1);

  // Felt (tapete)
  static const felt      = Color(0xFF0D3B2E);
  static const feltDark  = Color(0xFF081F18);
  static const feltMid   = Color(0xFF114535);

  // Texto
  static const textWhite   = Color(0xFFFFFFFF);
  static const textMuted   = Color(0xB3FFFFFF); // 70% white

  // Botón
  static const btnTop    = Color(0xFFFFCE00);
  static const btnMid    = Color(0xFFE8A800);
  static const btnBottom = Color(0xFFC47D00);
  static const btnShadow = Color(0xFF8B5E00);

  // Estados de juego
  static const success   = Color(0xFF3AD66B);
  static const danger    = Color(0xFFE74C3C);
  static const warning   = Color(0xFFF5A623);

  // Fichas
  static const chipGreen = Color(0xFF3A8C4A);
  static const chipRed   = Color(0xFFC0392B);
  static const chipBlue  = Color(0xFF2980B9);

  // Cartas
  static const cardRed   = Color(0xFFC0392B);
  static const cardBlack = Color(0xFF111111);
}

class QSPTextStyles {
  QSPTextStyles._();

  static const _display = 'RussoOne';
  static const _body    = 'Nunito';

  static TextStyle logo(double size) => TextStyle(
    fontFamily: _display,
    fontSize: size,
    color: QSPColors.gold,
    height: 0.9,
    letterSpacing: -1,
    shadows: [
      Shadow(color: QSPColors.gold.withOpacity(.5), blurRadius: 20),
      Shadow(color: QSPColors.goldDark, offset: const Offset(0, 4)),
      Shadow(color: Colors.black.withOpacity(.8), offset: const Offset(2, 8), blurRadius: 12),
    ],
  );

  static const button = TextStyle(
    fontFamily: _display,
    fontSize: 22,
    color: Color(0xFF3D1F00),
    letterSpacing: 2,
  );

  static const heading = TextStyle(
    fontFamily: _display,
    fontSize: 20,
    color: QSPColors.textWhite,
  );

  static const body = TextStyle(
    fontFamily: _body,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: QSPColors.textWhite,
  );

  static const bodyBold = TextStyle(
    fontFamily: _body,
    fontSize: 15,
    fontWeight: FontWeight.w800,
    color: QSPColors.textWhite,
  );

  static const caption = TextStyle(
    fontFamily: _body,
    fontSize: 11,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.5,
    color: QSPColors.textMuted,
  );
}

class QSPRadii {
  QSPRadii._();
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 20.0;
  static const pill = 50.0;
}

class QSPSpacing {
  QSPSpacing._();
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

/// Decoración reutilizable: el tapete de fondo en cada pantalla.
BoxDecoration feltBackground() => const BoxDecoration(
  gradient: RadialGradient(
    center: Alignment(0, -0.4),
    radius: 1.2,
    colors: [QSPColors.feltMid, QSPColors.feltDark],
  ),
);

/// Estilo de botón principal dorado, reutilizado en todas las pantallas.
class QSPPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final double width;

  const QSPPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.width = 280,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: width,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [QSPColors.btnTop, QSPColors.btnMid, QSPColors.btnBottom],
          ),
          borderRadius: BorderRadius.circular(QSPRadii.pill),
          boxShadow: [
            BoxShadow(color: QSPColors.btnShadow, offset: const Offset(0, 6)),
            BoxShadow(color: Colors.black.withOpacity(.5), offset: const Offset(0, 10), blurRadius: 24),
          ],
        ),
        alignment: Alignment.center,
        child: Text(label, style: QSPTextStyles.button),
      ),
    );
  }
}
