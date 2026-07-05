// ─────────────────────────────────────────────
//  QSP — PERFIL
//  MVP: sin login, sin email. Solo nombre,
//  color de ficha y avatar prediseñado.
//  Estadísticas: solo diarias (sin ranking global).
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/qsp_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  String _selectedColor = 'gold';
  String _selectedAvatar = 'default';

  // Estadísticas diarias (persistidas en local)
  int _gamesPlayed = 0;
  int _gamesWon = 0;
  int _totalPoints = 0;
  int _betsFulfilled = 0;

  final _colors = {
    'gold': QSPColors.gold,
    'teal': QSPColors.neonTeal,
    'mag': QSPColors.neonMag,
    'green': QSPColors.success,
  };

  final _avatars = ['😎', '🧑‍🦱', '👩‍🦰', '🧔', '👨‍🦲', '👩‍🦱'];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _nameController.text = prefs.getString('qsp_name') ?? 'Jugador';
      _selectedColor = prefs.getString('qsp_color') ?? 'gold';
      _selectedAvatar = prefs.getString('qsp_avatar') ?? '😎';
      _gamesPlayed = prefs.getInt('qsp_stats_played_today') ?? 0;
      _gamesWon = prefs.getInt('qsp_stats_won_today') ?? 0;
      _totalPoints = prefs.getInt('qsp_stats_points_today') ?? 0;
      _betsFulfilled = prefs.getInt('qsp_stats_bets_today') ?? 0;
    });
  }

  Future<void> _saveProfile() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('qsp_name', _nameController.text.trim());
    await prefs.setString('qsp_color', _selectedColor);
    await prefs.setString('qsp_avatar', _selectedAvatar);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Perfil guardado')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: feltBackground(),
        child: SafeArea(
          child: SingleChildScrollView(
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
                    Text('PERFIL', style: QSPTextStyles.heading),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
                const SizedBox(height: 20),

                // Avatar preview
                Center(
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _colors[_selectedColor]!.withOpacity(.15),
                      border: Border.all(color: _colors[_selectedColor]!, width: 3),
                    ),
                    alignment: Alignment.center,
                    child: Text(_selectedAvatar, style: const TextStyle(fontSize: 42)),
                  ),
                ),
                const SizedBox(height: 24),

                Text('NOMBRE', style: QSPTextStyles.caption),
                const SizedBox(height: 8),
                TextField(
                  controller: _nameController,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white.withOpacity(.06),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(QSPRadii.md),
                      borderSide: BorderSide(color: Colors.white.withOpacity(.15)),
                    ),
                  ),
                ),

                const SizedBox(height: 24),
                Text('AVATAR', style: QSPTextStyles.caption),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: _avatars.map((a) {
                    final selected = a == _selectedAvatar;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedAvatar = a),
                      child: Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: selected ? QSPColors.gold.withOpacity(.2) : Colors.white.withOpacity(.05),
                          border: Border.all(color: selected ? QSPColors.gold : Colors.transparent, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: Text(a, style: const TextStyle(fontSize: 24)),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 24),
                Text('COLOR DE FICHA', style: QSPTextStyles.caption),
                const SizedBox(height: 10),
                Row(
                  children: _colors.entries.map((e) {
                    final selected = e.key == _selectedColor;
                    return Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedColor = e.key),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: e.value,
                            shape: BoxShape.circle,
                            border: Border.all(color: selected ? Colors.white : Colors.transparent, width: 3),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 28),
                QSPPrimaryButton(label: 'GUARDAR', onPressed: _saveProfile, width: double.infinity),

                const SizedBox(height: 32),
                Row(children: [
                  Expanded(child: Divider(color: Colors.white.withOpacity(.15))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('ESTADÍSTICAS DE HOY', style: QSPTextStyles.caption),
                  ),
                  Expanded(child: Divider(color: Colors.white.withOpacity(.15))),
                ]),
                const SizedBox(height: 16),

                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.6,
                  children: [
                    _StatCard(label: 'Partidas jugadas', value: '$_gamesPlayed'),
                    _StatCard(label: 'Partidas ganadas', value: '$_gamesWon'),
                    _StatCard(label: 'Puntos acumulados', value: '$_totalPoints'),
                    _StatCard(label: 'Apuestas cumplidas', value: '$_betsFulfilled'),
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

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.06),
        borderRadius: BorderRadius.circular(QSPRadii.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: const TextStyle(fontFamily: 'RussoOne', fontSize: 22, color: QSPColors.gold)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(.6))),
        ],
      ),
    );
  }
}
