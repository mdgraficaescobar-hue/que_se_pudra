// ─────────────────────────────────────────────
//  QSP — LOBBY
//  Crear sala, unirse con código, o partida rápida.
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../theme/qsp_theme.dart';
import '../services/socket_service.dart';
import 'room_screen.dart';

// TODO: reemplazar por tu URL real al desplegar el servidor (Sprint 3)
const String kServerUrl = 'http://localhost:3001';

class LobbyScreen extends StatefulWidget {
  const LobbyScreen({super.key});

  @override
  State<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends State<LobbyScreen> {
  final _nameController = TextEditingController(text: 'Jugador');
  final _codeController = TextEditingController();
  int _selectedSize = 4;
  bool _connecting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _ensureConnected() async {
    if (!SocketService.instance.isConnected) {
      await SocketService.instance.connect(kServerUrl);
    }
  }

  Future<void> _createRoom() async {
    setState(() { _connecting = true; _error = null; });
    try {
      await _ensureConnected();
      final data = await SocketService.instance.createRoom(
        playerName: _nameController.text.trim().isEmpty ? 'Jugador' : _nameController.text.trim(),
        avatarId: 'default',
        colorId: 'gold',
        size: _selectedSize,
      );
      _goToRoom(data['roomCode']);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _connecting = false);
    }
  }

  Future<void> _joinRoom() async {
    final code = _codeController.text.trim().toUpperCase();
    if (code.isEmpty) {
      setState(() => _error = 'Ingresá un código de sala.');
      return;
    }
    setState(() { _connecting = true; _error = null; });
    try {
      await _ensureConnected();
      final data = await SocketService.instance.joinRoom(
        code: code.startsWith('QSP-') ? code : 'QSP-$code',
        playerName: _nameController.text.trim().isEmpty ? 'Jugador' : _nameController.text.trim(),
        avatarId: 'default',
        colorId: 'teal',
      );
      _goToRoom(data['roomCode']);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _connecting = false);
    }
  }

  Future<void> _quickMatch() async {
    setState(() { _connecting = true; _error = null; });
    try {
      await _ensureConnected();
      final data = await SocketService.instance.quickMatch(
        playerName: _nameController.text.trim().isEmpty ? 'Jugador' : _nameController.text.trim(),
        avatarId: 'default',
        colorId: 'mag',
        preferredSize: _selectedSize,
      );
      _goToRoom(data['roomCode']);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _connecting = false);
    }
  }

  void _goToRoom(String code) {
    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => RoomScreen(roomCode: code)),
    );
  }

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
                    Text('SALA DE JUEGO', style: QSPTextStyles.heading),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
                const SizedBox(height: 24),

                // Nombre
                _Label('TU NOMBRE'),
                const SizedBox(height: 8),
                _QSPTextField(controller: _nameController, hint: 'Ingresá tu nombre'),

                const SizedBox(height: 28),

                // Tamaño de sala
                _Label('JUGADORES'),
                const SizedBox(height: 10),
                Row(
                  children: [4, 5, 6].map((size) {
                    final selected = _selectedSize == size;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedSize = size),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: selected ? QSPColors.gold.withOpacity(.15) : Colors.white.withOpacity(.05),
                              border: Border.all(
                                color: selected ? QSPColors.gold : Colors.white.withOpacity(.15),
                                width: selected ? 2 : 1,
                              ),
                              borderRadius: BorderRadius.circular(QSPRadii.md),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '$size',
                              style: TextStyle(
                                fontFamily: 'RussoOne',
                                fontSize: 20,
                                color: selected ? QSPColors.gold : Colors.white70,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 32),

                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: QSPColors.danger.withOpacity(.15),
                      borderRadius: BorderRadius.circular(QSPRadii.sm),
                      border: Border.all(color: QSPColors.danger.withOpacity(.4)),
                    ),
                    child: Text(_error!, style: const TextStyle(color: QSPColors.danger, fontSize: 13)),
                  ),
                  const SizedBox(height: 16),
                ],

                // Acciones
                Center(
                  child: _connecting
                      ? const CircularProgressIndicator(color: QSPColors.gold)
                      : Column(
                          children: [
                            QSPPrimaryButton(label: 'CREAR SALA', onPressed: _createRoom, width: 280),
                            const SizedBox(height: 14),
                            SizedBox(
                              width: 280,
                              child: OutlinedButton(
                                onPressed: _quickMatch,
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: QSPColors.neonTeal, width: 2),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(QSPRadii.pill)),
                                ),
                                child: const Text(
                                  'PARTIDA RÁPIDA',
                                  style: TextStyle(fontFamily: 'RussoOne', fontSize: 15, color: QSPColors.neonTeal, letterSpacing: 1),
                                ),
                              ),
                            ),
                          ],
                        ),
                ),

                const SizedBox(height: 32),
                Row(children: [
                  Expanded(child: Divider(color: Colors.white.withOpacity(.15))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('O UNITE CON CÓDIGO', style: QSPTextStyles.caption),
                  ),
                  Expanded(child: Divider(color: Colors.white.withOpacity(.15))),
                ]),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: _QSPTextField(
                        controller: _codeController,
                        hint: 'QSP-XXXX',
                        uppercase: true,
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _connecting ? null : _joinRoom,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: QSPColors.gold,
                          foregroundColor: const Color(0xFF3D1F00),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(QSPRadii.md)),
                          padding: const EdgeInsets.symmetric(horizontal: 18),
                        ),
                        child: const Text('UNIRSE', style: TextStyle(fontFamily: 'RussoOne', fontSize: 13)),
                      ),
                    ),
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

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text, style: QSPTextStyles.caption);
}

class _QSPTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool uppercase;

  const _QSPTextField({required this.controller, required this.hint, this.uppercase = false});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      textCapitalization: uppercase ? TextCapitalization.characters : TextCapitalization.words,
      style: const TextStyle(color: Colors.white, fontFamily: 'Nunito', fontWeight: FontWeight.w700),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.white.withOpacity(.35)),
        filled: true,
        fillColor: Colors.white.withOpacity(.06),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(QSPRadii.md),
          borderSide: BorderSide(color: Colors.white.withOpacity(.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(QSPRadii.md),
          borderSide: const BorderSide(color: QSPColors.gold, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(QSPRadii.md),
          borderSide: BorderSide(color: Colors.white.withOpacity(.15)),
        ),
      ),
    );
  }
}
