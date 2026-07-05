import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './events';
declare const app: import("express-serve-static-core").Express;
declare const io: Server<ClientToServerEvents, ServerToClientEvents, import("socket.io").DefaultEventsMap, any>;
export { io, app };
