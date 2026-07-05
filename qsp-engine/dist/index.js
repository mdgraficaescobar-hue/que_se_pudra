"use strict";
// ─────────────────────────────────────────────
//  QSP ENGINE — ENTRY POINT
// ─────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.dealCards = exports.shuffle = exports.createDeck = exports.buildGameDeck = exports.applyTrickResult = exports.circularDistance = exports.resolveTrick = exports.validBetsForLastBettor = exports.isLastBettor = exports.validateBet = exports.determineWinner = exports.scoreRound = exports.calculateRoundScore = exports.TOTAL_ROUNDS = exports.QSPEngine = void 0;
var engine_1 = require("./engine");
Object.defineProperty(exports, "QSPEngine", { enumerable: true, get: function () { return engine_1.QSPEngine; } });
Object.defineProperty(exports, "TOTAL_ROUNDS", { enumerable: true, get: function () { return engine_1.TOTAL_ROUNDS; } });
var scoring_1 = require("./scoring");
Object.defineProperty(exports, "calculateRoundScore", { enumerable: true, get: function () { return scoring_1.calculateRoundScore; } });
Object.defineProperty(exports, "scoreRound", { enumerable: true, get: function () { return scoring_1.scoreRound; } });
Object.defineProperty(exports, "determineWinner", { enumerable: true, get: function () { return scoring_1.determineWinner; } });
var betting_1 = require("./betting");
Object.defineProperty(exports, "validateBet", { enumerable: true, get: function () { return betting_1.validateBet; } });
Object.defineProperty(exports, "isLastBettor", { enumerable: true, get: function () { return betting_1.isLastBettor; } });
Object.defineProperty(exports, "validBetsForLastBettor", { enumerable: true, get: function () { return betting_1.validBetsForLastBettor; } });
var trick_1 = require("./trick");
Object.defineProperty(exports, "resolveTrick", { enumerable: true, get: function () { return trick_1.resolveTrick; } });
Object.defineProperty(exports, "circularDistance", { enumerable: true, get: function () { return trick_1.circularDistance; } });
Object.defineProperty(exports, "applyTrickResult", { enumerable: true, get: function () { return trick_1.applyTrickResult; } });
var deck_1 = require("./deck");
Object.defineProperty(exports, "buildGameDeck", { enumerable: true, get: function () { return deck_1.buildGameDeck; } });
Object.defineProperty(exports, "createDeck", { enumerable: true, get: function () { return deck_1.createDeck; } });
Object.defineProperty(exports, "shuffle", { enumerable: true, get: function () { return deck_1.shuffle; } });
Object.defineProperty(exports, "dealCards", { enumerable: true, get: function () { return deck_1.dealCards; } });
//# sourceMappingURL=index.js.map