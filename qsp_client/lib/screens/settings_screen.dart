// ─────────────────────────────────────────────
//  QSP — AJUSTES
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../theme/qsp_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _sound = true;
  bool _vibration = true;
  bool _notifications = true;

  @override
  Widget build(BuildContext context) {
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
                    Text('AJUSTES', style: QSPTextStyles.heading),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
                const SizedBox(height: 24),

                _SettingTile(
                  icon: Icons.volume_up_outlined,
                  label: 'Sonido',
                  value: _sound,
                  onChanged: (v) => setState(() => _sound = v),
                ),
                _SettingTile(
                  icon: Icons.vibration,
                  label: 'Vibración',
                  value: _vibration,
                  onChanged: (v) => setState(() => _vibration = v),
                ),
                _SettingTile(
                  icon: Icons.notifications_outlined,
                  label: 'Notificaciones',
                  value: _notifications,
                  onChanged: (v) => setState(() => _notifications = v),
                ),

                const SizedBox(height: 32),
                Row(children: [
                  Expanded(child: Divider(color: Colors.white.withOpacity(.15))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('SOBRE EL JUEGO', style: QSPTextStyles.caption),
                  ),
                  Expanded(child: Divider(color: Colors.white.withOpacity(.15))),
                ]),
                const SizedBox(height: 16),

                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.book_outlined, color: Colors.white70),
                  title: const Text('Reglamento', style: TextStyle(color: Colors.white)),
                  trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                  onTap: () {},
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.info_outline, color: Colors.white70),
                  title: const Text('Versión', style: TextStyle(color: Colors.white)),
                  trailing: const Text('1.0.0', style: TextStyle(color: Colors.white38)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 22),
          const SizedBox(width: 14),
          Expanded(child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600))),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: QSPColors.gold,
          ),
        ],
      ),
    );
  }
}
