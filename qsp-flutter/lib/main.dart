// ─────────────────────────────────────────────
//  QSP — MAIN
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'theme/qsp_theme.dart';

void main() {
  runApp(const QSPApp());
}

class QSPApp extends StatelessWidget {
  const QSPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Qué Se Pudra',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: QSPColors.feltDark,
        fontFamily: 'Nunito',
        colorScheme: ColorScheme.fromSeed(
          seedColor: QSPColors.gold,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
