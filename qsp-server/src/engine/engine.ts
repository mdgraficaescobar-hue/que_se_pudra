// ─────────────────────────────────────────────
//  QSP ENGINE — ORQUESTADOR PRINCIPAL
// ─────────────────────────────────────────────

import { buildGameDeck, dealCards } from './deck';
import { validateBet, isLastBettor, validBetsForLastBettor } from './betting';
import { resolveTrick, applyTrickResult } from './trick';
import { scoreRound, determineWinner } from './scoring';
import {
  GameConfig,
  GameSnapshot,
  GameState,
  Player,
  PlayerRoundData,
  Trick,
  TrickPlay,
  RoundResult,
} from './types';

export const TOTAL_ROUNDS = 10;

export class QSPEngine {
  private players: Player[];
  private config: GameConfig;
  private state: GameState = 'WAITING';

  private roundNumber = 0;
  private dealerSeat = 0;           // Mano actual

  private playerData: PlayerRoundData[] = [];
  private currentTrick: Trick | null = null;
  private completedTricks: Trick[] = [];
  private roundResults: RoundResult[] = [];

  private bettingOrder: string[] = [];
  private playOrder: string[] = [];
  private currentBettorIndex = 0;
  private currentPlayerIndex = 0;

  private rng: () => number;

  constructor(players: Player[], config: GameConfig, rng: () => number = Math.random) {
    if (players.length < 4 || players.length > 6) {
      throw new Error('QSP requiere entre 4 y 6 jugadores.');
    }
    if (players.length !== config.playerCount) {
      throw new Error('El número de jugadores no coincide con la configuración.');
    }
    this.players = players;
    this.config = config;
    this.dealerSeat = config.initialDealerSeat;
    this.rng = rng;
  }

  // ── ESTADO PÚBLICO ──────────────────────────────────────────────

  getSnapshot(): GameSnapshot {
    return {
      state: this.state,
      roundNumber: this.roundNumber,
      dealerSeat: this.dealerSeat,
      currentTrick: this.currentTrick,
      completedTricks: [...this.completedTricks],
      playerData: this.playerData.map(p => ({ ...p, hand: [...p.hand] })),
      players: [...this.players],
      config: { ...this.config },
      bettingOrder: [...this.bettingOrder],
      playOrder: [...this.playOrder],
      currentBettorIndex: this.currentBettorIndex,
      currentPlayerIndex: this.currentPlayerIndex,
    };
  }

  getState(): GameState { return this.state; }
  getRoundNumber(): number { return this.roundNumber; }
  getRoundResults(): RoundResult[] { return this.roundResults; }

  // ── FLUJO DEL JUEGO ─────────────────────────────────────────────

  /** Arranca el juego. Llama a startRound() internamente. */
  startGame(): GameSnapshot {
    if (this.state !== 'WAITING') throw new Error('El juego ya fue iniciado.');
    this.state = 'STARTING';
    return this.startRound();
  }

  /** Inicia una ronda nueva (o la primera). */
  startRound(): GameSnapshot {
    this.roundNumber += 1;
    const cardsThisRound = this.roundNumber; // Ronda 1 → 1 carta, ..., Ronda 10 → 10

    this.completedTricks = [];
    this.currentTrick = null;

    // Construir mazo y repartir
    const deck = buildGameDeck(this.config.playerCount, this.rng);
    const playerIds = this.orderedPlayerIds();
    const hands = dealCards(deck, playerIds, cardsThisRound);

    // Inicializar datos de jugadores para esta ronda
    this.playerData = this.players.map(player => ({
      playerId: player.id,
      hand: hands.get(player.id) ?? [],
      bet: null,
      tricksWon: 0,
      score: 0,
      totalScore: this.roundNumber === 1
        ? 0
        : (this.playerData.find(p => p.playerId === player.id)?.totalScore ?? 0),
    }));

    // Orden de apuesta y juego: Mano primero, luego en sentido horario
    this.bettingOrder = this.buildOrderFromDealer();
    this.playOrder = [...this.bettingOrder];
    this.currentBettorIndex = 0;
    this.currentPlayerIndex = 0;

    this.state = 'BETTING';
    return this.getSnapshot();
  }

  /** Registra la apuesta de un jugador. */
  placeBet(playerId: string, bet: number): { success: boolean; reason?: string; snapshot: GameSnapshot } {
    if (this.state !== 'BETTING') {
      return { success: false, reason: 'No es momento de apostar.', snapshot: this.getSnapshot() };
    }

    const expectedBettor = this.bettingOrder[this.currentBettorIndex];
    if (playerId !== expectedBettor) {
      return { success: false, reason: 'No es tu turno de apostar.', snapshot: this.getSnapshot() };
    }

    const cardsInRound = this.roundNumber;
    const lastBettor = isLastBettor(playerId, this.bettingOrder, this.playerData);

    const validation = validateBet(bet, playerId, this.playerData, cardsInRound, lastBettor);
    if (!validation.valid) {
      return { success: false, reason: validation.reason, snapshot: this.getSnapshot() };
    }

    // Registrar la apuesta
    const playerDataEntry = this.playerData.find(p => p.playerId === playerId)!;
    playerDataEntry.bet = bet;
    this.currentBettorIndex += 1;

    // ¿Todos apostaron?
    if (this.currentBettorIndex >= this.bettingOrder.length) {
      this.state = 'PLAYING';
      this.startNewTrick();
    }

    return { success: true, snapshot: this.getSnapshot() };
  }

