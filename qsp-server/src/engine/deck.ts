// ─────────────────────────────────────────────
//  QSP ENGINE — MAZO
// ─────────────────────────────────────────────

import { Card, Rank, Suit } from './types';

const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS: Suit[] = ['S','H','C','D'];

const RANK_VALUE: Record<Rank, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,
  '9':9,'10':10,'J':11,'Q':12,'K':13,'A':14,
};

/** Crea un mazo estándar de 52 cartas */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: RANK_VALUE[rank] });
    }
  }
  return deck;
}

/**
 * Mezcla in-place usando Fisher-Yates.
 * Acepta un generador de números aleatorios para ser 100% testeable.
 */
export function shuffle(deck: Card[], rng: () => number = Math.random): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Crea y mezcla el mazo correcto según cantidad de jugadores.
 * 4–5 jugadores → 1 mazo (52 cartas)
 * 6 jugadores   → 2 mazos (104 cartas)
 */
export function buildGameDeck(playerCount: number, rng?: () => number): Card[] {
  if (playerCount === 6) {
    return shuffle([...createDeck(), ...createDeck()], rng);
  }
  return shuffle(createDeck(), rng);
}

/**
 * Reparte `cardsPerPlayer` cartas a cada jugador.
 * Devuelve un mapa playerId → mano.
 */
export function dealCards(
  deck: Card[],
  playerIds: string[],
  cardsPerPlayer: number,
): Map<string, Card[]> {
  const hands = new Map<string, Card[]>();
  playerIds.forEach(id => hands.set(id, []));

  const totalNeeded = playerIds.length * cardsPerPlayer;
  if (deck.length < totalNeeded) {
    throw new Error(
      `Mazo insuficiente: se necesitan ${totalNeeded} cartas, hay ${deck.length}`
    );
  }

  // Reparte de a una carta por jugador (como en la vida real)
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (const id of playerIds) {
      const card = deck.shift()!;
      hands.get(id)!.push(card);
    }
  }

  return hands;
}
