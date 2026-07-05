// ─────────────────────────────────────────────
//  QSP ENGINE — TEST SUITE
//  Cada test referencia la regla de la Biblia que valida.
// ─────────────────────────────────────────────

import { QSPEngine } from '../src/engine';
import { calculateRoundScore } from '../src/scoring';
import { validateBet, validBetsForLastBettor } from '../src/betting';
import { resolveTrick, circularDistance } from '../src/trick';
import { buildGameDeck, dealCards } from '../src/deck';
import { Player, GameConfig, Trick } from '../src/types';

// ── HELPERS ────────────────────────────────────────────────────────

/** RNG determinista: siempre devuelve 0 (sin mezcla real, útil para tests de deal) */
const noShuffleRng = () => 0;

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Jugador ${i + 1}`,
    isBot: false,
    isConnected: true,
    seatIndex: i,
  }));
}

function makeConfig(count: 4 | 5 | 6): GameConfig {
  return { playerCount: count, initialDealerSeat: 0 };
}

function makeEngine(playerCount: 4 | 5 | 6 = 4) {
  const players = makePlayers(playerCount);
  const config = makeConfig(playerCount);
  return new QSPEngine(players, config, noShuffleRng);
}

// ── MAZO ───────────────────────────────────────────────────────────

describe('Mazo', () => {
  test('1 mazo para 4 jugadores (52 cartas)', () => {
    const deck = buildGameDeck(4);
    expect(deck).toHaveLength(52);
  });

  test('1 mazo para 5 jugadores (52 cartas)', () => {
    const deck = buildGameDeck(5);
    expect(deck).toHaveLength(52);
  });

  test('2 mazos para 6 jugadores (104 cartas)', () => {
    const deck = buildGameDeck(6);
    expect(deck).toHaveLength(104);
  });

  test('Repartir ronda 1 → 1 carta por jugador', () => {
    const deck = buildGameDeck(4);
    const hands = dealCards(deck, ['p1','p2','p3','p4'], 1);
    expect(hands.get('p1')).toHaveLength(1);
    expect(hands.get('p4')).toHaveLength(1);
  });

  test('Repartir ronda 10 → 10 cartas por jugador (4 jugadores = 40 cartas)', () => {
    const deck = buildGameDeck(4);
    const hands = dealCards(deck, ['p1','p2','p3','p4'], 10);
    expect(hands.get('p1')).toHaveLength(10);
    expect(deck).toHaveLength(12); // 52 - 40 = 12 sobrantes
  });

  test('Lanza error si el mazo no tiene suficientes cartas', () => {
    const deck = buildGameDeck(4);
    expect(() => dealCards(deck, ['p1','p2','p3','p4'], 14)).toThrow();
  });
});

// ── VALORES DE CARTAS ──────────────────────────────────────────────

describe('Valores de cartas', () => {
  test('A > K > Q > J > 10 ... > 2', () => {
    const deck = buildGameDeck(4);
    const byValue = new Map(deck.map(c => [c.rank, c.value]));
    expect(byValue.get('A')).toBe(14);
    expect(byValue.get('K')).toBe(13);
    expect(byValue.get('Q')).toBe(12);
    expect(byValue.get('J')).toBe(11);
    expect(byValue.get('10')).toBe(10);
    expect(byValue.get('2')).toBe(2);
    expect(byValue.get('A')!).toBeGreaterThan(byValue.get('K')!);
  });
});

// ── APUESTAS ───────────────────────────────────────────────────────

describe('Apuestas — Regla de Suma Prohibida', () => {
  const makePlayerData = (bets: (number | null)[]) =>
    bets.map((bet, i) => ({
      playerId: `p${i + 1}`,
      hand: [],
      bet,
      tricksWon: 0,
      score: 0,
      totalScore: 0,
    }));

  test('Apuesta válida para apostador intermedio', () => {
    const pd = makePlayerData([2, null, null, null]);
    const result = validateBet(3, 'p2', pd, 5, false);
    expect(result.valid).toBe(true);
  });

  test('Suma prohibida bloqueada para el último apostador', () => {
    // cardsInRound=5, suma previa=3 → prohibida=2
    const pd = makePlayerData([1, 2, null, null]);
    // p3 apostó 1+2=3, p4 es el último → no puede apostar 2
    const result = validateBet(2, 'p4', pd, 5, true);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('prohibida');
  });

  test('Suma prohibida permitida para apostador NO último', () => {
    // El apostador de en medio puede hacer que la suma parcial sea igual
    const pd = makePlayerData([1, null, null, null]);
    const result = validateBet(4, 'p2', pd, 5, false); // suma parcial = 5, pero no es el último
    expect(result.valid).toBe(true);
  });

  test('Apuesta negativa inválida', () => {
    const pd = makePlayerData([null, null, null, null]);
    const result = validateBet(-1, 'p1', pd, 5, false);
    expect(result.valid).toBe(false);
  });

  test('Apuesta mayor a cartas de la ronda inválida', () => {
    const pd = makePlayerData([null, null, null, null]);
    const result = validateBet(6, 'p1', pd, 5, false);
    expect(result.valid).toBe(false);
  });

  test('Apuesta 0 válida si no genera suma prohibida', () => {
    const pd = makePlayerData([1, 2, 3, null]);
    // suma previa = 6, cardsInRound = 5 → prohibida sería -1 (imposible) → 0 es válida
    const result = validateBet(0, 'p4', pd, 5, true);
    expect(result.valid).toBe(true);
  });

  test('validBetsForLastBettor excluye solo el valor prohibido', () => {
    const pd = makePlayerData([1, 2, null, null]);
    // p3 y p4 apostaron 1+2=3, cardsInRound=5, prohibida para último=2
    const valid = validBetsForLastBettor(pd, 'p4', 5);
    expect(valid).not.toContain(2);
    expect(valid).toContain(0);
    expect(valid).toContain(1);
    expect(valid).toContain(3);
  });
});

// ── RESOLUCIÓN DE MANOS ────────────────────────────────────────────

describe('Resolución de manos', () => {
  const makeCard = (rank: string, value: number) => ({
    rank: rank as any,
    suit: 'S' as any,
    value,
  });

  const makeTrick = (plays: Array<{ pid: string; val: number; seat: number }>): Trick => ({
    plays: plays.map(p => ({
      playerId: p.pid,
      card: makeCard('X', p.val),
      seatIndex: p.seat,
    })),
    winnerId: null,
  });

  test('Gana la carta de mayor valor', () => {
    const trick = makeTrick([
      { pid: 'p1', val: 14, seat: 0 }, // A → gana
      { pid: 'p2', val: 13, seat: 1 }, // K
      { pid: 'p3', val: 12, seat: 2 }, // Q
      { pid: 'p4', val: 11, seat: 3 }, // J
    ]);
    const res = resolveTrick(trick, 0, 4);
    expect(res.winnerId).toBe('p1');
  });

  test('En empate, gana el más cercano a la Mano', () => {
    // Mano en seat 0. p1(seat0), p2(seat1), p3(seat2) empatan
    const trick = makeTrick([
      { pid: 'p1', val: 14, seat: 0 }, // distancia 0 desde dealer → gana
      { pid: 'p2', val: 14, seat: 1 },
      { pid: 'p3', val: 14, seat: 2 },
      { pid: 'p4', val: 7,  seat: 3 },
    ]);
    const res = resolveTrick(trick, 0, 4);
    expect(res.winnerId).toBe('p1');
  });

  test('En empate con Mano en seat 2, gana el más cercano (seat 2)', () => {
    const trick = makeTrick([
      { pid: 'p1', val: 14, seat: 0 }, // dist desde seat2: (0-2+4)%4 = 2
      { pid: 'p2', val: 14, seat: 1 }, // dist: (1-2+4)%4 = 3
      { pid: 'p3', val: 14, seat: 2 }, // dist: 0 → gana
    ]);
    const res = resolveTrick(trick, 2, 4);
    expect(res.winnerId).toBe('p3');
  });

  test('circularDistance funciona correctamente', () => {
    expect(circularDistance(3, 1, 4)).toBe(2); // 3→0→1
    expect(circularDistance(0, 0, 4)).toBe(0);
    expect(circularDistance(0, 3, 4)).toBe(3);
  });
});

// ── PUNTUACIÓN ─────────────────────────────────────────────────────

describe('Puntuación', () => {
  test('Apuesta 0 cumplida → 10 puntos', () => {
    expect(calculateRoundScore(0, 0)).toBe(10);
  });

  test('Apuesta 1 cumplida → 15 puntos (10 + 5×1)', () => {
    expect(calculateRoundScore(1, 1)).toBe(15);
  });

  test('Apuesta 3 cumplida → 25 puntos (10 + 5×3)', () => {
    expect(calculateRoundScore(3, 3)).toBe(25);
  });

  test('Apuesta 5 cumplida → 35 puntos (10 + 5×5)', () => {
    expect(calculateRoundScore(5, 5)).toBe(35);
  });

  test('Apuesta fallida, ganó 3 manos → 3 puntos', () => {
    expect(calculateRoundScore(5, 3)).toBe(3);
  });

  test('Apuesta fallida, ganó 0 manos → 0 puntos', () => {
    expect(calculateRoundScore(2, 0)).toBe(0);
  });

  test('Apuesta 0 fallida (ganó 2 manos) → 2 puntos', () => {
    expect(calculateRoundScore(0, 2)).toBe(2);
  });
});

// ── FLUJO COMPLETO DE PARTIDA ──────────────────────────────────────

describe('Flujo completo de partida', () => {
  test('Ronda 1: deal → bet → play → score', () => {
    const engine = makeEngine(4);
    let snap = engine.startGame();

    expect(snap.state).toBe('BETTING');
    expect(snap.roundNumber).toBe(1);

    // Ronda 1 → 1 carta por jugador
    snap.playerData.forEach(pd => {
      expect(pd.hand).toHaveLength(1);
    });

    // Apostamos en orden. La Mano (p1) apuesta primero.
    // Con 4 jugadores y 1 carta, suma prohibida = 1.
    // p1 apuesta 0, p2 apuesta 0, p3 apuesta 0 → suma = 0
    // p4 (último) no puede apostar 1 (prohibida), puede apostar 0.
    let r = engine.placeBet('p1', 0);
    expect(r.success).toBe(true);
    r = engine.placeBet('p2', 0);
    expect(r.success).toBe(true);
    r = engine.placeBet('p3', 0);
    expect(r.success).toBe(true);
    r = engine.placeBet('p4', 0);
    expect(r.success).toBe(true);
    expect(r.snapshot.state).toBe('PLAYING');

    // Cada jugador juega su única carta
    const playOrder = r.snapshot.playOrder;
    for (const pid of playOrder) {
      const result = engine.playCard(pid, 0);
      expect(result.success).toBe(true);
    }

    snap = engine.getSnapshot();
    expect(snap.state).toBe('ROUND_END');

    const { results } = engine.endRound();
    expect(results.roundNumber).toBe(1);
    // Todos apostaron 0. Solo uno gana la mano → ese tiene apuesta fallida
    // Los 3 que no ganaron → apuesta 0 cumplida → 10 pts c/u
    const fulfilled = results.playerResults.filter(r => r.betFulfilled);
    expect(fulfilled.length).toBe(3); // 3 de los 4 cumplen apuesta 0
  });

  test('Motor rechaza jugar en turno equivocado', () => {
    const engine = makeEngine(4);
    engine.startGame();

    // Apostamos todos
    engine.placeBet('p1', 0);
    engine.placeBet('p2', 0);
    engine.placeBet('p3', 0);
    engine.placeBet('p4', 0);

    // El turno es de p1 pero intenta jugar p2
    const result = engine.playCard('p2', 0);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('turno');
  });

  test('Suma prohibida: último apostador rechazado', () => {
    const engine = makeEngine(4);
    engine.startGame(); // Ronda 1, 1 carta, suma prohibida = 1

    engine.placeBet('p1', 0);
    engine.placeBet('p2', 0);
    engine.placeBet('p3', 0);

    // p4 intenta apostar 1 (prohibida: 0+0+0+1 = 1 = cardsInRound)
    const r = engine.placeBet('p4', 1);
    expect(r.success).toBe(false);
    expect(r.snapshot.state).toBe('BETTING');
  });

  test('La Mano rota una posición por ronda', () => {
    const engine = makeEngine(4);
    engine.startGame(); // dealerSeat = 0

    // Completar ronda 1 rápido
    engine.placeBet('p1', 0);
    engine.placeBet('p2', 0);
    engine.placeBet('p3', 0);
    engine.placeBet('p4', 0);

    const snap = engine.getSnapshot();
    const playOrder = snap.playOrder;
    for (const pid of playOrder) engine.playCard(pid, 0);

    engine.endRound();
    const snap2 = engine.nextRound();

    expect(snap2.dealerSeat).toBe(1); // rotó de 0 a 1
  });

  test('Partida de 10 rondas llega a GAME_END', () => {
    const engine = makeEngine(4);
    engine.startGame();

    for (let round = 1; round <= 10; round++) {
      const snap = engine.getSnapshot();
      expect(snap.roundNumber).toBe(round);

      // Todos apuestan 0 (estrategia simple para tests)
      const bettingOrder = snap.bettingOrder;
      for (let i = 0; i < bettingOrder.length - 1; i++) {
        engine.placeBet(bettingOrder[i], 0);
      }
      // Último apostador
      const validBets = engine.getValidBetsForCurrentBettor();
      engine.placeBet(bettingOrder[bettingOrder.length - 1], validBets[0]);

      // Jugar todas las manos de la ronda
      for (let trick = 0; trick < round; trick++) {
        const s = engine.getSnapshot();
        for (const pid of s.playOrder) {
          if (s.playerData.find(p => p.playerId === pid)!.hand.length > 0) {
            engine.playCard(pid, 0);
          }
        }
      }

      const { results } = engine.endRound();
      expect(results.roundNumber).toBe(round);

      if (round < 10) {
        engine.nextRound();
      }
    }

    expect(engine.getState()).toBe('GAME_END');
    const winner = engine.getWinner();
    expect(winner.winnerId).toBeDefined();
    expect(winner.totalScore).toBeGreaterThan(0);
  });
});