  /** El jugador actual juega una carta. */
  playCard(
    playerId: string,
    cardIndex: number,
  ): { success: boolean; reason?: string; trickResult?: { winnerId: string }; snapshot: GameSnapshot } {
    if (this.state !== 'PLAYING') {
      return { success: false, reason: 'No es momento de jugar.', snapshot: this.getSnapshot() };
    }

    const expectedPlayer = this.playOrder[this.currentPlayerIndex];
    if (playerId !== expectedPlayer) {
      return { success: false, reason: 'No es tu turno.', snapshot: this.getSnapshot() };
    }

    const playerDataEntry = this.playerData.find(p => p.playerId === playerId)!;
    if (cardIndex < 0 || cardIndex >= playerDataEntry.hand.length) {
      return { success: false, reason: 'Índice de carta inválido.', snapshot: this.getSnapshot() };
    }

    const player = this.players.find(p => p.id === playerId)!;
    const [card] = playerDataEntry.hand.splice(cardIndex, 1);

    const play: TrickPlay = {
      playerId,
      card,
      seatIndex: player.seatIndex,
    };

    this.currentTrick!.plays.push(play);
    this.currentPlayerIndex += 1;

    // ¿Todos jugaron en esta mano?
    if (this.currentPlayerIndex >= this.playOrder.length) {
      const resolution = resolveTrick(
        this.currentTrick!,
        this.dealerSeat,
        this.config.playerCount,
      );

      this.currentTrick!.winnerId = resolution.winnerId;
      this.completedTricks.push(this.currentTrick!);
      applyTrickResult(resolution.winnerId, this.playerData);

      const allCardsPlayed = this.playerData.every(p => p.hand.length === 0);

      if (allCardsPlayed) {
        this.state = 'ROUND_END';
        return {
          success: true,
          trickResult: { winnerId: resolution.winnerId },
          snapshot: this.getSnapshot(),
        };
      }

      // Nueva mano: el ganador lidera
      this.startNewTrick(resolution.winnerId);

      return {
        success: true,
        trickResult: { winnerId: resolution.winnerId },
        snapshot: this.getSnapshot(),
      };
    }

    return { success: true, snapshot: this.getSnapshot() };
  }

  /** Finaliza la ronda y calcula puntos. Llamar cuando state === 'ROUND_END'. */
  endRound(): { results: RoundResult; snapshot: GameSnapshot } {
    if (this.state !== 'ROUND_END') throw new Error('La ronda aún no terminó.');

    const playerResults = scoreRound(this.playerData, this.roundNumber);

    const result: RoundResult = {
      roundNumber: this.roundNumber,
      playerResults,
      tricks: [...this.completedTricks],
    };

    this.roundResults.push(result);

    // Sincronizar totalScore de vuelta a playerData para la próxima ronda
    for (const res of playerResults) {
      const p = this.playerData.find(pd => pd.playerId === res.playerId)!;
      p.totalScore = res.totalScore;
    }

    if (this.roundNumber === TOTAL_ROUNDS) {
      this.state = 'GAME_END';
    } else {
      // Rotar la Mano
      this.dealerSeat = (this.dealerSeat + 1) % this.config.playerCount;
      this.state = 'NEXT_ROUND';
    }

    return { results: result, snapshot: this.getSnapshot() };
  }

  /** Avanza a la siguiente ronda. Llamar cuando state === 'NEXT_ROUND'. */
  nextRound(): GameSnapshot {
    if (this.state !== 'NEXT_ROUND') throw new Error('No es momento de avanzar de ronda.');
    return this.startRound();
  }

  /** Devuelve el ganador final. Solo disponible en GAME_END. */
  getWinner() {
    if (this.state !== 'GAME_END') throw new Error('El juego aún no terminó.');
    return determineWinner(this.playerData, this.players.map(p => ({ id: p.id, name: p.name })));
  }

  /** Devuelve las apuestas válidas para el apostador actual (útil para bots y UI). */
  getValidBetsForCurrentBettor(): number[] {
    if (this.state !== 'BETTING') return [];
    const bettorId = this.bettingOrder[this.currentBettorIndex];
    const isLast = isLastBettor(bettorId, this.bettingOrder, this.playerData);
    if (!isLast) {
      return Array.from({ length: this.roundNumber + 1 }, (_, i) => i);
    }
    return validBetsForLastBettor(this.playerData, bettorId, this.roundNumber);
  }

  // ── HELPERS PRIVADOS ────────────────────────────────────────────

  private orderedPlayerIds(): string[] {
    return [...this.players]
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map(p => p.id);
  }

  private buildOrderFromDealer(): string[] {
    const sorted = this.orderedPlayerIds();
    const dealerPos = sorted.findIndex(
      id => this.players.find(p => p.id === id)!.seatIndex === this.dealerSeat,
    );
    return [...sorted.slice(dealerPos), ...sorted.slice(0, dealerPos)];
  }

  private startNewTrick(leaderId?: string): void {
    this.currentTrick = { plays: [], winnerId: null };

    if (leaderId) {
      // El ganador de la mano anterior lidera
      const leaderIdx = this.playOrder.indexOf(leaderId);
      this.playOrder = [
        ...this.playOrder.slice(leaderIdx),
        ...this.playOrder.slice(0, leaderIdx),
      ];
    }

    this.currentPlayerIndex = 0;
  }
}
