"use strict";
// ─────────────────────────────────────────────
//  QSP SERVER — ENTRY POINT
// ─────────────────────────────────────────────
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const handlers_1 = require("./handlers");
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:8080';
// ── EXPRESS + HTTP ────────────────────────────
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', game: 'QSP', version: '1.0.0' });
});
const httpServer = (0, http_1.createServer)(app);
// ── SOCKET.IO ─────────────────────────────────
const io = new socket_io_1.Server(httpServer, {
    allowEIO3: true, transports: ["polling"],
    cors: {
        origin: "*",
        methods: ['GET', 'POST'],
    },
    // Tiempo de espera para reconexión antes de dar al jugador como desconectado
    pingTimeout: 20000,
    pingInterval: 10000,
});
exports.io = io;
io.on('connection', (socket) => {
    console.log(`[QSP] Conectado: ${socket.id}`);
    (0, handlers_1.registerHandlers)(io, socket);
    socket.on('disconnect', (reason) => {
        console.log(`[QSP] Desconectado: ${socket.id} — ${reason}`);
    });
});
// ── INICIO ────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║         QUÉ SE PUDRA — SERVER        ║
║  Puerto : ${PORT}                       ║
║  Cliente: ${CLIENT_URL}  ║
╚══════════════════════════════════════╝
  `);
});
//# sourceMappingURL=index.js.map