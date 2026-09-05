import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function initSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join match room
    socket.on('subscribe_match', ({ matchId }: { matchId: string }) => {
      socket.join(`match_${matchId}`);
      console.log(`[Socket] Client ${socket.id} joined room match_${matchId}`);
    });

    // Leave match room
    socket.on('unsubscribe_match', ({ matchId }: { matchId: string }) => {
      socket.leave(`match_${matchId}`);
      console.log(`[Socket] Client ${socket.id} left room match_${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
}

export function broadcastScoreUpdate(matchId: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(`match_${matchId}`).emit('score_update', payload);
    // Also emit to all clients on home feed
    ioInstance.emit('score_update', payload);
  }
}

export function broadcastWicketAlert(matchId: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(`match_${matchId}`).emit('wicket_alert', payload);
  }
}

export function broadcastMatchStatus(matchId: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(`match_${matchId}`).emit('match_status', payload);
    ioInstance.emit('match_status', payload);
  }
}
