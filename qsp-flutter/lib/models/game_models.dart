// ─────────────────────────────────────────────
//  QSP — MODELOS DE JUEGO
//  Reflejan 1:1 los DTOs definidos en
//  qsp-server/src/events.ts
// ─────────────────────────────────────────────

class Card {
  final String rank;
  final String suit;
  final int value;

  Card({required this.rank, required this.suit, required this.value});

  factory Card.fromJson(Map<String, dynamic> json) => Card(
    rank: json['rank'],
    suit: json['suit'],
    value: json['value'],
  );

  /// Símbolo visual del palo
  String get suitSymbol {
    switch (suit) {
      case 'S': return '♠';
      case 'H': return '♥';
      case 'C': return '♣';
      case 'D': return '♦';
      default: return '?';
    }
  }

  bool get isRed => suit == 'H' || suit == 'D';
}

class GamePlayer {
  final String id;
  final String name;
  final int seatIndex;
  final bool isBot;
  /// Si es el jugador propio: lista de cartas. Si es otro: solo el conteo.
  final List<Card>? hand;
  final int? handCount;
  final int? bet;
  final int tricksWon;
  final int totalScore;

  GamePlayer({
    required this.id,
    required this.name,
    required this.seatIndex,
    required this.isBot,
    this.hand,
    this.handCount,
    this.bet,
    required this.tricksWon,
    required this.totalScore,
  });

  factory GamePlayer.fromJson(Map<String, dynamic> json) {
    final handField = json['hand'];
    return GamePlayer(
      id: json['id'],
      name: json['name'],
      seatIndex: json['seatIndex'],
      isBot: json['isBot'],
      hand: handField is List
          ? handField.map((c) => Card.fromJson(c)).toList()
          : null,
      handCount: handField is int ? handField : null,
      bet: json['bet'],
      tricksWon: json['tricksWon'],
      totalScore: json['totalScore'],
    );
  }

  int get cardCount => hand?.length ?? handCount ?? 0;
}

class TrickPlay {
  final String playerId;
  final Card card;

  TrickPlay({required this.playerId, required this.card});

  factory TrickPlay.fromJson(Map<String, dynamic> json) => TrickPlay(
    playerId: json['playerId'],
    card: Card.fromJson(json['card']),
  );
}

class GameSnapshot {
  final String state;
  final int roundNumber;
  final int dealerSeat;
  final List<GamePlayer> players;
  final List<TrickPlay>? currentTrickPlays;
  final int completedTricksCount;
  final List<String> bettingOrder;
  final List<String> playOrder;
  final String? currentBettorId;
  final String? currentPlayerId;
  final List<int>? validBets;

  GameSnapshot({
    required this.state,
    required this.roundNumber,
    required this.dealerSeat,
    required this.players,
    this.currentTrickPlays,
    required this.completedTricksCount,
    required this.bettingOrder,
    required this.playOrder,
    this.currentBettorId,
    this.currentPlayerId,
    this.validBets,
  });

  factory GameSnapshot.fromJson(Map<String, dynamic> json) => GameSnapshot(
    state: json['state'],
    roundNumber: json['roundNumber'],
    dealerSeat: json['dealerSeat'],
    players: (json['players'] as List).map((p) => GamePlayer.fromJson(p)).toList(),
    currentTrickPlays: json['currentTrick'] != null
        ? (json['currentTrick']['plays'] as List).map((p) => TrickPlay.fromJson(p)).toList()
        : null,
    completedTricksCount: json['completedTricksCount'],
    bettingOrder: List<String>.from(json['bettingOrder']),
    playOrder: List<String>.from(json['playOrder']),
    currentBettorId: json['currentBettorId'],
    currentPlayerId: json['currentPlayerId'],
    validBets: json['validBets'] != null ? List<int>.from(json['validBets']) : null,
  );

  GamePlayer? findPlayer(String id) =>
      players.where((p) => p.id == id).firstOrNull;
}

