import { Card } from './types';
/** Crea un mazo estándar de 52 cartas */
export declare function createDeck(): Card[];
/**
 * Mezcla in-place usando Fisher-Yates.
 * Acepta un generador de números aleatorios para ser 100% testeable.
 */
export declare function shuffle(deck: Card[], rng?: () => number): Card[];
/**
 * Crea y mezcla el mazo correcto según cantidad de jugadores.
 * 4–5 jugadores → 1 mazo (52 cartas)
 * 6 jugadores   → 2 mazos (104 cartas)
 */
export declare function buildGameDeck(playerCount: number, rng?: () => number): Card[];
/**
 * Reparte `cardsPerPlayer` cartas a cada jugador.
 * Devuelve un mapa playerId → mano.
 */
export declare function dealCards(deck: Card[], playerIds: string[], cardsPerPlayer: number): Map<string, Card[]>;
