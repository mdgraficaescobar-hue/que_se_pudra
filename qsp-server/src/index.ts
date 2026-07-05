// ─────────────────────────────────────────────
//  QSP SERVER — ENTRY POINT
// ─────────────────────────────────────────────

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerHandlers } from './handlers';
import { ClientToServerEvents, ServerToClientEvents } from './events';

const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:8080';

// ── EXPRESS + HTTP ────────────────────────────

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'QSP', version: '1.0.0' });
});

const httpServer = createServer(app);

// ── SOCKET.IO ─────────────────────────────────

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  allowEIO3: true, transports: ["polling"],
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
  // Tiempo de espera para reconexión antes de dar al jugador como desconectado
  pingTimeout: 20000,
  pingInterval: 10000,
});

io.on('connection', (socket) => {
  console.log(`[QSP] Conectado: ${socket.id}`);
  registerHandlers(io, socket);

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

export { io, app };