class TrickResult {
  final String winnerId;
  final String winnerName;
  final List<TrickPlay> plays;
  final Map<String, int> updatedTricksWon;

  TrickResult({
    required this.winnerId,
    required this.winnerName,
    required this.plays,
    required this.updatedTricksWon,
  });

  factory TrickResult.fromJson(Map<String, dynamic> json) => TrickResult(
    winnerId: json['winnerId'],
    winnerName: json['winnerName'],
    plays: (json['plays'] as List).map((p) => TrickPlay.fromJson(p)).toList(),
    updatedTricksWon: Map<String, int>.from(json['updatedTricksWon']),
  );
}

class PlayerRoundResult {
  final String playerId;
  final String name;
  final int bet;
  final int tricksWon;
  final int roundScore;
  final int totalScore;
  final bool betFulfilled;

  PlayerRoundResult({
    required this.playerId,
    required this.name,
    required this.bet,
    required this.tricksWon,
    required this.roundScore,
    required this.totalScore,
    required this.betFulfilled,
  });

  factory PlayerRoundResult.fromJson(Map<String, dynamic> json) => PlayerRoundResult(
    playerId: json['playerId'],
    name: json['name'],
    bet: json['bet'],
    tricksWon: json['tricksWon'],
    roundScore: json['roundScore'],
    totalScore: json['totalScore'],
    betFulfilled: json['betFulfilled'],
  );
}

class RoundResult {
  final int roundNumber;
  final List<PlayerRoundResult> results;
  final int? nextDealerSeat;

  RoundResult({required this.roundNumber, required this.results, this.nextDealerSeat});

  factory RoundResult.fromJson(Map<String, dynamic> json) => RoundResult(
    roundNumber: json['roundNumber'],
    results: (json['results'] as List).map((r) => PlayerRoundResult.fromJson(r)).toList(),
    nextDealerSeat: json['nextDealerSeat'],
  );
}

class GameEndResult {
  final String winnerId;
  final String winnerName;
  final int totalScore;
  final List<PlayerRoundResult> finalScores;

  GameEndResult({
    required this.winnerId,
    required this.winnerName,
    required this.totalScore,
    required this.finalScores,
  });

  factory GameEndResult.fromJson(Map<String, dynamic> json) => GameEndResult(
    winnerId: json['winnerId'],
    winnerName: json['winnerName'],
    totalScore: json['totalScore'],
    finalScores: (json['finalScores'] as List).map((r) => PlayerRoundResult.fromJson(r)).toList(),
  );
}

// ── SALA ──────────────────────────────────────────────────────────

class RoomPlayer {
  final String id;
  final String name;
  final String avatarId;
  final String colorId;
  final int seatIndex;
  final bool isBot;
  final bool isConnected;
  final bool isHost;

  RoomPlayer({
    required this.id,
    required this.name,
    required this.avatarId,
    required this.colorId,
    required this.seatIndex,
    required this.isBot,
    required this.isConnected,
    required this.isHost,
  });

  factory RoomPlayer.fromJson(Map<String, dynamic> json) => RoomPlayer(
    id: json['id'],
    name: json['name'],
    avatarId: json['avatarId'],
    colorId: json['colorId'],
    seatIndex: json['seatIndex'],
    isBot: json['isBot'],
    isConnected: json['isConnected'],
    isHost: json['isHost'],
  );
}

class RoomState {
  final String code;
  final int size;
  final List<RoomPlayer> players;
  final String hostId;
  final String status;
  final int? secondsUntilAutoStart;

  RoomState({
    required this.code,
    required this.size,
    required this.players,
    required this.hostId,
    required this.status,
    this.secondsUntilAutoStart,
  });

  factory RoomState.fromJson(Map<String, dynamic> json) => RoomState(
    code: json['code'],
    size: json['size'],
    players: (json['players'] as List).map((p) => RoomPlayer.fromJson(p)).toList(),
    hostId: json['hostId'],
    status: json['status'],
    secondsUntilAutoStart: json['secondsUntilAutoStart'],
  );
}

extension FirstOrNullExt<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
