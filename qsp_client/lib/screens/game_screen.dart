// ─────────────────────────────────────────────
//  QSP — MESA DE JUEGO
//  Regla Suprema: el jugador siempre aparece
//  abajo y centrado. Máximo 2 toques por acción.
// ─────────────────────────────────────────────

import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/qsp_theme.dart';
import '../services/socket_service.dart';
import '../models/game_models.dart';
import '../widgets/playing_card.dart';
import '../widgets/player_seat.dart';
import 'scoreboard_screen.dart';
import 'game_end_screen.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with TickerProviderStateMixin {
  GameSnapshot? _snapshot;
  TrickResult? _lastTrick;
  String? _toast;

  StreamSubscription? _snapSub;
  StreamSubscription? _trickSub;
  StreamSubscription? _roundSub;
  StreamSubscription? _gameEndSub;
  StreamSubscription? _msgSub;

  @override
  void initState() {
    super.initState();

    _snapSub = SocketService.instance.onSnapshot.listen((snap) {
      if (mounted) setState(() => _snapshot = snap);
    });

    _trickSub = SocketService.instance.onTrickEnd.listen((trick) {
      if (mounted) {
        setState(() => _lastTrick = trick);
        // Limpiar el indicador después de un momento
        Future.delayed(const Duration(milliseconds: 1800), () {
          if (mounted) setState(() => _lastTrick = null);
        });
      }
    });

    _roundSub = SocketService.instance.onRoundEnd.listen((result) {
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ScoreboardScreen(result: result)),
        );
      }
    });

    _gameEndSub = SocketService.instance.onGameEnd.listen((result) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => GameEndScreen(result: result)),
        );
      }
    });

    _msgSub = SocketService.instance.onMessage.listen((msg) {
      if (mounted) {
        setState(() => _toast = '${msg['emoji']} ${msg['senderName']}: ${msg['text']}');
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _toast = null);
        });
      }
    });
  }

  @override
  void dispose() {
    _snapSub?.cancel();
    _trickSub?.cancel();
    _roundSub?.cancel();
    _gameEndSub?.cancel();
    _msgSub?.cancel();
    super.dispose();
  }

  String get _myId => SocketService.instance.myPlayerId ?? '';

  @override
  Widget build(BuildContext context) {
    final snap = _snapshot;

    if (snap == null) {
      return Scaffold(
        body: Container(
          decoration: feltBackground(),
          child: const Center(child: CircularProgressIndicator(color: QSPColors.gold)),
        ),
      );
    }

    final me = snap.findPlayer(_myId);
    final others = snap.players.where((p) => p.id != _myId).toList();
    final isMyBetTurn = snap.currentBettorId == _myId;
    final isMyPlayTurn = snap.currentPlayerId == _myId;

    return Scaffold(
      body: Container(
        decoration: feltBackground(),
        child: SafeArea(
          child: Column(
            children: [
              _TopInfoBar(roundNumber: snap.roundNumber, dealerSeat: snap.dealerSeat),

              // Rivales arriba
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 8,
                  runSpacing: 8,
                  children: others.map((p) {
                    return PlayerSeat(
                      player: p,
                      isDealer: p.seatIndex == snap.dealerSeat,
                      isCurrentTurn: p.id == snap.currentBettorId || p.id == snap.currentPlayerId,
                    );
                  }).toList(),
                ),
              ),

              // Mesa central — cartas jugadas en la mano actual
              Expanded(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    _TableFelt(),
                    _CurrentTrickDisplay(
                      plays: snap.currentTrickPlays ?? [],
                      players: snap.players,
                    ),
                    if (_toast != null)
                      Positioned(
                        top: 8,
                        child: _MessageToast(text: _toast!),
                      ),
                  ],
                ),
              ),

              // Indicador de turno
              if (isMyBetTurn || isMyPlayTurn)
                _TurnBanner(isBetting: isMyBetTurn),

              // Mi zona — siempre abajo y centrada
              if (me != null)
                _MyZone(
                  player: me,
                  isDealer: me.seatIndex == snap.dealerSeat,
                  isMyBetTurn: isMyBetTurn,
                  isMyPlayTurn: isMyPlayTurn,
                  validBets: snap.validBets,
                  onBet: (bet) => SocketService.instance.placeBet(bet),
                  onPlayCard: (idx) => SocketService.instance.playCard(idx),
                ),

              _QuickMessagesBar(),
            ],
          ),
        ),
      ),
    );
  }
}

// ── BARRA SUPERIOR: ronda + indicador de Mano ───────────────────

class _TopInfoBar extends StatelessWidget {
  final int roundNumber;
  final int dealerSeat;

  const _TopInfoBar({required this.roundNumber, required this.dealerSeat});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: QSPColors.gold.withOpacity(.3)),
            ),
            child: Text(
              'RONDA $roundNumber / 10',
              style: const TextStyle(fontFamily: 'RussoOne', fontSize: 12, color: QSPColors.gold),
            ),
          ),
        ],
      ),
    );
  }
}

// ── TAPETE DE FONDO ──────────────────────────────────────────────

