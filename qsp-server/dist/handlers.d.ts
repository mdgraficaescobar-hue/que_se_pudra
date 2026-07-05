import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './events';
type QSPSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type QSPServer = Server<ClientToServerEvents, ServerToClientEvents>;
export declare function registerHandlers(io: QSPServer, socket: QSPSocket): void;
export {};
