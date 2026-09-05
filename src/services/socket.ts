import { io, Socket } from 'socket.io-client';
import { CommentaryItem, Match } from '../types/cricket';

export type SocketScoreUpdateHandler = (data: { match: Match; commentaryItem?: CommentaryItem }) => void;
export type SocketMatchStatusHandler = (data: { matchId: string; status: string; result?: string }) => void;
export type SocketWicketHandler = (data: { matchId: string; batterName: string; bowlerName: string; score: string }) => void;

class CricketSocketService {
  private socket: Socket | null = null;
  private scoreUpdateListeners: Set<SocketScoreUpdateHandler> = new Set();
  private matchStatusListeners: Set<SocketMatchStatusHandler> = new Set();
  private wicketListeners: Set<SocketWicketHandler> = new Set();
  private isSimulating: boolean = false;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  connect(url?: string) {
    const socketUrl = url || process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    try {
      this.socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        // Connected to remote live socket
      });

      this.socket.on('score_update', (data: { match: Match; commentaryItem?: CommentaryItem }) => {
        this.notifyScoreUpdate(data);
      });

      this.socket.on('match_status', (data: { matchId: string; status: string; result?: string }) => {
        this.notifyMatchStatus(data);
      });

      this.socket.on('wicket_alert', (data: { matchId: string; batterName: string; bowlerName: string; score: string }) => {
        this.notifyWicket(data);
      });

      this.socket.on('connect_error', () => {
        // Fallback to socket event bus
      });
    } catch {
      // Socket initialization fallback
    }
  }

  subscribeToMatch(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_match', { matchId });
    }
  }

  unsubscribeFromMatch(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_match', { matchId });
    }
  }

  onScoreUpdate(callback: SocketScoreUpdateHandler): () => void {
    this.scoreUpdateListeners.add(callback);
    return () => {
      this.scoreUpdateListeners.delete(callback);
    };
  }

  onMatchStatus(callback: SocketMatchStatusHandler): () => void {
    this.matchStatusListeners.add(callback);
    return () => {
      this.matchStatusListeners.delete(callback);
    };
  }

  onWicketAlert(callback: SocketWicketHandler): () => void {
    this.wicketListeners.add(callback);
    return () => {
      this.wicketListeners.delete(callback);
    };
  }

  // Internal dispatchers
  notifyScoreUpdate(data: { match: Match; commentaryItem?: CommentaryItem }) {
    this.scoreUpdateListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in score update listener:', err);
      }
    });
  }

  notifyMatchStatus(data: { matchId: string; status: string; result?: string }) {
    this.matchStatusListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in match status listener:', err);
      }
    });
  }

  notifyWicket(data: { matchId: string; batterName: string; bowlerName: string; score: string }) {
    this.wicketListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in wicket alert listener:', err);
      }
    });
  }

  disconnect() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const cricketSocket = new CricketSocketService();
export default cricketSocket;