class _TableFelt extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: RadialGradient(
          colors: [const Color(0xFF1A6644).withOpacity(.4), Colors.transparent],
        ),
        borderRadius: BorderRadius.circular(200),
        border: Border.all(color: const Color(0xFF8B6914).withOpacity(.3), width: 2),
      ),
    );
  }
}

// ── CARTAS JUGADAS EN LA MANO ACTUAL ─────────────────────────────

class _CurrentTrickDisplay extends StatelessWidget {
  final List<TrickPlay> plays;
  final List<GamePlayer> players;

  const _CurrentTrickDisplay({required this.plays, required this.players});

  @override
  Widget build(BuildContext context) {
    if (plays.isEmpty) {
      return Text('Esperando jugadas...', style: TextStyle(color: Colors.white.withOpacity(.4), fontSize: 13));
    }

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      alignment: WrapAlignment.center,
      children: plays.map((play) {
        final player = players.where((p) => p.id == play.playerId).firstOrNull;
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            PlayingCard(card: play.card, width: 48, height: 66),
            const SizedBox(height: 4),
            Text(
              player?.name ?? '',
              style: const TextStyle(color: Colors.white70, fontSize: 10),
            ),
          ],
        );
      }).toList(),
    );
  }
}

// ── BANNER DE TURNO ──────────────────────────────────────────────

class _TurnBanner extends StatelessWidget {
  final bool isBetting;
  const _TurnBanner({required this.isBetting});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: QSPColors.gold.withOpacity(.15),
        borderRadius: BorderRadius.circular(QSPRadii.sm),
      ),
      alignment: Alignment.center,
      child: Text(
        isBetting ? '¡Es tu turno de apostar!' : '¡Es tu turno de jugar!',
        style: const TextStyle(color: QSPColors.gold, fontWeight: FontWeight.w800, fontSize: 13),
      ),
    );
  }
}

// ── ZONA DEL JUGADOR (regla suprema: abajo, centrado) ────────────

class _MyZone extends StatelessWidget {
  final GamePlayer player;
  final bool isDealer;
  final bool isMyBetTurn;
  final bool isMyPlayTurn;
  final List<int>? validBets;
  final void Function(int bet) onBet;
  final void Function(int cardIndex) onPlayCard;

  const _MyZone({
    required this.player,
    required this.isDealer,
    required this.isMyBetTurn,
    required this.isMyPlayTurn,
    required this.validBets,
    required this.onBet,
    required this.onPlayCard,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(.3),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (isDealer) const Padding(padding: EdgeInsets.only(right: 6), child: Text('👑', style: TextStyle(fontSize: 16))),
              Text(player.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(width: 10),
              Text('🎯 ${player.bet ?? "–"}', style: const TextStyle(color: QSPColors.gold, fontSize: 13)),
              const SizedBox(width: 8),
              Text('✋ ${player.tricksWon}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 10),

          // Apostando: mostrar selector de números
          if (isMyBetTurn && validBets != null)
            _BetSelector(validBets: validBets!, onBet: onBet)
          else
            // Jugando: mostrar mano tappable
            SizedBox(
              height: 90,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                itemCount: player.hand?.length ?? 0,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final card = player.hand![index];
                  return GestureDetector(
                    onTap: isMyPlayTurn ? () => onPlayCard(index) : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      transform: Matrix4.translationValues(0, isMyPlayTurn ? -4 : 0, 0),
                      child: PlayingCard(
                        card: card,
                        width: 58,
                        height: 80,
                        dimmed: !isMyPlayTurn,
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _BetSelector extends StatelessWidget {
  final List<int> validBets;
  final void Function(int) onBet;

  const _BetSelector({required this.validBets, required this.onBet});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('¿Cuántas manos vas a ganar?', style: TextStyle(color: Colors.white.withOpacity(.8), fontSize: 13)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: validBets.map((bet) {
            return GestureDetector(
              onTap: () => onBet(bet),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [QSPColors.btnTop, QSPColors.btnMid],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: QSPColors.btnShadow, offset: const Offset(0, 3))],
                ),
                alignment: Alignment.center,
                child: Text('$bet', style: const TextStyle(fontFamily: 'RussoOne', fontSize: 17, color: Color(0xFF3D1F00))),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ── MENSAJES RÁPIDOS ──────────────────────────────────────────────

class _QuickMessagesBar extends StatelessWidget {
  static const messages = [
    ('QUE_SE_PUDRA', '😈'),
    ('SE_VIENE', '🔥'),
    ('BUENA_ESA', '😂'),
    ('FANTASMA', '👻'),
    ('NO_PUEDE_SER', '😱'),
    ('LA_TENGO_CLARA', '🎯'),
    ('ME_VOY_AL_MAZO', '🃏'),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        children: messages.map((m) {
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: GestureDetector(
              onTap: () => SocketService.instance.sendQuickMessage(m.$1),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(.08),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(m.$2, style: const TextStyle(fontSize: 18)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _MessageToast extends StatelessWidget {
  final String text;
  const _MessageToast({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 13)),
    );
  }
}
